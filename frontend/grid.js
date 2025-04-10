// grid.js
let grid;
let score = 0;
let scoreTextObj;

function initializeGrid() {
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    return grid;
}

function drawGrid(graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    for (let x = 0; x <= GRID_WIDTH; x++) {
        graphics.moveTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y);
        graphics.lineTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y + GRID_HEIGHT * BLOCK_HEIGHT);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + GRID_WIDTH * BLOCK_WIDTH, GRID_START_Y + y * BLOCK_HEIGHT);
    }
    graphics.strokePath();
}

function clearRow(row, scene) {
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[row][x]) {
            grid[row][x].block.destroy();
            grid[row][x].text.destroy();
            grid[row][x] = null;
        }
    }
    for (let y = row - 1; y >= 0; y--) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x]) {
                const block = grid[y][x].block;
                const text = grid[y][x].text;
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                scene.tweens.add({
                    targets: [block, text],
                    y: GRID_START_Y + (y + 1) * BLOCK_HEIGHT + BLOCK_HEIGHT / 2,
                    duration: 300,
                    ease: 'Linear'
                });
            }
        }
    }
}

function checkForScoring(gridY, scene, allPhrases) {
    console.log('checkForScoring called for row:', gridY);
    try {
        let row = grid[gridY];
        let words = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (row[x] && row[x].word) {
                words.push(row[x].word);
            }
        }
        if (words.length === GRID_WIDTH) {
            let isValid = validatePhrase(words, allPhrases);
            if (isValid) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (row[x]) {
                        row[x].block.destroy();
                        row[x].text.destroy();
                        row[x] = null;
                    }
                }
                score += 100;
                scoreTextObj.setText("Score: " + score);
                for (let y = gridY; y > 0; y--) {
                    grid[y] = grid[y - 1];
                }
                grid[0] = Array(GRID_WIDTH).fill(null);
            }
        }
    } catch (error) {
        console.error('Error in checkForScoring:', error);
    }
}