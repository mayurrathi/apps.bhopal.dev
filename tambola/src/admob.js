import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// ─── Environment Flag ─────────────────────────────────────────────────────────
// Set IS_PRODUCTION to true before publishing a release build.
// During development on your local device, keep it false to use test IDs.
const IS_PRODUCTION = true;

// ─── Real AdMob IDs (Android) ─────────────────────────────────────────────────
// App: Tambola Master
// App ID: ca-app-pub-1891237722651167~2518393959  ← in capacitor.config.ts
const REAL_AD_UNITS = {
    banner: 'ca-app-pub-1891237722651167/8892705979',
    interstitial: 'ca-app-pub-1891237722651167/8401276029',
    rewarded: 'ca-app-pub-1891237722651167/3117635111',
};

// ─── Google Test IDs (safe for development — never show real ads during testing) ─
const TEST_AD_UNITS = {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

const AD_UNITS = IS_PRODUCTION ? REAL_AD_UNITS : TEST_AD_UNITS;

// ─── Initialize AdMob ─────────────────────────────────────────────────────────
export const initAdMob = async () => {
    if (!Capacitor.isNativePlatform()) return; // Skip in browser dev mode
    try {
        await AdMob.initialize({
            initializeForTesting: !IS_PRODUCTION,
            testingDevices: [],
        });
        console.log(`[AdMob] Initialized in ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
        await showBanner();
    } catch (e) {
        console.warn('[AdMob] Init failed:', e);
    }
};

// ─── Banner Ad ────────────────────────────────────────────────────────────────
// Persistent bottom banner — passive income during any session length
export const showBanner = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await AdMob.showBanner({
            adId: AD_UNITS.banner,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: !IS_PRODUCTION,
        });
        console.log('[AdMob] Banner shown');
    } catch (e) {
        console.warn('[AdMob] Banner failed:', e);
    }
};

// ─── Interstitial Ad ──────────────────────────────────────────────────────────
// Shown between games (after reset) — natural high-value breakpoint
export const showInterstitial = async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        await AdMob.prepareInterstitial({
            adId: AD_UNITS.interstitial,
            isTesting: !IS_PRODUCTION,
        });
        await AdMob.showInterstitial();
        console.log('[AdMob] Interstitial shown');
        return true;
    } catch (e) {
        console.warn('[AdMob] Interstitial failed:', e);
        return false;
    }
};

// ─── Rewarded Ad ──────────────────────────────────────────────────────────────
// User watches to unlock T50 Mode — highest eCPM ad type
// Returns true if the user completed the video and earns the reward
export const showRewardedAd = async () => {
    if (!Capacitor.isNativePlatform()) {
        // In browser, simulate reward so developer can test the feature flow
        console.log('[AdMob] Browser mode — simulating rewarded ad success');
        return true;
    }
    try {
        await AdMob.prepareRewardVideoAd({
            adId: AD_UNITS.rewarded,
            isTesting: !IS_PRODUCTION,
        });
        const result = await AdMob.showRewardVideoAd();
        const earned = result?.reward?.amount > 0;
        console.log(`[AdMob] Rewarded ad completed. Reward earned: ${earned}`);
        return earned;
    } catch (e) {
        console.warn('[AdMob] Rewarded ad failed:', e);
        return false;
    }
};
