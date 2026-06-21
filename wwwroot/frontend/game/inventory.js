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

    showActionButton(cardX, cardY, label, callback) {
        if (this.actionBtn) { this.actionBtn.destroy(); this.actionBtn = null; }

        const btnX = cardX + slotWidth / 2;
        const btnY = cardY - 14;

        this.actionBtn = this.add.container(btnX, btnY).setDepth(30);

        const width = 110;
        const height = 28;
        const bg = this.add.graphics();

        if (label === "OUT TEAM") {
            // Out Team: Red/Orange warning theme with outer glow
            bg.lineStyle(3, 0xff3b30, 0.4);
            bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 7);

            bg.lineStyle(1.5, 0xffffff, 0.9);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

            bg.fillStyle(0xff3b30, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

            bg.fillStyle(0xffffff, 0.2);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height / 2, 4);
        } else {
            // In Team: Green/Cyan positive theme with outer glow
            bg.lineStyle(3, 0x00c7be, 0.4);
            bg.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, 7);

            bg.lineStyle(1.5, 0xffffff, 0.9);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

            bg.fillStyle(0x34c759, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

            bg.fillStyle(0xffffff, 0.2);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height / 2, 4);
        }

        const btnText = this.add.text(0, 0, label, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);
        btnText.setStroke("#000000", 3);

        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        this.actionBtn.add([bg, btnText, hitArea]);
        this.actionBtn.setScale(0.7);
        this.tweens.add({ targets: this.actionBtn, scale: 1, duration: 150, ease: "Back.Out" });

        hitArea.on("pointerover", () => {
            this.tweens.add({
                targets: this.actionBtn,
                scale: 1.1,
                duration: 100,
                ease: "Power1"
            });
        });
        hitArea.on("pointerout", () => {
            this.tweens.add({
                targets: this.actionBtn,
                scale: 1.0,
                duration: 100,
                ease: "Power1"
            });
        });
        hitArea.on("pointerdown", () => {
            this.tweens.add({
                targets: this.actionBtn,
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
    }

    dismissActionBtn() {
        if (this.actionBtn) { this.actionBtn.destroy(); this.actionBtn = null; }
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
        // Always update the big preview
        //this.updateSelectedMonster(monster);

        if (this.isInTeam(monster)) {
            // Show "Out Team" button
            this.showActionButton(x, y, "OUT TEAM", () => {
                this.removeFromTeam(monster);
            });
        } else {
            // Show "In Team" button
            this.showActionButton(x, y, "IN TEAM", () => {
                this.addToTeam(monster);
            });
        }
    }

    // ─── Inventory list ───────────────────────────────────────────────────────

    async updateInventory() {
        utility.createloadingOverlay(this);
        try {
            this.inventoryContainer.removeAll(true);
            this.cardMap = {};
            this.dismissActionBtn();

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

                const objects = [paneThumb, icon, lv, hpBg, hpBar, ...letters, ...levArray];
                this.cardMap[monster.instanceId] = { pane: paneThumb, objects, x, y };

                // Add flat to container
                objects.forEach(o => this.inventoryContainer.add(o));

                // Dim if already in team on this page load
                if (this.isInTeam(monster)) {
                    objects.forEach(o => o.setAlpha(0.45));
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

    // updateMonsterPane(monster) {
    //     this.titleContainer.removeAll(true);
    //     this.titleContainer.setPosition(10, -100);
    //     this.updateMonsterHp(this.hpBar, monster);

    // let lastTokenWidth = 0;
    // Array.from(monster.title, chr => chr.charCodeAt(0)).forEach(token => {
    //     const letter = this.add.image(lastTokenWidth, 0, `c${token}`).setOrigin(0);
    //     letter.setDisplaySize(letter.displayWidth / 2, letter.displayHeight / 2);
    //     lastTokenWidth += letter.displayWidth;
    //     this.titleContainer.add(letter);
    // });

    // const level = "LV " + monster.level;
    // let levelWidth = 0;
    // Array.from(level, chr => chr.charCodeAt(0)).forEach(token => {
    //     const letter = this.add.image(levelWidth, -30, `c${token}`).setOrigin(0);
    //     letter.setDisplaySize(letter.displayWidth / 2, letter.displayHeight / 2);
    //     levelWidth += letter.displayWidth;
    //     this.titleContainer.add(letter);
    // });
    // }

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
}