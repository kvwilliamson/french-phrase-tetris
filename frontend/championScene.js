class ChampionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ChampionScene' });
        this.championMusic = null;  // Add music reference
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        const { width, height } = this.scale;

        // Try to play music, but don't crash if it fails
        try {
            this.championMusic = this.sound.add('championMusic', { loop: true, volume: 0.7 });
            if (this.championMusic) {
                this.championMusic.play();
            }
        } catch (e) {
            console.warn('Champion music not available');
        }

        // Add dark background
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        // Create rainbow colored, pulsing "CHAMPION!" text
        const congratsText = this.add.text(width / 2, height / 3, 'CHAMPION!', {
            fontSize: '84px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { color: '#000000', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Rainbow color animation for the text
        let hue = 0;
        this.time.addEvent({
            delay: 50,
            callback: () => {
                hue = (hue + 0.01) % 1;
                const color = Phaser.Display.Color.HSVToRGB(hue, 1, 1);
                congratsText.setTint(color.color);
            },
            loop: true
        });

        // Pulsing scale animation for the text
        this.tweens.add({
            targets: congratsText,
            scale: { from: 1, to: 1.1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add score text with golden glow
        const scoreText = this.add.text(width / 2, height / 2, `Score Final: ${this.finalScore}`, {
            fontSize: '48px',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { color: '#FFD700', blur: 6, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Add timer for auto-transition after 30 seconds
        this.time.delayedCall(30000, () => {
            // Stop the champion music
            if (this.championMusic) {
                this.championMusic.stop();
                console.log('Stopping champion music');  // Debug log
            }

            // Start GameScene and check for high score
            this.scene.start('GameScene');
            
            // Small delay to ensure scene transition is complete before checking high score
            this.time.delayedCall(100, () => {
                const gameScene = this.scene.get('GameScene');
                if (gameScene) {
                    gameScene.promptForHighScoreName(this.finalScore);
                }
            });
        });

        // Add rotating stars in the background (emoji-based particles as fallback)
        for (let i = 0; i < 20; i++) {
            const star = this.add.text(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                '⭐',
                { fontSize: '24px' }
            ).setDepth(-1).setAlpha(0.6);

            this.tweens.add({
                targets: star,
                angle: 360,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                scale: { from: 0.5, to: 1 },
                yoyo: true
            });
        }

        // Add sparkle emojis that float up
        const emojis = ['✨', '💫', '🌟'];
        this.time.addEvent({
            delay: 300,
            callback: () => {
                const emoji = this.add.text(
                    Phaser.Math.Between(0, width),
                    height + 30,
                    Phaser.Math.RND.pick(emojis),
                    { fontSize: '32px' }
                ).setAlpha(0.7);

                this.tweens.add({
                    targets: emoji,
                    y: -30,
                    alpha: 0,
                    duration: 3000,
                    ease: 'Power1',
                    onComplete: () => emoji.destroy()
                });
            },
            loop: true
        });
    }

    shutdown() {
        // Additional cleanup when scene shuts down
        if (this.championMusic) {
            this.championMusic.stop();
        }
    }
}

window.ChampionScene = ChampionScene;
