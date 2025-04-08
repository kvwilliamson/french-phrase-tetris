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
const PREVIEW_Y = 80; // Under "Prochaine Mots"
const PREVIEW_WORDS = 4; // Show 4 upcoming words

// Font size
const FONT_SIZE = 15;

// Word lists for each part of speech
const NOUNS = [
    "maison", "chien", "chat", "arbre", "livre", "école", "voiture", "fleur", "soleil", "rivière",
    "montagne", "village", "jardin", "bureau", "table", "chaise", "ordinateur", "téléphone", "fenêtre", "porte",
    "route", "pont", "étoile", "lune", "océan", "plage", "prairie", "forêt", "chemin", "ciel",
    "temps", "amour", "rêve", "musique", "film", "histoire", "éventail", "bijou", "montre", "caméra",
    "vélo", "avion", "train", "bibliothèque", "magasin", "restaurant", "cinéma", "théâtre", "musée", "parc"
];

const VERBS = [
    "manger", "courir", "parler", "écrire", "lire", "danser", "chanter", "jouer", "dormir", "aimer",
    "voir", "écouter", "regarder", "travailler", "marcher", "sauter", "nager", "voler", "dessiner", "construire",
    "créer", "imaginer", "penser", "rêver", "étudier", "apprendre", "enseigner", "faire", "prendre", "venir",
    "sortir", "entrer", "monter", "descendre", "arriver", "partir", "sourire", "pleurer", "rire", "habiter",
    "frapper", "oublier", "chercher", "trouver", "raconter", "expliquer", "changer", "aider", "commencer", "terminer"
];

const ADJECTIVES = [
    "grand", "petit", "beau", "joli", "rapide", "lent", "heureux", "triste", "chaud", "froid",
    "nouveau", "vieux", "ancien", "moderne", "fort", "faible", "lumineux", "sombre", "clair", "obscur",
    "coloré", "terne", "élégant", "simple", "compliqué", "doux", "rugueux", "grandiose", "fragile", "solide",
    "vif", "calme", "agressif", "timide", "courageux", "paresseux", "intelligent", "stupide", "utile", "inutile",
    "riche", "pauvre", "chanceux", "malchanceux", "brillant", "éclatant", "mystérieux", "ouvert", "fermé", "amusant"
];

const ARTICLES = [
    "le", "la", "l’", "un", "une", "les", "des", "du", "de la", "de l’",
    "ce", "cet", "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes",
    "son", "sa", "ses", "notre", "nos", "votre", "vos", "leur", "leurs"
];

const PRONOUNS = [
    "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "on", "moi"
];

const ADVERBS = [
    "vite", "bien", "mal", "très", "peu", "trop", "souvent", "rarement", "toujours", "jamais",
    "autant", "hier", "aujourd’hui", "demain", "doucement", "rapidement", "fort", "lentement", "clairement", "simplement"
];

const PREPOSITIONS = [
    "à", "de", "en", "pour", "avec", "sans", "sur", "sous", "dans", "chez",
    "vers", "par", "contre", "malgré", "selon", "d’après", "versus", "auprès", "autour", "via"
];

const OTHERS = [
    "et", "ou", "mais", "car", "donc", "si", "quand", "comme", "que", "ni",
    "ensuite", "puis", "aussi", "toutefois", "cependant", "néanmoins", "enfin", "auparavant", "alors", "parce que",
    "afin", "d’ailleurs", "pourtant", "ainsi", "notamment", "en effet", "par conséquent", "effectivement", "ainsi que"
];

const BLANK = [""];

// Parts of speech and colors
const PARTS_OF_SPEECH = ["Article", "Noun", "Verb", "Adjective", "Pronoun", "Adverb", "Preposition", "Other", "Blank"];
const COLORS = [
    0x98fb98, // Article: Mint Green
    0xffb6c1, // Noun: Light Pink
    0xe6e6fa, // Verb: Lavender
    0xadd8e6, // Adjective: Baby Blue
    0xffa500, // Pronoun: Orange
    0x800080, // Adverb: Purple
    0x008080, // Preposition: Teal
    0xFFFAA0, // Other: pastel yellow
    0x808080  // Blank: Gray
];

// Probabilities for random selection
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
let upcomingGroup = []; // Array of { part, word } for the next group
let currentGroup = []; // Current group of { part, word } being cycled
let currentWordIndex = 0; // Index within the current group
let titleText;
let scoreTextObj;
let previewLabel;
const checkedPhrases = new Set(); // Track invalid phrases to avoid rechecking

function preload() {
    console.log('Game starting');
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    // Initialize upcoming words (generate first group)
    upcomingGroup = generateWordGroup();
}

function generateWordGroup() {
    const group = [];
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const part = generateRandomPart();
        const word = generateWordForPart(part);
        group.push({ part, word });
    }
    return group;
}

function generateRandomPart() {
    const rand = Math.random();
    let cumulativeProb = 0;
    for (const item of PROBABILITIES) {
        cumulativeProb += item.prob;
        if (rand <= cumulativeProb) {
            return item.part;
        }
    }
    return PROBABILITIES[PROBABILITIES.length - 1].part; // Fallback
}

function generateWordForPart(part) {
    let wordList;
    switch (part) {
        case "Article":
            wordList = ARTICLES;
            break;
        case "Noun":
            wordList = NOUNS;
            break;
        case "Verb":
            wordList = VERBS;
            break;
        case "Adjective":
            wordList = ADJECTIVES;
            break;
        case "Pronoun":
            wordList = PRONOUNS;
            break;
        case "Adverb":
            wordList = ADVERBS;
            break;
        case "Preposition":
            wordList = PREPOSITIONS;
            break;
        case "Other":
            wordList = OTHERS;
            break;
        case "Blank":
            wordList = BLANK;
            break;
        default:
            wordList = BLANK;
    }
    return wordList[Math.floor(Math.random() * wordList.length)];
}

function getColorForPart(part) {
    const index = PARTS_OF_SPEECH.indexOf(part);
    return COLORS[index];
}

// Simulated LLM validation (replace with actual API call in production)
function validatePhrase(words) {
    const phrase = words.join(" ");
    // Check if phrase has already been marked invalid
    if (checkedPhrases.has(phrase)) {
        return false;
    }

    // Simple rule-based validation for French phrases
    const parts = words.map(word => {
        if (word === "") return "Blank";
        if (NOUNS.includes(word)) return "Noun";
        if (VERBS.includes(word)) return "Verb";
        if (ADJECTIVES.includes(word)) return "Adjective";
        if (ARTICLES.includes(word)) return "Article";
        if (PRONOUNS.includes(word)) return "Pronoun";
        if (ADVERBS.includes(word)) return "Adverb";
        if (PREPOSITIONS.includes(word)) return "Preposition";
        if (OTHERS.includes(word)) return "Other";
        return "Unknown";
    });

    // Basic grammar rules for validation
    if (parts.length >= 2) {
        // Rule 1: Article + Noun
        if (parts[0] === "Article" && parts[1] === "Noun") return true;
        // Rule 2: Article + Noun + Adjective
        if (parts.length >= 3 && parts[0] === "Article" && parts[1] === "Noun" && parts[2] === "Adjective") return true;
        // Rule 3: Article + Noun + Verb
        if (parts.length >= 3 && parts[0] === "Article" && parts[1] === "Noun" && parts[2] === "Verb") return true;
        // Rule 4: Pronoun + Verb
        if (parts[0] === "Pronoun" && parts[1] === "Verb") return true;
    }

    // If no rules match, mark as invalid and add to checkedPhrases
    checkedPhrases.add(phrase);
    return false;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR'; // French language
    speechSynthesis.speak(utterance);
}

function clearRow(row) {
    // Clear the row
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[row][x]) {
            grid[row][x].block.destroy();
            grid[row][x].text.destroy();
            grid[row][x] = null;
        }
    }

    // Drop blocks above
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
    // Clear the specified blocks in the column
    for (let y = startRow; y < startRow + count; y++) {
        if (grid[y][col]) {
            grid[y][col].block.destroy();
            grid[y][col].text.destroy();
            grid[y][col] = null;
        }
    }
}

function checkForScoring() {
    // Check for filled rows
    for (let y = 0; y < GRID_HEIGHT; y++) {
        let filledCount = 0;
        const words = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x]) {
                filledCount++;
                words.push(grid[y][x].text.text);
            }
        }
        if (filledCount === GRID_WIDTH) { // Row is filled
            const isValid = validatePhrase(words);
            if (isValid) {
                score += 100;
                scoreTextObj.setText(`Score: ${score}`);
                speak("Bravo");
                clearRow(y);
            }
        }
    }

    // Check for four consecutive blocks in a column
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
                const isValid = validatePhrase(words.slice(-4));
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
        const { part, word } = upcomingGroup[i];
        const color = getColorForPart(part);
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
    
    isDropping = false;
    currentBlock = null;
    currentText = null;

    // Check for scoring conditions
    checkForScoring();
    
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
        const { part, word } = upcomingGroup[i];
        previewTexts[i].setText(word);
        const color = getColorForPart(part);
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
    currentGroup = upcomingGroup;
    currentWordIndex = 0;
    const { part, word } = currentGroup[currentWordIndex];
    const color = getColorForPart(part);
    currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
    currentText = sceneRef.add.text(startX, startY, word, {
        fontSize: `${FONT_SIZE}px`,
        color: '#000000'
    }).setOrigin(0.5);

    // Generate a new group for the next words
    upcomingGroup = generateWordGroup();

    // Update preview
    updatePreview();

    isDropping = true;
    console.log(`Spawned block with ${word} (${part}) at (${startX}, ${startY})`);

    const landingGridY = findLandingY(startX);
    const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT/2;

    sceneRef.tweens.add({
        targets: [currentBlock, currentText],
        y: landingY,
        duration: 20000, // Doubled from 10000 to 20000 (half speed)
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
        const { part, word } = currentGroup[currentWordIndex];
        currentText.setText(word);
        const newColor = getColorForPart(part);
        currentBlock.setFillStyle(newColor);
        console.log(`Changed word to ${word} (${part})`);
    }
}

const game = new Phaser.Game(config);