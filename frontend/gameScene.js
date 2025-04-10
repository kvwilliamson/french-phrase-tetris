// gameScene.js
let sceneRef;
let allPhrases = [];
let titleText;
let previewLabel;
let gameStarted = false;
let startMessageText;
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
        this.load.audio('themeMusic', 'ThemeMusic.mp3');
        this.load.image('background', 'background.png');
    }

    create() {
        sceneRef = this;
        GRID_START_X = (this.cameras.main.width - GRID_WIDTH_PX) / 2;
        PREVIEW_X = 200;

        this.game.canvas.getContext('2d', { willReadFrequently: true });

        const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        titleText = this.add.text(this.cameras.main.width / 2, 80, "Tetris de Phrases Françaises", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        titleText.setShadow(2, 2, '#000000', 2);

        scoreTextObj = this.add.text(this.cameras.main.width / 2, 120, "Score: 0", { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        scoreTextObj.setShadow(2, 2, '#000000', 2);

        previewLabel = this.add.text(200, 100, "Prochain Mots", { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
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

        generateInitialWordGroups(allPhrases);

        for (let i = 0; i < PREVIEW_WORDS; i++) {
            const x = PREVIEW_X + BLOCK_WIDTH / 2;
            const y = PREVIEW_Y + BLOCK_HEIGHT / 2 + i * BLOCK_HEIGHT;
            const { pos, word } = currentWordGroups[0][i];
            const color = getColorForPos(pos);
            console.log(`Preview block ${i}: word=${word}, pos=${pos}, color=${color.toString(16)}`);
            const block = this.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
            const text = this.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
            previewBlocks.push(block);
            previewTexts.push(text);
        }

        themeMusic = this.sound.add('themeMusic', { loop: true, volume: 0.5 });
        themeMusic.play();

        this.input.once('pointerdown', () => {
            if (!themeMusic.isPlaying) themeMusic.play();
        });
        this.input.keyboard.once('keydown', () => {
            if (!themeMusic.isPlaying) themeMusic.play();
        });

        this.input.keyboard.on('keydown-M', () => {
            themeMusic.isPlaying ? themeMusic.pause() : themeMusic.resume();
        });

        startMessageText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "Appuyez sur Entrée pour commencer le jeu", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        startMessageText.setShadow(2, 2, '#000000', 2);

        this.input.keyboard.on('keydown-ENTER', (event) => {
            event.preventDefault();
            if (!gameStarted) {
                gameStarted = true;
                startMessageText.destroy();
                spawnBlock(this, currentWordGroups, nextWordGroups, allPhrases);
            }
        });

        this.input.keyboard.on('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
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

function resize(gameSize) {
    console.log('Resize event triggered:', gameSize);
    const width = gameSize.width;
    GRID_START_X = (width - GRID_WIDTH_PX) / 2;
    PREVIEW_X = 200;

    titleText.setPosition(width / 2, 80);
    scoreTextObj.setPosition(width / 2, 120);
    previewLabel.setPosition(200, 100);

    drawGrid(gridGraphics);
    drawPreviewFrame(previewGraphics);

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

    const background = sceneRef.children.list.find(child => child.texture && child.texture.key === 'background');
    if (background) {
        background.setDisplaySize(width, gameSize.height);
    }

    if (startMessageText) {
        startMessageText.setPosition(width / 2, gameSize.height / 2);
    }
}