/**
 * TAMBOLA PRIZES DATA
 * 30 commonly used Tambola/Housie prize definitions.
 * Each prize has: id, name, category, icon, description, rules, and defaultEnabled flag.
 */

export const PRIZE_CATEGORIES = {
    line: 'Line Prizes',
    pattern: 'Pattern Prizes',
    early: 'Early Bird Prizes',
    full: 'Full House Prizes',
    special: 'Special Prizes',
};

export const DEFAULT_PRIZES = [
    // ─── LINE PRIZES ─────────────────────────────────────────────────────────────
    {
        id: 'first_line',
        name: 'First Line',
        category: 'line',
        icon: '1️⃣',
        description: 'Complete the top row of any ticket.',
        rules: 'The first player to mark off all 5 numbers in the first (top) row of their ticket wins. Host must verify the ticket before paying out.',
        defaultEnabled: true,
    },
    {
        id: 'second_line',
        name: 'Second Line',
        category: 'line',
        icon: '2️⃣',
        description: 'Complete the middle row of any ticket.',
        rules: 'The first player to mark off all 5 numbers in the second (middle) row of their ticket wins. Must be called before Full House is claimed.',
        defaultEnabled: true,
    },
    {
        id: 'third_line',
        name: 'Third Line',
        category: 'line',
        icon: '3️⃣',
        description: 'Complete the bottom row of any ticket.',
        rules: 'The first player to mark off all 5 numbers in the third (bottom) row of their ticket wins. Must be called before Full House is claimed.',
        defaultEnabled: true,
    },
    {
        id: 'any_line',
        name: 'Any Line',
        category: 'line',
        icon: '〰️',
        description: 'Complete any one full row first.',
        rules: 'The first player to complete any row (first, second, or third) on their ticket wins. Typically the first prize called in any game.',
        defaultEnabled: false,
    },
    {
        id: 'two_lines',
        name: 'Two Lines',
        category: 'line',
        icon: '📏',
        description: 'Complete any two rows on the same ticket.',
        rules: 'The first player to mark off all numbers in any two rows on a single ticket wins. Both rows must be on the same ticket.',
        defaultEnabled: false,
    },
    {
        id: 'top_bottom',
        name: 'Top & Bottom',
        category: 'line',
        icon: '↕️',
        description: 'Complete both the first and third rows.',
        rules: 'The first player to complete the first AND third rows on the same ticket wins. The middle row may have uncrossed numbers.',
        defaultEnabled: false,
    },

    // ─── EARLY BIRD PRIZES ────────────────────────────────────────────────────────
    {
        id: 'early_five',
        name: 'Early Five',
        category: 'early',
        icon: '🚀',
        description: 'First to mark 5 numbers on your ticket.',
        rules: 'The first player to mark any 5 numbers on their ticket (regardless of row) wins. Must be claimed within the first 15 numbers called.',
        defaultEnabled: true,
    },
    {
        id: 'early_seven',
        name: 'Lucky Seven',
        category: 'early',
        icon: '7️⃣',
        description: 'First to mark any 7 numbers on your ticket.',
        rules: 'The first player to mark any 7 numbers wins. Typically called within the first 20 numbers of the game.',
        defaultEnabled: false,
    },
    {
        id: 'first_number',
        name: 'First Number',
        category: 'early',
        icon: '⚡',
        description: 'Win if the very first number called is on your ticket.',
        rules: 'When the first number is announced, any player who has that number on their ticket immediately wins this prize.',
        defaultEnabled: false,
    },
    {
        id: 'breakfast',
        name: 'Breakfast',
        category: 'early',
        icon: '☕',
        description: 'First to mark a number in each column (1-9, 10-19, 20-29, 30-39, 40-49).',
        rules: 'Called the "Breakfast" prize. First player to have at least one marked number from each of the first 5 column groups wins.',
        defaultEnabled: false,
    },

    // ─── PATTERN PRIZES ───────────────────────────────────────────────────────────
    {
        id: 'four_corners',
        name: 'Four Corners',
        category: 'pattern',
        icon: '⬛',
        description: 'Mark the four corner numbers of your ticket.',
        rules: 'The first player to mark all four corner numbers of their ticket (top-left, top-right, bottom-left, bottom-right) wins.',
        defaultEnabled: true,
    },
    {
        id: 'center_piece',
        name: 'Bullseye',
        category: 'pattern',
        icon: '🎯',
        description: 'Mark the center number of your ticket.',
        rules: 'The first player to get the number in the exact center cell of their 3×9 ticket wins. Available only on standard 3-row tickets.',
        defaultEnabled: false,
    },
    {
        id: 'star',
        name: 'Star',
        category: 'pattern',
        icon: '⭐',
        description: 'Complete a star pattern (center + 4 corners).',
        rules: 'Mark the center cell and all four corners of the ticket. A beautiful luck-based prize that is very hard to win early.',
        defaultEnabled: false,
    },
    {
        id: 'cross',
        name: 'Cross (Plus)',
        category: 'pattern',
        icon: '➕',
        description: 'Complete a plus/cross pattern on your ticket.',
        rules: 'Mark the middle number of row 1, all 5 of row 2 (middle row), and the middle number of row 3. Forms a plus shape.',
        defaultEnabled: false,
    },
    {
        id: 'diagonals',
        name: 'Diagonals',
        category: 'pattern',
        icon: '✖️',
        description: 'Complete both diagonal lines across the ticket.',
        rules: 'Mark numbers forming an X pattern diagonally across the full ticket. One of the rarest patterns to achieve.',
        defaultEnabled: false,
    },
    {
        id: 'pyramid',
        name: 'Pyramid',
        category: 'pattern',
        icon: '🔺',
        description: 'Complete a pyramid pattern (1 top, 3 middle, 5 bottom).',
        rules: 'Mark 1 number from first row, 3 consecutive from second row, and all 5 of third row. Host must verify pattern before payout.',
        defaultEnabled: false,
    },

    // ─── FULL HOUSE PRIZES ────────────────────────────────────────────────────────
    {
        id: 'full_house',
        name: 'Full House',
        category: 'full',
        icon: '🏆',
        description: 'Mark all 15 numbers on your ticket. The ultimate prize!',
        rules: 'The first player to mark every single number on their ticket wins Full House. This is the grand prize and typically the largest payout. Game ends once declared.',
        defaultEnabled: true,
    },
    {
        id: 'second_full_house',
        name: 'Second Full House',
        category: 'full',
        icon: '🥈',
        description: 'The second player to complete their full ticket.',
        rules: 'Awarded to the second player who completes all 15 numbers on their ticket, immediately after the first Full House winner.',
        defaultEnabled: false,
    },
    {
        id: 'third_full_house',
        name: 'Third Full House',
        category: 'full',
        icon: '🥉',
        description: 'The third player to complete their full ticket.',
        rules: 'Awarded to the third player who completes all 15 numbers on their ticket. Host must collect and verify all three winning tickets.',
        defaultEnabled: false,
    },
    {
        id: 'half_sheet',
        name: 'Half Sheet',
        category: 'full',
        icon: '📄',
        description: 'Complete both tickets on a half-sheet booklet.',
        rules: 'If players use books of two tickets, the first player to complete both tickets wins Half Sheet — the jackpot equivalent for booklet games.',
        defaultEnabled: false,
    },

    // ─── SPECIAL PRIZES ───────────────────────────────────────────────────────────
    {
        id: 'lucky_dip',
        name: 'Lucky Dip',
        category: 'special',
        icon: '🎲',
        description: 'A random number is drawn — all players with that number win.',
        rules: 'At a designated point in the game, a special draw is made. Any player who has that number on their ticket (marked or not) wins a small Lucky Dip prize.',
        defaultEnabled: false,
    },
    {
        id: 'jaldi_five',
        name: 'Jaldi Five',
        category: 'special',
        icon: '🔥',
        description: 'Complete any single row in the first 10 numbers called.',
        rules: 'If any player completes an entire row in the first 10 numbers called, they win Jaldi Five. Extremely rare and high-reward.',
        defaultEnabled: false,
    },
    {
        id: 'progressive_jackpot',
        name: 'Progressive Jackpot',
        category: 'special',
        icon: '💰',
        description: 'Full House within a set number — jackpot builds each game.',
        rules: 'Host sets a target number (e.g., within 45 calls). If Full House is won before that number, the jackpot is awarded. Otherwise, it rolls to the next game.',
        defaultEnabled: false,
    },
    {
        id: 'host_special',
        name: "Host's Special",
        category: 'special',
        icon: '🎁',
        description: 'Custom prize defined by the host.',
        rules: 'The host defines the winning condition for this prize freely. Must announce the rules before the game starts. Common for birthdays or kitty parties.',
        defaultEnabled: false,
    },
    {
        id: 'odd_one_out',
        name: 'Odd One Out',
        category: 'special',
        icon: '🔢',
        description: 'First to mark 5 odd numbers on your ticket.',
        rules: 'First player to mark any 5 odd numbers (1, 3, 5, 7, etc.) on their ticket wins. Numbers must be actually called — pre-highlighted don\'t count.',
        defaultEnabled: false,
    },
    {
        id: 'even_steven',
        name: 'Even Steven',
        category: 'special',
        icon: '🔣',
        description: 'First to mark 5 even numbers on your ticket.',
        rules: 'First player to mark any 5 even numbers (2, 4, 6, 8, etc.) on their ticket wins.',
        defaultEnabled: false,
    },
    {
        id: 'sweet_16',
        name: 'Sweet 16',
        category: 'special',
        icon: '🎂',
        description: 'Win if number 16 is the first number called.',
        rules: 'If 16 is the very first number drawn, any player with 16 on their ticket wins Sweet 16. Great for birthday-themed games.',
        defaultEnabled: false,
    },
    {
        id: 'tombola',
        name: 'Tombola (Italian)',
        category: 'special',
        icon: '🇮🇹',
        description: 'Italian style — win for Ambo (2), Terna (3), Quaterna (4), Cinquina (5), Tombola (all).',
        rules: 'Classic Italian rules. Ambo: 2 numbers in a row. Terna: 3 in a row. Quaterna: 4 in a row. Cinquina: all 5 in a row. Tombola: all 15 numbers. Each claim must be announced immediately.',
        defaultEnabled: false,
    },
    {
        id: 'midnight_special',
        name: 'Midnight Special',
        category: 'special',
        icon: '🌙',
        description: 'First to mark number 12 AND number 21 on one ticket.',
        rules: 'First player to have both 12 and 21 marked on the same ticket wins. These are the "midnight" numbers (12:00 → 12, 21).',
        defaultEnabled: false,
    },
    {
        id: 'double_dip',
        name: 'Double Dip',
        category: 'special',
        icon: '🎭',
        description: 'First player to win two different prizes in the same game.',
        rules: 'If a single player wins any two prize categories in the same game, they receive a Double Dip bonus prize. Cannot be pre-targeted — happens organically.',
        defaultEnabled: false,
    },
    {
        id: 'late_latif',
        name: 'Late Latif',
        category: 'special',
        icon: '🐢',
        description: 'Win if the last number called completes your Full House.',
        rules: 'If the 90th number is what completes a Full House for you, you win Late Latif as a special consolation prize. Awarded even if someone else won Full House earlier.',
        defaultEnabled: false,
    },
    {
        id: 'full_house_under_40',
        name: 'Speed House',
        category: 'special',
        icon: '⚡',
        description: 'Full House completed before number 40 is called.',
        rules: 'If any player achieves Full House before the 40th number is announced, they win Speed House — a bonus prize on top of the regular Full House prize.',
        defaultEnabled: false,
    },
];

// Returns localStorage-persisted prizes, merged with any new defaults
export const loadPrizes = () => {
    try {
        const saved = localStorage.getItem('tambola_prizes');
        if (saved) {
            const savedMap = JSON.parse(saved);
            // Merge: respect saved enabled states, add newly added prizes
            return DEFAULT_PRIZES.map((p) => ({
                ...p,
                enabled: savedMap[p.id]?.enabled ?? p.defaultEnabled,
                claimed: savedMap[p.id]?.claimed ?? false,
                customName: savedMap[p.id]?.customName ?? null,
                winnerName: savedMap[p.id]?.winnerName ?? '',
            }));
        }
    } catch (e) {
        console.warn('Could not load prizes:', e);
    }
    return DEFAULT_PRIZES.map((p) => ({ ...p, enabled: p.defaultEnabled, claimed: false, customName: null, winnerName: '' }));
};

export const savePrizes = (prizes) => {
    try {
        const map = {};
        prizes.forEach((p) => { map[p.id] = { enabled: p.enabled, claimed: p.claimed, customName: p.customName, winnerName: p.winnerName || '' }; });
        localStorage.setItem('tambola_prizes', JSON.stringify(map));
    } catch (e) {
        console.warn('Could not save prizes:', e);
    }
};
