/**
 * roomService.js
 * Firebase helpers for Tambola Multiplayer Live Rooms
 *
 * Firestore structure:
 *   /tambola_rooms/{roomCode}/
 *     meta: { code, hostUid, hostName, status, createdAt, maxPlayers, entryFee, hostCommission }
 *     game: { calledNumbers[], currentNumber, autoSpeed }
 *     pool: { totalCollected, hostKeeps, prizePool, perPrize, activePrizes[], playersPaid }
 *   /tambola_rooms/{roomCode}/players/{uid}
 *     { uid, name, emoji, joinedAt }
 *   /tambola_rooms/{roomCode}/messages/{id}
 *     { uid, name, text, timestamp }
 */

import {
    getFirestore, doc, setDoc, getDoc, updateDoc,
    collection, addDoc, onSnapshot, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// --- Firebase init (reuses existing app if already initialized) ---
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : { apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo" };

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);

// --- Constants ---
const ROOMS_COL = 'tambola_rooms';

const PLAYER_EMOJIS = ['🎉', '🦁', '🐯', '🦊', '🐺', '🦅', '🐳', '🎃', '🌟', '🔥',
    '🎸', '🏆', '🎲', '🎯', '🚀', '🌈', '🦄', '🧩', '💎', '🎭'];

// --- Room Code Generator ---
export const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,1,I)
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// --- Get random player emoji ---
export const getRandomEmoji = () =>
    PLAYER_EMOJIS[Math.floor(Math.random() * PLAYER_EMOJIS.length)];

// --- Create Room (Host) ---
export const createRoom = async (hostUid, hostName, entryFee = 0, hostCommission = 10) => {
    const code = generateRoomCode();
    const roomRef = doc(db, ROOMS_COL, code);

    await setDoc(roomRef, {
        meta: {
            code,
            hostUid,
            hostName,
            status: 'lobby',       // 'lobby' | 'playing' | 'finished'
            createdAt: serverTimestamp(),
            maxPlayers: 50,
            entryFee: Math.max(0, Math.min(100, entryFee)), // 0-100 tokens
            hostCommission: Math.max(0, Math.min(30, hostCommission)), // 0-30%
        },
        game: {
            calledNumbers: [],
            currentNumber: null,
            autoSpeed: 5,
        },
        pool: {
            totalCollected: 0,
            hostKeeps: 0,
            prizePool: 0,
            perPrize: 0,
            activePrizes: [],
            playersPaid: 0,
        },
    });

    // Add host as a player too
    await setDoc(doc(db, ROOMS_COL, code, 'players', hostUid), {
        uid: hostUid,
        name: hostName,
        emoji: '👑',            // crown for the host
        isHost: true,
        joinedAt: serverTimestamp(),
    });

    return code;
};

// --- Join Room (Player) ---
export const joinRoom = async (code, playerUid, playerName) => {
    const roomRef = doc(db, ROOMS_COL, code.toUpperCase());
    const snap = await getDoc(roomRef);

    if (!snap.exists()) throw new Error('Room not found. Check the code and try again.');
    const { meta } = snap.data();
    if (meta.status === 'finished') throw new Error('This game has already ended.');

    // Return room data including entryFee so caller can deduct tokens
    const roomData = snap.data();

    // Register as a player
    await setDoc(doc(db, ROOMS_COL, code.toUpperCase(), 'players', playerUid), {
        uid: playerUid,
        name: playerName,
        emoji: getRandomEmoji(),
        isHost: false,
        joinedAt: serverTimestamp(),
    });

    return roomData;
};

// --- Leave Room (Player) ---
export const leaveRoom = async (code, playerUid) => {
    try {
        await deleteDoc(doc(db, ROOMS_COL, code, 'players', playerUid));
    } catch (e) {
        console.warn('Leave room error:', e);
    }
};

// --- Update game state (Host only) ---
export const syncGameToRoom = async (code, calledNumbers, currentNumber, autoSpeed) => {
    try {
        await updateDoc(doc(db, ROOMS_COL, code), {
            game: { calledNumbers, currentNumber, autoSpeed },
        });
    } catch (e) {
        console.warn('Room sync error:', e);
    }
};

// --- Start game (Host) ---
export const startGame = async (code) => {
    await updateDoc(doc(db, ROOMS_COL, code), { 'meta.status': 'playing' });
};

// --- End game (Host) ---
export const endGame = async (code) => {
    await updateDoc(doc(db, ROOMS_COL, code), { 'meta.status': 'finished' });
};

// --- Update prize pool (when players join/leave or host changes settings) ---
export const updatePrizePool = async (code, playersPaid, entryFee, hostCommission, activePrizes) => {
    const totalCollected = playersPaid * entryFee;
    const hostKeeps = Math.floor(totalCollected * (hostCommission / 100));
    const prizePool = totalCollected - hostKeeps;
    const prizeCount = activePrizes.length || 1;
    const perPrize = Math.floor(prizePool / prizeCount);
    try {
        await updateDoc(doc(db, ROOMS_COL, code), {
            pool: { totalCollected, hostKeeps, prizePool, perPrize, activePrizes, playersPaid },
        });
    } catch (e) {
        console.warn('Pool update error:', e);
    }
};

// --- Send chat message ---
export const sendMessage = async (code, uid, name, emoji, text) => {
    if (!text.trim()) return;
    await addDoc(collection(db, ROOMS_COL, code, 'messages'), {
        uid, name, emoji,
        text: text.trim().slice(0, 200), // 200 char limit
        timestamp: serverTimestamp(),
    });
};

// --- Real-time listeners ---
export const subscribeToRoom = (code, callback) =>
    onSnapshot(doc(db, ROOMS_COL, code), (snap) => {
        if (snap.exists()) callback(snap.data());
        else callback(null);
    });

export const subscribeToPlayers = (code, callback) =>
    onSnapshot(collection(db, ROOMS_COL, code, 'players'), (snap) => {
        const players = snap.docs.map(d => d.data());
        callback(players.sort((a, _b) => a.isHost ? -1 : 1));
    });

export const subscribeToMessages = (code, callback) =>
    onSnapshot(collection(db, ROOMS_COL, code, 'messages'), (snap) => {
        const messages = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(messages.slice(-100)); // last 100 messages
    });
