import { checkClick } from "./game.js";
import * as api from "../webapp/api.js";
import { state } from "../state.js";
import * as utility from "../utility.js";
import { showNotification } from "../utility.js";

const rows = 3;
const column = 2;
const slotWidth = 160;
const slotHeight = 85;

export class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: "InventoryScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.maxSlots = 3;
        const limit = Math.max(1, state.user?.unlockedSlots ?? state.user?.UnlockedSlots ?? 1);
        this.teamMonsters = state.selectedMonsters ? [...state.selectedMonsters] : [];
        if (this.teamMonsters.length > limit) {
            this.teamMonsters = this.teamMonsters.slice(0, limit);
            state.selectedMonsters = [...this.teamMonsters];
            localStorage.setItem("selectedMonsters", JSON.stringify(state.selectedMonsters));
        }

        // Single action button (moves between cards)
        this.actionBtn = null;

        // cardMap: instanceId -> { pane, objects[], badge }
        this.cardMap = {};

        this.pageIndex = 0;
        this.maxIndex = -1;

        // ⚠ BG first — so inventoryContainer renders ON TOP
        this.initializeBG();
        this.inventoryContainer = this.add.container();

        this.buildTeamSlots();
        this.syncTeamMonsters();
        this.updateInventory();
        // this.displayMonsters();
    }

    // ─── Background & navigation ──────────────────────────────────────────────

    initializeBG() {
        const bg = this.add.image(0, 0, "inventory-bg").setOrigin(0);
        bg.setDisplaySize(this.width, this.height);

        const btnBack = this.add
            .image(20, 35, "btn-back-map")
            .setDisplaySize(80, 35)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true });

        // 6 static slot backgrounds
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < column; j++) {
                const x = 45 + j * slotWidth;
                const y = 500 + i * slotHeight + i * 10;
                this.add.image(x, y, "team-slot").setDisplaySize(slotWidth, slotHeight).setOrigin(0);
            }
        }

        const nextSlots = this.add.image(0, 0, "btn_arrow_right");
        nextSlots
            .setDisplaySize(nextSlots.displayWidth / 2, nextSlots.displayHeight / 2)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true });
        nextSlots.setPosition(this.scale.width - nextSlots.displayWidth - 5, this.scale.height / 2 + 200);

        const prevSlots = this.add.image(5, this.scale.height / 2 + 200, "btn_arrow_right");
        prevSlots
            .setDisplaySize(prevSlots.displayWidth / 2, prevSlots.displayHeight / 2)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true })
            .setFlipX(true);

        nextSlots.on("pointerup", () => this.nextIndex());
        prevSlots.on("pointerup", () => this.previousIndex());

        btnBack.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.stop("InventoryScene");
        });

        this.events.on("shutdown", () => {
            // No cleanup needed
        });
    }

    nextIndex() {
        if (this.pageIndex >= this.maxIndex) return;
        this.pageIndex++;
        this.updateInventory();
    }

    previousIndex() {
        this.pageIndex--;
        if (this.pageIndex < 0) { this.pageIndex = 0; return; }
        this.updateInventory();
    }

    // ─── Team slots strip (top of screen) ────────────────────────────────────

    buildTeamSlots() {
        if (this.teamSlotsContainer) this.teamSlotsContainer.destroy();
        this.teamSlotsContainer = this.add.container(0, 0).setDepth(10);
        this.refreshTeamSlots();
    }

    refreshTeamSlots() {
        this.teamSlotsContainer.removeAll(true);
        const unlockedSlots = Math.max(1, state.user?.unlockedSlots ?? state.user?.UnlockedSlots ?? 1);

        // Position mapping:
        // Index 0 -> Middle
        // Index 1 -> Left
        // Index 2 -> Right
        const positions = [
            { x: 200, y: 470, scale: 1 / 1.5, shadowYOffset: 20 }, // Slot 0: Middle
            { x: 70, y: 450, scale: 1 / 1.7, shadowYOffset: 20 },  // Slot 1: Left
            { x: 330, y: 450, scale: 1 / 1.7, shadowYOffset: 20 }  // Slot 2: Right
        ];

        for (let i = 0; i < this.maxSlots; i++) {
            const pos = positions[i];
            const monster = this.teamMonsters[i] ?? null;

            if (i < unlockedSlots) {
                // Unlocked slot
                if (monster) {
                    const shadow = this.add.image(pos.x, pos.y + pos.shadowYOffset, "mons_shadow")
                        .setOrigin(0.5, 1);
                    shadow.setDisplaySize(shadow.width * pos.scale, shadow.height * pos.scale);

                    const team_monster = this.add.image(pos.x, pos.y, "front_" + monster.id)
                        .setOrigin(0.5, 1)
                        .setInteractive({ useHandCursor: true });
                    team_monster.setDisplaySize(team_monster.width * pos.scale, team_monster.height * pos.scale);

                    const monsterPane = this.add.image(team_monster.x, team_monster.y - team_monster.displayHeight - 10, `pane_tooltip_${monster.element}`)
                        .setInteractive({ useHandCursor: true })
                        .setOrigin(0.5, 1);
                    monsterPane.setDisplaySize(monsterPane.displayWidth / 1.7, monsterPane.displayHeight / 1.7);

                    const hpBarBG = this.add.image(monsterPane.x + 1.5, monsterPane.y - 10 * pos.scale - 5, "hpbar_med_bg")
                        .setOrigin(0.5, 1);
                    hpBarBG.setDisplaySize(hpBarBG.displayWidth / 1.7, hpBarBG.displayHeight / 1.7);

                    const hpBar = this.add.image(monsterPane.x + 1.5, monsterPane.y - 10 * pos.scale - 5, "hpbar_med_fill")
                        .setOrigin(0.5, 1);
                    hpBar.setDisplaySize(hpBar.displayWidth / 1.7, hpBar.displayHeight / 1.7);
                    hpBar.setCrop(0, 0, (monster.hp / (monster.maxHP || 100)) * hpBar.width, hpBar.height);

                    const titleContainer = this.add.container(monsterPane.x - monsterPane.displayWidth / 2 + 10 * pos.scale, monsterPane.y + 20 * pos.scale - monsterPane.displayHeight);
                    let lastTokenWidth = 0;
                    Array.from(monster.title, chr => chr.charCodeAt(0)).forEach(token => {
                        const letter = this.add.image(lastTokenWidth, 5, `c${token}`).setOrigin(0, 0);
                        letter.setDisplaySize(letter.displayWidth / 1.8, letter.displayHeight / 1.8);
                        lastTokenWidth += letter.displayWidth;
                        titleContainer.add(letter);
                    });

                    const level = "LV " + monster.level;
                    let levelWidth = 0;
                    Array.from(level, chr => chr.charCodeAt(0)).forEach(token => {
                        const letter = this.add.image(levelWidth, -20 * pos.scale - 10, `c${token}`).setOrigin(0, 0);
                        letter.setDisplaySize(letter.displayWidth / 1.7, letter.displayHeight / 1.7);
                        levelWidth += letter.displayWidth;
                        titleContainer.add(letter);
                    });

                    const MONSTER = this.add.container(0, 0, [shadow, team_monster, monsterPane, hpBarBG, hpBar, titleContainer]);

                    this.teamSlotsContainer.add(MONSTER);

                    team_monster.on("pointerup", (pointer) => {
                        if (!checkClick(pointer)) return;
                        this.scene.launch("LabScene", { monster: monster });
                        this.scene.pause();
                        const lab = this.scene.get("LabScene");
                        lab.events.once("shutdown", () => {
                            this.scene.resume();
                            this.syncTeamMonsters();
                            this.updateInventory();
                        });
                    });
                } else {
                    // Empty unlocked slot -> custom light gradient platform/pedestal card
                    const pWidth = 85;
                    const pHeight = 105;
                    const px = pos.x;
                    const py = pos.y - pHeight / 2 - 10;

                    const platform = this.add.graphics();
                    // Cyan glow outline shadow
                    platform.fillStyle(0x38bdf8, 0.12);
                    platform.fillRoundedRect(px - pWidth / 2 - 4, py - pHeight / 2 - 4, pWidth + 8, pHeight + 8, 12);

                    // Slate card
                    platform.fillStyle(0x0284c7, 0.25);
                    platform.fillRoundedRect(px - pWidth / 2, py - pHeight / 2, pWidth, pHeight, 10);
                    platform.lineStyle(2, 0x38bdf8, 0.85);
                    platform.strokeRoundedRect(px - pWidth / 2, py - pHeight / 2, pWidth, pHeight, 10);

                    // Plus sign
                    const plusSign = this.add.text(px, py - 10, "+", {
                        fontFamily: "Lilita One, sans-serif",
                        fontSize: "32px",
                        color: "#38bdf8",
                        fontStyle: "bold"
                    }).setOrigin(0.5);
                    plusSign.setStroke("#075985", 4);

                    const emptyText = this.add.text(px, py + 22, "EMPTY", {
                        fontFamily: "Lilita One, sans-serif",
                        fontSize: "12px",
                        color: "#e0f2fe",
                        fontStyle: "bold"
                    }).setOrigin(0.5);

                    this.teamSlotsContainer.add([platform, plusSign, emptyText]);
                }
            } else {
                // Locked slot -> custom light padlock & buy pedestal card
                const pWidth = 85;
                const pHeight = 105;
                const px = pos.x;
                const py = pos.y - pHeight / 2 - 10;
                const cost = (unlockedSlots + 1) * 100;

                const platform = this.add.graphics();
                // Gold glow outline shadow
                platform.fillStyle(0xfacc15, 0.12);
                platform.fillRoundedRect(px - pWidth / 2 - 4, py - pHeight / 2 - 4, pWidth + 8, pHeight + 8, 12);

                // Locked slate card
                platform.fillStyle(0xca8a04, 0.25);
                platform.fillRoundedRect(px - pWidth / 2, py - pHeight / 2, pWidth, pHeight, 10);
                platform.lineStyle(2, 0xfacc15, 0.85);
                platform.strokeRoundedRect(px - pWidth / 2, py - pHeight / 2, pWidth, pHeight, 10);

                // Custom vector padlock drawn with graphics
                const lockG = this.add.graphics();
                const lx = px;
                const ly = py - 15;

                // Lock shackle
                lockG.lineStyle(2.5, 0xfacc15, 1);
                lockG.beginPath();
                lockG.arc(lx, ly, 8, Math.PI, 0, false);
                lockG.strokePath();

                // Lock body
                lockG.fillStyle(0xfacc15, 1);
                lockG.fillRoundedRect(lx - 10, ly, 20, 16, 3);

                // Keyhole
                lockG.fillStyle(0x854d0e, 1);
                lockG.fillCircle(lx, ly + 6, 2.5);
                lockG.fillRect(lx - 1, ly + 6, 2, 6);

                const buyLabel = this.add.text(px, py + 18, "BUY", {
                    fontFamily: "Lilita One, sans-serif",
                    fontSize: "12px",
                    color: "#facc15",
                    fontStyle: "bold"
                }).setOrigin(0.5);
                buyLabel.setStroke("#854d0e", 3);

                const costLabel = this.add.text(px, py + 34, `${cost} GOLD`, {
                    fontFamily: "Lilita One, sans-serif",
                    fontSize: "10px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                costLabel.setStroke("#854d0e", 3);

                const hitArea = this.add.rectangle(px, py, pWidth, pHeight, 0x000000, 0)
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });

                this.teamSlotsContainer.add([platform, lockG, buyLabel, costLabel, hitArea]);

                // Hover anims
                hitArea.on("pointerover", () => {
                    this.tweens.add({
                        targets: [buyLabel, costLabel, lockG],
                        scale: 1.1,
                        duration: 100
                    });
                });
                hitArea.on("pointerout", () => {
                    this.tweens.add({
                        targets: [buyLabel, costLabel, lockG],
                        scale: 1.0,
                        duration: 100
                    });
                });

                hitArea.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    this.showUnlockSlotModal(i);
                });
            }
        }
    }


    showMonsterInfo(monster) {
        const container = this.add.container(0, 0);
        container.setDepth(100);

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0);
        overlay.setInteractive();

        overlay.on("pointerup", () => {
            container.destroy();
        });

        const info_panel = this.add.image(0, 410, `info_${monster.rarity}_panel`).setOrigin(0);

        const monsterImg = this.add.image(200, info_panel.y + info_panel.displayHeight / 2 - 15, `front_${monster.id}`).setOrigin(0, 1);
        monsterImg.setDisplaySize(monsterImg.displayWidth / 1.5, monsterImg.displayHeight / 1.5);

        const monster_level = this.add.text(15, 464, `Lv ${monster.level}`, {
            fontFamily: "Lilita One",
            fontSize: "12px",
            color: "#000000"
        }).setOrigin(0);

        const monster_name = this.add.text(15, 480, monster.title, {
            fontFamily: "Lilita One",
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0);
        monster_name.setStroke("#000000", 2);

        const element_symbol = this.add.image(monster_name.x + monster_name.displayWidth + 2, monster_name.y - 5, `symbol_${monster.element}`).setOrigin(0);
        element_symbol.setDisplaySize(element_symbol.displayWidth / 1.3, element_symbol.displayHeight / 1.3);

        // Dynamically compute farming rates
        const getBaseCollectorRates = (r) => {
            const rLower = (r || "common").toLowerCase();
            if (rLower === "rare") return { gold: 5, crystal: 0 };
            if (rLower === "epic") return { gold: 5, crystal: 2 };
            if (rLower === "legendary") return { gold: 10, crystal: 3 };
            return { gold: 3, crystal: 0 };
        };

        const getCollectorLevelMultiplier = (lvl) => {
            if (lvl <= 3) return 1;
            if (lvl <= 5) return 1.1;
            if (lvl <= 8) return 1.2;
            if (lvl <= 10) return 1.3;
            if (lvl <= 15) return 1.4;
            if (lvl <= 20) return 1.5;
            if (lvl <= 25) return 1.7;
            return 2;
        };

        const baseRates = getBaseCollectorRates(monster.rarity || monster.Rarity);
        const levelVal = monster.level || monster.Level || 1;
        const mult = getCollectorLevelMultiplier(levelVal);
        const goldRateVal = (monster.goldRate !== undefined && monster.goldRate !== null) ? monster.goldRate : (baseRates.gold * mult);
        const crystalRateVal = (monster.crystalRate !== undefined && monster.crystalRate !== null) ? monster.crystalRate : (baseRates.crystal * mult);

        const goldFarm = this.add.image(10, 515, "hud_gold").setOrigin(0);
        const goldFarmTxt = this.add.text(goldFarm.x + 45, goldFarm.y + 10, `${goldRateVal.toFixed(1).replace(/\.0$/, "")}/H`, {
            fontFamily: "Lilita One",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0);

        // Add base layers to container first
        container.add([overlay, info_panel, monsterImg, monster_level, monster_name, element_symbol, goldFarm, goldFarmTxt]);

        const crystalFarm = this.add.image(goldFarm.x, goldFarm.y + goldFarm.displayHeight + 10, "hud_crystal").setOrigin(0);
        const crystalFarmTxt = this.add.text(crystalFarm.x + 45, crystalFarm.y + 10, `${crystalRateVal.toFixed(1).replace(/\.0$/, "")}/H`, {
            fontFamily: "Lilita One",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0);
        container.add([crystalFarm, crystalFarmTxt]);

        const monsterHashBar = this.add.image(19, 635, "info_hashbar").setOrigin(0);

        const monsterHash = this.add.text(70, 645, monster.instanceId, {
            fontFamily: "Lilita One",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0);

        container.add([monsterHashBar, monsterHash]);

        // Draw Interactive Action Buttons (must be added after background components)
        let teamBtn;
        if (this.isInTeam(monster)) {
            // Monster is in the team. Button shown: "In Team". Clicking removes it from the team.
            teamBtn = this.add.image(20, 683, "btn_out_team").setOrigin(0).setInteractive({ useHandCursor: true });
            container.add(teamBtn);
            teamBtn.on("pointerdown", () => {
                this.removeFromTeam(monster);
                container.destroy();
                this.showMonsterInfo(monster);
            });
        } else {
            // Monster is out of the team. Button shown: "Out of Team". Clicking adds it to the team.
            teamBtn = this.add.image(20, 683, "btn_in_team").setOrigin(0).setInteractive({ useHandCursor: true });
            container.add(teamBtn);
            teamBtn.on("pointerdown", () => {
                this.addToTeam(monster);
                container.destroy();
                this.showMonsterInfo(monster);
            });
        }

        const isStaked = monster.stakedInCollector || monster.StakedInCollector;
        let stakeBtn;
        if (!isStaked) {
            stakeBtn = this.add.image(207, 683, "btn_stake").setOrigin(0).setInteractive({ useHandCursor: true });
            container.add(stakeBtn);
            stakeBtn.on("pointerdown", () => {
                this.stakeMonsterFlow(monster);
                container.destroy();
            });
        } else {
            stakeBtn = this.add.image(207, 683, "btn_unstake").setOrigin(0).setInteractive({ useHandCursor: true });
            container.add(stakeBtn);
            stakeBtn.on("pointerdown", () => {
                this.unstakeMonsterFlow(monster);
                container.destroy();
            });
        }

        const btn_list_market = this.add.image(20, 742, "btn_list_market").setOrigin(0).setInteractive({ useHandCursor: true });
        container.add(btn_list_market);

        btn_list_market.on("pointerup", async (pointer) => {
            if (!checkClick(pointer)) return;

            utility.createloadingOverlay(this);
            let RecommendedPrice = 0.1;
            try {
                const res = await api.recommendMarketplacePrice(monster.instanceId);
                RecommendedPrice = (res && res.success) ? res.recommendedPrice : 0.1;
            } catch (err) {
                console.error(err);
            } finally {
                utility.destroyloadingOverlay(this);
            }

            this.scene.launch("KeyboardScene", {
                type: "numeric",
                value: RecommendedPrice,
                placeholder: "Enter price in TON...",
                onCommit: async (val) => {
                    const price = parseFloat(val);
                    if (isNaN(price) || price <= 0) {
                        showNotification(this, "Please enter a valid price greater than 0");
                        return;
                    }

                    utility.createloadingOverlay(this);
                    try {
                        const response = await api.listInMarketplace(monster.instanceId, "monster", price);
                        if (response && response.success) {
                            showNotification(this, "Monster successfully listed in the marketplace!");
                            container.destroy();
                            this.scene.restart();
                        } else {
                            showNotification(this, response?.reason || "Failed to list monster");
                        }
                    } catch (err) {
                        console.error(err);
                        showNotification(this, "Connection error.");
                    } finally {
                        utility.destroyloadingOverlay(this);
                    }
                }
            });
        });
    }

    showUnlockSlotModal(slotIndex) {
        const unlockedSlots = Math.max(1, state.user?.unlockedSlots ?? state.user?.UnlockedSlots ?? 1);
        const cost = (unlockedSlots + 1) * 100;
        const userGold = state.user?.gold ?? 0;

        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive()
            .setDepth(150);

        const modalContainer = this.add.container(0, 0).setDepth(200);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        const card = this.add.graphics();
        card.fillStyle(0x000000, 0.35);
        card.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);

        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        card.lineStyle(2, 0x00e1ff, 0.8);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        modalContainer.add(card);

        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 25, "UNLOCK SLOT", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        titleTxt.setStroke("#000000", 4);
        modalContainer.add(titleTxt);

        if (userGold < cost) {
            const bodyTxt = this.add.text(modalX, modalY - 15, `Required: ${cost} GOLD\nYour Balance: ${Math.floor(userGold)} GOLD\n\nInsufficient GOLD balance!`, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "14px",
                color: "#ff3b30",
                align: "center"
            }).setOrigin(0.5);
            modalContainer.add(bodyTxt);

            const btnClose = this.add.graphics();
            btnClose.fillStyle(0xff3b30, 1);
            btnClose.fillRoundedRect(modalX - 45, modalY + 50, 90, 32, 6);
            btnClose.lineStyle(1.5, 0xffffff, 0.9);
            btnClose.strokeRoundedRect(modalX - 45, modalY + 50, 90, 32, 6);

            const closeText = this.add.text(modalX, modalY + 66, "OK", {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0.5);
            closeText.setStroke("#000000", 3);

            const hitArea = this.add.rectangle(modalX, modalY + 66, 90, 32, 0x000000, 0)
                .setInteractive({ useHandCursor: true });

            modalContainer.add([btnClose, closeText, hitArea]);

            hitArea.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                blocker.destroy();
                modalContainer.destroy();
            });
        } else {
            const bodyTxt = this.add.text(modalX, modalY - 15, `Do you want to unlock\na new team slot for\n${cost} GOLD?`, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "15px",
                color: "#ffffff",
                align: "center"
            }).setOrigin(0.5);
            modalContainer.add(bodyTxt);

            const btnConfirm = this.add.graphics();
            btnConfirm.fillStyle(0x34c759, 1);
            btnConfirm.fillRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);
            btnConfirm.lineStyle(1.5, 0xffffff, 0.9);
            btnConfirm.strokeRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);

            const confirmText = this.add.text(modalX - 60, modalY + 66, "BUY", {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0.5);
            confirmText.setStroke("#000000", 3);

            const hitConfirm = this.add.rectangle(modalX - 60, modalY + 66, 90, 32, 0x000000, 0)
                .setInteractive({ useHandCursor: true });

            const btnCancel = this.add.graphics();
            btnCancel.fillStyle(0xff3b30, 1);
            btnCancel.fillRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);
            btnCancel.lineStyle(1.5, 0xffffff, 0.9);
            btnCancel.strokeRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);

            const cancelText = this.add.text(modalX + 60, modalY + 66, "CANCEL", {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0.5);
            cancelText.setStroke("#000000", 3);

            const hitCancel = this.add.rectangle(modalX + 60, modalY + 66, 90, 32, 0x000000, 0)
                .setInteractive({ useHandCursor: true });

            modalContainer.add([btnConfirm, confirmText, hitConfirm, btnCancel, cancelText, hitCancel]);

            hitConfirm.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;

                api.UnlockSlots().then(result => {
                    const freshUser = result?.user || result?.User;
                    if (result && result.success && freshUser) {
                        state.user = freshUser;
                        showNotification(this, "Team slot unlocked successfully!");
                        blocker.destroy();
                        modalContainer.destroy();
                        this.refreshTeamSlots();
                    } else {
                        showNotification(this, result?.reason || "Failed to unlock slot.");
                    }
                }).catch(err => {
                    console.error("Error unlocking slot:", err);
                    showNotification(this, "Connection error.");
                });
            });

            hitCancel.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                blocker.destroy();
                modalContainer.destroy();
            });
        }
    }

    // ─── Action button (In Team / Out Team) ───────────────────────────────────

    showActionButtons(cardX, cardY, monster) {
        if (this.actionBtn) { this.actionBtn.destroy(); this.actionBtn = null; }

        this.actionBtn = this.add.container(0, 0).setDepth(30);

        const isStaked = monster.stakedInCollector || monster.StakedInCollector;
        const isEligible = (this.eligibleSpecies || []).includes(monster.id.toLowerCase());
        const inTeam = this.isInTeam(monster);

        let buttons = [];

        if (isStaked) {
            buttons.push({
                label: "UNSTAKE",
                callback: () => {
                    this.unstakeMonsterFlow(monster);
                },
                color: 0xff3b30
            });
        } else {
            buttons.push({
                label: inTeam ? "OUT TEAM" : "IN TEAM",
                callback: () => {
                    if (inTeam) {
                        this.removeFromTeam(monster);
                    } else {
                        this.addToTeam(monster);
                    }
                },
                color: inTeam ? 0xff9500 : 0x34c759
            });

            if (isEligible) {
                buttons.push({
                    label: "STAKE",
                    callback: () => {
                        this.stakeMonsterFlow(monster);
                    },
                    color: 0x00c7be
                });
            }
        }

        const btnHeight = 26;
        if (buttons.length === 1) {
            const btnX = cardX + slotWidth / 2;
            const btnY = cardY - 14;
            const b = buttons[0];
            const container = this.createSingleButton(btnX, btnY, 110, btnHeight, b.label, b.color, b.callback);
            this.actionBtn.add(container);
        } else if (buttons.length === 2) {
            const btnWidth = 75;
            const btnY = cardY - 14;

            const btn1X = cardX + slotWidth / 2 - 40;
            const b1 = buttons[0];
            const container1 = this.createSingleButton(btn1X, btnY, btnWidth, btnHeight, b1.label, b1.color, b1.callback);

            const btn2X = cardX + slotWidth / 2 + 40;
            const b2 = buttons[1];
            const container2 = this.createSingleButton(btn2X, btnY, btnWidth, btnHeight, b2.label, b2.color, b2.callback);

            this.actionBtn.add([container1, container2]);
        }
    }

    createSingleButton(x, y, width, height, label, color, callback) {
        const btn = this.add.container(x, y);

        const bg = this.add.graphics();

        bg.lineStyle(3, color, 0.4);
        bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 7);

        bg.lineStyle(1.5, 0xffffff, 0.9);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

        bg.fillStyle(0xffffff, 0.2);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height / 2, 4);

        const btnText = this.add.text(0, 0, label, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: width < 90 ? "10px" : "13px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        btnText.setStroke("#000000", 3);

        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        btn.add([bg, btnText, hitArea]);

        hitArea.on("pointerover", () => {
            this.tweens.add({
                targets: btn,
                scale: 1.1,
                duration: 100,
                ease: "Power1"
            });
        });
        hitArea.on("pointerout", () => {
            this.tweens.add({
                targets: btn,
                scale: 1.0,
                duration: 100,
                ease: "Power1"
            });
        });
        hitArea.on("pointerdown", () => {
            this.tweens.add({
                targets: btn,
                scale: 0.9,
                duration: 50,
                ease: "Power1"
            });
        });
        hitArea.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            if (this.actionBtn) { this.actionBtn.destroy(); this.actionBtn = null; }
            callback();
        });

        return btn;
    }

    dismissActionBtn() {
        if (this.actionBtn) { this.actionBtn.destroy(); this.actionBtn = null; }
    }

    stakeMonsterFlow(monster) {
        const rarity = (monster.rarity || monster.Rarity || "common").toLowerCase();

        function getCollectorLevelMultiplier(level) {
            if (level <= 3) return 1.0;
            if (level <= 5) return 1.1;
            if (level <= 8) return 1.2;
            if (level <= 10) return 1.3;
            if (level <= 15) return 1.4;
            if (level <= 20) return 1.5;
            if (level <= 25) return 1.7;
            return 2.0;
        }

        function getBaseCollectorRates(rText) {
            const r = (rText || "common").toLowerCase().trim();
            if (r === "rare") return { gold: 5, crystal: 0 };
            if (r === "epic") return { gold: 5, crystal: 2 };
            if (r === "legendary") return { gold: 10, crystal: 3 };
            return { gold: 3, crystal: 0 };
        }

        const base = getBaseCollectorRates(monster.rarity || monster.Rarity);
        const levelVal = monster.level || monster.Level || 1;
        const mult = getCollectorLevelMultiplier(levelVal);
        const goldRate = base.gold * mult;
        const crystalRate = base.crystal * mult;

        const goldRateStr = goldRate.toFixed(1).replace(/\.0$/, "") + "/H";
        const crystalRateStr = crystalRate.toFixed(1).replace(/\.0$/, "") + "/H";

        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive()
            .setDepth(150);

        const modalContainer = this.add.container(0, 0).setDepth(200);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        const card = this.add.graphics();
        card.fillStyle(0x000000, 0.35);
        card.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);

        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        card.lineStyle(2, 0x00e1ff, 0.8);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        modalContainer.add(card);

        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 25, "STAKE MONSTER", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        titleTxt.setStroke("#000000", 4);
        modalContainer.add(titleTxt);

        const bodyTxt = this.add.text(modalX, modalY - 20, `Do you want to stake this\nmonster in the collector\nto farm rewards?`, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "14px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);
        modalContainer.add(bodyTxt);

        if (crystalRate > 0) {
            const goldIcon = this.add.image(modalX - 65, modalY + 22, "item_gold").setOrigin(0.5).setDisplaySize(20, 20);
            const goldTxt = this.add.text(modalX - 50, modalY + 22, goldRateStr, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "13px",
                color: "#ffcc00"
            }).setOrigin(0, 0.5);

            const crystalIcon = this.add.image(modalX + 25, modalY + 22, "item_dust").setOrigin(0.5).setDisplaySize(20, 20);
            const crystalTxt = this.add.text(modalX + 40, modalY + 22, crystalRateStr, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "13px",
                color: "#c084fc"
            }).setOrigin(0, 0.5);

            modalContainer.add([goldIcon, goldTxt, crystalIcon, crystalTxt]);
        } else {
            const goldIcon = this.add.image(modalX - 35, modalY + 22, "item_gold").setOrigin(0.5).setDisplaySize(20, 20);
            const goldTxt = this.add.text(modalX - 20, modalY + 22, goldRateStr, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "13px",
                color: "#ffcc00"
            }).setOrigin(0, 0.5);

            modalContainer.add([goldIcon, goldTxt]);
        }

        const btnConfirm = this.add.graphics();
        btnConfirm.fillStyle(0x34c759, 1);
        btnConfirm.fillRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);
        btnConfirm.lineStyle(1.5, 0xffffff, 0.9);
        btnConfirm.strokeRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);

        const confirmText = this.add.text(modalX - 60, modalY + 66, "CONFIRM", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmText.setStroke("#000000", 3);

        const hitConfirm = this.add.rectangle(modalX - 60, modalY + 66, 90, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const btnCancel = this.add.graphics();
        btnCancel.fillStyle(0xff3b30, 1);
        btnCancel.fillRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);
        btnCancel.lineStyle(1.5, 0xffffff, 0.9);
        btnCancel.strokeRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);

        const cancelText = this.add.text(modalX + 60, modalY + 66, "CANCEL", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelText.setStroke("#000000", 3);

        const hitCancel = this.add.rectangle(modalX + 60, modalY + 66, 90, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        modalContainer.add([btnConfirm, confirmText, hitConfirm, btnCancel, cancelText, hitCancel]);

        hitConfirm.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
            utility.createloadingOverlay(this);
            api.stakeMonster(monster.instanceId).then(result => {
                utility.destroyloadingOverlay(this);
                if (result && result.success) {
                    showNotification(this, "Staked successfully!");
                    this.removeFromTeam(monster);
                    this.updateInventory();
                } else {
                    showNotification(this, result?.reason || "Failed to stake.");
                }
            }).catch(err => {
                utility.destroyloadingOverlay(this);
                console.error(err);
                showNotification(this, "Connection error.");
            });
        });

        hitCancel.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
        });
    }

    unstakeMonsterFlow(monster) {
        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive()
            .setDepth(150);

        const modalContainer = this.add.container(0, 0).setDepth(200);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        const card = this.add.graphics();
        card.fillStyle(0x000000, 0.35);
        card.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);

        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        card.lineStyle(2, 0xff3b30, 0.8);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        modalContainer.add(card);

        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 25, "UNSTAKE MONSTER", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        titleTxt.setStroke("#000000", 4);
        modalContainer.add(titleTxt);

        const remainingCapacity = monster.collectionHourCap !== undefined ? monster.collectionHourCap : 24;
        const msg = remainingCapacity > 0
            ? `Do you want to unstake this\nmonster? It has ${remainingCapacity} hours of\ncapacity left, which will\nbe preserved.`
            : `Do you want to unstake this\nmonster? Its capacity is\nexhausted and it will go\non a 24-hour cooldown.`;

        const bodyTxt = this.add.text(modalX, modalY - 15, msg, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);
        modalContainer.add(bodyTxt);

        const btnConfirm = this.add.graphics();
        btnConfirm.fillStyle(0xff3b30, 1);
        btnConfirm.fillRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);
        btnConfirm.lineStyle(1.5, 0xffffff, 0.9);
        btnConfirm.strokeRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);

        const confirmText = this.add.text(modalX - 60, modalY + 66, "UNSTAKE", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmText.setStroke("#000000", 3);

        const hitConfirm = this.add.rectangle(modalX - 60, modalY + 66, 90, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const btnCancel = this.add.graphics();
        btnCancel.fillStyle(0x8e8e93, 1);
        btnCancel.fillRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);
        btnCancel.lineStyle(1.5, 0xffffff, 0.9);
        btnCancel.strokeRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);

        const cancelText = this.add.text(modalX + 60, modalY + 66, "CANCEL", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelText.setStroke("#000000", 3);

        const hitCancel = this.add.rectangle(modalX + 60, modalY + 66, 90, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        modalContainer.add([btnConfirm, confirmText, hitConfirm, btnCancel, cancelText, hitCancel]);

        hitConfirm.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
            utility.createloadingOverlay(this);
            api.unstakeMonster(monster.instanceId).then(result => {
                utility.destroyloadingOverlay(this);
                if (result && result.success) {
                    showNotification(this, "Unstaked successfully!");
                    this.updateInventory();
                } else {
                    showNotification(this, result?.reason || "Failed to unstake.");
                }
            }).catch(err => {
                utility.destroyloadingOverlay(this);
                console.error(err);
                showNotification(this, "Connection error.");
            });
        });

        hitCancel.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
        });
    }

    // ─── Team logic ───────────────────────────────────────────────────────────

    addToTeam(monster) {
        const limit = Math.max(1, state.user?.unlockedSlots ?? state.user?.UnlockedSlots ?? 1);
        if (this.teamMonsters.length >= limit) {
            // Team full (within unlocked limit) → swap out the oldest (first) monster (FIFO)
            const evicted = this.teamMonsters.shift();
            this.setCardInTeamVisual(evicted, false);   // restore evicted card
        }
        this.teamMonsters.push(monster);
        this.saveTeam();
        this.setCardInTeamVisual(monster, true);        // dim new card
        this.refreshTeamSlots();
    }

    removeFromTeam(monster) {
        const idx = this.teamMonsters.findIndex(m => m.instanceId === monster.instanceId);
        if (idx === -1) return;
        this.teamMonsters.splice(idx, 1);
        this.saveTeam();
        this.setCardInTeamVisual(monster, false);
        this.refreshTeamSlots();
    }

    // Dim card when in team, restore when removed
    setCardInTeamVisual(monster, inTeam) {
        const entry = this.cardMap[monster.instanceId];
        if (!entry) return;
        const alpha = inTeam ? 0.45 : 1;
        entry.objects.forEach(o => o.setAlpha(alpha));
    }

    saveTeam() {
        state.selectedMonsters = [...this.teamMonsters];
        localStorage.setItem("selectedMonsters", JSON.stringify(state.selectedMonsters));
    }

    isInTeam(monster) {
        return this.teamMonsters.some(m => m.instanceId === monster.instanceId);
    }

    // ─── Card tap ─────────────────────────────────────────────────────────────

    onCardTap(monster, x, y) {
        this.showMonsterInfo(monster);
    }

    // ─── Inventory list ───────────────────────────────────────────────────────

    async updateInventory() {
        utility.createloadingOverlay(this);
        try {
            this.inventoryContainer.removeAll(true);
            this.cardMap = {};
            this.dismissActionBtn();

            this.eligibleSpecies = [];
            try {
                const colStatus = await api.getCollectorStatus();
                if (colStatus && colStatus.success && colStatus.eligibleMonsters) {
                    this.eligibleSpecies = colStatus.eligibleMonsters.map(id => id.toLowerCase());
                }
            } catch (e) {
                console.error("Failed to load collector status for eligibility", e);
            }

            const result = await api.loadInventory(this.pageIndex);
            this.maxIndex = Math.ceil(result.totalMonsters / 6);
            this.inventory = result.monsters || [];

            if (state.selectedMonster == null) {
                state.selectedMonster = this.inventory[0];
                localStorage.setItem("selectedMonster", JSON.stringify(this.inventory[0]));
            }

            this.inventory.forEach((monster, index) => {
                const row = Math.floor(index / column);
                const col = index % column;
                const x = 45 + col * slotWidth;
                const y = 500 + row * (slotHeight + 10);

                // Pane background
                const paneThumb = this.add.image(x, y, `pane_thumb_${monster.element}`)
                    .setOrigin(0)
                    .setDisplaySize(slotWidth, slotHeight)
                    .setInteractive({ useHandCursor: true });

                // Monster icon
                const icon = this.add.image(10 + x, 8 + y, "icon_" + monster.id)
                    .setDisplaySize(70, 70)
                    .setOrigin(0);

                // Name letters
                let lastTokenWidth = 0;
                const letters = [];
                Array.from(monster.title, chr => chr.charCodeAt(0)).forEach(token => {
                    const letter = this.add.image(x + 45 + lastTokenWidth, y - 10, `c${token}`).setOrigin(0);
                    letter.setDisplaySize(letter.displayWidth / 2, letter.displayHeight / 2);
                    lastTokenWidth += letter.displayWidth;
                    letters.push(letter);
                });

                // Level
                const lv = this.add.image(x + 90, y + 30, "ch35").setOrigin(0);
                let lastCharWidth = 0;
                const levArray = [];
                Array.from(String(monster.level), chr => chr.charCodeAt(0)).forEach(code => {
                    const lev = this.add.image(lv.x + lv.displayWidth + lastCharWidth, lv.y, `ch${code}`).setOrigin(0);
                    lastCharWidth += lev.displayWidth;
                    levArray.push(lev);
                });

                // HP bar
                const hpBg = this.add.image(x + 80, y + 55, "hpbar_small_bg").setOrigin(0);
                hpBg.setDisplaySize(hpBg.displayWidth / 1.5, hpBg.displayHeight / 1.5);
                const hpBar = this.add.image(x + 80, y + 55, "hpbar_small_fill").setOrigin(0);
                hpBar.setDisplaySize(hpBar.displayWidth / 1.5, hpBar.displayHeight / 1.5);
                hpBar.setCrop(0, 0, (monster.hp / (monster.maxHP || 100)) * hpBar.width, hpBar.height);

                // Rarity text
                const rStr = (monster.rarity || monster.Rarity || "common").toUpperCase();
                const rarityText = this.add.text(x + 12, y + 70, rStr, {
                    fontFamily: "Lilita One, Coiny, sans-serif",
                    fontSize: "8.5px",
                    color: this.getRarityColor(rStr)
                }).setOrigin(0, 0.5);
                rarityText.setStroke("#000000", 2.5);

                const objects = [paneThumb, icon, lv, hpBg, hpBar, rarityText, ...letters, ...levArray];

                // Draw a badge for Eligible or Staked
                const isStaked = monster.stakedInCollector || monster.StakedInCollector;
                const isEligible = this.eligibleSpecies.includes(monster.id.toLowerCase());

                if (isStaked) {
                    const badge = this.add.graphics();
                    badge.fillStyle(0xef4444, 1); // red
                    badge.fillRoundedRect(x + slotWidth - 55, y + 6, 50, 14, 4);
                    badge.lineStyle(1, 0xffffff, 1);
                    badge.strokeRoundedRect(x + slotWidth - 55, y + 6, 50, 14, 4);

                    const badgeTxt = this.add.text(x + slotWidth - 30, y + 13, "STAKED", {
                        fontFamily: "Lilita One, sans-serif",
                        fontSize: "8px",
                        color: "#ffffff"
                    }).setOrigin(0.5);

                    objects.push(badge, badgeTxt);
                } else if (isEligible) {
                    const badge = this.add.graphics();
                    badge.fillStyle(0x10b981, 1); // emerald green
                    badge.fillRoundedRect(x + slotWidth - 60, y + 6, 55, 14, 4);
                    badge.lineStyle(1, 0xffffff, 1);
                    badge.strokeRoundedRect(x + slotWidth - 60, y + 6, 55, 14, 4);

                    const badgeTxt = this.add.text(x + slotWidth - 32, y + 13, "ELIGIBLE", {
                        fontFamily: "Lilita One, sans-serif",
                        fontSize: "8px",
                        color: "#ffffff"
                    }).setOrigin(0.5);

                    objects.push(badge, badgeTxt);
                }

                this.cardMap[monster.instanceId] = { pane: paneThumb, objects, x, y };

                // Add flat to container
                objects.forEach(o => this.inventoryContainer.add(o));

                // Dim if already in team on this page load or if staked
                if (this.isInTeam(monster) || isStaked) {
                    objects.forEach(o => o.setAlpha(isStaked ? 0.6 : 0.45));
                }

                // ALL cards are always clickable
                paneThumb.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    this.onCardTap(monster, x, y);
                });
            });

        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            utility.destroyloadingOverlay(this);
        }
    }

    // ─── Selected monster preview (unchanged) ─────────────────────────────────

    // updateSelectedMonster(monster) {
    //     localStorage.setItem("selectedMonster", JSON.stringify(monster));
    //     state.selectedMonster = monster;
    //     this.monsterTexture.setTexture("front_" + monster.id);
    //     this.monsterPane.setTexture(`pane_tooltip_${monster.element}`);
    //     this.paneTooltip.setPosition(140, 500 - this.monsterTexture.displayHeight);
    //     this.updateMonsterPane(monster);
    // }

    displayMonsters() {
        state.selectedMonster = JSON.parse(localStorage.getItem("selectedMonster"));
        this.add.image(80, 425, "mons_shadow").setOrigin(0);

        this.monsterTexture = this.add
            .image(200, 470, "front_" + state.selectedMonster.id)
            .setInteractive({ useHandCursor: true });
        this.monsterTexture
            .setDisplaySize(this.monsterTexture.displayWidth / 1.5, this.monsterTexture.displayHeight / 1.5)
            .setOrigin(0.5, 1);

        this.monsterPane = this.add.image(0, 0, `pane_tooltip_${state.selectedMonster.element}`);
        this.monsterPane
            .setDisplaySize(this.monsterPane.displayWidth / 1.5, this.monsterPane.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0, 1.5);

        this.paneTooltip = this.add.container(140, 500 - this.monsterTexture.displayHeight);

        const hpBarBG = this.add.image(3, -80, "hpbar_med_bg");
        hpBarBG.setDisplaySize(hpBarBG.displayWidth / 1.5, hpBarBG.displayHeight / 1.5).setOrigin(0);

        this.hpBar = this.add.image(3, -80, "hpbar_med_fill");
        this.hpBar.setDisplaySize(this.hpBar.displayWidth / 1.5, this.hpBar.displayHeight / 1.5).setOrigin(0);

        this.titleContainer = this.add.container(0, 0);
        this.updateMonsterPane(state.selectedMonster);
        this.paneTooltip.add([this.monsterPane, this.titleContainer, hpBarBG, this.hpBar]);

        this.monsterTexture.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.launch("LabScene", { monster: state.selectedMonster });
            this.scene.pause();
            const lab = this.scene.get("LabScene");
            lab.events.once("shutdown", () => {
                this.scene.resume();
                this.syncTeamMonsters();
                this.updateInventory();
                this.updateSelectedMonster(state.selectedMonster);
            });
        });
    }

    updateMonsterHp(hpBar, monster) {
        const cropWidth = (monster.hp / (monster.maxHP || 100)) * hpBar.width;
        hpBar.setCrop(0, 0, cropWidth, hpBar.height);
    }

    syncTeamMonsters() {
        const limit = Math.max(1, state.user?.unlockedSlots ?? state.user?.UnlockedSlots ?? 1);
        api.getAllUserMonsters().then(result => {
            if (result && result.success && result.monsters) {
                // Keep only monsters still in our possession
                this.teamMonsters = this.teamMonsters.filter(teamMon =>
                    result.monsters.some(m => m.instanceId === teamMon.instanceId)
                );

                this.teamMonsters = this.teamMonsters.map(teamMon => {
                    const freshMon = result.monsters.find(m => m.instanceId === teamMon.instanceId);
                    return freshMon ? freshMon : teamMon;
                });

                if (this.teamMonsters.length > limit) {
                    const evicts = this.teamMonsters.slice(limit);
                    evicts.forEach(ev => this.setCardInTeamVisual(ev, false));
                    this.teamMonsters = this.teamMonsters.slice(0, limit);
                }

                this.saveTeam();
                this.refreshTeamSlots();
            }
        }).catch(err => console.error("Error syncing team monsters:", err));
    }

    getRarityColor(rarity) {
        const r = (rarity || "common").toLowerCase().trim();
        if (r === "rare") return "#60a5fa";
        if (r === "epic") return "#c084fc";
        if (r === "legendary") return "#fbbf24";
        return "#cbd5e1";
    }
}