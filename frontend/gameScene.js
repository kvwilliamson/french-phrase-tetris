// frontend/gameScene.js
let sceneRef;
let allPhrases = [];
let titleText;
let previewLabel;
let gameStarted = false;
let startMessageText;
let levelSelectText;
let gridGraphics;
let previewGraphics;
let posGridGraphics;
let posBlocks = [];
let posTexts = [];
let levelText;
let resizeTimeout;
let themeMusic;
let currentPhrase = []; // Store target phrase for pre-population

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        initializeGrid();
        this.load.json('phrases', 'phrases.json');
        for (let i = 1; i <= 4; i++) {
            this.load.audio(`themeMusic${i}`, `ThemeMusic${i}.mp3`);
            this.load.image(`background${i}`, `background${i}.png`);
        }
        this.load.audio('completionSound', 'completion.wav');
        this.load.audio('wrongSound', 'wrong.wav');
        this.load.audio('excellent', 'excellent.m4a');
        this.load.audio('merde', 'merde.m4a');
        this.load.audio('placedSound', 'placed.wav');
        this.load.on('filecomplete', (key) => {
            console.log(`Loaded audio: ${key}`);
        });
        this.load.on('loaderror', (file) => {
            console.error(`Failed to load audio: ${file.key}`);
        });
    }

    create() {
        sceneRef = this;
        GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;

        this.game.canvas.getContext('2d', { willReadFrequently: true });

        const background = this.add.image(0, 0, `background${level}`).setOrigin(0, 0);
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        titleText = this.add.text(this.cameras.main.width / 2, 80, "Tetris de Phrases Françaises", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 2);

        scoreTextObj = this.add.text(this.cameras.main.width / 2, 120, "Score: 0", { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        scoreTextObj.setShadow(2, 2, '#000000', 2);

        levelText = this.add.text(this.cameras.main.width / 2, 160, `Niveau: ${level}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        levelText.setShadow(2, 2, '#000000', 2);

        // Preview grid sizes from Phase 1
        PREVIEW_ROWS = level === 1 ? 5 : level === 2 ? 6 : 7;
        PREVIEW_COLS = 1;
        PREVIEW_WORDS = PREVIEW_COLS;

        const adjustedPreviewY = PREVIEW_Y - 2 * BLOCK_HEIGHT;
        previewLabel = this.add.text(PREVIEW_X, adjustedPreviewY - 20, "Prochain Mots", { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        previewLabel.setShadow(2, 2, '#000000', 2);

        gridGraphics = this.add.graphics();
        previewGraphics = this.add.graphics();
        posGridGraphics = this.add.graphics();

        drawGrid(gridGraphics);
        drawPreviewFrame(previewGraphics, adjustedPreviewY);
        drawPosGrid();

        allPhrases = this.cache.json.get('phrases');
        if (!allPhrases) {
            console.error('Failed to load phrases.json');
            const errorText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Error: Could not load phrases', { fontSize: '32px', color: '#ff0000' }).setOrigin(0.5);
            errorText.setShadow(2, 2, '#000000', 2);
            return;
        }

        startMessageText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 20, "Appuyez sur 1-4 pour choisir un niveau", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        startMessageText.setShadow(2, 2, '#000000', 2);
        levelSelectText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, `Niveau: ${level}`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        levelSelectText.setShadow(2, 2, '#000000', 2);

        this.input.keyboard.on('keydown', (event) => {
            if (!gameStarted) {
                if (['1', '2', '3', '4'].includes(event.key)) {
                    level = parseInt(event.key);
                    levelSelectText.setText(`Niveau: ${level}`);
                    levelText.setText(`Niveau: ${level}`);
                    background.setTexture(`background${level}`);
                    if (themeMusic) themeMusic.stop();
                    try {
                        themeMusic = this.sound.add(`themeMusic${level}`, { loop: true, volume: 0.5 });
                        console.log(`Loaded themeMusic${level}`);
                        themeMusic.on('play', () => console.log(`themeMusic${level} is playing`));
                        themeMusic.on('error', (err) => console.error(`Error playing themeMusic${level}:`, err));
                        themeMusic.play();
                    } catch (err) {
                        console.error(`Failed to load themeMusic${level}:`, err);
                    }
                    PREVIEW_ROWS = level === 1 ? 5 : level === 2 ? 6 : 7;
                    PREVIEW_COLS = 1;
                    PREVIEW_WORDS = PREVIEW_COLS;
                    setupPreviewBlocks(adjustedPreviewY);
                    drawPreviewFrame(previewGraphics, adjustedPreviewY);
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    gameStarted = true;
                    startMessageText.destroy();
                    levelSelectText.destroy();
                    PREVIEW_ROWS = level === 1 ? 5 : level === 2 ? 6 : 7;
                    PREVIEW_COLS = 1;
                    PREVIEW_WORDS = PREVIEW_COLS;

                    // Initialize phrase and pre-populate
                    generateInitialWordGroups(allPhrases);
                    const phraseIndex = Math.floor(Math.random() * allPhrases.length);
                    currentPhrase = allPhrases[phraseIndex].phrase;
                    if (level === 1 || level === 2) {
                        const numPrePopulate = level === 1 ? 2 : 1;
                        const indices = [];
                        while (indices.length < numPrePopulate && indices.length < currentPhrase.length) {
                            const idx = Math.floor(Math.random() * currentPhrase.length);
                            if (!indices.includes(idx)) indices.push(idx);
                        }
                        const bottomRow = GRID_HEIGHT - 1;
                        indices.forEach((idx) => {
                            if (idx < GRID_WIDTH) {
                                const word = currentPhrase[idx];
                                const pos = allPhrases[phraseIndex].pos[idx] || 'Other';
                                const color = getColorForPos(pos);
                                const x = GRID_START_X + idx * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                                const y = GRID_START_Y + bottomRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                                const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
                                const text = this.add.text(x, y, word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
                                grid[bottomRow][idx] = { block, text, word };
                                console.log(`Pre-populated: word=${word}, pos=${pos}, col=${idx}`);
                            }
                        });
                    }

                    setupPreviewBlocks(adjustedPreviewY);
                    drawPreviewFrame(previewGraphics, adjustedPreviewY);
                    updatePreview();
                    spawnBlock(this, currentWordGroups, nextWordGroups, allPhrases);
                }
            } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
            }
        });

        this.input.once('pointerdown', () => {
            if (themeMusic && !themeMusic.isPlaying) {
                console.log('Attempting to play music on pointerdown');
                themeMusic.play();
            }
        });
        this.input.keyboard.once('keydown', () => {
            if (themeMusic && !themeMusic.isPlaying) {
                console.log('Attempting to play music on keydown');
                themeMusic.play();
            }
        });

        this.input.keyboard.on('keydown-M', () => {
            if (themeMusic) {
                if (themeMusic.isPlaying) {
                    themeMusic.pause();
                    console.log('Music paused');
                } else {
                    themeMusic.resume();
                    console.log('Music resumed');
                }
            }
        });

        this.physics.world.setBounds(GRID_START_X, GRID_START_Y, GRID_WIDTH_PX, GRID_HEIGHT_PX);

        this.scale.on('resize', (gameSize) => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => resize(gameSize, adjustedPreviewY), 100);
        }, this);

        this.game.canvas.setAttribute('tabindex', '0');
        this.game.canvas.focus();
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
            if (currentTween) currentTween.timeScale = 12.0;
        } else {
            const currentTween = this.tweens.getTweensOf(currentBlock)[0];
            if (currentTween) currentTween.timeScale = 1.0;
        }
        if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
            currentWordIndex = (currentWordIndex + 1) % currentGroup.length;
            const { pos, word } = currentGroup[currentWordIndex];
            currentText.setText(word === '{Blank}' ? '' : word);
            const newColor = getColorForPos(pos);
            console.log(`Cycling block: word=${word}, pos=${pos}, color=${newColor.toString(16)}`);
            currentBlock.setFillStyle(newColor);
        }
    }
}

function drawPosGrid() {
    const POS_GRID_COLS = 3;
    const POS_GRID_ROWS = 3;
    const POS_GRID_X = sceneRef.cameras.main.width - PREVIEW_X - (POS_GRID_COLS * BLOCK_WIDTH);
    const POS_GRID_Y = GRID_START_Y - 5 * BLOCK_HEIGHT;

    const posData = [
        { label: 'Noms', pos: 'Nom', color: COLOR_NOMS },
        { label: 'Pronoms', pos: 'Pronom', color: COLOR_PRONOMS },
        { label: 'Adjectifs', pos: 'Adjectif', color: COLOR_ADJECTIFS },
        { label: 'Verbes', pos: 'Verbe', color: COLOR_VERBES },
        { label: 'Adverbes', pos: 'Adverbe', color: COLOR_ADVERBES },
        { label: 'Articles', pos: 'Article', color: COLOR_ARTICLES },
        { label: 'Prépositions', pos: 'Préposition', color: COLOR_PREPOSITIONS },
        { label: 'Other', pos: 'Other', color: COLOR_OTHER },
        { label: 'Blank', pos: 'Blank', color: COLOR_BLANK }
    ];

    posBlocks.forEach(row => row.forEach(block => block.destroy()));
    posTexts.forEach(row => row.forEach(text => text.destroy()));
    posBlocks = [];
    posTexts = [];

    for (let i = 0; i < POS_GRID_ROWS; i++) {
        const rowBlocks = [];
        const rowTexts = [];
        for (let j = 0; j < POS_GRID_COLS; j++) {
            const idx = i * POS_GRID_COLS + j;
            const x = POS_GRID_X + j * BLOCK_WIDTH + BLOCK_WIDTH / 2;
            const y = POS_GRID_Y + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
            const { label, color } = posData[idx];
            const block = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
            const text = sceneRef.add.text(x, y, label, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
            rowBlocks.push(block);
            rowTexts.push(text);
        }
        posBlocks.push(rowBlocks);
        posTexts.push(rowTexts);
    }

    posGridGraphics.clear();
    posGridGraphics.lineStyle(2, 0xffffff);
    for (let i = 0; i <= POS_GRID_ROWS; i++) {
        posGridGraphics.moveTo(POS_GRID_X, POS_GRID_Y + i * BLOCK_HEIGHT);
        posGridGraphics.lineTo(POS_GRID_X + POS_GRID_COLS * BLOCK_WIDTH, POS_GRID_Y + i * BLOCK_HEIGHT);
    }
    for (let j = 0; j <= POS_GRID_COLS; j++) {
        posGridGraphics.moveTo(POS_GRID_X + j * BLOCK_WIDTH, POS_GRID_Y);
        posGridGraphics.lineTo(POS_GRID_X + j * BLOCK_WIDTH, POS_GRID_Y + POS_GRID_ROWS * BLOCK_HEIGHT);
    }
    posGridGraphics.strokePath();
}

function resize(gameSize, adjustedPreviewY) {
    console.log('Resize event triggered:', gameSize);
    const width = gameSize.width;
    const height = gameSize.height;

    GRID_START_X = (width - GRID_WIDTH_PX) / 2;

    titleText.setPosition(width / 2, 80);
    scoreTextObj.setPosition(width / 2, 120);
    levelText.setPosition(width / 2, 160);
    previewLabel.setPosition(PREVIEW_X, adjustedPreviewY - 20);

    drawGrid(gridGraphics);
    drawPreviewFrame(previewGraphics, adjustedPreviewY);
    drawPosGrid();

    for (let i = 0; i < PREVIEW_ROWS; i++) {
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const x = PREVIEW_X + j * BLOCK_WIDTH + BLOCK_WIDTH / 2;
            const y = adjustedPreviewY + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
            previewBlocks[i][j].setPosition(x, y);
            previewTexts[i][j].setPosition(x, y);
        }
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

    const background = sceneRef.children.list.find(child => child.texture && child.texture.key.startsWith('background'));
    if (background) {
        background.setDisplaySize(width, height);
    }

    if (startMessageText) {
        startMessageText.setPosition(width / 2, height / 2 - 20);
    }
    if (levelSelectText) {
        levelSelectText.setPosition(width / 2, height / 2 + 20);
    }
}

window.GameScene = GameScene;