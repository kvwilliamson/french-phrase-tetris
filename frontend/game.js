// Define the color scheme for each POS category (using French POS keys with your original pastel colors)
const posColors = {
    'Articles': 0xFFF9B0,     // Pastel Yellow (e.g., "le", "la")
    'Noms': 0xA3BFFA,         // Pastel Blue (e.g., "chien")
    'Pronoms': 0xBFDFFF,      // Lighter Pastel Blue (e.g., "je", "tu")
    'Verbes': 0xA8D5BA,       // Pastel Green (e.g., "marche")
    'Adverbes': 0xC2E8C6,     // Lighter Pastel Green (e.g., "bien")
    'Adjectifs': 0xFFE4B5,    // Pastel Peach (e.g., "joli")
    'Prépositions': 0xFFCC99, // Pastel Orange (e.g., "avec")
    'Other': 0xE6E6FA,        // Lavender (e.g., "et", "ou")
    'Blank': 0xD3D3D3         // Light Gray (e.g., "{Blank}")
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
let currentGroup = [];
let currentWordIndex = 0;
let titleText;
let scoreTextObj;
let previewLabel;
let gameStarted = false;
let startMessageText;
let allPhrases = [];
let currentWordGroups = [];
let nextWordGroups = [];
let dropIndex = 0;
let gridGraphics; // Single graphics object for the grid
let previewGraphics; // Single graphics object for the preview frame
let resizeTimeout; // For debouncing resize events
let themeMusic; // Add variable to store the theme music object

// Function to validate a phrase
function validatePhrase(words) {
    console.log('validatePhrase called with words:', words);
    try {
        const rowPhrase = words.join(' ').toLowerCase();
        for (let i = 0; i < allPhrases.length; i++) {
            const phrase = allPhrases[i].phrase.join(' ').toLowerCase();
            if (rowPhrase === phrase) {
                console.log('Valid phrase found:', phrase);
                return true;
            }
        }
        console.log('No valid phrase found for:', rowPhrase);
        return false;
    } catch (error) {
        console.error('Error in validatePhrase:', error);
        return false;
    }
}

// Helper functions
function shuffle(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectAndShufflePhrases() {
    if (!allPhrases || !Array.isArray(allPhrases)) {
        console.error('allPhrases is not defined or not an array:', allPhrases);
        return [];
    }

    const selected = [];
    const indices = [];
    
    while (indices.length < 4) {
        const index = Math.floor(Math.random() * allPhrases.length);
        if (!indices.includes(index)) {
            indices.push(index);
        }
    }
    
    for (let i = 0; i < 4; i++) {
        const phraseData = allPhrases[indices[i]];
        if (!phraseData || !phraseData.phrase || !phraseData.pos) {
            console.error('Invalid phrase data at index', indices[i], ':', phraseData);
            continue;
        }
        const phrase = phraseData.phrase;
        const posTags = phraseData.pos;
        const paired = phrase.map((word, idx) => ({ word, pos: posTags[idx] }));
        selected.push(shuffle(paired));
    }
    
    return selected;
}

function createWordGroups(shuffledPhrases) {
    const wordGroups = [];
    for (let i = 0; i < 8; i++) {
        const group = [];
        for (let j = 0; j < 4; j++) {
            const { word, pos } = shuffledPhrases[j][i];
            group.push({ pos, word });
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

function getColorForPos(pos) {
    // Normalize the POS value: trim whitespace, remove non-visible characters, and standardize case
    const normalizedPos = pos
        .trim() // Remove leading/trailing whitespace
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and other non-visible characters
        .charAt(0).toUpperCase() + pos.trim().slice(1).toLowerCase();
    
    // Debug: List the keys of posColors to confirm they exist
    console.log(`getColorForPos: original=${pos}, normalized=${normalizedPos}, posColors keys=${Object.keys(posColors).join(', ')}`);
    
    // Test with a hardcoded value to confirm posColors works
    if (normalizedPos === 'Articles') {
        console.log('Hardcoded test: posColors["Articles"]=', posColors['Articles']);
    }
    
    const color = posColors[normalizedPos] || posColors['Other'];
    if (!posColors[normalizedPos]) {
        console.log(`Warning: No color found for ${normalizedPos}, falling back to Other`);
    }
    return color;
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

function checkForScoring(gridY) {
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
            let isValid = validatePhrase(words);
            if (isValid) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (row[x]) {
                        row[x].block.destroy();
                        row[x].text.destroy();
                        row[x] = null;
                    }
                }
                score += 100;
                scoreTextObj.setText("Score: " + score);
                for (let y = gridY; y > 0; y--) {
                    grid[y] = grid[y - 1];
                }
                grid[0] = Array(GRID_WIDTH).fill(null);
            }
        }
    } catch (error) {
        console.error('Error in checkForScoring:', error);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
        this.load.json('phrases', 'phrases.json');
        // Load the theme music
        this.load.audio('themeMusic', 'ThemeMusic.mp3');
        // Load the new background image
        this.load.image('background', 'background.png');
    }

    create() {
        sceneRef = this;
    
        // Set willReadFrequently to suppress the Canvas2D warning
        this.game.canvas.getContext('2d', { willReadFrequently: true });
    
        GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
        PREVIEW_X = 50;
    
        // Add the new background image
        const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        // Scale the background to fit the canvas
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
        // Title (at y = 40)
        titleText = this.add.text(this.cameras.main.width / 2, 40, "Tetris de Phrases Françaises", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
        console.log('Initial title position:', titleText.x, titleText.y);
    
        // Score (at y = 80)
        scoreTextObj = this.add.text(this.cameras.main.width / 2, 80, "Score: 0", { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        scoreTextObj.setShadow(2, 2, '#000000', 2); // Add shadow for readability
    
        // Prochain Mots label
        previewLabel = this.add.text(50, 60, "Prochain Mots", { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        previewLabel.setShadow(2, 2, '#000000', 2); // Add shadow for readability
    
        // Create single graphics objects for grid and preview
        gridGraphics = this.add.graphics();
        previewGraphics = this.add.graphics();
    
        // Draw the grid
        this.drawGrid();
    
        // Draw the preview frame
        this.drawPreviewFrame();
    
        // Load phrases
        allPhrases = this.cache.json.get('phrases');
        if (!allPhrases) {
            console.error('Failed to load phrases.json');
            const errorText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Error: Could not load phrases', { fontSize: '32px', color: '#ff0000' }).setOrigin(0.5);
            errorText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
            return;
        }
    
        // Initialize word groups
        generateInitialWordGroups();
    
        // Create preview blocks
        for (let i = 0; i < PREVIEW_WORDS; i++) {
            const x = PREVIEW_X + BLOCK_WIDTH / 2;
            const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
            const { pos, word } = currentWordGroups[0][i];
            const color = getColorForPos(pos);
            console.log(`Preview block ${i}: word=${word}, pos=${pos}, color=${color.toString(16)}`); // Debug log
            const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
            const text = this.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
            previewBlocks.push(block);
            previewTexts.push(text);
        }
    
        // Play the theme music
        themeMusic = this.sound.add('themeMusic', {
            loop: true,
            volume: 0.5
        });
        themeMusic.play();

        // Fallback: Resume audio on user interaction if blocked by browser
        this.input.once('pointerdown', () => {
            if (!themeMusic.isPlaying) {
                console.log('Resuming theme music after user interaction');
                themeMusic.play();
            }
        });
        this.input.keyboard.once('keydown', () => {
            if (!themeMusic.isPlaying) {
                console.log('Resuming theme music after user interaction');
                themeMusic.play();
            }
        });

        // Add mute toggle with 'M' key
        this.input.keyboard.on('keydown-M', () => {
            if (themeMusic.isPlaying) {
                themeMusic.pause();
                console.log('Theme music paused');
            } else {
                themeMusic.resume();
                console.log('Theme music resumed');
            }
        });
    
        // Start message
        startMessageText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Appuyez sur Entrée pour commencer le jeu", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        startMessageText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
        console.log('Setting up Enter key listener');
        this.input.keyboard.on('keydown-ENTER', function () {
            console.log('Enter key pressed');
            if (!gameStarted) {
                gameStarted = true;
                startMessageText.destroy();
                spawnBlock();
            }
        });
    
        // Set up physics bounds
        this.physics.world.setBounds(GRID_START_X, GRID_START_Y, GRID_WIDTH_PX, GRID_HEIGHT_PX);
    
        // Handle resize with debounce
        this.scale.on('resize', (gameSize) => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => resize(gameSize), 100);
        }, this);
    }

    drawGrid() {
        gridGraphics.clear();
        // Keep the white, thicker lines as desired
        gridGraphics.lineStyle(2, 0xffffff); // White lines, thickness 2
        for (let x = 0; x <= GRID_WIDTH; x++) {
            gridGraphics.moveTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y);
            gridGraphics.lineTo(GRID_START_X + x * BLOCK_WIDTH, GRID_START_Y + GRID_HEIGHT * BLOCK_HEIGHT);
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            gridGraphics.moveTo(GRID_START_X, GRID_START_Y + y * BLOCK_HEIGHT);
            gridGraphics.lineTo(GRID_START_X + GRID_WIDTH * BLOCK_WIDTH, GRID_START_Y + y * BLOCK_HEIGHT);
        }
        gridGraphics.strokePath();
    }

    drawPreviewFrame() {
        previewGraphics.clear();
        // Keep the white, thicker lines as desired
        previewGraphics.lineStyle(2, 0xffffff); // White lines, thickness 2
        for (let i = 0; i <= PREVIEW_WORDS; i++) {
            previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
            previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
        }
        previewGraphics.moveTo(PREVIEW_X, PREVIEW_Y);
        previewGraphics.lineTo(PREVIEW_X, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
        previewGraphics.moveTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y);
        previewGraphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
        previewGraphics.strokePath();
    }

    update(time) {
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
            const { pos, word } = currentGroup[currentWordIndex];
            currentText.setText(word === '{Blank}' ? '' : word);
            const newColor = getColorForPos(pos);
            console.log(`Cycling block: word=${word}, pos=${pos}, color=${newColor.toString(16)}`); // Debug log
            currentBlock.setFillStyle(newColor);
        }
    }
}

function resize(gameSize) {
    console.log('Resize event triggered:', gameSize);
    const width = gameSize.width;
    GRID_START_X = (width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 50;

    // Update positions
    titleText.setPosition(width / 2, 40); // Title at y = 40
    console.log('Title position after resize:', titleText.x, titleText.y);
    scoreTextObj.setPosition(width / 2, 80); // Score at y = 80
    previewLabel.setPosition(50, 60);

    // Redraw grid using the single graphics object
    sceneRef.drawGrid();

    // Redraw preview frame using the single graphics object
    sceneRef.drawPreviewFrame();

    // Update preview blocks
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const x = PREVIEW_X + BLOCK_WIDTH / 2;
        const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
        previewBlocks[i].setPosition(x, y);
        previewTexts[i].setPosition(x, y);
    }

    // Update current block position
    if (currentBlock && currentText) {
        const gridX = getGridPosition(currentBlock.x);
        currentBlock.x = GRID_START_X + gridX * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        currentText.x = currentBlock.x;
    }

    // Update locked blocks
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

    // Resize the background image
    const background = sceneRef.children.list.find(child => child.texture && child.texture.key === 'background');
    if (background) {
        background.setDisplaySize(width, gameSize.height);
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
        spawnBlock();
    } catch (error) {
        console.error('Error in lockBlock:', error);
        // Optionally display an error message to the player
        const errorText = sceneRef.add.text(sceneRef.cameras.main.width / 2, sceneRef.cameras.main.height / 2, 'Error: Game Paused', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        errorText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
    }
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
        const { pos, word } = group[i];
        const color = getColorForPos(pos);
        console.log(`Updating preview block ${i}: word=${word}, pos=${pos}, color=${color.toString(16)}`);
        previewBlocks[i].setFillStyle(color);
        previewTexts[i].setText(word === '{Blank}' ? '' : word);
    }
}

function spawnBlock() {
    console.log('spawnBlock called');
    if (!sceneRef) return;
    try {
        // Check if we've reached the end of currentWordGroups
        if (dropIndex >= currentWordGroups.length) {
            if (nextWordGroups.length > 0) {
                currentWordGroups.push(nextWordGroups.shift());
            } else {
                console.error('No more word groups available in nextWordGroups');
                const noWordsText = sceneRef.add.text(sceneRef.cameras.main.width / 2, sceneRef.cameras.main.height / 2, 'No More Words', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
                noWordsText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
                return;
            }
            const phraseIndex = Phaser.Math.Between(0, allPhrases.length - 1);
            const phrase = allPhrases[phraseIndex].phrase;
            const pos = allPhrases[phraseIndex].pos;
            const newGroup = [];
            for (let j = 0; j < phrase.length; j++) {
                newGroup.push({ pos: pos[j], word: phrase[j] });
            }
            nextWordGroups.push(newGroup);
            dropIndex = currentWordGroups.length - 1;
        }

        const startX = GRID_START_X + Math.floor(GRID_WIDTH / 2) * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        const startY = GRID_START_Y + BLOCK_HEIGHT / 2;
        const spawnGridX = getGridPosition(startX);
        const spawnGridY = getGridY(startY);
        if (isPositionOccupied(spawnGridX, spawnGridY)) {
            sceneRef.tweens.killAll();
            const gameOverText = sceneRef.add.text(sceneRef.cameras.main.width / 2, sceneRef.cameras.main.height / 2, 'Game Over', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
            gameOverText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
            return;
        }
        currentGroup = currentWordGroups[dropIndex];
        currentWordIndex = 0;
        const { pos, word } = currentGroup[currentWordIndex];
        const color = getColorForPos(pos);
        console.log(`Spawning block: word=${word}, pos=${pos}, color=${color.toString(16)}`);
        currentBlock = sceneRef.add.rectangle(startX, startY, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
        currentText = sceneRef.add.text(startX, startY, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
        
        if (dropIndex < currentWordGroups.length - 1) {
            updatePreview(currentWordGroups[dropIndex + 1]);
        } else if (nextWordGroups.length > 0) {
            updatePreview(nextWordGroups[0]);
        } else {
            for (let i = 0; i < PREVIEW_WORDS; i++) {
                previewBlocks[i].setFillStyle(posColors['Blank']);
                previewTexts[i].setText('');
            }
        }
        
        isDropping = true;
        const landingGridY = findLandingY(startX);
        const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        sceneRef.tweens.add({
            targets: [currentBlock, currentText],
            y: landingY,
            duration: 20000,
            ease: 'Linear',
            onComplete: lockBlock
        });
    } catch (error) {
        console.error('Error in spawnBlock:', error);
        const errorText = sceneRef.add.text(sceneRef.cameras.main.width / 2, sceneRef.cameras.main.height / 2, 'Error: Game Paused', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        errorText.setShadow(2, 2, '#000000', 2); // Add shadow for readability
    }
}

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d', // This will be overridden by the background image
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER // Changed from CENTER_BOTH to NO_CENTER
    },
    parent: 'game'
};

// Initialize the game
const game = new Phaser.Game(config);