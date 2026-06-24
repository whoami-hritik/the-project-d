import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { checkClick } from "./game.js";
import { showNotification, createloadingOverlay, destroyloadingOverlay } from "../utility.js";
import { t } from "../translations.js";

export class CollectorScene extends Phaser.Scene {
    constructor() {
        super({ key: "CollectorScene" });
    }

    getSafeMonsterIconKey(spriteKey) {
        try {
            if (this.textures.exists(spriteKey)) {
                const tex = this.textures.get(spriteKey);
                if (tex && tex.source && tex.source[0] && tex.source[0].image && tex.source[0].width > 0) {
                    return spriteKey;
                }
            }
        } catch (e) {
            console.error("Error checking texture:", spriteKey, e);
        }

        const fallback = "icon_kikflick";
        try {
            if (this.textures.exists(fallback)) {
                const tex = this.textures.get(fallback);
                if (tex && tex.source && tex.source[0] && tex.source[0].image && tex.source[0].width > 0) {
                    return fallback;
                }
            }
        } catch (e) {
            console.error("Error checking fallback:", e);
        }
        return null;
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.statusData = null;
        this.stakedMonstersInfo = []; // cache for real-time tickers
        this.statusLoadTime = 0;

        this.createOverlay();
        this.createDialog();
        this.loadCollectorData();
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

        // Main outer dialog card - Premium Bright Light Theme matching Profile
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50 (bright light interior)
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outer outline (dark)
        card.fillRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);
        card.strokeRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);

        // Inner frame line
        card.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, cardTop + 4, modalW - 8, modalH - 8, 14);
        this.container.add(card);

        // Ribbon Banner for Title
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

        // Title Text
        const titleText = this.add.text(ribbonX, ribbonY + ribbonH / 2, t("collector_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px"
        }).setOrigin(0.5);
        const titleGrad = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        titleGrad.addColorStop(0, '#fbbf24'); // Amber 300
        titleGrad.addColorStop(1, '#f59e0b'); // Amber 500
        titleText.setFill(titleGrad);
        titleText.setStroke("#020617", 4.5);
        titleText.setShadow(1, 1, "#000000", 1, true, true);
        this.container.add(titleText);

        // Info Button [!]
        const infoBtn = this.add.container(modalX + modalW / 2 - 62, ribbonY + ribbonH / 2);
        const infoCircle = this.add.graphics();
        infoCircle.fillStyle(0x3b82f6, 1); // Premium Blue
        infoCircle.lineStyle(1.5, 0x0f172a, 1);
        infoCircle.fillCircle(0, 0, 12);
        infoCircle.strokeCircle(0, 0, 12);
        infoBtn.add(infoCircle);

        const infoTxt = this.add.text(0, 0, "i", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0.5);
        infoBtn.add(infoTxt);

        const infoHit = this.add.circle(0, 0, 12, 0, 0).setInteractive({ useHandCursor: true });
        infoBtn.add(infoHit);
        this.container.add(infoBtn);

        infoHit.on("pointerover", () => infoBtn.setScale(1.1));
        infoHit.on("pointerout", () => infoBtn.setScale(1.0));
        infoHit.on("pointerdown", () => infoBtn.setScale(0.95));
        infoHit.on("pointerup", (pointer) => {
            infoBtn.setScale(1.0);
            if (!checkClick(pointer)) return;
            this.showCollectorInfoModal();
        });

        // Close Button
        const mainCloseBtnKey = this.getSafeMonsterIconKey("close-button") || "icon_kikflick";
        const closeBtn = this.add.image(modalX + modalW / 2 - 25, ribbonY + ribbonH / 2, mainCloseBtnKey)
            .setDisplaySize(28, 28)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);

        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.closeCollector();
        });

        // Setup scrollable view area for slots
        this.listContainer = this.add.container(modalX, modalY - modalH / 2 + 195).setDepth(202);
        this.viewY = modalY - modalH / 2 + 195;
        this.viewWidth = modalW - 24;
        this.viewHeight = modalH - 220;

        // Mask
        const maskGraphics = this.make.graphics({ add: false });
        maskGraphics.fillRect(modalX - this.viewWidth / 2, this.viewY, this.viewWidth, this.viewHeight);
        const mask = maskGraphics.createGeometryMask();
        this.listContainer.setMask(mask);

        this.enableListScrolling();
    }

    closeCollector() {
        if (this.infoModal) {
            this.infoModal.destroy();
            this.infoModal = null;
        }
        this.overlay.destroy();
        this.scene.stop("CollectorScene");
    }

    showCollectorInfoModal() {
        if (this.infoModal) {
            this.infoModal.destroy();
        }

        const modalW = 320;
        const modalH = 430;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        this.infoModal = this.add.container(0, 0).setDepth(230);

        // Dim background
        const dim = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive();
        this.infoModal.add(dim);

        // Card Shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);
        this.infoModal.add(shadow);

        // Card
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98);
        card.lineStyle(3, 0x0f172a, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        this.infoModal.add(card);

        // Header Title
        const titleText = this.add.text(modalX, modalY - modalH / 2 + 25, t("collector_info_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.infoModal.add(titleText);

        // Close Button [x]
        const closeBtnKey = this.getSafeMonsterIconKey("close-button") || "icon_kikflick";
        const closeBtn = this.add.image(modalX + modalW / 2 - 25, modalY - modalH / 2 + 25, closeBtnKey)
            .setDisplaySize(20, 20)
            .setInteractive({ useHandCursor: true });
        this.infoModal.add(closeBtn);
        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.infoModal.destroy();
            this.infoModal = null;
        });

        let currentY = modalY - modalH / 2 + 55;

        // Rules Section Header
        const rulesTitle = this.add.text(modalX - modalW / 2 + 20, currentY, t("collector_info_rules"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#475569"
        });
        this.infoModal.add(rulesTitle);
        currentY += 20;

        // Rules list
        const rules = [
            t("collector_info_rule1"),
            t("collector_info_rule2"),
            t("collector_info_rule3"),
            t("collector_info_rule4"),
            t("collector_info_rule5")
        ];

        rules.forEach(rule => {
            const txt = this.add.text(modalX - modalW / 2 + 20, currentY, rule, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                fontWeight: "800",
                color: "#1e293b",
                wordWrap: { width: modalW - 40 }
            });
            this.infoModal.add(txt);
            currentY += txt.height + 6;
        });

        currentY += 10;

        // Divider
        const divider = this.add.graphics();
        divider.lineStyle(1.5, 0xe2e8f0, 1);
        divider.lineBetween(modalX - modalW / 2 + 20, currentY, modalX + modalW / 2 - 20, currentY);
        this.infoModal.add(divider);
        currentY += 15;

        // Eligible Monsters Section Header
        const eligibleTitle = this.add.text(modalX - modalW / 2 + 20, currentY, t("collector_eligible_species"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#475569"
        });
        this.infoModal.add(eligibleTitle);
        currentY += 20;

        // Render eligible monster species
        const eligibleList = this.statusData.eligibleMonsters || [];
        
        // Let's draw them in a nice grid! 2 columns, say.
        const startX = modalX - modalW / 2 + 25;
        const colWidth = 135;
        const rowHeight = 36;
        
        eligibleList.forEach((monId, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const x = startX + col * colWidth;
            const y = currentY + row * rowHeight;
            
            // Container for this species
            const monContainer = this.add.container(x, y);
            
            // Icon
            const spriteKey = `icon_${monId.toLowerCase()}`;
            const safeKey = this.getSafeMonsterIconKey(spriteKey);
            if (safeKey) {
                const portrait = this.add.image(12, 12, safeKey);
                portrait.setDisplaySize(24, 24);
                monContainer.add(portrait);
            } else {
                const placeholder = this.add.graphics();
                placeholder.fillStyle(0xcbd5e1, 1);
                placeholder.fillCircle(12, 12, 12);
                monContainer.add(placeholder);
            }
            
            // Name
            const name = this.add.text(28, 6, monId.toUpperCase(), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "10px",
                color: "#0f172a"
            });
            monContainer.add(name);
            
            this.infoModal.add(monContainer);
        });
    }

    async loadCollectorData() {
        createloadingOverlay(this);
        try {
            const res = await api.getCollectorStatus();
            destroyloadingOverlay(this);

            if (res && res.success) {
                this.statusData = res;
                this.statusLoadTime = Date.now();
                this.farmingCapHours = res.farmingCapHours || 1.0;

                // Sync user state
                if (res.user) {
                    state.user = res.user;
                } else if (res.User) {
                    state.user = res.User;
                }

                this.renderUI();
            } else {
                showNotification(this, res?.reason || "Failed to load collector status");
                this.closeCollector();
            }
        } catch (err) {
            destroyloadingOverlay(this);
            console.error("Error loading collector data:", err);
            showNotification(this, "Network error loading collector data");
            this.closeCollector();
        }
    }

    renderUI() {
        // Clear old dynamically generated objects inside container (excluding background & layout)
        if (this.uiGroup) {
            this.uiGroup.forEach(obj => obj.destroy());
        }
        this.uiGroup = [];

        if (this.listObjects) {
            this.listObjects.forEach(obj => obj.destroy());
        }
        this.listObjects = [];

        const modalW = 360;
        const modalH = 585;
        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const cardTop = modalY - modalH / 2;

        this.USER = state.user || {};

        // --- top resource / balance panel ---
        const balanceY = cardTop + 70;
        const formatNumber = (num) => {
            if (num === undefined || num === null || isNaN(num)) return "0";
            return new Intl.NumberFormat('en', {
                notation: 'compact',
                maximumFractionDigits: 2
            }).format(num);
        };

        const drawBalancePill = (x, y, iconKey, value, textFillColor) => {
            const pillW = 75;
            const pillH = 24;

            const box = this.add.graphics();
            box.fillStyle(0xe2e8f0, 0.95);
            box.lineStyle(1.5, 0x94a3b8, 1);
            box.fillRoundedRect(x, y, pillW, pillH, 6);
            box.strokeRoundedRect(x, y, pillW, pillH, 6);
            this.container.add(box);
            this.uiGroup.push(box);

            const icon = this.add.image(x + 12, y + pillH / 2, iconKey).setDisplaySize(18, 18);
            this.container.add(icon);
            this.uiGroup.push(icon);

            const valText = this.add.text(x + 25, y + pillH / 2, formatNumber(value), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "11px",
                color: textFillColor
            }).setOrigin(0, 0.5);
            valText.setStroke("#ffffff", 2.5);
            this.container.add(valText);
            this.uiGroup.push(valText);

            return pillW;
        };

        const pillSpacing = 8;
        let currentPillX = modalX - (3 * 75 + 2 * pillSpacing) / 2;
        currentPillX += drawBalancePill(currentPillX, balanceY, "item_ton", this.USER.ton || 0, "#2563eb") + pillSpacing;
        currentPillX += drawBalancePill(currentPillX, balanceY, "item_gold", this.USER.gold || 0, "#d97706") + pillSpacing;
        drawBalancePill(currentPillX, balanceY, "item_crystal", this.USER.crystal || 0, "#8b5cf6");

        // --- exhibition / countdown card ---
        const exY = cardTop + 105;
        const exW = modalW - 40;
        const exH = 75;

        const exG = this.add.graphics();
        exG.fillStyle(0x0f172a, 0.95); // Dark Slate
        exG.lineStyle(2, 0xf59e0b, 1);   // Amber outline
        exG.fillRoundedRect(modalX - exW / 2, exY, exW, exH, 10);
        exG.strokeRoundedRect(modalX - exW / 2, exY, exW, exH, 10);
        this.container.add(exG);
        this.uiGroup.push(exG);

        const exTitle = this.statusData.activeExhibitionTitle || "COLLECTION EXHIBITION";
        const mapText = this.add.text(modalX, exY + 18, exTitle, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#fbbf24"
        }).setOrigin(0.5);
        mapText.setShadow(1, 1, "#000000", 1, true, true);
        this.container.add(mapText);
        this.uiGroup.push(mapText);

        const bonusText = this.add.text(modalX, exY + 36, t("match_bonus"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#10b981"
        }).setOrigin(0.5);
        this.container.add(bonusText);
        this.uiGroup.push(bonusText);

        // Expiry countdown timer text
        this.timerText = this.add.text(modalX, exY + 54, "Resets in: 00:00:00", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#94a3b8"
        }).setOrigin(0.5);
        this.container.add(this.timerText);
        this.uiGroup.push(this.timerText);

        this.countdownSec = this.statusData.countdownSeconds || 0;

        // --- Render slots list ---
        this.stakedMonstersInfo = [];
        this.renderSlots();
    }

    renderSlots() {
        const slotsCount = this.statusData.unlockedSlots || 1;
        const maxSlots = this.statusData.maxSlots || 5;
        const stakedList = this.statusData.stakedMonsters || [];

        let currentY = 10;
        const itemW = this.viewWidth - 10;
        const itemH = 92;
        const spacing = 10;

        // Slots we show: unlocked slots, plus 1 locked slot if unlocked < maxSlots
        const totalSlotsToShow = Math.min(maxSlots, slotsCount + 1);

        for (let i = 0; i < totalSlotsToShow; i++) {
            const isLocked = i >= slotsCount;
            const slotStaked = !isLocked ? stakedList[i] : null;

            const slotContainer = this.add.container(-this.viewWidth / 2 + 5, currentY);

            // Slot Background Panel
            const panel = this.add.graphics();
            if (isLocked) {
                panel.fillStyle(0xe2e8f0, 0.4); // Greyed out locked slot
                panel.lineStyle(1.5, 0x94a3b8, 0.5);
            } else if (!slotStaked) {
                panel.fillStyle(0xf1f5f9, 0.9);  // Clean unoccupied slot
                panel.lineStyle(2, 0x94a3b8, 1);
            } else {
                panel.fillStyle(0xffffff, 0.98); // Solid white occupied slot
                panel.lineStyle(2.5, this.getRarityColorHex(slotStaked.monster.rarity), 1); // Rarity border
            }
            panel.fillRoundedRect(0, 0, itemW, itemH, 12);
            panel.strokeRoundedRect(0, 0, itemW, itemH, 12);
            slotContainer.add(panel);

            if (isLocked) {
                // Locked layout
                const lockIcon = this.add.text(45, itemH / 2, "🔒", { fontSize: "28px" }).setOrigin(0.5);
                slotContainer.add(lockIcon);

                const lockTitle = this.add.text(90, 22, t("unlock_slot"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "14px",
                    color: "#475569"
                });
                slotContainer.add(lockTitle);

                const costVal = this.statusData.nextSlotCost || 100;
                // Wait! Is cost in GOLD or TON? Default to GOLD unless specified.
                const currency = "GOLD";
                const lockDescText = t("unlock_slot_desc", { cost: costVal, currency: currency });
                const lockDesc = this.add.text(90, 42, lockDescText, {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#64748b"
                });
                slotContainer.add(lockDesc);

                // Buy button
                const btnW = 100;
                const btnH = 26;
                const buyBtn = this.add.container(itemW - btnW / 2 - 15, itemH / 2);

                const btnBg = this.add.graphics();
                btnBg.fillStyle(0x2563eb, 1);
                btnBg.lineStyle(1.5, 0x0f172a, 1);
                btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                buyBtn.add(btnBg);

                const btnTxt = this.add.text(0, 0, t("buy"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "12px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                btnTxt.setStroke("#1e3a8a", 2);
                buyBtn.add(btnTxt);

                const hitZone = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
                buyBtn.add(hitZone);
                slotContainer.add(buyBtn);

                hitZone.on("pointerover", () => buyBtn.setScale(1.05));
                hitZone.on("pointerout", () => buyBtn.setScale(1.0));
                hitZone.on("pointerdown", () => buyBtn.setScale(0.95));
                hitZone.on("pointerup", async (pointer) => {
                    buyBtn.setScale(1.0);
                    if (!checkClick(pointer)) return;
                    this.unlockSlot();
                });

            } else if (!slotStaked) {
                // Empty stake slot layout
                const plusIcon = this.add.text(45, itemH / 2, "➕", { fontSize: "24px" }).setOrigin(0.5);
                slotContainer.add(plusIcon);

                const emptyTitle = this.add.text(90, 26, t("empty_slot_title"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "14px",
                    color: "#64748b"
                });
                slotContainer.add(emptyTitle);

                const emptyDesc = this.add.text(90, 46, t("empty_slot_desc"), {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#94a3b8"
                });
                slotContainer.add(emptyDesc);

                // Click overlay on the entire slot
                const slotHit = this.add.rectangle(itemW / 2, itemH / 2, itemW, itemH, 0x000000, 0)
                    .setInteractive({ useHandCursor: true });
                slotContainer.add(slotHit);

                slotHit.on("pointerover", () => panel.lineStyle(2.5, 0x3b82f6, 1).strokeRoundedRect(0, 0, itemW, itemH, 12));
                slotHit.on("pointerout", () => panel.lineStyle(2, 0x94a3b8, 1).strokeRoundedRect(0, 0, itemW, itemH, 12));
                slotHit.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    this.showMonsterSelectionPanel();
                });

            } else {
                // Staked occupied monster layout
                const mon = slotStaked.monster;
                const rarityColor = this.getRarityColor(mon.rarity);

                // Monster Image
                const spriteKey = `icon_${(mon.id || "").toLowerCase()}`;
                const safeKey = this.getSafeMonsterIconKey(spriteKey);
                if (safeKey) {
                    const monImg = this.add.image(42, itemH / 2 - 5, safeKey);
                    monImg.setDisplaySize(54, 54);
                    slotContainer.add(monImg);
                } else {
                    const placeholder = this.add.graphics();
                    placeholder.fillStyle(0xcbd5e1, 1);
                    placeholder.fillCircle(42, itemH / 2 - 5, 27);
                    slotContainer.add(placeholder);
                }

                // Level Badge
                const lvlBox = this.add.graphics();
                lvlBox.fillStyle(0x0f172a, 1);
                lvlBox.fillRoundedRect(18, 64, 48, 16, 4);
                slotContainer.add(lvlBox);

                const lvlTxt = this.add.text(42, 72, `Lv.${mon.level}`, {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "10px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                slotContainer.add(lvlTxt);

                // Monster Name & Rarity
                const nameTxt = this.add.text(82, 12, (mon.nickname || mon.title || mon.id || "").toUpperCase(), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "13px",
                    color: "#0f172a"
                });
                slotContainer.add(nameTxt);

                const rarityTxt = this.add.text(82, 28, mon.rarity.toUpperCase(), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "9px",
                    color: rarityColor
                });
                slotContainer.add(rarityTxt);

                // Farming yield indicators
                const yieldY = 44;
                const goldYield = slotStaked.goldRate || 0;
                const crystalYield = slotStaked.crystalRate || 0;

                let rateDesc = "";
                if (goldYield > 0 && crystalYield > 0) {
                    rateDesc = `💎+${goldYield}G • +${crystalYield}C/hr`;
                } else if (crystalYield > 0) {
                    rateDesc = `💎+${crystalYield} Crystal/hr`;
                } else {
                    rateDesc = `💎+${goldYield} Gold/hr`;
                }

                const yieldRateTxt = this.add.text(82, yieldY, rateDesc, {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#475569"
                });
                slotContainer.add(yieldRateTxt);

                // Progress bar for the 1-hour cycle
                const pBarBg = this.add.graphics();
                pBarBg.fillStyle(0xe2e8f0, 1);
                pBarBg.fillRoundedRect(82, yieldY + 14, 110, 5, 2.5);
                slotContainer.add(pBarBg);

                const pBarFill = this.add.graphics();
                slotContainer.add(pBarFill);

                // Real-time ticking accumulation text
                const tickerText = this.add.text(82, yieldY + 22, "Accumulating...", {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "9px",
                    color: "#2563eb"
                });
                slotContainer.add(tickerText);

                // Total duration text (24 hours cap indicator)
                const durationTxt = this.add.text(82, yieldY + 33, "Farmed: 0h / 24h", {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "8.5px",
                    fontWeight: "800",
                    color: "#64748b"
                });
                slotContainer.add(durationTxt);

                // Parse deposit time safely
                const depositTime = mon.collectorDepositTime ? new Date(mon.collectorDepositTime).getTime() : Date.now();

                // Cache ticker calculations
                this.stakedMonstersInfo.push({
                    monsterId: mon.instanceId,
                    goldRate: goldYield,
                    crystalRate: crystalYield,
                    initialGold: slotStaked.goldEarned || 0,
                    initialCrystal: slotStaked.crystalEarned || 0,
                    elapsedHoursAtLoad: slotStaked.elapsedHours || 0,
                    depositTimeMs: depositTime,
                    tickerTextObj: tickerText,
                    pBarFillObj: pBarFill,
                    durationTextObj: durationTxt,
                    xOffset: 82,
                    yOffset: yieldY + 14
                });

                // CLAIM & RETRIEVE buttons
                const btnW = 100;
                const btnH = 22;

                // --- CLAIM BUTTON ---
                const claimBtn = this.add.container(itemW - btnW / 2 - 15, 24);

                const claimBg = this.add.graphics();
                claimBg.fillStyle(0x10b981, 1);
                claimBg.lineStyle(1.5, 0x0f172a, 1);
                claimBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                claimBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                claimBtn.add(claimBg);

                const claimTxt = this.add.text(0, 0, t("claim_rewards"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "10px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                claimTxt.setStroke("#064e3b", 2);
                claimBtn.add(claimTxt);

                const claimHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
                claimBtn.add(claimHit);
                slotContainer.add(claimBtn);

                claimHit.on("pointerover", () => claimBtn.setScale(1.05));
                claimHit.on("pointerout", () => claimBtn.setScale(1.0));
                claimHit.on("pointerdown", () => claimBtn.setScale(0.95));
                claimHit.on("pointerup", async (pointer) => {
                    claimBtn.setScale(1.0);
                    if (!checkClick(pointer)) return;
                    this.claimRewards(mon.instanceId);
                });

                // --- RETRIEVE / UNSTAKE BUTTON ---
                const unstakeBtn = this.add.container(itemW - btnW / 2 - 15, 58);

                const unstakeBg = this.add.graphics();
                unstakeBg.fillStyle(0xef4444, 1);
                unstakeBg.lineStyle(1.5, 0x0f172a, 1);
                unstakeBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                unstakeBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                unstakeBtn.add(unstakeBg);

                const unstakeTxt = this.add.text(0, 0, t("unstake"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "10px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                unstakeTxt.setStroke("#7f1d1d", 2);
                unstakeBtn.add(unstakeTxt);

                const unstakeHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
                unstakeBtn.add(unstakeHit);
                slotContainer.add(unstakeBtn);

                unstakeHit.on("pointerover", () => unstakeBtn.setScale(1.05));
                unstakeHit.on("pointerout", () => unstakeBtn.setScale(1.0));
                unstakeHit.on("pointerdown", () => unstakeBtn.setScale(0.95));
                unstakeHit.on("pointerup", async (pointer) => {
                    unstakeBtn.setScale(1.0);
                    if (!checkClick(pointer)) return;
                    this.unstakeMonster(mon.instanceId);
                });
            }

            this.listContainer.add(slotContainer);
            this.listObjects.push(slotContainer);

            currentY += itemH + spacing;
        }

        this.listHeight = currentY;
    }

    async claimRewards(monsterId) {
        createloadingOverlay(this);
        try {
            const res = await api.claimCollectorRewards(monsterId);
            destroyloadingOverlay(this);

            if (res && res.success) {
                const goldGained = res.goldGained || 0;
                const crystalGained = res.crystalGained || 0;

                let msg = "";
                if (goldGained > 0 && crystalGained > 0) {
                    msg = `Claimed: +${goldGained} Gold, +${crystalGained} Crystal!`;
                } else if (crystalGained > 0) {
                    msg = `Claimed: +${crystalGained} Crystal!`;
                } else {
                    msg = `Claimed: +${goldGained} Gold!`;
                }

                showNotification(this, msg);
                this.loadCollectorData(); // Refresh state & UI
            } else {
                showNotification(this, res?.reason || t("claim_failed"));
            }
        } catch (err) {
            destroyloadingOverlay(this);
            console.error("Error claiming rewards:", err);
            showNotification(this, t("claim_failed"));
        }
    }

    async unstakeMonster(monsterId) {
        createloadingOverlay(this);
        try {
            const res = await api.unstakeMonster(monsterId);
            destroyloadingOverlay(this);

            if (res && res.success) {
                showNotification(this, t("unstake_success"));
                this.loadCollectorData();
            } else {
                showNotification(this, res?.reason || t("unstake_failed"));
            }
        } catch (err) {
            destroyloadingOverlay(this);
            console.error("Error unstaking monster:", err);
            showNotification(this, t("unstake_failed"));
        }
    }

    async unlockSlot() {
        createloadingOverlay(this);
        try {
            const res = await api.unlockCollectorSlot();
            destroyloadingOverlay(this);

            if (res && res.success) {
                showNotification(this, t("unlock_success"));
                this.loadCollectorData();
            } else {
                showNotification(this, res?.reason || t("unlock_failed"));
            }
        } catch (err) {
            destroyloadingOverlay(this);
            console.error("Error unlocking slot:", err);
            showNotification(this, t("unlock_failed"));
        }
    }

    // --- MONSTER STAKING LIST SELECTION PANEL ---
    showMonsterSelectionPanel() {
        if (this.monsterSelectOverlay) {
            this.monsterSelectOverlay.destroy();
        }

        const modalW = 340;
        const modalH = 460;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        this.monsterSelectOverlay = this.add.container(0, 0).setDepth(210);

        // Background Dim Overlay
        const bgDim = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.75)
            .setOrigin(0)
            .setInteractive();
        this.monsterSelectOverlay.add(bgDim);

        // Dialog Card
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, modalY - modalH / 2 + 5, modalW, modalH, 16);
        this.monsterSelectOverlay.add(shadow);

        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(3, 0x0f172a, 1);    // Slate 900
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        this.monsterSelectOverlay.add(card);

        // Title
        const titleY = modalY - modalH / 2 + 25;
        const title = this.add.text(modalX, titleY, t("select_monster"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "18px",
            color: "#0f172a"
        }).setOrigin(0.5);
        title.setStroke("#ffffff", 3.5);
        this.monsterSelectOverlay.add(title);

        // Close Button [x]
        const selectCloseBtnKey = this.getSafeMonsterIconKey("close-button") || "icon_kikflick";
        const closeBtn = this.add.image(modalX + modalW / 2 - 25, titleY, selectCloseBtnKey)
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.monsterSelectOverlay.add(closeBtn);
        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.monsterSelectOverlay.destroy();
            this.monsterSelectOverlay = null;
        });

        // Scrollable List of Available Monsters
        const listContainer = this.add.container(modalX, modalY - modalH / 2 + 65);
        this.monsterSelectOverlay.add(listContainer);

        const viewW = modalW - 20;
        const viewH = modalH - 85;

        // Mask
        const maskG = this.make.graphics({ add: false });
        maskG.fillRect(modalX - viewW / 2, modalY - modalH / 2 + 65, viewW, viewH);
        const mask = maskG.createGeometryMask();
        listContainer.setMask(mask);

        // Populate available monsters
        const availList = this.statusData.availableMonsters || [];
        const itemW = viewW - 10;
        const itemH = 68;
        const spacing = 8;
        let currentY = 5;

        if (availList.length === 0) {
            const noText = this.add.text(0, viewH / 2, t("no_monsters_stake"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "14px",
                color: "#64748b",
                align: "center"
            }).setOrigin(0.5);
            listContainer.add(noText);
        } else {
            availList.forEach((mon) => {
                const row = this.add.container(-viewW / 2 + 5, currentY);

                const cooldownEnd = mon.collectorDepositTime ? new Date(mon.collectorDepositTime).getTime() : 0;
                const isOnCooldown = cooldownEnd > Date.now();

                const rowBg = this.add.graphics();
                if (isOnCooldown) {
                    rowBg.fillStyle(0xe2e8f0, 0.7); // Greyed out cooldown
                    rowBg.lineStyle(1.5, 0x94a3b8, 0.5);
                } else {
                    rowBg.fillStyle(0xffffff, 0.95);
                    rowBg.lineStyle(1.5, this.getRarityColorHex(mon.rarity), 0.8);
                }
                rowBg.fillRoundedRect(0, 0, itemW, itemH, 10);
                rowBg.strokeRoundedRect(0, 0, itemW, itemH, 10);
                row.add(rowBg);

                // Portrait
                const spriteKey = `icon_${(mon.id || "").toLowerCase()}`;
                const safeKey = this.getSafeMonsterIconKey(spriteKey);
                if (safeKey) {
                    const portrait = this.add.image(30, itemH / 2, safeKey);
                    portrait.setDisplaySize(44, 44);
                    if (isOnCooldown) portrait.setAlpha(0.55);
                    row.add(portrait);
                } else {
                    const placeholder = this.add.graphics();
                    placeholder.fillStyle(0xcbd5e1, 1);
                    placeholder.fillCircle(30, itemH / 2, 22);
                    row.add(placeholder);
                }

                // Name & level & rarity
                const nameTxt = this.add.text(65, 8, (mon.nickname || mon.title || mon.id || "").toUpperCase(), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "12px",
                    color: isOnCooldown ? "#64748b" : "#0f172a"
                });
                row.add(nameTxt);

                const detailsTxt = this.add.text(65, 23, `Lv.${mon.level} • ${mon.rarity.toUpperCase()}`, {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "9px",
                    fontWeight: "800",
                    color: isOnCooldown ? "#94a3b8" : this.getRarityColor(mon.rarity)
                });
                row.add(detailsTxt);

                if (isOnCooldown) {
                    // Show cooldown countdown & progress bar
                    const remainingSec = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
                    const hours = Math.floor(remainingSec / 3600);
                    const minutes = Math.floor((remainingSec % 3600) / 60);
                    const cdTextStr = `Cooldown: ${hours}h ${minutes}m left`;

                    const cdText = this.add.text(65, 36, cdTextStr, {
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "9px",
                        fontWeight: "800",
                        color: "#ef4444"
                    });
                    row.add(cdText);

                    // Progress bar for cooldown
                    const totalCooldownMs = 24 * 3600 * 1000;
                    const remainingMs = cooldownEnd - Date.now();
                    const progressRatio = Math.max(0, Math.min(1, 1 - (remainingMs / totalCooldownMs)));

                    const barW = 120;
                    const barH = 5;
                    const barX = 65;
                    const barY = 49;

                    const barBg = this.add.graphics();
                    barBg.fillStyle(0xe2e8f0, 1);
                    barBg.fillRoundedRect(barX, barY, barW, barH, 2.5);
                    row.add(barBg);

                    const barFill = this.add.graphics();
                    barFill.fillStyle(0xef4444, 1);
                    barFill.fillRoundedRect(barX, barY, barW * progressRatio, barH, 2.5);
                    row.add(barFill);

                } else {
                    // Yield Preview Details
                    // Let's compute rate using similar formula preview
                    const baseScale = Math.ceil(mon.level / 5.0);
                    const isMatch = mon.capturedMap?.toLowerCase() === this.statusData.activeExhibitionMap?.toLowerCase();
                    const matchBonus = isMatch ? 0.2 : 0.0;
                    const mult = this.getRarityMult(mon.rarity) + matchBonus;

                    let previewText = "";
                    const r = mon.rarity?.toLowerCase() || "common";
                    if (r === "common") {
                        previewText = `Yield: +${Math.round(baseScale * 1.0 * mult * 100) / 100} Gold/hr`;
                    } else if (r === "rare") {
                        previewText = `Yield: +${Math.round(baseScale * 1.0 * mult * 100) / 100} Gold OR +${Math.round(baseScale * 0.5 * mult * 100) / 100} Crystal/hr`;
                    } else {
                        previewText = `Yield: +${Math.round(baseScale * 1.0 * mult * 100) / 100}G & +${Math.round(baseScale * 0.5 * mult * 100) / 100}C/hr`;
                    }

                    const yieldPreview = this.add.text(65, 38, previewText, {
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "9px",
                        fontWeight: "800",
                        color: "#475569"
                    });
                    row.add(yieldPreview);
                }

                // Select / Stake button
                const btnW = 60;
                const btnH = 22;
                const stakeBtn = this.add.container(itemW - btnW - 10, itemH / 2);

                const sBg = this.add.graphics();
                const sTxt = this.add.text(0, 0, t("stake"), {
                    fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                    fontSize: "10px",
                    color: "#ffffff"
                }).setOrigin(0.5);

                const sHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0);

                if (isOnCooldown) {
                    sBg.fillStyle(0xcbd5e1, 1); // Disabled slate
                    sBg.lineStyle(1, 0x94a3b8, 1);
                    sTxt.setStroke("#94a3b8", 2);
                    sTxt.setColor("#94a3b8");
                } else {
                    sBg.fillStyle(0x3b82f6, 1); // Active blue
                    sBg.lineStyle(1, 0x0f172a, 1);
                    sTxt.setStroke("#1d4ed8", 2);
                    sHit.setInteractive({ useHandCursor: true });
                    sHit.on("pointerover", () => stakeBtn.setScale(1.05));
                    sHit.on("pointerout", () => stakeBtn.setScale(1.0));
                    sHit.on("pointerdown", () => stakeBtn.setScale(0.95));
                    sHit.on("pointerup", (pointer) => {
                        stakeBtn.setScale(1.0);
                        if (!checkClick(pointer)) return;
                        this.onMonsterSelectedForStaking(mon);
                    });
                }
                sBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                sBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                stakeBtn.add(sBg);
                stakeBtn.add(sTxt);
                stakeBtn.add(sHit);
                row.add(stakeBtn);

                listContainer.add(row);
                currentY += itemH + spacing;
            });
        }

        // Custom dragging for available monsters list
        let isDragging = false;
        let startY = 0;
        const listMinY = modalY - modalH / 2 + 65;
        const listMaxY = modalY + modalH / 2 - 20;

        bgDim.on("pointerdown", (pointer) => {
            if (pointer.y >= listMinY && pointer.y <= listMaxY) {
                isDragging = true;
                startY = pointer.y;
            }
        });
        bgDim.on("pointermove", (pointer) => {
            if (!isDragging) return;
            const deltaY = pointer.y - startY;
            startY = pointer.y;
            listContainer.y += deltaY;

            const minY = (modalY - modalH / 2 + 65) - Math.max(0, currentY - viewH);
            listContainer.y = Phaser.Math.Clamp(listContainer.y, minY, modalY - modalH / 2 + 65);
        });
        bgDim.on("pointerup", () => isDragging = false);
    }

    onMonsterSelectedForStaking(monster) {
        this.showStakingWarningModal(monster, () => {
            const rarity = monster.rarity?.toLowerCase() || "common";
            if (rarity === "rare") {
                // Rare rarity allows focus choice modal (GOLD or CRYSTAL)
                this.showFocusChoiceModal(monster);
            } else {
                // Common default to GOLD focus, Epic/Legendary default to GOLD (they farm both anyways)
                this.stakeMonster(monster.instanceId, "GOLD");
            }
        });
    }

    showStakingWarningModal(monster, onConfirm) {
        if (this.warningModal) {
            this.warningModal.destroy();
        }

        const modalW = 280;
        const modalH = 180;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        this.warningModal = this.add.container(0, 0).setDepth(215);

        // Dimmer overlay
        const dim = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive();
        this.warningModal.add(dim);

        // Card
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 14);
        this.warningModal.add(shadow);

        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98);
        card.lineStyle(2.5, 0x0f172a, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 14);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 14);
        this.warningModal.add(card);

        // Title
        const titleText = this.add.text(modalX, modalY - modalH / 2 + 20, t("stake_warning_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ef4444"
        }).setOrigin(0.5);
        this.warningModal.add(titleText);

        // Description/Warning text
        const descText = this.add.text(modalX, modalY - modalH / 2 + 50, t("stake_warning_desc"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#475569",
            align: "center",
            wordWrap: { width: modalW - 40 }
        }).setOrigin(0.5, 0);
        this.warningModal.add(descText);

        // Action Buttons: Cancel and Confirm
        const btnW = 100;
        const btnH = 26;

        // Cancel Button (Red outline / Grey fill)
        const cancelBtn = this.add.container(modalX - 60, modalY + modalH / 2 - 30);
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x64748b, 1); // slate grey
        cancelBg.lineStyle(1.5, 0x0f172a, 1);
        cancelBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        cancelBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        cancelBtn.add(cancelBg);

        const cancelText = this.add.text(0, 0, t("cancel"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelText.setStroke("#334155", 2);
        cancelBtn.add(cancelText);

        const cancelHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
        cancelBtn.add(cancelHit);
        this.warningModal.add(cancelBtn);

        cancelHit.on("pointerover", () => cancelBtn.setScale(1.05));
        cancelHit.on("pointerout", () => cancelBtn.setScale(1.0));
        cancelHit.on("pointerdown", () => cancelBtn.setScale(0.95));
        cancelHit.on("pointerup", (pointer) => {
            cancelBtn.setScale(1.0);
            if (!checkClick(pointer)) return;
            this.warningModal.destroy();
            this.warningModal = null;
        });

        // Confirm Button (Green)
        const confirmBtn = this.add.container(modalX + 60, modalY + modalH / 2 - 30);
        const confirmBg = this.add.graphics();
        confirmBg.fillStyle(0x10b981, 1); // emerald green
        confirmBg.lineStyle(1.5, 0x0f172a, 1);
        confirmBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        confirmBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        confirmBtn.add(confirmBg);

        const confirmText = this.add.text(0, 0, t("confirm"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "11px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmText.setStroke("#064e3b", 2);
        confirmBtn.add(confirmText);

        const confirmHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
        confirmBtn.add(confirmHit);
        this.warningModal.add(confirmBtn);

        confirmHit.on("pointerover", () => confirmBtn.setScale(1.05));
        confirmHit.on("pointerout", () => confirmBtn.setScale(1.0));
        confirmHit.on("pointerdown", () => confirmBtn.setScale(0.95));
        confirmHit.on("pointerup", (pointer) => {
            confirmBtn.setScale(1.0);
            if (!checkClick(pointer)) return;
            this.warningModal.destroy();
            this.warningModal = null;
            onConfirm();
        });
    }

    showFocusChoiceModal(monster) {
        if (this.focusModal) {
            this.focusModal.destroy();
        }

        const modalW = 280;
        const modalH = 200;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        this.focusModal = this.add.container(0, 0).setDepth(220);

        // Dimmer overlay
        const dim = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive();
        this.focusModal.add(dim);

        // Card
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 14);
        this.focusModal.add(shadow);

        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98);
        card.lineStyle(2.5, 0x0f172a, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 14);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 14);
        this.focusModal.add(card);

        // Title
        const titleText = this.add.text(modalX, modalY - modalH / 2 + 25, t("farming_focus"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.focusModal.add(titleText);

        const descText = this.add.text(modalX, modalY - modalH / 2 + 55, t("choose_focus"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#475569",
            align: "center",
            wordWrap: { width: modalW - 40 }
        }).setOrigin(0.5);
        this.focusModal.add(descText);

        // Focus Buttons: GOLD and CRYSTAL
        const btnW = 100;
        const btnH = 34;

        // --- GOLD FOCUS BUTTON ---
        const goldBtn = this.add.container(modalX - 60, modalY + 20);
        const gBg = this.add.graphics();
        gBg.fillStyle(0xd97706, 1);
        gBg.lineStyle(1.5, 0x0f172a, 1);
        gBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        gBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        goldBtn.add(gBg);

        const gTxt = this.add.text(0, 0, t("gold_name"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        gTxt.setStroke("#78350f", 2);
        goldBtn.add(gTxt);

        const gHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
        goldBtn.add(gHit);
        this.focusModal.add(goldBtn);

        gHit.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.focusModal.destroy();
            this.focusModal = null;
            this.stakeMonster(monster.instanceId, "GOLD");
        });

        // --- CRYSTAL FOCUS BUTTON ---
        const cryBtn = this.add.container(modalX + 60, modalY + 20);
        const cBg = this.add.graphics();
        cBg.fillStyle(0x8b5cf6, 1);
        cBg.lineStyle(1.5, 0x0f172a, 1);
        cBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        cBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        cryBtn.add(cBg);

        const cTxt = this.add.text(0, 0, t("crystal_name"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cTxt.setStroke("#5b21b6", 2);
        cryBtn.add(cTxt);

        const cHit = this.add.rectangle(0, 0, btnW, btnH, 0, 0).setInteractive({ useHandCursor: true });
        cryBtn.add(cHit);
        this.focusModal.add(cryBtn);

        cHit.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.focusModal.destroy();
            this.focusModal = null;
            this.stakeMonster(monster.instanceId, "CRYSTAL");
        });

        // Cancel / Back Button
        const cancelBtn = this.add.text(modalX, modalY + 75, t("cancel"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ef4444"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.focusModal.add(cancelBtn);

        cancelBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.focusModal.destroy();
            this.focusModal = null;
        });
    }

    async stakeMonster(monsterId, focus) {
        createloadingOverlay(this);
        try {
            const res = await api.stakeMonster(monsterId, focus);
            destroyloadingOverlay(this);

            if (res && res.success) {
                showNotification(this, t("staking_success"));
                // Clear selection panel
                if (this.monsterSelectOverlay) {
                    this.monsterSelectOverlay.destroy();
                    this.monsterSelectOverlay = null;
                }
                this.loadCollectorData(); // Refresh UI
            } else {
                showNotification(this, res?.reason || t("staking_failed"));
            }
        } catch (err) {
            destroyloadingOverlay(this);
            console.error("Error staking monster:", err);
            showNotification(this, t("staking_failed"));
        }
    }

    // --- UTILITIES & DRAWING HELPERS ---
    getRarityColor(rarity) {
        const r = rarity?.toLowerCase();
        if (r === "rare") return "#3b82f6";     // Blue
        if (r === "epic") return "#a855f7";     // Purple
        if (r === "legendary") return "#f59e0b"; // Orange/Gold
        return "#64748b";                       // Slate
    }

    getRarityColorHex(rarity) {
        const r = rarity?.toLowerCase();
        if (r === "rare") return 0x3b82f6;
        if (r === "epic") return 0xa855f7;
        if (r === "legendary") return 0xf59e0b;
        return 0x64748b;
    }

    getRarityMult(rarity) {
        const r = rarity?.toLowerCase();
        if (r === "common") return 1.0;
        if (r === "rare") return 1.2;
        if (r === "epic") return 1.4;
        if (r === "legendary") return 1.8;
        return 1.0;
    }

    enableListScrolling() {
        this.isDragging = false;
        this.startY = 0;

        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const listMinY = this.viewY;
        const listMaxY = this.viewY + this.viewHeight;
        const listMinX = modalX - this.viewWidth / 2;
        const listMaxX = modalX + this.viewWidth / 2;

        this.input.on("pointerdown", (pointer) => {
            if (pointer.x >= listMinX && pointer.x <= listMaxX && pointer.y >= listMinY && pointer.y <= listMaxY) {
                this.isDragging = true;
                this.startY = pointer.y;
            }
        });

        this.input.on("pointermove", (pointer) => {
            if (!this.isDragging) return;
            const deltaY = pointer.y - this.startY;
            this.startY = pointer.y;

            this.listContainer.y += deltaY;

            // Clamp container position
            const minY = this.viewY - Math.max(0, this.listHeight - this.viewHeight);
            this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, minY, this.viewY);
        });

        this.input.on("pointerup", () => {
            this.isDragging = false;
        });

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            if (pointer.x >= listMinX && pointer.x <= listMaxX && pointer.y >= listMinY && pointer.y <= listMaxY) {
                this.listContainer.y -= deltaY * 0.45;
                const minY = this.viewY - Math.max(0, this.listHeight - this.viewHeight);
                this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, minY, this.viewY);
            }
        });
    }

    // --- GAME LOOP / UPDATE FOR COUNTDOWN & TICKERS ---
    update(time, delta) {
        // 1. Decrement and render countdown timer
        if (this.countdownSec > 0) {
            this.countdownSec -= delta / 1000;
            if (this.countdownSec < 0) this.countdownSec = 0;

            const totalSec = Math.floor(this.countdownSec);
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            const format = (n) => String(n).padStart(2, "0");
            if (this.timerText) {
                this.timerText.setText(`Resets in: ${format(hrs)}:${format(mins)}:${format(secs)}`);
            }
        } else if (this.countdownSec <= 0 && this.timerText) {
            this.timerText.setText("Resets in: 00:00:00");
        }

        // 2. Real-time yield accumulation tickers & progress bars
        if (this.stakedMonstersInfo.length > 0 && this.statusLoadTime > 0) {
            const elapsedMs = Date.now() - this.statusLoadTime;
            const elapsedHours = elapsedMs / 3600000;
            const cap = this.farmingCapHours || 1.0;

            this.stakedMonstersInfo.forEach((item) => {
                const totalElapsed = Math.min((item.elapsedHoursAtLoad || 0) + elapsedHours, cap);
                const currentGold = totalElapsed * item.goldRate;
                const currentCrystal = totalElapsed * item.crystalRate;

                let displayStr = "";
                if (item.goldRate > 0 && item.crystalRate > 0) {
                    displayStr = `Claim: +${currentGold.toFixed(3)}G • +${currentCrystal.toFixed(3)}C`;
                } else if (item.crystalRate > 0) {
                    displayStr = `Claim: +${currentCrystal.toFixed(3)} Crystal`;
                } else {
                    displayStr = `Claim: +${currentGold.toFixed(3)} Gold`;
                }

                if (item.tickerTextObj) {
                    item.tickerTextObj.setText(displayStr);
                }

                // Update 1-hour cycle progress bar
                if (item.pBarFillObj) {
                    item.pBarFillObj.clear();
                    const fraction = Math.min(totalElapsed / cap, 1.0);
                    item.pBarFillObj.fillStyle(fraction >= 1.0 ? 0x10b981 : 0x3b82f6, 1); // Green if full, blue if farming
                    item.pBarFillObj.fillRoundedRect(item.xOffset, item.yOffset, 110 * fraction, 5, 2.5);
                }

                // Update 24-hour total duration text
                if (item.durationTextObj && item.depositTimeMs) {
                    const stakedElapsedMs = Date.now() - item.depositTimeMs;
                    const stakedElapsedHours = Math.min(24.0, Math.max(0, stakedElapsedMs / 3600000));
                    item.durationTextObj.setText(`Farmed: ${stakedElapsedHours.toFixed(1)}h / 24h`);
                    
                    if (stakedElapsedHours >= 23.0) {
                        item.durationTextObj.setColor("#ef4444"); // Red warning
                    } else if (stakedElapsedHours >= 18.0) {
                        item.durationTextObj.setColor("#f59e0b"); // Orange warning
                    } else {
                        item.durationTextObj.setColor("#64748b"); // Slate
                    }
                }
            });
        }
    }
}
