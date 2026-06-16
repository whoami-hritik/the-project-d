import * as api from "../webapp/api.js";
import * as utility from "../utility.js";
import { showNotification } from "../utility.js";

export class LabScene extends Phaser.Scene {
    constructor() {
        super({ key: "LabScene" });
    }

    init(data) {
        this.monster = data.monster;
    }
    preload() {
        this.load.json("skills_data", "data/skills.json");
    }
    create() {
        this.initializeBg();
        utility.createloadingOverlay(this);
        api.GetMonsterInfo(this.monster.instanceId).then(result => {
            if (result.success) {
                this.monsInfo = result.info;
                this.showInfo();
            } else {
                showNotification(this, result.reason);
            }

            utility.destroyloadingOverlay(this);
        });


    }




    showMonsterStats() {

        const spdIcon = this.add.image(14, 305, "icon_speed").setOrigin(0).setDisplaySize(75, 30);
        const atkIcon = this.add.image(20, 225, "icon_atk").setOrigin(0).setDisplaySize(70, 30);
        const defIcon = this.add.image(20, 265, "icon_def").setOrigin(0).setDisplaySize(70, 30);

        const atkStatBg = this.add.image(40, 247, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);
        const defStatBg = this.add.image(40, 287, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);
        const spdStatBg = this.add.image(40, 327, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);

        const atkStat = this.add.image(40, 247, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);
        const defStat = this.add.image(40, 287, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);
        const spdStat = this.add.image(40, 327, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);


        const atkFullWidth = atkStatBg.width;
        const atkcropWidth = (this.monsInfo.attack / 100) * atkFullWidth;
        atkStat.setCrop(0, 0, atkcropWidth, atkStat.height);

        const defFullWidth = defStatBg.width;
        const defcropWidth = (this.monsInfo.defense / 100) * defFullWidth;
        defStat.setCrop(0, 0, defcropWidth, defStat.height);

        const spdFullWidth = spdStatBg.width;
        const spdcropWidth = (this.monsInfo.speed / 100) * spdFullWidth;
        spdStat.setCrop(0, 0, spdcropWidth, spdStat.height);

        const container = this.add.container();
        container.add([spdIcon, atkIcon, defIcon, spdStatBg, atkStatBg, defStatBg, spdStat, atkStat, defStat]);


    }

    initializeBg() {
        const bg = this.add.image(0, 0, "inventory-bg").setOrigin(0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        const monster = this.add.image(300, 500, `front_${this.monster.id}`);
        monster.setDisplaySize(monster.displayWidth / 1.5, monster.displayHeight / 1.5)
            .setOrigin(0.5, 1);

        const btn_all = this.add.image(20, 35, "btn_back_all")
        btn_all.setDisplaySize(btn_all.displayWidth / 2, btn_all.displayHeight / 2).setOrigin(0).setInteractive({ useHandCursor: true });

        btn_all.on("pointerup", () => {
            this.scene.stop("LabScene");
        })
    }

    showInfo() {
        const PANE_CONTAINER = this.add.container(30, 400);

        const PANE = this.add.image(0, 0, `pane_tooltip_${this.monsInfo.element}`);
        PANE.setDisplaySize(PANE.displayWidth / 1.5, PANE.displayHeight / 1.5).setOrigin(0);

        const HPBG = this.add.image(3.5, 45, "hpbar_med_bg");
        HPBG.setDisplaySize(HPBG.displayWidth / 1.5, HPBG.displayHeight / 1.5).setOrigin(0);

        const HPFILL = this.add.image(3.5, 45, "hpbar_med_fill");
        HPFILL.setDisplaySize(HPFILL.displayWidth / 1.5, HPFILL.displayHeight / 1.5).setOrigin(0);
        const hpFullWidth = HPFILL.width;
        const hpCropWidth = (this.monsInfo.hp / (this.monsInfo.maxHP || 100)) * hpFullWidth;
        HPFILL.setCrop(0, 0, hpCropWidth, HPFILL.height);

        const LV = this.add.image(0, -5, "ch35").setOrigin(0);

        const levelStr = String(this.monsInfo.level)
        const charCode = Array.from(levelStr, chr => chr.charCodeAt(0));
        let lastCharWidth = 0;
        charCode.forEach((element) => {
            const lev = this.add.image(LV.displayWidth + lastCharWidth, -5, `ch${element}`);
            lev.setOrigin(0);
            lastCharWidth += lev.displayWidth;
            PANE_CONTAINER.add(lev);
        });


        PANE_CONTAINER.add([PANE, HPBG, HPFILL, LV]);

        const nameTokens = Array.from(this.monsInfo.title, chr => chr.charCodeAt(0));
        let lastTokenWidth = 0;
        nameTokens.forEach((token, i) => {
            const letter = this.add.image(5 + lastTokenWidth, 25, `c${token}`).setOrigin(0);
            letter.setDisplaySize(letter.displayWidth / 2, letter.displayHeight / 2).setDepth(100);
            lastTokenWidth += letter.displayWidth;

            PANE_CONTAINER.add(letter);
        });




        const XPBG = this.add.image(20, 500, "xpbar_bg");
        XPBG.setDisplaySize(XPBG.displayWidth / 1.5, XPBG.displayHeight / 1.5).setOrigin(0);

        const XPFILL = this.add.image(20, 500, "xpbar_fill");
        XPFILL.setDisplaySize(XPFILL.displayWidth / 1.5, XPFILL.displayHeight / 1.5).setOrigin(0);
        const xpFullWidth = XPFILL.width;
        const xpCropWidth = (this.monsInfo.xp / (this.monsInfo.maxXP || 100)) * xpFullWidth;
        XPFILL.setCrop(0, 0, xpCropWidth, XPFILL.height);


        const RELEASE_BTN = this.add.image(20, 550, "btn_release");
        RELEASE_BTN.setDisplaySize(90, 38).setOrigin(0);

        // Calculate Heal Spell required and Gold cost
        const maxHP = this.monsInfo.maxHP || 100;
        const currentHP = this.monsInfo.hp;
        let healBtn = null;
        let healText = null;

        if (currentHP < maxHP) {
            const missingHP = maxHP - currentHP;
            const requiredSpells = Math.ceil(missingHP / 100.0);
            const goldCost = requiredSpells * 10;

            healBtn = this.add.image(125, 550, "btn_blank").setDisplaySize(110, 38).setOrigin(0).setInteractive({ useHandCursor: true });
            healText = this.add.text(180, 569, `HEAL ${goldCost}G`, {
                fontFamily: "Lilita One, sans-serif",
                fontSize: "12px",
                color: "#ffffff"
            }).setOrigin(0.5, 0.5);
            healText.setStroke("#000000", 3);

            healBtn.on("pointerup", () => {
                api.HealMonsterWithGold(this.monsInfo.instanceId).then(result => {
                    if (result && result.success) {
                        showNotification(this, "Monster fully healed!");
                        if (result.monster) {
                            Object.assign(this.monster, result.monster);
                        }
                        this.scene.restart({ monster: this.monster });
                    } else {
                        showNotification(this, result ? result.reason : "Healing failed");
                    }
                });
            });
        }

        // Show level up button only when monster XP reaches to MAX XP
        if (this.monsInfo.xp >= (this.monsInfo.maxXP || 100)) {
            const levelUpX = healBtn ? 245 : 125;
            const LEVELUP_BTN = this.add.image(levelUpX, 550, "btn_levelup").setDisplaySize(95, 38).setOrigin(0).setInteractive({ useHandCursor: true });
            LEVELUP_BTN.on("pointerup", () => {
                api.LevelUpMonster(this.monsInfo.instanceId).then(result => {
                    if (result && result.success) {
                        showNotification(this, "Monster Leveled Up!");
                        if (result.monster) {
                            Object.assign(this.monster, result.monster);
                        }
                        this.scene.restart({ monster: this.monster });
                    } else {
                        showNotification(this, result ? result.reason : "Level up failed");
                    }
                });
            });
        }


        const skillContainer = this.add.container(0, 600);

        const skills = this.add.image(0, -10, "skills_bg");
        skills.setDisplaySize(skills.displayWidth / 1.5, skills.displayHeight / 1.5).setOrigin(0);
        skills.setInteractive({ useHandCursor: true });
        skillContainer.add(skills);

        // Mask for the scrolling skills viewport (inside the bg bounds)
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(10, 605, 250, 90);
        const mask = maskShape.createGeometryMask();

        const scrollContainer = this.add.container(0, 0);
        scrollContainer.setMask(mask);
        skillContainer.add(scrollContainer);

        // Fetch skills descriptions from skills_data
        const skillsData = this.cache.json.get("skills_data");

        // Drag/Swipe Logic
        let startX = 0;
        let isDragging = false;
        let scrollX = 0;
        let totalDragDistance = 0;

        const viewportWidth = 400;
        const totalContentWidth = this.monsInfo.abilities.length * 73.33 + 20;
        const minScrollX = Math.min(0, viewportWidth - totalContentWidth);
        const maxScrollX = 0;

        const startDrag = (pointer) => {
            startX = pointer.x;
            isDragging = true;
            totalDragDistance = 0;
        };

        skills.on("pointerdown", startDrag);

        this.input.on("pointermove", (pointer) => {
            if (!isDragging) return;
            const dx = pointer.x - startX;
            startX = pointer.x;
            scrollX += dx;
            totalDragDistance += Math.abs(dx);

            if (scrollX > maxScrollX) scrollX = maxScrollX;
            if (scrollX < minScrollX) scrollX = minScrollX;

            scrollContainer.x = scrollX;
        });

        this.input.on("pointerup", () => {
            isDragging = false;
        });

        // Description panel themed with monster element
        let elementKey = this.monsInfo.element;
        if (elementKey === "elec") elementKey = "electric";
        const bgTexture = this.textures.exists(`pane_tooltip_${elementKey}`) ? `pane_tooltip_${elementKey}` : `pane_tooltip_earth`;

        const descBg = this.add.image(this.scale.width / 2, 755, bgTexture).setOrigin(0.5);
        descBg.setDisplaySize(this.scale.width - 40, 75);
        descBg.setAlpha(0.9);

        const descTitle = this.add.text(35, 725, "TAP A SKILL FOR INFO", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "16px",
            color: "#fce09b"
        }).setOrigin(0, 0);
        descTitle.setStroke("#000000", 3);

        const descBody = this.add.text(35, 747, "Select any skill icon above to read its combat description.", {
            fontFamily: "Outfit, sans-serif",
            fontSize: "12px",
            color: "#ffffff",
            wordWrap: { width: this.scale.width - 70, useAdvancedWrap: true }
        }).setOrigin(0, 0);
        descBody.setStroke("#000000", 2);

        const displayDescription = (ability) => {
            const baseId = ability.id.split('-')[0];
            const def = skillsData ? skillsData.find(s => s.id === baseId) : null;
            const title = def ? def.title : baseId.toUpperCase();
            const desc = def ? def.desc.replace(/\|/g, "\n") : "No description available.";

            this.tweens.add({
                targets: [descTitle, descBody],
                alpha: 0,
                duration: 100,
                onComplete: () => {
                    descTitle.setText(title.toUpperCase());
                    descBody.setText(desc);

                    this.tweens.add({
                        targets: [descTitle, descBody],
                        alpha: 1,
                        duration: 150
                    });
                }
            });
        };

        this.monsInfo.abilities.forEach((ability, i) => {
            // Place icons nicely inside scrollContainer
            const skill_icon = this.add.image(i * 73.33 + 20, 20, `icon_${ability.id}`);
            skill_icon.setDisplaySize(skill_icon.displayWidth / 1.5, skill_icon.displayHeight / 1.5).setOrigin(0);
            skill_icon.setInteractive({ useHandCursor: true });
            scrollContainer.add(skill_icon);

            let lock_skill = null;
            if (ability.getsAt > this.monsInfo.level) {
                skill_icon.setAlpha(0.5);
                lock_skill = this.add.image(i * 73.33 + 15, 35, "skill_lock");
                lock_skill.setDisplaySize(lock_skill.displayWidth / 1.5, lock_skill.displayHeight / 1.5).setOrigin(0);
                scrollContainer.add(lock_skill);
            }

            skill_icon.on("pointerdown", startDrag);

            skill_icon.on("pointerup", () => {
                isDragging = false;
                if (totalDragDistance > 8) {
                    return;
                }
                displayDescription(ability);
            });
        });

        this.showMonsterStats();

    }


}


export function MonsterUpgradeScreen(scene, monsInfo, callback) {


    const container = scene.add.container(0, 0);
    container.setDepth(100);

    const land = scene.add.image(65, 355, "pedestal");
    land.setDisplaySize(270, 165).setOrigin(0);


    const monster = scene.add.image(190, 380, `front_${monsInfo.id}`);
    monster.setDisplaySize(monster.displayWidth / 1.5, monster.displayHeight / 1.5).setOrigin(0.5, 1);


    const xpBarBg = scene.add.image(120, 420, "xpbar_bg").setOrigin(0).setDisplaySize(160, 30);
    const xpBarFill = scene.add.image(120, 420, "xpbar_fill").setOrigin(0).setDisplaySize(0, 30);

    const xpText = scene.add.text(200, 435, `${monsInfo.xp} / ${monsInfo.maxXP || 100} XP`, {
        fontFamily: "Lilita One, sans-serif",
        fontSize: "14px",
        color: "#ffffff"
    }).setOrigin(0.5, 0.5).setDepth(1);
    xpText.setStroke("#000000", 3);

    container.add([land, monster, xpBarBg, xpBarFill, xpText]);


    scene.tweens.add({
        targets: container,
        x: 0,
        duration: 500,
        onComplete: () => {
            const targetWidth = (monsInfo.xp / (monsInfo.maxXP || 100)) * 160;
            scene.tweens.add({
                targets: xpBarFill,
                displayWidth: targetWidth,
                duration: 500,
                delay: 500,
                ease: "Power2",
                onComplete: () => {
                    if (monsInfo.xp >= monsInfo.maxXP) {
                        const levelUp = scene.add.image(150, 465, "btn_levelup").setOrigin(0).setDisplaySize(97, 44);
                        levelUp.setInteractive({ useHandCursor: true });

                        const levelUpText = scene.add.text(160, 470, 0, "{Amonut} {GOLD icon } LEVEL UP", { font: "24px Arial", fill: "#fff", fontWeight: "bold" });
                        const btn_later = scene.add.image(175, 510, "btn_later").setOrigin(0).setDisplaySize(50, 25);
                        btn_later.setInteractive({ useHandCursor: true });
                        container.add([levelUp, btn_later]);

                        levelUp.on("pointerup", () => {

                            api.LevelUpMonster(monsInfo.instanceId).then((result) => {
                                if (result.success) {
                                    const fx = scene.add.sprite(monster.x, monster.y, "anim_levelup_blast");
                                    fx.setOrigin(0.5, 1).setDisplaySize(fx.displayWidth / 1.5, fx.displayHeight / 1.5);
                                    fx.anims.play("anim_levelup_blast");

                                    fx.on("animationcomplete", () => {

                                        fx.destroy();

                                        scene.tweens.add({
                                            targets: container,
                                            x: scene.scale.width,
                                            duration: 500,
                                            onComplete: () => {
                                                scene.time.delayedCall(500, () => {
                                                    callback();
                                                });
                                            }
                                        });
                                    })
                                } else {
                                    utility.showNotification(scene, result.reason);
                                    scene.time.delayedCall(2000, () => {
                                        console.log("forcing back to the map");
                                        scene.scene.start("MapScene", { map: scene.world });
                                    })
                                }
                            })


                        });


                        btn_later.on("pointerup", () => {
                            scene.tweens.add({
                                targets: container,
                                x: scene.scale.width + 200,
                                duration: 500,
                                onComplete: () => {
                                    scene.time.delayedCall(500, () => {
                                        callback();
                                    });
                                }
                            })
                        });

                    } else {

                        scene.tweens.add({
                            targets: container,
                            x: scene.scale.width,
                            duration: 500,
                            onComplete: () => {
                                scene.time.delayedCall(1500, () => {
                                    callback();
                                });
                            }
                        });
                    }
                }
            });
        }
    });







}