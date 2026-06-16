import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { showNotification } from "../utility.js";

export class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: "ShopScene" });
    }

    init() {
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.activeTab = "Items"; // "Packs", "Items", "Exchange"
        this.items = {};
        this.shopItems = {};
        this.exchangePairs = [];
        this.exchangeRates = [];
        this.USER = state.user || {};
    }

    create() {
        this.createOverlay();
        this.createDialog();
        this.loadData();
    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive();
    }

    destroyOverlay() {
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
    }

    createloadingOverlay() {
        if (this.loadOverlay) return;

        this.loadOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.5)
            .setOrigin(0)
            .setDepth(250)
            .setScrollFactor(0)
            .setInteractive();

        this.buffer = this.add.image(this.width / 2, this.height / 2, "loading_buffer");
        this.buffer.setScale(0.05).setDepth(250);

        this.buffering = this.tweens.add({
            targets: this.buffer,
            angle: 360,
            duration: 1000,
            repeat: -1
        });
    }

    destroyloadingOverlay() {
        if (this.buffering) {
            this.buffering.stop();
            this.buffering = null;
        }
        if (this.buffer) {
            this.buffer.destroy();
            this.buffer = null;
        }
        if (this.loadOverlay) {
            this.loadOverlay.destroy();
            this.loadOverlay = null;
        }
    }

    createDialog() {
        this.container = this.add.container(0, 0).setDepth(201);

        const modalW = 360;
        const modalH = 585;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        // Shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, modalY - modalH / 2 + 5, modalW, modalH, 16);
        this.container.add(shadow);

        // Main outer dialog card - Premium Bright Light Theme
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50 (bright light interior)
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outer outline (dark)
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        card.lineStyle(1.5, 0x64748b, 0.4); // Slate 500 inner thin border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW - 8, modalH - 8, 12);
        this.container.add(card);

        // Title Ribbon Banner
        const ribbonW = 220;
        const ribbonH = 38;
        const ribbonX = modalX;
        const ribbonY = modalY - modalH / 2;

        const ribbon = this.add.graphics();
        ribbon.fillStyle(0xd97706, 1); // Amber 600
        ribbon.lineStyle(2, 0x0f172a, 1); // Dark border
        ribbon.fillRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        ribbon.strokeRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        this.container.add(ribbon);

        // Title Text using native Phaser text with gaming style stroke
        const titleText = this.add.text(ribbonX, ribbonY + 4, "🛒 SHOP", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);
        titleText.setStroke("#0f172a", 6);
        titleText.setShadow(1, 2, "#000000", 0, true, true);
        this.container.add(titleText);

        // Close Button
        const btnClose = this.add.image(modalX + modalW / 2 - 25, modalY - modalH / 2 + 25, "close-button");
        btnClose.setDisplaySize(30, 30).setInteractive({ useHandCursor: true });
        btnClose.on("pointerup", () => {
            this.destroyOverlay();
            this.scene.stop("ShopScene");
        });
        this.container.add(btnClose);

        // Currency/Resource Bar Background (Light slate)
        const resourceBg = this.add.graphics();
        resourceBg.fillStyle(0xe2e8f0, 0.9); // Slate 200
        resourceBg.lineStyle(1.5, 0xcbd5e1, 1); // Slate 300 border
        resourceBg.fillRoundedRect(modalX - modalW / 2 + 12, modalY - modalH / 2 + 35, modalW - 24, 40, 8);
        resourceBg.strokeRoundedRect(modalX - modalW / 2 + 12, modalY - modalH / 2 + 35, modalW - 24, 40, 8);
        this.container.add(resourceBg);

        // Setup 3 resource boxes (TON, GOLD, EGGS) inside Resource Bar
        this.resourceTexts = {};
        const resources = [
            { key: "ton", icon: "item_ton", label: "TON" },
            { key: "gold", icon: "item_gold", label: "GOLD" },
            { key: "eggs", icon: "item_eggs", label: "EGGS" }
        ];

        const boxW = 100;
        const boxH = 28;
        const totalBarW = 316;
        const startX = modalX - totalBarW / 2;

        resources.forEach((res, i) => {
            const boxX = startX + i * 108;
            const boxY = modalY - modalH / 2 + 41;

            const boxGraphics = this.add.graphics();
            boxGraphics.fillStyle(0xffffff, 1); // Pure white inside
            boxGraphics.lineStyle(1, 0xcbd5e1, 1); // Subtle grey border
            boxGraphics.fillRoundedRect(boxX, boxY, boxW, boxH, 6);
            boxGraphics.strokeRoundedRect(boxX, boxY, boxW, boxH, 6);
            this.container.add(boxGraphics);

            // Icon
            const icon = this.add.image(boxX + 14, boxY + 14, res.icon).setDisplaySize(16, 16);
            this.container.add(icon);

            // Value Text (placed dynamically in updateResourceBar)
            this.resourceTexts[res.key] = {
                x: boxX + 28,
                y: boxY + 14,
                container: this.container,
                textElement: null
            };
        });

        this.updateResourceBar();

        // Tabs setup
        this.tabGraphics = this.add.graphics();
        this.container.add(this.tabGraphics);
        this.tabTexts = [];
        this.createTabs();

        // Setup scrollable view area
        this.listContainer = this.add.container(modalX, modalY - modalH / 2 + 130).setDepth(202);

        // Viewport dimensions
        this.viewY = modalY - modalH / 2 + 130;
        this.viewWidth = modalW - 24;
        this.viewHeight = modalH - 146;

        // Mask
        const maskGraphics = this.make.graphics({ add: false });
        maskGraphics.fillRect(modalX - this.viewWidth / 2, this.viewY, this.viewWidth, this.viewHeight);
        const mask = maskGraphics.createGeometryMask();
        this.listContainer.setMask(mask);

        this.enableListScrolling();
    }

    updateResourceBar() {
        const resources = ["ton", "gold", "eggs"];
        resources.forEach((key) => {
            const textObj = this.resourceTexts[key];
            if (!textObj) return;

            // Clear old text element
            if (textObj.textElement) {
                textObj.textElement.destroy();
            }

            const val = this.USER[key] || 0;
            const formatted = this.formatNumber(val);

            textObj.textElement = this.add.text(textObj.x, textObj.y, formatted, {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "13px",
                color: "#0f172a"
            }).setOrigin(0, 0.5);
            textObj.textElement.setStroke("#ffffff", 2);

            textObj.container.add(textObj.textElement);
        });
    }

    createTabs() {
        this.tabGraphics.clear();
        if (this.tabInteractiveZones) {
            this.tabInteractiveZones.forEach(zone => zone.destroy());
        }
        this.tabInteractiveZones = [];

        if (this.tabTexts) {
            this.tabTexts.forEach(txt => txt.destroy());
        }
        this.tabTexts = [];

        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const tabsY = modalY - 585 / 2 + 88;

        const tabs = [
            { name: "Packs", x: modalX - 110, w: 90 },
            { name: "Items", x: modalX, w: 90 },
            { name: "Exchange", x: modalX + 110, w: 100 }
        ];

        tabs.forEach((tab) => {
            const isActive = this.activeTab === tab.name;

            // Draw Background Card
            if (isActive) {
                this.tabGraphics.fillStyle(0xd97706, 1); // Amber 600 active
                this.tabGraphics.lineStyle(1.5, 0x0f172a, 1); // Dark border
                this.tabGraphics.fillRoundedRect(tab.x - tab.w / 2, tabsY, tab.w, 28, 6);
                this.tabGraphics.strokeRoundedRect(tab.x - tab.w / 2, tabsY, tab.w, 28, 6);

                const txt = this.add.text(tab.x, tabsY + 14, tab.name.toUpperCase(), {
                    fontFamily: "Lilita One, Coiny, sans-serif",
                    fontSize: "13px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                txt.setStroke("#78350f", 3.5);
                txt.setShadow(1, 1, "#000000", 0, true, true);
                this.container.add(txt);
                this.tabTexts.push(txt);
            } else {
                this.tabGraphics.fillStyle(0xe2e8f0, 0.9); // Slate 200 inactive
                this.tabGraphics.lineStyle(1.5, 0xcbd5e1, 1); // Slate 300 border
                this.tabGraphics.fillRoundedRect(tab.x - tab.w / 2, tabsY, tab.w, 28, 6);
                this.tabGraphics.strokeRoundedRect(tab.x - tab.w / 2, tabsY, tab.w, 28, 6);

                const txt = this.add.text(tab.x, tabsY + 14, tab.name.toUpperCase(), {
                    fontFamily: "Lilita One, Coiny, sans-serif",
                    fontSize: "12px",
                    color: "#475569"
                }).setOrigin(0.5);
                this.container.add(txt);
                this.tabTexts.push(txt);
            }

            // Interactive zone added to this.container so it switches depth and receives clicks correctly!
            const zone = this.add.zone(tab.x, tabsY + 14, tab.w, 28).setInteractive({ useHandCursor: true });
            this.container.add(zone);
            zone.on("pointerup", () => {
                if (this.activeTab !== tab.name) {
                    this.activeTab = tab.name;
                    this.createTabs();
                    this.renderActiveTab();
                }
            });
            this.tabInteractiveZones.push(zone);
        });
    }

    async loadData() {
        this.createloadingOverlay();
        try {
            const [shopRes, itemsRes, termsRes] = await Promise.all([
                api.GetShop(),
                api.GetItems(),
                api.GetExchangeTerms()
            ]);

            if (shopRes && shopRes.success) {
                this.shopItems = shopRes.listedItems || {};
            }
            if (itemsRes && itemsRes.success) {
                this.items = itemsRes.Items || itemsRes.items || {};
            }
            if (termsRes && termsRes.success) {
                this.exchangePairs = termsRes.exchangePairs || [];
                this.exchangeRates = termsRes.exchangeRate || [];
            }
        } catch (e) {
            console.error("Failed to load shop data", e);
        } finally {
            this.destroyloadingOverlay();
            this.renderActiveTab();
        }
    }

    renderActiveTab() {
        // Clear list
        this.listContainer.removeAll(true);
        this.listContainer.y = this.viewY;
        this.listHeight = 0;

        if (this.activeTab === "Packs") {
            this.renderPacksTab();
        } else if (this.activeTab === "Items") {
            this.renderItemsTab();
        } else if (this.activeTab === "Exchange") {
            this.renderExchangeTab();
        }
    }

    renderPacksTab() {
        const cardW = 320;
        const cardH = 260; // Slightly taller to display image, description, and buy button
        const cardX = -cardW / 2;
        const cardY = 15;

        const cardGraphics = this.add.graphics();
        cardGraphics.fillStyle(0xffffff, 0.95); // Pure white card
        cardGraphics.lineStyle(2, 0xcbd5e1, 1); // Slate 300 border
        cardGraphics.fillRoundedRect(cardX, cardY, cardW, cardH, 12);
        cardGraphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 12);
        this.listContainer.add(cardGraphics);

        // Starter Pack Image
        const packImg = this.add.image(0, cardY + 70, "starter_pack_frame").setDisplaySize(140, 100);
        this.listContainer.add(packImg);

        // Title
        const titleTxt = this.add.text(0, cardY + 135, "STARTER PACK", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "18px",
            color: "#1e3a8a" // Sleek Navy blue
        }).setOrigin(0.5);
        titleTxt.setStroke("#ffffff", 3);
        this.listContainer.add(titleTxt);

        // Content description
        const desc1 = this.add.text(0, cardY + 160, "100 GOLD • 5 MonstaBall • 5 HealSpell", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.listContainer.add(desc1);

        // Price text
        const priceTxt = this.add.text(0, cardY + 185, "Price: 1.5 TON", {
            fontFamily: "Lilita One, Arial, sans-serif",
            fontSize: "15px",
            color: "#d97706"
        }).setOrigin(0.5);
        priceTxt.setStroke("#ffffff", 3);
        this.listContainer.add(priceTxt);

        // Buy button using btn_blank sprite
        const btnW = 100;
        const btnH = 32;
        const btnX = 0;
        const btnY = cardY + 220;

        const btn = this.add.image(btnX, btnY, "btn_blank").setDisplaySize(btnW, btnH).setInteractive({ useHandCursor: true });
        btn.setTint(0x16a34a); // Green tint
        this.listContainer.add(btn);

        const btnTxt = this.add.text(btnX, btnY, "BUY NOW", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#ffffff"
        }).setOrigin(0.5);
        btnTxt.setStroke("#14532d", 3);
        btnTxt.setShadow(1, 1, "#000000", 1, true, true);
        this.listContainer.add(btnTxt);

        // Micro-interaction hover/down states
        btn.on("pointerover", () => {
            btn.setScale((btnW / btn.width) * 1.05, (btnH / btn.height) * 1.05);
            btnTxt.setScale(1.05);
        });
        btn.on("pointerout", () => {
            btn.setScale(btnW / btn.width, btnH / btn.height);
            btnTxt.setScale(1.0);
        });
        btn.on("pointerdown", () => {
            btn.setScale((btnW / btn.width) * 0.95, (btnH / btn.height) * 0.95);
            btnTxt.setScale(0.95);
        });

        btn.on("pointerup", async () => {
            this.showConfirmPackModal(async () => {
                this.createloadingOverlay();
                try {
                    const res = await api.BuyPack("starter");
                    if (res && res.success) {
                        const balance = res.Balance || res.balance || {};
                        state.user.gold = balance.GOLD !== undefined ? balance.GOLD : (balance.gold !== undefined ? balance.gold : 0);
                        state.user.ton = balance.TON !== undefined ? balance.TON : (balance.ton !== undefined ? balance.ton : 0);
                        state.user.eggs = balance.EGGS !== undefined ? balance.EGGS : (balance.eggs !== undefined ? balance.eggs : 0);
                        this.USER = state.user;
                        this.items = res.Items || res.items || {};

                        this.updateResourceBar();
                        showNotification(this, "Starter Pack purchased successfully!");
                    } else {
                        showNotification(this, res.reason || "Purchase failed");
                    }
                } catch (err) {
                    console.error("Pack purchase failed", err);
                    showNotification(this, "Network error buying pack");
                } finally {
                    this.destroyloadingOverlay();
                }
            });
        });

        this.listHeight = cardY + cardH + 20;
    }

    showConfirmPackModal(onConfirm) {
        const modalContainer = this.add.container(0, 0).setDepth(301);

        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive();
        modalContainer.add(blocker);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        // Draw dialog card - Bright light theme with dark slate outline
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(2.5, 0x0f172a, 1);  // Slate 900
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        modalContainer.add(card);

        // Title
        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 25, "BUY STARTER PACK", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        titleTxt.setStroke("#ffffff", 3);
        modalContainer.add(titleTxt);

        // Pack Image inside Confirm Modal
        const icon = this.add.image(modalX, modalY - 25, "starter_pack_frame").setDisplaySize(90, 64);
        modalContainer.add(icon);

        // Price Tag
        const priceTxt = this.add.text(modalX, modalY + 32, "Cost: 1.5 TON", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "14px",
            color: "#d97706"
        }).setOrigin(0.5);
        priceTxt.setStroke("#ffffff", 3);
        modalContainer.add(priceTxt);

        // Cancel Button using btn_blank tinted dark slate
        const btnCancel = this.add.image(modalX - 55, modalY + 75, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnCancel.setTint(0x475569);
        modalContainer.add(btnCancel);

        const cancelTxt = this.add.text(modalX - 55, modalY + 75, "CANCEL", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelTxt.setStroke("#334155", 2);
        modalContainer.add(cancelTxt);

        btnCancel.on("pointerup", () => {
            modalContainer.destroy();
        });

        // Confirm Button using btn_blank tinted green
        const btnConfirm = this.add.image(modalX + 55, modalY + 75, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnConfirm.setTint(0x16a34a);
        modalContainer.add(btnConfirm);

        const confirmTxt = this.add.text(modalX + 55, modalY + 75, "CONFIRM", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmTxt.setStroke("#14532d", 2);
        modalContainer.add(confirmTxt);

        btnConfirm.on("pointerup", () => {
            modalContainer.destroy();
            onConfirm();
        });
    }

    renderItemsTab() {
        let currentY = 10;
        const cardW = 320;
        const cardH = 74;
        const cardX = -cardW / 2;

        const itemsKeys = Object.keys(this.shopItems);

        if (itemsKeys.length === 0) {
            const noItemsTxt = this.add.text(0, 80, "NO ITEMS AVAILABLE", {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "18px",
                color: "#64748b"
            }).setOrigin(0.5);
            noItemsTxt.setStroke("#ffffff", 3);
            this.listContainer.add(noItemsTxt);
            this.listHeight = 150;
            return;
        }

        const itemInfo = {
            HealSpell: { name: "HEAL SPELL", desc: "RESTORES MONSTER HP IN BATTLE", icon: "item_healSpell" },
            MonstaBall: { name: "MONSTA BALL", desc: "USED TO CATCH WILD MONSTERS", icon: "item_monstaBall" },
            RagePotion: { name: "RAGE POTION", desc: "TEMPORARILY BOOSTS ATTACK POWER", icon: "item_ragePotion" },
            DarkSpell: { name: "DARK SPELL", desc: "CASTS DARK TYPE ENERGY BLAST", icon: "item_darkSpell" },
            AvalancheSpell: { name: "AVALANCHE", desc: "SUMMONS A RAGING ICE STORM", icon: "item_avalancheSpell" },
            WindSpell: { name: "WIND SPELL", desc: "HURLS A DESTRUCTIVE TORNADO", icon: "item_windSpell" },
            WaterFallSpell: { name: "WATER FALL", desc: "DRENCHES FOE IN PRESSURED WATER", icon: "item_waterFallSpell" },
            LavaSpell: { name: "LAVA SPELL", desc: "INCINERATES WITH FIERY LAVA", icon: "item_lavaSpell" },
            ThunderSpell: { name: "THUNDER", desc: "STRIKES ENEMY WITH LIGHTNING", icon: "item_thunderSpell" },
            Shield: { name: "SHIELD", desc: "BLOCKS ENEMY DAMAGE FOR 1 TURN", icon: "item_shield" },
            Poison: { name: "POISON", desc: "INFLICTS DAMAGE OVER TIME", icon: "item_hallucinogen" },
            Hallucinogen: { name: "HALLUCINOGEN", desc: "CONFUSES THE FOE", icon: "item_hallucinogen" }
        };

        const getItemDetails = (key) => {
            const matchedKey = Object.keys(itemInfo).find(k => k.toLowerCase() === key.toLowerCase());
            return matchedKey ? itemInfo[matchedKey] : { name: key.toUpperCase(), desc: "SPECIAL GAMEPLAY ITEM", icon: "item_monstaBall" };
        };

        itemsKeys.forEach((key) => {
            const itemData = this.shopItems[key];
            const details = getItemDetails(key);

            const cardGraphics = this.add.graphics();
            cardGraphics.fillStyle(0xffffff, 0.95); // White card
            cardGraphics.lineStyle(1.5, 0xe2e8f0, 1); // Soft grey border
            cardGraphics.fillRoundedRect(cardX, currentY, cardW, cardH, 10);
            cardGraphics.strokeRoundedRect(cardX, currentY, cardW, cardH, 10);
            this.listContainer.add(cardGraphics);

            // Icon
            const icon = this.add.image(cardX + 26, currentY + cardH / 2, details.icon).setDisplaySize(40, 40);
            this.listContainer.add(icon);

            // Name
            const nameTxt = this.add.text(cardX + 54, currentY + 12, details.name, {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "14px",
                color: "#0f172a"
            });
            nameTxt.setStroke("#ffffff", 3);
            nameTxt.setShadow(1, 1, "#cbd5e1", 0, true, true);
            this.listContainer.add(nameTxt);

            // Desc
            const descTxt = this.add.text(cardX + 54, currentY + 30, details.desc, {
                fontFamily: "Nunito, Arial, sans-serif",
                fontSize: "9.5px",
                fontWeight: "700",
                color: "#64748b"
            });
            this.listContainer.add(descTxt);

            // Cost
            const costMap = itemData.cost || itemData.PurchaseCost || {};
            const costCurrency = Object.keys(costMap)[0] || "GOLD";
            const costVal = costMap[costCurrency] || 0;

            const currencyIconKey = costCurrency.toLowerCase() === "gold" ? "item_gold" : "item_box_blue";
            const costIcon = this.add.image(cardX + 60, currentY + 54, currencyIconKey).setDisplaySize(14, 14);
            this.listContainer.add(costIcon);

            // Cost text
            const costTxt = this.add.text(cardX + 72, currentY + 48, `${costVal} ${costCurrency}`, {
                fontFamily: "Lilita One, Arial, sans-serif",
                fontSize: "13px",
                color: "#d97706"
            });
            costTxt.setStroke("#ffffff", 3);
            costTxt.setShadow(1, 1, "#fef3c7", 0, true, true);
            this.listContainer.add(costTxt);

            // Buy button using btn_blank sprite
            const btnW = 66;
            const btnH = 26;
            const btnX = cardX + cardW - 45;
            const btnY = currentY + cardH / 2;

            const btn = this.add.image(btnX, btnY, "btn_blank").setDisplaySize(btnW, btnH).setInteractive({ useHandCursor: true });
            btn.setTint(0x16a34a); // Green tint
            this.listContainer.add(btn);

            const btnTxt = this.add.text(btnX, btnY, "BUY", {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "13px",
                color: "#ffffff"
            }).setOrigin(0.5);
            btnTxt.setStroke("#14532d", 3);
            btnTxt.setShadow(1, 1, "#000000", 1, true, true);
            this.listContainer.add(btnTxt);

            // Micro-interaction hover/down states
            btn.on("pointerover", () => {
                btn.setScale((btnW / btn.width) * 1.05, (btnH / btn.height) * 1.05);
                btnTxt.setScale(1.05);
            });
            btn.on("pointerout", () => {
                btn.setScale(btnW / btn.width, btnH / btn.height);
                btnTxt.setScale(1.0);
            });
            btn.on("pointerdown", () => {
                btn.setScale((btnW / btn.width) * 0.95, (btnH / btn.height) * 0.95);
                btnTxt.setScale(0.95);
            });

            btn.on("pointerup", () => {
                this.showQuantityModal(
                    `BUY ${details.name}`,
                    details.icon,
                    costVal,
                    costCurrency,
                    99,
                    async (qty) => {
                        this.createloadingOverlay();
                        try {
                            const res = await api.BuyItem(`buy=${key}=${qty}`, costCurrency);
                            if (res && res.success) {
                                const balance = res.Balance || res.balance || {};
                                state.user.gold = balance.GOLD !== undefined ? balance.GOLD : (balance.gold !== undefined ? balance.gold : 0);
                                state.user.ton = balance.TON !== undefined ? balance.TON : (balance.ton !== undefined ? balance.ton : 0);
                                state.user.eggs = balance.EGGS !== undefined ? balance.EGGS : (balance.eggs !== undefined ? balance.eggs : 0);
                                this.USER = state.user;
                                this.items = res.Items || res.items || {};

                                this.updateResourceBar();
                                showNotification(this, `Purchased ${qty}x ${details.name}!`);
                            } else {
                                showNotification(this, res.reason || "Purchase failed");
                            }
                        } catch (err) {
                            console.error("Purchase failed", err);
                        } finally {
                            this.destroyloadingOverlay();
                        }
                    }
                );
            });

            currentY += cardH + 8;
        });

        this.listHeight = currentY + 10;
    }

    renderExchangeTab() {
        let currentY = 10;
        const cardW = 320;
        const cardH = 74;
        const cardX = -cardW / 2;

        if (this.exchangeRates.length === 0) {
            const noPairsTxt = this.add.text(0, 80, "NO PAIRS AVAILABLE", {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "18px",
                color: "#64748b"
            }).setOrigin(0.5);
            noPairsTxt.setStroke("#ffffff", 3);
            this.listContainer.add(noPairsTxt);
            this.listHeight = 150;
            return;
        }

        const assetInfo = {
            EGGS: { name: "EGGS", icon: "item_eggs" },
            TON: { name: "TON", icon: "item_ton" },
            GOLD: { name: "GOLD", icon: "item_gold" },
            HEALSPELL: { name: "HEAL SPELL", icon: "item_healSpell" },
            MONSTABALL: { name: "MONSTA BALL", icon: "item_monstaBall" }
        };

        const getAssetDetails = (symbol) => {
            const sym = symbol.toUpperCase();
            return assetInfo[sym] || { name: sym, icon: "item_monstaBall" };
        };

        this.exchangeRates.forEach((rateData) => {
            const [fromSymbol, toSymbol] = rateData.pair.split("-");
            const fromAsset = getAssetDetails(fromSymbol);
            const toAsset = getAssetDetails(toSymbol);

            const cardGraphics = this.add.graphics();
            cardGraphics.fillStyle(0xffffff, 0.95);
            cardGraphics.lineStyle(1.5, 0xe2e8f0, 1);
            cardGraphics.fillRoundedRect(cardX, currentY, cardW, cardH, 10);
            cardGraphics.strokeRoundedRect(cardX, currentY, cardW, cardH, 10);
            this.listContainer.add(cardGraphics);

            // From Asset Icon
            const fromIcon = this.add.image(cardX + 22, currentY + 26, fromAsset.icon).setDisplaySize(24, 24);
            this.listContainer.add(fromIcon);

            const fromTxt = this.add.text(cardX + 22, currentY + 44, fromAsset.name, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "10px",
                color: "#334155"
            }).setOrigin(0.5);
            fromTxt.setStroke("#ffffff", 2);
            this.listContainer.add(fromTxt);

            // Arrow symbol ➔
            const arrowTxt = this.add.text(cardX + 60, currentY + 20, "➔", {
                fontFamily: "Arial, sans-serif",
                fontSize: "16px",
                color: "#ea580c"
            }).setOrigin(0.5);
            this.listContainer.add(arrowTxt);

            // To Asset Icon
            const toIcon = this.add.image(cardX + 100, currentY + 26, toAsset.icon).setDisplaySize(24, 24);
            this.listContainer.add(toIcon);

            const toTxt = this.add.text(cardX + 100, currentY + 44, toAsset.name, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "10px",
                color: "#334155"
            }).setOrigin(0.5);
            toTxt.setStroke("#ffffff", 2);
            this.listContainer.add(toTxt);

            // Rate description
            let rateText = "";
            let fromRateVal = 1;
            let toRateVal = 1;

            if (rateData.pair === "EGGS-TON") {
                const parts = rateData.rate.split(":");
                fromRateVal = parseFloat(parts[0]) || 1;
                toRateVal = parseFloat(parts[1]) || 0;
                rateText = `1 EGGS = ${toRateVal.toFixed(4)} TON`;
            } else {
                const parts = rateData.rate.split(":");
                fromRateVal = parseFloat(parts[0]) || 1;
                toRateVal = parseFloat(parts[1]) || 1;
                rateText = `${fromRateVal} ${fromSymbol} = ${toRateVal} ${toSymbol}`;
            }

            const rateLabel = this.add.text(cardX + 144, currentY + 12, "RATE:", {
                fontFamily: "Nunito, sans-serif",
                fontSize: "9px",
                fontWeight: "900",
                color: "#64748b"
            });
            this.listContainer.add(rateLabel);

            const rateTxtElement = this.add.text(cardX + 144, currentY + 24, rateText, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "12px",
                color: "#ea580c"
            });
            rateTxtElement.setStroke("#ffffff", 2.5);
            this.listContainer.add(rateTxtElement);

            if (rateData.limit && rateData.limit !== "nolimit") {
                const limitTxt = this.add.text(cardX + 144, currentY + 42, `LIMIT: ${rateData.limit.toUpperCase()}`, {
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "9px",
                    fontWeight: "800",
                    color: "#ef4444"
                });
                this.listContainer.add(limitTxt);
            }

            // Exchange button using btn_blank sprite
            const btnW = 74;
            const btnH = 26;
            const btnX = cardX + cardW - 48;
            const btnY = currentY + cardH / 2;

            const btn = this.add.image(btnX, btnY, "btn_blank").setDisplaySize(btnW, btnH).setInteractive({ useHandCursor: true });
            btn.setTint(0xea580c); // Orange tint
            this.listContainer.add(btn);

            const btnTxt = this.add.text(btnX, btnY, "TRADE", {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "13px",
                color: "#ffffff"
            }).setOrigin(0.5);
            btnTxt.setStroke("#7c2d12", 3);
            btnTxt.setShadow(1, 1, "#000000", 1, true, true);
            this.listContainer.add(btnTxt);

            // Micro-interaction hover/down states
            btn.on("pointerover", () => {
                btn.setScale((btnW / btn.width) * 1.05, (btnH / btn.height) * 1.05);
                btnTxt.setScale(1.05);
            });
            btn.on("pointerout", () => {
                btn.setScale(btnW / btn.width, btnH / btn.height);
                btnTxt.setScale(1.0);
            });
            btn.on("pointerdown", () => {
                btn.setScale((btnW / btn.width) * 0.95, (btnH / btn.height) * 0.95);
                btnTxt.setScale(0.95);
            });

            btn.on("pointerup", () => {
                let maxTrade = 999;
                let playerBalance = 0;

                const currencyKey = fromSymbol.toLowerCase();
                if (currencyKey === "ton" || currencyKey === "gold" || currencyKey === "eggs") {
                    playerBalance = this.USER[currencyKey] || 0;
                    maxTrade = Math.floor(playerBalance / fromRateVal);
                } else {
                    const itemInvKey = Object.keys(this.items).find(k => k.toLowerCase() === fromSymbol.toLowerCase());
                    playerBalance = itemInvKey ? this.items[itemInvKey] : 0;
                    maxTrade = Math.floor(playerBalance / fromRateVal);
                }

                if (maxTrade <= 0) {
                    showNotification(this, "Insufficient balance to trade!");
                    return;
                }

                this.showExchangeModal(
                    `EXCHANGE ${fromSymbol}`,
                    fromAsset.icon,
                    toAsset.icon,
                    fromRateVal,
                    toRateVal,
                    fromSymbol,
                    toSymbol,
                    maxTrade,
                    async (qty) => {
                        this.createloadingOverlay();
                        try {
                            const res = await api.Exchange(fromSymbol, toSymbol, qty * fromRateVal);
                            if (res && res.success) {
                                const balance = res.Balance || res.balance || {};
                                state.user.gold = balance.GOLD !== undefined ? balance.GOLD : (balance.gold !== undefined ? balance.gold : 0);
                                state.user.ton = balance.TON !== undefined ? balance.TON : (balance.ton !== undefined ? balance.ton : 0);
                                state.user.eggs = balance.EGGS !== undefined ? balance.EGGS : (balance.eggs !== undefined ? balance.eggs : 0);
                                this.USER = state.user;
                                this.items = res.Items || res.items || {};

                                this.updateResourceBar();
                                showNotification(this, "Exchange successful!");
                                this.renderActiveTab();
                            } else {
                                showNotification(this, res.reason || "Exchange failed");
                            }
                        } catch (err) {
                            console.error("Exchange failed", err);
                        } finally {
                            this.destroyloadingOverlay();
                        }
                    }
                );
            });

            currentY += cardH + 8;
        });

        this.listHeight = currentY + 10;
    }

    showQuantityModal(title, iconKey, unitCost, currency, maxVal, onConfirm) {
        const modalContainer = this.add.container(0, 0).setDepth(301);

        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive();
        modalContainer.add(blocker);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        // Draw dialog card - Bright light theme with dark slate outline
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(2.5, 0x0f172a, 1);  // Slate 900
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        modalContainer.add(card);

        // Title
        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 20, title, {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        titleTxt.setStroke("#ffffff", 3);
        modalContainer.add(titleTxt);

        // Icon
        const icon = this.add.image(modalX, modalY - 45, iconKey).setDisplaySize(42, 42);
        modalContainer.add(icon);

        let qty = 1;

        // Minus Button using btn_blank tinted red
        const btnMinus = this.add.image(modalX - 50, modalY + 20, "btn_blank").setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
        btnMinus.setTint(0xef4444);
        modalContainer.add(btnMinus);
        
        // Plus Button using btn_blank tinted green
        const btnPlus = this.add.image(modalX + 50, modalY + 20, "btn_blank").setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
        btnPlus.setTint(0x22c55e);
        modalContainer.add(btnPlus);

        // Normal text signs for minus, plus, and counter
        const minusText = this.add.text(modalX - 50, modalY + 20, "-", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        modalContainer.add(minusText);

        const plusText = this.add.text(modalX + 50, modalY + 20, "+", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        modalContainer.add(plusText);

        const qtyBg = this.add.graphics();
        qtyBg.fillStyle(0xffffff, 1);
        qtyBg.lineStyle(1, 0xcbd5e1, 1);
        qtyBg.fillRoundedRect(modalX - 22, modalY + 5, 44, 30, 4);
        qtyBg.strokeRoundedRect(modalX - 22, modalY + 5, 44, 30, 4);
        modalContainer.add(qtyBg);

        const qtyText = this.add.text(modalX, modalY + 20, qty, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "18px",
            color: "#0f172a"
        }).setOrigin(0.5);
        modalContainer.add(qtyText);

        const totalTxt = this.add.text(modalX, modalY + 52, "", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#d97706"
        }).setOrigin(0.5);
        totalTxt.setStroke("#ffffff", 3);
        modalContainer.add(totalTxt);

        const updateTotalText = () => {
            const total = qty * unitCost;
            totalTxt.setText(`TOTAL: ${total} ${currency}`);
        };

        updateTotalText();

        btnMinus.on("pointerup", () => {
            if (qty > 1) {
                qty--;
                qtyText.setText(qty);
                updateTotalText();
            }
        });

        btnPlus.on("pointerup", () => {
            if (qty < maxVal) {
                qty++;
                qtyText.setText(qty);
                updateTotalText();
            }
        });

        // Cancel Button using btn_blank tinted dark slate
        const btnCancel = this.add.image(modalX - 55, modalY + 88, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnCancel.setTint(0x475569);
        modalContainer.add(btnCancel);

        const cancelTxt = this.add.text(modalX - 55, modalY + 88, "CANCEL", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelTxt.setStroke("#334155", 2);
        modalContainer.add(cancelTxt);

        btnCancel.on("pointerup", () => {
            modalContainer.destroy();
        });

        // Confirm Button using btn_blank tinted green
        const btnConfirm = this.add.image(modalX + 55, modalY + 88, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnConfirm.setTint(0x16a34a);
        modalContainer.add(btnConfirm);

        const confirmTxt = this.add.text(modalX + 55, modalY + 88, "CONFIRM", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmTxt.setStroke("#14532d", 2);
        modalContainer.add(confirmTxt);

        btnConfirm.on("pointerup", () => {
            modalContainer.destroy();
            onConfirm(qty);
        });
    }

    showExchangeModal(title, fromIconKey, toIconKey, fromRate, toRate, fromSymbol, toSymbol, maxVal, onConfirm) {
        const modalContainer = this.add.container(0, 0).setDepth(301);

        const blocker = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive();
        modalContainer.add(blocker);

        const modalW = 280;
        const modalH = 220;
        const modalX = this.width / 2;
        const modalY = this.height / 2;

        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(2.5, 0xea580c, 1);  // Orange border
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 12);
        modalContainer.add(card);

        // Title
        const titleTxt = this.add.text(modalX, modalY - modalH / 2 + 20, title, {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "16px",
            color: "#0f172a"
        }).setOrigin(0.5);
        titleTxt.setStroke("#ffffff", 3);
        modalContainer.add(titleTxt);

        // From Icon
        const fromIcon = this.add.image(modalX - 45, modalY - 45, fromIconKey).setDisplaySize(36, 36);
        modalContainer.add(fromIcon);

        // Arrow
        const arrowTxt = this.add.text(modalX, modalY - 45, "➔", {
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            color: "#0f172a"
        }).setOrigin(0.5);
        modalContainer.add(arrowTxt);

        // To Icon
        const toIcon = this.add.image(modalX + 45, modalY - 45, toIconKey).setDisplaySize(36, 36);
        modalContainer.add(toIcon);

        let qty = 1; // Number of "rate parts" being traded

        // Minus Button using btn_blank tinted red
        const btnMinus = this.add.image(modalX - 50, modalY + 20, "btn_blank").setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
        btnMinus.setTint(0xef4444);
        modalContainer.add(btnMinus);

        // Plus Button using btn_blank tinted green
        const btnPlus = this.add.image(modalX + 50, modalY + 20, "btn_blank").setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
        btnPlus.setTint(0x22c55e);
        modalContainer.add(btnPlus);

        // Normal text signs for minus, plus, and counter
        const minusText = this.add.text(modalX - 50, modalY + 20, "-", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        modalContainer.add(minusText);

        const plusText = this.add.text(modalX + 50, modalY + 20, "+", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        modalContainer.add(plusText);

        const qtyBg = this.add.graphics();
        qtyBg.fillStyle(0xffffff, 1);
        qtyBg.lineStyle(1, 0xcbd5e1, 1);
        qtyBg.fillRoundedRect(modalX - 22, modalY + 5, 44, 30, 4);
        qtyBg.strokeRoundedRect(modalX - 22, modalY + 5, 44, 30, 4);
        modalContainer.add(qtyBg);

        const qtyText = this.add.text(modalX, modalY + 20, qty, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "18px",
            color: "#0f172a"
        }).setOrigin(0.5);
        modalContainer.add(qtyText);

        const tradeQtyTxt = this.add.text(modalX, modalY + 52, "", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#64748b"
        }).setOrigin(0.5);
        modalContainer.add(tradeQtyTxt);

        const receiveTxt = this.add.text(modalX, modalY + 68, "", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "13px",
            color: "#d97706"
        }).setOrigin(0.5);
        receiveTxt.setStroke("#ffffff", 3);
        modalContainer.add(receiveTxt);

        const updateExchangeTexts = () => {
            const fromAmt = qty * fromRate;
            const toAmt = qty * toRate;
            const formattedToAmt = toAmt % 1 !== 0 ? toAmt.toFixed(4) : toAmt.toString();

            tradeQtyTxt.setText(`SEND: ${fromAmt} ${fromSymbol}`);
            receiveTxt.setText(`GET: ${formattedToAmt} ${toSymbol}`);
        };

        updateExchangeTexts();

        btnMinus.on("pointerup", () => {
            if (qty > 1) {
                qty--;
                qtyText.setText(qty);
                updateExchangeTexts();
            }
        });

        btnPlus.on("pointerup", () => {
            if (qty < maxVal) {
                qty++;
                qtyText.setText(qty);
                updateExchangeTexts();
            }
        });

        // Cancel Button using btn_blank tinted slate
        const btnCancel = this.add.image(modalX - 55, modalY + 88, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnCancel.setTint(0x475569);
        modalContainer.add(btnCancel);

        const cancelTxt = this.add.text(modalX - 55, modalY + 88, "CANCEL", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        cancelTxt.setStroke("#334155", 2);
        modalContainer.add(cancelTxt);

        btnCancel.on("pointerup", () => {
            modalContainer.destroy();
        });

        // Confirm Button using btn_blank tinted orange
        const btnConfirm = this.add.image(modalX + 55, modalY + 88, "btn_blank").setDisplaySize(90, 28).setInteractive({ useHandCursor: true });
        btnConfirm.setTint(0xea580c);
        modalContainer.add(btnConfirm);

        const confirmTxt = this.add.text(modalX + 55, modalY + 88, "TRADE", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5);
        confirmTxt.setStroke("#7c2d12", 2);
        modalContainer.add(confirmTxt);

        btnConfirm.on("pointerup", () => {
            modalContainer.destroy();
            onConfirm(qty);
        });
    }

    enableListScrolling() {
        this.isDragging = false;
        this.startY = 0;

        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const listMinY = modalY - 585 / 2 + 130;
        const listMaxY = modalY + 585 / 2 - 16;
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
            this.listContainer.y -= deltaY * 0.45;
            const minY = this.viewY - Math.max(0, this.listHeight - this.viewHeight);
            this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, minY, this.viewY);
        });
    }

    formatNumber(num) {
        if (num === undefined || num === null) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        if (num % 1 !== 0) return num.toFixed(2);
        return num.toString();
    }
}
