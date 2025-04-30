// frontend/block.js
let currentBlock;
let currentText;
let isDropping = false;
let lastMoveTime = 0;
let currentGroup = [];
let currentWordIndex = 0;
let dropIndex = 0;

function getGridPosition(x) {
    return Math.floor((x - GRID_START_X) / BLOCK_WIDTH);
}

function getGridY(y) {
    return Math.floor((y - GRID_START_Y) / BLOCK_HEIGHT);
}

function isPositionOccupied(gridX, gridY) {
    if (gridY < 0 || gridY >= GRID_HEIGHT || gridX < 0 || gridX >= GRID_WIDTH) return true;
    return !!grid[gridY][gridX];
}

function findLandingY(x) {
    const gridX = getGridPosition(x);
    let gridY = 0;
    while (gridY < GRID_HEIGHT) {
        if (isPositionOccupied(gridX, gridY)) {
            return gridY - 1 >= 0 ? gridY - 1 : -1;
        }
        gridY++;
    }
    return GRID_HEIGHT - 1;
}

function isValidMove(newX) {
    const gridX = getGridPosition(newX);
    if (gridX < 0 || gridX >= GRID_WIDTH) return false;
    const landingY = findLandingY(newX);
    return landingY >= 0;
}

function clearCurrentPhrase() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x] && grid[y][x].phraseId === currentPhraseId && !grid[y][x].isPermanent) {
                grid[y][x].block.destroy();
                grid[y][x].text.destroy();
                grid[y][x] = null;
                console.log(`Cleared block at grid[${y}][${x}], phraseId=${currentPhraseId}`);
            }
        }
    }
    currentWordGroups = [];
    dropIndex = 0;
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        for (let j = 0; j < PREVIEW_COLS; j++) {
            previewBlocks[i][j].setVisible(false);
            previewTexts[i][j].setText('');
        }
    }
    currentPhrase = [];
    currentPhraseBlocks = [];
    updatePreview();
    console.log('Cleared current phrase and Prochain Mots');
}

function clearGrid() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x]) {
                grid[y][x].block.destroy();
                grid[y][x].text.destroy();
                grid[y][x] = null;
            }
        }
    }
    initializeGrid();
    console.log('Grid cleared and reset to 20 rows');
}

function triggerGameOver(scene, score) {
    console.log(`triggerGameOver: score=${score}, scene exists=${!!scene}`);
    scene.tweens.killAll();
    isDropping = false;
    const gameOverText = scene.add.text(scene.cameras.main.width / 2, scene.cameras.main.height / 2, 'Game Over', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5).setDepth(10);
    gameOverText.setShadow(2, 2, '#000000', 2);
    if (themeMusic) themeMusic.stop();
    checkHighScore(scene, score);
}

function spawnBlock(scene, currentWordGroups, allPhrases) {
    console.log(`spawnBlock: dropIndex=${dropIndex}, currentGroups=${currentWordGroups.length}, isDropping=${isDropping}`);
    if (!scene) return;
    if (isDropping) {
        console.log('Skipping spawnBlock: block already dropping');
        return;
    }
    try {
        if (dropIndex >= currentWordGroups.length) {
            console.log('Waiting for lockBlock to load new phrase');
            return;
        }

        const startX = GRID_START_X + Math.floor(GRID_WIDTH / 2) * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        const startY = GRID_START_Y + BLOCK_HEIGHT / 2;
        const spawnGridX = getGridPosition(startX);
        const spawnGridY = getGridY(startY);
        if (isPositionOccupied(spawnGridX, spawnGridY)) {
            console.log('Spawn position occupied, game over');
            triggerGameOver(scene, totalScore);
            return;
        }
        currentGroup = currentWordGroups[dropIndex];
        currentWordIndex = 0;
        const { pos, word } = currentGroup[currentWordIndex];
        const color = getColorForPos(pos);
        console.log(`Spawning block: word=${word}, pos=${pos}, color=${color.toString(16)}, phraseId=${currentPhraseId}`);
        currentBlock = scene.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        currentText = scene.add.text(startX, startY, word === '{Blank}' ? '' : word, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);

        updatePreview();

        isDropping = true;
        const landingGridY = findLandingY(startX);
        if (landingGridY < 0) {
            console.log('Invalid spawn position, game over');
            triggerGameOver(scene, totalScore);
            return;
        }
        const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        // Calculate duration based on distance and constant speed
        const distance = landingY - startY;
        const baseSpeed = 20; // Pixels per second, tuned to match original 30s for 600 pixels at level 1
        const speedMultipliers = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5 };
        const speed = baseSpeed * (speedMultipliers[level] || 1);
        const duration = (distance / speed) * 1000; // Convert to milliseconds
        console.log(`Drop distance=${distance}, speed=${speed}, duration=${duration}ms`);
        scene.tweens.add({
            targets: [currentBlock, currentText],
            y: landingY,
            duration,
            ease: 'Linear',
            onComplete: lockBlock
        });
    } catch (error) {
        console.error('Error in spawnBlock:', error);
    }
}

function checkHighScore(scene, score) {
    console.log(`checkHighScore: currentScore=${score}, storedHighScore=${localStorage.getItem('highScore')}, scene exists=${!!scene}`);
    const currentScore = Number(score) || 0;
    const highScore = Number(localStorage.getItem('highScore')) || 0;
    console.log(`Parsed scores: currentScore=${currentScore}, highScore=${highScore}`);
    if (currentScore > highScore) {
        console.log(`New high score detected: ${currentScore} > ${highScore}`);
        try {
            scene.promptForHighScoreName(currentScore);
        } catch (error) {
            console.error('Error triggering promptForHighScoreName:', error);
        }
    } else {
        console.log(`No new high score: ${currentScore} <= ${highScore}`);
    }
}

function lockBlock() {
    console.log('lockBlock called');
    try {
        const gridX = getGridPosition(currentBlock.x);
        const gridY = getGridY(currentBlock.y);
        const isStacking = (grid[gridY][gridX] && grid[gridY][gridX].phraseId === currentPhraseId) ||
                          (gridY + 1 < GRID_HEIGHT && grid[gridY + 1][gridX] && grid[gridY + 1][gridX].phraseId === currentPhraseId);

        if (isStacking) {
            console.log(`Stacking detected at grid[${gridY}][${gridX}], phraseId=${currentPhraseId}`);
            sceneRef.sound.play('wrongSound');
            sceneRef.sound.play('merde');
            totalScore = Math.max(0, totalScore - 0);
            scoreTextObj.setText(`Score: ${totalScore}`);
            console.log(`Score deducted: ${totalScore}`);
            currentBlock.destroy();
            currentText.destroy();
            currentBlock = null;
            currentText = null;
            isDropping = false;

            // Determine the working row (lower block's row)
            let workingRow = gridY;
            if (gridY + 1 < GRID_HEIGHT && grid[gridY + 1][gridX] && grid[gridY + 1][gridX].phraseId === currentPhraseId) {
                workingRow = gridY + 1; // Lower block is in gridY+1
            }
            console.log(`Working row for stacking: ${workingRow}`);

            // Fill empty spaces in working row with gray blanks and mark permanent
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[workingRow][x]) {
                    grid[workingRow][x].isPermanent = true; // Existing blocks become permanent
                } else {
                    const blockX = GRID_START_X + x * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                    const blockY = GRID_START_Y + workingRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                    const blockObj = sceneRef.add.rectangle(blockX, blockY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, 0x808080); // Gray
                    const textObj = sceneRef.add.text(blockX, blockY, '', { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
                    grid[workingRow][x] = { 
                        block: blockObj, 
                        text: textObj, 
                        word: '{Blank}', 
                        phraseId: currentPhraseId, 
                        isPermanent: true 
                    };
                    console.log(`Added gray blank at grid[${workingRow}][${x}], phraseId=${currentPhraseId}`);
                }
            }

            loadNewPhrase();
            // Pre-populate in the row of the misplaced block (gridY)
            let targetRow = gridY;
            // Ensure targetRow is not permanent
            let hasPermanent = false;
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[targetRow][x] && grid[targetRow][x].isPermanent) {
                    hasPermanent = true;
                    break;
                }
            }
            if (hasPermanent) {
                // Fallback to lowest non-permanent row
                targetRow = GRID_HEIGHT - 1;
                while (targetRow >= 0) {
                    hasPermanent = false;
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        if (grid[targetRow][x] && grid[targetRow][x].isPermanent) {
                            hasPermanent = true;
                            break;
                        }
                    }
                    if (!hasPermanent) break;
                    targetRow--;
                }
            }
            if (targetRow < 0) {
                console.log('No space for pre-population, game over');
                triggerGameOver(sceneRef, totalScore);
                return;
            }
            // Clear non-permanent blocks in target row
            for (let i = 0; i < GRID_WIDTH; i++) {
                if (grid[targetRow][i] && !grid[targetRow][i].isPermanent) {
                    grid[targetRow][i].block.destroy();
                    grid[targetRow][i].text.destroy();
                    grid[targetRow][i] = null;
                }
            }
            const numPrePopulate = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }[level] || 0;
            for (let i = 0; i < numPrePopulate; i++) {
                const block = currentPhraseBlocks[i];
                const idx = block.position;
                const x = GRID_START_X + idx * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                const y = GRID_START_Y + targetRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                const color = getColorForPos(block.pos);
                const blockObj = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
                const text = sceneRef.add.text(x, y, block.word === '{Blank}' ? '' : block.word, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
                grid[targetRow][idx] = { block: blockObj, text, word: block.word, phraseId: currentPhraseId, isPermanent: false };
                console.log(`Pre-populated (new phrase): word=${block.word}, pos=${block.pos}, col=${idx}, row=${targetRow}, phraseId=${currentPhraseId}`);
            }
            currentWordGroups = currentPhraseBlocks.slice(numPrePopulate).map(block => [block]);
            dropIndex = 0;
            currentPhraseLength = currentWordGroups.length;
            console.log(`Initialized new phrase, length: ${currentPhraseLength}, blocks: ${currentPhraseBlocks.map(b => b.word).join(', ')}`);
            setupPreviewBlocks(PREVIEW_Y);
            drawPreviewFrame(previewGraphics, PREVIEW_Y);
            updatePreview();
            spawnBlock(sceneRef, currentWordGroups, allPhrases);
            return;
        }

        grid[gridY][gridX] = { 
            block: currentBlock, 
            text: currentText, 
            word: currentGroup[currentWordIndex].word, 
            phraseId: currentPhraseId,
            isPermanent: false
        };
        console.log(`Locked block: word=${currentGroup[currentWordIndex].word}, gridX=${gridX}, gridY=${gridY}, phraseId=${currentPhraseId}`);
        currentBlock = null;
        currentText = null;
        isDropping = false;

        // Check for game over (top row reached)
        if (gridY === 0) {
            console.log('Game Over: Block placed in top row (grid[0])');
            triggerGameOver(sceneRef, totalScore);
            return;
        }

        console.log('Playing placedSound');
        sceneRef.sound.play('placedSound');

        checkForScoring(gridY, sceneRef, allPhrases, () => {
            dropIndex++;
            if (dropIndex >= currentWordGroups.length) {
                localStorage.setItem('lastPhrase', JSON.stringify(currentPhrase));
                if (correctPhrasesCompleted >= 5 && level < 8) {
                    level = Math.min(level + 1, 8);
                    correctPhrasesCompleted = 0;
                    console.log(`Level up! New level: ${level}`);
                    levelText.setText(`Niveau: ${level}`);
                    clearGrid(); // Reset grid to 20 rows
                    const background = sceneRef.children.list.find(child => child.texture && child.texture.key.startsWith('background'));
                    if (background) {
                        background.setTexture(`background${level}`);
                        background.setDisplaySize(sceneRef.cameras.main.width, sceneRef.cameras.main.height);
                    }
                    if (themeMusic) themeMusic.stop();
                    try {
                        themeMusic = sceneRef.sound.add(`themeMusic${level}`, { loop: true, volume: 0.5 });
                        themeMusic.play();
                        console.log(`Playing themeMusic${level}`);
                    } catch (err) {
                        console.error(`Failed to load themeMusic${level}:`, err);
                    }
                }

                if (level === 8 && correctPhrasesCompleted >= 5) {
                    if (themeMusic) themeMusic.stop();
                    sceneRef.scene.start('ChampionScene', { score: totalScore });
                    return;
                }

                clearCurrentPhrase();
                loadNewPhrase();
                // Find lowest non-permanent row for pre-population
                let targetRow = GRID_HEIGHT - 1;
                while (targetRow >= 0) {
                    let hasPermanent = false;
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        if (grid[targetRow][x] && grid[targetRow][x].isPermanent) {
                            hasPermanent = true;
                            break;
                        }
                    }
                    if (!hasPermanent) break;
                    targetRow--;
                }
                if (targetRow < 0) {
                    console.log('No space for pre-population, game over');
                    triggerGameOver(sceneRef, totalScore);
                    return;
                }
                // Clear non-permanent blocks in target row
                for (let i = 0; i < GRID_WIDTH; i++) {
                    if (grid[targetRow][i] && !grid[targetRow][i].isPermanent) {
                        grid[targetRow][i].block.destroy();
                        grid[targetRow][i].text.destroy();
                        grid[targetRow][i] = null;
                    }
                }
                const numPrePopulate = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }[level] || 0;
                for (let i = 0; i < numPrePopulate; i++) {
                    const block = currentPhraseBlocks[i];
                    const idx = block.position;
                    const x = GRID_START_X + idx * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                    const y = GRID_START_Y + targetRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                    const color = getColorForPos(block.pos);
                    const blockObj = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
                    const text = sceneRef.add.text(x, y, block.word === '{Blank}' ? '' : block.word, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
                    grid[targetRow][idx] = { block: blockObj, text, word: block.word, phraseId: currentPhraseId, isPermanent: false };
                    console.log(`Pre-populated (new phrase): word=${block.word}, pos=${block.pos}, col=${idx}, row=${targetRow}, phraseId=${currentPhraseId}`);
                }
                currentWordGroups = currentPhraseBlocks.slice(numPrePopulate).map(block => [block]);
                dropIndex = 0;
                currentPhraseLength = currentWordGroups.length;
                console.log(`Initialized new phrase, length: ${currentPhraseLength}, blocks: ${currentPhraseBlocks.map(b => b.word).join(', ')}`);
                setupPreviewBlocks(PREVIEW_Y);
                drawPreviewFrame(previewGraphics, PREVIEW_Y);
                updatePreview();
                window.drawGrid(gridGraphics);
            }
            spawnBlock(sceneRef, currentWordGroups, allPhrases);
        });
    } catch (error) {
        console.error('Error in lockBlock:', error);
    }
}

function checkForScoring(gridY, scene, allPhrases, onComplete) {
    let row = grid[gridY];
    let allOccupied = true;
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (!row[x]) {
            allOccupied = false;
            break;
        }
    }
    if (!allOccupied) {
        onComplete();
        return;
    }

    let isCorrect = true;
    let scoreEarned = 100 * level;

    try {
        // First check for exact match
        let exactMatch = true;
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (row[x].word !== currentPhrase[x]) {
                exactMatch = false;
                break;
            }
        }

        // If not exact match, check for valid duplicate word swap
        if (!exactMatch) {
            // Create maps of word positions (case sensitive)
            let targetWordPositions = new Map();
            let playerWordPositions = new Map();

            // Record positions of words in both target and player phrases
            for (let x = 0; x < GRID_WIDTH; x++) {
                let targetWord = currentPhrase[x];
                let playerWord = row[x].word;

                // Use the words as-is (case sensitive)
                if (!targetWordPositions.has(targetWord)) {
                    targetWordPositions.set(targetWord, []);
                }
                targetWordPositions.get(targetWord).push(x);

                if (!playerWordPositions.has(playerWord)) {
                    playerWordPositions.set(playerWord, []);
                }
                playerWordPositions.get(playerWord).push(x);
            }

            // Check if all words appear the correct number of times
            isCorrect = true;
            for (let [word, targetPositions] of targetWordPositions) {
                let playerPositions = playerWordPositions.get(word) || [];
                
                // If the word doesn't appear the same number of times, it's wrong
                if (targetPositions.length !== playerPositions.length) {
                    isCorrect = false;
                    break;
                }

                // For words that appear exactly twice, allow position swapping
                if (targetPositions.length === 2 && playerPositions.length === 2) {
                    // Allow swapping only if it's not a capitalized word
                    if (word[0] === word[0].toUpperCase()) {
                        // Capitalized words must be in exact positions
                        if (targetPositions[0] !== playerPositions[0] || 
                            targetPositions[1] !== playerPositions[1]) {
                            isCorrect = false;
                            break;
                        }
                    }
                    // Otherwise, allow swapping for lowercase duplicates
                    continue;
                } else if (targetPositions.length === 1) {
                    // Single words must be in exact position
                    if (targetPositions[0] !== playerPositions[0]) {
                        isCorrect = false;
                        break;
                    }
                }
            }
        } else {
            isCorrect = true; // Keep exact match as correct
        }

        if (isCorrect) {
            scene.sound.play('excellent');
            scene.sound.play('completionSound');
            totalScore += scoreEarned;
            scoreTextObj.setText(`Score: ${totalScore}`);
            correctPhrasesCompleted++;
            console.log(`Correct phrase completed, total: ${correctPhrasesCompleted}`);

            if (level === 8 && correctPhrasesCompleted >= 5) {
                window.flashRowGridLines(gridY, scene, () => {
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        if (grid[gridY][x]) {
                            grid[gridY][x].block.destroy();
                            grid[gridY][x].text.destroy();
                            grid[gridY][x] = null;
                        }
                    }
                    // Stop current music
                    if (themeMusic) themeMusic.stop();
                    // Transition to champion scene
                    scene.scene.start('ChampionScene', { score: totalScore });
                });
                return;
            }

            window.flashRowGridLines(gridY, scene, () => {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (row[x]) {
                        scene.tweens.add({
                            targets: [row[x].block, row[x].text],
                            alpha: 0,
                            duration: 500,
                            onComplete: function() {
                                row[x].block.destroy();
                                row[x].text.destroy();
                                row[x] = null;
                            }
                        });
                    }
                }
                
                // Remove these duplicate sound plays
                // scene.sound.play('excellent');
                // scene.sound.play('completionSound');
                
                setTimeout(() => {
                    shiftBlocksDown(gridY);
                    onComplete();
                }, 600);
            });
        } else {
            console.log('Incorrect phrase placement - making permanent');
            // Make the row permanent
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (row[x]) {
                    row[x].isPermanent = true;
                }
            }
            scene.sound.play('wrongSound');
            scene.sound.play('merde');

            // Display the correct phrase below the grid
            const style = { font: '28px Arial', fill: '#000000', backgroundColor: '#ffffff' };
            const displayPhrase = currentPhrase.join(' ').trim();
            const text = scene.add.text(
                scene.cameras.main.width / 2, 
                GRID_START_Y + GRID_HEIGHT_PX + 40, 
                displayPhrase, 
                style
            ).setOrigin(0.5);
            text.setShadow(2, 2, '#000000', 2);

            // Fade out the text after 7 seconds
            scene.tweens.add({
                targets: text,
                alpha: 0,
                duration: 7000,
                onComplete: () => text.destroy()
            });

            onComplete();
        }
    } catch (error) {
        console.error('Error in checkForScoring:', error);
        onComplete();
    }
}

function shiftBlocksDown(clearedRow) {
    // Start from the cleared row and move upwards
    for (let y = clearedRow; y > 0; y--) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            // Move each block from the row above down one position
            if (grid[y - 1][x]) {
                // Update the grid position
                grid[y][x] = grid[y - 1][x];
                grid[y - 1][x] = null;

                // Move the visual elements
                const blockY = GRID_START_Y + y * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                grid[y][x].block.y = blockY;
                grid[y][x].text.y = blockY;
            } else {
                grid[y][x] = null;
            }
        }
    }

    // Clear the top row
    for (let x = 0; x < GRID_WIDTH; x++) {
        grid[0][x] = null;
    }

    // Redraw the grid lines if needed
    if (window.drawGrid && gridGraphics) {
        window.drawGrid(gridGraphics);
    }
}

// Exports
window.getGridPosition = getGridPosition;
window.findLandingY = findLandingY;
window.isValidMove = isValidMove;
window.spawnBlock = spawnBlock;
window.lockBlock = lockBlock;
window.checkForScoring = checkForScoring;
window.clearCurrentPhrase = clearCurrentPhrase;
window.clearGrid = clearGrid;
