// gameScene.js
let sceneRef;
let allPhrases = [];
let titleText;
let previewLabel;
let gameStarted = false;
let startMessageText;
let levelSelectText;
let gridGraphics;
let previewGraphics;
let resizeTimeout;
let themeMusic;

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
    }

    create() {
        sceneRef = this;
        GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
        PREVIEW_X = 200;

        this.game.canvas.getContext('2d', { willReadFrequently: true });

        const background = this.add.image(0, 0, `background${level}`).setOrigin(0, 0);
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        titleText = this.add.text(this.cameras.main.width / 2, 80, "Tetris de Phrases Françaises", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 2);

        scoreTextObj = this.add.text(this.cameras.main.width / 2, 120, "Score: 0", { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        scoreTextObj.setShadow(2, 2, '#000000', 2);

        previewLabel = this.add.text(PREVIEW_X, PREVIEW_Y - 20, "Prochain Mots", { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        previewLabel.setShadow(2, 2, '#000000', 2);

        gridGraphics = this.add.graphics();
        previewGraphics = this.add.graphics();

        drawGrid(gridGraphics);
        drawPreviewFrame(previewGraphics);

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
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    gameStarted = true;
                    startMessageText.destroy();
                    levelSelectText.destroy();
                    PREVIEW_COLS = level;
                    PREVIEW_WORDS = level;
                    if (!themeMusic) {
                        try {
                            themeMusic = this.sound.add(`themeMusic${level}`, { loop: true, volume: 0.5 });
                            console.log(`Loaded themeMusic${level} on Enter`);
                            themeMusic.on('play', () => console.log(`themeMusic${level} is playing`));
                            themeMusic.on('error', (err) => console.error(`Error playing themeMusic${level}:`, err));
                            themeMusic.play();
                        } catch (err) {
                            console.error(`Failed to load themeMusic${level} on Enter:`, err);
                        }
                    }
                    generateInitialWordGroups(allPhrases);
                    setupPreviewBlocks();
                    drawPreviewFrame(previewGraphics); // Redraw preview grid lines after setting PREVIEW_COLS
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
            resizeTimeout = setTimeout(() => resize(gameSize), 100);
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
            console.log(`Cycling block: word=${word}, pos=${pos}, color=${newColor.toString(16)}`);
            currentBlock.setFillStyle(newColor);
        }
    }
}

function setupPreviewBlocks() {
    previewBlocks = [];
    previewTexts = [];
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        const rowBlocks = [];
        const rowTexts = [];
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const x = PREVIEW_X + j * BLOCK_WIDTH + BLOCK_WIDTH / 2;
            const y = PREVIEW_Y + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
            const { pos, word } = currentWordGroups[0][i * PREVIEW_COLS + j] || { pos: 'Blank', word: '{Blank}' };
            const color = getColorForPos(pos);
            const block = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
            const text = sceneRef.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
            rowBlocks.push(block);
            rowTexts.push(text);
        }
        previewBlocks.push(rowBlocks);
        previewTexts.push(rowTexts);
    }
}

function resize(gameSize) {
    console.log('Resize event triggered:', gameSize);
    const width = gameSize.width;
    const height = gameSize.height;

    GRID_START_X = (width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 200;

    titleText.setPosition(width / 2, 80);
    scoreTextObj.setPosition(width / 2, 120);
    previewLabel.setPosition(PREVIEW_X, PREVIEW_Y - 20);

    drawGrid(gridGraphics);
    drawPreviewFrame(previewGraphics);

    for (let i = 0; i < PREVIEW_ROWS; i++) {
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const x = PREVIEW_X + j * BLOCK_WIDTH + BLOCK_WIDTH / 2;
            const y = PREVIEW_Y + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
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