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
            // Dramatic Flash: 3x 0.15s, bold, 16px
            const rowY = GRID_START_Y + gridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
            const flashText = scene.add.text(
                GRID_START_X + GRID_WIDTH_PX / 2,
                rowY,
                correctPhrase.join(' '),
                { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }
            ).setOrigin(0.5);
            flashText.setShadow(2, 2, '#000000', 2);
            scene.tweens.add({
                targets: flashText,
                alpha: 0,
                duration: 150,
                ease: 'Linear',
                repeat: 2,
                yoyo: true,
                onComplete: () => flashText.destroy()
            });
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
            // Show correct phrase under grid for 3s
            const textY = GRID_START_Y + GRID_HEIGHT_PX + 20;
            const errorText = scene.add.text(
                GRID_START_X + GRID_WIDTH_PX / 2,
                textY,
                correctPhrase.join(' '),
                { fontSize: '15px', color: '#ffffff' }
            ).setOrigin(0.5);
            errorText.setShadow(2, 2, '#000000', 2);
            scene.time.delayedCall(3000, () => errorText.destroy());
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