/**
 * ratingPrompt.js
 * Triggers an in-app rating prompt at peak user satisfaction moments.
 *
 * Strategy:
 *   - Track number of games played in localStorage.
 *   - After the 5th completed game, prompt for rating (once only).
 *   - On native (Capacitor), uses the App Store / Play Store native review API.
 *   - On web, shows a gentle prompt linking to the store listing (or dismissible).
 */

const RATING_KEY = 'tambola_rating_state';

const getState = () => {
    try {
        const stored = localStorage.getItem(RATING_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { }
    return { gamesPlayed: 0, prompted: false, dismissed: false };
};

const saveState = (state) => {
    try { localStorage.setItem(RATING_KEY, JSON.stringify(state)); } catch (e) { }
};

/**
 * Call this after each game completes (e.g. after "Full House" or board reset).
 * Returns true if a rating prompt should be shown.
 */
export const trackGameCompletion = () => {
    const state = getState();
    if (state.prompted) return false; // Already shown once

    state.gamesPlayed += 1;
    saveState(state);

    // Trigger after 5th game — peak satisfaction moment
    if (state.gamesPlayed >= 5) {
        return true;
    }
    return false;
};

/**
 * Mark that the prompt has been shown (so we don't spam).
 */
export const markPromptShown = () => {
    const state = getState();
    state.prompted = true;
    saveState(state);
};

/**
 * Mark that the user dismissed the prompt.
 */
export const markPromptDismissed = () => {
    const state = getState();
    state.dismissed = true;
    state.prompted = true;
    saveState(state);
};

/**
 * Try to trigger the native in-app review dialog.
 * Falls back to opening the store URL.
 */
export const requestNativeReview = async () => {
    try {
        // Check if Capacitor App plugin is available at runtime
        // (avoids hard build dependency on @capacitor/app)
        if (window.Capacitor?.Plugins?.App?.requestReview) {
            await window.Capacitor.Plugins.App.requestReview();
            return true;
        }
    } catch (e) {
        // Not on native or plugin not available — ignore
    }
    return false;
};

/**
 * Get the number of games played so far.
 */
export const getGamesPlayed = () => getState().gamesPlayed;
