import { checkClick } from "./game.js";
import * as api from "../webapp/api.js";
import { showNotification, createloadingOverlay, destroyloadingOverlay } from "../utility.js";
import { t } from "../translations.js";
import { state } from "../state.js";

export class ItemScene extends Phaser.Scene {
    constructor() {
        super({ key: "ItemScene" });
    }

    init(data) {
        this.inBattle = data ? data.inBattle : false;
        this.battle = data ? data.battle : null;
    }
    create() {
        this.initializeBg();
        createloadingOverlay(this);
        api.GetItems().then(result => {
            destroyloadingOverlay(this);
            if (result.success) {
                console.log(result);
                this.items = result.items;
                this.updateItems();
            } else {
                showNotification(this, result.reason);
            }
        }).catch(err => {
            destroyloadingOverlay(this);
            showNotification(this, "Connection error.");
        });

        this.battleScene = this.scene.get("BattleScene");

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


    ListItems(listed_item, user, recommended_price) {
        this.activeTab = "items";
        if (this.contentContainer) this.contentContainer.destroy();
        this.contentContainer = this.add.container(0, 0);
        this.contentContainer.setDepth(150);

        // overlay
        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0).setInteractive({ useHandCursor: true });
        this.contentContainer.add(overlay);

        overlay.on("pointerup", () => {
            this.contentContainer.destroy();
        });

        const items_info = this.add.image(0, 485, "info_items_panel").setOrigin(0);

        let formattedKey = listed_item.id.charAt(0).toLowerCase() + listed_item.id.slice(1);
        console.log(formattedKey);
        const itemsImg = this.add.image(0, 0, `market_item_${formattedKey}`);
        itemsImg.setPosition(225, 440 + itemsImg.displayHeight).setOrigin(0, 1);
        const text = this.add.text(225, 565, listed_item.id.toUpperCase(), {
            fontFamily: "Lilita One",
            fontSize: "20px",
            color: "#D5D5D5"
        }).setOrigin(0);

        const level = this.add.text(15, 520, `Lv ${user.level}`, {
            fontFamily: "Lilita One",
            fontSize: "16px",
            color: "#000000ff"
        }).setOrigin(0);

        const username = this.add.text(15, 535, `@${user.username}`, {
            fontFamily: "Lilita One",
            fontSize: "22px",
            color: "#ffffffff"
        }).setOrigin(0);
        username.setStroke("#000000", 1);

        const recommendedPrice = this.add.text(20, 665, "Recommended Price: " + recommended_price.toFixed(1), {
            fontFamily: "Nunito",
            fontSize: "12px",
            color: "#ffffffff"
        }).setOrigin(0);

        const crystalImg = this.add.image(20 + recommendedPrice.width + 2, 665, "item_dust").setOrigin(0);
        crystalImg.setDisplaySize(15, 15);

        this.contentContainer.add([items_info, itemsImg, text, level, username, recommendedPrice, crystalImg]);

        let quantityVal = 1;
        let priceVal = recommended_price;

        const qtyGraphics = this.add.graphics();
        qtyGraphics.fillStyle(0x000000, 0.4);
        qtyGraphics.fillRoundedRect(20, 690, 171.8, 49, 10);

        this.contentContainer.add(qtyGraphics);

        const qtyText = this.add.text(30, 703, `${quantityVal}`, {
            fontFamily: "Lilita One",
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0);
        this.contentContainer.add(qtyText);

        const qtyHit = this.add.rectangle(20, 690, 171.8, 49).setOrigin(0).setInteractive({ useHandCursor: true });
        qtyHit.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.launch("KeyboardScene", {
                type: "numeric",
                value: String(quantityVal),
                placeholder: "Quantity",
                onCommit: (val) => {
                    const parsed = parseInt(val);
                    if (!isNaN(parsed) && parsed > 0) {
                        quantityVal = parsed;
                        qtyText.setText(`${quantityVal}`);
                    }
                }
            });
        });
        this.contentContainer.add(qtyHit);

        const priceGraphics = this.add.graphics();
        priceGraphics.fillStyle(0x000000, 0.4);
        priceGraphics.fillRoundedRect(205, 690, 171.8, 49, 10);
        this.contentContainer.add(priceGraphics);

        const priceText = this.add.text(215, 703, `${priceVal.toFixed(1)}`, {
            fontFamily: "Lilita One",
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0);
        this.contentContainer.add(priceText);

        const priceHit = this.add.rectangle(205, 690, 171.8, 49).setOrigin(0).setInteractive({ useHandCursor: true });
        priceHit.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.launch("KeyboardScene", {
                type: "numeric",
                value: String(priceVal.toFixed(1)),
                placeholder: "Price CRY",
                onCommit: (val) => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed) && parsed > 0) {
                        priceVal = parsed;
                        priceText.setText(`${priceVal.toFixed(1)}`);
                    }
                }
            });
        });
        this.contentContainer.add(priceHit);

        const ListBtn = this.add.image(20, 745, "btn_list_market_crystal").setOrigin(0).setInteractive({ useHandCursor: true });
        ListBtn.on("pointerup", async (pointer) => {
            if (!checkClick(pointer)) return;

            createloadingOverlay(this);
            try {
                const response = await api.listInMarketplace(listed_item.id, "item", priceVal, "CRYSTAL", quantityVal);
                if (response && response.success) {
                    showNotification(this, "Item listed successfully!");
                    state.user = response.user;
                    this.contentContainer.destroy();
                    this.destroyOverlay();
                    this.scene.stop("ItemScene");
                } else {
                    showNotification(this, response?.reason || "Failed to list item");
                }
            } catch (err) {
                console.error(err);
                showNotification(this, "Connection error.");
            } finally {
                destroyloadingOverlay(this);
            }
        });
        this.contentContainer.add(ListBtn);
    }


    updateItems() {
        const validItemKeys = Object.keys(this.items).filter(key => this.items[key] > 0);
        const COLUMN = 5;
        const SLOT_WIDTH = 73.33;
        const SLOT_HEIGHT = 73.33;

        const item_selected_bg = this.add.image(10, 60, "item_selected");
        item_selected_bg.setDisplaySize(item_selected_bg.displayWidth / 1.5, item_selected_bg.displayHeight / 1.5)
            .setOrigin(0)
            .setAlpha(0);

        this.container.add(item_selected_bg);

        const itemInfo = {
            HealSpell: { name: t("heal_spell_name"), desc: t("heal_spell_desc") },
            MonstaBall: { name: t("monsta_ball_name"), desc: t("monsta_ball_desc") },
            RagePotion: { name: t("rage_potion_name"), desc: t("rage_potion_desc") },
            DarkSpell: { name: t("dark_spell_name"), desc: t("dark_spell_desc") },
            AvalancheSpell: { name: t("avalanche_name"), desc: t("avalanche_desc") },
            WindSpell: { name: t("wind_spell_name"), desc: t("wind_spell_desc") },
            WaterFallSpell: { name: t("water_fall_name"), desc: t("water_fall_desc") },
            LavaSpell: { name: t("lava_spell_name"), desc: t("lava_spell_desc") },
            ThunderSpell: { name: t("thunder_name"), desc: t("thunder_desc") },
            Shield: { name: t("shield_name"), desc: t("shield_desc") },
            Poison: { name: t("poison_name"), desc: t("poison_desc") },
            Hallucinogen: { name: t("hallucinogen_name"), desc: t("hallucinogen_desc") }
        };

        const getItemDetails = (k) => {
            const matchedKey = Object.keys(itemInfo).find(x => x.toLowerCase() === k.toLowerCase());
            return matchedKey ? itemInfo[matchedKey] : { name: k.toUpperCase(), desc: "SPECIAL GAMEPLAY ITEM" };
        };

        validItemKeys.forEach((key, index) => {
            const i = Math.floor(index / COLUMN);
            const j = index % COLUMN;
            const quantity = this.items[key];

            let formattedKey = key.charAt(0).toLowerCase() + key.slice(1);
            if (formattedKey === "poison") {
                formattedKey = "hallucinogen";
            }

            console.log(`item_${formattedKey}`);
            const item_img = this.add.image(50 + j * SLOT_WIDTH, 120 + i * SLOT_HEIGHT, `item_${formattedKey}`);
            item_img.setDisplaySize(item_img.displayWidth / 1.5, item_img.displayHeight / 1.5).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
            this.container.add(item_img);

            const qtyText = this.add.text(10 + j * SLOT_WIDTH + SLOT_WIDTH - 8, 60 + i * SLOT_HEIGHT + SLOT_HEIGHT - 6, quantity, {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "12px",
                color: "#ffffff"
            }).setOrigin(1, 1).setDepth(105);
            qtyText.setStroke("#0f172a", 3);
            this.container.add(qtyText);

            item_img.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                item_selected_bg.setAlpha(1);
                item_selected_bg.setPosition(10 + j * SLOT_WIDTH, 60 + i * SLOT_HEIGHT);

                const details = getItemDetails(key);
                if (this.selectedItemName) {
                    this.selectedItemName.setText(details.name);
                }
                if (this.selectedItemDesc) {
                    this.selectedItemDesc.setText(details.desc);
                }

                if (this.inBattle) {
                    if (this.useBtn) {
                        this.useBtn.destroy();
                    }
                    const use_btn = this.add.image(this.bg.displayWidth / 2, 290, "btn_use_items").setInteractive({ useHandCursor: true });
                    this.container.add(use_btn);
                    this.useBtn = use_btn;

                    use_btn.on("pointerdown", () => {
                        this.destroyOverlay();
                        this.battleScene.events.emit("useItem", key);
                        this.scene.stop("ItemScene");
                    });
                } else {
                    if (this.useBtn) {
                        this.useBtn.destroy();
                    }
                    const sell_btn = this.add.image(this.bg.displayWidth / 2, 290, "btn_sell_items").setInteractive({ useHandCursor: true });
                    this.container.add(sell_btn);
                    this.useBtn = sell_btn;

                    sell_btn.on("pointerup", async (p) => {
                        if (!checkClick(p)) return;
                        if (key.toLowerCase() !== "monstaball") {
                            showNotification(this, "Only MonstaBalls can be listed for now.");
                            return;
                        }
                        createloadingOverlay(this);
                        try {
                            const res = await api.recommendMarketplaceItemPrice("MonstaBall");
                            const recommendedPriceVal = res.success ? res.recommendedPrice : 3.0;
                            this.ListItems({ id: key }, state.user, recommendedPriceVal);
                        } catch (err) {
                            console.error(err);
                            showNotification(this, "Connection error.");
                        } finally {
                            destroyloadingOverlay(this);
                        }
                    });
                }
            });
        });
    }

    initializeBg() {
        this.createOverlay();
        const bg = this.add.image(0, 0, "bg_item");
        bg.setDisplaySize(bg.displayWidth / 1.5, bg.displayHeight / 1.7).setOrigin(0);
        this.bg = bg;

        this.container = this.add.container(this.scale.width / 2 - bg.displayWidth / 2, this.scale.height / 2 - bg.displayHeight / 2).setDepth(101);

        const btn_close = this.add.image(bg.displayWidth - 20, 0, "close-button");
        btn_close.setDisplaySize(btn_close.displayWidth / 1.5, btn_close.displayHeight / 1.5).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.container.add([bg, btn_close]);

        const TOTAL_ITEMS = 10;
        const COLUMN = 5;
        const SLOT_WIDTH = 73.33;
        const SLOT_HEIGHT = 73.33;

        const ROW = Math.ceil(TOTAL_ITEMS / COLUMN);

        for (let i = 0; i < ROW; i++) {
            for (let j = 0; j < COLUMN; j++) {
                const item_slot = this.add.image(10 + j * SLOT_WIDTH, 60 + i * SLOT_HEIGHT, "item_slot");
                item_slot.setDisplaySize(item_slot.displayWidth / 1.5, item_slot.displayHeight / 1.5).setOrigin(0);

                this.container.add(item_slot);

            }
        }

        // Add selected item Name and Description text elements
        this.selectedItemName = this.add.text(bg.displayWidth / 2, 215, "", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "14px",
            color: "#f59e0b"
        }).setOrigin(0.5).setDepth(105);
        this.selectedItemName.setStroke("#0f172a", 3);
        this.container.add(this.selectedItemName);

        this.selectedItemDesc = this.add.text(bg.displayWidth / 2, 238, "", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "11px",
            color: "#cbd5e1",
            wordWrap: { width: bg.displayWidth - 40, useAdvancedWrap: true },
            align: "center"
        }).setOrigin(0.5).setDepth(105);
        this.container.add(this.selectedItemDesc);

        btn_close.on("pointerup", () => {
            this.destroyOverlay();
            this.scene.stop("ItemScene");
        });
    }


}