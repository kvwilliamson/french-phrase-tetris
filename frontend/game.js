// [Your existing Phaser script include in index.html remains unchanged]

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Grid constants
const BLOCK_SIZE = 30; // Reduced from 40 to 30
const GRID_WIDTH = 8;
const GRID_HEIGHT = 20; // Adjusted to 20 per plan.md
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_SIZE; // 240px
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_SIZE; // 600px
const GRID_START_X = (800 - GRID_WIDTH_PX) / 2; // Center: (800-240)/2 = 280
const GRID_START_Y = 50; // Moved down to leave space for title/score

// Game variables
let currentBlock;
let currentText;
let isDropping = false;
let lastMoveTime = 0;
const MOVE_DELAY = 100;
let grid;
let sceneRef;
let wordIndex = 0;
const WORDS = ["test1", "test2", "test3", "test4"];
let score = 0;
let scoreText;
const COLORS = [0x0000ff, 0xff00ff, 0xffff00, 0xff0000]; // Blue, Purple, Yellow, Red

function preload() {
    console.log('Game starting');
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
}

function create() {
    sceneRef = this;

    // Title bar
    this.add.text(400, 20, "French Phrase Tetris", {
        fontSize: '32px',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Scoreboard
    scoreText = this.add.text(750, 20, "Score: 0", {
        fontSize: '20px',
        color: '#ffffff'
    }).setOrigin(1, 0);

    // Grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xaaaaaa); // Darker gray for grid lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
        graphics.moveTo(GRID_START_X + x * BLOCK_SIZE, GRID_START_Y);
        graphics.lineTo(GRID_START_X + x * BLOCK_SIZE, GRID_START_Y + GRID_HEIGHT * BLOCK_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_SIZE);
        graphics.lineTo(GRID_START_X + GRID_WIDTH * BLOCK_SIZE, GRID_START_Y + y * BLOCK_SIZE);
    }
    graphics.strokePath();

    // Spawn first block
    spawnBlock();
}

function getGridPosition(x) {
    return Math.floor((x - GRID_START_X) / BLOCK_SIZE);
}

function isValidMove(newX) {
    const gridX = getGridPosition(newX);
    return gridX >= 0 && gridX < GRID_WIDTH;
}

function getGridY(y) {
    return Math.floor((y - GRID_START_Y) / BLOCK_SIZE);
}

function isPositionOccupied(gridX, gridY) {
    return gridY >= 0 && gridY < GRID_HEIGHT && grid[gridY][gridX] !== null;
}

function lockBlock() {
    const gridX = getGridPosition(currentBlock.x);
    const gridY = getGridY(currentBlock.y);
    
    grid[gridY][gridX] = { block: currentBlock, text: currentText };
    console.log(`Locked block at (${gridX}, ${gridY})`);
    
    score += 10;
    scoreText.setText(`Score: ${score}`);
    
    isDropping = false;
    currentBlock = null;
    currentText = null;
    
    spawnBlock();
}

function findLandingY(x) {
    const gridX = getGridPosition(x);
    let gridY = 0;
    while (gridY < GRID_HEIGHT) {
        if (isPositionOccupied(gridX, gridY)) {
            return gridY - 1;
        }
        gridY++;
    }
    return GRID_HEIGHT - 1;
}

function spawnBlock() {
    if (!sceneRef) {
        console.error('Scene reference not set!');
        return;
    }

    const startX = GRID_START_X + Math.floor(GRID_WIDTH/2) * BLOCK_SIZE + BLOCK_SIZE/2;
    const startY = GRID_START_Y + BLOCK_SIZE/2;
    const spawnGridX = getGridPosition(startX);
    const spawnGridY = getGridY(startY);
    
    if (isPositionOccupied(spawnGridX, spawnGridY)) {
        console.log("Game Over!");
        sceneRef.tweens.killAll();
        return;
    }

    const color = COLORS[Math.floor(Math.random() * COLORS.length)]; // Random color
    currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_SIZE - 4, BLOCK_SIZE - 4, color); // Smaller block
    currentText = sceneRef.add.text(startX, startY, WORDS[wordIndex], {
        fontSize: '12px', // Reduced font size
        color: '#ffffff'
    }).setOrigin(0.5);

    isDropping = true;
    console.log(`Spawned block with ${WORDS[wordIndex]} at (${startX}, ${startY})`);

    const landingGridY = findLandingY(startX);
    const landingY = GRID_START_Y + landingGridY * BLOCK_SIZE + BLOCK_SIZE/2;

    sceneRef.tweens.add({
        targets: [currentBlock, currentText],
        y: landingY,
        duration: 10000,
        ease: 'Linear',
        onComplete: () => {
            console.log('Tween completed, locking block');
            lockBlock();
        }
    });
}

function update(time) {
    if (!currentBlock || !isDropping) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (time - lastMoveTime < MOVE_DELAY) return;

    if (cursors.left.isDown) {
        const newX = currentBlock.x - BLOCK_SIZE;
        if (isValidMove(newX)) {
            currentBlock.x = newX;
            currentText.x = newX;
            const landingGridY = findLandingY(newX);
            const landingY = GRID_START_Y + landingGridY * BLOCK_SIZE + BLOCK_SIZE/2;
            const currentTween = this.tweens.getTweensOf(currentBlock)[0];
            if (currentTween) {
                const progress = currentTween.progress;
                const remainingDuration = currentTween.duration * (1 - progress);
                currentTween.stop();
                this.tweens.add({
                    targets: [currentBlock, currentText],
                    y: landingY,
                    duration: remainingDuration,
                    ease: 'Linear',
                    onComplete: lockBlock
                });
            }
            lastMoveTime = time;
        }
    } else if (cursors.right.isDown) {
        const newX = currentBlock.x + BLOCK_SIZE;
        if (isValidMove(newX)) {
            currentBlock.x = newX;
            currentText.x = newX;
            const landingGridY = findLandingY(newX);
            const landingY = GRID_START_Y + landingGridY * BLOCK_SIZE + BLOCK_SIZE/2;
            const currentTween = this.tweens.getTweensOf(currentBlock)[0];
            if (currentTween) {
                const progress = currentTween.progress;
                const remainingDuration = currentTween.duration * (1 - progress);
                currentTween.stop();
                this.tweens.add({
                    targets: [currentBlock, currentText],
                    y: landingY,
                    duration: remainingDuration,
                    ease: 'Linear',
                    onComplete: lockBlock
                });
            }
            lastMoveTime = time;
        }
    }

    if (cursors.down.isDown) {
        const currentTween = this.tweens.getTweensOf(currentBlock)[0];
        if (currentTween) currentTween.timeScale = 5.0;
    } else {
        const currentTween = this.tweens.getTweensOf(currentBlock)[0];
        if (currentTween) currentTween.timeScale = 1.0;
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        wordIndex = (wordIndex + 1) % WORDS.length;
        currentText.setText(WORDS[wordIndex]);
        console.log(`Changed word to ${WORDS[wordIndex]}`);
    }
}

const game = new Phaser.Game(config);