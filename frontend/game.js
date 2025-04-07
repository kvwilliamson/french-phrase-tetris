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
const BLOCK_WIDTH = 150;
const BLOCK_HEIGHT = 20;
const GRID_WIDTH = 8; // 8 columns
const GRID_HEIGHT = 20; // Rows
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_WIDTH; // 1200px
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_HEIGHT; // 400px
let GRID_START_X; // Will be calculated dynamically
let GRID_START_Y = 340; // Grid position

// Preview frame constants
let PREVIEW_X; // Will be calculated dynamically
const PREVIEW_Y = 80; // Moved under "Prochaine Mots" (60 + 20)
const PREVIEW_WORDS = 4; // Show 4 upcoming words

// Font size
const FONT_SIZE = 15;

// Parts of speech and colors
const WORDS = ["Noun", "Verb", "Article", "Adjective", "Other", ""]; // "" represents Blank
const COLORS = [
    0xffb6c1, // Noun: Light Pink
    0xe6e6fa, // Verb: Lavender
    0x98fb98, // Article: Mint Green
    0xadd8e6, // Adjective: Baby Blue
    0x808080, // Other: Gray
    0x808080  // Blank: Gray
];

// Probabilities for random selection
const PROBABILITIES = [
    { word: "Noun", prob: 0.28 },
    { word: "Verb", prob: 0.19 },
    { word: "Article", prob: 0.09 },
    { word: "Adjective", prob: 0.09 },
    { word: "Other", prob: 0.25 },
    { word: "", prob: 0.10 } // Blank
];

// Game variables
let currentBlock;
let currentText;
let isDropping = false;
let lastMoveTime = 0;
const MOVE_DELAY = 100;
let grid;
let sceneRef;
let score = 0;

let previewBlocks = [];
let previewTexts = [];
let upcomingWords = []; // Array of 4-word groups
let currentGroup = []; // Current group of 4 words being cycled
let currentWordIndex = 0; // Index within the current group
let titleText;
let scoreTextObj;
let previewLabel;

function preload() {
    console.log('Game starting');
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    // Initialize upcoming words (generate first group)
    upcomingWords = generateWordGroup();
}

function generateWordGroup() {
    const group = [];
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        group.push(generateRandomWord());
    }
    return group;
}

function generateRandomWord() {
    const rand = Math.random();
    let cumulativeProb = 0;
    for (const item of PROBABILITIES) {
        cumulativeProb += item.prob;
        if (rand <= cumulativeProb) {
            return item.word;
        }
    }
    return PROBABILITIES[PROBABILITIES.length - 1].word; // Fallback
}

function getColorForWord(word) {
    const index = WORDS.indexOf(word);
    return COLORS[index];
}

function create() {
    sceneRef = this;

    // Dynamically calculate positions based on canvas size
    GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 50; // Align with "Prochaine Mots" label

    // Title bar
    titleText = this.add.text(this.cameras.main.width / 2, 20, "Tetris de Phrases Françaises", {
        fontSize: '32px',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Scoreboard (centered under title)
    scoreTextObj = this.add.text(this.cameras.main.width / 2, 60, "Score: 0", {
        fontSize: '28px',
        color: '#ffffff'
    }).setOrigin(0.5);

    // Preview label (upper left)
    previewLabel = this.add.text(50, 60, "Prochaine Mots", {
        fontSize: '20px',
        color: '#ffffff'
    }).setOrigin(0, 0.5);

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
        const word = upcomingWords[i];
        const color = getColorForWord(word);
        const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        const text = this.add.text(x, y, word, {
            fontSize: `${FONT_SIZE}px`,
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
    PREVIEW_X = 50; // Fixed position under "Prochaine Mots"

    // Update title, score, and preview label positions
    titleText.setPosition(width / 2, 20);
    scoreTextObj.setPosition(width / 2, 60);
    previewLabel.setPosition(50, 60);

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
        const word = upcomingWords[i];
        previewTexts[i].setText(word);
        const color = getColorForWord(word);
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

    // Use the first group of upcoming words
    currentGroup = upcomingWords;
    currentWordIndex = 0;
    const word = currentGroup[currentWordIndex];
    const color = getColorForWord(word);
    currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
    currentText = sceneRef.add.text(startX, startY, word, {
        fontSize: `${FONT_SIZE}px`,
        color: '#000000'
    }).setOrigin(0.5);

    // Generate a new group for the next words
    upcomingWords = generateWordGroup();

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
        // Cycle through the current group of words
        currentWordIndex = (currentWordIndex + 1) % currentGroup.length;
        const newWord = currentGroup[currentWordIndex];
        currentText.setText(newWord);
        const newColor = getColorForWord(newWord);
        currentBlock.setFillStyle(newColor);
        console.log(`Changed word to ${newWord}`);
    }
}

const game = new Phaser.Game(config);