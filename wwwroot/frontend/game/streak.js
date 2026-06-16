import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { checkClick } from "./game.js";
import { showNotification } from "../utility.js";

export class StreakScene extends Phaser.Scene {
    constructor() {
        super({ key: "StreakScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.createOverlay();
        this.createModal();
    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(250)
            .setScrollFactor(0)
            .setInteractive();

        this.overlay.on('pointerdown', () => {});
    }

    createModal() {
        this.container = this.add.container(0, 0).setDepth(251);

        const modalW = 360;
        const modalH = 490;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        // Modal Background
        const bg = this.add.graphics();
        // Inner Dark Slate background
        bg.fillStyle(0x0f172a, 0.98); // slate-900
        bg.lineStyle(4, 0x3b82f6, 1);  // vibrant blue-500 border
        bg.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);
        bg.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);
        this.container.add(bg);

        // Header ribbon banner block
        const bannerBg = this.add.graphics();
        bannerBg.fillStyle(0x2563eb, 1); // Blue-600
        bannerBg.lineStyle(2, 0x60a5fa, 1); // Blue-400
        bannerBg.fillRoundedRect(modalX - 120, modalY - modalH / 2 - 20, 240, 40, 10);
        bannerBg.strokeRoundedRect(modalX - 120, modalY - modalH / 2 - 20, 240, 40, 10);
        this.container.add(bannerBg);

        // Header Text: "7-DAY STREAK"
        const titleText = this.add.text(modalX, modalY - modalH / 2, "7-DAY STREAK", {
            fontFamily: "Lilita One, Arial, sans-serif",
            fontSize: "22px",
            color: "#f59e0b" // Amber gold
        }).setOrigin(0.5);
        titleText.setStroke("#0f172a", 4);
        titleText.setShadow(2, 2, "#000000", 2, true, true);
        this.container.add(titleText);

        // Subtitle: "Log in every day to get awesome rewards!"
        const subtitleText = this.add.text(modalX, modalY - modalH / 2 + 42, "Log in every day to get awesome rewards!", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "13px",
            color: "#94a3b8" // Slate 400
        }).setOrigin(0.5);
        this.container.add(subtitleText);

        // Close Button
        const closeBtn = this.add.image(modalX + modalW / 2 - 22, modalY - modalH / 2 + 22, "close-button")
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);
        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.closeScene();
        });

        // Current Streak day from user model
        const streakDay = state.user ? state.user.loginStreak : 1;
        const alreadyClaimed = state.user ? state.user.streakClaimed : false;

        // Days configuration
        const days = [
            { day: 1, reward: "GOLD", amt: "10-15", icon: "item_gold" },
            { day: 2, reward: "Heal", amt: "x1", icon: "item_healSpell" },
            { day: 3, reward: "GOLD", amt: "x15", icon: "item_gold" },
            { day: 4, reward: "Ball", amt: "x1", icon: "item_monstaBall" },
            { day: 5, reward: "GOLD", amt: "x20", icon: "item_gold" },
            { day: 6, reward: "Heal", amt: "x1", icon: "item_healSpell" },
            { day: 7, reward: "Chest", amt: "x1", icon: "item_box_red", isGrand: true }
        ];

        // Draw Days Cards
        const r1Y = modalY - 80;
        const r2Y = modalY + 60;

        days.forEach((d) => {
            let cx = 0;
            let cy = 0;
            let cardW = 74;
            let cardH = 100;

            if (d.day <= 4) {
                // Row 1 centering
                const startX = modalX - (1.5 * 82);
                cx = startX + (d.day - 1) * 82;
                cy = r1Y;
            } else {
                // Row 2 centering
                const index = d.day - 5;
                if (d.isGrand) {
                    cx = modalX + 95;
                    cy = r2Y;
                    cardW = 100;
                    cardH = 108;
                } else {
                    cx = modalX - 100 + index * 95;
                    cy = r2Y;
                }
            }

            // Card background
            const cardBg = this.add.graphics();
            const isActive = d.day === streakDay && !alreadyClaimed;
            const isCompleted = d.day < streakDay || (d.day === streakDay && alreadyClaimed);

            // Fill color
            if (isActive) {
                // Golden/Yellow highlight for current claimable day
                cardBg.fillStyle(0x1e293b, 1);
                cardBg.lineStyle(3, 0xeab308, 1); // Yellow/gold glowing border
            } else if (isCompleted) {
                // Greyed out for claimed days
                cardBg.fillStyle(0x0f172a, 0.8);
                cardBg.lineStyle(1.5, 0x22c55e, 0.6); // Muted Green border
            } else {
                // Default locked/future state
                cardBg.fillStyle(0x1e293b, 0.7);
                cardBg.lineStyle(1.5, 0x475569, 0.5);
            }

            cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
            cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
            this.container.add(cardBg);

            // Day pill header
            const pillY = cy - cardH / 2 + 15;
            let pillCol = 0x3b82f6; // Blue
            if (d.isGrand) pillCol = 0x8b5cf6; // Purple for grand chest
            if (isCompleted) pillCol = 0x22c55e; // Green for claimed
            if (isActive) pillCol = 0xeab308; // Yellow/gold for active

            const pill = this.add.graphics();
            pill.fillStyle(pillCol, 1);
            pill.fillRoundedRect(cx - (cardW - 14) / 2, cy - cardH / 2 + 5, cardW - 14, 16, 5);
            this.container.add(pill);

            // Day text inside the pill
            const dayText = this.add.text(cx, cy - cardH / 2 + 13, `DAY ${d.day}`, {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "11px",
                color: "#ffffff"
            }).setOrigin(0.5);
            dayText.setStroke("#000000", 2);
            this.container.add(dayText);

            // Icon Image (increased sizes from 36/48 to 48/60)
            const img = this.add.image(cx, cy + 5, d.icon);
            img.texture.setFilter(1);
            const size = d.isGrand ? 60 : 48;
            img.setDisplaySize(size, size);
            this.container.add(img);

            // Amount/label text at bottom
            const amtText = this.add.text(cx, cy + cardH / 2 - 14, d.amt, {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "12px",
                color: isActive ? "#fbbf24" : "#cbd5e1"
            }).setOrigin(0.5);
            amtText.setStroke("#0f172a", 3);
            this.container.add(amtText);

            // Checkmark if completed
            if (isCompleted) {
                const check = this.add.graphics();
                check.fillStyle(0x22c55e, 1);
                check.fillCircle(cx + cardW / 2 - 6, cy - cardH / 2 + 6, 9);
                check.lineStyle(1.5, 0xffffff, 1);
                check.strokeCircle(cx + cardW / 2 - 6, cy - cardH / 2 + 6, 9);
                this.container.add(check);

                const tick = this.add.text(cx + cardW / 2 - 6, cy - cardH / 2 + 6, "✓", {
                    fontFamily: "Arial, sans-serif",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#ffffff"
                }).setOrigin(0.5);
                this.container.add(tick);
            }
        });

        // Bottom Action Button: CLAIM
        const btnY = modalY + modalH / 2 - 45;

        if (!alreadyClaimed) {
            // Active claim button using btn_blank tinted yellow
            const btnClaim = this.add.image(modalX, btnY, "btn_blank")
                .setDisplaySize(180, 48)
                .setInteractive({ useHandCursor: true });
            btnClaim.setTint(0xeab308); // Golden yellow
            this.container.add(btnClaim);

            const claimText = this.add.text(modalX, btnY, "CLAIM REWARD", {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "18px",
                color: "#ffffff"
            }).setOrigin(0.5);
            claimText.setStroke("#854d0e", 3.5); // Dark gold stroke
            this.container.add(claimText);



            btnClaim.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                btnClaim.disableInteractive();
                try {
                    const res = await api.claimStreak();
                    if (res && res.success) {
                        showNotification(this, `Claimed Day ${res.day} Reward!`);
                        
                        const worldScene = this.scene.get("WorldScene");
                        if (worldScene) {
                            worldScene.USER = state.user;
                            worldScene.createProfile();
                        }

                        const missionScene = this.scene.get("MissionScene");
                        if (missionScene && missionScene.sys.isActive()) {
                            missionScene.loadMissions();
                        }
                        
                        this.time.delayedCall(1500, () => {
                            this.closeScene();
                        });
                    } else {
                        showNotification(this, res ? res.reason : "Failed to claim reward.");
                        btnClaim.setInteractive();
                    }
                } catch (err) {
                    console.error("Error claiming streak:", err);
                    showNotification(this, "Connection failed.");
                    btnClaim.setInteractive();
                }
            });
        } else {
            // Already claimed for today using disabled grey btn_blank
            const btnClaim = this.add.image(modalX, btnY, "btn_blank")
                .setDisplaySize(190, 48);
            btnClaim.setTint(0x4b5563); // Dark grey
            this.container.add(btnClaim);

            const claimText = this.add.text(modalX, btnY, "COME BACK TOMORROW", {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "14px",
                color: "#94a3b8"
            }).setOrigin(0.5);
            claimText.setStroke("#1f2937", 3);
            this.container.add(claimText);
        }
    }

    closeScene() {
        this.overlay.destroy();
        this.scene.stop();
    }
}
