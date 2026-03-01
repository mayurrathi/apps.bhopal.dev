/**
 * WalletTab.jsx
 * Token wallet UI — shows balance, earn/spend options, transaction history.
 * Supports full OFFLINE mode when Firebase is unavailable.
 */
import React, { useState, useEffect } from 'react';
import {
    Wallet, Coins, Gift, Eye, TrendingUp, TrendingDown,
    CircleDollarSign, Film, CalendarCheck, Loader2, WifiOff, Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import {
    getOrCreateWallet, addTokens, claimDailyBonus,
    subscribeToWallet, AD_REWARD, DAILY_BONUS, WELCOME_BONUS
} from './walletService.js';
import { isFirebaseAvailable } from './firebaseStatus.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApps } from 'firebase/app';

export default function WalletTab({ offlineMode = false }) {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [watchingAd, setWatchingAd] = useState(false);
    const [toast, setToast] = useState('');

    // Referral state
    const [redeemCode, setRedeemCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);

    // Load wallet — offline or online
    useEffect(() => {
        setLoading(true);

        if (offlineMode || !isFirebaseAvailable()) {
            // Pure offline: use localStorage wallet immediately
            const localWallet = getLocalWallet();
            setWallet(localWallet);
            setLoading(false);
            return;
        }

        // Online mode with Firebase
        let unsub = () => { };
        const init = async () => {
            try {
                const { getAuth, onAuthStateChanged, signInAnonymously } = await import('firebase/auth');
                const { getApps } = await import('firebase/app');
                const auth = getAuth(getApps()[0]);
                unsub = onAuthStateChanged(auth, async (u) => {
                    if (!u) {
                        try { await signInAnonymously(auth); } catch (e) {
                            setWallet(getLocalWallet());
                            setLoading(false);
                        }
                        return;
                    }
                    await getOrCreateWallet(u.uid);
                    const walletUnsub = subscribeToWallet(u.uid, (data) => {
                        setWallet(data);
                        setLoading(false);
                    });
                    unsub = () => { walletUnsub(); };
                });
            } catch (e) {
                setWallet(getLocalWallet());
                setLoading(false);
            }
        };
        init();
        return () => unsub();
    }, [offlineMode]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    // Earn via Rewarded Ad (secure server-side verification in online mode)
    const handleWatchAd = async () => {
        setWatchingAd(true);
        try {
            if (offlineMode) {
                // Offline Demo fallback
                const { addTokensLocal, getLocalWallet } = await import('./walletService.js');
                await addTokensLocal(AD_REWARD, `Watched Ad 🎬 (+${AD_REWARD})`);
                setWallet(await getLocalWallet());
            } else {
                try {
                    const { showRewardedAd } = await import('./admob.js');
                    await showRewardedAd();
                } catch (e) { /* ad not available, award anyway */ }

                // Secure Server-Side Verification (Skill 02: Zero Client Trust)
                try {
                    const { getAuth } = await import('firebase/auth');
                    const { getApps } = await import('firebase/app');
                    const uid = getAuth(getApps()[0])?.currentUser?.uid;

                    if (uid) {
                        const functions = getFunctions(getApps()[0]);
                        const verifyAdReward = httpsCallable(functions, 'verifyAdReward');
                        await verifyAdReward(); // Backend securely mints tokens
                    } else {
                        const { addTokensLocal, getLocalWallet } = await import('./walletService.js');
                        await addTokensLocal(AD_REWARD, `Watched Ad 🎬 (+${AD_REWARD})`);
                        setWallet(await getLocalWallet());
                    }
                } catch (e) {
                    const { addTokensLocal, getLocalWallet } = await import('./walletService.js');
                    await addTokensLocal(AD_REWARD, `Watched Ad 🎬 (+${AD_REWARD})`);
                    setWallet(await getLocalWallet());
                }
            }
            showToast(`+${AD_REWARD} tokens earned! 🎬`);
        } finally {
            setWatchingAd(false);
        }
    };

    // Daily bonus
    const handleDailyBonus = async () => {
        setClaiming(true);
        try {
            if (offlineMode) {
                const result = claimDailyBonusLocal();
                if (result.success) {
                    setWallet(getLocalWallet());
                    showToast(`+${DAILY_BONUS} tokens — Daily Bonus! ☀️`);
                } else {
                    showToast(result.error || 'Already claimed today');
                }
            } else {
                try {
                    const { getAuth } = await import('firebase/auth');
                    const { getApps } = await import('firebase/app');
                    const uid = getAuth(getApps()[0])?.currentUser?.uid;
                    if (uid) {
                        const result = await claimDailyBonus(uid);
                        if (result.success) showToast(`+${DAILY_BONUS} tokens — Daily Bonus! ☀️`);
                        else showToast(result.error || 'Already claimed today');
                    } else {
                        const result = claimDailyBonusLocal();
                        if (result.success) { setWallet(getLocalWallet()); showToast(`+${DAILY_BONUS} tokens — Daily Bonus! ☀️`); }
                        else showToast(result.error);
                    }
                } catch (e) {
                    showToast('Could not claim bonus');
                }
            }
        } finally {
            setClaiming(false);
        }
    };

    // --- Dynamic Shareable Assets (Skill 03) ---
    const handleShareInvite = async () => {
        if (!wallet?.uid) {
            showToast('Please wait for wallet to sync');
            return;
        }

        const inviteLink = `${window.location.origin}?invite=${wallet.uid}`;
        setLoading(true); // Re-use loading state for the generation spinner

        try {
            // 1. Generate High-Res Image of the Poster
            const posterEl = document.getElementById('invite-poster');
            if (!posterEl) throw new Error("Poster element not found");

            // Temporarily make it visible for html2canvas to paint
            posterEl.style.display = 'flex';

            const canvas = await html2canvas(posterEl, {
                scale: 2, // Retina quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            posterEl.style.display = 'none'; // Hide again

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            const file = new File([blob], 'tambola_invite.jpg', { type: 'image/jpeg' });

            // 2. Native OS Share Sheet with Image Attachment
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Play Tambola Master with me!',
                    text: 'Use my invite code to get 200 free tokens instantly!',
                    files: [file],
                });
                showToast('Invite shared successfully! 🚀');
            } else {
                // Fallback for desktop/unsupported browsers: Direct download + copy link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tambola_invite.jpg';
                a.click();

                await navigator.clipboard.writeText(inviteLink);
                showToast('Image downloaded & link copied to clipboard! 📋');
            }
        } catch (e) {
            console.error('Share failed', e);
            // Fallback to basic text share if canvas fails
            const inviteLink = `${window.location.origin}?invite=${wallet.uid}`;
            if (navigator.share) navigator.share({ url: inviteLink });
            else {
                navigator.clipboard.writeText(inviteLink);
                showToast('Link copied to clipboard! 📋');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        if (!redeemCode.trim()) return;
        if (offlineMode) {
            showToast('Referrals require online mode 📶');
            return;
        }

        setRedeeming(true);
        try {
            const functions = getFunctions(getApps()[0]);
            const processReferral = httpsCallable(functions, 'processReferral');

            const result = await processReferral({ referralCode: redeemCode.trim() });

            showToast(result.data.message || 'Code redeemed! +200 tokens 🎁');
            setRedeemCode('');
        } catch (error) {
            console.error('Redeem error:', error);
            // The Cloud Function throws standard HttpsErrors which populate error.message
            showToast(error.message || 'Failed to redeem code ❌');
        } finally {
            setRedeeming(false);
        }
    };

    const balance = wallet?.balance ?? 0;
    const transactions = (wallet?.transactions || []).slice().reverse();

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
    );

    return (
        <div className="max-w-md mx-auto p-4 md:p-6 flex flex-col gap-4">

            {/* Toast */}
            {toast && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold animate-bounce">
                    {toast}
                </div>
            )}

            {/* Offline badge */}
            {offlineMode && (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs py-2 px-4 rounded-xl">
                    <WifiOff size={12} />
                    Offline mode — wallet data stored locally on this device.
                </div>
            )}

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet size={18} className="text-amber-200" />
                        <span className="text-xs font-bold text-amber-200 uppercase tracking-widest">Token Wallet</span>
                    </div>
                    <div className="text-5xl font-black tabular-nums mt-2 mb-1 flex items-baseline gap-2">
                        <Coins size={28} className="text-amber-200" />
                        {balance.toLocaleString()}
                    </div>
                    <p className="text-amber-100 text-sm">tokens available</p>
                </div>
            </div>

            {/* Earn Tokens */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" /> Earn Tokens
                </h3>
                <div className="flex gap-2">
                    <button onClick={handleWatchAd} disabled={watchingAd}
                        className="flex-1 flex flex-col items-center gap-1.5 bg-gradient-to-b from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 rounded-xl p-4 transition-all active:scale-95 disabled:opacity-50">
                        {watchingAd
                            ? <Loader2 size={22} className="text-emerald-600 animate-spin" />
                            : <Film size={22} className="text-emerald-600" />}
                        <span className="text-xs font-bold text-emerald-700">Watch Ad</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-200 px-2 py-0.5 rounded-full">+{AD_REWARD}</span>
                    </button>

                    <button onClick={handleDailyBonus} disabled={claiming}
                        className="flex-1 flex flex-col items-center gap-1.5 bg-gradient-to-b from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-4 transition-all active:scale-95 disabled:opacity-50">
                        {claiming
                            ? <Loader2 size={22} className="text-blue-600 animate-spin" />
                            : <CalendarCheck size={22} className="text-blue-600" />}
                        <span className="text-xs font-bold text-blue-700">Daily Bonus</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-200 px-2 py-0.5 rounded-full">+{DAILY_BONUS}</span>
                    </button>
                </div>
            </div>

            {/* Invite & Earn (Double Sided Referral) */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

                <h3 className="text-sm font-black text-indigo-900 mb-1 flex items-center gap-2">
                    <Gift size={16} className="text-indigo-600" /> Invite & Earn 200 Tokens
                </h3>
                <p className="text-xs text-indigo-600/80 mb-4 font-medium leading-relaxed">
                    Share your link. When a friend joins, you <strong className="text-indigo-700">both</strong> get 200 tokens instantly!
                </p>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleShareInvite}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Share Invite Link</span>
                        <TrendingUp size={14} className="opacity-80" />
                    </button>
                </div>

                <div className="flex items-stretch gap-2 mt-4 pt-4 border-t border-indigo-200/50">
                    <input
                        type="text"
                        placeholder="Paste invite code..."
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        className="flex-1 bg-white border border-indigo-200 text-indigo-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                        onClick={handleRedeemCode}
                        disabled={redeeming || !redeemCode.trim()}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold px-4 rounded-xl transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-95 flex items-center gap-1"
                    >
                        {redeeming ? <Loader2 size={14} className="animate-spin" /> : 'Redeem'}
                    </button>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Eye size={14} className="text-slate-400" /> Transaction History
                </h3>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {transactions.length === 0 && (
                        <p className="text-slate-400 text-sm italic text-center py-4">No transactions yet</p>
                    )}
                    {transactions.map((tx, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-600'
                                }`}>
                                {tx.amount > 0
                                    ? <TrendingUp size={14} />
                                    : <TrendingDown size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{tx.label}</p>
                                <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info note */}
            <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[11px] text-slate-400">
                    {offlineMode
                        ? 'Offline mode. Tokens are stored locally. Connect to Firebase for cloud sync and multiplayer features.'
                        : 'Tokens are used to join multiplayer rooms. Earn more by watching ads or claiming your daily bonus.'}
                </p>
            </div>
            {/* HIDDEN OFFSCREEN POSTER CANVAS (1080x1920 9:16 aspect ratio) */}
            <div
                id="invite-poster"
                className="hidden absolute -left-[9999px] top-0 w-[1080px] h-[1920px] bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-20 text-center text-white"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-500/20 to-transparent" />
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[100px]" />
                <div className="absolute -left-40 bottom-40 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px]" />

                {/* Floating Coins/Bingo Balls (simulated via text emojis for simplicity on canvas) */}
                <div className="absolute top-40 left-40 text-8xl opacity-80 mix-blend-overlay rotate-12">🎱</div>
                <div className="absolute top-80 right-40 text-9xl opacity-60 mix-blend-overlay -rotate-12">🎲</div>
                <div className="absolute bottom-60 left-60 text-9xl opacity-50 mix-blend-overlay rotate-45">💰</div>

                <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center">
                    <img src="/icon-512.png" alt="Tambola Master Logo" className="w-64 h-64 shadow-2xl rounded-3xl mb-8 border-4 border-white/20" />

                    <h1 className="text-[120px] font-black leading-none mb-6 drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">
                        TAMBOLA
                        <br />
                        <span className="text-[100px] text-amber-400">MASTER</span>
                    </h1>

                    <div className="w-32 h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full mb-12" />

                    <h2 className="text-[60px] font-bold mb-4">Play with me!</h2>
                    <p className="text-[40px] text-indigo-200 leading-tight mb-20 max-w-[700px]">
                        Scan my VIP code to join the game and instantly get <strong className="text-amber-400">200 Free Tokens</strong> in your wallet!
                    </p>

                    {/* QR Code container */}
                    <div className="bg-white p-6 rounded-[40px] shadow-[0_0_100px_rgba(255,255,255,0.3)] mb-10 border-8 border-indigo-100">
                        {wallet?.uid && (
                            <QRCodeCanvas
                                value={`${window.location.origin}?invite=${wallet.uid}`}
                                size={400}
                                level="H"
                                includeMargin={true}
                                fgColor="#1e1b4b" // indigo-950
                            />
                        )}
                    </div>

                    <div className="bg-indigo-800/50 backdrop-blur-xl border border-indigo-500/50 rounded-full px-12 py-6">
                        <p className="text-[36px] font-bold text-indigo-100 tracking-wider">
                            Invite Code: <span className="text-white font-black">{wallet?.uid || "-------"}</span>
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-16 text-center w-full">
                    <p className="text-[28px] text-indigo-300 font-medium">Download now on App Store & Google Play</p>
                </div>
            </div>

        </div>
    );
}

// ─── Local-only wallet helpers (duplicated here for self-contained offline) ───
const LOCAL_KEY = 'tambola_wallet';

function getLocalWallet() {
    try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { }
    const wallet = {
        balance: WELCOME_BONUS,
        totalEarned: WELCOME_BONUS,
        totalSpent: 0,
        transactions: [{ type: 'bonus', amount: WELCOME_BONUS, label: 'Welcome Bonus 🎉', timestamp: new Date().toISOString() }],
        lastDailyBonus: null,
    };
    saveLocalWallet(wallet);
    return wallet;
}

function saveLocalWallet(wallet) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(wallet)); } catch (e) { }
}

function addTokensLocal(amount, label) {
    const wallet = getLocalWallet();
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.transactions.push({ type: 'earn', amount, label, timestamp: new Date().toISOString() });
    if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(-50);
    saveLocalWallet(wallet);
    return wallet;
}

function claimDailyBonusLocal() {
    const wallet = getLocalWallet();
    const today = new Date().toISOString().slice(0, 10);
    if (wallet.lastDailyBonus === today) return { success: false, error: 'Already claimed today' };
    wallet.balance += DAILY_BONUS;
    wallet.totalEarned += DAILY_BONUS;
    wallet.lastDailyBonus = today;
    wallet.transactions.push({ type: 'bonus', amount: DAILY_BONUS, label: 'Daily Login Bonus ☀️', timestamp: new Date().toISOString() });
    if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(-50);
    saveLocalWallet(wallet);
    return { success: true };
}
