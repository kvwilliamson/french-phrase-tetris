// frontend/grid.js
let grid;
let score = 0;
let scoreTextObj;

function initializeGrid() {
    grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push(null);
        }
        grid.push(row);
    }
}

function drawGrid(graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    for (let x = 0; x <= GRID_WIDTH; x++) {
        graphics.moveTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y);
        graphics.lineTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y + GRID_HEIGHT_PX);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + GRID_WIDTH_PX, GRID_START_Y + y * BLOCK_HEIGHT);
    }
    graphics.strokePath();
}

function checkForScoring(gridY, scene, allPhrases) {
    console.log('checkForScoring called for row:', gridY);
    try {
        const row = grid[gridY];
        let isRowFull = true;
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (!row[x]) {
                isRowFull = false;
                break;
            }
        }
        if (!isRowFull) return;

        // Use currentPhrase from gameScene.js
        const correctPhrase = currentPhrase;
        let isCorrect = true;
        for (let x = 0; x < Math.min(GRID_WIDTH, correctPhrase.length); x++) {
            if (!row[x] || row[x].word !== correctPhrase[x]) {
                isCorrect = false;
                break;
            }
        }

        if (isCorrect) {
            console.log('Correct row detected');
            scene.sound.play('excellent');
            score += 100;
            scoreTextObj.setText(`Score: ${score}`);
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (row[x]) {
                    row[x].block.destroy();
                    row[x].text.destroy();
                    grid[gridY][x] = null;
                }
            }
            scene.sound.play('completionSound');
        } else {
            console.log('Incorrect row detected');
            scene.sound.play('wrongSound');
            scene.sound.play('merde');
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (row[x]) {
                    row[x].block.destroy();
                    row[x].text.destroy();
                    grid[gridY][x] = null;
                }
            }
        }
    } catch (error) {
        console.error('Error in checkForScoring:', error);
    }
}