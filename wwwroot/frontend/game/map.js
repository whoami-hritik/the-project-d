import { state } from "../state.js";
import { checkClick } from "./game.js";
import { InventoryScene } from "./inventory.js";
import * as api from "../webapp/api.js";
import * as utility from "../utility.js";
import { showNotification } from "../utility.js";


const BOTTOM = 740;
const ICONWIDTH = 80;

const locations = {
    "bootcamp": [
        { name: "A", x: 320, y: 500, active: false, bgs: "bgs_camp" },
        { name: "B", x: 241, y: 526, active: false, bgs: "bgs_camp" },
        { name: "C", x: 154, y: 502, active: false, bgs: "bgs_camp" },
        { name: "D", x: 118, y: 435, active: false, bgs: "bgs_camp" },
        { name: "E", x: 208, y: 402, active: false, bgs: "bgs_camp" },
        { name: "F", x: 300, y: 420, active: false, bgs: "bgs_camp" },
        { name: "G", x: 159, y: 352, active: false, bgs: "bgs_camp" },
        { name: "H", x: 240, y: 315, active: false, bgs: "bgs_camp" },
        { name: "I", x: 173, y: 275, active: false, bgs: "bgs_camp" },
        { name: "J", x: 310, y: 283, active: false, bgs: "bgs_camp" },
        { name: "K", x: 385, y: 275, active: false, bgs: "bgs_camp" },

        { name: "L", x: 474, y: 256, active: false, bgs: "bgs_camp" },
        { name: "M", x: 561, y: 279, active: false, bgs: "bgs_camp" },
        { name: "N", x: 608, y: 228, active: false, bgs: "bgs_camp" },
        { name: "O", x: 706, y: 236, active: false, bgs: "bgs_camp" },
        { name: "P", x: 759, y: 346, active: false, bgs: "bgs_camp" },
        { name: "Q", x: 643, y: 383, active: false, bgs: "bgs_camp" },
        { name: "R", x: 729, y: 425, active: false, bgs: "bgs_camp" },
        { name: "S", x: 621, y: 482, active: false, bgs: "bgs_camp" },
        { name: "T", x: 699, y: 515, active: false, bgs: "bgs_camp" },
        { name: "BOSS", x: 680, y: 150, active: false, bgs: "bgs_out_temple" }
    ],
    "riverfall": [
        { name: "A", x: 175, y: 317, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "B", x: 114, y: 360, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "C", x: 40, y: 398, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "D", x: 100, y: 459, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "E", x: 187, y: 491, active: false, bgs: "bgs_riverfall_water" },
        { name: "F", x: 150, y: 471, active: false, bgs: "bgs_riverfall_water" },
        { name: "G", x: 237, y: 418, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "H", x: 343, y: 418, active: false, bgs: "bgs_riverfall_tall_pine" },
        { name: "I", x: 343, y: 491, active: false, bgs: "bgs_camp" },
        { name: "J", x: 400, y: 360, active: false, bgs: "bgs_camp" },
        { name: "K", x: 440, y: 431, active: false, bgs: "bgs_camp" },
        { name: "L", x: 566, y: 348, active: false, bgs: "bgs_camp" },
        { name: "M", x: 616, y: 411, active: false, bgs: "bgs_camp" },
        { name: "N", x: 591, y: 494, active: false, bgs: "bgs_camp" },
        { name: "O", x: 688, y: 360, active: false, bgs: "bgs_camp" },
        { name: "P", x: 750, y: 287, active: false, bgs: "bgs_camp" },
        { name: "Q", x: 785, y: 371, active: false, bgs: "bgs_camp" },
        { name: "R", x: 869, y: 431, active: false, bgs: "bgs_camp" },
        { name: "S", x: 888, y: 239, active: false, bgs: "bgs_camp" },
        { name: "T", x: 785, y: 191, active: false, bgs: "bgs_camp" },
        { name: "BOSS", x: 785, y: 191, active: false, bgs: "bgs_camp" }
    ],
    "costa-gueta": [],
    "volcano": []

}

const graphs = {
    "bootcamp": {
        'A': ['B'],
        'B': ['A', 'C'],
        'C': ['B', 'D'],
        'D': ['C', 'E'],
        'E': ['D', 'F', 'G'],
        'F': ['E'],
        'G': ['E', 'H'],
        'H': ['G', 'I', 'J'],
        'I': ['H', 'J'],
        'J': ['H', 'K'],
        'K': ['J', 'L'],

        'L': ['K', 'M'],
        'M': ['L', 'N'],
        'N': ['M', 'O'],
        'O': ['N', 'P', 'BOSS'],
        'P': ['O', 'Q'],
        'Q': ['P', 'R'],
        'R': ['Q', 'S'],
        'S': ['R', 'T'],
        'T': ['S'],
        "BOSS": ['A', 'B', 'C', 'D', 'E', 'F', 'G', "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
    },
    "riverfall": {
        'A': ['B'],
        'B': ['A', 'C'],
        'C': ['B', 'D'],
        'D': ['C', 'E'],
        'E': ['D', 'F'],
        'F': ['E', 'G'],
        'G': ['F', 'H'],
        'H': ['G', 'I', 'J'],
        'I': ['H'],
        'J': ['H', 'K'],
        'K': ['J', 'L', 'M'],

        'L': ['K', 'M'],
        'M': ['K', 'N', 'O'],
        'N': ['M'],
        'O': ['M', 'P'],
        'P': ['O', 'Q'],
        'Q': ['P', 'R'],
        'R': ['Q', 'S'],
        'S': ['R', 'T'],
        'T': ['S'],
        "BOSS": ['A', 'B', 'C', 'D', 'E', 'F', 'G', "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
    },
    "costa-gueta": {}
}


const MAPS = [
    { name: "bootcamp", backgrounds: ["bootcamp-bg-1", "bootcamp-bg-2"] },
    { name: "riverfall", backgrounds: ["riverfall-bg-1", "riverfall-bg-2", "riverfall-bg-3"] },
    { name: "costa-gueta", backgrounds: ["costa-gueta-bg-1", "costa-gueta-bg-2", "costa-gueta-bg-3", "costa-gueta-bg-4", "costa-gueta-bg-5", "costa-gueta-bg-6"] },
    { name: "volcano", backgrounds: ["volcano-bg-1", "volcano-bg-2"] }
]

const icons = ["btn_shop", "btn_world", "btn_missions", "btn_items", "btn_team"]
const scenes = ["ShopScene", "WorldScene", "MissionScene", "ItemScene", "InventoryScene"]

export class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: "MapScene" });
    }

    init(data) {
        this.world = data.map;
        this.USER = state.user;

    }
    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.initializeBg();
        this.createMenu();

        api.loadUser().then(result => {
            this.USER = state.user;
            this.createProfile();
        });

        utility.createloadingOverlay(this);
        api.spawnLocations(this.world).then(result => {
            console.log(locations);
            const nodes = result.spawns.nodes;
            nodes.forEach(node => {
                const loc = locations[this.world].find(x => x.name === node);
                if (loc) {
                    loc.active = true;
                }
            });
            console.log(locations);
            this.locations();
            utility.destroyloadingOverlay(this);
        });

    }

    createMenu() {
        this.menu = this.add.container(20, BOTTOM).setDepth(100);


        icons.forEach((e, i) => {

            const icon = this.add.image(20 + (i * ICONWIDTH), 0, e);
            icon.setDisplaySize(80, 80);
            icon.setInteractive({ useHandCursor: true }).setScrollFactor(0);
            this.menu.add(icon);

            icon.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;

                if (scenes[i] === "WorldScene") {
                    this.scene.start(scenes[i]);
                } else {
                    this.scene.launch(scenes[i]);
                    this.scene.pause();
                    const sub = this.scene.get(scenes[i]);
                    sub.events.once("shutdown", () => {
                        this.scene.resume();
                        api.loadUser().then(result => {
                            this.USER = state.user;
                            this.createProfile();
                        });
                    });
                }
                console.log(scenes[i] + " started");
            });
        });

    }

    createProfile() {
        if (this.profileContainer) {
            this.profileContainer.destroy();
        }
        this.profileContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        const username = this.USER.username;
        const tokens = Array.from(username, chr => chr.charCodeAt(0));
        const profileHud = this.add.image(0, 15, "hud_profile");

        profileHud.setDisplaySize(profileHud.displayWidth / 1.2, profileHud.displayHeight / 1.2).setScrollFactor(0).setOrigin(0);
        profileHud.setInteractive({ useHandCursor: true });
        profileHud.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.launch("ProfileScene");
            this.scene.pause();
            const sub = this.scene.get("ProfileScene");
            sub.events.once("shutdown", () => {
                this.scene.resume();
                api.loadUser().then(result => {
                    this.USER = state.user;
                    this.createProfile();
                });
            });
        });
        this.profileContainer.add(profileHud);


        let lastCharWidth = 0;
        tokens.forEach((t) => {
            const chara = this.add.image(100 + lastCharWidth, 40, "c" + t);
            chara.texture.setFilter(1);
            chara.setDisplaySize(chara.displayWidth / 2, chara.displayHeight / 2).setScrollFactor(0).setOrigin(0);
            lastCharWidth += chara.displayWidth;
            this.profileContainer.add(chara);
        });

        const toncoin = this.add.image(100, 65, "item_ton");
        toncoin.setDisplaySize(toncoin.displayWidth / 3.5, toncoin.displayHeight / 3.5).setOrigin(0).setScrollFactor(0);
        this.profileContainer.add(toncoin);


        const formatNumber = (num) => {
            return new Intl.NumberFormat('en', {
                notation: 'compact',
                maximumFractionDigits: 2
            }).format(num);
        };

        const tonAmt = formatNumber(this.USER.ton).toString();
        const tonChars = Array.from(tonAmt, chr => chr.charCodeAt(0));
        let tonCharsWidth = 0;
        tonChars.forEach(ch => {

            const chars = this.add.image(105 + toncoin.displayWidth + tonCharsWidth, 70, `sw${ch}`);
            chars.texture.setFilter(1);
            chars.setDisplaySize(chars.displayWidth / 1.5, chars.displayHeight / 1.5).setScrollFactor(0).setOrigin(0);
            tonCharsWidth += chars.displayWidth;
            this.profileContainer.add(chars);
        });

        const goldCoinx = 105 + toncoin.displayWidth + tonCharsWidth + 10;
        const goldCoin = this.add.image(goldCoinx, 65, "item_gold");
        goldCoin.setDisplaySize(goldCoin.displayWidth / 4, goldCoin.displayHeight / 4).setScrollFactor(0).setOrigin(0);
        this.profileContainer.add(goldCoin);


        const goldAmt = formatNumber(this.USER.gold).toString();
        const goldChars = Array.from(goldAmt, chr => chr.charCodeAt(0));
        let goldCharWidth = 0;
        goldChars.forEach(ch => {
            const chars = this.add.image(goldCoinx + goldCoin.displayWidth + goldCharWidth + 5, 70, `sw${ch}`);
            chars.texture.setFilter(1);
            chars.setDisplaySize(chars.displayWidth / 1.5, chars.displayHeight / 1.5).setScrollFactor(0).setOrigin(0);
            goldCharWidth += chars.displayWidth;
            this.profileContainer.add(chars);
        });


        const EGGSX = goldCoinx + goldCoin.displayWidth + goldCharWidth + 10;
        const EGGS = this.add.image(EGGSX, 68, "item_eggs");
        EGGS.setDisplaySize(24, 24).setScrollFactor(0).setOrigin(0);
        this.profileContainer.add(EGGS);

        const EGGS_amt = formatNumber(this.USER.eggs).toString();
        const EGGS_chars = Array.from(EGGS_amt, chr => chr.charCodeAt(0));
        let EGGS_charWidth = 0;
        EGGS_chars.forEach(ch => {
            const chars = this.add.image(EGGSX + EGGS.displayWidth + EGGS_charWidth + 5, 70, `sw${ch}`);
            chars.texture.setFilter(1);
            chars.setDisplaySize(chars.displayWidth / 1.5, chars.displayHeight / 1.5).setScrollFactor(0).setOrigin(0);
            EGGS_charWidth += chars.displayWidth;
            this.profileContainer.add(chars);
        });
    }

    locations() {

        const player = this.add.image(locations[this.world][0].x, locations[this.world][0].y - 20, "player").setDepth(10);
        player.position = locations[this.world][0].name;


        locations[this.world].forEach((l, i) => {
            const node = this.add.image(l.x, l.y, "node").setDisplaySize(50, 40).setOrigin().setInteractive({ useHandCursor: true });
            console.log("placed " + i)
            if (l.active) {
                this.add.image(l.x, l.y - 20, "marker_battle").setDisplaySize(35, 40).setDepth(9);
                console.log(l.name + " active");
            }
            if (l.name === "BOSS") {
                this.add.image(l.x, l.y - 30, "marker_boss").setDisplaySize(110, 110).setDepth(9);
                console.log(l.name + " active");
            }

            node.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                console.log("clicked-" + l.name,)
                const path = pathCalculator(player.position, l.name, graphs[this.world]);
                if (path == null) {
                    console.log("invalid path");
                    return;
                }

                // Stop any current movement before starting a new one
                this.tweens.killTweensOf(player);


                if (path.length > 0 && path[0] === player.position) {
                    path.shift();
                }

                const moveNext = (index) => {
                    if (index >= path.length) return;

                    const node = path[index];
                    const g = locations[this.world].find(x => x.name == node);

                    this.tweens.add({
                        targets: player,
                        x: g.x,
                        y: g.y - 20,
                        duration: 400,
                        ease: 'Linear',
                        onComplete: () => {
                            player.position = g.name;
                            moveNext(index + 1); // Trigger the next segment
                            //start battle if active
                            if (player.position == l.name && l.active) {
                                api.StartBattle(this.world, l.name, state.selectedMonster.instanceId).then(result => {
                                    if (result.success) {
                                        l.active = false;
                                        this.scene.start("BattleScene", { map: this.world, node: l, battleState: result.battleState })
                                    }
                                    else {
                                        showNotification(this, result.reason);
                                    }

                                });

                            }

                        }
                    });
                };

                moveNext(0);
            });
        });

    }

    initializeBg() {
        const mapConfig = MAPS.find(m => m.name === this.world) ?? MAPS[0];
        const bgKeys = mapConfig.backgrounds;

        this.edgePadding = 40;

        // ---- CREATE PANELS ----
        this.panels = bgKeys.map((key, i) => {
            const img = this.add.image(0, 0, key).setOrigin(0);

            const scale = this.scale.height / img.height;
            img.setScale(scale);

            img.displayWidth = Math.round(img.displayWidth);
            return img;
        });

        // Position panels side-by-side (ONLY ONCE) using their actual widths
        let currentX = 0;
        this.panels.forEach((img) => {
            img.x = currentX;
            currentX += img.displayWidth;
        });

        // ---- CAMERA SETUP ----
        const totalWidth = currentX;

        this.minScroll = 0;
        this.maxScroll = Math.max(0, totalWidth - this.scale.width);

        this.cameras.main.setBounds(0, 0, totalWidth, this.scale.height);

        // ---- STATE ----
        this.dragStartX = 0;
        this.startScrollX = 0;

        // ---- INPUT ----
        this.input.on('pointerdown', (pointer) => {
            this.dragStartX = pointer.x;
            this.startScrollX = this.cameras.main.scrollX;
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;

            let dx = pointer.x - this.dragStartX;

            let newScroll = this.startScrollX - dx;

            // Clamp (prevents empty space)
            newScroll = Phaser.Math.Clamp(
                newScroll,
                this.minScroll,
                this.maxScroll
            );

            this.cameras.main.scrollX = Math.round(newScroll);
        });

        this.input.on('pointerup', (pointer) => {
            let dx = pointer.x - this.dragStartX;
            let finalScroll = this.startScrollX - dx;

            finalScroll = Phaser.Math.Clamp(
                finalScroll,
                this.minScroll,
                this.maxScroll
            );

            // Snap to nearest panel
            let closestPanelIndex = 0;
            let minDiff = Infinity;
            this.panels.forEach((img, i) => {
                let diff = Math.abs(img.x - finalScroll);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPanelIndex = i;
                }
            });

            const snappedScroll = Phaser.Math.Clamp(
                this.panels[closestPanelIndex].x,
                this.minScroll,
                this.maxScroll
            );

            // Animate camera instead of panels
            this.tweens.add({
                targets: this.cameras.main,
                scrollX: snappedScroll,
                duration: 300,
                ease: 'Power2'
            });
        });
    }
    update() {

    }
}




function pathCalculator(starting, target, graph) {
    let queue = [[starting]]
    let visited = new Set();

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === target) {
            console.log("path: " + path)
            return path
        };

        if (!visited.has(node)) {
            visited.add(node);

            let neighbour = graph[node];

            for (let i = 0; i < neighbour.length; i++) {
                queue.push([...path, neighbour[i]]);
            }
        }
    }
    return null;
}