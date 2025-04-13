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
let currentPhrase = [];
let currentPhraseBlocks = [];
let totalScore = 0;
let correctPhrasesCompleted = 0;
let currentPhraseId = 0;
let scoreTextObj;
let highScoreText;

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        initializeGrid();
        this.load.json('phrases', 'phrases.json');
        for (let i = 1; i <= 8; i++) {
            this.load.audio(`themeMusic${i}`, `ThemeMusic${i}.mp3`);
            this.load.image(`background${i}`, `background${i}.png`);
        }
        this.load.audio('completionSound', 'completion.wav');
        this.load.audio('wrongSound', 'wrong.wav');
        this.load.audio('excellent', 'excellent.m4a');
        this.load.audio('merde', 'merde.m4a');
        this.load.audio('placedSound', 'placed.wav');
        this.load.audio('highScoreFanfare', 'highScoreFanfare.wav');
        // Optional: this.load.image('trophy', 'trophy.png');
        this.load.on('filecomplete', (key) => {
            console.log(`Loaded asset: ${key}`);
        });
        this.load.on('loaderror', (file) => {
            console.error(`Failed to load asset: ${file.key}`);
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

        scoreTextObj = this.add.text(this.cameras.main.width / 2, 120, `Score: ${totalScore}`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        scoreTextObj.setShadow(2, 2, '#000000', 2);

        levelText = this.add.text(this.cameras.main.width / 2, 160, `Niveau: ${level}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        levelText.setShadow(2, 2, '#000000', 2);

        // High Score Display
        let highScore = localStorage.getItem('highScore') || '0';
        let highScoreName = localStorage.getItem('highScoreName') || 'COM';
        highScoreText = this.add.text(this.cameras.main.width - 10, 40, `High Score: ${highScore} ${highScoreName}`, { fontSize: '28px', color: '#ffffff' }).setOrigin(1, 0);
        highScoreText.setShadow(2, 2, '#000000', 2);

        const adjustedPreviewY = PREVIEW_Y;
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

        startMessageText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            "Appuyez sur 1-8 pour choisir un niveau\n et 'Enter' pour Commencer",
            {
                fontSize: '24px',
                color: '#ffffff',
                align: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);
        startMessageText.setShadow(2, 2, '#000000', 2);

        levelSelectText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 40,
            `Niveau: ${level}`,
            {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);
        levelSelectText.setShadow(2, 2, '#000000', 2);

        this.input.keyboard.on('keydown', (event) => {
            if (!gameStarted) {
                if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(event.key)) {
                    level = parseInt(event.key);
                    levelSelectText.setText(`Niveau: ${level}`);
                    levelText.setText(`Niveau: ${level}`);
                    background.setTexture(`background${level}`);
                    if (themeMusic) themeMusic.stop();
                    try {
                        themeMusic = this.sound.add(`themeMusic${level}`, { loop: true, volume: 0.5 });
                        console.log(`Loaded themeMusic${level}`);
                        themeMusic.play();
                    } catch (err) {
                        console.error(`Failed to load themeMusic${level}:`, err);
                    }
                    setupPreviewBlocks(adjustedPreviewY);
                    drawPreviewFrame(previewGraphics, adjustedPreviewY);
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    gameStarted = true;
                    startMessageText.destroy();
                    levelSelectText.destroy();

                    loadNewPhrase();
                    totalScore = 0;
                    correctPhrasesCompleted = 0;
                    currentPhraseId = 0;
                    scoreTextObj.setText(`Score: ${totalScore}`);
                    const prePopulateCounts = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
                    const numPrePopulate = prePopulateCounts[level] || 0;
                    // Find lowest non-permanent row
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
                        console.log('No space for pre-population at start, game over');
                        window.triggerGameOver(this, totalScore);
                        return;
                    }
                    for (let i = 0; i < numPrePopulate; i++) {
                        const block = currentPhraseBlocks[i];
                        const idx = block.position;
                        const x = GRID_START_X + idx * BLOCK_WIDTH + BLOCK_WIDTH / 2;
                        const y = GRID_START_Y + targetRow * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                        const color = getColorForPos(block.pos);
                        const blockObj = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
                        const text = this.add.text(x, y, block.word === '{Blank}' ? '' : block.word, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
                        grid[targetRow][idx] = { block: blockObj, text, word: block.word, phraseId: currentPhraseId, isPermanent: false };
                        console.log(`Pre-populated: word=${block.word}, pos=${block.pos}, col=${idx}, row=${targetRow}, phraseId=${currentPhraseId}`);
                    }

                    currentWordGroups = currentPhraseBlocks.slice(numPrePopulate).map(block => [block]);
                    dropIndex = 0;
                    currentPhraseLength = currentWordGroups.length;
                    console.log(`Initialized phrase, length: ${currentPhraseLength}, blocks: ${currentPhraseBlocks.map(b => b.word).join(', ')}`);

                    setupPreviewBlocks(adjustedPreviewY);
                    drawPreviewFrame(previewGraphics, adjustedPreviewY);
                    updatePreview();
                    spawnBlock(this, currentWordGroups, allPhrases);
                }
            } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
            }
        });

        // Secret pause functionality
        this.isPaused = false;
        this.input.keyboard.on('keydown-P', () => {
            if (!gameStarted) return; // Ignore during level select
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                if (themeMusic) themeMusic.pause();
                this.tweens.pauseAll();
                console.log('Game paused');
            } else {
                if (themeMusic) themeMusic.resume();
                this.tweens.resumeAll();
                console.log('Game resumed');
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

        this.physics.world.setBounds(GRID_START_X, GRID_START_Y, GRID_WIDTH_PX, GRID_HEIGHT_PX + 30);

        this.scale.on('resize', (gameSize) => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => resize(gameSize, adjustedPreviewY), 100);
        }, this);

        this.game.canvas.setAttribute('tabindex', '0');
        this.game.canvas.focus();
    }

    promptForHighScoreName(score) {
        console.log(`promptForHighScoreName called with score=${score}`);
        try {
            // Play fanfare sound
            try {
                this.sound.play('highScoreFanfare', { volume: 0.7 });
                console.log('Playing highScoreFanfare');
            } catch (err) {
                console.error('Failed to play highScoreFanfare, using fallback:', err);
                try {
                    this.sound.play('excellent', { volume: 0.7 });
                    console.log('Playing fallback excellent sound');
                } catch (fallbackErr) {
                    console.error('Failed to play fallback sound:', fallbackErr);
                }
            }

            // Gradient background
            const graphics = this.add.graphics().setDepth(20);
            const bgWidth = 300;
            const bgHeight = 200;
            const bgX = this.cameras.main.width / 2 - bgWidth / 2;
            const bgY = this.cameras.main.height / 2 - bgHeight / 2;
            graphics.fillGradientStyle(0xffd700, 0xffd700, 0xff4500, 0xff4500, 1);
            graphics.fillRect(bgX, bgY, bgWidth, bgHeight);
            // Pulse animation
            this.tweens.add({
                targets: graphics,
                alpha: { from: 0.8, to: 1.0 },
                duration: 1000,
                yoyo: true,
                loop: -1
            });

            // Title
            const title = this.add.text(this.cameras.main.width / 2, bgY + 30, 'New High Score!', {
                fontSize: '40px',
                color: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(20);
            title.setShadow(2, 2, '#000000', 4, true, true);
            // Bounce animation
            this.tweens.add({
                targets: title,
                scale: { from: 1.0, to: 1.2 },
                duration: 500,
                yoyo: true,
                loop: -1
            });

            // Score display
            const scoreText = this.add.text(this.cameras.main.width / 2, bgY + 80, `Score: ${score}`, {
                fontSize: '28px',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(20);
            scoreText.setShadow(2, 2, '#000000', 2);

            // Input field (prioritized before particles)
            const inputBox = this.add.rectangle(this.cameras.main.width / 2, bgY + 130, 120, 40, 0x000000).setOrigin(0.5).setDepth(20);
            inputBox.setStrokeStyle(2, 0xffd700);
            const nameText = this.add.text(this.cameras.main.width / 2, bgY + 130, '', {
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(20);
            // Blinking cursor
            const cursor = this.add.text(this.cameras.main.width / 2, bgY + 130, '|', {
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(20);
            this.tweens.add({
                targets: cursor,
                alpha: { from: 1, to: 0 },
                duration: 500,
                yoyo: true,
                loop: -1
            });

            // Input handling
            let playerName = '';
            console.log('High score input field created, setting up key handler');

            const updateHighScore = () => {
                const finalName = playerName || 'COM';
                localStorage.setItem('highScore', score.toString());
                localStorage.setItem('highScoreName', finalName);
                highScoreText.setText(`High Score: ${score} ${finalName}`);
                console.log(`High score saved: score=${score}, name=${finalName}`);
                graphics.destroy();
                title.destroy();
                scoreText.destroy();
                inputBox.destroy();
                nameText.destroy();
                cursor.destroy();
                if (emitter) emitter.destroy();
                // trophy.destroy();
                this.input.keyboard.off('keydown', keyHandler);
            };

            const keyHandler = (event) => {
                console.log(`Key pressed in high score prompt: ${event.key}`);
                event.preventDefault();
                if (event.key === 'Enter') {
                    updateHighScore();
                } else if (event.key === 'Backspace') {
                    playerName = playerName.slice(0, -1);
                    nameText.setText(playerName);
                    cursor.setX(nameText.x + nameText.width / 2 + 5);
                } else if (playerName.length < 3 && event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                    playerName += event.key.toUpperCase();
                    nameText.setText(playerName);
                    cursor.setX(nameText.x + nameText.width / 2 + 5);
                }
            };

            this.input.keyboard.on('keydown', keyHandler);
            console.log('Key handler attached for high score input');

            // Confetti particles (isolated to prevent crashes)
            let emitter = null;
            try {
                emitter = this.add.particles(0, 0, 'circle', {
                    speed: { min: 100, max: 300 },
                    angle: { min: 180, max: 360 },
                    gravityY: 200,
                    lifespan: 3000,
                    quantity: 5,
                    scale: { start: 0.2, end: 0.1 },
                    alpha: { start: 1, end: 0 },
                    tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
                    x: { min: bgX, max: bgX + bgWidth },
                    y: bgY,
                    frequency: 200
                }).setDepth(20);
                console.log('Confetti emitter created');
            } catch (particleErr) {
                console.error('Failed to create confetti emitter:', particleErr);
            }

            // Optional trophy
            /*
            const trophy = this.add.image(this.cameras.main.width / 2, bgY - 80, 'trophy')
                .setOrigin(0.5)
                .setDepth(20)
                .setScale(0.5);
            */
        } catch (error) {
            console.error('Error in promptForHighScoreName:', error);
        }
    }

    update(time) {
        if (gameStarted && !this.isPaused) {
            if (!currentBlock || !isDropping) return;
            const cursors = this.input.keyboard.createCursorKeys();
            const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            if (time - lastMoveTime < MOVE_DELAY) return;

            if (cursors.left.isDown) {
                const newX = currentBlock.x - BLOCK_WIDTH;
                if (window.isValidMove(newX)) {
                    currentBlock.x = newX;
                    currentText.x = newX;
                    const landingGridY = window.findLandingY(newX);
                    const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                    const currentTween = this.tweens.getTweensOf(currentBlock)[0];
                    if (currentTween) {
                        const remainingDistance = landingY - currentBlock.y;
                        const speedMultipliers = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5 };
                        const speed = 20 * (speedMultipliers[level] || 1);
                        const remainingDuration = (remainingDistance / speed) * 1000;
                        currentTween.stop();
                        this.tweens.add({
                            targets: [currentBlock, currentText],
                            y: landingY,
                            duration: remainingDuration,
                            ease: 'Linear',
                            onComplete: window.lockBlock
                        });
                    }
                    lastMoveTime = time;
                }
            } else if (cursors.right.isDown) {
                const newX = currentBlock.x + BLOCK_WIDTH;
                if (window.isValidMove(newX)) {
                    currentBlock.x = newX;
                    currentText.x = newX;
                    const landingGridY = window.findLandingY(newX);
                    const landingY = GRID_START_Y + landingGridY * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
                    const currentTween = this.tweens.getTweensOf(currentBlock)[0];
                    if (currentTween) {
                        const remainingDistance = landingY - currentBlock.y;
                        const speedMultipliers = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5 };
                        const speed = 20 * (speedMultipliers[level] || 1);
                        const remainingDuration = (remainingDistance / speed) * 1000;
                        currentTween.stop();
                        this.tweens.add({
                            targets: [currentBlock, currentText],
                            y: landingY,
                            duration: remainingDuration,
                            ease: 'Linear',
                            onComplete: window.lockBlock
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
}

function drawPosGrid() {
    const POS_GRID_COLS = 3;
    const POS_GRID_ROWS = 3;
    const POS_GRID_X = GRID_START_X + 4.5 * BLOCK_WIDTH;
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
            const text = sceneRef.add.text(x, y, label, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
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
    highScoreText.setPosition(width - 10, 40);
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

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadNewPhrase() {
    currentPhraseId++;
    console.log(`New phrase ID: ${currentPhraseId}`);
    const phraseIndex = Math.floor(Math.random() * allPhrases.length);
    let phrase = allPhrases[phraseIndex].phrase.slice(0, GRID_WIDTH);
    const posTags = allPhrases[phraseIndex].pos.slice(0, GRID_WIDTH);
    if (phrase.length < GRID_WIDTH) {
        phrase = phrase.concat(Array(GRID_WIDTH - phrase.length).fill('{Blank}'));
        posTags.concat(Array(GRID_WIDTH - phrase.length).fill('Blank'));
    }
    currentPhrase = phrase;
    currentPhraseBlocks = phrase.map((word, idx) => ({
        word,
        pos: posTags[idx] || 'Other',
        position: idx
    }));
    currentPhraseBlocks = shuffle(currentPhraseBlocks);
    localStorage.setItem('lastPhrase', JSON.stringify(currentPhrase));
    console.log(`Loaded new phrase: ${currentPhrase.join(', ')}`);
}

window.GameScene = GameScene;
window.triggerGameOver = triggerGameOver;