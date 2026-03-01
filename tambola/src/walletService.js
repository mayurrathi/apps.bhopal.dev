/**
 * walletService.js
 * Token wallet system for Tambola Master.
 *
 * Every new user starts with 500 tokens (welcome bonus).
 * Tokens can be earned via:
 *   - Rewarded Ads (+50 tokens)
 *   - Daily Login Bonus (+25 tokens)
 *   - Hosting a game (+10 tokens per player)
 * Tokens are spent via:
 *   - Room entry fees (set by host, 0-100 tokens)
 *
 * Data is stored in Firestore: /tambola_wallets/{uid}
 * Local fallback via localStorage for offline/demo.
 */

import {
    getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { getApps } from 'firebase/app';

const db = getFirestore(getApps()[0] || undefined);
const WALLETS_COL = 'tambola_wallets';

// --- Constants ---
export const WELCOME_BONUS = 500;
export const AD_REWARD = 50;
export const DAILY_BONUS = 25;
export const HOST_BONUS_PER_PLAYER = 10;
export const MAX_ENTRY_FEE = 100;

// --- Local fallback key ---
const LOCAL_KEY = 'tambola_wallet';

// --- Web Crypto API (Skill 02: PWA Defenses - Application Level Encryption) ---
// To prevent tampering via DevTools, we encrypt the offline wallet.
const getEncryptionKey = async () => {
    const rawKey = new TextEncoder().encode("TMS_OFFLINE_SEC_2026_STATIC_K3Y"); // In production, derive via WebAuthn or server-salt. For PWA demo this suffices to block casual DOM edits.
    const keyData = new Uint8Array(32);
    keyData.set(rawKey.subarray(0, 32));
    return await crypto.subtle.importKey(
        "raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
    );
};

const encryptData = async (dataObj) => {
    try {
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(dataObj));
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

        // Pack IV and encrypted data into Base64
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);
        return btoa(String.fromCharCode.apply(null, combined));
    } catch { return null; }
};

const decryptData = async (base64Str) => {
    try {
        const key = await getEncryptionKey();
        const combined = new Uint8Array(atob(base64Str).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch { return null; }
};

// --- Get or create wallet ---
export const getOrCreateWallet = async (uid) => {
    if (!uid) return await getLocalWallet();
    try {
        const ref = doc(db, WALLETS_COL, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();

        // New user — create wallet with welcome bonus
        const wallet = {
            uid,
            balance: WELCOME_BONUS,
            totalEarned: WELCOME_BONUS,
            totalSpent: 0,
            transactions: [{
                type: 'bonus',
                amount: WELCOME_BONUS,
                label: 'Welcome Bonus 🎉',
                timestamp: new Date().toISOString(),
            }],
            lastDailyBonus: null,
            createdAt: serverTimestamp(),
        };
        await setDoc(ref, wallet);
        await saveLocalWallet(wallet);
        return wallet;
    } catch (e) {
        console.warn('Wallet fetch error, using local:', e);
        return await getLocalWallet();
    }
};

// --- Add tokens ---
export const addTokens = async (uid, amount, label) => {
    if (!uid || amount <= 0) return;
    try {
        const ref = doc(db, WALLETS_COL, uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const txn = { type: 'earn', amount, label, timestamp: new Date().toISOString() };
        const newBalance = (data.balance || 0) + amount;
        const newTotalEarned = (data.totalEarned || 0) + amount;
        const txns = [...(data.transactions || []).slice(-49), txn]; // keep last 50
        await updateDoc(ref, { balance: newBalance, totalEarned: newTotalEarned, transactions: txns });
        // Sync local
        const updated = { ...data, balance: newBalance, totalEarned: newTotalEarned, transactions: txns };
        await saveLocalWallet(updated);
        return updated;
    } catch (e) {
        console.warn('addTokens error:', e);
        return await addTokensLocal(amount, label);
    }
};

// --- Spend tokens ---
export const spendTokens = async (uid, amount, label) => {
    if (!uid || amount <= 0) return { success: false, error: 'Invalid amount' };
    try {
        const ref = doc(db, WALLETS_COL, uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Wallet not found' };
        const data = snap.data();
        if ((data.balance || 0) < amount) return { success: false, error: 'Insufficient tokens' };
        const txn = { type: 'spend', amount: -amount, label, timestamp: new Date().toISOString() };
        const newBalance = data.balance - amount;
        const newTotalSpent = (data.totalSpent || 0) + amount;
        const txns = [...(data.transactions || []).slice(-49), txn];
        await updateDoc(ref, { balance: newBalance, totalSpent: newTotalSpent, transactions: txns });
        const updated = { ...data, balance: newBalance, totalSpent: newTotalSpent, transactions: txns };
        await saveLocalWallet(updated);
        return { success: true, wallet: updated };
    } catch (e) {
        console.warn('spendTokens error:', e);
        return await spendTokensLocal(amount, label);
    }
};

// --- Claim daily bonus ---
export const claimDailyBonus = async (uid) => {
    try {
        const ref = doc(db, WALLETS_COL, uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Wallet not found' };
        const data = snap.data();
        const today = new Date().toISOString().slice(0, 10);
        if (data.lastDailyBonus === today) return { success: false, error: 'Already claimed today' };
        const txn = { type: 'bonus', amount: DAILY_BONUS, label: 'Daily Login Bonus ☀️', timestamp: new Date().toISOString() };
        const newBalance = (data.balance || 0) + DAILY_BONUS;
        const txns = [...(data.transactions || []).slice(-49), txn];
        await updateDoc(ref, { balance: newBalance, totalEarned: (data.totalEarned || 0) + DAILY_BONUS, lastDailyBonus: today, transactions: txns });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

// --- Subscribe to wallet changes ---
export const subscribeToWallet = (uid, callback) => {
    if (!uid) {
        getLocalWallet().then(callback);
        return () => { };
    }
    return onSnapshot(doc(db, WALLETS_COL, uid), (snap) => {
        if (snap.exists()) {
            callback(snap.data());
            saveLocalWallet(snap.data());
        } else {
            getLocalWallet().then(callback);
        }
    });
};

// --- Local fallback helpers ---
const getLocalWallet = async () => {
    try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) {
            const dec = await decryptData(stored);
            if (dec) return dec;
        }
    } catch (e) { console.warn("Failed to decrypt local wallet", e) }

    // Create new encrypted local wallet
    const wallet = { balance: WELCOME_BONUS, totalEarned: WELCOME_BONUS, totalSpent: 0, transactions: [{ type: 'bonus', amount: WELCOME_BONUS, label: 'Welcome Bonus 🎉', timestamp: new Date().toISOString() }] };
    await saveLocalWallet(wallet);
    return wallet;
};

const saveLocalWallet = async (wallet) => {
    try {
        const enc = await encryptData(wallet);
        if (enc) localStorage.setItem(LOCAL_KEY, enc);
    } catch (e) { console.warn("Serialization fail", e) }
};

const addTokensLocal = async (amount, label) => {
    const wallet = await getLocalWallet();
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.transactions.push({ type: 'earn', amount, label, timestamp: new Date().toISOString() });
    if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(-50);
    await saveLocalWallet(wallet);
    return wallet;
};

const spendTokensLocal = async (amount, label) => {
    const wallet = await getLocalWallet();
    if (wallet.balance < amount) return { success: false, error: 'Insufficient tokens' };
    wallet.balance -= amount;
    wallet.totalSpent += amount;
    wallet.transactions.push({ type: 'spend', amount: -amount, label, timestamp: new Date().toISOString() });
    if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(-50);
    await saveLocalWallet(wallet);
    return { success: true, wallet };
};
