/**
 * ticketGenerator.js
 * Generates valid standard Tambola/Housie 3x9 tickets.
 * Uses crypto.getRandomValues() for secure randomness.
 */

/**
 * Cryptographically secure random integer in [0, max).
 */
const secureRandom = (max) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
};

/**
 * Secure shuffle (Fisher-Yates) using crypto.
 */
const secureShuffle = (array) => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/**
 * Column ranges for standard Tambola:
 * Col 0: 1-9, Col 1: 10-19, ... Col 8: 80-90
 */
const RANGES = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
];

/**
 * Generate a single valid Tambola ticket.
 * Rules:
 * - 3 rows × 9 columns
 * - Each row has exactly 5 numbers and 4 blanks
 * - Each column has 1-3 numbers from its designated range
 * - No column is empty
 * - Numbers in each column are sorted ascending (top to bottom)
 */
export const generateTicket = () => {
    let valid = false;
    let grid = [];

    while (!valid) {
        grid = Array.from({ length: 3 }, () => Array(9).fill(0));
        const colCounts = Array(9).fill(0);
        const rowCounts = Array(3).fill(0);
        let items = 0;

        // Phase 1: Guarantee at least 1 number per column (9 items)
        for (let c = 0; c < 9; c++) {
            const r = secureRandom(3);
            grid[r][c] = 1;
            colCounts[c]++;
            rowCounts[r]++;
            items++;
        }

        // Phase 2: Add 6 more to reach 15 total (5 per row)
        let attempts = 0;
        while (items < 15 && attempts < 200) {
            const c = secureRandom(9);
            const r = secureRandom(3);
            if (grid[r][c] === 0 && rowCounts[r] < 5 && colCounts[c] < 3) {
                grid[r][c] = 1;
                colCounts[c]++;
                rowCounts[r]++;
                items++;
            }
            attempts++;
        }

        // Validate: exactly 15 items, 5 per row, no empty column
        if (items === 15 &&
            rowCounts.every(r => r === 5) &&
            colCounts.every(c => c >= 1)) {
            valid = true;
        }
    }

    // Phase 3: Fill structure with securely random sorted numbers
    for (let c = 0; c < 9; c++) {
        let count = 0;
        for (let r = 0; r < 3; r++) {
            if (grid[r][c] === 1) count++;
        }

        const [min, max] = RANGES[c];
        const pool = [];
        for (let i = min; i <= max; i++) pool.push(i);

        // Secure shuffle and take 'count' numbers, then sort ascending
        const selected = secureShuffle(pool).slice(0, count).sort((a, b) => a - b);

        let numIdx = 0;
        for (let r = 0; r < 3; r++) {
            if (grid[r][c] === 1) {
                grid[r][c] = selected[numIdx++];
            }
        }
    }

    return grid;
};

/**
 * Generate a set of 6 tickets where every number 1-90 appears exactly once.
 * This creates a complete "book" — perfect for family games.
 */
export const generateTicketSet = () => {
    // Create 6 valid tickets structure first
    const tickets = [];

    // Distribute all 90 numbers across 6 tickets
    // Each ticket: 3 rows × 9 cols, 5 numbers per row = 15 numbers
    // 6 tickets × 15 = 90 — exactly all numbers 1-90

    let validSet = false;

    while (!validSet) {
        // Build column pools
        const colPools = RANGES.map(([min, max]) => {
            const nums = [];
            for (let i = min; i <= max; i++) nums.push(i);
            return secureShuffle(nums);
        });

        // Distribute: each column's numbers split across 6 tickets
        // Col 0 has 9 nums → some tickets get 1, some get 2
        // Col 8 has 11 nums → some get 1, some get 2
        // Need to ensure each ticket row has exactly 5 numbers

        const ticketCols = Array.from({ length: 6 }, () => Array.from({ length: 9 }, () => []));

        // Distribute numbers from each column pool across 6 tickets
        for (let c = 0; c < 9; c++) {
            const pool = colPools[c];
            const perTicket = Math.floor(pool.length / 6);
            const extra = pool.length % 6;

            // Determine how many numbers each ticket gets from this column
            const counts = Array(6).fill(perTicket);
            const extraTickets = secureShuffle([0, 1, 2, 3, 4, 5]).slice(0, extra);
            extraTickets.forEach(t => counts[t]++);

            let idx = 0;
            for (let t = 0; t < 6; t++) {
                for (let k = 0; k < counts[t]; k++) {
                    ticketCols[t][c].push(pool[idx++]);
                }
                ticketCols[t][c].sort((a, b) => a - b);
            }
        }

        // Now build each ticket grid
        const builtTickets = [];
        let allValid = true;

        for (let t = 0; t < 6; t++) {
            const totalNums = ticketCols[t].reduce((s, col) => s + col.length, 0);
            if (totalNums !== 15) { allValid = false; break; }

            // Build 3x9 grid
            const grid = Array.from({ length: 3 }, () => Array(9).fill(0));

            // Place numbers: for each column, distribute to rows
            const rowCounts = [0, 0, 0];

            for (let c = 0; c < 9; c++) {
                const nums = ticketCols[t][c];
                if (nums.length === 0) { allValid = false; break; }

                if (nums.length === 3) {
                    // One per row
                    grid[0][c] = nums[0];
                    grid[1][c] = nums[1];
                    grid[2][c] = nums[2];
                    rowCounts[0]++;
                    rowCounts[1]++;
                    rowCounts[2]++;
                } else if (nums.length === 2) {
                    // Pick 2 rows (prefer rows with fewer numbers)
                    const rows = [0, 1, 2].sort((a, b) => rowCounts[a] - rowCounts[b]);
                    const chosen = rows.slice(0, 2).sort((a, b) => a - b);
                    grid[chosen[0]][c] = nums[0];
                    grid[chosen[1]][c] = nums[1];
                    rowCounts[chosen[0]]++;
                    rowCounts[chosen[1]]++;
                } else if (nums.length === 1) {
                    // Pick the row with fewest numbers
                    const rows = [0, 1, 2].sort((a, b) => rowCounts[a] - rowCounts[b]);
                    grid[rows[0]][c] = nums[0];
                    rowCounts[rows[0]]++;
                }
            }

            if (!allValid) break;

            // Validate rows have exactly 5
            if (!rowCounts.every(r => r === 5)) {
                allValid = false;
                break;
            }

            builtTickets.push(grid);
        }

        if (allValid && builtTickets.length === 6) {
            validSet = true;
            tickets.push(...builtTickets);
        }
    }

    return tickets;
};
