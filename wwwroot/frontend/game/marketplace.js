import { checkClick } from "./game.js";
import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { showNotification, createloadingOverlay, destroyloadingOverlay } from "../utility.js";

export class MarketplaceScene extends Phaser.Scene {
    constructor() {
        super({ key: "MarketplaceScene" })
    }

    create() {
        this.searchQuery = "";
        this.activeTab = "monsters";
        this.initializeBg();
        this.MonstersMarket();
    }

    update(time, delta) {
        if (this.scrollContainer && typeof this.scrollY !== "undefined") {
            const lerpFactor = 0.15;
            this.scrollContainer.y += (this.scrollY - this.scrollContainer.y) * lerpFactor;

            // Dynamically disable input for scroll slots that are out of bounds (masked)
            this.scrollContainer.list.forEach(container => {
                if (container && container.list) {
                    const absY = container.y + this.scrollContainer.y;
                    const slot = container.list[0];
                    if (slot) {
                        const slotHeight = slot.displayHeight || 200;
                        const isVisible = (absY + slotHeight >= 230) && (absY <= this.scale.height - 10);
                        container.list.forEach(child => {
                            if (child.input) {
                                child.input.enabled = isVisible;
                            }
                        });
                    }
                }
            });
        }
    }

    updateSearchDisplay() {
        if (!this.searchBarText) return;
        if (this.searchQuery === "") {
            this.searchBarText.setText("Search...");
            this.searchBarText.setColor("#888888");
            this.searchBarClear.setVisible(false);
        } else {
            this.searchBarText.setText(this.searchQuery);
            this.searchBarText.setColor("#ffffff");
            this.searchBarClear.setVisible(true);
        }
    }

    async triggerSearch() {
        this.pageIndex = 0;
        this.listings = [];
        this.hasMorePages = true;
        this.scrollY = 0;
        if (this.scrollContainer) this.scrollContainer.y = 0;
        const filterType = (this.activeTab === "monsters" || this.activeTab === "items") ? "public" : "my_listings";
        await this.loadNextPage(filterType);
    }

    refreshCurrentTab() {
        if (this.activeTab === "monsters") {
            this.MonstersMarket();
        } else if (this.activeTab === "items") {
            this.ItemsMarket();
        } else if (this.activeTab === "mylistings") {
            this.MyListingsTab();
        }
    }

    initializeBg() {
        const bg = this.add.image(0, 0, "marketplace_bg").setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);

        // Semi-transparent header overlay covering the title area up to the search bar
        const headerOverlay = this.add.rectangle(0, 120, this.scale.width, this.scale.height - 120, 0x000000, 0.6).setOrigin(0);

        const title = this.add.image(90, 30, "marketplace_title").setOrigin(0).setDepth(15);

        // Create Phaser-native Search Bar Container
        this.searchBarContainer = this.add.container(0, 0).setDepth(15);

        // Search Bar Background
        const searchBg = this.add.graphics();
        searchBg.fillStyle(0x000000, 0.75);
        searchBg.lineStyle(2, 0xffffff, 0.5);
        searchBg.fillRoundedRect(16, 130, 230, 46, 12);
        searchBg.strokeRoundedRect(16, 130, 230, 46, 12);
        this.searchBarContainer.add(searchBg);

        // Search text label
        this.searchBarText = this.add.text(28, 143, "Search...", {
            fontFamily: "Lilita One",
            fontSize: "15px",
            color: "#888888"
        });
        this.searchBarContainer.add(this.searchBarText);

        // Clear search "X" button
        this.searchBarClear = this.add.text(225, 143, "X", {
            fontFamily: "Lilita One",
            fontSize: "16px",
            color: "#ff4444"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.searchBarClear.setVisible(false);
        this.searchBarContainer.add(this.searchBarClear);

        // Make the search bar background area interactive to open keyboard
        const searchHitArea = this.add.rectangle(16, 130, 230, 46).setOrigin(0).setInteractive({ useHandCursor: true });
        this.searchBarContainer.add(searchHitArea);

        // Set depth to handle layering properly
        searchHitArea.depth = 1;
        this.searchBarText.depth = 2;
        this.searchBarClear.depth = 3;

        searchHitArea.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;

            this.scene.launch("KeyboardScene", {
                type: "text",
                value: this.searchQuery || "",
                placeholder: "Search...",
                onCommit: (val) => {
                    this.searchQuery = val.trim().toLowerCase();
                    this.updateSearchDisplay();
                    this.triggerSearch();
                }
            });
        });

        this.searchBarClear.on("pointerup", (pointer) => {
            pointer.event.stopPropagation();
            this.searchQuery = "";
            this.updateSearchDisplay();
            this.triggerSearch();
        });

        // Repositioned buttons to prevent overlap with the search bar
        const btnWishlist = this.add.image(260, 130, "icon_wishlist").setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(15);


        const btnFilter = this.add.image(320, 130, "icon_filter").setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(15);

        const MonsterMarket = this.add.image(16, 183, "btn_monsters_market").setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(15);
        const ItemsMarket = this.add.image(139, 183, "btn_items_market").setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(15);
        const MyListings = this.add.image(262, 183, "btn_mylistings").setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(15);

        MonsterMarket.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.MonstersMarket();
        });

        ItemsMarket.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.ItemsMarket();
        });

        MyListings.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.MyListingsTab();
        });

        const btnBack = this.add
            .image(20, 35, "btn-back-map")
            .setDisplaySize(80, 35)
            .setOrigin(0).setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .setDepth(15);

        btnBack.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.stop("MarketplaceScene");
            this.scene.resume("WorldScene");
        });
    }

    async MonstersMarket() {
        this.activeTab = "monsters";
        this.searchQuery = "";
        this.updateSearchDisplay();
        if (this.searchBarContainer) {
            this.searchBarContainer.setVisible(true);
        }
        await this.initializeScrollArea("public");
    }

    async ItemsMarket() {
        this.activeTab = "items";
        this.searchQuery = "";
        this.updateSearchDisplay();
        if (this.searchBarContainer) {
            this.searchBarContainer.setVisible(true);
        }
        await this.initializeScrollArea("public");
    }

    ShowItemInfo(listed_item, isMyListing) {
        if (this.searchBarContainer) this.searchBarContainer.setVisible(false);

        const container = this.add.container(0, 0);
        container.setDepth(100);

        // overlay
        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0).setScrollFactor(0).setInteractive({ useHandCursor: true });
        container.add(overlay);

        overlay.on("pointerup", () => {
            if (this.searchBarContainer) this.searchBarContainer.setVisible(true);
            container.destroy();
        });

        const items_info = this.add.image(0, 485, "info_items_panel").setOrigin(0);

        let formattedItemId = listed_item.itemId.charAt(0).toLowerCase() + listed_item.itemId.slice(1);
        const itemsImg = this.add.image(225, 440, `market_item_${formattedItemId}`);
        const text = this.add.text(225, 565, `${listed_item.itemId.toUpperCase()} x${listed_item.quantity}`, {
            fontFamily: "Lilita One",
            fontSize: "20px",
            color: "#D5D5D5"
        }).setOrigin(0);


        const level = this.add.text(15, 520, `Lv ${listed_item.sellerLevel || 1}`, {
            fontFamily: "Lilita One",
            fontSize: "16px",
            color: "#000000ff"
        }).setOrigin(0);

        const username = this.add.text(15, 535, `@${listed_item.sellerUsername || 'unknown'}`, {
            fontFamily: "Lilita One",
            fontSize: "22px",
            color: "#fefefeff"
        }).setOrigin(0);

        const stockGraphics = this.add.graphics();
        stockGraphics.fillStyle(0x545454, 1);
        stockGraphics.fillRoundedRect(20, 625, 360, 10, 5);

        const currentQty = listed_item.quantity || 0;
        const initialQty = listed_item.initialQuantity || currentQty || 1;
        const ratio = Math.max(0, Math.min(1, currentQty / initialQty));
        const barWidth = 360 * ratio;

        if (barWidth > 0) {
            stockGraphics.fillStyle(0xffffff, 1);
            stockGraphics.fillRoundedRect(20, 625, barWidth, 10, 5);
        }

        const stockText = this.add.text(200, 605, `Available Stock: ${currentQty} / ${initialQty}`, {
            fontFamily: "Lilita One",
            fontSize: "12px",
            color: "#ffffff"
        }).setOrigin(0.5, 0);

        container.add([items_info, itemsImg, text, level, username, stockGraphics, stockText]);

        if (isMyListing) {
            const remove_button = this.add.image(20, 745, "btn_remove").setOrigin(0).setInteractive({ useHandCursor: true });
            remove_button.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                createloadingOverlay(this);
                try {
                    const response = await api.removeMarketplaceListing(listed_item.id);
                    if (response && response.success) {
                        showNotification(this, "Listing successfully removed!");
                        if (this.searchBarContainer) this.searchBarContainer.setVisible(true);
                        container.destroy();
                        this.refreshCurrentTab();
                    } else {
                        showNotification(this, response?.reason || "Failed to remove listing");
                    }
                } catch (err) {
                    console.error(err);
                    showNotification(this, "Connection error.");
                } finally {
                    destroyloadingOverlay(this);
                }
            });
            container.add(remove_button);
        } else {
            const buy_button = this.add.image(20, 745, "btn_crystal_pay").setOrigin(0).setInteractive({ useHandCursor: true });
            const price = this.add.text(180, 755, `${listed_item.price}`, {
                fontFamily: "Lilita One",
                fontSize: "22px",
                color: "#ffffff"
            }).setOrigin(0, 0);

            buy_button.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                this.showBuyConfirmModal(listed_item, async () => {
                    createloadingOverlay(this);
                    try {
                        const response = await api.buyInMarketplace(listed_item.id);
                        if (response && response.success) {
                            showNotification(this, "Purchase successful!");
                            if (this.searchBarContainer) this.searchBarContainer.setVisible(true);
                            container.destroy();
                            this.ItemsMarket();
                        } else {
                            showNotification(this, response?.reason || "Failed to purchase item");
                        }
                    } catch (err) {
                        console.error(err);
                        showNotification(this, "Connection error.");
                    } finally {
                        destroyloadingOverlay(this);
                    }
                });
            });
            container.add([buy_button, price]);
        }
    }



    async MyListingsTab() {
        this.activeTab = "mylistings";
        this.searchQuery = "";
        this.updateSearchDisplay();
        if (this.searchBarContainer) {
            this.searchBarContainer.setVisible(true);
        }
        await this.initializeScrollArea("my_listings");
    }

    async initializeScrollArea(filterType) {
        this.pageIndex = 0;
        this.pageSize = 10;
        this.listings = [];
        this.hasMorePages = true;
        this.isLoadingNextPage = false;
        this.scrollY = 0;
        this.totalContentHeight = 245;

        if (this.contentContainer) this.contentContainer.destroy();
        this.contentContainer = this.add.container(0, 0);

        // Recreate scroll container and mask
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 230, this.scale.width, this.scale.height - 240);
        const mask = maskShape.createGeometryMask();

        this.scrollContainer = this.add.container(0, 0);
        this.scrollContainer.setMask(mask);
        this.contentContainer.add(this.scrollContainer);

        let startY = 0;
        let isDragging = false;

        // Clean up previous event listeners if they exist to avoid duplicate handlers
        if (this.dragDownListener) this.input.off("pointerdown", this.dragDownListener);
        if (this.dragMoveListener) this.input.off("pointermove", this.dragMoveListener);
        if (this.dragUpListener) this.input.off("pointerup", this.dragUpListener);

        this.dragDownListener = (pointer) => {
            if (pointer.y >= 230 && pointer.y <= this.scale.height - 10) {
                startY = pointer.y;
                isDragging = true;
            }
        };

        this.dragMoveListener = (pointer) => {
            if (!isDragging) return;
            const deltaY = pointer.y - startY;
            startY = pointer.y;
            this.scrollY += deltaY;

            const maxScrollY = 0;
            const minScrollY = Math.min(0, (this.scale.height - 240) - this.totalContentHeight);

            if (this.scrollY < minScrollY) this.scrollY = minScrollY;
            if (this.scrollY > maxScrollY) this.scrollY = maxScrollY;

            // Trigger auto next page load when scrolled near bottom
            if (this.scrollY <= minScrollY + 150 && !this.isLoadingNextPage && this.hasMorePages) {
                this.loadNextPage(filterType);
            }
        };

        this.dragUpListener = () => {
            isDragging = false;
        };

        this.input.on("pointerdown", this.dragDownListener);
        this.input.on("pointermove", this.dragMoveListener);
        this.input.on("pointerup", this.dragUpListener);

        await this.loadNextPage(filterType);
    }

    async loadNextPage(filterType) {
        if (this.isLoadingNextPage) return;
        this.isLoadingNextPage = true;

        let loadingTxt;
        if (this.listings.length > 0) {
            loadingTxt = this.add.text(this.scale.width / 2, this.totalContentHeight - 50, "Loading more...", {
                fontFamily: "Lilita One",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0.5);
            this.scrollContainer.add(loadingTxt);
        }
        try {
            let newItems = [];
            if (this.activeTab === "mylistings") {
                const [monstersRes, itemsRes] = await Promise.all([
                    api.getMarketplace("monster", this.pageIndex, this.pageSize, this.searchQuery, filterType),
                    api.getMarketplace("item", this.pageIndex, this.pageSize, this.searchQuery, filterType)
                ]);
                newItems = [...(monstersRes || []), ...(itemsRes || [])];
                this.hasMorePages = (monstersRes && monstersRes.length === this.pageSize) || (itemsRes && itemsRes.length === this.pageSize);
            } else {
                let listingType = "monster";
                if (this.activeTab === "items") {
                    listingType = "item";
                }
                const response = await api.getMarketplace(listingType, this.pageIndex, this.pageSize, this.searchQuery, filterType);
                newItems = response || [];
                this.hasMorePages = newItems.length === this.pageSize;
            }

            if (loadingTxt) loadingTxt.destroy();

            if (newItems.length > 0) {
                this.listings.push(...newItems);
                this.pageIndex++;
            }

            this.renderListings();
        } catch (err) {
            console.error("Failed to load marketplace page:", err);
            if (loadingTxt) loadingTxt.destroy();
        } finally {
            this.isLoadingNextPage = false;
        }
    }

    renderListings() {
        this.scrollContainer.removeAll(true);

        if (this.listings.length === 0) {
            const emptyTxt = this.add.text(200, 350, this.activeTab === "items" ? "No items match your search." : "No monsters match your search.", {
                fontFamily: "Lilita One",
                fontSize: "18px",
                color: "#888888"
            }).setOrigin(0.5);
            this.scrollContainer.add(emptyTxt);
            this.totalContentHeight = 350;
            return;
        }

        let slotx = 16;
        let sloty = 245;

        this.listings.forEach((listed, index) => {
            const isMyListing = this.activeTab === "mylistings" || listed.sellerId === state.user.id;

            if (this.activeTab === "items" || (this.activeTab === "mylistings" && listed.listingType === "item")) {
                const itemContainer = this.add.container(slotx, sloty);

                const slot = this.add.image(0, 0, "slot_items").setOrigin(0).setInteractive({ useHandCursor: true });

                let formattedItemId = listed.itemId.charAt(0).toLowerCase() + listed.itemId.slice(1);
                const itemImg = this.add.image(slot.x + 90, slot.y + 140, `market_item_${formattedItemId}`).setOrigin(0.5, 1);
                // itemImg.setDisplaySize(itemImg.displayWidth , itemImg.displayHeight );

                const itemTitle = this.add.text(slot.x + 40, slot.y + 146, `${listed.itemId.toUpperCase()}`, {
                    fontFamily: "Lilita One",
                    fontSize: "16px",
                    color: "#ffffffff"
                });
                itemTitle.setStroke("#000000", 1);

                const quantity = this.add.text(slot.x + slot.displayWidth - 18, slot.y + 138, `${listed.quantity}`, {
                    fontFamily: "Lilita One",
                    fontSize: "14px",
                    color: "#ffffffff"
                });
                quantity.setStroke("#000000", 1);

                const priceTag = this.add.image(slot.x + 15, slot.y + 195, "btn_crystal_buy").setOrigin(0).setInteractive({ useHandCursor: true });

                const price = this.add.text(priceTag.x + 75, priceTag.y + 8, `${listed.price}`, {
                    fontFamily: "Nunito",
                    fontSize: "14px",
                    color: "#ffffff"
                });
                price.setStroke("#000000", 1);

                itemContainer.add([slot, itemImg, itemTitle, priceTag, price, quantity]);
                this.scrollContainer.add(itemContainer);

                slot.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    if (pointer.y < 230 || pointer.y > this.scale.height - 10) return;
                    this.ShowItemInfo(listed, isMyListing);
                });

                priceTag.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    if (pointer.y < 230 || pointer.y > this.scale.height - 10) return;
                    this.ShowItemInfo(listed, isMyListing);
                });

                slotx += slot.displayWidth + 14;
                if ((index + 1) % 2 === 0) {
                    slotx = 16;
                    sloty += slot.displayHeight + 16;
                }
            } else {
                const monster = listed.monster;
                if (!monster) return;

                const monsterContainer = this.add.container(slotx, sloty);

                const slot = this.add.image(0, 0, `slot_${monster.rarity.toLowerCase()}_market`).setOrigin(0).setInteractive({ useHandCursor: true });

                const monsterImg = this.add.image(slot.x + 80, slot.y + 145, `front_${monster.id}`).setOrigin(0.5, 1);
                monsterImg.setDisplaySize(monsterImg.displayWidth / 2.1, monsterImg.displayHeight / 2.1);




                const monsterTitle = this.add.text(slot.x + 50, slot.y + 148, monster.title, {
                    fontFamily: "Lilita One",
                    fontSize: "18px",
                    color: "#fffbfbff"
                });
                monsterTitle.setStroke("#000000", 1);


                const priceTag = this.add.image(slot.x + 15, slot.y + 195, "btn_ton_pricetag").setOrigin(0).setInteractive({ useHandCursor: true });

                const price = this.add.text(priceTag.x + 65, priceTag.y + 8, `${listed.price}`, {
                    fontFamily: "Nunito",
                    fontSize: "14px",
                    color: "#ffffff"
                });
                price.setStroke("#000000", 1);

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

                const goldIcon = this.add.image(priceTag.x + 10, priceTag.y - 20, "item_gold").setOrigin(0);
                goldIcon.setDisplaySize(18, 18);

                const goldRateText = this.add.text(goldIcon.x + goldIcon.displayWidth + 2, goldIcon.y, `${goldRateVal.toFixed(1).replace(/\.0$/, "")}`, {
                    fontFamily: "Nunito",
                    fontSize: "14px",
                    color: "#ffffff"
                }).setOrigin(0);

                const crystalIcon = this.add.image(priceTag.x + 80, priceTag.y - 20, "item_crystal").setOrigin(0);
                crystalIcon.setDisplaySize(18, 18);
                const crystalRateText = this.add.text(crystalIcon.x + crystalIcon.displayWidth + 2, crystalIcon.y, `${crystalRateVal.toFixed(1).replace(/\.0$/, "")}`, {
                    fontFamily: "Nunito",
                    fontSize: "14px",
                    color: "#ffffff"
                }).setOrigin(0);

                const symbolElement = this.add.image(slot.x + slot.displayWidth - 55, slot.y + 4, `symbol_${monster.element}`).setOrigin(0);

                monsterContainer.add([slot, monsterImg, monsterTitle, priceTag, price, goldIcon, goldRateText, crystalIcon, crystalRateText, symbolElement]);
                this.scrollContainer.add(monsterContainer);

                slot.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    if (pointer.y < 230 || pointer.y > this.scale.height - 10) return;
                    this.MonsterPreview(listed, isMyListing);
                });

                priceTag.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    if (pointer.y < 230 || pointer.y > this.scale.height - 10) return;
                    this.MonsterPreview(listed, isMyListing);
                });

                slotx += slot.displayWidth + 14;
                if ((index + 1) % 2 === 0) {
                    slotx = 16;
                    sloty += slot.displayHeight + 16;
                }
            }
        });

        this.totalContentHeight = sloty + 200;
    }

    MonsterPreview(listed, isMyListing) {
        const monster = listed.monster;
        const container = this.add.container(0, 0);
        container.setDepth(100);

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0);
        overlay.setInteractive();

        overlay.on("pointerup", () => {
            if (this.searchBarContainer && this.activeTab !== "items") this.searchBarContainer.setVisible(true);
            container.destroy();
        });

        const info_panel = this.add.image(0, 410, `info_${monster.rarity.toLowerCase()}_panel`).setOrigin(0);

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

        if (isMyListing) {
            const remove_button = this.add.image(20, 742, "btn_remove").setOrigin(0).setInteractive({ useHandCursor: true });
            remove_button.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                createloadingOverlay(this);
                try {
                    const response = await api.removeMarketplaceListing(listed.id);
                    if (response && response.success) {
                        showNotification(this, "Listing successfully removed!");
                        if (this.searchBarContainer && this.activeTab !== "items") this.searchBarContainer.setVisible(true);
                        container.destroy();
                        this.refreshCurrentTab();
                    } else {
                        showNotification(this, response?.reason || "Failed to remove listing");
                    }
                } catch (err) {
                    console.error(err);
                    showNotification(this, "Connection error.");
                } finally {
                    destroyloadingOverlay(this);
                }
            });
            container.add(remove_button);
        } else {
            const btnWishlist = this.add.image(20, 683, "btn_wishlist").setOrigin(0).setInteractive({ useHandCursor: true });
            btnWishlist.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                showNotification(this, "This feature will be available soon!");
            });

            const buy_button = this.add.image(20, 742, "btn_ton_pay").setOrigin(0).setInteractive({ useHandCursor: true });
            const price = this.add.text(buy_button.x + buy_button.displayWidth / 2 - 20, buy_button.y + 10, `${listed.price}`, {
                fontFamily: "Lilita One",
                fontSize: "18px",
                color: "#ffffff"
            }).setOrigin(0);
            price.setStroke("#000000", 2);

            buy_button.on("pointerup", async (pointer) => {
                if (!checkClick(pointer)) return;
                this.showBuyConfirmModal(listed, async () => {
                    createloadingOverlay(this);
                    try {
                        const response = await api.buyInMarketplace(listed.id);
                        if (response && response.success) {
                            showNotification(this, "Purchase successful!");
                            if (this.searchBarContainer && this.activeTab !== "items") this.searchBarContainer.setVisible(true);
                            container.destroy();
                            this.MonstersMarket();
                        } else {
                            showNotification(this, response?.reason || "Failed to purchase monster");
                        }
                    } catch (err) {
                        console.error(err);
                        showNotification(this, "Connection error.");
                    } finally {
                        destroyloadingOverlay(this);
                    }
                });
            });
            container.add([btnWishlist, buy_button, price]);
        }
    }

    showBuyConfirmModal(listed, onConfirm) {
        const isItem = listed.listingType === "item";
        const title = isItem ? listed.itemId : (listed.monster ? listed.monster.title : "Unknown");
        const currency = isItem ? "CRYSTAL" : "TON";

        const blocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setOrigin(0)
            .setInteractive()
            .setDepth(200);

        const modalContainer = this.add.container(0, 0).setDepth(250);

        const modalW = 280;
        const modalH = 200;
        const modalX = this.scale.width / 2;
        const modalY = this.scale.height / 2;

        const card = this.add.graphics();
        // Shadow
        card.fillStyle(0x000000, 0.35);
        card.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);
        // Modal body
        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        // Border
        card.lineStyle(2, 0x5a4b96);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        modalContainer.add(card);

        const titleText = this.add.text(modalX, modalY - 50, "CONFIRM PURCHASE", {
            fontFamily: "Lilita One",
            fontSize: "18px",
            color: "#ffd700"
        }).setOrigin(0.5);

        const descText = this.add.text(modalX, modalY - 5, `Buy ${title}\nfor ${listed.price} ${currency}?`, {
            fontFamily: "Lilita One",
            fontSize: "15px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        modalContainer.add([titleText, descText]);

        // Yes Button using existing btn_ok
        const yesBtn = this.add.image(modalX - 60, modalY + 50, "btn_ok").setOrigin(0.5).setInteractive({ useHandCursor: true });
        yesBtn.setDisplaySize(90, 36);
        yesBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
            onConfirm();
        });

        // No Button using existing btn_cancel
        const noBtn = this.add.image(modalX + 60, modalY + 50, "btn_cancel").setOrigin(0.5).setInteractive({ useHandCursor: true });
        noBtn.setDisplaySize(90, 36);
        noBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            blocker.destroy();
            modalContainer.destroy();
        });

        modalContainer.add([yesBtn, noBtn]);
    }
}