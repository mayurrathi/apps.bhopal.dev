import React, { useState, useEffect, useRef } from 'react';
import {
    Volume2, VolumeX, RotateCcw, Play, Pause, ChevronRight,
    History, Grid3X3, Trophy, Languages, MessageSquareQuote,
    Undo2, Timer, ChevronDown, Maximize, Minimize, Cloud, Gift,
    Share2, MessageCircle, Send, Twitter, Instagram, Link,
    Ticket, Plus, Minus, Trash2, Settings, X
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { showInterstitial, showRewardedAd } from './admob.js';
import ActivePrizes from './ActivePrizes.jsx';
import PrizesAdmin from './PrizesAdmin.jsx';
import TicketCard from './TicketCard.jsx';
import { generateTicket } from './ticketGenerator.js';
import { savePrizes } from './prizesData.js';
import { syncGameToRoom, startGame } from './roomService.js';
import { LANGUAGES, getPhrase } from './tambolaPhrases.js';
import { trackGameCompletion, markPromptShown, markPromptDismissed, requestNativeReview } from './ratingPrompt.js';
import { logEvent, EVENT } from './gameLog.js';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : { apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'tambola-app';

// --- Constants & Data ---
const SPEED_OPTIONS = [1, 3, 5, 10, 15, 30, 60];

// --- Main Component ---
export default function TambolaApp({ prizes = [], onPrizesChange = () => { }, activeRoomCode = null }) {
    // Game State
    const [calledNumbers, setCalledNumbers] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [phrasesEnabled, setPhrasesEnabled] = useState(true);
    const [language, setLanguage] = useState('en');
    const [showSettings, setShowSettings] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isFullScreenSupported, setIsFullScreenSupported] = useState(true);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hostTab, setHostTab] = useState('board'); // 'board' or 'prizes'

    // Dice Animation State
    const [isRolling, setIsRolling] = useState(false);
    const [rollerNumber, setRollerNumber] = useState(null);

    // Host Tickets State
    const [hostTickets, setHostTickets] = useState([]);
    const [ticketAmount, setTicketAmount] = useState(1);

    // Auth & Cloud State
    const [user, setUser] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Timer State
    const [autoSpeed, setAutoSpeed] = useState(5);
    const [countdown, setCountdown] = useState(5);

    // T50 Mode
    const [t50Mode, setT50Mode] = useState(false);
    const [t50Unlocked, setT50Unlocked] = useState(false);
    const MAX_NUMBERS = t50Mode ? 50 : 90;

    // Refs
    const speechRef = useRef(window.speechSynthesis);
    const callNextNumberRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.warn('Auth failed (demo mode):', e.message);
            }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    // Data Sync
    useEffect(() => {
        if (!user) return;
        const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tambola_data', 'current_game');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setCalledNumbers(data.calledNumbers || []);
                setCurrentNumber(data.currentNumber || null);
                if (data.autoSpeed) setAutoSpeed(data.autoSpeed);
            }
        }, (e) => console.warn("Sync error:", e));
        return () => unsub();
    }, [user]);

    // Persist calledNumbers to localStorage so TicketsTab can read them
    useEffect(() => {
        localStorage.setItem('tambola_called_numbers', JSON.stringify(calledNumbers));
    }, [calledNumbers]);

    const saveGame = async (called, current) => {
        if (!user) return;
        setIsSyncing(true);
        try {
            const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tambola_data', 'current_game');
            await setDoc(ref, { calledNumbers: called, currentNumber: current, autoSpeed, lastUpdated: new Date().toISOString() }, { merge: true });
            if (activeRoomCode) {
                await syncGameToRoom(activeRoomCode, called, current, autoSpeed);
                if (called.length === 1) await startGame(activeRoomCode).catch(() => { });
            }
        } catch (e) { console.warn('Save failed:', e); }
        finally { setIsSyncing(false); }
    };

    // Full Screen
    useEffect(() => {
        setIsFullScreenSupported(!!document.fullscreenEnabled);
        const handler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // --- Logic ---
    const toggleFullScreen = () => {
        if (!isFullScreenSupported) return;
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => setIsFullScreenSupported(false));
        else document.exitFullscreen?.();
    };

    const allNumbers = Array.from({ length: MAX_NUMBERS }, (_, i) => i + 1);

    const speakNumber = (num) => {
        if (!soundEnabled) return;

        // Play Azure Edge TTS pre-rendered Neural Audio MP3s
        const folder = phrasesEnabled ? 'phrases' : 'numbers';
        const audioPath = `${import.meta.env.BASE_URL}audio/${language}/${folder}/${num}.mp3`;
        const audio = new Audio(audioPath);

        audio.play().catch(() => {
            // Skill 08: India-First — graceful fallback to Web Speech API
            // Covers offline mode and missing audio for regional languages
            if (!speechRef.current) return;
            const LANG_MAP = { hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', gu: 'gu-IN', pa: 'pa-IN' };
            const langTag = LANG_MAP[language] || 'en-IN';
            speechRef.current.cancel();
            const u = new SpeechSynthesisUtterance(String(num));
            u.lang = langTag;
            u.rate = 0.85;
            speechRef.current.speak(u);
        });
    };

    const speakAmbient = (text) => {
        if (!soundEnabled || !speechRef.current) return;
        speechRef.current.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        speechRef.current.speak(u);
    };

    const callNextNumber = () => {
        if (calledNumbers.length >= MAX_NUMBERS || isRolling) {
            if (calledNumbers.length >= MAX_NUMBERS) {
                setIsAutoPlay(false);
                speakAmbient(t50Mode ? "T50 complete! Great game!" : "Game over! All ninety numbers called!");
            }
            return;
        }

        // Generate the final result first
        let next;
        do { next = Math.floor(Math.random() * MAX_NUMBERS) + 1; }
        while (calledNumbers.includes(next));

        // Start the rolling animation
        setIsRolling(true);
        let rollIterations = 0;
        const maxIterations = 15; // Number of shuffles before landing

        const rollerInterval = setInterval(() => {
            rollIterations++;
            let temp;
            do { temp = Math.floor(Math.random() * MAX_NUMBERS) + 1; }
            while (calledNumbers.includes(temp) && Object.keys(calledNumbers).length < MAX_NUMBERS - 1);
            setRollerNumber(temp);

            if (rollIterations >= maxIterations) {
                clearInterval(rollerInterval);
                finishCall(next);
            }
        }, 50); // 50ms per tick = 750ms total animation
    };

    const finishCall = (finalNumber) => {
        setIsRolling(false);
        setRollerNumber(null);
        const newCalled = [...calledNumbers, finalNumber];
        setCalledNumbers(newCalled);
        setCurrentNumber(finalNumber);
        saveGame(newCalled, finalNumber);
        speakNumber(finalNumber);
        logEvent(EVENT.NUMBER_CALLED, { number: finalNumber, total: newCalled.length });
    };

    useEffect(() => { callNextNumberRef.current = callNextNumber; });

    const undoLastCall = () => {
        if (calledNumbers.length === 0) return;
        if (isAutoPlay) setIsAutoPlay(false);
        speechRef.current.cancel();
        const newCalled = calledNumbers.slice(0, -1);
        const newCurrent = newCalled.at(-1) ?? null;
        setCalledNumbers(newCalled);
        setCurrentNumber(newCurrent);
        saveGame(newCalled, newCurrent);
    };

    // Auto-Play Ticker
    useEffect(() => {
        let interval = null;
        if (isAutoPlay) {
            if (countdown <= 0) setCountdown(autoSpeed);
            interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) { callNextNumberRef.current?.(); return autoSpeed; }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setCountdown(autoSpeed);
        }
        return () => clearInterval(interval);
    }, [isAutoPlay, autoSpeed]);

    const triggerReset = () => {
        setShowSettings(false);
        setShowResetConfirm(true);
    };

    const confirmReset = async () => {
        setIsAutoPlay(false);
        speechRef.current?.cancel();
        setShowResetConfirm(false);
        setCountdown(autoSpeed);
        await showInterstitial();
        setCalledNumbers([]);
        setCurrentNumber(null);
        saveGame([], null);
        // Reset active prizes for the new round but KEEP them enabled
        if (prizes && onPrizesChange) {
            const wipedPrizes = prizes.map(p => ({ ...p, claimed: false, winnerName: '' }));
            onPrizesChange(wipedPrizes);
            savePrizes(wipedPrizes);
        }

        const shouldPrompt = trackGameCompletion();
        if (shouldPrompt) {
            setShowRatingPrompt(true);
            markPromptShown();
        }
        logEvent(EVENT.GAME_RESET, { numbersCalled: calledNumbers.length });
    };

    const unlockT50 = async () => {
        if (t50Unlocked) {
            setT50Mode(!t50Mode);
            return;
        }
        speakAmbient("Watch a short ad to unlock T50 fast mode!");
        const rewarded = await showRewardedAd();
        if (rewarded) {
            setT50Unlocked(true);
            setT50Mode(true);
            speakAmbient("T50 mode unlocked! Only 50 numbers. Good luck!");
        } else {
            speakAmbient("Ad not available. Try again later.");
        }
    };

    const getCellClass = (num) => {
        const isCurrent = currentNumber === num;
        const isCalled = calledNumbers.includes(num);
        if (isCurrent) return "bg-pink-500 text-white shadow-lg scale-110 ring-4 ring-pink-300 z-10 font-black border-transparent text-xl sm:text-2xl md:text-3xl";
        if (isCalled) return "bg-indigo-600 text-white font-bold border-transparent opacity-90 text-lg sm:text-xl md:text-2xl lg:text-3xl";
        return "bg-white text-slate-400 border-slate-200 hover:border-indigo-200 focus:border-indigo-400 transition-colors duration-200 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold";
    };

    const lastFive = calledNumbers.slice(-6, -1).reverse();

    return (
        <div
            className="flex-1 flex flex-col w-full overflow-hidden text-slate-800 font-sans lg:items-start selection:bg-pink-200 selection:text-pink-900"
        >    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden max-w-[100vw]">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob animation-delay-2000" />
            </div>

            {/* ── Top App Header ── */}
            <header className="relative z-20 w-full flex justify-between items-center p-3 sm:p-4 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-1.5 rounded-lg shadow-sm">
                        <Grid3X3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 leading-tight">
                            Tambola {t50Mode && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded-full ml-1">T50</span>}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Language Dropdown for EN/HI strictly */}
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none bg-slate-100 text-slate-700 font-semibold text-sm pl-2 pr-6 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                            <option value="en">🇬🇧 English</option>
                            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    <button onClick={() => setPhrasesEnabled(!phrasesEnabled)} className={`p-1.5 rounded-lg transition-colors ${phrasesEnabled ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
                        <MessageSquareQuote size={18} />
                    </button>

                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>

                    <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 ml-1" title="Settings">
                        <Settings size={18} />
                    </button>

                    <button onClick={() => setShowShareMenu(true)} className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors" title="Share App">
                        <Share2 size={18} />
                    </button>

                    {isFullScreenSupported && (
                        <button onClick={toggleFullScreen} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hidden sm:block">
                            {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main View Area ── */}
            <main className="relative z-10 w-full max-w-6xl mx-auto p-1 sm:p-2 lg:p-4 flex flex-col lg:flex-row gap-2 sm:gap-4 flex-1 min-h-0 lg:overflow-hidden pb-20 lg:pb-0">

                {/* ── Game Board Side ── */}
                <div className="flex-1 w-full flex flex-col bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-2 sm:p-3 lg:p-4 min-h-0 lg:h-full lg:min-h-[500px]">

                    {/* Local Host Tabs */}
                    <div className="flex bg-slate-100/50 p-1 rounded-xl mb-4 shrink-0">
                        <button onClick={() => setHostTab('board')} className={`flex-1 py-2 font-bold text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-2 ${hostTab === 'board' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                            <Grid3X3 size={18} /> Board
                        </button>
                        <button onClick={() => setHostTab('prizes')} className={`flex-1 py-2 font-bold text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-2 ${hostTab === 'prizes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                            <Trophy size={18} /> Active Prizes <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full">{prizes.filter(p => p.enabled).length}</span>
                        </button>
                    </div>

                    {hostTab === 'board' ? (
                        <>
                            {/* Status Bar */}
                            <div className="flex items-center justify-between mb-4 bg-indigo-50/50 rounded-xl p-3 sm:p-4 border border-indigo-100 shrink-0">
                                <div className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-widest pl-1">Call {calledNumbers.length}/{MAX_NUMBERS}</div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-4xl sm:text-5xl font-black leading-none ${isRolling ? 'text-indigo-400 blur-[2px] scale-110 transition-all duration-75' : 'text-indigo-600'}`}>
                                        {isRolling ? rollerNumber : (currentNumber || "--")}
                                    </span>
                                    {(!isRolling && currentNumber && phrasesEnabled && getPhrase(language, currentNumber)) && (
                                        <div className="text-sm sm:text-base font-bold text-indigo-800 max-w-[140px] sm:max-w-xs truncate px-3 py-1.5 bg-white rounded-lg shadow-sm animate-fade-in-up">
                                            {getPhrase(language, currentNumber)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Board Grid - Supersized for laptop/desktop capture */}
                            <div className="flex-1 flex flex-col min-h-0 w-full h-full pb-1">
                                <div
                                    className="grid grid-cols-10 gap-1 sm:gap-2 h-full w-full"
                                    style={{ gridTemplateRows: `repeat(${Math.ceil(MAX_NUMBERS / 10)}, minmax(0, 1fr))` }}
                                >
                                    {allNumbers.map((num) => (
                                        <div key={num} className={`w-full h-full rounded sm:rounded-xl flex items-center justify-center transition-all border ${getCellClass(num)} ${isRolling && num === rollerNumber ? 'bg-indigo-100 border-indigo-300 scale-105 opacity-70' : ''}`}>
                                            {num}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <ActivePrizes prizes={prizes} onPrizesChange={onPrizesChange} />
                        </div>
                    )}
                </div>

                {/* ── Right Side Panel ── */}
                <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-3 lg:gap-4 lg:h-full">
                    {/* Controls Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-3 sm:p-4 shadow-lg border border-white flex flex-col gap-2 relative z-20 shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setIsAutoPlay(!isAutoPlay)} disabled={calledNumbers.length >= MAX_NUMBERS || isRolling}
                                className={`py-3 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 border shadow-sm transition-all focus:scale-95 ${isAutoPlay ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 disabled:opacity-50'}`}>
                                {isAutoPlay ? (<><Pause size={18} /><span className="w-4 text-center">{countdown}</span></>) : (<><Play size={18} /> Auto</>)}
                            </button>

                            <button onClick={callNextNumber} disabled={isAutoPlay || calledNumbers.length >= MAX_NUMBERS || isRolling}
                                className="py-3 sm:py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center gap-1.5 sm:gap-2 hover:from-indigo-700 hover:to-purple-700 shadow-md focus:scale-95 disabled:opacity-50 transition-all">
                                Next <ChevronRight size={18} />
                            </button>

                            <button onClick={triggerReset} disabled={isRolling}
                                className="py-3 sm:py-4 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 shadow-sm border border-rose-100 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50">
                                <RotateCcw size={18} /> <span className="hidden sm:inline">Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Tickets Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-lg border border-white flex flex-col min-h-[300px] lg:flex-1 overflow-hidden mt-1 lg:mt-0">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Ticket className="text-indigo-500 w-5 h-5" /> Host Tickets
                            </h3>
                            {hostTickets.length > 0 && (
                                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                    <button onClick={() => {
                                        const newTickets = [];
                                        for (let i = 0; i < ticketAmount; i++) newTickets.push(generateTicket());
                                        setHostTickets([...hostTickets, ...newTickets]);
                                    }} className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"><Plus size={16} /></button>
                                    <span className="text-xs font-bold text-slate-600 px-2">{hostTickets.length}</span>
                                    <button onClick={() => setHostTickets([])} className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-colors"><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>

                        {hostTickets.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                                <Ticket size={48} className="text-slate-200 mb-4" />
                                <p className="text-slate-500 font-medium text-sm mb-6">Are you also playing? Generate tickets here to play along.</p>
                                <button onClick={() => { setTicketAmount(1); setHostTickets([generateTicket()]); }} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 shadow-sm border border-indigo-100">
                                    <Ticket size={18} /> Show Your Tickets
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                                {hostTickets.map((ticket, idx) => (
                                    <TicketCard key={idx} ticket={ticket} ticketIndex={idx} marked={calledNumbers.reduce((acc, n) => ({ ...acc, [n]: true }), {})} toggleNumber={() => { }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Settings Modal ── */}
            {showSettings && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettings(false)}>
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Settings className="text-indigo-500" /> Settings & Features
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-6 w-full">

                            {/* History */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><History size={12} /> Recent History</h4>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {lastFive.length === 0 ? <span className="text-sm text-slate-400 italic">No numbers called yet</span> :
                                        lastFive.map((num, i) => <div key={i} className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-700">{num}</div>)
                                    }
                                </div>
                            </div>

                            {/* Game Controls */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Auto-Play Speed</label>
                                    <div className="relative">
                                        <select value={autoSpeed} onChange={(e) => setAutoSpeed(+e.target.value)} disabled={isAutoPlay}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold p-3.5 rounded-xl appearance-none outline-none focus:border-indigo-400 focus:bg-white transition-colors">
                                            {SPEED_OPTIONS.map(s => <option key={s} value={s}>{s} seconds per number</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <button onClick={undoLastCall} disabled={calledNumbers.length === 0}
                                    className="p-3 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50 transition-colors">
                                    <Undo2 size={16} /> Undo Last
                                </button>

                                <button onClick={unlockT50}
                                    className={`p-3 border font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${t50Unlocked ? (t50Mode ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100') : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                                    <Gift size={16} /> {t50Unlocked ? (t50Mode ? 'T50: ON' : 'T50: OFF') : 'Unlock T50'}
                                </button>

                                <button onClick={triggerReset}
                                    className="col-span-2 p-3 mt-1 bg-rose-50 text-rose-600 border border-rose-100 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                                    <RotateCcw size={16} /> Reset Game
                                </button>
                            </div>

                            {/* Prize Settings Full Admin Menu inside Settings Tab */}
                            <div className="pt-2">
                                <PrizesAdmin prizes={prizes} onPrizesChange={onPrizesChange} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Share Modal ── */}
            {showShareMenu && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowShareMenu(false)}>
                    <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1"><Share2 size={20} className="text-indigo-600" /> Share Tambola</h3>
                                <p className="text-xs text-slate-500 font-medium">Invite your friends to play online!</p>
                            </div>
                            <button onClick={() => setShowShareMenu(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"><X size={16} /></button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Come play free multiplayer Tambola with me! 🎲 ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366]/10 text-[#25D366] font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors"><MessageCircle size={20} /> WhatsApp</a>
                            <button onClick={async () => { await navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); setShowShareMenu(false); }} className="w-full bg-slate-100 text-slate-700 font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Link size={20} /> Copy Link</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reset Modal ── */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowResetConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">New Game?</h3>
                        <p className="text-slate-600 mb-6 flex-1">Reset all called numbers and prepare the board for a new game?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 font-medium text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={confirmReset} className="px-5 py-2 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Yes, Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rating Modal ── */}
            {showRatingPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRatingPrompt(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="text-6xl mb-4 animate-bounce">⭐</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Enjoying Tambola?</h3>
                        <p className="text-slate-600 mb-8 text-sm">You've played 5 games! A rating helps us tremendously.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={async () => { setShowRatingPrompt(false); const n = await requestNativeReview(); if (!n) window.open('https://play.google.com/store/apps/details?id=dev.bhopal.apps.tambola', '_blank'); }} className="w-full py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">Rate Now</button>
                            <button onClick={() => { markPromptDismissed(); setShowRatingPrompt(false); }} className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Maybe Later</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
