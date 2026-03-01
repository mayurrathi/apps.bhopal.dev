/**
 * profanityFilter.js
 * UGC compliance: filters abusive/offensive text from chat messages.
 * Apple App Store Guidelines require this for any UGC feature.
 */

// --- Extended word list (multi-language, covering English + Hindi slang) ---
const BLOCKED_WORDS = [
    // English
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cock', 'cunt', 'nigger',
    'nigga', 'faggot', 'fag', 'retard', 'whore', 'slut', 'bastard', 'damn',
    'piss', 'crap', 'twat', 'wanker', 'bollocks', 'arse',
    // Hindi slang (romanized)
    'madarchod', 'behenchod', 'chutiya', 'gaand', 'lund', 'bhosdi', 'randi',
    'harami', 'kamina', 'saala', 'gadha', 'ullu',
    // Leetspeak variants
    'f*ck', 'sh*t', 'b*tch', 'd*ck', 'a$$', 'f**k', 's**t',
];

// Build regex patterns for each word (case insensitive, word boundaries)
const PATTERNS = BLOCKED_WORDS.map(word => {
    // Escape special regex chars
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'gi');
});

/**
 * Check if text contains any blocked content.
 * @param {string} text
 * @returns {boolean}
 */
export const containsProfanity = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return PATTERNS.some(pattern => {
        pattern.lastIndex = 0; // reset regex state
        return pattern.test(lower);
    });
};

/**
 * Sanitize text by replacing blocked words with asterisks.
 * @param {string} text
 * @returns {string}
 */
export const sanitizeText = (text) => {
    if (!text) return '';
    let result = text;
    BLOCKED_WORDS.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        result = result.replace(regex, (match) => '*'.repeat(match.length));
    });
    return result;
};

/**
 * Check if a display name is appropriate.
 * @param {string} name
 * @returns {{ valid: boolean, reason?: string }}
 */
export const validateDisplayName = (name) => {
    if (!name || name.trim().length < 2) return { valid: false, reason: 'Name must be at least 2 characters.' };
    if (name.trim().length > 24) return { valid: false, reason: 'Name must be under 24 characters.' };
    if (containsProfanity(name)) return { valid: false, reason: 'Please choose an appropriate name.' };
    return { valid: true };
};
