/**
 * claimDetector.js
 * Detects winning patterns and validates claims on Tambola tickets.
 * Runs entirely client-side — no server needed.
 */

/**
 * Get all non-zero numbers from a ticket grid.
 * @param {number[][]} ticket - 3x9 grid
 * @returns {number[]}
 */
const getAllNumbers = (ticket) => ticket.flat().filter(n => n !== 0);

/**
 * Get non-zero numbers from a specific row.
 * @param {number[][]} ticket
 * @param {number} rowIndex - 0, 1, or 2
 * @returns {number[]}
 */
const getRowNumbers = (ticket, rowIndex) => ticket[rowIndex].filter(n => n !== 0);

/**
 * Get the four corner numbers of a ticket.
 * Corners = first and last non-zero numbers in top row and bottom row.
 * @param {number[][]} ticket
 * @returns {number[]}
 */
const getCornerNumbers = (ticket) => {
    const topRow = ticket[0];
    const bottomRow = ticket[2];

    const firstNonZero = (row) => row.find(n => n !== 0);
    const lastNonZero = (row) => [...row].reverse().find(n => n !== 0);

    return [
        firstNonZero(topRow),
        lastNonZero(topRow),
        firstNonZero(bottomRow),
        lastNonZero(bottomRow),
    ].filter(Boolean);
};

/**
 * Prize patterns and their detection logic.
 */
const PATTERNS = {
    earlyFive: {
        name: 'Early Five',
        emoji: '5️⃣',
        description: 'First 5 numbers marked',
        getRequired: (ticket) => getAllNumbers(ticket),
        minCount: 5,
    },
    topLine: {
        name: 'Top Line',
        emoji: '⬆️',
        description: 'All numbers in top row',
        getRequired: (ticket) => getRowNumbers(ticket, 0),
        minCount: null, // all required
    },
    middleLine: {
        name: 'Middle Line',
        emoji: '➡️',
        description: 'All numbers in middle row',
        getRequired: (ticket) => getRowNumbers(ticket, 1),
        minCount: null,
    },
    bottomLine: {
        name: 'Bottom Line',
        emoji: '⬇️',
        description: 'All numbers in bottom row',
        getRequired: (ticket) => getRowNumbers(ticket, 2),
        minCount: null,
    },
    fourCorners: {
        name: 'Four Corners',
        emoji: '🔲',
        description: 'All four corner numbers',
        getRequired: (ticket) => getCornerNumbers(ticket),
        minCount: null,
    },
    fullHouse: {
        name: 'Full House',
        emoji: '🏠',
        description: 'All 15 numbers marked',
        getRequired: (ticket) => getAllNumbers(ticket),
        minCount: null,
    },
};

/**
 * Detect which patterns are currently achieved on a ticket.
 * @param {number[][]} ticket - 3x9 grid
 * @param {Set<number>|object} markedNumbers - numbers the player has marked
 * @param {number[]} calledNumbers - numbers called by the host
 * @returns {{ patternId: string, name: string, emoji: string }[]}
 */
export const detectClaims = (ticket, markedNumbers, calledNumbers) => {
    const calledSet = new Set(calledNumbers);
    const achieved = [];

    for (const [patternId, pattern] of Object.entries(PATTERNS)) {
        const required = pattern.getRequired(ticket);

        if (patternId === 'earlyFive') {
            // Early Five: at least 5 ticket numbers have been called
            const markedCount = required.filter(n => calledSet.has(n)).length;
            if (markedCount >= 5) {
                achieved.push({ patternId, name: pattern.name, emoji: pattern.emoji });
            }
        } else {
            // All required numbers must be called
            const allCalled = required.every(n => calledSet.has(n));
            if (allCalled && required.length > 0) {
                achieved.push({ patternId, name: pattern.name, emoji: pattern.emoji });
            }
        }
    }

    return achieved;
};

/**
 * Validate a specific claim attempt.
 * @param {number[][]} ticket
 * @param {string} claimType - pattern ID (e.g. 'topLine', 'fullHouse')
 * @param {number[]} calledNumbers
 * @returns {{ valid: boolean, missingNumbers: number[] }}
 */
export const validateClaim = (ticket, claimType, calledNumbers) => {
    const calledSet = new Set(calledNumbers);
    const pattern = PATTERNS[claimType];

    if (!pattern) return { valid: false, missingNumbers: [] };

    const required = pattern.getRequired(ticket);

    if (claimType === 'earlyFive') {
        const called = required.filter(n => calledSet.has(n));
        if (called.length >= 5) return { valid: true, missingNumbers: [] };
        const missing = required.filter(n => !calledSet.has(n));
        return { valid: false, missingNumbers: missing.slice(0, 5 - called.length) };
    }

    const missing = required.filter(n => !calledSet.has(n));
    return { valid: missing.length === 0, missingNumbers: missing };
};

export { PATTERNS };
