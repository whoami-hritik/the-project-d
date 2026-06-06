// import Phaser from "phaser";
import { PreloadScene } from "./preload.js";
import { GameScene } from "./game.js";
import { BattlegroundScene } from "./background.js";
import { typeChart } from "./typeChart.js";
import { InventoryScene } from "./inventory.js";
import { MissionScene } from "./mission.js";
import { SettingScene } from "./settings.js";
import { BootScene } from "./boot.js";
import { PetScene } from "./pets.js";
import { tg } from "../js/telegram.js";

// import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
// const config = {
//     type: Phaser.AUTO,
//     width: 600,
//     height: 1000,
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH
//     },
//     scene: [PreloadScene, GameScene, BattlegroundScene],
//     physics: {
//         default: "arcade",
//         arcade: {
//             debug : false
//         }
//     }
// };

const config = {
  type: Phaser.AUTO,

  width: 400,
  height: 720,
  parent: "game-container",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: "arcade",
    arcade: { debug: false }
  },

  scene: [BootScene, PreloadScene, GameScene, BattlegroundScene, InventoryScene, MissionScene, SettingScene, PetScene],
  plugins: {
        scene: [{
            key: 'rexVirtualJoystick',
            plugin: window.rexvirtualjoystickplugin, 
            mapping: 'rexVirtualJoystick'
        }]
  },
  render: {
        pixelArt: false,
        roundPixels: true
  }
};




new Phaser.Game(config);