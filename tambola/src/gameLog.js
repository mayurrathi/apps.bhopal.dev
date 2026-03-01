/**
 * gameLog.js
 * Immutable, append-only game event log for audit trails and dispute resolution.
 * Stored in localStorage — no server required.
 */

const LOG_KEY = 'tambola_game_log';
const MAX_ENTRIES = 500; // Keep last 500 events to prevent storage bloat

/**
 * Event types for the game log.
 */
export const EVENT = {
    GAME_START: 'game_start',
    GAME_RESET: 'game_reset',
    NUMBER_CALLED: 'number_called',
    CLAIM_ATTEMPT: 'claim_attempt',
    CLAIM_VALID: 'claim_valid',
    CLAIM_BOGEY: 'claim_bogey',
    TICKET_GENERATED: 'ticket_generated',
    AUTO_DAUB_TOGGLE: 'auto_daub_toggle',
};

/**
 * Get all log entries.
 * @returns {Array<{event: string, data: object, timestamp: string}>}
 */
export const getLog = () => {
    try {
        const stored = localStorage.getItem(LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Append an event to the immutable log.
 * @param {string} event - Event type from EVENT constants
 * @param {object} data - Event-specific data
 */
export const logEvent = (event, data = {}) => {
    const log = getLog();
    log.push({
        event,
        data,
        timestamp: new Date().toISOString(),
    });

    // Trim to max entries (keep most recent)
    const trimmed = log.slice(-MAX_ENTRIES);

    try {
        localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.warn('[GameLog] Failed to save:', e);
    }
};

/**
 * Get events for the current game session (since last GAME_START).
 */
export const getCurrentSessionLog = () => {
    const log = getLog();
    const lastStart = log.findLastIndex(e => e.event === EVENT.GAME_START);
    return lastStart >= 0 ? log.slice(lastStart) : log;
};

/**
 * Get summary stats from the log.
 */
export const getLogStats = () => {
    const log = getLog();
    return {
        totalGames: log.filter(e => e.event === EVENT.GAME_START).length,
        totalClaims: log.filter(e => e.event === EVENT.CLAIM_VALID).length,
        totalBogeys: log.filter(e => e.event === EVENT.CLAIM_BOGEY).length,
        totalNumbers: log.filter(e => e.event === EVENT.NUMBER_CALLED).length,
    };
};

/**
 * Clear entire log (for testing only).
 */
export const clearLog = () => {
    localStorage.removeItem(LOG_KEY);
};
