/**
 * ticketGenerator.js
 * Generates valid standard Tambola/Housie 3x9 tickets.
 */

export const generateTicket = () => {
    // A standard ticket is a 3x9 grid
    // Each row has exactly 5 numbers
    // Columns contain numbers from specific ranges: 
    // Col 0: 1-9, Col 1: 10-19, Col 2: 20-29 ... Col 8: 80-90

    let valid = false;
    let grid = [];

    const ranges = [
        [1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]
    ];

    // Generate valid structure
    while (!valid) {
        grid = Array.from({ length: 3 }, () => Array(9).fill(0));
        const colCounts = Array(9).fill(0);
        const rowCounts = Array(3).fill(0);
        let items = 0;

        // Ensure at least 1 number per column
        for (let c = 0; c < 9; c++) {
            let r = Math.floor(Math.random() * 3);
            grid[r][c] = 1;
            colCounts[c]++;
            rowCounts[r]++;
            items++;
        }

        // Add 6 more items randomly to satisfy the 15 items rule (5 per row)
        // Ensure no row has > 5 and no column has > 3 (max capacity)
        let attempts = 0;
        while (items < 15 && attempts < 100) {
            let c = Math.floor(Math.random() * 9);
            let r = Math.floor(Math.random() * 3);
            if (grid[r][c] === 0 && rowCounts[r] < 5 && colCounts[c] < 3) {
                grid[r][c] = 1;
                colCounts[c]++;
                rowCounts[r]++;
                items++;
            }
            attempts++;
        }

        if (items === 15 && rowCounts.every(r => r === 5)) {
            valid = true;
        }
    }

    // Fill the structure with random sorted numbers
    for (let c = 0; c < 9; c++) {
        let count = 0;
        for (let r = 0; r < 3; r++) {
            if (grid[r][c] === 1) count++;
        }

        // Pick 'count' random numbers from this column's range
        const [min, max] = ranges[c];
        const nums = [];
        for (let i = min; i <= max; i++) nums.push(i);
        // Shuffle and take 'count' elements
        const selected = nums.sort(() => Math.random() - 0.5).slice(0, count).sort((a, b) => a - b);

        let numIdx = 0;
        for (let r = 0; r < 3; r++) {
            if (grid[r][c] === 1) {
                grid[r][c] = selected[numIdx++];
            }
        }
    }

    return grid;
};
