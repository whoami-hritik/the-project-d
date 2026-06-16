// import Phaser from "phaser";
import { GameScene } from "./game.js";
import { PreloadScene } from "./preload.js";
import { InventoryScene } from "./inventory.js";
import { BattleScene } from "./battle.js";

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // this.load.image("loading-bg", "assets/world/landing.png");
        // this.load.image("play-button", "assets/world/play.png");
        this.load.audio("bg-music", "assets/audio/background-music.ogg");
        this.load.audio("click-sfx", "assets/audio/click.ogg");
        this.load.audio("battleground-music", "assets/audio/battleground.ogg");
        this.load.audio("pop-up", "assets/audio/pop_1.wav");
        console.log("Main loaded");
    }

    create() {
        const { width, height } = this.scale;
        // Background
        const bg = this.add.image(0, 0, "loading-bg")
            .setOrigin(0)
            .setDepth(100)
            .setDisplaySize(width, height);

        this.game.bgMusic = this.sound.add("bg-music", {
            loop: true,
            volume: 0.5
        });
        this.game.battleMusic = this.sound.add("battleground-music", {
            loop: true,
            volume: 0.5
        });

        this.game.clickSFX = this.sound.add("click-sfx", {
            volume: 1
        });

        this.game.popupSFX = this.sound.add("pop-up", {
            volume: 1
        });

        this.scene.start("PreloadScene");
    }

}

export function startGame() {
    const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 800,
        backgroundColor: "#1d1d1d",
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 }, // or 300 if platformer
                debug: false // optional
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [MainScene, PreloadScene, GameScene, InventoryScene, BattleScene],
        plugins: {
            scene: [{
                key: 'rexVirtualJoystick',
                plugin: window.rexvirtualjoystickplugin,
                mapping: 'rexVirtualJoystick'
            }]
        },
        render: {
            pixelArt: false,
            // roundPixels: true
        }
    }

    const game = new Phaser.Game(config);
}