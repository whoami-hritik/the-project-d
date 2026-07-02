import * as api from "../webapp/api.js";
import { state, setLanguage } from "../state.js";
import { checkClick } from "./game.js";
import { showNotification, createloadingOverlay, destroyloadingOverlay } from "../utility.js";
import { sendDeposit, initTonConnect, getWalletAddress, disconnectWallet } from "../webapp/tonconnect.js";
import { t } from "../translations.js";

export class ProfileScene extends Phaser.Scene {
    constructor() {
        super({ key: "ProfileScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.createOverlay();
        this.createDialog();
        this.loadProfileData();

        // Wallet Connection Listener to dynamically refresh UI on connect/disconnect
        const ui = initTonConnect();
        if (ui) {
            this.unsubscribeTon = ui.onStatusChange((wallet) => {
                if (this.sys.isActive()) {
                    this.scene.restart();
                }
            });
        }

        this.events.once("shutdown", () => {
            if (this.unsubscribeTon) {
                this.unsubscribeTon();
            }
        });
    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.65)
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
        const cardTop = modalY - modalH / 2;

        // Shadow background panel
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, cardTop + 5, modalW, modalH, 18);
        this.container.add(shadow);

        // Main outer dialog card - Premium Bright Light Theme
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50 (bright light interior)
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outer outline (dark)
        card.fillRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);
        card.strokeRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);

        // Inner frame line
        card.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, cardTop + 4, modalW - 8, modalH - 8, 14);
        this.container.add(card);

        // Sleek Ribbon Banner for Title
        const ribbonW = 240;
        const ribbonH = 40;
        const ribbonX = modalX;
        const ribbonY = cardTop + 15;

        const ribbon = this.add.graphics();
        ribbon.fillStyle(0x0f172a, 0.95); // Dark ribbon for contrast
        ribbon.lineStyle(2, 0xf59e0b, 1); // Amber 500 border
        ribbon.fillRoundedRect(ribbonX - ribbonW / 2, ribbonY, ribbonW, ribbonH, 8);
        ribbon.strokeRoundedRect(ribbonX - ribbonW / 2, ribbonY, ribbonW, ribbonH, 8);
        this.container.add(ribbon);

        // Title Text with gradient fill
        const titleText = this.add.text(ribbonX, ribbonY + ribbonH / 2, t("player_profile"), {
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

        // Close Button
        const closeBtn = this.add.image(modalX + modalW / 2 - 25, ribbonY + ribbonH / 2, "close-button")
            .setDisplaySize(28, 28)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);

        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.overlay.destroy();
            this.scene.stop("ProfileScene");
        });

        // Get current user from state
        this.USER = state.user || {};

        // Profile Photo collectible badge card
        const photoX = modalX - 110;
        const photoY = cardTop + 105;

        const photoOutline = this.add.graphics();
        photoOutline.fillStyle(0xf1f5f9, 1); // Light grey inside photo frame
        photoOutline.lineStyle(2.5, 0x0f172a, 1); // Dark border
        photoOutline.fillRoundedRect(photoX - 44, photoY - 44, 88, 88, 16);
        photoOutline.strokeRoundedRect(photoX - 44, photoY - 44, 88, 88, 16);
        this.container.add(photoOutline);

        // Fallback default avatar
        const defaultAvatar = this.add.image(photoX, photoY, "icon_kikflick");
        defaultAvatar.setDisplaySize(78, 78);
        this.container.add(defaultAvatar);

        // Fetch UserPhotoUrl/PhotoUrl dynamically
        const photoUrl = this.USER.photoUrl || this.USER.photo_url;
        if (photoUrl) {
            const textureKey = `user_avatar_${this.USER.id || 'default'}`;

            const createAvatar = () => {
                if (!this.sys || !this.sys.settings) return;
                const avatar = this.add.image(photoX, photoY, textureKey);
                avatar.setDisplaySize(78, 78);

                // Circle mask for rounded look
                const maskShape = this.make.graphics();
                maskShape.fillStyle(0xffffff);
                maskShape.fillRoundedRect(photoX - 39, photoY - 39, 78, 78, 12);
                const mask = maskShape.createGeometryMask();
                avatar.setMask(mask);

                this.container.add(avatar);
                defaultAvatar.setVisible(false);
            };

            const isLoaded = this.textures.exists(textureKey);
            let isQueued = false;
            try {
                if (typeof this.load.checkKeyExists === 'function') {
                    isQueued = this.load.checkKeyExists('image', textureKey);
                } else {
                    const listItems = (this.load.list && this.load.list.entries) ? this.load.list.entries : [];
                    const inflightItems = (this.load.inflight && this.load.inflight.entries) ? this.load.inflight.entries : [];
                    isQueued = listItems.some(item => item && item.key === textureKey) ||
                        inflightItems.some(item => item && item.key === textureKey);
                }
            } catch (err) {
                console.warn("Failed to check loader queue state safely:", err);
            }

            if (isLoaded) {
                createAvatar();
            } else if (isQueued) {
                this.load.once("complete", () => {
                    createAvatar();
                });
            } else {
                const proxiedUrl = `/monsterworld/proxy-avatar?url=${encodeURIComponent(photoUrl)}`;
                this.load.image(textureKey, proxiedUrl);
                this.load.once("complete", () => {
                    createAvatar();
                });
                this.load.start();
            }
        }

        // Username
        const nameX = photoX + 58;
        const nameY = cardTop + 67;
        const name = (this.USER.username || this.USER.firstName || "Player").toUpperCase();

        const usernameText = this.add.text(nameX, nameY, name, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "18px",
            color: "#0f172a" // Slate 900 (dark text)
        });
        usernameText.setStroke("#ffffff", 3);
        this.container.add(usernameText);

        // Balances row below username (pills look)
        const balanceY1 = cardTop + 93;
        const balanceY2 = cardTop + 119;
        const formatNumber = (num) => {
            if (num === undefined || num === null || isNaN(num)) return "0";
            return new Intl.NumberFormat('en', {
                notation: 'compact',
                maximumFractionDigits: 2
            }).format(num);
        };

        // Draw horizontal pills for balances
        const drawBalancePill = (x, y, iconKey, value, textFillColor) => {
            const pillW = 66;
            const pillH = 22;

            // Pill box
            const box = this.add.graphics();
            box.fillStyle(0xe2e8f0, 0.95); // Light slate 200 fill
            box.lineStyle(1.5, 0x94a3b8, 1);  // Slate 400 border
            box.fillRoundedRect(x, y, pillW, pillH, 6);
            box.strokeRoundedRect(x, y, pillW, pillH, 6);
            this.container.add(box);

            // Icon
            const icon = this.add.image(x + 10, y + pillH / 2, iconKey).setDisplaySize(16, 16);
            this.container.add(icon);

            // Value
            const valText = this.add.text(x + 22, y + pillH / 2, formatNumber(value), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "10px",
                color: textFillColor
            }).setOrigin(0, 0.5);
            valText.setStroke("#ffffff", 2.5); // White outline
            this.container.add(valText);

            return pillW;
        };

        const pillSpacing = 8;
        
        // Row 1 next to avatar
        let currentPillX1 = nameX;
        currentPillX1 += drawBalancePill(currentPillX1, balanceY1, "item_ton", this.USER.ton, "#2563eb") + pillSpacing;
        drawBalancePill(currentPillX1, balanceY1, "item_gold", this.USER.gold, "#d97706");

        // Row 2 next to avatar
        let currentPillX2 = nameX;
        currentPillX2 += drawBalancePill(currentPillX2, balanceY2, "item_eggs", this.USER.eggs, "#16a34a") + pillSpacing;
        drawBalancePill(currentPillX2, balanceY2, "item_crystal", this.USER.crystal || 0, "#8b5cf6");

        // Wallet connection status row
        const walletY = cardTop + 145;
        const walletAddr = getWalletAddress();

        if (!walletAddr) {
            // CONNECT WALLET button
            const connectBtn = this.add.container(nameX, walletY);

            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x0088cc, 1); // TON Blue
            btnBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
            btnBg.fillRoundedRect(0, 0, 140, 22, 6);
            btnBg.strokeRoundedRect(0, 0, 140, 22, 6);
            connectBtn.add(btnBg);

            const btnText = this.add.text(70, 11, t("connect_wallet"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "11px",
                color: "#ffffff"
            }).setOrigin(0.5);
            btnText.setStroke("#004466", 2.5);
            connectBtn.add(btnText);

            // Interaction area
            const connectHitArea = this.add.rectangle(70, 11, 140, 22, 0x000000, 0)
                .setInteractive({ useHandCursor: true });
            connectBtn.add(connectHitArea);
            this.container.add(connectBtn);

            connectHitArea.on("pointerover", () => {
                this.tweens.add({ targets: connectBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
            });
            connectHitArea.on("pointerout", () => {
                this.tweens.add({ targets: connectBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 });
            });
            connectHitArea.on("pointerdown", () => {
                this.tweens.add({ targets: connectBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 });
            });
            connectHitArea.on("pointerup", async (pointer) => {
                this.tweens.add({ targets: connectBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
                if (!checkClick(pointer)) return;
                try {
                    const ui = initTonConnect();
                    if (ui) {
                        await ui.openModal();
                    } else {
                        showNotification(this, t("ton_unavailable"));
                    }
                } catch (err) {
                    console.error("Failed to connect wallet:", err);
                    showNotification(this, t("failed_connect"));
                }
            });
        } else {
            // Connected address
            const abbreviatedAddr = walletAddr.slice(0, 6) + "..." + walletAddr.slice(-5);

            const statusDot = this.add.graphics();
            statusDot.fillStyle(0x10b981, 1); // Green connected dot
            statusDot.fillCircle(nameX + 6, walletY + 11, 4);
            statusDot.lineStyle(1, 0x0f172a, 1);
            statusDot.strokeCircle(nameX + 6, walletY + 11, 4);
            this.container.add(statusDot);

            const addrText = this.add.text(nameX + 16, walletY + 11, abbreviatedAddr, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                fontWeight: "800",
                color: "#334155" // Slate 700
            }).setOrigin(0, 0.5);
            this.container.add(addrText);

            // Disconnect button [x]
            const discText = this.add.text(nameX + 16 + addrText.width + 10, walletY + 11, t("disconnect"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "10px",
                color: "#ef4444"
            }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
            discText.setStroke("#ffffff", 2.5);
            this.container.add(discText);

            discText.on("pointerover", () => discText.setScale(1.05));
            discText.on("pointerout", () => discText.setScale(1.0));
            discText.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                if (window.confirm(t("disconnect_confirm"))) {
                    try {
                        await disconnectWallet();
                    } catch (err) {
                        console.error("Failed to disconnect wallet:", err);
                    }
                }
            });
        }

        // EXP Bar using graphics and gradients
        const currentXP = this.USER.xp || 0;
        const maxXP = this.USER.maxXP || 100;

        const expY = cardTop + 184;

        // EXP badge
        const badgeG = this.add.graphics();
        badgeG.fillStyle(0x0f172a, 1);
        badgeG.fillRoundedRect(modalX - modalW / 2 + 20, expY - 10, 42, 20, 6);
        this.container.add(badgeG);

        const expBadgeText = this.add.text(modalX - modalW / 2 + 41, expY, "EXP", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        expBadgeText.setStroke("#020617", 2.5);
        this.container.add(expBadgeText);

        // XP bar BG
        const barX = modalX - modalW / 2 + 70;
        const barW = 270;
        const barH = 18;

        const xpBarBgG = this.add.graphics();
        xpBarBgG.fillStyle(0xe2e8f0, 1); // Light slate bar bg
        xpBarBgG.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        xpBarBgG.fillRoundedRect(barX, expY - 9, barW, barH, 6);
        xpBarBgG.strokeRoundedRect(barX, expY - 9, barW, barH, 6);
        this.container.add(xpBarBgG);

        // XP bar fill
        const xpRatio = Math.max(0, Math.min(1, currentXP / maxXP));
        if (xpRatio > 0) {
            const xpBarFillG = this.add.graphics();
            xpBarFillG.fillStyle(0x8b5cf6, 1); // Violet 500
            xpBarFillG.fillRoundedRect(barX + 1.5, expY - 7.5, (barW - 3) * xpRatio, barH - 3, 4);
            this.container.add(xpBarFillG);
        }

        // XP Text Overlay
        const xpText = this.add.text(barX + barW / 2, expY, `${currentXP} / ${maxXP}`, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        xpText.setStroke("#5b21b6", 2.5);
        this.container.add(xpText);

        // Stats card box
        const statsBoxY = cardTop + 207;
        const statsBoxW = modalW - 40;
        const statsBoxH = 180;

        const statsG = this.add.graphics();
        statsG.fillStyle(0xf1f5f9, 0.95); // Slate 100
        statsG.lineStyle(2, 0x0f172a, 1);   // Slate 900 (dark outline)
        statsG.fillRoundedRect(modalX - statsBoxW / 2, statsBoxY, statsBoxW, statsBoxH, 14);
        statsG.strokeRoundedRect(modalX - statsBoxW / 2, statsBoxY, statsBoxW, statsBoxH, 14);
        this.container.add(statsG);

        // Stats Title
        const statsTitleText = this.add.text(modalX, statsBoxY + 16, t("stats"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "15px",
            color: "#0f172a"
        }).setOrigin(0.5);
        statsTitleText.setStroke("#ffffff", 3);
        this.container.add(statsTitleText);

        // Stats Rows data
        const stats = [
            { label: t("battles_won"), val: String(this.USER.totalVictory || 0) },
            { label: t("battles_lost"), val: String(Math.max(0, (this.USER.totalBattles || 0) - (this.USER.totalVictory || 0))) },
            { label: t("win_rate"), val: `${this.USER.totalBattles > 0 ? Math.round(((this.USER.totalVictory || 0) / this.USER.totalBattles) * 100) : 0}%` },
            { label: t("total_captured"), val: String(this.USER.totalCaptured || 0) },
            { label: t("player_level"), val: String(this.USER.level || 1) }
        ];

        stats.forEach((item, index) => {
            const rowY = statsBoxY + 42 + index * 26;

            // Stats Label (Nunito)
            const labelText = this.add.text(modalX - statsBoxW / 2 + 16, rowY, item.label, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                fontWeight: "800",
                color: "#475569" // Slate 600
            });
            this.container.add(labelText);

            // Stats Value (Lilita One)
            const valText = this.add.text(modalX + statsBoxW / 2 - 16, rowY, item.val, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "13px",
                color: "#0f172a"
            }).setOrigin(1, 0);
            valText.setStroke("#ffffff", 2.5);
            this.container.add(valText);
        });

        // Team slots title
        const teamY = cardTop + 402;

        const teamTitleText = this.add.text(modalX, teamY, t("active_team"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "15px",
            color: "#0f172a"
        }).setOrigin(0.5);
        teamTitleText.setStroke("#ffffff", 3);
        this.container.add(teamTitleText);

        // Slots grid at the bottom
        this.teamContainer = this.add.container(0, 0);
        this.container.add(this.teamContainer);

        const slotSize = 64;
        const spacing = 12;
        const startX = modalX - (2 * slotSize + 1.5 * spacing);

        for (let i = 0; i < 4; i++) {
            const x = startX + i * (slotSize + spacing) + slotSize / 2;
            const y = cardTop + 452;

            // Slot background with neon glow outline
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0xe2e8f0, 0.95);
            slotBg.lineStyle(2, 0x0f172a, 1);
            slotBg.fillRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 10);
            slotBg.strokeRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 10);
            this.teamContainer.add(slotBg);
        }

        // Custom Dynamic Vector Deposit and Withdraw Buttons
        const buttonW = 145;
        const buttonH = 42;
        const buttonsY = cardTop + 514;

        // --- DEPOSIT BUTTON ---
        const depBtnContainer = this.add.container(modalX - buttonW / 2 - 8, buttonsY);

        const depBg = this.add.graphics();
        depBg.fillStyle(0x059669, 1); // Emerald 600 base
        depBg.lineStyle(2, 0x0f172a, 1); // Dark outline
        depBg.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 12);
        depBg.strokeRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 12);
        depBtnContainer.add(depBg);

        const depText = this.add.text(0, 0, t("deposit_ton"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0.5);
        depText.setStroke("#064e3b", 3.5);
        depText.setShadow(1, 1, "#000000", 1, true, true);
        depBtnContainer.add(depText);

        const depZone = this.add.zone(0, 0, buttonW, buttonH).setInteractive({ useHandCursor: true });
        depBtnContainer.add(depZone);
        this.container.add(depBtnContainer);

        depZone.on("pointerover", () => {
            this.tweens.add({ targets: depBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        depZone.on("pointerout", () => {
            this.tweens.add({ targets: depBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 100 });
        });
        depZone.on("pointerdown", () => {
            this.tweens.add({ targets: depBtnContainer, scaleX: 0.95, scaleY: 0.95, duration: 50 });
        });
        depZone.on("pointerup", (pointer) => {
            this.tweens.add({ targets: depBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;
            this.showDepositModal();
        });

        // --- WITHDRAW BUTTON ---
        const witBtnContainer = this.add.container(modalX + buttonW / 2 + 8, buttonsY);

        const witBg = this.add.graphics();
        witBg.fillStyle(0x2563eb, 1); // Blue 600 base
        witBg.lineStyle(2, 0x0f172a, 1); // Dark outline
        witBg.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 12);
        witBg.strokeRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 12);
        witBtnContainer.add(witBg);

        const witText = this.add.text(0, 0, t("withdraw"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0.5);
        witText.setStroke("#1e3a8a", 3.5);
        witText.setShadow(1, 1, "#000000", 1, true, true);
        witBtnContainer.add(witText);

        const witZone = this.add.zone(0, 0, buttonW, buttonH).setInteractive({ useHandCursor: true });
        witBtnContainer.add(witZone);
        this.container.add(witBtnContainer);

        witZone.on("pointerover", () => {
            this.tweens.add({ targets: witBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        witZone.on("pointerout", () => {
            this.tweens.add({ targets: witBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 100 });
        });
        witZone.on("pointerdown", () => {
            this.tweens.add({ targets: witBtnContainer, scaleX: 0.95, scaleY: 0.95, duration: 50 });
        });
        witZone.on("pointerup", (pointer) => {
            this.tweens.add({ targets: witBtnContainer, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;
            this.scene.launch("WithdrawalScene");
        });

        // --- PREMIUM LANGUAGE TOGGLE PILL ---
        const langToggleY = cardTop + 554;
        const langBtn = this.add.container(modalX, langToggleY);

        const currentLang = state.language || "en";

        const langBg = this.add.graphics();
        langBg.fillStyle(0x0f172a, 1); // Dark slate base
        langBg.lineStyle(1.5, 0x94a3b8, 0.8); // Slate 400 outline
        langBg.fillRoundedRect(-50, -11, 100, 22, 11);
        langBg.strokeRoundedRect(-50, -11, 100, 22, 11);
        langBtn.add(langBg);

        const globeText = this.add.text(-38, 0, "🌐", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "10px",
        }).setOrigin(0, 0.5);
        langBtn.add(globeText);

        const enText = this.add.text(-12, 0, "EN", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: currentLang === "en" ? "#fbbf24" : "#94a3b8"
        }).setOrigin(0, 0.5);
        if (currentLang === "en") enText.setStroke("#000000", 2);
        langBtn.add(enText);

        const dividerText = this.add.text(8, 0, "|", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "10px",
            color: "#475569"
        }).setOrigin(0, 0.5);
        langBtn.add(dividerText);

        const ruText = this.add.text(25, 0, "RU", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: currentLang === "ru" ? "#fbbf24" : "#94a3b8"
        }).setOrigin(0, 0.5);
        if (currentLang === "ru") ruText.setStroke("#000000", 2);
        langBtn.add(ruText);

        const langHit = this.add.rectangle(0, 0, 100, 22, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        langBtn.add(langHit);
        this.container.add(langBtn);

        langHit.on("pointerover", () => {
            langBg.clear();
            langBg.fillStyle(0x1e293b, 1);
            langBg.lineStyle(1.5, 0xf59e0b, 1);
            langBg.fillRoundedRect(-50, -11, 100, 22, 11);
            langBg.strokeRoundedRect(-50, -11, 100, 22, 11);
            langBtn.setScale(1.05);
        });

        langHit.on("pointerout", () => {
            langBg.clear();
            langBg.fillStyle(0x0f172a, 1);
            langBg.lineStyle(1.5, 0x94a3b8, 0.8);
            langBg.fillRoundedRect(-50, -11, 100, 22, 11);
            langBg.strokeRoundedRect(-50, -11, 100, 22, 11);
            langBtn.setScale(1.0);
        });

        langHit.on("pointerdown", () => {
            langBtn.setScale(0.95);
        });

        langHit.on("pointerup", (pointer) => {
            langBtn.setScale(1.0);
            if (!checkClick(pointer)) return;
            const nextLang = currentLang === "en" ? "ru" : "en";
            setLanguage(nextLang);
            this.scene.restart();
        });
    }

    showDepositModal() {
        if (this.depositModal) {
            this.depositModal.destroy();
        }

        this.depositModal = this.add.container(0, 0).setDepth(205);

        // 1. Full Screen Overlay to dim background
        const depOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive();
        this.depositModal.add(depOverlay);

        // 2. Dialog Background
        const dialogWidth = 340;
        const dialogHeight = 440;
        const dialogX = this.width / 2;
        const dialogY = this.height / 2;

        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(dialogX - dialogWidth / 2 + 5, dialogY - dialogHeight / 2 + 5, dialogWidth, dialogHeight, 16);
        this.depositModal.add(shadow);

        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0xf8fafc, 0.98); // Slate 50 (light background)
        dialogBg.lineStyle(2.5, 0x0f172a, 1); // Slate 900 (dark outline)
        dialogBg.fillRoundedRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight, 16);
        dialogBg.strokeRoundedRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight, 16);
        this.depositModal.add(dialogBg);

        // 3. Title
        const titleY = dialogY - dialogHeight / 2 + 25;
        const titleText = this.add.text(dialogX, titleY, t("deposit_ton"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px",
            color: "#0f172a"
        }).setOrigin(0.5);
        titleText.setStroke("#ffffff", 4.5);
        this.depositModal.add(titleText);

        // 4. Close Button [x]
        const closeBtn = this.add.image(dialogX + dialogWidth / 2 - 25, titleY, "close-button")
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.depositModal.add(closeBtn);
        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.depositModal.destroy();
            this.depositModal = null;
        });

        const address = "UQADl5J3n3LHZqoZQ0HkvHLVXiZYS2t0l6GQ938qy8t3aQKf";
        const comment = String(this.USER.id || "");

        // 5. Instruction text
        let currY = titleY + 28;
        const instructionText = this.add.text(dialogX, currY, t("deposit_instruction"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#475569" // Slate 600
        }).setOrigin(0.5);
        this.depositModal.add(instructionText);

        // 6. Address Section
        currY += 28;
        const addrHeading = this.add.text(dialogX - dialogWidth / 2 + 25, currY, t("wallet_address"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#0f172a"
        });
        addrHeading.setStroke("#ffffff", 2.5);
        this.depositModal.add(addrHeading);

        currY += 20;
        const addrBox = this.add.graphics();
        addrBox.fillStyle(0xe2e8f0, 1); // Light slate box
        addrBox.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        addrBox.fillRoundedRect(dialogX - dialogWidth / 2 + 20, currY - 4, dialogWidth - 40, 48, 8);
        addrBox.strokeRoundedRect(dialogX - dialogWidth / 2 + 20, currY - 4, dialogWidth - 40, 48, 8);
        this.depositModal.add(addrBox);

        const addrPart1 = address.slice(0, 24);
        const addrPart2 = address.slice(24);
        const addrText1 = this.add.text(dialogX, currY, addrPart1, {
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#0f172a"
        }).setOrigin(0.5);
        const addrText2 = this.add.text(dialogX, currY + 18, addrPart2, {
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.depositModal.add([addrText1, addrText2]);

        // Copy Address button
        currY += 50;
        const copyAddrBtn = this.add.container(dialogX, currY + 10);

        const copyAddrBg = this.add.graphics();
        copyAddrBg.fillStyle(0x334155, 1);
        copyAddrBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        copyAddrBg.fillRoundedRect(-70, -12, 140, 24, 6);
        copyAddrBg.strokeRoundedRect(-70, -12, 140, 24, 6);
        copyAddrBtn.add(copyAddrBg);

        const copyAddrText = this.add.text(0, 0, t("copy_address"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "10px",
            color: "#ffffff"
        }).setOrigin(0.5);
        copyAddrText.setStroke("#000000", 2.5);
        copyAddrBtn.add(copyAddrText);

        const copyAddrHit = this.add.rectangle(0, 0, 140, 24, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        copyAddrBtn.add(copyAddrHit);
        this.depositModal.add(copyAddrBtn);

        copyAddrHit.on("pointerover", () => this.tweens.add({ targets: copyAddrBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
        copyAddrHit.on("pointerout", () => this.tweens.add({ targets: copyAddrBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        copyAddrHit.on("pointerdown", () => this.tweens.add({ targets: copyAddrBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
        copyAddrHit.on("pointerup", (pointer) => {
            this.tweens.add({ targets: copyAddrBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;
            navigator.clipboard.writeText(address);
            showNotification(this, t("address_copied"));
        });

        // 7. Comment Section
        currY += 35;
        const commentHeading = this.add.text(dialogX - dialogWidth / 2 + 25, currY, t("required_memo"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#b45309" // Dark amber
        });
        commentHeading.setStroke("#ffffff", 2.5);
        this.depositModal.add(commentHeading);

        currY += 20;
        const commentBox = this.add.graphics();
        commentBox.fillStyle(0xfef3c7, 1); // Amber 100 light fill
        commentBox.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        commentBox.fillRoundedRect(dialogX - dialogWidth / 2 + 20, currY - 4, dialogWidth - 40, 26, 8);
        commentBox.strokeRoundedRect(dialogX - dialogWidth / 2 + 20, currY - 4, dialogWidth - 40, 26, 8);
        this.depositModal.add(commentBox);

        const commentText = this.add.text(dialogX, currY + 9, comment, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#b45309"
        }).setOrigin(0.5);
        commentText.setStroke("#ffffff", 2.5);
        this.depositModal.add(commentText);

        // Copy Comment button
        currY += 30;
        const copyCommBtn = this.add.container(dialogX, currY + 10);

        const copyCommBg = this.add.graphics();
        copyCommBg.fillStyle(0x334155, 1);
        copyCommBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        copyCommBg.fillRoundedRect(-70, -12, 140, 24, 6);
        copyCommBg.strokeRoundedRect(-70, -12, 140, 24, 6);
        copyCommBtn.add(copyCommBg);

        const copyCommText = this.add.text(0, 0, t("copy_comment"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "10px",
            color: "#ffffff"
        }).setOrigin(0.5);
        copyCommText.setStroke("#000000", 2.5);
        copyCommBtn.add(copyCommText);

        const copyCommHit = this.add.rectangle(0, 0, 140, 24, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        copyCommBtn.add(copyCommHit);
        this.depositModal.add(copyCommBtn);

        copyCommHit.on("pointerover", () => this.tweens.add({ targets: copyCommBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
        copyCommHit.on("pointerout", () => this.tweens.add({ targets: copyCommBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        copyCommHit.on("pointerdown", () => this.tweens.add({ targets: copyCommBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
        copyCommHit.on("pointerup", (pointer) => {
            this.tweens.add({ targets: copyCommBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;
            navigator.clipboard.writeText(comment);
            showNotification(this, t("comment_copied"));
        });

        // 8. Action Buttons (Open Wallet & Check Payment)
        currY += 45;

        // Open Wallet Button (Left)
        const openWalletBtn = this.add.container(dialogX - 75, currY + 15);

        const openWalletBg = this.add.graphics();
        openWalletBg.fillStyle(0x0088cc, 1); // TON Blue
        openWalletBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        openWalletBg.fillRoundedRect(-65, -16, 130, 32, 8);
        openWalletBg.strokeRoundedRect(-65, -16, 130, 32, 8);
        openWalletBtn.add(openWalletBg);

        const openWalletText = this.add.text(0, 0, t("open_wallet"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        openWalletText.setStroke("#004466", 2.5);
        openWalletBtn.add(openWalletText);

        const openWalletHit = this.add.rectangle(0, 0, 130, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        openWalletBtn.add(openWalletHit);
        this.depositModal.add(openWalletBtn);

        openWalletHit.on("pointerover", () => this.tweens.add({ targets: openWalletBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
        openWalletHit.on("pointerout", () => this.tweens.add({ targets: openWalletBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        openWalletHit.on("pointerdown", () => this.tweens.add({ targets: openWalletBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
        openWalletHit.on("pointerup", (pointer) => {
            this.tweens.add({ targets: openWalletBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;
            const deepLink = `ton://transfer/${address}?text=${comment}`;
            try {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openLink(deepLink);
                } else {
                    window.open(deepLink, "_blank");
                }
            } catch (err) {
                window.open(deepLink, "_blank");
            }
        });

        // Verify Payment Button (Right)
        const verifyBtn = this.add.container(dialogX + 75, currY + 15);

        const verifyBg = this.add.graphics();
        verifyBg.fillStyle(0x10b981, 1); // Green 500
        verifyBg.lineStyle(1.5, 0x0f172a, 1); // Dark outline
        verifyBg.fillRoundedRect(-65, -16, 130, 32, 8);
        verifyBg.strokeRoundedRect(-65, -16, 130, 32, 8);
        verifyBtn.add(verifyBg);

        const verifyText = this.add.text(0, 0, t("verify"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        verifyText.setStroke("#064e3b", 2.5);
        verifyBtn.add(verifyText);

        const verifyHit = this.add.rectangle(0, 0, 130, 32, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        verifyBtn.add(verifyHit);
        this.depositModal.add(verifyBtn);

        verifyHit.on("pointerover", () => this.tweens.add({ targets: verifyBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
        verifyHit.on("pointerout", () => this.tweens.add({ targets: verifyBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
        verifyHit.on("pointerdown", () => this.tweens.add({ targets: verifyBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
        verifyHit.on("pointerup", async (pointer) => {
            this.tweens.add({ targets: verifyBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
            if (!checkClick(pointer)) return;

            createloadingOverlay(this);
            showNotification(this, "Watching for deposit... Please wait up to 5 minutes.");

            let attempts = 0;
            const maxAttempts = 20; // 20 * 15 seconds = 300 seconds (5 minutes)
            let verified = false;
            let pollingInterval;

            const performPoll = async () => {
                attempts++;
                try {
                    const res = await api.pollDeposits();
                    if (res && res.success && res.credited) {
                        verified = true;
                        this.USER = state.user || {};
                        clearInterval(pollingInterval);
                        destroyloadingOverlay(this);
                        
                        showNotification(this, t("deposit_success"));
                        if (this.depositModal) {
                            this.depositModal.destroy();
                            this.depositModal = null;
                        }
                        this.scene.restart();
                        return;
                    }
                } catch (err) {
                    console.error("Error checking user balance via polling:", err);
                }

                if (attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    destroyloadingOverlay(this);
                    showNotification(this, t("deposit_not_detected"));
                }
            };

            // Run first poll immediately
            await performPoll();

            if (!verified) {
                pollingInterval = setInterval(performPoll, 15000);

                // Clean up interval on scene shutdown or destroy
                this.events.once("shutdown", () => clearInterval(pollingInterval));
                this.events.once("destroy", () => clearInterval(pollingInterval));

                // Also clean up if the deposit modal itself is destroyed
                if (this.depositModal) {
                    const originalDestroy = this.depositModal.destroy;
                    this.depositModal.destroy = (...args) => {
                        clearInterval(pollingInterval);
                        originalDestroy.apply(this.depositModal, args);
                    };
                }
            }
        });
    }



    async loadProfileData() {
        try {
            const result = await api.loadInventory(0);
            if (result && result.success && result.monsters) {
                this.displayTeam(result.monsters.slice(0, 4));
            }
        } catch (e) {
            console.error("Failed to load team in profile modal:", e);
        }
    }

    displayTeam(team) {
        if (!this.teamContainer) return;
        this.teamContainer.removeAll(true);

        const modalW = 360;
        const modalH = 585;
        const modalX = this.width / 2;
        const cardTop = this.height / 2 - modalH / 2;
        const teamY = cardTop + 390;

        const slotSize = 64;
        const spacing = 12;
        const startX = modalX - (2 * slotSize + 1.5 * spacing);

        team.forEach((monster, i) => {
            const x = startX + i * (slotSize + spacing) + slotSize / 2;
            const y = cardTop + 440;

            // Monster Icon
            const icon = this.add.image(x, y - 4, `icon_${monster.id}`).setDisplaySize(48, 48);
            this.teamContainer.add(icon);

            // Level text box overlay
            const lvlBox = this.add.graphics();
            lvlBox.fillStyle(0x000000, 0.75);
            lvlBox.fillRoundedRect(x - 22, y + 12, 44, 13, 3);
            this.teamContainer.add(lvlBox);

            const lvlText = this.add.text(x, y + 18, t("level_locked", { level: monster.level }), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "9px",
                color: "#ffffff"
            }).setOrigin(0.5);
            lvlText.setStroke("#000000", 2.5);
            this.teamContainer.add(lvlText);
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
            img.x += x + offsetX;
            img.y += y;
            container.add(img);
        });

        return lengthWidth;
    }
}
