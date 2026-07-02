import { WorldScene } from "./game.js";
import { checkClick } from "./game.js";
import * as utility from "../utility.js";
import * as api from "../webapp/api.js";

const MAPS = [
    {
        name: "collector",
        backgrounds: ["collector-bg-1", "collector-bg-2"],
        spawnPoint: { x: 40, y: 277 }
    }
]

const locations = {
    "collector": [
        { name: "A", x: 40, y: 277, collector: false },
        { name: "B", x: 151, y: 286, collector: false },
        { name: "C", x: 253, y: 257, collector: true, collectorRarity: "rare", info: { x: 210, y: 197, text: "I am Lily, a lover of rare monsters.\nIf you find any rare monsters, rent them to me.\nIn return, I'll pay you rewards regularly." }, avatar: "lily" },
        { name: "D", x: 350, y: 217, collector: false },
        { name: "E", x: 475, y: 214, collector: true, collectorRarity: "common", info: { x: 500, y: 157, text: "I'm Jenni, the keeper of common monsters.\nEveryone ignores them, but I treasure them.\nRent them to me and I'll reward you regularly." }, avatar: "jenni" },
        { name: "F", x: 525, y: 277, collector: false },
        { name: "G", x: 461, y: 342, collector: false },
        { name: "H", x: 267, y: 342, collector: false },
        { name: "I", x: 138, y: 404, collector: true, collectorRarity: "epic", info: { x: 65, y: 380, text: "I'm Fang. Only Epic monsters catch my eye.\nStrength is all that matters.\nRent them to me and earn great rewards." }, avatar: "fang" },
        { name: "J", x: 151, y: 522, collector: false },
        { name: "K", x: 253, y: 549, collector: false },
        { name: "L", x: 411, y: 549, collector: false },
        { name: "M", x: 411, y: 494, collector: true, collectorRarity: "legendary", info: { x: 403, y: 424, text: "I'm Nora. I seek only Legendary monsters.\nNothing else compares to their greatness.\nRent them to me for the highest rewards." }, avatar: "nora" }
    ],
}

const graph = {
    "A": ['B'],
    'B': ['A', 'C'],
    'C': ['B', 'D'],
    'D': ['C', 'E'],
    'E': ['D', 'F'],
    'F': ['E', 'G'],
    'G': ['F', 'H'],
    'H': ['G', 'I'],
    'I': ['H', 'J'],
    'J': ['I', 'K'],
    'K': ['J', 'L'],
    'L': ['K', 'M'],
    'M': ['L']
}

const rarityMap = {
    lily: "rare",
    jenni: "common",
    fang: "epic",
    nora: "legendary"
};

export class CollectorScene extends Phaser.Scene {
    constructor() {
        super({ key: "CollectorScene" });
    }

    create() {
        this.initializeBg();
    }

    initializeBg() {
        const mapConfig = MAPS.find(m => m.name === this.world) ?? MAPS[0];
        const bgKeys = mapConfig.backgrounds;

        this.edgePadding = 40;

        this.panels = bgKeys.map((key, i) => {
            const img = this.add.image(0, 0, key).setOrigin(0);
            const scale = this.scale.height / img.height;
            img.setScale(scale);
            img.displayWidth = Math.round(img.displayWidth);
            return img;
        });

        let currentX = 0;
        this.panels.forEach((img) => {
            img.x = currentX;
            currentX += img.displayWidth;
        });

        const totalWidth = currentX;
        this.minScroll = 0;
        this.maxScroll = Math.max(0, totalWidth - this.scale.width);
        this.cameras.main.setBounds(0, 0, totalWidth, this.scale.height);

        this.dragStartX = 0;
        this.startScrollX = 0;

        this.input.on('pointerdown', (pointer) => {
            this.dragStartX = pointer.x;
            this.startScrollX = this.cameras.main.scrollX;
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            let dx = pointer.x - this.dragStartX;
            let newScroll = this.startScrollX - dx;
            newScroll = Phaser.Math.Clamp(newScroll, this.minScroll, this.maxScroll);
            this.cameras.main.scrollX = Math.round(newScroll);
        });

        const player = this.add.image(MAPS[0].spawnPoint.x, MAPS[0].spawnPoint.y, "player").setDepth(5).setOrigin(0, 0.5);
        player.setDisplaySize(player.displayWidth / 1.5, player.displayHeight / 1.5);
        player.position = "A";

        locations["collector"].forEach((l, i) => {
            const node = this.add.image(l.x, l.y, "node").setOrigin(0).setInteractive({ useHandCursor: true });
            node.setDisplaySize(node.displayWidth / 2, node.displayHeight / 2);

            if (l.collector) {
                const avatar = this.add.image(l.x + node.displayWidth, l.y, l.avatar + "_avatar").setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
                avatar.setDisplaySize(avatar.displayWidth / 1.5, avatar.displayHeight / 1.5);

                const info = this.add.image(l.info.x, l.info.y, "marker_info").setOrigin(0).setInteractive({ useHandCursor: true });
                info.setDisplaySize(info.displayWidth / 2, info.displayHeight / 2);

                info.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;

                    showAvtarInfo(this, l.avatar, l.info.text);

                });
            }

            node.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                const path = pathCalculator(player.position, l.name, graph);
                if (path == null) return;

                this.tweens.killTweensOf(player);

                if (path.length > 0 && path[0] === player.position) {
                    path.shift();
                }

                const moveNext = (index) => {
                    if (index >= path.length) return;
                    const nodeName = path[index];
                    const g = locations["collector"].find(x => x.name == nodeName);

                    this.tweens.add({
                        targets: player,
                        x: g.x,
                        y: g.y,
                        duration: 400,
                        ease: 'Linear',
                        onComplete: () => {
                            player.position = g.name;
                            moveNext(index + 1);

                            if (player.position == l.name && l.collector) {
                                // showAvtarInfo(this, l.avatar, l.info.text);
                                showCollectorPanel(this, l.collectorRarity);
                            }
                        }
                    });
                };
                moveNext(0);
            });
        });

        const title = this.add.image(110, 30, "collector_title").setOrigin(0);

        const btnBack = this.add
            .image(20, 35, "btn-back-map")
            .setDisplaySize(80, 35)
            .setOrigin(0).setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        btnBack.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.stop("CollectorScene");
            this.scene.resume("WorldScene");
        });

        this.input.on('pointerup', (pointer) => {
            let dx = pointer.x - this.dragStartX;
            let finalScroll = this.startScrollX - dx;
            finalScroll = Phaser.Math.Clamp(finalScroll, this.minScroll, this.maxScroll);

            let closestPanelIndex = 0;
            let minDiff = Infinity;
            this.panels.forEach((img, i) => {
                let diff = Math.abs(img.x - finalScroll);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPanelIndex = i;
                }
            });

            const snappedScroll = Phaser.Math.Clamp(this.panels[closestPanelIndex].x, this.minScroll, this.maxScroll);
            this.tweens.add({
                targets: this.cameras.main,
                scrollX: snappedScroll,
                duration: 300,
                ease: 'Power2'
            });
        });
    }
}

function pathCalculator(starting, target, graph) {
    let queue = [[starting]]
    let visited = new Set();
    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];
        if (node === target) return path;
        if (!visited.has(node)) {
            visited.add(node);
            let neighbour = graph[node];
            for (let i = 0; i < neighbour.length; i++) {
                queue.push([...path, neighbour[i]]);
            }
        }
    }
    return null;
}

function showAvtarInfo(scene, character, dialouge) {
    utility.createOverlay(scene);

    const avatarImg = scene.add.image(20, 800, character).setOrigin(0, 1).setScrollFactor(0);
    avatarImg.setDisplaySize(avatarImg.displayWidth / 1.5, avatarImg.displayHeight / 1.5);

    const speechInfo = scene.add.image(avatarImg.x + 30, avatarImg.y - avatarImg.displayHeight - 50, "speech_bubble").setOrigin(0).setScrollFactor(0);
    speechInfo.setDisplaySize(speechInfo.displayWidth / 1.8, speechInfo.displayHeight / 1.8);

    const close = scene.add.image(speechInfo.x + speechInfo.displayWidth - 10, speechInfo.y + 20, "close-button").setOrigin(1).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.setDisplaySize(close.displayWidth / 2.5, close.displayHeight / 2.5);

    const speech = scene.add.text(speechInfo.x + 20, speechInfo.y + 15, dialouge, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "12px",
        fontWeight: "800",
        color: "#000000",
    }).setScrollFactor(0);


    const info_container = scene.add.container(0, 0);
    info_container.add([avatarImg, speechInfo, speech, close]);
    info_container.setDepth(200).setScrollFactor(0);

    close.on("pointerup", (pointer) => {
        if (!checkClick(pointer)) return;
        info_container.destroy();
        utility.destroyOverlay(scene);
    });
}

function showCollectorPanel(scene, rarity) {
    const collectorContainer = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);
    const bg = scene.add.image(0, 0, "collector_panel").setOrigin(0).setScrollFactor(0);
    bg.setDisplaySize(scene.scale.width, scene.scale.height);


    const btnBack = scene.add
        .image(20, 35, "btn-back-map")
        .setDisplaySize(80, 35)
        .setOrigin(0).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

    btnBack.on("pointerup", (pointer) => {
        if (!checkClick(pointer)) return;
        collectorContainer.destroy();
    });

    const species_info = scene.add.image(22, 110, "species_info").setOrigin(0).setScrollFactor(0);

    const btnClaimAll = scene.add.image(0, 0, "btn_claimall").setOrigin(0.5).setScrollFactor(0);
    btnClaimAll.setPosition(scene.scale.width / 2, 235);
    btnClaimAll.setInteractive({ useHandCursor: true });

    const rotationTimerText = scene.add.text(scene.scale.width - 30, species_info.y + 10, "Rotation: --", {
        fontFamily: "Lilita One",
        fontSize: "14px",
        color: "#facc15",
    }).setOrigin(1, 0.5).setScrollFactor(0);
    rotationTimerText.setStroke("#000000", 3);


    collectorContainer.add([bg, btnBack, species_info, btnClaimAll, rotationTimerText]);

    let slotsContainer = scene.add.container(0, 0);
    collectorContainer.add(slotsContainer);

    let activeTimers = [];

    function formatTime(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }

    function formatRotationTime(totalSeconds) {
        if (totalSeconds <= 0) return "00:00:00";
        const days = Math.floor(totalSeconds / 86400);
        const hrs = Math.floor((totalSeconds % 86400) / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        const pad = (num) => String(num).padStart(2, '0');
        if (days > 0) {
            return `${days}d ${pad(hrs)}h ${pad(mins)}m`;
        }
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }

    function getSlotCosts(rarity, totalSlots) {
        const r = rarity.toLowerCase();
        if (r === "common") {
            return [
                { currency: "GOLD", cost: (totalSlots - 1) * 500, icon: "item_gold" },
                { currency: "TON", cost: (totalSlots - 1) * 0.1, icon: "item_ton" }
            ];
        } else if (r === "rare") {
            return [
                { currency: "GOLD", cost: totalSlots * 1000, icon: "item_gold" },
                { currency: "TON", cost: totalSlots * 0.2, icon: "item_ton" }
            ];
        } else if (r === "epic") {
            return [
                { currency: "TON", cost: 0.5 + totalSlots * 0.3, icon: "item_ton" }
            ];
        } else if (r === "legendary") {
            return [
                { currency: "TON", cost: 1.0 + totalSlots * 0.2, icon: "item_ton" }
            ];
        }
        return [];
    }

    function buySlotAction(rarity, currency) {
        utility.createloadingOverlay(scene);
        api.unlockCollectorSlot(rarity, currency).then(result => {
            utility.destroyloadingOverlay(scene);
            if (result && result.success) {
                utility.showNotification(scene, `Successfully unlocked slot using ${currency}!`);
                refresh();
            } else {
                utility.showNotification(scene, result?.reason || "Failed to unlock slot.");
            }
        }).catch(err => {
            utility.destroyloadingOverlay(scene);
            utility.showNotification(scene, "Connection error.");
        });
    }

    function refresh() {
        activeTimers.forEach(t => t.destroy());
        activeTimers = [];

        slotsContainer.destroy();
        slotsContainer = scene.add.container(0, 0);
        collectorContainer.add(slotsContainer);

        api.GetCollectorRarityInfo(rarity).then(data => {
            if (data.success) {
                let rotationSeconds = data.countdownSeconds || 0;
                rotationTimerText.setText(`Rotation: ${formatRotationTime(rotationSeconds)}`);

                const rotTimerEvent = scene.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        rotationSeconds--;
                        if (rotationSeconds <= 0) {
                            rotTimerEvent.destroy();
                            rotationTimerText.setText("Resetting...");
                            refresh();
                        } else {
                            rotationTimerText.setText(`Rotation: ${formatRotationTime(rotationSeconds)}`);
                        }
                    },
                    loop: true
                });
                activeTimers.push(rotTimerEvent);

                const totalSlots = data.totalSlots;
                const stakedCount = data.stakedCount;
                const stakedMonsters = data.stakedMonsters;
                const eligibleMonsters = data.eligibleMonsters;

                let infoAvatarX = 35;
                let infoAvatarY = 155;
                eligibleMonsters.forEach((monsterId, index) => {
                    const avatar = scene.add.image(infoAvatarX, infoAvatarY, `icon_${monsterId}`).setOrigin(0).setScrollFactor(0);
                    avatar.setDisplaySize(31, 31);

                    slotsContainer.add(avatar);

                    infoAvatarX += avatar.displayWidth + 10;
                });


                let slotx = 24;
                let sloty = 280;

                for (let i = 0; i < totalSlots; i++) {
                    const monster = stakedMonsters[i];
                    const slot_container = scene.add.container(slotx, sloty);
                    if (monster) {

                        const slot_bg = scene.add.image(0, 0, `pane_thumb_${monster.element}`).setOrigin(0).setScrollFactor(0);
                        slot_bg.setDisplaySize(178.3, 96.6);

                        const avatar = scene.add.image(slot_bg.x + 10, slot_bg.y + 6, `icon_${monster.id}`).setOrigin(0).setScrollFactor(0);
                        avatar.setDisplaySize(84, 84);

                        const rStr = (monster.rarity || monster.Rarity || "common").toUpperCase();
                        const rarityText = scene.add.text(slot_bg.x + 12, slot_bg.y - 8, rStr, {
                            fontFamily: "Lilita One, Coiny, sans-serif",
                            fontSize: "12px",
                            color: getRarityColor(rStr)
                        }).setOrigin(0, 0.5);
                        rarityText.setStroke("#000000", 2.5);

                        const title = scene.add.text(avatar.x + 5, avatar.y + avatar.displayHeight - 20, monster.title, {
                            fontFamily: "Lilita One",
                            fontSize: "18px",
                            fontWeight: "800",
                            color: "#FFFFFF",
                        }).setScrollFactor(0);
                        title.setStroke("#000000", 2.5);

                        const goldIcon = scene.add.image(avatar.x + avatar.displayWidth + 3, avatar.y + 5, "item_gold").setOrigin(0).setScrollFactor(0);
                        goldIcon.setDisplaySize(24, 24);

                        const goldRate = scene.add.text(goldIcon.x + goldIcon.displayWidth, goldIcon.y + 5, monster.goldRate + "/H", {
                            fontFamily: "Nunito, sans-serif",
                            fontSize: "12px",
                            color: "#000000ff",
                        }).setScrollFactor(0);

                        const crystalIcon = scene.add.image(avatar.x + avatar.displayWidth + 3, avatar.y + 30, "item_dust").setOrigin(0).setScrollFactor(0);
                        crystalIcon.setDisplaySize(24, 24);

                        const crystalRate = scene.add.text(crystalIcon.x + crystalIcon.displayWidth, crystalIcon.y + 5, monster.crystalRate + "/H", {
                            fontFamily: "Nunito, sans-serif",
                            fontSize: "12px",
                            color: "#000000ff",
                        }).setScrollFactor(0);


                        const claimButton = scene.add.image(avatar.x + avatar.displayWidth, avatar.y + 55, "btn_blank").setOrigin(0).setScrollFactor(0);
                        claimButton.setDisplaySize(74.5, 27.4);

                        const btnClaim = scene.add.text(claimButton.x + claimButton.displayWidth / 2, claimButton.y + claimButton.displayHeight / 2, "CLAIM", {
                            fontFamily: "Lilita One",
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#FFFFFF",
                        }).setOrigin(0.5).setScrollFactor(0);

                        slot_bg.setInteractive({ useHandCursor: true });
                        slot_bg.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            showMonsterInfo(scene, monster, () => {
                                refresh();
                            });
                        });

                        let remainingCooldownSeconds = Math.max(0, Math.ceil(monster.cooldownRemainingSeconds || 0));
                        if (remainingCooldownSeconds > 0) {
                            claimButton.setTint(0xff3b30);
                            btnClaim.setText(formatTime(remainingCooldownSeconds));

                            const timerEvent = scene.time.addEvent({
                                delay: 1000,
                                callback: () => {
                                    remainingCooldownSeconds--;
                                    if (remainingCooldownSeconds <= 0) {
                                        timerEvent.destroy();
                                        refresh();
                                    } else {
                                        btnClaim.setText(formatTime(remainingCooldownSeconds));
                                    }
                                },
                                loop: true
                            });
                            activeTimers.push(timerEvent);
                        } else {
                            let remainingSeconds = Math.max(0, Math.ceil(3600 - (monster.elapsedHours * 3600)));
                            if (remainingSeconds > 0) {
                                claimButton.setAlpha(0.6);
                                btnClaim.setAlpha(0.8);
                                btnClaim.setText(formatTime(remainingSeconds));

                                const timerEvent = scene.time.addEvent({
                                    delay: 1000,
                                    callback: () => {
                                        remainingSeconds--;
                                        if (remainingSeconds <= 0) {
                                            timerEvent.destroy();
                                            claimButton.setAlpha(1.0);
                                            btnClaim.setAlpha(1.0);
                                            btnClaim.setText("CLAIM");
                                            claimButton.setInteractive({ useHandCursor: true });
                                        } else {
                                            btnClaim.setText(formatTime(remainingSeconds));
                                        }
                                    },
                                    loop: true
                                });
                                activeTimers.push(timerEvent);
                            } else {
                                claimButton.setAlpha(1.0);
                                btnClaim.setAlpha(1.0);
                                btnClaim.setText("CLAIM");
                                claimButton.setInteractive({ useHandCursor: true });
                            }

                            claimButton.on("pointerup", (pointer) => {
                                if (!checkClick(pointer)) return;
                                if (remainingSeconds > 0) return;
                                utility.createloadingOverlay(scene);
                                api.claimCollectorRewards(monster.instanceId).then(result => {
                                    utility.destroyloadingOverlay(scene);
                                    if (result && result.success) {
                                        utility.showNotification(scene, `Claimed +${result.goldClaimed.toFixed(2)} Gold & +${result.crystalClaimed.toFixed(2)} Crystal!`);
                                        refresh();
                                    } else {
                                        utility.showNotification(scene, result?.reason || "Failed to claim.");
                                    }
                                }).catch(err => {
                                    utility.destroyloadingOverlay(scene);
                                    utility.showNotification(scene, "Connection error.");
                                });
                            });
                        }

                        slot_container.add([slot_bg, avatar, rarityText, title, goldIcon, goldRate, crystalIcon, crystalRate, claimButton, btnClaim]);
                        slotsContainer.add(slot_container);

                        slotx += slot_bg.displayWidth + 8;

                        if ((i + 1) % 2 === 0) {
                            slotx = 24;
                            sloty += slot_bg.displayHeight + 15;
                        }

                    } else {
                        const slot_bg = scene.add.image(0, 0, `empty_slot`).setOrigin(0).setScrollFactor(0);
                        slot_bg.setDisplaySize(162, 96.6);

                        const stakeBtn = scene.add.image(slot_bg.x + slot_bg.displayWidth / 2, slot_bg.y + slot_bg.displayHeight / 2, "btn_blank")
                            .setOrigin(0.5)
                            .setDisplaySize(110, 32)
                            .setTint(0x22c55e)
                            .setInteractive({ useHandCursor: true })
                            .setVisible(false)
                            .setScrollFactor(0);
                        stakeBtn.isStakeOverlay = true;

                        const stakeTxt = scene.add.text(stakeBtn.x, stakeBtn.y, "STAKE", {
                            fontFamily: "Lilita One",
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#FFFFFF",
                        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
                        stakeTxt.isStakeOverlay = true;

                        slot_bg.setInteractive({ useHandCursor: true });
                        slot_bg.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            const nextVisible = !stakeBtn.visible;

                            slotsContainer.list.forEach(c => {
                                if (c.list) {
                                    c.list.forEach(child => {
                                        if (child.isUnstakeOverlay || child.isStakeOverlay || child.isBuyOverlay) {
                                            child.setVisible(false);
                                        }
                                    });
                                }
                            });
                            slotsContainer.list.forEach(child => {
                                if (child.isBuyOverlay) {
                                    child.setVisible(false);
                                }
                            });

                            stakeBtn.setVisible(nextVisible);
                            stakeTxt.setVisible(nextVisible);
                        });

                        stakeBtn.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            scene.scene.launch("InventoryScene", { onlyItems: false });
                            scene.scene.pause();
                            const sub = scene.scene.get("InventoryScene");
                            sub.events.once("shutdown", () => {
                                scene.scene.resume();
                                refresh();
                            });
                        });

                        slot_container.add([slot_bg, stakeBtn, stakeTxt]);
                        slotsContainer.add(slot_container);

                        slotx += slot_bg.displayWidth + 18;

                        if ((i + 1) % 2 === 0) {
                            slotx = 24;
                            sloty += slot_bg.displayHeight + 22;
                        }
                    }

                }
                const addSlot = scene.add.image(slotx, sloty, "add_slot").setOrigin(0).setScrollFactor(0);
                addSlot.setDisplaySize(162, 96.6);
                slotsContainer.add(addSlot);

                const options = getSlotCosts(rarity, totalSlots);
                const overlayElements = [];

                if (options.length === 1) {
                    const opt = options[0];
                    const btnX = addSlot.x + addSlot.displayWidth / 2;
                    const btnY = addSlot.y + addSlot.displayHeight / 2;

                    const btn = scene.add.image(btnX, btnY, "btn_blank")
                        .setOrigin(0.5)
                        .setDisplaySize(130, 32)
                        .setTint(0x22c55e)
                        .setInteractive({ useHandCursor: true })
                        .setVisible(false)
                        .setScrollFactor(0);
                    btn.isBuyOverlay = true;

                    const icon = scene.add.image(btnX - 45, btnY, opt.icon)
                        .setOrigin(0.5)
                        .setDisplaySize(20, 20)
                        .setVisible(false)
                        .setScrollFactor(0);
                    icon.isBuyOverlay = true;

                    const textVal = opt.currency === "TON" ? opt.cost.toFixed(1) : opt.cost.toString();
                    const txt = scene.add.text(btnX + 10, btnY, `${textVal} ${opt.currency}`, {
                        fontFamily: "Lilita One",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#FFFFFF",
                    }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
                    txt.isBuyOverlay = true;

                    overlayElements.push(btn, icon, txt);

                    btn.on("pointerup", (pointer) => {
                        if (!checkClick(pointer)) return;
                        buySlotAction(rarity, opt.currency);
                    });
                } else if (options.length === 2) {
                    options.forEach((opt, idx) => {
                        const btnX = addSlot.x + addSlot.displayWidth / 2;
                        const btnY = addSlot.y + 25 + (idx * 45);

                        const btn = scene.add.image(btnX, btnY, "btn_blank")
                            .setOrigin(0.5)
                            .setDisplaySize(130, 32)
                            .setTint(0x22c55e)
                            .setInteractive({ useHandCursor: true })
                            .setVisible(false)
                            .setScrollFactor(0);
                        btn.isBuyOverlay = true;

                        const icon = scene.add.image(btnX - 45, btnY, opt.icon)
                            .setOrigin(0.5)
                            .setDisplaySize(20, 20)
                            .setVisible(false)
                            .setScrollFactor(0);
                        icon.isBuyOverlay = true;

                        const textVal = opt.currency === "TON" ? opt.cost.toFixed(1) : opt.cost.toString();
                        const txt = scene.add.text(btnX + 10, btnY, `${textVal} ${opt.currency}`, {
                            fontFamily: "Lilita One",
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#FFFFFF",
                        }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
                        txt.isBuyOverlay = true;

                        overlayElements.push(btn, icon, txt);

                        btn.on("pointerup", (pointer) => {
                            if (!checkClick(pointer)) return;
                            buySlotAction(rarity, opt.currency);
                        });
                    });
                }

                addSlot.setInteractive({ useHandCursor: true });
                addSlot.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    const nextVisible = overlayElements.length > 0 && !overlayElements[0].visible;

                    slotsContainer.list.forEach(c => {
                        if (c.list) {
                            c.list.forEach(child => {
                                if (child.isUnstakeOverlay || child.isStakeOverlay || child.isBuyOverlay) {
                                    child.setVisible(false);
                                }
                            });
                        }
                    });
                    slotsContainer.list.forEach(child => {
                        if (child.isBuyOverlay) {
                            child.setVisible(false);
                        }
                    });

                    overlayElements.forEach(el => el.setVisible(nextVisible));
                });

                slotsContainer.add(overlayElements);
            }
        });
    }

    collectorContainer.on("destroy", () => {
        activeTimers.forEach(t => t.destroy());
    });

    btnClaimAll.on("pointerup", (pointer) => {
        if (!checkClick(pointer)) return;
        utility.createloadingOverlay(scene);
        api.claimCollectorRewards("").then(result => {
            utility.destroyloadingOverlay(scene);
            if (result && result.success) {
                if (result.goldClaimed > 0 || result.crystalClaimed > 0) {
                    utility.showNotification(scene, `Claimed +${result.goldClaimed.toFixed(2)} Gold & +${result.crystalClaimed.toFixed(2)} Crystal!`);
                } else {
                    utility.showNotification(scene, "No ready rewards to claim.");
                }
                refresh();
            } else {
                utility.showNotification(scene, result?.reason || "Failed to claim rewards.");
            }
        }).catch(err => {
            utility.destroyloadingOverlay(scene);
            utility.showNotification(scene, "Connection error.");
        });
    });

    refresh();

    function getRarityColor(rarityText) {
        const r = (rarityText || "common").toLowerCase().trim();
        if (r === "rare") return "#60a5fa";
        if (r === "epic") return "#c084fc";
        if (r === "legendary") return "#fbbf24";
        return "#cbd5e1";
    }
}

function showMonsterInfo(scene, monster, onUnstakeSuccess) {
    const container = scene.add.container(0, 0);
    container.setDepth(100).setScrollFactor(0);

    const overlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.7).setOrigin(0);
    overlay.setInteractive();

    overlay.on("pointerup", () => {
        container.destroy();
    });

    const info_panel = scene.add.image(0, 410, `info_${monster.rarity.toLowerCase()}_panel`).setOrigin(0);

    const monsterImg = scene.add.image(200, info_panel.y + info_panel.displayHeight / 2 - 15, `front_${monster.id}`).setOrigin(0, 1);
    monsterImg.setDisplaySize(monsterImg.displayWidth / 1.5, monsterImg.displayHeight / 1.5);

    const monster_level = scene.add.text(15, 464, `Lv ${monster.level}`, {
        fontFamily: "Lilita One",
        fontSize: "12px",
        color: "#000000"
    }).setOrigin(0);

    const monster_name = scene.add.text(15, 480, monster.title, {
        fontFamily: "Lilita One",
        fontSize: "20px",
        color: "#ffffff"
    }).setOrigin(0);
    monster_name.setStroke("#000000", 2);

    const element_symbol = scene.add.image(monster_name.x + monster_name.displayWidth + 2, monster_name.y - 5, `symbol_${monster.element}`).setOrigin(0);
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

    const baseRates = getBaseCollectorRates(monster.rarity);
    const levelVal = monster.level || 1;
    const mult = getCollectorLevelMultiplier(levelVal);
    const goldRateVal = (monster.goldRate !== undefined && monster.goldRate !== null) ? monster.goldRate : (baseRates.gold * mult);
    const crystalRateVal = (monster.crystalRate !== undefined && monster.crystalRate !== null) ? monster.crystalRate : (baseRates.crystal * mult);

    const goldFarm = scene.add.image(10, 515, "hud_gold").setOrigin(0);
    const goldFarmTxt = scene.add.text(goldFarm.x + 45, goldFarm.y + 10, `${goldRateVal.toFixed(1).replace(/\.0$/, "")}/H`, {
        fontFamily: "Lilita One",
        fontSize: "14px",
        color: "#ffffff"
    }).setOrigin(0);

    // Add base layers to container first
    container.add([overlay, info_panel, monsterImg, monster_level, monster_name, element_symbol, goldFarm, goldFarmTxt]);

    if (crystalRateVal > 0) {
        const crystalFarm = scene.add.image(goldFarm.x, goldFarm.y + goldFarm.displayHeight + 10, "hud_crystal").setOrigin(0);
        const crystalFarmTxt = scene.add.text(crystalFarm.x + 45, crystalFarm.y + 10, `${crystalRateVal.toFixed(1).replace(/\.0$/, "")}/H`, {
            fontFamily: "Lilita One",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0);
        container.add([crystalFarm, crystalFarmTxt]);
    }

    const monsterHashBar = scene.add.image(19, 635, "info_hashbar").setOrigin(0);

    const monsterHash = scene.add.text(70, 645, monster.instanceId, {
        fontFamily: "Lilita One",
        fontSize: "14px",
        color: "#ffffff"
    }).setOrigin(0);

    container.add([monsterHashBar, monsterHash]);

    // Since the monster is staked in the collector, we draw the UNSTAKE button at (207, 683)
    const unstakeBtn = scene.add.image(207, 683, "btn_unstake").setOrigin(0).setInteractive({ useHandCursor: true });
    container.add(unstakeBtn);

    unstakeBtn.on("pointerdown", () => {
        showUnstakeConfirmModal(scene, monster, () => {
            container.destroy();
            if (onUnstakeSuccess) onUnstakeSuccess();
        });
    });
}

function showUnstakeConfirmModal(scene, monster, onConfirm) {
    const blocker = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        .setOrigin(0)
        .setInteractive()
        .setDepth(150);

    const modalContainer = scene.add.container(0, 0).setDepth(200);

    const modalW = 280;
    const modalH = 220;
    const modalX = scene.scale.width / 2;
    const modalY = scene.scale.height / 2;

    const card = scene.add.graphics();
    card.fillStyle(0x000000, 0.35);
    card.fillRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW, modalH, 16);

    card.fillStyle(0x1a1a2e, 1);
    card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

    card.lineStyle(2, 0xff3b30, 0.8);
    card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

    modalContainer.add(card);

    const titleTxt = scene.add.text(modalX, modalY - modalH / 2 + 25, "UNSTAKE MONSTER", {
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

    const bodyTxt = scene.add.text(modalX, modalY - 15, msg, {
        fontFamily: "Lilita One, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        align: "center"
    }).setOrigin(0.5);
    modalContainer.add(bodyTxt);

    const btnConfirm = scene.add.graphics();
    btnConfirm.fillStyle(0xff3b30, 1);
    btnConfirm.fillRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);
    btnConfirm.lineStyle(1.5, 0xffffff, 0.9);
    btnConfirm.strokeRoundedRect(modalX - 105, modalY + 50, 90, 32, 6);

    const confirmText = scene.add.text(modalX - 60, modalY + 66, "UNSTAKE", {
        fontFamily: "Lilita One, sans-serif",
        fontSize: "13px",
        color: "#ffffff"
    }).setOrigin(0.5);
    confirmText.setStroke("#000000", 3);

    const hitConfirm = scene.add.rectangle(modalX - 60, modalY + 66, 90, 32, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    const btnCancel = scene.add.graphics();
    btnCancel.fillStyle(0x8e8e93, 1);
    btnCancel.fillRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);
    btnCancel.lineStyle(1.5, 0xffffff, 0.9);
    btnCancel.strokeRoundedRect(modalX + 15, modalY + 50, 90, 32, 6);

    const cancelText = scene.add.text(modalX + 60, modalY + 66, "CANCEL", {
        fontFamily: "Lilita One, sans-serif",
        fontSize: "13px",
        color: "#ffffff"
    }).setOrigin(0.5);
    cancelText.setStroke("#000000", 3);

    const hitCancel = scene.add.rectangle(modalX + 60, modalY + 66, 90, 32, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    modalContainer.add([btnConfirm, confirmText, hitConfirm, btnCancel, cancelText, hitCancel]);

    hitConfirm.on("pointerup", (pointer) => {
        if (!checkClick(pointer)) return;
        blocker.destroy();
        modalContainer.destroy();
        utility.createloadingOverlay(scene);
        api.unstakeMonster(monster.instanceId).then(result => {
            utility.destroyloadingOverlay(scene);
            if (result && result.success) {
                utility.showNotification(scene, "Unstaked successfully!");
                if (onConfirm) onConfirm();
            } else {
                utility.showNotification(scene, result?.reason || "Failed to unstake.");
            }
        }).catch(err => {
            utility.destroyloadingOverlay(scene);
            console.error(err);
            utility.showNotification(scene, "Connection error.");
        });
    });

    hitCancel.on("pointerup", (pointer) => {
        if (!checkClick(pointer)) return;
        blocker.destroy();
        modalContainer.destroy();
    });
}
