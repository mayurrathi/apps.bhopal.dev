/**
 * MultiplayerTab.jsx
 * The full multiplayer experience — three views in sequence:
 *   1. Chooser     — "Create Room" or "Join Room"
 *   2. Lobby       — Waiting room with player list + room code
 *   3. Player View — Live board + chat for players who joined
 *
 * The host stays on the "Game" tab and plays normally.
 * Game state is synced from TambolaApp → Firebase → all players.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Copy, CheckCheck, LogOut, Play, QrCode, Wifi, WifiOff, Lock,
    UserPlus, ArrowRight, Loader2, AlertCircle, Coins, Trophy, PieChart
} from 'lucide-react';
import {
    createRoom, joinRoom, leaveRoom,
    subscribeToRoom, subscribeToPlayers, subscribeToMessages,
    startGame, endGame, auth, updatePrizePool
} from './roomService.js';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getOrCreateWallet, spendTokens, addTokens, subscribeToWallet } from './walletService.js';
import { validateDisplayName } from './profanityFilter.js';
import PlayerBoard from './PlayerBoard.jsx';
import RoomChat from './RoomChat.jsx';

// ─── View states ─────────────────────────────────────────────────────────────
const VIEW = { CHOOSER: 'chooser', LOBBY: 'lobby', PLAYING: 'playing' };

export default function MultiplayerTab({ prizes, activeRoomCode, onRoomCodeChange = () => { } }) {
    // Auth
    const [user, setUser] = useState(null);

    // Name entry
    const [myName, setMyName] = useState(() => localStorage.getItem('tambola_name') || '');
    const [myEmoji, setMyEmoji] = useState(() => localStorage.getItem('tambola_emoji') || '🎲');

    // Room state
    const [view, setView] = useState(VIEW.CHOOSER);
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Wallet + Entry Fee + Commission
    const [walletBalance, setWalletBalance] = useState(0);
    const [entryFee, setEntryFee] = useState(0); // host sets this
    const [hostCommission, setHostCommission] = useState(10); // 0-30%

    // Live room data
    const [roomData, setRoomData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [messages, setMessages] = useState([]);

    // Unsubscribe refs
    const unsubRoomRef = useRef(null);
    const unsubPlayersRef = useRef(null);
    const unsubMsgsRef = useRef(null);

    // ─── Feature Gating (Skill 03) ───────────────────────────────────────────
    const [toast, setToast] = useState('');
    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    // Unlock host mode once user has earned any referral bonus (balance > welcome bonus)
    // or simply if they have more than 500 tokens (they earned via invite/daily bonus)
    // This replaces the broken `wallet?.transactions` reference (wallet was undefined)
    const hasInvited = walletBalance > 500 || walletBalance === 0; // 0 = offline/new user, always allow

    const handleShareInvite = async () => {
        if (!user?.uid) { showToast('Please wait for sync...'); return; }
        const inviteLink = `${window.location.origin}?invite=${user.uid}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Play Tambola Master with me!',
                    text: 'Use my invite link to get 200 free tokens instantly!',
                    url: inviteLink,
                });
            } else {
                await navigator.clipboard.writeText(inviteLink);
                showToast('Invite link copied! 📋');
            }
        } catch (e) { console.error('Share failed', e); }
    };

    // ─── Auth ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) { setUser(u); return; }
            try { await signInAnonymously(auth); }
            catch (e) { console.warn('Auth error:', e); }
        });
        return () => unsub();
    }, []);

    // ─── Wallet sync ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        getOrCreateWallet(user.uid);
        const unsub = subscribeToWallet(user.uid, (w) => setWalletBalance(w?.balance || 0));
        return () => unsub();
    }, [user]);

    // ─── Subscribe when in a room ─────────────────────────────────────────────
    useEffect(() => {
        if (!roomCode) return;
        unsubRoomRef.current?.();
        unsubPlayersRef.current?.();
        unsubMsgsRef.current?.();

        unsubRoomRef.current = subscribeToRoom(roomCode, (data) => {
            if (!data) { handleLeave(); return; }
            setRoomData(data);
            // If host started game, move players to playing view
            if (!isHost && data.meta.status === 'playing') setView(VIEW.PLAYING);
            if (data.meta.status === 'finished') handleLeave();
        });
        unsubPlayersRef.current = subscribeToPlayers(roomCode, setPlayers);
        unsubMsgsRef.current = subscribeToMessages(roomCode, setMessages);

        return () => {
            unsubRoomRef.current?.();
            unsubPlayersRef.current?.();
            unsubMsgsRef.current?.();
        };
    }, [roomCode]);

    // ─── Recalculate pool when players change ─────────────────────────────────
    useEffect(() => {
        if (!roomCode || !isHost || !roomData) return;
        const fee = roomData?.meta?.entryFee || 0;
        const commission = roomData?.meta?.hostCommission || 10;
        if (fee === 0) return;
        const payingPlayers = Math.max(0, players.length - 1); // host doesn't pay
        const activePrizeNames = prizes.filter(p => p.enabled).map(p => p.name);
        updatePrizePool(roomCode, payingPlayers, fee, commission, activePrizeNames);
    }, [players.length, roomCode, isHost, prizes]);

    // ─── Create Room ──────────────────────────────────────────────────────────
    const handleCreateRoom = async () => {
        if (!myName.trim()) { setError('Please enter your name first.'); return; }
        const nameCheck = validateDisplayName(myName);
        if (!nameCheck.valid) { setError(nameCheck.reason); return; }
        if (!user) { setError('Connecting… try again in a second.'); return; }
        setLoading(true); setError('');
        try {
            localStorage.setItem('tambola_name', myName.trim());
            const code = await createRoom(user.uid, myName.trim(), entryFee, hostCommission);
            setRoomCode(code);
            setIsHost(true);
            setMyEmoji('👑');
            onRoomCodeChange(code);
            setView(VIEW.LOBBY);
        } catch (e) {
            setError(e.message || 'Could not create room.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Join Room ───────────────────────────────────────────────────────────
    const handleJoinRoom = async () => {
        if (!myName.trim()) { setError('Please enter your name first.'); return; }
        const nameCheck = validateDisplayName(myName);
        if (!nameCheck.valid) { setError(nameCheck.reason); return; }
        if (!joinCode.trim()) { setError('Enter the 6-character room code.'); return; }
        if (!user) { setError('Connecting… try again in a second.'); return; }
        setLoading(true); setError('');
        try {
            localStorage.setItem('tambola_name', myName.trim());
            const roomData = await joinRoom(joinCode.trim(), user.uid, myName.trim());
            const fee = roomData?.meta?.entryFee || 0;

            // Deduct entry fee from wallet
            if (fee > 0) {
                const result = await spendTokens(user.uid, fee, `Room Entry Fee 🎟️ (${joinCode.trim().toUpperCase()})`);
                if (!result.success) {
                    setError(`Insufficient tokens! You need ${fee} tokens to join. Current balance: ${walletBalance}.`);
                    setLoading(false);
                    return;
                }
            }

            const code = joinCode.trim().toUpperCase();
            setRoomCode(code);
            setIsHost(false);
            onRoomCodeChange(code);
            setView(VIEW.LOBBY);
        } catch (e) {
            setError(e.message || 'Could not join room.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Leave Room ──────────────────────────────────────────────────────────
    const handleLeave = async () => {
        if (roomCode && user) {
            await leaveRoom(roomCode, user.uid);
            if (isHost) await endGame(roomCode).catch(() => { });
        }
        unsubRoomRef.current?.();
        unsubPlayersRef.current?.();
        unsubMsgsRef.current?.();
        setRoomCode('');
        setRoomData(null);
        setPlayers([]);
        setMessages([]);
        setIsHost(false);
        onRoomCodeChange(null);
        setView(VIEW.CHOOSER);
    };

    // ─── Host: Start Game ────────────────────────────────────────────────────
    const handleStartGame = async () => {
        await startGame(roomCode);
        // Host stays on Game tab — nothing changes in multiplayer tab
        // Players will auto-transition to PLAYING view via room subscription
    };

    // ─── Copy room code ──────────────────────────────────────────────────────
    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // Fallback for mobile
            const el = document.createElement('textarea');
            el.value = roomCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const currentUserCtx = {
        uid: user?.uid || '',
        name: myName || 'Me',
        emoji: myEmoji,
    };

    const gameData = roomData?.game || {};
    const calledNumbers = gameData.calledNumbers || [];
    const currentNumber = gameData.currentNumber || null;

    // ─── RENDER ───────────────────────────────────────────────────────────────

    // ── View 1: Chooser ──────────────────────────────────────────────────────
    if (view === VIEW.CHOOSER) return (
        <div className="max-w-md mx-auto p-4 md:p-6 flex flex-col gap-4">

            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white text-center shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative">
                    <div className="text-4xl mb-2">🎉</div>
                    <h2 className="text-2xl font-black mb-1">Multiplayer Room</h2>
                    <p className="text-indigo-200 text-sm">Play Tambola together — anywhere in the world.<br />Up to 50 players per room.</p>
                    {/* Wallet balance badge */}
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold">
                        <Coins size={14} className="text-amber-300" />
                        <span>{walletBalance.toLocaleString()} tokens</span>
                    </div>
                </div>
            </div>

            {/* Name input */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Name</label>
                <input
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="Enter your display name…"
                    maxLength={24}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold animate-bounce whitespace-nowrap">
                    {toast}
                </div>
            )}

            {/* ERROR ALERT */}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* ─── GATED FEATURE: HOST MODE ─── */}
            {!hasInvited ? (
                <div className="bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-20 blur group-hover:opacity-30 transition-opacity pointer-events-none" />
                    <div className="relative">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(251,191,36,0.5)] border border-amber-100">
                            <Lock size={28} className="text-amber-500" />
                        </div>
                        <h3 className="font-black text-amber-900 text-lg mb-1 leading-tight">Host Mode Locked</h3>
                        <p className="text-xs text-amber-700/90 mb-5 leading-relaxed max-w-[280px] mx-auto font-medium">
                            Invite just <strong>1 friend</strong> to instantly unlock the ability to host your own rooms, set entry fees, and earn host commission!
                        </p>
                        <button
                            onClick={handleShareInvite}
                            disabled={!user}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <UserPlus size={18} />
                            Share Invite to Unlock
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 text-indigo-900">
                        <Trophy size={16} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-wider">Host A Room</span>
                    </div>

                    {/* Entry Fee Setter (Host only) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entry Fee</label>
                            <span className="flex items-center gap-1 text-sm font-black text-amber-600">
                                <Coins size={14} /> {entryFee} tokens
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100" step="5"
                            value={entryFee}
                            onChange={(e) => setEntryFee(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Free</span>
                            <span>💰 100</span>
                        </div>
                    </div>

                    {/* Host Commission Slider */}
                    {entryFee > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Host Commission</label>
                                <span className="flex items-center gap-1 text-sm font-black text-emerald-600">
                                    {hostCommission}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0" max="30" step="5"
                                value={hostCommission}
                                onChange={(e) => setHostCommission(Number(e.target.value))}
                                className="w-full accent-emerald-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>0%</span>
                                <span>30%</span>
                            </div>
                            <p className="text-[10px] text-emerald-700 mt-2 bg-emerald-50 rounded-lg px-2.5 py-1.5 font-medium leading-relaxed border border-emerald-100">
                                You keep <strong>{hostCommission}%</strong> of total collected. Rest goes to prize winners.
                            </p>
                        </div>
                    )}

                    {/* Create Room */}
                    <button onClick={handleCreateRoom} disabled={loading || !myName.trim()}
                        id="btn-create-room"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} className="fill-current" />}
                        Create Room {entryFee > 0 && `(${entryFee}🪙)`}
                    </button>
                </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                <div className="flex-1 h-px bg-slate-200" />OR JOIN ONE<div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Join Room */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Room Code</label>
                <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. GAM3BZ"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-black text-xl tracking-[0.3em] uppercase text-center outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <button onClick={handleJoinRoom} disabled={loading || !joinCode.trim() || !myName.trim()}
                    id="btn-join-room"
                    className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-3 rounded-xl font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    Join Room
                </button>
            </div>

            {/* Not connected note */}
            {!user && (
                <div className="flex items-center gap-2 justify-center text-slate-400 text-xs">
                    <WifiOff size={12} />
                    Connecting to live service…
                </div>
            )}
        </div>
    );

    // ── View 2: Lobby (waiting room) ─────────────────────────────────────────
    if (view === VIEW.LOBBY) return (
        <div className="max-w-xl mx-auto p-4 md:p-6 flex flex-col gap-4">

            {/* Room Code Card */}
            <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl text-center">
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">
                    {isHost ? 'Your Room Code' : 'Joined Room'}
                </p>
                <div className="text-4xl font-black tracking-[0.3em] mb-4">{roomCode}</div>
                <div className="flex gap-2 justify-center">
                    <button onClick={copyCode}
                        className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        {copied ? <CheckCheck size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button onClick={handleLeave}
                        className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800/70 px-4 py-2 rounded-xl text-red-400 text-sm font-semibold transition-colors">
                        <LogOut size={16} /> Leave
                    </button>
                </div>
            </div>

            {/* Host instructions */}
            {isHost && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
                    <p className="font-bold mb-1">📋 You're the Host</p>
                    <p>Share the code above with your players. When everyone has joined, go back to the <strong>Game tab</strong> and start calling numbers — players will see the board live!</p>
                </div>
            )}
            {!isHost && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">
                    <p className="font-bold mb-1">⏳ Waiting for host to start</p>
                    <p>You'll automatically see the board here when the game begins. Stay on this screen!</p>
                </div>
            )}

            {/* 💰 Prize Pool Dashboard — visible to everyone */}
            {(() => {
                const pool = roomData?.pool || {};
                const fee = roomData?.meta?.entryFee || 0;
                const commission = roomData?.meta?.hostCommission || 10;
                if (fee === 0) return null;
                return (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <PieChart size={16} className="text-amber-600" />
                            <h3 className="text-sm font-bold text-amber-800">Prize Pool</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white rounded-xl p-3 text-center border border-amber-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Collected</p>
                                <p className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
                                    <Coins size={14} /> {pool.totalCollected || 0}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-amber-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Host Keeps ({commission}%)</p>
                                <p className="text-xl font-black text-slate-600 flex items-center justify-center gap-1">
                                    <Coins size={14} /> {pool.hostKeeps || 0}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-amber-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Prize Pool</p>
                                <p className="text-xl font-black text-emerald-600 flex items-center justify-center gap-1">
                                    <Trophy size={14} /> {pool.prizePool || 0}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-center border border-amber-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Per Prize</p>
                                <p className="text-xl font-black text-indigo-600 flex items-center justify-center gap-1">
                                    <Coins size={14} /> {pool.perPrize || 0}
                                </p>
                            </div>
                        </div>
                        {/* Active prizes list */}
                        {(pool.activePrizes || []).length > 0 && (
                            <div className="bg-white rounded-xl p-3 border border-amber-100">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Active Prizes ({(pool.activePrizes || []).length})</p>
                                <div className="flex flex-wrap gap-1">
                                    {(pool.activePrizes || []).map((name, i) => (
                                        <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-amber-600 mt-2 text-center">
                            {pool.playersPaid || 0} player{(pool.playersPaid || 0) !== 1 ? 's' : ''} paid × {fee} tokens each
                        </p>
                    </div>
                );
            })()}

            {/* Player List */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/40 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Users size={16} />
                        <span className="text-sm font-bold">{players.length} Player{players.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Wifi size={11} /> Live
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                        <div key={p.uid}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${p.uid === user?.uid
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}>
                            <span className="text-base">{p.emoji}</span>
                            <span>{p.name}</span>
                            {p.isHost && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">HOST</span>}
                            {p.uid === user?.uid && !p.isHost && <span className="text-[10px] text-indigo-500 font-bold">YOU</span>}
                        </div>
                    ))}
                    {players.length === 0 && (
                        <p className="text-slate-400 text-sm italic">Waiting for players to join…</p>
                    )}
                </div>
            </div>

            {/* Chat in lobby */}
            <RoomChat roomCode={roomCode} currentUser={currentUserCtx} messages={messages} />
        </div>
    );

    // ── View 3: Playing (Player live board + chat) ────────────────────────────
    if (view === VIEW.PLAYING) return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left — Live Board */}
                <div className="flex-1">
                    <PlayerBoard
                        roomData={roomData}
                        players={players}
                        currentNumber={currentNumber}
                        calledNumbers={calledNumbers}
                        onLeave={handleLeave}
                        t50Mode={false}
                    />
                </div>
                {/* Right — Chat */}
                <div className="lg:w-72 flex flex-col gap-4">
                    <RoomChat roomCode={roomCode} currentUser={currentUserCtx} messages={messages} />
                </div>
            </div>
        </div>
    );

    return null;
}
