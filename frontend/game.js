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
const GRID_WIDTH = 8;
const GRID_HEIGHT = 20;
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_WIDTH;
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_HEIGHT;
let GRID_START_X;
let GRID_START_Y = 340;

// Preview frame constants
let PREVIEW_X;
const PREVIEW_Y = 80;
const PREVIEW_WORDS = 4;

// Font size
const FONT_SIZE = 15;

// Word lists for each part of speech
const NOUNS = ["maison", "chien", "chat", "arbre", "livre", "école", "voiture", "fleur", "soleil", "rivière", /* ... */];
const VERBS = ["manger", "courir", "parler", "écrire", "lire", "danser", "chanter", "jouer", "dormir", "aimer", /* ... */];
const ADJECTIVES = ["grand", "petit", "beau", "joli", "rapide", "lent", "heureux", "triste", "chaud", "froid", /* ... */];
const ARTICLES = ["le", "la", "l’", "un", "une", "les", "des", "du", "de la", "de l’", /* ... */];
const PRONOUNS = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "on", "moi"];
const ADVERBS = ["vite", "bien", "mal", "très", "peu", "trop", "souvent", "rarement", "toujours", "jamais", /* ... */];
const PREPOSITIONS = ["à", "de", "en", "pour", "avec", "sans", "sur", "sous", "dans", "chez", /* ... */];
const OTHERS = ["et", "ou", "mais", "car", "donc", "si", "quand", "comme", "que", "ni", /* ... */];
const BLANK = [""];

// Parts of speech and colors
const PARTS_OF_SPEECH = ["Article", "Noun", "Verb", "Adjective", "Pronoun", "Adverb", "Preposition", "Other", "Blank"];
const COLORS = [0x98fb98, 0xffb6c1, 0xe6e6fa, 0xadd8e6, 0xffa500, 0x800080, 0x008080, 0x808080, 0x808080];

// Probabilities (not used for generation now, but kept for reference)
const PROBABILITIES = [
    { part: "Article", prob: 0.15 },
    { part: "Noun", prob: 0.20 },
    { part: "Verb", prob: 0.15 },
    { part: "Adjective", prob: 0.10 },
    { part: "Pronoun", prob: 0.10 },
    { part: "Adverb", prob: 0.05 },
    { part: "Preposition", prob: 0.12 },
    { part: "Other", prob: 0.03 },
    { part: "Blank", prob: 0.10 }
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
let upcomingGroup = [];
let currentGroup = [];
let currentWordIndex = 0;
let titleText;
let scoreTextObj;
let previewLabel;
const checkedPhrases = new Set();
let allPhrases = [];
let currentWordGroups = [];
let nextWordGroups = [];
let dropIndex = 0;
let gameStarted = false;
let startMessageText;

// Helper functions
function shuffle(array) {
    const shuffled = array.slice(); // Create a copy to avoid modifying the original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled;
}

function selectAndShufflePhrases() {
    const selected = [];
    const indices = [];
    
    // Randomly select 4 unique indices from allPhrases
    while (indices.length < 4) {
        const index = Math.floor(Math.random() * allPhrases.length);
        if (!indices.includes(index)) {
            indices.push(index);
        }
    }
    
    // Process each selected phrase
    for (let i = 0; i < 4; i++) {
        const phrase = allPhrases[indices[i]];
        
        // Verify that phrase is an array
        if (!Array.isArray(phrase)) {
            console.error('Phrase is not an array at index', indices[i], ':', phrase);
            continue; // Skip invalid phrases
        }
        
        // Shuffle the array directly and add to selected
        selected.push(shuffle(phrase));
    }
    
    return selected;
}

function getPartForWord(word) {
    if (word === "{Blank}") return "Blank";
    if (NOUNS.includes(word)) return "Noun";
    if (VERBS.includes(word)) return "Verb";
    if (ARTICLES.includes(word)) return "Article";
    if (ADJECTIVES.includes(word)) return "Adjective";
    if (PRONOUNS.includes(word)) return "Pronoun";
    if (ADVERBS.includes(word)) return "Adverb";
    if (PREPOSITIONS.includes(word)) return "Preposition";
    if (OTHERS.includes(word)) return "Other";
    return "Other";
}

function createWordGroups(shuffledPhrases) {
    const wordGroups = [];
    for (let i = 0; i < 8; i++) {
        const group = [];
        for (let j = 0; j < 4; j++) {
            const word = shuffledPhrases[j][i];
            const part = getPartForWord(word);
            group.push({ part, word });
        }
        wordGroups.push(group);
    }
    return wordGroups;
}

function generateInitialWordGroups() {
    const shuffledPhrases = selectAndShufflePhrases();
    currentWordGroups = createWordGroups(shuffledPhrases);
    const nextShuffledPhrases = selectAndShufflePhrases();
    nextWordGroups = createWordGroups(nextShuffledPhrases);
    dropIndex = 0;
}

function getColorForPart(part) {
    const index = PARTS_OF_SPEECH.indexOf(part);
    return COLORS[index];
}

async function validatePhrase(words) {
    const phrase = words.join(" ");
    if (checkedPhrases.has(phrase)) return false;
    try {
        const response = await fetch('http://localhost:3001/validate-phrase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phrase })
        });
        const data = await response.json();
        if (!data.isValid) {
            checkedPhrases.add(phrase);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error validating phrase:', error);
        checkedPhrases.add(phrase);
        return false;
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    speechSynthesis.speak(utterance);
}

function clearRow(row) {
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
                sceneRef.tweens.add({
                    targets: [block, text],
                    y: GRID_START_Y + (y + 1) * BLOCK_HEIGHT + BLOCK_HEIGHT / 2,
                    duration: 300,
                    ease: 'Linear'
                });
            }
        }
    }
}

function clearColumnBlocks(col, startRow, count) {
    for (let y = startRow; y < startRow + count; y++) {
        if (grid[y][col]) {
            grid[y][col].block.destroy();
            grid[y][col].text.destroy();
            grid[y][col] = null;
        }
    }
}

async function checkForScoring() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        let filledCount = 0;
        const words = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x]) {
                filledCount++;
                words.push(grid[y][x].text.text);
            }
        }
        if (filledCount === GRID_WIDTH) {
            const isValid = await validatePhrase(words);
            if (isValid) {
                score += 100;
                scoreTextObj.setText(`Score: ${score}`);
                speak("Bravo");
                clearRow(y);
            }
        }
    }
    for (let x = 0; x < GRID_WIDTH; x++) {
        let consecutiveCount = 0;
        let startRow = -1;
        const words = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            if (grid[y][x]) {
                if (consecutiveCount === 0) startRow = y;
                consecutiveCount++;
                words.push(grid[y][x].text.text);
            } else {
                consecutiveCount = 0;
                words.length = 0;
            }
            if (consecutiveCount === 4) {
                const isValid = await validatePhrase(words.slice(-4));
                if (isValid) {
                    score += 50;
                    scoreTextObj.setText(`Score: ${score}`);
                    speak("Excellent");
                    clearColumnBlocks(x, startRow, 4);
                }
                break;
            }
        }
    }
}

function preload() {
    console.log('Game starting');
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    this.load.json('phrases', 'phrases.json');
}

function create() {
    sceneRef = this;
    GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 50;
    titleText = this.add.text(this.cameras.main.width / 2, 20, "Tetris de Phrases Françaises", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    scoreTextObj = this.add.text(this.cameras.main.width / 2, 60, "Score: 0", { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
    previewLabel = this.add.text(50, 60, "Prochaine Mots", { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);

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

    allPhrases = this.cache.json.get('phrases');
    console.log('Loaded phrases:', allPhrases);
    generateInitialWordGroups();
    console.log('Current word groups:', currentWordGroups);

    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const x = PREVIEW_X + BLOCK_WIDTH / 2;
        const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
        const { part, word } = currentWordGroups[0][i];
        const color = getColorForPart(part);
        const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        const text = this.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: `${FONT_SIZE}px`, color: '#000000' }).setOrigin(0.5);
        previewBlocks.push(block);
        previewTexts.push(text);
    }

    startMessageText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Appuyez sur Entrée pour commencer le jeu", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.input.keyboard.on('keydown-ENTER', function () {
        if (!gameStarted) {
            gameStarted = true;
            startMessageText.destroy();
            spawnBlock();
        }
    });

    this.scale.on('resize', resize, this);
}

function resize(gameSize) {
    const width = gameSize.width;
    GRID_START_X = (width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 50;
    titleText.setPosition(width / 2, 20);
    scoreTextObj.setPosition(width / 2, 60);
    previewLabel.setPosition(50, 60);

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

    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const x = PREVIEW_X + BLOCK_WIDTH / 2;
        const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
        previewBlocks[i].setPosition(x, y);
        previewTexts[i].setPosition(x, y);
    }

    if (currentBlock && currentText) {
        const gridX = getGridPosition(currentBlock.x);
        currentBlock.x = GRID_START_X + gridX * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        currentText.x = currentBlock.x;
    }

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

async function lockBlock() {
    const gridX = getGridPosition(currentBlock.x);
    const gridY = getGridY(currentBlock.y);
    grid[gridY][gridX] = { block: currentBlock, text: currentText };
    console.log(`Locked block at (${gridX}, ${gridY})`);
    isDropping = false;
    currentBlock = null;
    currentText = null;
    await checkForScoring();
    dropIndex++;
    if (dropIndex === 8) {
        currentWordGroups = nextWordGroups;
        nextWordGroups = createWordGroups(selectAndShufflePhrases());
        dropIndex = 0;
    }
    if (gameStarted) spawnBlock();
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

function updatePreview(group) {
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const { part, word } = group[i];
        const color = getColorForPart(part);
        previewBlocks[i].setFillStyle(color);
        previewTexts[i].setText(word === '{Blank}' ? '' : word);
    }
}

function spawnBlock() {
    if (!sceneRef) {
        console.error('Scene reference not set!');
        return;
    }
    const startX = GRID_START_X + Math.floor(GRID_WIDTH / 2) * BLOCK_WIDTH + BLOCK_WIDTH / 2;
    const startY = GRID_START_Y + BLOCK_HEIGHT / 2;
    const spawnGridX = getGridPosition(startX);
    const spawnGridY = getGridY(startY);
    if (isPositionOccupied(spawnGridX, spawnGridY)) {
        console.log("Game Over!");
        sceneRef.tweens.killAll();
        return;
    }
    currentGroup = currentWordGroups[dropIndex];
    currentWordIndex = 0;
    const { part, word } = currentGroup[currentWordIndex];
    const color = getColorForPart(part);
    currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
    currentText = sceneRef.add.text(startX, startY, word === '{Blank}' ? '' : word, { fontSize: `${FONT_SIZE}px`, color: '#000000' }).setOrigin(0.5);
    if (dropIndex < 7) {
        updatePreview(currentWordGroups[dropIndex + 1]);
    } else {
        updatePreview(nextWordGroups[0]);
    }
    isDropping = true;
    const landingGridY = findLandingY(startX);
    const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
    sceneRef.tweens.add({
        targets: [currentBlock, currentText],
        y: landingY,
        duration: 20000,
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
            const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
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
            const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
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
        currentWordIndex = (currentWordIndex + 1) % currentGroup.length;
        const { part, word } = currentGroup[currentWordIndex];
        currentText.setText(word === '{Blank}' ? '' : word);
        const newColor = getColorForPart(part);
        currentBlock.setFillStyle(newColor);
        console.log(`Changed word to ${word} (${part})`);
    }
}

const game = new Phaser.Game(config);