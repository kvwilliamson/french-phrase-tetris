class LoaderScene extends Phaser.Scene {
    constructor() {
        super('LoaderScene');
    }

    preload() {
        // Add loading event handlers
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading asset:', fileObj.key);
        });
        
        this.load.on('filecomplete-audio-championMusic', () => {
            console.log('Champion music loaded successfully');
        });

        // Load initial audio assets
        this.load.audio('championMusic', 'champion.mp3');
        this.load.image('spark', 'spark.jpg');
    }

    create() {
        // Try to play a test sound to unlock audio
        try {
            const music = this.sound.add('championMusic');
            
            // Add one-time input handlers to unlock audio
            const unlockAudio = () => {
                console.log('Attempting to unlock audio...');
                if (music) {
                    music.play({ volume: 0.001, duration: 100 });
                    music.stop();
                }
            };
            
            this.input.once('pointerdown', unlockAudio);
            this.input.keyboard.once('keydown', unlockAudio);
        } catch (e) {
            console.error('Error setting up audio:', e);
        }

        // Start the game scene
        this.scene.start('GameScene');
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    scene: [LoaderScene, GameScene, ChampionScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    audio: {
        disableWebAudio: false,
        noAudio: false
    }
};

const game = new Phaser.Game(config);
