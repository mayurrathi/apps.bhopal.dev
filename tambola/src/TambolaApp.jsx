import React, { useState, useEffect, useRef } from 'react';
import {
    Volume2, VolumeX, RotateCcw, Play, Pause, ChevronRight,
    History, Grid3X3, Trophy, Languages, MessageSquareQuote,
    Undo2, Timer, ChevronDown, Maximize, Minimize, Cloud, Gift,
    Share2, MessageCircle, Send, Twitter, Instagram, Link,
    Ticket, Plus, Minus, Trash2
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { showInterstitial, showRewardedAd } from './admob.js';
import ActivePrizes from './ActivePrizes.jsx';
import TicketCard from './TicketCard.jsx';
import { generateTicket } from './ticketGenerator.js';
import { syncGameToRoom, startGame } from './roomService.js';
import { LANGUAGES, getBestVoice, getPhrase } from './tambolaPhrases.js';
import { trackGameCompletion, markPromptShown, markPromptDismissed, requestNativeReview } from './ratingPrompt.js';

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

// --- Helpers ---
const digitToWord = (d) => ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][d];

const numberToEnglish = (n) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
};

const getTambolaCallText = (num) => {
    if (num < 10) return `Single number ${numberToEnglish(num)}`;
    return `${digitToWord(Math.floor(num / 10))} ${digitToWord(num % 10)}. ${numberToEnglish(num)}`;
};

// --- Main Component ---
export default function TambolaApp({ prizes = [], onPrizesChange = () => { }, activeRoomCode = null }) {
    // Game State
    const [calledNumbers, setCalledNumbers] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [phrasesEnabled, setPhrasesEnabled] = useState(true);
    const [language, setLanguage] = useState('en');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isFullScreenSupported, setIsFullScreenSupported] = useState(true);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Host Tickets State
    const [hostTickets, setHostTickets] = useState([]);
    const [ticketAmount, setTicketAmount] = useState(1);

    // Auth & Cloud State
    const [user, setUser] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Timer State
    const [autoSpeed, setAutoSpeed] = useState(5);
    const [countdown, setCountdown] = useState(5);

    // T50 Mode — unlocked via Rewarded Ad
    const [t50Mode, setT50Mode] = useState(false);
    const [t50Unlocked, setT50Unlocked] = useState(false);
    const MAX_NUMBERS = t50Mode ? 50 : 90;

    // Refs
    const speechRef = useRef(window.speechSynthesis);
    const callNextNumberRef = useRef(null);

    // --- Effects ---

    // Auth Setup
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

    // Save to Firebase (personal game + optional multiplayer room sync)
    const saveGame = async (called, current) => {
        if (!user) return;
        setIsSyncing(true);
        try {
            // Personal game save
            const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tambola_data', 'current_game');
            await setDoc(ref, { calledNumbers: called, currentNumber: current, autoSpeed, lastUpdated: new Date().toISOString() }, { merge: true });
            // Multiplayer room sync — broadcasts to all players in the room
            if (activeRoomCode) {
                await syncGameToRoom(activeRoomCode, called, current, autoSpeed);
                // Start the game automatically when first number is called
                if (called.length === 1) await startGame(activeRoomCode).catch(() => { });
            }
        } catch (e) { console.warn('Save failed:', e); }
        finally { setIsSyncing(false); }
    };

    // Voice Loading
    useEffect(() => {
        const update = () => setAvailableVoices(window.speechSynthesis.getVoices());
        update();
        if (window.speechSynthesis.onvoiceschanged !== undefined)
            window.speechSynthesis.onvoiceschanged = update;
    }, []);

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

    const getStrictVoice = (code) => {
        const v = availableVoices;
        return v.find(x => x.lang === code) ||
            v.find(x => code === 'hi-IN' ? x.lang.includes('hi') : (x.lang.includes('en') && x.lang.includes('IN'))) ||
            null;
    };

    const speakNumber = (num) => {
        if (!soundEnabled) return;

        // Native High-Quality Audio Override (Zero-Cost Neural Voice via edge-tts)
        // Note: The pre-rendered MP3s contain the full phrases. If the user disables phrases, we must fallback to standard TTS.
        if (language === 'hi' && phrasesEnabled) {
            const audio = new Audio(`/audio/hi/${num}.mp3`);
            audio.play().catch(e => {
                console.warn('Native audio failed, falling back to TTS', e);
                speakNumberTTS(num);
            });
            return;
        }

        speakNumberTTS(num);
    };

    const speakNumberTTS = (num) => {
        if (!speechRef.current) return;
        speechRef.current.cancel();
        const langConfig = LANGUAGES[language];
        const phrase = getPhrase(language, num);
        let text;
        if (language === 'en') {
            const callText = getTambolaCallText(num);
            text = phrasesEnabled && phrase ? `${num}. ${phrase}. ${num}` : `Number ${num}`;
        } else {
            const callText = getTambolaCallText(num);
            text = phrasesEnabled && phrase ? `${callText}... ${phrase}` : callText;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getBestVoice(language);
        if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
        else if (langConfig) { utterance.lang = langConfig.code; }
        utterance.rate = 0.85;
        speechRef.current.speak(utterance);
    };

    const speak = (text) => {
        if (!soundEnabled || !speechRef.current) return;
        speechRef.current.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = getStrictVoice('en-IN') || getStrictVoice('en-GB');
        if (v) u.voice = v;
        speechRef.current.speak(u);
    };

    const callNextNumber = () => {
        if (calledNumbers.length >= MAX_NUMBERS) {
            setIsAutoPlay(false);
            speak(t50Mode ? "T50 complete! Great game!" : "Game over! All ninety numbers called!");
            return;
        }
        let next;
        do { next = Math.floor(Math.random() * MAX_NUMBERS) + 1; }
        while (calledNumbers.includes(next));

        const newCalled = [...calledNumbers, next];
        setCalledNumbers(newCalled);
        setCurrentNumber(next);
        saveGame(newCalled, next);
        if (soundEnabled) speakNumber(next);
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

    // ─── AdMob: Interstitial on Reset ────────────────────────────────────────────
    const triggerReset = () => setShowResetConfirm(true);

    const confirmReset = async () => {
        setIsAutoPlay(false);
        speechRef.current.cancel();
        setShowResetConfirm(false);
        setCountdown(autoSpeed);
        // Show interstitial at this natural breakpoint (between games)
        await showInterstitial();
        setCalledNumbers([]);
        setCurrentNumber(null);
        saveGame([], null);
        // Track game completion for rating prompt
        const shouldPrompt = trackGameCompletion();
        if (shouldPrompt) {
            setShowRatingPrompt(true);
            markPromptShown();
        }
    };

    // ─── AdMob: Rewarded Ad for T50 Mode ─────────────────────────────────────────
    const unlockT50 = async () => {
        if (t50Unlocked) {
            setT50Mode(!t50Mode);
            return;
        }
        speak("Watch a short ad to unlock T50 fast mode!");
        const rewarded = await showRewardedAd();
        if (rewarded) {
            setT50Unlocked(true);
            setT50Mode(true);
            speak("T50 mode unlocked! Only 50 numbers. Good luck!");
        } else {
            speak("Ad not available. Try again later.");
        }
    };

    // ─── Cell styling ────────────────────────────────────────────────────────────
    const getCellClass = (num) => {
        const isCurrent = currentNumber === num;
        const isCalled = calledNumbers.includes(num);
        if (isCurrent) return "bg-pink-500 text-white shadow-lg scale-110 ring-4 ring-pink-300 z-10 font-bold border-transparent";
        if (isCalled) return "bg-indigo-600 text-white font-medium border-transparent opacity-90";
        return "bg-white text-slate-400 border-slate-200 hover:border-indigo-200";
    };

    const lastFive = calledNumbers.slice(-6, -1).reverse();

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden"
            onClick={() => setShowLangMenu(false)}
        >
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">

                {/* ── Left Panel ── */}
                <div className="lg:w-1/3 flex flex-col gap-4 lg:sticky lg:top-8 h-fit">

                    {/* Header */}
                    <div className="relative z-20 flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200 hidden sm:block">
                                <Grid3X3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600">
                                    Tambola {t50Mode && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1 font-bold">T50</span>}
                                </h1>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs text-slate-500 font-medium hidden sm:block">Master Board</p>
                                    {user && (
                                        <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold border border-green-200">
                                            <Cloud size={10} /> {isSyncing ? 'Saving…' : 'Saved'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Language */}
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                                >
                                    <Languages size={18} />
                                    <span className="text-xs font-semibold hidden sm:inline">{LANGUAGES[language]?.flag} {LANGUAGES[language]?.label}</span>
                                    <span className="sm:hidden">{LANGUAGES[language]?.flag}</span>
                                </button>
                                {showLangMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up max-h-[60vh] overflow-y-auto">
                                        <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">20 Languages</div>
                                        {Object.entries(LANGUAGES).map(([k, v]) => (
                                            <button key={k} onClick={() => { setLanguage(k); setShowLangMenu(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 ${language === k ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}>
                                                <span>{v.flag}</span>
                                                <span className="flex-1">{v.label}</span>
                                                {getBestVoice(k) && <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Voice available" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setPhrasesEnabled(!phrasesEnabled)}
                                className={`p-2 rounded-xl transition-all ${phrasesEnabled ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-400'}`}
                                title="Toggle Phrases">
                                <MessageSquareQuote size={18} />
                            </button>

                            <button onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`p-2 rounded-xl transition-all ${soundEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                                title="Toggle Sound">
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>

                            {isFullScreenSupported && (
                                <button onClick={toggleFullScreen}
                                    className={`p-2 rounded-xl transition-all ${isFullScreen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Current Number Display */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-6 sm:p-8 text-center flex flex-col items-center justify-center relative overflow-hidden min-h-[190px] sm:min-h-[240px]">
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                        <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-2 block">Current Number</span>
                        <div className={`text-7xl sm:text-8xl lg:text-9xl font-black tabular-nums leading-none tracking-tight transition-all duration-300 ${currentNumber ? 'opacity-100 scale-100' : 'opacity-50 scale-95 blur-sm'}`}>
                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-pink-500">
                                {currentNumber || "--"}
                            </span>
                        </div>
                        {currentNumber && getPhrase(language, currentNumber) && (
                            <div className="mt-4 inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium animate-fade-in-up max-w-full truncate">
                                {getPhrase(language, currentNumber)}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Next */}
                        <button onClick={callNextNumber} disabled={isAutoPlay || calledNumbers.length >= MAX_NUMBERS}
                            id="btn-next-number"
                            className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed group">
                            <span>Next Number</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Undo */}
                        <button onClick={undoLastCall} disabled={calledNumbers.length === 0}
                            id="btn-undo"
                            className="p-3 rounded-xl bg-white text-slate-600 border border-slate-200 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <Undo2 size={18} /> Undo
                        </button>

                        {/* Speed + Auto */}
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center justify-center gap-1 bg-white rounded-xl border border-slate-200 px-2 py-1 relative overflow-hidden">
                                <Timer size={14} className="text-slate-400 shrink-0" />
                                <select value={autoSpeed} onChange={(e) => setAutoSpeed(+e.target.value)} disabled={isAutoPlay}
                                    className="w-full bg-transparent font-bold text-slate-700 text-sm outline-none appearance-none py-1 pl-1 pr-4 text-center cursor-pointer">
                                    {SPEED_OPTIONS.map(s => <option key={s} value={s}>{s}s</option>)}
                                </select>
                                <ChevronDown size={12} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>

                            <button onClick={() => setIsAutoPlay(!isAutoPlay)} disabled={calledNumbers.length >= MAX_NUMBERS}
                                id="btn-autoplay"
                                className={`flex-1 p-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all border text-sm ${isAutoPlay ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                                {isAutoPlay ? (<><span className="font-bold tabular-nums">{countdown}s</span><Pause size={16} /></>) : (<><Play size={16} />Auto</>)}
                            </button>
                        </div>

                        {/* T50 Mode (Rewarded Ad) */}
                        <button onClick={unlockT50}
                            id="btn-t50-mode"
                            className={`p-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border text-sm ${t50Unlocked ? (t50Mode ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200') : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}>
                            <Gift size={16} />
                            {t50Unlocked ? (t50Mode ? 'T50 ON' : 'T50 OFF') : 'T50 Mode'}
                        </button>

                        {/* Reset */}
                        <button onClick={triggerReset} id="btn-reset"
                            className="p-3 rounded-xl bg-white text-rose-600 border border-slate-200 font-semibold flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-200 transition-all">
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>

                    {/* Recent History */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/40">
                        <div className="flex items-center gap-2 mb-3 text-slate-500">
                            <History size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Previous 5</span>
                        </div>
                        <div className="flex justify-start items-center gap-2">
                            {lastFive.length === 0 ? (
                                <span className="text-slate-400 text-sm italic">No history yet</span>
                            ) : (
                                lastFive.map((num, idx) => (
                                    <div key={`${num}-${idx}`} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm animate-fade-in text-sm">
                                        {num}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-indigo-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} /></div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Called</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold">{calledNumbers.length}</span>
                            <span className="text-indigo-300 mb-1">/ {MAX_NUMBERS}</span>
                        </div>
                        <div className="w-full bg-indigo-800 h-1.5 mt-3 rounded-full overflow-hidden">
                            <div className="bg-pink-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${(calledNumbers.length / MAX_NUMBERS) * 100}%` }} />
                        </div>
                    </div>

                </div>

                {/* ── Right Panel: Board + Active Prizes ── */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Number Board */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-4 md:p-6 lg:p-8 flex flex-col min-h-[400px]">
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 md:gap-3 h-full content-start">
                            {allNumbers.map((num) => (
                                <div key={num} className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg md:text-xl transition-all duration-300 border ${getCellClass(num)}`}>
                                    {num}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Prizes Panel */}
                    <ActivePrizes prizes={prizes} onPrizesChange={onPrizesChange} />

                    {/* ── Host Tickets Panel ── */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-4 md:p-6 lg:p-8 flex flex-col mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Ticket className="text-indigo-500" /> Host Tickets
                            </h2>
                            {hostTickets.length > 0 && (
                                <button onClick={() => setHostTickets([])} className="text-xs flex items-center gap-1 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-full font-bold transition-colors border border-rose-100">
                                    <Trash2 size={14} /> Clear
                                </button>
                            )}
                        </div>

                        {hostTickets.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center">
                                <p className="text-slate-500 text-sm font-medium mb-4">Are you also playing? Generate your tickets below.</p>
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <button onClick={() => setTicketAmount(Math.max(1, ticketAmount - 1))} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"><Minus size={18} /></button>
                                    <span className="text-3xl font-black text-slate-800 w-8 tabular-nums select-none text-center">{ticketAmount}</span>
                                    <button onClick={() => setTicketAmount(Math.min(5, ticketAmount + 1))} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"><Plus size={18} /></button>
                                </div>
                                <button
                                    onClick={() => {
                                        const newTickets = [];
                                        for (let i = 0; i < ticketAmount; i++) newTickets.push(generateTicket());
                                        setHostTickets(newTickets);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all text-sm inline-flex items-center gap-2"
                                >
                                    <Ticket size={18} /> Generate {ticketAmount} {ticketAmount === 1 ? 'Ticket' : 'Tickets'}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {hostTickets.map((ticket, idx) => (
                                    <TicketCard
                                        key={idx}
                                        ticket={ticket}
                                        ticketIndex={idx}
                                        marked={calledNumbers.reduce((acc, n) => ({ ...acc, [n]: true }), {})}
                                        toggleNumber={() => { }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Floating Share Button ── */}
            <button
                onClick={() => setShowShareMenu(true)}
                className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white w-14 h-14 rounded-full shadow-xl shadow-pink-500/30 hover:scale-110 hover:shadow-pink-500/50 active:scale-95 transition-all z-40 flex items-center justify-center group"
                title="Share App"
            >
                <Share2 size={24} className="group-hover:animate-pulse" />
            </button>

            {/* ── Social Share Modal ── */}
            {showShareMenu && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm transition-opacity p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-fade-in-up border border-slate-100 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>

                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1">
                                    <Share2 size={20} className="text-indigo-600" /> Share Tambola
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Invite your friends to play online!</p>
                            </div>
                            <button onClick={() => setShowShareMenu(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors text-lg font-bold">×</button>
                        </div>

                        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {/* WhatsApp */}
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Come play free multiplayer Tambola with me! 🎲 ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 bg-white text-green-500 group-hover:bg-green-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 group-hover:border-green-500">
                                    <MessageCircle size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-green-600 tracking-tight">WhatsApp</span>
                            </a>

                            {/* Telegram */}
                            <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Join my Tambola Room!')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 bg-white text-sky-500 group-hover:bg-sky-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 group-hover:border-sky-500">
                                    <Send size={24} className="-ml-0.5 mt-0.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-sky-600 tracking-tight">Telegram</span>
                            </a>

                            {/* X (Twitter) */}
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I host the best kitty parties with Tambola Master! 🎲 ')}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 bg-white text-slate-700 group-hover:bg-slate-900 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 group-hover:border-slate-900">
                                    <Twitter size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 tracking-tight">X (Twitter)</span>
                            </a>

                            {/* Instagram */}
                            <button onClick={async () => {
                                await navigator.clipboard.writeText(window.location.href);
                                alert("Link copied! Paste it in your Instagram bio or story.");
                                setShowShareMenu(false);
                            }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 bg-white text-pink-500 group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-pink-500 group-hover:to-purple-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 group-hover:border-transparent">
                                    <Instagram size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-pink-600 tracking-tight">Instagram</span>
                            </button>
                        </div>

                        {/* Link / Native Share */}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input type="text" readOnly value={window.location.href} className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-xs px-3 py-3 rounded-xl outline-none truncate pr-10 font-medium" />
                                <button onClick={async () => {
                                    await navigator.clipboard.writeText(window.location.href);
                                    alert("Link Copied!");
                                    setShowShareMenu(false);
                                }} className="absolute right-1 top-1 p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm">
                                    <Link size={14} />
                                </button>
                            </div>

                            <button onClick={async () => {
                                if (navigator.share) {
                                    await navigator.share({
                                        title: 'Tambola Master',
                                        text: 'Come play free multiplayer Tambola with me!',
                                        url: window.location.href
                                    });
                                }
                                setShowShareMenu(false);
                            }} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                <Share2 size={16} /> More
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reset Confirmation Modal ── */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white/50">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Start New Game?</h3>
                        <p className="text-slate-600 mb-6">Current progress will be reset. Are you sure?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={confirmReset} id="btn-confirm-reset" className="px-4 py-2 rounded-xl font-medium bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Yes, Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rating Prompt Modal ── */}
            {showRatingPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white/50 text-center">
                        <div className="text-5xl mb-3">⭐</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Enjoying Tambola Master?</h3>
                        <p className="text-slate-600 mb-6">You've played 5 games! If you're having fun, a rating would mean the world to us.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    markPromptDismissed();
                                    setShowRatingPrompt(false);
                                }}
                                className="px-4 py-2 rounded-xl font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                            >Maybe Later</button>
                            <button
                                onClick={async () => {
                                    setShowRatingPrompt(false);
                                    const native = await requestNativeReview();
                                    if (!native) {
                                        // Fallback: open Play Store in new tab
                                        window.open('https://play.google.com/store/apps/details?id=dev.bhopal.apps.tambola', '_blank');
                                    }
                                }}
                                className="px-6 py-2 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center gap-1.5"
                            >⭐ Rate Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
