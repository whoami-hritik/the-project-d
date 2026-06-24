import * as api from "../webapp/api.js";
import { showNotification } from "../utility.js";
import { t } from "../translations.js";

export class ItemScene extends Phaser.Scene {
    constructor() {
        super({ key: "ItemScene" });
    }

    init(data) {
        this.inBattle = data.inBattle;
        this.battle = data.battle;
    }
    create() {
        this.initializeBg();
        api.GetItems().then(result => {
            if (result.success) {
                console.log(result);
                this.items = result.items;
                this.updateItems();
            } else {
                showNotification(this, result.reason);
            }
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

            // Add Quantity text in the bottom right of the slot with Lilita One font
            const qtyText = this.add.text(10 + j * SLOT_WIDTH + SLOT_WIDTH - 8, 60 + i * SLOT_HEIGHT + SLOT_HEIGHT - 6, quantity, {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "12px",
                color: "#ffffff"
            }).setOrigin(1, 1).setDepth(105);
            qtyText.setStroke("#0f172a", 3);
            this.container.add(qtyText);

            item_img.on("pointerup", () => {
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
                    const use_btn = this.add.image(0, 0, "btn_use");
                    use_btn.setDisplaySize(use_btn.displayWidth / 2, use_btn.displayHeight / 2)
                        .setOrigin(0).setInteractive({ useHandCursor: true });
                    use_btn.setPosition(this.bg.displayWidth / 2 - use_btn.displayWidth / 2, 265);
                    this.container.add(use_btn);
                    this.useBtn = use_btn;

                    use_btn.on("pointerdown", () => {
                        this.destroyOverlay();
                        this.battleScene.events.emit("useItem", key);
                        this.scene.stop("ItemScene");
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