import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { checkClick } from "./game.js";
import { showNotification } from "../utility.js";
import { t } from "../translations.js";

export class MissionScene extends Phaser.Scene {
    constructor() {
        super({ key: "MissionScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.activeTab = "Daily"; // "Daily", "Weekly", "Achievement", "Task"
        this.rawMissions = [];

        this.createOverlay();
        this.createDialog();
        this.loadMissions();

        // Start reset timer update loop
        this.time.addEvent({
            delay: 1000,
            callback: this.updateResetTimer,
            callbackScope: this,
            loop: true
        });
    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive();
    }

    createDialog() {
        this.container = this.add.container(0, 0).setDepth(201);

        const modalW = 360;
        const modalH = 585;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        // 1. Shadow background panel
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.5);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, modalY - modalH / 2 + 5, modalW, modalH, 16);
        this.container.add(shadow);

        // 2. Main outer dialog card - Premium Bright Light Theme
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50 (bright light interior)
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outer outline (dark)
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        // Inner frame line
        card.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW - 8, modalH - 8, 12);
        this.container.add(card);

        // 3. Title Ribbon Banner
        const ribbonW = 220;
        const ribbonH = 38;
        const ribbonX = modalX;
        const ribbonY = modalY - modalH / 2;

        const ribbon = this.add.graphics();
        ribbon.fillStyle(0x064e3b, 0.95); // Dark Green 900
        ribbon.lineStyle(2, 0x10b981, 1); // Green 500 border
        ribbon.fillRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        ribbon.strokeRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        this.container.add(ribbon);

        // Title text + Checklist Emoji
        const titleText = this.add.text(ribbonX, ribbonY + 4, t("missions_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "22px"
        }).setOrigin(0.5);
        const titleGrad = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        titleGrad.addColorStop(0, '#fbbf24'); // Amber 300
        titleGrad.addColorStop(1, '#f59e0b'); // Amber 500
        titleText.setFill(titleGrad);
        titleText.setStroke("#020617", 4.5);
        titleText.setShadow(1, 1, "#000000", 1, true, true);
        this.container.add(titleText);

        // 4. Close Button
        const closeBtn = this.add.image(modalX + modalW / 2 - 20, modalY - modalH / 2 + 22, "close-button")
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);

        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.closeScene();
        });

        // 5. Tabs Layout
        this.tabsContainer = this.add.container(0, 0);
        this.container.add(this.tabsContainer);
        this.drawTabs();

        // 6. Reset Timer Text
        this.timerText = this.add.text(modalX, modalY - modalH / 2 + 82, "", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ef4444"
        }).setOrigin(0.5);
        this.timerText.setStroke("#ffffff", 2);
        this.container.add(this.timerText);
        this.updateResetTimer();

        // 7. Scrollable Container for Mission List
        this.listContainer = this.add.container(0, 0);
        this.container.add(this.listContainer);

        // Mask to clip the list to dialog scroll boundaries
        const maskGraphics = this.make.graphics({ add: false });
        maskGraphics.fillRect(modalX - 170, modalY - 195, 340, 405);
        const mask = maskGraphics.createGeometryMask();
        this.listContainer.setMask(mask);

        // Enable scrolling
        this.enableListScrolling();

        // 8. Bottom tip bar
        const bottomBarBg = this.add.graphics();
        bottomBarBg.fillStyle(0x0f172a, 0.95);
        bottomBarBg.fillRoundedRect(modalX - modalW / 2 + 4, modalY + modalH / 2 - 38, modalW - 8, 34, 8);
        this.container.add(bottomBarBg);

        const bottomTipText = this.add.text(modalX, modalY + modalH / 2 - 22, t("missions_bottom_tip"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#f59e0b"
        }).setOrigin(0.5);
        bottomTipText.setStroke("#000000", 2);
        this.container.add(bottomTipText);
    }

    drawTabs() {
        this.tabsContainer.removeAll(true);

        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const modalH = 585;
        const tabY = modalY - modalH / 2 + 55;

        // Tabs Config: [Label, tabKey, posX, width]
        const tabsConfig = [
            { label: t("tab_daily"), key: "Daily", x: modalX - 125, w: 58 },
            { label: t("tab_weekly"), key: "Weekly", x: modalX - 55, w: 68 },
            { label: t("tab_tasks"), key: "Task", x: modalX + 18, w: 64 },
            { label: t("tab_achievements"), key: "Achievement", x: modalX + 110, w: 104 }
        ];

        tabsConfig.forEach((tc) => {
            const isActive = this.activeTab === tc.key;
            const tabG = this.add.graphics();

            if (isActive) {
                // Active: Golden/Orange highlight
                tabG.fillStyle(0xeab308, 1);
                tabG.lineStyle(1.5, 0x0f172a, 1); // Dark border
            } else {
                // Inactive: Light slate grey
                tabG.fillStyle(0xe2e8f0, 0.95);
                tabG.lineStyle(1.5, 0x94a3b8, 0.5);
            }

            tabG.fillRoundedRect(tc.x - tc.w / 2, tabY - 13, tc.w, 26, 6);
            tabG.strokeRoundedRect(tc.x - tc.w / 2, tabY - 13, tc.w, 26, 6);
            this.tabsContainer.add(tabG);

            // Tab Text (Black text for active yellow tab, white for inactive blue tab)
            const tabText = this.add.text(tc.x, tabY, tc.label, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "11px",
                color: isActive ? "#ffffff" : "#475569"
            }).setOrigin(0.5);
            if (isActive) tabText.setStroke("#78350f", 2.5);
            else tabText.setStroke("#ffffff", 2);
            this.tabsContainer.add(tabText);

            // Click zone
            const zone = this.add.zone(tc.x, tabY, tc.w, 26).setInteractive({ useHandCursor: true });
            this.tabsContainer.add(zone);

            zone.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                if (this.activeTab !== tc.key) {
                    this.activeTab = tc.key;
                    this.drawTabs();
                    this.updateResetTimer();
                    this.populateMissionsList();
                }
            });
        });
    }

    updateResetTimer() {
        if (!this.timerText || !this.sys.isActive()) return;

        if (this.activeTab === "Daily") {
            const now = new Date();
            const nextUtcReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
            const diffMs = nextUtcReset - now;
            const hours = Math.floor(diffMs / 3600000);
            const minutes = Math.floor((diffMs % 3600000) / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            this.timerText.setText(t("resets_in", { time: `${hours}h ${minutes}m ${seconds}s` }));
            this.timerText.setColor("#ef4444");
        } else if (this.activeTab === "Weekly") {
            const now = new Date();
            const daysToSunday = (7 - now.getUTCDay()) % 7;
            const nextSunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToSunday, 0, 0, 0));
            if (daysToSunday === 0 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
                nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
            }
            const diffMs = nextSunday - now;
            const days = Math.floor(diffMs / 86400000);
            const hours = Math.floor((diffMs % 86400000) / 3600000);
            const minutes = Math.floor((diffMs % 3600000) / 60000);
            this.timerText.setText(t("resets_in", { time: `${days}d ${hours}h ${minutes}m` }));
            this.timerText.setColor("#2563eb");
        } else if (this.activeTab === "Task") {
            this.timerText.setText(t("social_partner_tasks"));
            this.timerText.setColor("#16a34a");
        } else {
            this.timerText.setText(t("permanent_milestones"));
            this.timerText.setColor("#d97706");
        }
    }

    enableListScrolling() {
        this.viewHeight = 405;
        this.listHeight = 0;

        // Pointer drag-to-scroll (touch/mouse)
        this.isDragging = false;
        this.startY = 0;
        this.startContainerY = 0;

        this.input.on('pointerdown', (pointer) => {
            const modalX = this.width / 2;
            const modalY = this.height / 2;
            
            // Check if pointer down is inside the scrollable list boundary
            if (pointer.x >= modalX - 170 && pointer.x <= modalX + 170 &&
                pointer.y >= modalY - 195 && pointer.y <= modalY + 210) {
                this.isDragging = true;
                this.startY = pointer.y;
                this.startContainerY = this.listContainer.y;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.isDragging) return;
            if (this.listHeight <= this.viewHeight) return;

            const deltaY = pointer.y - this.startY;
            let targetY = this.startContainerY + deltaY;

            const modalY = this.height / 2;
            const listStartY = modalY - 190;
            const maskBottom = modalY - 195 + this.viewHeight;
            const contentBottom = listStartY + this.listHeight;
            const minY = maskBottom - contentBottom;

            this.listContainer.y = Phaser.Math.Clamp(targetY, minY, 0);
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Wheel scroll support
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (this.listHeight <= this.viewHeight) return;

            const modalY = this.height / 2;
            const listStartY = modalY - 190;
            const maskBottom = modalY - 195 + this.viewHeight;
            const contentBottom = listStartY + this.listHeight;
            const minY = maskBottom - contentBottom;

            this.listContainer.y -= deltaY * 0.4;
            this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, minY, 0);
        });
    }

    async loadMissions() {
        this.createloadingOverlay();
        try {
            const result = await api.GetMissions();
            if (result && result.success) {
                this.rawMissions = result.missions;
                this.populateMissionsList();
            } else {
                showNotification(this, result ? result.reason : "Failed to load missions.");
            }
        } catch (error) {
            console.error("Failed to load missions:", error);
            showNotification(this, "Error loading missions.");
        } finally {
            this.destroyloadingOverlay();
        }
    }

    populateMissionsList() {
        this.listContainer.removeAll(true);
        this.listContainer.y = 0;
        this.listHeight = 0;

        const filtered = this.rawMissions.filter(m => m.category.toLowerCase() === this.activeTab.toLowerCase());

        if (!filtered || filtered.length === 0) {
            const noMissionsText = this.add.text(this.width / 2, this.height / 2, t("no_missions_available"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "15px",
                color: "#6b7280",
                align: "center"
            }).setOrigin(0.5);
            this.listContainer.add(noMissionsText);
            return;
        }

        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const listStartY = modalY - 190;
        const itemSpacing = 84;

        filtered.forEach((mission, index) => {
            const yPos = listStartY + index * itemSpacing;

            // 1. Card container panel
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0xf1f5f9, 0.98); // Slate 100
            cardBg.lineStyle(2, 0x0f172a, 1); // Slate 900 outline (dark)
            cardBg.fillRoundedRect(modalX - 165, yPos, 330, 76, 10);
            cardBg.strokeRoundedRect(modalX - 165, yPos, 330, 76, 10);
            this.listContainer.add(cardBg);

            // 2. Icon Circular backer (Left side)
            const iconBacker = this.add.graphics();
            iconBacker.fillStyle(0xe2e8f0, 1); // Slate 200
            iconBacker.lineStyle(1.5, 0x94a3b8, 1); // Slate 400
            iconBacker.fillCircle(modalX - 132, yPos + 38, 22);
            iconBacker.strokeCircle(modalX - 132, yPos + 38, 22);
            this.listContainer.add(iconBacker);

            // Icon picker using loaded PNG textures
            let iconKey = "mission_default";
            if (mission.verificationType === "defeat_monsters" || mission.verificationType === "defeat_monsters_weekly" ||
                mission.verificationType === "complete_battles" || mission.verificationType === "complete_battles_weekly") {
                iconKey = "mission_battle";
            } else if (mission.verificationType === "heal_hp") {
                iconKey = "mission_heal";
            } else if (mission.verificationType === "open_chests") {
                iconKey = "mission_chest";
            } else if (mission.verificationType === "telegram_join") {
                iconKey = "mission_social";
            } else if (mission.verificationType === "daily_login_streak") {
                iconKey = "mission_streak";
            }

            const iconImg = this.add.image(modalX - 132, yPos + 38, iconKey)
                .setDisplaySize(32, 32);
            iconImg.texture.setFilter(1);
            this.listContainer.add(iconImg);

            // 3. Text description (Dark text on cream panel)
            let displayTitle = mission.title || "Mission Task";
            if (displayTitle.length > 25) displayTitle = displayTitle.substring(0, 22) + "...";

            const titleTxt = this.add.text(modalX - 100, yPos + 10, displayTitle.toUpperCase(), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "13px",
                color: "#0f172a" // slate 900
            });
            titleTxt.setStroke("#ffffff", 3);
            this.listContainer.add(titleTxt);

            // 4. Progress Bar
            const barWidth = 125;
            const barHeight = 12;
            const barX = modalX - 100;
            const barY = yPos + 30;

            const isClicked = localStorage.getItem("mission_clicked_" + mission.missionId) === "true";
            const progress = (mission.verificationType === "daily_login_streak")
                ? (mission.progress || 0)
                : (mission.completed ? (mission.target || 1) : (mission.verificationType === "telegram_join" ? (isClicked ? 1 : 0) : (mission.progress || 0)));
            const target = mission.target || 1;
            const fillRatio = Math.min(1, progress / target);

            // Container bar
            const pBarBg = this.add.graphics();
            pBarBg.fillStyle(0xe2e8f0, 1); // Light container
            pBarBg.lineStyle(1.5, 0x0f172a, 1);
            pBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
            pBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);
            this.listContainer.add(pBarBg);

            // Fill bar
            if (fillRatio > 0) {
                const pBarFill = this.add.graphics();
                pBarFill.fillStyle(0x10b981, 1); // Emerald green 500
                pBarFill.fillRoundedRect(barX + 0.75, barY + 0.75, (barWidth - 1.5) * fillRatio, barHeight - 1.5, 3.5);
                this.listContainer.add(pBarFill);
            }

            // Progress text inside bar
            const progText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, `${progress} / ${target}`, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "9px",
                color: "#ffffff"
            }).setOrigin(0.5);
            progText.setStroke("#064e3b", 2.5);
            this.listContainer.add(progText);

            // Description or small label below progress
            let displayDesc = mission.description || "";
            if (displayDesc.length > 32) displayDesc = displayDesc.substring(0, 29) + "...";
            const descTxt = this.add.text(barX, yPos + 48, displayDesc, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "10px",
                color: "#475569" // slate 600
            });
            this.listContainer.add(descTxt);

            // 5. Reward Preview Block
            const rewardX = modalX + 60;
            const rewardY = yPos + 38;
            
            // Icon loader mapping
            let rewardIconKey = "item_gold";
            const currency = (mission.rewardCurrency || "").toUpperCase();
            const currencyLower = (mission.rewardCurrency || "").toLowerCase();

            if (currency === "TON") {
                rewardIconKey = "item_ton";
            } else if (currency === "GOLD") {
                rewardIconKey = "item_gold";
            } else if (currency === "CRYSTAL") {
                rewardIconKey = "item_box_blue";
            } else if (currency === "EGGS") {
                rewardIconKey = "item_eggs";
            } else if (currencyLower === "monstaball") {
                rewardIconKey = "item_monstaBall";
            } else if (currencyLower === "healspell") {
                rewardIconKey = "item_healSpell";
            } else if (currencyLower === "darkspell") {
                rewardIconKey = "item_darkSpell";
            } else if (currencyLower === "lavaspell") {
                rewardIconKey = "item_lavaSpell";
            } else if (currencyLower === "avalanchespell") {
                rewardIconKey = "item_avalancheSpell";
            } else if (currencyLower === "windspell") {
                rewardIconKey = "item_windSpell";
            } else if (currencyLower === "thunderspell") {
                rewardIconKey = "item_thunderSpell";
            } else if (currencyLower === "waterfallspell") {
                rewardIconKey = "item_waterFallSpell";
            } else if (currencyLower === "rainbow") {
                rewardIconKey = "item_rainbow";
            } else if (currencyLower === "hallucinogen") {
                rewardIconKey = "item_hallucinogen";
            } else if (currencyLower === "shield") {
                rewardIconKey = "item_shield";
            } else if (currencyLower === "ragepotion") {
                rewardIconKey = "item_ragePotion";
            } else if (mission.verificationType === "daily_login_streak") {
                rewardIconKey = "item_box_red";
            }

            const rewardImg = this.add.image(rewardX, rewardY - 8, rewardIconKey)
                .setDisplaySize(20, 20);
            rewardImg.texture.setFilter(1);
            this.listContainer.add(rewardImg);

            // Reward amount (Yellow text)
            const rewardAmtStr = (mission.verificationType === "daily_login_streak") ? "STREAK" : `+${mission.rewardAmount}`;
            const rewardText = this.add.text(rewardX, rewardY + 11, rewardAmtStr, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "11px",
                color: "#b45309" // Amber 700
            }).setOrigin(0.5);
            rewardText.setStroke("#ffffff", 2.5);
            this.listContainer.add(rewardText);

            // 6. Action Button
            this.createCardActionButton(yPos, mission);

            this.listHeight = (index + 1) * itemSpacing + 20;
        });
    }

    createCardActionButton(yPos, mission) {
        const modalX = this.width / 2;
        const btnX = modalX + 120;
        const btnY = yPos + 38;
        const btnW = 56;
        const btnH = 26;

        const btnContainer = this.add.container(btnX, btnY);
        this.listContainer.add(btnContainer);

        const btnBg = this.add.graphics();
        btnContainer.add(btnBg);

        const isClicked = localStorage.getItem("mission_clicked_" + mission.missionId) === "true";
        const progress = (mission.verificationType === "daily_login_streak")
            ? (mission.progress || 0)
            : (mission.completed ? (mission.target || 1) : (mission.verificationType === "telegram_join" ? (isClicked ? 1 : 0) : (mission.progress || 0)));
        const target = mission.target || 1;
        const canClaim = progress >= target;

        let btnLabel = t("go");
        let fillColor = 0x2563eb; // Blue
        let strokeColor = "#1e3a8a";
        let isDone = false;

        if (mission.verificationType === "daily_login_streak") {
            if (mission.completed) {
                btnLabel = t("done");
                fillColor = 0x94a3b8; // Slate grey
                strokeColor = "#475569";
                isDone = true;
            } else {
                btnLabel = t("claim");
                fillColor = 0xeab308; // Yellow
                strokeColor = "#78350f";
            }
        } else if (mission.completed) {
            btnLabel = t("done");
            fillColor = 0x94a3b8; // Slate grey
            strokeColor = "#475569";
            isDone = true;
        } else if (canClaim) {
            btnLabel = t("claim");
            fillColor = 0x10b981; // Emerald Green
            strokeColor = "#064e3b";
        }

        btnBg.fillStyle(fillColor, 1);
        btnBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);

        const btnText = this.add.text(0, 0, btnLabel, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: btnLabel.length > 4 ? "10px" : "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        btnText.setStroke(strokeColor, 2.5);
        btnContainer.add(btnText);

        if (!isDone) {
            const zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
            btnContainer.add(zone);

            zone.on("pointerover", () => {
                this.tweens.add({ targets: btnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 });
            });
            zone.on("pointerout", () => {
                this.tweens.add({ targets: btnContainer, scaleX: 1.0, scaleY: 1.0, duration: 100 });
            });
            zone.on("pointerdown", () => {
                this.tweens.add({ targets: btnContainer, scaleX: 0.92, scaleY: 0.92, duration: 50 });
            });
            zone.on("pointerup", (pointer) => {
                this.tweens.add({ targets: btnContainer, scaleX: 1.0, scaleY: 1.0, duration: 50 });
                if (!checkClick(pointer)) return;
                
                if (btnLabel === "CLAIM" && mission.verificationType !== "daily_login_streak") {
                    this.claimReward(mission);
                } else {
                    this.handleGoAction(mission);
                }
            });
        }
    }

    async handleGoAction(mission) {
        if (mission.verificationType === "daily_login_streak") {
            this.closeScene();
            this.time.delayedCall(100, () => {
                const worldScene = this.scene.get("WorldScene");
                if (worldScene) {
                    worldScene.scene.launch("StreakScene");
                } else {
                    this.scene.launch("StreakScene");
                }
            });
            return;
        }

        if (mission.verificationType === "telegram_join" && mission.verificationUrl) {
            // Mark task as clicked so the CLAIM button appears
            localStorage.setItem("mission_clicked_" + mission.missionId, "true");
            this.populateMissionsList();

            // Open link in Telegram
            const tgInstance = window.Telegram ? window.Telegram.WebApp : null;
            if (tgInstance) {
                tgInstance.openTelegramLink(mission.verificationUrl);
            } else {
                window.open(mission.verificationUrl, "_blank");
            }
            showNotification(this, t("redirecting_channel"));
            return;
        }

        if (mission.verificationType === "open_chests") {
            // Open Chest Purchase Prompt
            this.showChestPrompt();
            return;
        }

        if (mission.verificationType === "heal_hp") {
            showNotification(this, t("open_items_to_heal"));
            this.closeScene();
            // Trigger Items scene
            this.time.delayedCall(500, () => {
                const worldScene = this.scene.get("WorldScene");
                if (worldScene) {
                    worldScene.scene.launch("ItemScene");
                }
            });
            return;
        }

        // Default: battles or defeats, close scene and return to map so they can fight
        showNotification(this, t("start_encounters_on_map"));
        this.closeScene();
    }

    showChestPrompt() {
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        const promptCont = this.add.container(0, 0).setDepth(220);

        const promptOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.5)
            .setOrigin(0)
            .setInteractive();
        promptCont.add(promptOverlay);

        const pw = 280;
        const ph = 160;

        const pBg = this.add.graphics();
        pBg.fillStyle(0xf8fafc, 0.98); // Slate 50
        pBg.lineStyle(2.5, 0x0f172a, 1); // Dark outline
        pBg.fillRoundedRect(modalX - pw / 2, modalY - ph / 2, pw, ph, 12);
        pBg.strokeRoundedRect(modalX - pw / 2, modalY - ph / 2, pw, ph, 12);
        promptCont.add(pBg);

        const titleText = this.add.text(modalX, modalY - ph / 2 + 18, t("open_chest_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        titleText.setStroke("#ffffff", 3);
        promptCont.add(titleText);
        
        const descText = this.add.text(modalX, modalY - 12, t("open_chest_desc"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            color: "#334155",
            align: "center"
        }).setOrigin(0.5);
        promptCont.add(descText);

        // Buttons: Yes / No
        const btnW = 90;
        const btnH = 30;

        // Yes Button Container
        const yesBtnContainer = this.add.container(modalX - 60, modalY + 45);
        promptCont.add(yesBtnContainer);

        const yesBg = this.add.graphics();
        yesBg.fillStyle(0x10b981, 1); // Emerald Green
        yesBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        yesBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        yesBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        yesBtnContainer.add(yesBg);

        const yesText = this.add.text(0, 0, t("yes"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        yesText.setStroke("#064e3b", 2.5);
        yesBtnContainer.add(yesText);

        const yesZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        yesBtnContainer.add(yesZone);

        yesZone.on("pointerover", () => this.tweens.add({ targets: yesBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 }));
        yesZone.on("pointerout", () => this.tweens.add({ targets: yesBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        yesZone.on("pointerdown", () => this.tweens.add({ targets: yesBtnContainer, scaleX: 0.92, scaleY: 0.92, duration: 50 }));

        // No Button Container
        const noBtnContainer = this.add.container(modalX + 60, modalY + 45);
        promptCont.add(noBtnContainer);

        const noBg = this.add.graphics();
        noBg.fillStyle(0xef4444, 1); // Red 500
        noBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        noBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        noBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        noBtnContainer.add(noBg);

        const noText = this.add.text(0, 0, t("no"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        noText.setStroke("#7f1d1d", 2.5);
        noBtnContainer.add(noText);

        const noZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        noBtnContainer.add(noZone);

        noZone.on("pointerover", () => this.tweens.add({ targets: noBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 100 }));
        noZone.on("pointerout", () => this.tweens.add({ targets: noBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        noZone.on("pointerdown", () => this.tweens.add({ targets: noBtnContainer, scaleX: 0.92, scaleY: 0.92, duration: 50 }));

        noZone.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            promptCont.destroy();
        });

        yesZone.on("pointerup", async (pointer) => {
            if (!checkClick(pointer)) return;
            promptCont.destroy();
            this.createloadingOverlay();

            try {
                const result = await api.OpenChest();
                if (result && result.success) {
                    // Update user state
                    if (state.user) {
                        state.user.gold = result.balance.gold;
                        state.user.dailyChestsOpened = result.dailyChestsOpened;
                    }

                    // Format rewards list
                    let rewardsList = [];
                    for (const [item, qty] of Object.entries(result.rewards)) {
                        rewardsList.push(`${t(item.toLowerCase() + "_name") || item} x${qty}`);
                    }
                    showNotification(this, t("chest_opened_success", { rewards: rewardsList.join(', ') }));

                    // Refresh profile HUD
                    const worldScene = this.scene.get("WorldScene");
                    if (worldScene) {
                        worldScene.USER = state.user;
                        worldScene.createProfile();
                    }

                    // Reload missions
                    await this.loadMissions();
                } else {
                    showNotification(this, result ? result.reason : t("failed_to_open_chest"));
                }
            } catch (err) {
                console.error(err);
                showNotification(this, t("error_opening_chest"));
            } finally {
                this.destroyloadingOverlay();
            }
        });
    }

    async claimReward(mission) {
        this.createloadingOverlay();
        try {
            const result = await api.VerifyMission(mission.missionId);
            if (result && result.success) {
                showNotification(this, t("claimed_reward", { amount: mission.rewardAmount, currency: mission.rewardCurrency }));
                // Update local state / balances
                await api.loadUser();
                
                const worldScene = this.scene.get("WorldScene");
                if (worldScene) {
                    worldScene.USER = state.user;
                    worldScene.createProfile();
                }

                await this.loadMissions();
            } else {
                showNotification(this, result ? result.reason : t("failed_to_claim"));
            }
        } catch (error) {
            console.error("Failed to claim reward:", error);
            showNotification(this, t("error_claiming"));
        } finally {
            this.destroyloadingOverlay();
        }
    }

    closeScene() {
        this.overlay.destroy();
        this.scene.stop("MissionScene");
    }

    createloadingOverlay() {
        if (this.loadOverlay) return; // Prevent duplicating/orphaning overlays

        this.loadOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.4)
            .setOrigin(0)
            .setDepth(210)
            .setScrollFactor(0)
            .setInteractive();

        this.buffer = this.add.image(this.width / 2, this.height / 2, "loading_buffer");
        this.buffer.setScale(0.05).setDepth(211);

        this.buffering = this.tweens.add({
            targets: this.buffer,
            angle: 360,
            duration: 1000,
            repeat: -1
        });
    }

    destroyloadingOverlay() {
        if (this.loadOverlay) {
            this.loadOverlay.destroy();
            this.loadOverlay = null;
        }
        if (this.buffer) {
            this.buffer.destroy();
            this.buffer = null;
        }
        if (this.buffering) {
            this.buffering.stop();
            this.buffering = null;
        }
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

        const actualY = (typeof y === 'function') ? y(0) : y;

        tempImages.forEach(img => {
            img.x += offsetX;
            img.y += actualY;
            img.x += x;
            container.add(img);
        });

        return lengthWidth;
    }
}
