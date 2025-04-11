// block.js
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

function spawnBlock(scene, currentWordGroups, nextWordGroups, allPhrases) {
    console.log('spawnBlock called');
    if (!scene) return;
    try {
        if (dropIndex >= currentWordGroups.length) {
            if (nextWordGroups.length > 0) {
                currentWordGroups.push(nextWordGroups.shift());
            } else {
                nextWordGroups.push(...createLevelWordGroups(allPhrases));
            }
            dropIndex = currentWordGroups.length - 1;
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
        currentText = scene.add.text(startX, startY, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);

        updatePreview(); // Update preview to show the next 4 groups

        isDropping = true;
        const landingGridY = findLandingY(startX);
        const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        const dropDurations = { 1: 30000, 2: 25000, 3: 20000, 4: 15000 };
        scene.tweens.add({
            targets: [currentBlock, currentText],
            y: landingY,
            duration: dropDurations[level],
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

        checkForScoring(gridY);
        dropIndex++;
        spawnBlock(sceneRef, currentWordGroups, nextWordGroups, allPhrases);
    } catch (error) {
        console.error('Error in lockBlock:', error);
    }
}

function isValidMove(newX) {
    const gridX = getGridPosition(newX);
    return gridX >= 0 && gridX < GRID_WIDTH;
}