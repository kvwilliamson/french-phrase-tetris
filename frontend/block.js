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
    return gridY >= 0 && gridY < GRID_HEIGHT && grid[gridY][gridX] !== null;
}

function findLandingY(x) {
    const gridX = getGridPosition(x);
    let gridY = 0;
    while (gridY < GRID_HEIGHT) {
        if (isPositionOccupied(gridX, gridY)) return gridY - 1;
        gridY++;
    }
    return GRID_HEIGHT - 1;
}

function spawnBlock(scene, currentWordGroups, allPhrases) {
    console.log(`spawnBlock: dropIndex=${dropIndex}, currentGroups=${currentWordGroups.length}`);
    if (!scene) return;
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
            scene.tweens.killAll();
            const gameOverText = scene.add.text(scene.cameras.main.width / 2, scene.cameras.main.height / 2, 'Game Over', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
            gameOverText.setShadow(2, 2, '#000000', 2);
            return;
        }
        currentGroup = currentWordGroups[dropIndex];
        currentWordIndex = 0;
        const { pos, word } = currentGroup[currentWordIndex];
        const color = getColorForPos(pos);
        console.log(`Spawning block: word=${word}, pos=${pos}, color=${color.toString(16)}`);
        currentBlock = scene.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        currentText = scene.add.text(startX, startY, word === '{Blank}' ? '' : word, { fontSize: '12px', color: '#000000' }).setOrigin(0.5);

        updatePreview();

        isDropping = true;
        const landingGridY = findLandingY(startX);
        const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        const baseDuration = 30000;
        const speedMultipliers = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5 };
        const duration = baseDuration / (speedMultipliers[level] || 1);
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

function lockBlock() {
    console.log('lockBlock called');
    try {
        const gridX = getGridPosition(currentBlock.x);
        const gridY = getGridY(currentBlock.y);
        grid[gridY][gridX] = { block: currentBlock, text: currentText, word: currentGroup[currentWordIndex].word };
        currentBlock = null;
        currentText = null;
        isDropping = false;

        console.log('Playing placedSound');
        sceneRef.sound.play('placedSound');

        checkForScoring(gridY, sceneRef, allPhrases);
        dropIndex++;

        if (dropIndex >= currentWordGroups.length) {
            localStorage.setItem('lastPhrase', JSON.stringify(currentPhrase));
            currentPhrase = [];
            currentPhraseBlocks = [];
            currentWordGroups = [];
            loadNewPhrase();
            const numPrePopulate = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 }[level] || 0;
            const bottomRow = GRID_HEIGHT - 1;
            for (let i = 0; i < GRID_WIDTH; i++) {
                if (grid[bottomRow][i]) {
                    grid[bottomRow][i].block.destroy();
                    grid[bottomRow][i].text.destroy();
                    grid[bottomRow][i] = null;
                }
            }
            for (let i = 0; i < numPrePopulate; i++) {
                const block = currentPhraseBlocks[i];
                const idx = block.position;
                const x = GRID_START_X + idx * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                const y = GRID_START_Y + bottomRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                const color = getColorForPos(block.pos);
                const blockObj = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
                const text = sceneRef.add.text(x, y, block.word === '{Blank}' ? '' : block.word, { fontSize: '12px', color: '#000000' }).setOrigin(0.5);
                grid[bottomRow][idx] = { block: blockObj, text, word: block.word };
                console.log(`Pre-populated (new phrase): word=${block.word}, pos=${block.pos}, col=${idx}`);
            }
            currentWordGroups = currentPhraseBlocks.slice(numPrePopulate).map(block => [block]);
            dropIndex = 0;
            currentPhraseLength = currentWordGroups.length;
            console.log(`Initialized new phrase, length: ${currentPhraseLength}, blocks: ${currentPhraseBlocks.map(b => b.word).join(', ')}`);
        }

        spawnBlock(sceneRef, currentWordGroups, allPhrases);
    } catch (error) {
        console.error('Error in lockBlock:', error);
    }
}

function checkForScoring(gridY, scene, allPhrases) {
    let row = grid[gridY];
    let allOccupied = true;
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (!row[x]) {
            allOccupied = false;
            break;
        }
    }
    if (!allOccupied) return;

    let isCorrect = true;
    let scoreEarned = 100 * level;
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (row[x].word !== currentPhrase[x]) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
        scene.sound.play('excellent');
        scene.sound.play('completionSound');
        const style = { font: 'bold 16px Arial', fill: '#ffffff' };
        const text = scene.add.text(scene.cameras.main.width / 2, GRID_START_Y + GRID_HEIGHT_PX + 40, 'Correcte!', style).setOrigin(0.5);
        text.setShadow(2, 2, '#000000', 2);
        scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 150,
            yoyo: true,
            repeat: 2,
            onComplete: () => text.destroy()
        });
        totalScore += scoreEarned;
        scoreTextObj.setText(`Score: ${totalScore}`);
    } else {
        scene.sound.play('wrongSound');
        scene.sound.play('merde');
        const style = { font: '18px Arial', fill: '#000000', backgroundColor: '#ffffff' };
        // Show correct phrase, replace {Blank} with ''
        const displayPhrase = currentPhrase.map(word => word === '{Blank}' ? '' : word).join(' ').trim();
        const text = scene.add.text(scene.cameras.main.width / 2, GRID_START_Y + GRID_HEIGHT_PX + 40, displayPhrase, style).setOrigin(0.5);
        text.setShadow(2, 2, '#000000', 2);
        scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 3000,
            onComplete: () => text.destroy()
        });
    }
    for (let x = 0; x < GRID_WIDTH; x++) {
        row[x].block.destroy();
        row[x].text.destroy();
        grid[gridY][x] = null;
    }
}

function isValidMove(newX) {
    const gridX = getGridPosition(newX);
    return gridX >= 0 && gridX < GRID_WIDTH;
}