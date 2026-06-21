// import Phaser from "phaser";
import { WorldScene } from "./game.js";
import { PreloadScene } from "./preload.js";
import { InventoryScene } from "./inventory.js";
// import { BattleScene } from "./battle.js";
import { MapScene } from "./map.js";
import { BattleScene } from "./battle.js";
import { LabScene } from "./lab.js";
import { ItemScene } from "./item.js";
import { ShopScene } from "./shop.js";
import { ReferralScene } from "./referral.js";
import { TestScene } from "./testEffect.js";
import { LeaderboardScene } from "./leaderboard.js";
import { NotificationScene } from "./notification.js";
import { MissionScene } from "./mission.js";
import { ProfileScene } from "./profile.js";
import { StreakScene } from "./streak.js";
import { TutorialScene } from "./tutorial.js";

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        this.load.image("loading_bg", "images/bgs/loading_bg.png");
        console.log("Main loaded");
    }

    create() {
        this.scene.start("PreloadScene");
    }
}

export function startGame() {
    const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 800,
        backgroundColor: "#ffffff",
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
        scene: [MainScene, PreloadScene, WorldScene, MapScene, InventoryScene, LabScene, BattleScene, ItemScene, ShopScene, ReferralScene, TestScene, LeaderboardScene, NotificationScene, MissionScene, ProfileScene, StreakScene, TutorialScene],
        plugins: {
            scene: [{
                key: 'rexVirtualJoystick',
                plugin: window.rexvirtualjoystickplugin,
                mapping: 'rexVirtualJoystick'
            }]
        },
    }

    const game = new Phaser.Game(config);
}