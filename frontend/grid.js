// grid.js
let grid;
let score = 0;
let scoreTextObj;
let rowsCleared = 0;

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
            const rowPhrase = words.join(' ');
            const isValid = allPhrases.some(phraseData => phraseData.phrase.join(' ') === rowPhrase);

            if (isValid) {
                highlightRow(gridY, scene);
                console.log('Playing completionSound');
                scene.sound.play('completionSound');
                console.log('Playing excellent');
                scene.sound.play('excellent');
                score += 100 * level;
                scoreTextObj.setText("Score: " + score);
                clearRow(gridY, scene);
                rowsCleared++;
                if (rowsCleared >= 10) {
                    advanceLevel(scene);
                }
            } else {
                console.log('Playing wrongSound');
                scene.sound.play('wrongSound');
                console.log('Playing merde');
                scene.sound.play('merde');
                console.log('Invalid phrase in row:', rowPhrase);
            }
        }
    } catch (error) {
        console.error('Error in checkForScoring:', error);
    }
}

function highlightRow(row, scene) {
    const blocks = grid[row].map(cell => cell.block);
    const originalColors = blocks.map(block => block.fillColor);

    blocks.forEach(block => block.setFillStyle(0xffffff));
    scene.time.delayedCall(300, () => {
        blocks.forEach((block, idx) => block.setFillStyle(originalColors[idx]));
    });
}

function speakFrench(text, scene) {
    // No longer needed as a standalone function; audio is played directly in checkForScoring
    console.log(`French voice says: "${text}"`); // Kept for debugging
}

function advanceLevel(scene) {
    rowsCleared = 0;
    level++;
    if (level > 4) {
        scene.tweens.killAll();
        const winText = scene.add.text(scene.cameras.main.width / 2, scene.cameras.main.height / 2, 'Félicitations! Jeu Terminé!', { fontSize: '48px', color: '#00ff00' }).setOrigin(0.5);
        winText.setShadow(2, 2, '#000000', 2);
        return;
    }
    PREVIEW_COLS = level;
    PREVIEW_WORDS = level;
    const background = scene.children.list.find(child => child.texture && child.texture.key.startsWith('background'));
    background.setTexture(`background${level}`);
    themeMusic.stop();
    themeMusic = scene.sound.add(`themeMusic${level}`, { loop: true, volume: 0.5 });
    themeMusic.play();
    generateInitialWordGroups(allPhrases);
    setupPreviewBlocks();
    drawPreviewFrame(scene.previewGraphics);
}