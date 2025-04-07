const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Grid constants
const BLOCK_WIDTH = 110; // Increased by 10% from 100px
const BLOCK_HEIGHT = 20; // Maintains ~5:1 ratio (110/20 = 5.5:1)
const GRID_WIDTH = 8; // 8 columns
const GRID_HEIGHT = 20; // Rows
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_WIDTH; // 880px
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_HEIGHT; // 400px
let GRID_START_X; // Will be calculated dynamically
let GRID_START_Y = 40; // Space for title/score

// Preview frame constants
let PREVIEW_X; // Will be calculated dynamically
const PREVIEW_Y = 100; // Align with grid top
const PREVIEW_WORDS = 4; // Show 4 upcoming words

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
const COLORS = [
    0xffb6c1, // Light Pink
    0xe6e6fa, // Lavender
    0x98fb98, // Mint Green
    0xadd8e6  // Baby Blue
];
let previewBlocks = [];
let previewTexts = [];
let upcomingWords = [];
let titleText;
let scoreTextObj;

function preload() {
    console.log('Game starting');
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    // Initialize upcoming words
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        upcomingWords.push(WORDS[i % WORDS.length]);
    }
}

function create() {
    sceneRef = this;

    // Dynamically calculate positions based on canvas size
    GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = GRID_START_X + GRID_WIDTH_PX + 20; // 20px padding outside the grid

    // Title bar
    titleText = this.add.text(this.cameras.main.width / 2, 20, "French Phrase Tetris", {
        fontSize: '32px',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Scoreboard
    scoreTextObj = this.add.text(this.cameras.main.width - 50, 20, "Score: 0", {
        fontSize: '20px',
        color: '#ffffff'
    }).setOrigin(1, 0);

    // Grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xaaaaaa);
    for (let x = 0; x <= GRID_WIDTH; x++) {
        graphics.moveTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y);
        graphics.lineTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y + GRID_HEIGHT * BLOCK_HEIGHT);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + GRID_WIDTH * BLOCK_WIDTH, GRID_START_Y + y * BLOCK_HEIGHT);
    }
    graphics.strokePath();

    // Preview frame
    const previewGraphics = this.add.graphics();
    previewGraphics.lineStyle(1, 0xaaaaaa);
    for (let i = 0; i <= PREVIEW_WORDS; i++) {
        previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
        previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
    }
    previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y);
    previewGraphics.lineTo(PREVIEW_X, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    previewGraphics.moveTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y);
    previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    previewGraphics.strokePath();

    // Initialize preview blocks
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const x = PREVIEW_X + BLOCK_WIDTH / 2;
        const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        const text = this.add.text(x, y, upcomingWords[i], {
            fontSize: '12px',
            color: '#000000'
        }).setOrigin(0.5);
        previewBlocks.push(block);
        previewTexts.push(text);
    }

    // Spawn first block
    spawnBlock();

    // Handle window resize
    this.scale.on('resize', resize, this);
}

function resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Update grid position
    GRID_START_X = (width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = GRID_START_X + GRID_WIDTH_PX + 20;

    // Update title and score positions
    titleText.setPosition(width / 2, 20);
    scoreTextObj.setPosition(width - 50, 20);

    // Redraw grid
    const graphics = sceneRef.add.graphics();
    graphics.clear();
    graphics.lineStyle(1, 0xaaaaaa);
    for (let x = 0; x <= GRID_WIDTH; x++) {
        graphics.moveTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y);
        graphics.lineTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y + GRID_HEIGHT * BLOCK_HEIGHT);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + GRID_WIDTH * BLOCK_WIDTH, GRID_START_Y + y * BLOCK_HEIGHT);
    }
    graphics.strokePath();

    // Redraw preview frame
    const previewGraphics = sceneRef.add.graphics();
    previewGraphics.clear();
    previewGraphics.lineStyle(1, 0xaaaaaa);
    for (let i = 0; i <= PREVIEW_WORDS; i++) {
        previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
        previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
    }
    previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y);
    previewGraphics.lineTo(PREVIEW_X, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    previewGraphics.moveTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y);
    previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    previewGraphics.strokePath();

    // Update preview blocks positions
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const x = PREVIEW_X + BLOCK_WIDTH / 2;
        const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
        previewBlocks[i].setPosition(x, y);
        previewTexts[i].setPosition(x, y);
    }

    // Update current block position if it exists
    if (currentBlock && currentText) {
        const gridX = getGridPosition(currentBlock.x);
        currentBlock.x = GRID_START_X + gridX * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        currentText.x = currentBlock.x;
    }

    // Update locked blocks positions
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x]) {
                const newX = GRID_START_X + x * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                const newY = GRID_START_Y + y * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                grid[y][x].block.setPosition(newX, newY);
                grid[y][x].text.setPosition(newX, newY);
            }
        }
    }
}

function getGridPosition(x) {
    return Math.floor((x - GRID_START_X) / BLOCK_WIDTH);
}

function isValidMove(newX) {
    const gridX = getGridPosition(newX);
    return gridX >= 0 && gridX < GRID_WIDTH;
}

function getGridY(y) {
    return Math.floor((y - GRID_START_Y) / BLOCK_HEIGHT);
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
    scoreTextObj.setText(`Score: ${score}`);
    
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

function updatePreview() {
    // Update preview blocks with upcoming words
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        previewTexts[i].setText(upcomingWords[i]);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        previewBlocks[i].setFillStyle(color);
    }
}

function spawnBlock() {
    if (!sceneRef) {
        console.error('Scene reference not set!');
        return;
    }

    const startX = GRID_START_X + Math.floor(GRID_WIDTH/2) * BLOCK_WIDTH + BLOCK_WIDTH/2;
    const startY = GRID_START_Y + BLOCK_HEIGHT/2;
    const spawnGridX = getGridPosition(startX);
    const spawnGridY = getGridY(startY);
    
    if (isPositionOccupied(spawnGridX, spawnGridY)) {
        console.log("Game Over!");
        sceneRef.tweens.killAll();
        return;
    }

    // Use the first upcoming word
    const word = upcomingWords.shift();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
    currentText = sceneRef.add.text(startX, startY, word, {
        fontSize: '12px',
        color: '#000000'
    }).setOrigin(0.5);

    // Add a new word to the end of upcomingWords
    upcomingWords.push(WORDS[wordIndex]);
    wordIndex = (wordIndex + 1) % WORDS.length;

    // Update preview
    updatePreview();

    isDropping = true;
    console.log(`Spawned block with ${word} at (${startX}, ${startY})`);

    const landingGridY = findLandingY(startX);
    const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT/2;

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
        const newX = currentBlock.x - BLOCK_WIDTH;
        if (isValidMove(newX)) {
            currentBlock.x = newX;
            currentText.x = newX;
            const landingGridY = findLandingY(newX);
            const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT/2;
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
        const newX = currentBlock.x + BLOCK_WIDTH;
        if (isValidMove(newX)) {
            currentBlock.x = newX;
            currentText.x = newX;
            const landingGridY = findLandingY(newX);
            const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT/2;
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
        // Find the current word's index in WORDS
        let currentWordIndex = WORDS.indexOf(currentText.text);
        currentWordIndex = (currentWordIndex + 1) % WORDS.length;
        currentText.setText(WORDS[currentWordIndex]);
        console.log(`Changed word to ${WORDS[currentWordIndex]}`);
    }
}

const game = new Phaser.Game(config);