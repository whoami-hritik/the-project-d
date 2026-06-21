import { MapScene } from "./map.js";
import { state } from "../state.js";
import { InventoryScene } from "./inventory.js";
import { LeaderboardScene } from "./leaderboard.js";
import { MissionScene } from "./mission.js";
import { TestScene } from "./testEffect.js";
import * as api from "../webapp/api.js";
import * as utlity from "../utility.js";
import { t } from "../translations.js";


const BOTTOM = 740;
const ICONWIDTH = 80;


const MapUnlockCost = {
    "bootcamp": {
        "ton": 0,
        "level": 1,
        "active": true
    },
    "riverfall": {
        "ton": 1,
        "level": 3,
        "active": true
    },
    "costa-gueta": {
        "ton": 1.5,
        "level": 5,
        "active": false
    },
    "volcano": {
        "ton": 3,
        "level": 8,
        "active": false
    },
}

export class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: "WorldScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;



        this.initializeBG();
        this.createMenu();

        api.loadUser().then(result => {
            this.USER = state.user;
            this.createProfile();
            this.renderWorldIcons();

            if (this.USER && !this.USER.streakClaimed) {
                this.scene.launch("StreakScene");
            }

            if (!this.USER.bonus) {
                this.createOverlay();
                this.initiateBonus();
            } else {
                if (result && result.prelaunchReward && result.prelaunchReward.success) {
                    this.showPrelaunchCongratulations(result.prelaunchReward);
                }
            }
        })

    }

    createProfile() {
        if (this.profileContainer) {
            this.profileContainer.destroy();
        }
        this.profileContainer = this.add.container(0, 0);

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
                maximumFractionDigits: 2 // Adjust decimal places here
            }).format(num);
        };

        const tonAmt = formatNumber(this.USER.ton).toString();
        const tonChars = Array.from(tonAmt, chr => chr.charCodeAt(0));
        let tonCharsWidth = 0
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

    addCustomText(container, x, y, text, fontPrefix, scale = 0.5, spacingOffset = 0, align = 'left') {
        const str = String(text);
        const chars = Array.from(str, chr => chr.charCodeAt(0));
        let lengthWidth = 0;
        const tempImages = [];

        chars.forEach(ch => {
            let key = fontPrefix + ch;
            if (fontPrefix === "ch") {
                if (ch === 32) key = "ch32";
                else if (ch === 35) key = "ch35";
                else if (ch < 48 || ch > 57) {
                    key = "sb" + ch;
                }
            }

            if (!this.textures.exists(key)) {
                let fallbackPrefix = fontPrefix === "wss" ? "sw" : (fontPrefix.startsWith("s") ? fontPrefix : "sw");
                key = fallbackPrefix + ch;
                if (!this.textures.exists(key)) return;
            }

            const img = this.add.image(lengthWidth, 0, key).setOrigin(0, 0);
            img.texture.setFilter(1);
            img.setScale(scale);
            lengthWidth += img.displayWidth + spacingOffset;
            tempImages.push(img);
        });

        let offsetX = 0;
        if (align === 'center') {
            offsetX = -lengthWidth / 2;
        } else if (align === 'right') {
            offsetX = -lengthWidth;
        }

        tempImages.forEach(img => {
            img.x += offsetX;
            img.y += y;
            img.x += x;
            img.setScrollFactor(0);
            if (container) {
                container.add(img);
            }
        });

        return lengthWidth;


    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5)
            .setOrigin(0)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive();

        this.overlay.on('pointerdown', () => {

        });
    }

    destroyOverlay() {
        this.overlay.destroy();
    }

    createMenu() {
        this.menu = this.add.container(20, BOTTOM);
        const icons = ["btn_shop", "btn_referral", "btn_missions", "btn_items", "btn_team"]
        const scenes = ["ShopScene", "ReferralScene", "MissionScene", "ItemScene", "InventoryScene"]

        icons.forEach((e, i) => {
            const icon = this.add.image(20 + (i * ICONWIDTH), 0, e);
            icon.setDisplaySize(80, 80);
            icon.setInteractive({ useHandCursor: true }).setScrollFactor(0);
            this.menu.add(icon);


            icon.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                if (scenes[i] === "") {

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
                    console.log(scenes[i] + " started");
                }

            });

        });

    }

    initiateBonus() {
        const bonusMonsters = ["grunko", "blubbo", "blazik"]

        const container = this.add.container(0, -1000).setDepth(100).setScrollFactor(0);

        const title = this.add.image(90, 320, "choose_title").setDisplaySize(220, 20).setOrigin(0);
        const pannelEarth = this.add.image(10, 350, "choose_panel_earth").setDisplaySize(120, 210).setOrigin(0);
        const pannelWater = this.add.image(137.5, 350, "choose_panel_water").setDisplaySize(120, 210).setOrigin(0);
        const pannelFire = this.add.image(265, 350, "choose_panel_fire").setDisplaySize(120, 210).setOrigin(0);

        container.add([title, pannelEarth, pannelFire, pannelWater]);


        bonusMonsters.forEach((m, index) => {
            const monster = this.add.image(20 + index * 125, 415, "front_" + m).setDisplaySize(110, 95).setOrigin(0);
            const btnChoose = this.add.image(20 + index * 130, 530, "btn_choose").setDisplaySize(95, 45).setOrigin(0).setInteractive({ useHandCursor: true });
            btnChoose.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;


                api.GetBonus(index).then(data => {
                    if (data && data.success) {
                        console.log("bonus received");
                        container.destroy();
                        const selectedMons = this.add.image(80, this.height / 3, "front_" + m).setDisplaySize(120, 125).setOrigin(0).setDepth(100).setScrollFactor(0);

                        this.tweens.add({
                            targets: selectedMons,
                            scale: 1,
                            duration: 500,
                            ease: "Power2",
                            yoyo: false,
                            onComplete: () => {
                                this.overlay.on("pointerup", (pointer) => {
                                    if (!checkClick(pointer)) return;
                                    selectedMons.destroy();
                                    this.destroyOverlay();
                                    if (data.prelaunchReward && data.prelaunchReward.success) {
                                        this.showPrelaunchCongratulations(data.prelaunchReward);
                                    }
                                });
                            }
                        })
                    }
                });



            });
            container.add([monster, btnChoose]);

            this.tweens.add({
                targets: container,
                y: 0,
                duration: 500,
                delay: 1000
            })
        });

    }

    initializeBG() {
        const bg = this.add.image(0, 0, "world-bg");
        bg.setOrigin(0);

        const texture = this.textures.get("world-bg").getSourceImage();


        const scale = (this.height + 100) / bg.height;
        bg.setScale(scale);

        // Collector Icon Container (x: 110, y: 310 centers a 120x120 icon in the 50-170 / 250-370 box)
        const collectorContainer = this.add.container(110, 310);

        const collector = this.add.image(0, 0, "collector_icon").setOrigin(0.5);
        collector.setDisplaySize(120, 120);

        // Ornate "COLLECTOR" title text with gold-to-orange gradient
        const collectorTitle = this.add.text(0, 68, "COLLECTOR", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "18px",
            stroke: "#000000",
            strokeThickness: 5,
            align: "center"
        }).setOrigin(0.5);

        // Apply linear gradient fill
        const titleGrad = collectorTitle.context.createLinearGradient(0, 0, 0, collectorTitle.height);
        titleGrad.addColorStop(0, '#ffe066'); // Light gold
        titleGrad.addColorStop(1, '#f5a623'); // Gold-orange
        collectorTitle.setFill(titleGrad);


        // Translucent dark capsule background with a gold stroke
        const timerBg = this.add.graphics();
        timerBg.fillStyle(0x000000, 0.65);
        timerBg.fillRoundedRect(-65, -87, 130, 24, 6);
        timerBg.lineStyle(1.5, 0xffd700, 0.8);
        timerBg.strokeRoundedRect(-65, -87, 130, 24, 6);

        // Neon yellow/gold stylized countdown timer
        const timerText = this.add.text(0, -75, "3d 00h 00m 00s", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "15px",
            color: "#ffd700",
            stroke: "#000000",
            strokeThickness: 4,
            align: "center"
        }).setOrigin(0.5);

        collectorContainer.add([collector, collectorTitle, timerBg, timerText]);

        // Smooth pulse tween scaling the entire container
        this.tweens.add({
            targets: collectorContainer,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 24 June 1:00 PM IST = 24 June 07:30 AM UTC (Month index 5 = June)
        const targetTime = Date.UTC(2026, 5, 24, 7, 30, 0);

        const updateTimer = () => {
            const now = Date.now();
            const diffMs = targetTime - now;

            if (diffMs > 0) {
                const totalSeconds = Math.floor(diffMs / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const pad = (num) => String(num).padStart(2, '0');
                timerText.setText(`${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
            } else {
                timerText.setText("EXPIRED");
            }
        };

        // Run immediately and start the ticker
        updateTimer();
        this.time.addEvent({
            delay: 1000,
            callback: updateTimer,
            loop: true
        });


        const worldWidth = bg.displayWidth;
        const worldHeight = bg.displayHeight;

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight); //camera bound
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight); //world bound

        this.cameras.main.scrollY = 0;
        this.input.on("pointermove", (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
            }
        });
    }

    renderWorldIcons() {
        const worlds = [
            { name: "bootcamp", x: 90, y: 600 },
            { name: "riverfall", x: 475, y: 476 },
            // { name: "ruins", x: 1058, y: 488 },
            { name: "costa-gueta", x: 602, y: 372 },
            { name: "volcano", x: 827, y: 549 },
            // { name: "winterdale", x: 610, y: 583 },
            // { name: "castle", x: 772,y:395 },
            // { name: "gold_city", x: 1131, y: 429 },
            // { name: "fire_temple", x:135, y: 380 },
            // { name: "powerplant", x: 408, y: 453 }

        ];

        const showConfirmModal = (mapName, cost, onConfirm) => {
            const modalContainer = this.add.container(0, 0).setDepth(200).setScrollFactor(0);

            const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
                .setOrigin(0)
                .setInteractive().setScrollFactor(0);
            modalContainer.add(blocker);

            const modalW = 280;
            const modalH = 220;
            const modalX = this.width / 2;
            const modalY = this.height / 2;

            // Card background
            const card = this.add.graphics().setScrollFactor(0);
            card.fillStyle(0xf8fafc, 0.98); // Slate 50
            card.lineStyle(3, 0x0f172a, 1);  // Slate 900
            card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
            card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
            modalContainer.add(card);

            // Title Text
            const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 25, t("unlock_map_title"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "20px",
                color: "#d97706" // Amber 600
            }).setOrigin(0.5).setScrollFactor(0);
            titleTxt.setStroke("#0f172a", 4);
            modalContainer.add(titleTxt);

            // Body Text
            const bodyTxt = this.add.text(modalX, modalY - 15, t("unlock_map_desc", { name: mapName.toUpperCase(), cost: cost }), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "14px",
                color: "#0f172a",
                align: "center"
            }).setOrigin(0.5).setScrollFactor(0);
            bodyTxt.setStroke("#ffffff", 3);
            modalContainer.add(bodyTxt);

            // Confirm Button (btn_blank tinted green)
            const btnConfirm = this.add.image(modalX - 60, modalY + 60, "btn_blank").setDisplaySize(90, 40).setInteractive({ useHandCursor: true }).setScrollFactor(0);
            btnConfirm.setTint(0x16a34a);
            const confirmTxt = this.add.text(modalX - 60, modalY + 60, t("buy"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0.5).setScrollFactor(0);
            confirmTxt.setStroke("#14532d", 3);

            // Cancel Button (btn_cancel)
            const btnCancel = this.add.image(modalX + 60, modalY + 60, "btn_cancel").setDisplaySize(90, 40).setInteractive({ useHandCursor: true }).setScrollFactor(0);

            modalContainer.add([btnConfirm, confirmTxt, btnCancel]);



            btnCancel.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                modalContainer.destroy();
            });

            btnConfirm.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                modalContainer.destroy();
                onConfirm();
            });
        };

        if (this.worldIconGroup) {
            this.worldIconGroup.destroy(true);
        }
        this.worldIconGroup = this.add.group();

        worlds.forEach((w, i) => {
            const isUnlocked = this.USER.unlockedWorlds && this.USER.unlockedWorlds.includes(w.name);
            const world = this.add.image(w.x, w.y, "world-" + w.name + "-icon");
            world.setDisplaySize(80, 80).setOrigin(0).setInteractive({ useHandCursor: true });
            this.worldIconGroup.add(world);

            if (!isUnlocked) {
                // Dim the map icon
                world.setTint(0x444444);

                const mapMeta = MapUnlockCost[w.name];
                const isActive = mapMeta ? mapMeta.active : true;

                if (!isActive) {
                    // Custom coming soon badge
                    const badge = this.add.graphics();
                    // Shadow
                    badge.fillStyle(0x000000, 0.4);
                    badge.fillRoundedRect(w.x + 5, w.y + 27, 70, 26, 6);

                    // Background - slate-800 with gold border
                    badge.fillStyle(0x1e293b, 0.95); // Dark Slate
                    badge.lineStyle(2, 0xd97706, 1); // Gold Border
                    badge.fillRoundedRect(w.x + 5, w.y + 25, 70, 26, 6);
                    badge.strokeRoundedRect(w.x + 5, w.y + 25, 70, 26, 6);
                    this.worldIconGroup.add(badge);

                    // Text
                    const comingSoonText = this.add.text(w.x + 40, w.y + 38, t("coming_soon"), {
                        fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                        fontSize: "9px",
                        color: "#f59e0b",
                        align: "center"
                    }).setOrigin(0.5);
                    comingSoonText.setStroke("#000000", 2.5);
                    comingSoonText.setShadow(1, 1, "#000000", 1, true, true);
                    this.worldIconGroup.add(comingSoonText);
                } else {
                    // Custom gold and slate lock badge
                    const badge = this.add.graphics();
                    // Shadow
                    badge.fillStyle(0x000000, 0.4);
                    badge.fillCircle(w.x + 40, w.y + 42, 24);

                    // Outer Gold Ring
                    badge.fillStyle(0xf59e0b, 1); // Amber 500
                    badge.fillCircle(w.x + 40, w.y + 40, 24);

                    // Inner Gold Ring
                    badge.fillStyle(0xd97706, 1); // Amber 600
                    badge.fillCircle(w.x + 40, w.y + 40, 22);

                    // Slate Center
                    badge.fillStyle(0x0f172a, 0.9);
                    badge.fillCircle(w.x + 40, w.y + 40, 19);

                    this.worldIconGroup.add(badge);

                    // Lock emoji symbol in center
                    const lockText = this.add.text(w.x + 40, w.y + 36, "🔒", {
                        fontFamily: "Lilita One, Arial, sans-serif",
                        fontSize: "18px"
                    }).setOrigin(0.5);
                    lockText.setShadow(1, 2, "#000000", 2, true, true);
                    this.worldIconGroup.add(lockText);

                    // Level requirement text
                    if (mapMeta && mapMeta.level > 1) {
                        const lvlText = this.add.text(w.x + 40, w.y + 51, t("level_locked", { level: mapMeta.level }), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "9px",
                            color: "#fbbf24"
                        }).setOrigin(0.5);
                        lvlText.setStroke("#000000", 3);
                        lvlText.setShadow(1, 1, "#000000", 0, true, true);
                        this.worldIconGroup.add(lvlText);
                    }
                }
            }

            world.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;

                const isUnlockedCheck = this.USER.unlockedWorlds && this.USER.unlockedWorlds.includes(w.name);
                if (isUnlockedCheck) {
                    utlity.createloadingOverlay(this);
                    api.getMapInfo(w.name).then(res => {
                        utlity.destroyloadingOverlay(this);
                        if (!res || !res.success) {
                            utlity.showNotification(this, t("failed_to_load_map"));
                            return;
                        }

                        const uniqueMapMonsters = res.monsters || [];
                        const capturedMonsters = res.capturedMonsters || [];
                        const capturedCount = capturedMonsters.length;
                        const totalMapMonster = uniqueMapMonsters.length;
                        const isBossDefeated = res.isBossDefeated || false;

                        this.createOverlay();
                        const info_container = this.add.container(200, 400).setDepth(101).setScrollFactor(0);

                        // Custom Vector Background Card with Gradient Glow and Shadow (Light Theme)
                        const cardBg = this.add.graphics();
                        cardBg.fillStyle(0x020617, 0.4); // Shadow
                        cardBg.fillRoundedRect(-183, -223, 366, 446, 24);

                        cardBg.fillStyle(0xf8fafc, 0.98); // Main card base (slate-50 interior)
                        cardBg.fillRoundedRect(-180, -220, 360, 440, 20);

                        cardBg.lineStyle(3.5, 0x0f172a, 1); // Dark Slate outline
                        cardBg.strokeRoundedRect(-180, -220, 360, 440, 20);

                        cardBg.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border frame
                        cardBg.strokeRoundedRect(-176, -216, 352, 432, 16);

                        // Title Ribbon Banner (Sky Blue themed)
                        const ribbonW = 240;
                        const ribbonH = 40;
                        cardBg.fillStyle(0x0369a1, 0.95); // sky-700
                        cardBg.lineStyle(2, 0x0ea5e9, 1); // sky-500 border
                        cardBg.fillRoundedRect(-ribbonW / 2, -220 - 12, ribbonW, ribbonH, 10);
                        cardBg.strokeRoundedRect(-ribbonW / 2, -220 - 12, ribbonW, ribbonH, 10);
                        info_container.add(cardBg);

                        // Header Title
                        const titleText = this.add.text(0, -220 + 8, w.name.toUpperCase(), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "20px",
                            color: "#ffffff"
                        }).setOrigin(0.5);
                        titleText.setStroke("#0284c7", 3);
                        info_container.add(titleText);

                        // Custom Vector Close Button (Light Theme)
                        const btn_close = this.add.container(155, -196).setScrollFactor(0);
                        const closeBg = this.add.graphics();
                        closeBg.fillStyle(0xe2e8f0, 1); // slate-200
                        closeBg.fillCircle(0, 0, 16);
                        closeBg.lineStyle(2.5, 0x0f172a, 1); // slate-900 border
                        closeBg.strokeCircle(0, 0, 16);
                        const closeText = this.add.text(0, 0, "×", {
                            fontFamily: "Outfit, Arial",
                            fontSize: "22px",
                            color: "#0f172a",
                            fontWeight: "bold"
                        }).setOrigin(0.5, 0.55);
                        btn_close.add([closeBg, closeText]);
                        btn_close.setSize(32, 32);
                        btn_close.setInteractive({ useHandCursor: true });
                        info_container.add(btn_close);

                        // Capture Progress Labels (Light Theme)
                        const lblCaptured = this.add.text(-150, -135, t("captured_species"), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "14px",
                            color: "#334155"
                        }).setOrigin(0, 0.5);
                        lblCaptured.setStroke("#ffffff", 3);
                        info_container.add(lblCaptured);

                        const valCaptured = this.add.text(150, -135, `${capturedCount} / ${totalMapMonster}`, {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "16px",
                            color: "#059669"
                        }).setOrigin(1, 0.5);
                        valCaptured.setStroke("#ffffff", 3);
                        info_container.add(valCaptured);

                        // Custom Vector Progress Bar (Light Theme)
                        const progressBarBg = this.add.graphics();
                        progressBarBg.fillStyle(0xe2e8f0, 1); // slate-200
                        progressBarBg.fillRoundedRect(-150, -118, 300, 20, 10);
                        progressBarBg.lineStyle(1.5, 0xcbd5e1, 1); // slate-300
                        progressBarBg.strokeRoundedRect(-150, -118, 300, 20, 10);
                        info_container.add(progressBarBg);

                        const pct = totalMapMonster > 0 ? capturedCount / totalMapMonster : 0;
                        if (pct > 0) {
                            const progressBarFill = this.add.graphics();
                            progressBarFill.fillStyle(0x10b981, 1); // emerald-500
                            progressBarFill.fillRoundedRect(-150, -118, 300 * pct, 20, 10);

                            // Highlighting overlay
                            progressBarFill.fillStyle(0xffffff, 0.25);
                            progressBarFill.fillRoundedRect(-150, -118, 300 * pct, 8, { tl: 10, tr: 10, bl: 0, br: 0 });
                            info_container.add(progressBarFill);
                        }

                        // Boss Status Section (Light Theme)
                        const lblBoss = this.add.text(-150, -65, t("boss_status"), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "14px",
                            color: "#334155"
                        }).setOrigin(0, 0.5);
                        lblBoss.setStroke("#ffffff", 3);
                        info_container.add(lblBoss);

                        const valBoss = this.add.text(150, -65, isBossDefeated ? t("defeated") : t("active"), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "14px",
                            color: isBossDefeated ? "#059669" : "#d97706"
                        }).setOrigin(1, 0.5);
                        valBoss.setStroke("#ffffff", 3);
                        info_container.add(valBoss);

                        // Divider Line
                        const sepLine = this.add.graphics();
                        sepLine.lineStyle(1.5, 0xe2e8f0, 1);
                        sepLine.lineBetween(-150, -35, 150, -35);
                        info_container.add(sepLine);

                        // Area monsters list header
                        const areaText = this.add.text(-150, -15, t("monsters_in_area"), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "14px",
                            color: "#0284c7"
                        }).setOrigin(0, 0.5);
                        areaText.setStroke("#ffffff", 3);
                        info_container.add(areaText);

                        // Scroll viewport setup
                        const monsterContainer = this.add.container(0, 0);
                        info_container.add(monsterContainer);

                        const maskShape = this.make.graphics();
                        maskShape.fillStyle(0xffffff);
                        maskShape.fillRect(50, 405, 300, 100);
                        maskShape.setScrollFactor(0);
                        const mask = maskShape.createGeometryMask();

                        const scrollContainer = this.add.container(0, 0);
                        scrollContainer.setMask(mask);
                        monsterContainer.add(scrollContainer);

                        let monsterWidth = 75;
                        uniqueMapMonsters.forEach((m, index) => {
                            const mX = -150 + (index * monsterWidth) + 37;
                            const mY = 50;

                            const slot = this.add.graphics();
                            slot.fillStyle(0xf1f5f9, 0.85); // Slate 100
                            slot.fillRoundedRect(mX - 32, mY - 32, 64, 64, 12);
                            slot.lineStyle(1.5, capturedMonsters.includes(m) ? 0x10b981 : 0xcbd5e1, 1);
                            slot.strokeRoundedRect(mX - 32, mY - 32, 64, 64, 12);
                            scrollContainer.add(slot);

                            const monsterImg = this.add.image(mX, mY, `front_${m}`);
                            monsterImg.setDisplaySize(60, 60);
                            if (!capturedMonsters.includes(m)) {
                                monsterImg.setAlpha(0.35); // Semi-transparent silhouette on light theme
                            }
                            scrollContainer.add(monsterImg);

                            const nameText = this.add.text(mX, mY + 42, m.toUpperCase(), {
                                fontFamily: "Outfit, Arial, sans-serif",
                                fontSize: "9px",
                                color: capturedMonsters.includes(m) ? "#059669" : "#64748b"
                            }).setOrigin(0.5);
                            nameText.setStroke("#ffffff", 2.5);
                            scrollContainer.add(nameText);
                        });

                        const dragZone = this.add.zone(0, 50, 300, 100).setInteractive({ useHandCursor: true });
                        dragZone.setScrollFactor(0);
                        info_container.add(dragZone);

                        let startX = 0;
                        let isDragging = false;
                        let scrollX = 0;

                        const totalContentWidth = uniqueMapMonsters.length * monsterWidth + 10;
                        const minScrollX = Math.min(0, 300 - totalContentWidth);
                        const maxScrollX = 0;

                        dragZone.on("pointerdown", (pointer) => {
                            startX = pointer.x;
                            isDragging = true;
                        });

                        const onPointerMove = (pointer) => {
                            if (!isDragging) return;
                            const deltaX = pointer.x - startX;
                            startX = pointer.x;
                            scrollX += deltaX;
                            if (scrollX < minScrollX) scrollX = minScrollX;
                            if (scrollX > maxScrollX) scrollX = maxScrollX;
                            scrollContainer.x = scrollX;
                        };

                        const onPointerUp = () => {
                            isDragging = false;
                        };

                        this.input.on("pointermove", onPointerMove);
                        this.input.on("pointerup", onPointerUp);

                        // Go / Enter Map Button (Premium Amber Gold Theme)
                        const btn_go = this.add.container(0, 160).setScrollFactor(0);
                        const goBg = this.add.graphics();
                        goBg.fillStyle(0xd97706, 1);
                        goBg.fillRoundedRect(-80, -22, 160, 44, 12);
                        goBg.lineStyle(2.5, 0xf59e0b, 1);
                        goBg.strokeRoundedRect(-80, -22, 160, 44, 12);
                        goBg.fillStyle(0xffffff, 0.2);
                        goBg.fillRoundedRect(-80, -22, 160, 20, { tl: 12, tr: 12, bl: 0, br: 0 });

                        const goText = this.add.text(0, 0, t("enter_map"), {
                            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                            fontSize: "18px",
                            color: "#ffffff"
                        }).setOrigin(0.5);
                        goText.setStroke("#78350f", 3.5);

                        btn_go.add([goBg, goText]);
                        btn_go.setSize(160, 44);
                        btn_go.setInteractive({ useHandCursor: true });
                        info_container.add(btn_go);

                        btn_go.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            this.input.off("pointermove", onPointerMove);
                            this.input.off("pointerup", onPointerUp);
                            this.scene.stop();
                            this.scene.start("MapScene", { map: w.name });
                        });

                        btn_close.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            this.input.off("pointermove", onPointerMove);
                            this.input.off("pointerup", onPointerUp);
                            this.destroyOverlay();
                            info_container.destroy();
                        });
                    }).catch(err => {
                        console.error(err);
                        utlity.destroyloadingOverlay(this);
                        utlity.showNotification(this, t("failed_to_load_map"));
                    });
                } else {
                    const mapMeta = MapUnlockCost[w.name];
                    const isActive = mapMeta ? mapMeta.active : true;

                    if (!isActive) {
                        utlity.showNotification(this, t("coming_soon_notification"));
                        return;
                    }

                    // Level check
                    if (this.USER.level < mapMeta.level) {
                        utlity.showNotification(this, t("reach_level_to_unlock", { level: mapMeta.level }));
                        return;
                    }

                    const cost = MapUnlockCost[w.name]?.ton || 0;
                    showConfirmModal(w.name, cost, () => {
                        utlity.createloadingOverlay(this);
                        api.UnlockWorld(w.name).then(data => {
                            utlity.destroyloadingOverlay(this);
                            if (data && data.success) {
                                this.USER.unlockedWorlds = data.unlockedMaps || data.unlockedWorlds || [];
                                if (data.balance) {
                                    this.USER.gold = data.balance.GOLD !== undefined ? data.balance.GOLD : (data.balance.gold !== undefined ? data.balance.gold : this.USER.gold);
                                    this.USER.ton = data.balance.TON !== undefined ? data.balance.TON : (data.balance.ton !== undefined ? data.balance.ton : this.USER.ton);
                                    this.USER.eggs = data.balance.EGGS !== undefined ? data.balance.EGGS : (data.balance.eggs !== undefined ? data.balance.eggs : this.USER.eggs);
                                }

                                this.createProfile();
                                this.renderWorldIcons(); // Re-render to update lock states!

                                this.scene.stop();
                                this.scene.start("MapScene", { map: w.name });
                            } else {
                                utlity.showNotification(this, data?.reason || t("failed_to_unlock_map"));
                            }
                        }).catch(err => {
                            console.error(err);
                            utlity.destroyloadingOverlay(this);
                            utlity.showNotification(this, t("error_unlocking_map"));
                        });
                    });
                }
            });
        });
    }

    showPrelaunchCongratulations(prelaunchReward) {
        if (!prelaunchReward || !prelaunchReward.success) return;

        this.createOverlay();

        const modalW = 320;
        const modalH = 340;
        const modalX = this.scale.width / 2;
        const modalY = this.scale.height / 2;

        const modalContainer = this.add.container(0, 0).setDepth(200).setScrollFactor(0);

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x020617, 0.4);
        cardBg.fillRoundedRect(modalX - modalW / 2 + 5, modalY - modalH / 2 + 5, modalW, modalH, 20);

        cardBg.fillStyle(0xf8fafc, 0.98);
        cardBg.lineStyle(3.5, 0x0f172a, 1);
        cardBg.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);
        cardBg.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);
        modalContainer.add(cardBg);

        const ribbonW = 260;
        const ribbonH = 40;
        cardBg.fillStyle(0xd97706, 0.95);
        cardBg.lineStyle(2, 0xf59e0b, 1);
        cardBg.fillRoundedRect(modalX - ribbonW / 2, modalY - modalH / 2 - 12, ribbonW, ribbonH, 10);
        cardBg.strokeRoundedRect(modalX - ribbonW / 2, modalY - modalH / 2 - 12, ribbonW, ribbonH, 10);

        const titleText = this.add.text(modalX, modalY - modalH / 2 + 8, t("congratulations"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);
        titleText.setStroke("#78350f", 3.5);
        modalContainer.add(titleText);

        let contentY = modalY - modalH / 2 + 50;

        const welcomeText = this.add.text(modalX, contentY, t("welcome_project_d"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "18px",
            color: "#0f172a"
        }).setOrigin(0.5);
        modalContainer.add(welcomeText);

        contentY += 35;

        const refCount = prelaunchReward.registeredReferralsCount;
        const refTitle = this.add.text(modalX, contentY, t("prelaunch_referrals", { count: refCount }), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "15px",
            fontWeight: "bold",
            color: "#475569"
        }).setOrigin(0.5);
        modalContainer.add(refTitle);

        contentY += 25;

        if (refCount > 0) {
            const itemsText = this.add.text(modalX, contentY,
                `🎁 +${prelaunchReward.monstaBalls} MonstaBall(s)\n` +
                `🎁 +${prelaunchReward.healSpells} HealSpell(s)\n` +
                `🎁 +${prelaunchReward.ragePotions} RagePotion(s)`, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "14px",
                color: "#1e293b",
                align: "center",
                lineSpacing: 4
            }).setOrigin(0.5);
            modalContainer.add(itemsText);
            contentY += 60;
        } else {
            const noRefText = this.add.text(modalX, contentY, t("no_prelaunch_referrals"), {
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                color: "#94a3b8",
                fontStyle: "italic"
            }).setOrigin(0.5);
            modalContainer.add(noRefText);
            contentY += 30;
        }

        contentY += 15;

        if (prelaunchReward.hasStarterBundle) {
            const bundleTitle = this.add.text(modalX, contentY, t("starter_bundle_unlocked"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "16px",
                color: "#10b981"
            }).setOrigin(0.5);
            modalContainer.add(bundleTitle);

            contentY += 20;

            const bundleItems = this.add.text(modalX, contentY, t("starter_bundle_items"), {
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                color: "#059669",
                fontWeight: "bold"
            }).setOrigin(0.5);
            modalContainer.add(bundleItems);
            contentY += 30;
        }

        const btnClose = this.add.image(modalX, modalY + modalH / 2 - 35, "btn_blank").setDisplaySize(120, 40).setInteractive({ useHandCursor: true });
        btnClose.setTint(0x16a34a);
        const closeTxt = this.add.text(modalX, modalY + modalH / 2 - 35, t("claim"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0.5);
        closeTxt.setStroke("#14532d", 3);

        modalContainer.add([btnClose, closeTxt]);

        btnClose.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            modalContainer.destroy();
            this.destroyOverlay();
        });
    }
}

export function checkClick(pointer) {
    const dist = Phaser.Math.Distance.Between(
        pointer.downX, pointer.downY,
        pointer.upX, pointer.upY
    );

    if (dist < 10) {
        return true;
    }
    return false;
}

export function drawCustomFont(scene, container, startX, y, text, scale = 1.0, spacing = 2) {
    const chars = Array.from(text);
    let currentX = startX;
    chars.forEach(char => {
        const charCode = char.charCodeAt(0);
        if (charCode > 32 && charCode <= 122) {
            const letter = scene.add.image(currentX, y, `c${charCode}`);
            letter.setDisplaySize(letter.displayWidth * scale, letter.displayHeight * scale).setOrigin(0, 0.5);
            container.add(letter);
            currentX += (letter.displayWidth) + spacing;
        } else {
            currentX += 10 * scale;
        }
    });
}