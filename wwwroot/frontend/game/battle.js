import { state } from "../state.js";
import * as api from "../webapp/api.js";
import { ItemScene } from "./item.js";
import { checkClick } from "./game.js";
import { showNotification } from "../utility.js";
import { MonsterUpgradeScreen } from "./lab.js";


const ATTACKRT_POS = {
    x: 100,
    y: 630
}

const DEFFENDER_POS = {
    x: 290,
    y: 430
}

const OPTIONS_POS_Y = 770;

const PLAYER_PANE = {
    x: 190,
    y: 620
}

const ENEMY_PANE = {
    x: 10,
    y: 110
}

const specialSkills = ["scratch", "quick_attack", "rage", "confuse", "strangle", "tentacles", "shockwave", "bubble", "flash"]

const cloudEffects = ["spores", "smoke", "poison_gas", "freeze"]
const strikeEffects = ["leaf_strike", "ice_storm", "rain_fire", "sparks"]

const toOwnEffectSkill = ["healing_rain", "ice_shield", "poison_cloud", "enflame", "recharge", "earth_shield", "revive"]


export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    init(data) {
        this.world = data.map;
        this.node = data.node;
        this.player = state.seletdMonster;
        this.battleState = data.battleState;
        this.rewards = data.rewards;
        this.playerAttack = data.playerAttack;
        this.enemyAttack = data.enemyAttack;
        console.log(this.battleState);
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.initalizeBg();
        this.deckSuffle();

        this.events.on("useItem", this.useItem, this);
        this.events.once("shutdown", () => {
            this.events.off("useItem", this.useItem, this);
        });

        this.stateFlags = {
            playerSick: false,
            enemySick: false,
            playerHypno: false,
            enemyHypno: false,
            playerRage: false,
            enemyRage: false
        }
    }


    useItem(item) {
        console.log("items ", item);
        if (item === "monstaBall") {
            this.captureMonster();
        } else {
            this.preventOptions();
            api.UseItem(this.battleState.battleId, item).then((result) => {
                if (result.success) {
                    const oldSkillsCount = this.battleState.playerActiveSkills.length;
                    this.battleState = result.battleState;

                    // Update player HP in case the consumable was a HealSpell
                    this.updatePlayerHp();

                    if (this.battleState.playerActiveSkills.length > oldSkillsCount) {
                        // A new skill slot was added, re-render and animate the new card
                        this.renderActiveSkills(false, false, true);
                    }
                    this.allowOptions();
                }
                else {
                    this.allowOptions();
                    showNotification(this, result.reason);
                }
            }).catch(err => {
                this.allowOptions();
            });
        }
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

    initalizeBg() {

        const img = this.add.image(0, 0, this.node.bgs).setOrigin(0);
        img.setDisplaySize(this.width, this.height);
        img.setDepth(0);


        //add attacker monster

        this.defender = this.add.sprite(600, DEFFENDER_POS.y, `front_${this.battleState.enemyMonster.id}`);
        this.defender.setDisplaySize(this.defender.displayWidth / 1.5, this.defender.displayHeight / 1.5).setOrigin(0.5, 1);
        this.defender.setDepth(2);


        this.attacker = this.add.sprite(-300, ATTACKRT_POS.y, `back_${this.battleState.playerMonster.id}`);
        this.attacker.setDisplaySize(this.attacker.displayWidth / 1.5, this.attacker.displayHeight / 1.5).setOrigin(0.5, 1);
        this.attacker.setDepth(2);

        this.attackerAim = this.battleState.playerState.aim;
        this.attackerAtk = this.battleState.playerState.atk;
        this.attackerDef = this.battleState.playerState.def;
        this.attackerSpd = this.battleState.playerState.spd;

        this.tweens.add({
            targets: this.attacker,
            x: ATTACKRT_POS.x,
            duration: 300,
            ease: 'Power2'
        });




        this.tweens.add({
            targets: this.defender,
            x: DEFFENDER_POS.x,
            duration: 300,
            ease: 'Power2'
        });





        this.attackerContainer = this.add.container(500, PLAYER_PANE.y);

        const attackerPane = this.add.image(0, 0, `pane_big_${this.battleState.playerMonster.element}`);
        attackerPane.setDisplaySize(attackerPane.displayWidth / 1.5, attackerPane.displayHeight / 1.5)
            .setOrigin(0);
        this.attackerContainer.add(attackerPane);

        const playerLv = this.add.image(attackerPane.displayWidth - 40, 10, "ch35");
        playerLv.setDisplaySize(playerLv.displayWidth / 1.5, playerLv.displayHeight / 1.5).setOrigin(0);
        this.attackerContainer.add(playerLv);

        const playerLevel = Array.from(this.battleState.playerMonster.level.toString(), chr => chr.charCodeAt(0));
        let playerLevelTokenWidth = 0;
        playerLevel.forEach(token => {
            const letter = this.add.image(playerLv.x + 10 + playerLevelTokenWidth, 10, `ch${token}`);
            letter.setDisplaySize(letter.displayWidth / 1.5, letter.displayHeight / 1.5).setOrigin(0);
            playerLevelTokenWidth += letter.displayWidth;
            this.attackerContainer.add(letter);
        });

        const attackerTitle = Array.from(this.battleState.playerMonster.title, chr => chr.charCodeAt(0));
        let attackerTokenWidth = 0;
        attackerTitle.forEach(token => {
            const letter = this.add.image(10 + attackerTokenWidth, 10, `c${token}`);
            letter.setDisplaySize(letter.displayWidth / 1.5, letter.displayHeight / 1.5).setOrigin(0);
            attackerTokenWidth += letter.displayWidth;
            this.attackerContainer.add(letter);
        });
        const ATTACKER_HP_BG = this.add.image(2.5, 40, "hpbar_big_bg");
        ATTACKER_HP_BG.setDisplaySize(ATTACKER_HP_BG.displayWidth / 1.5, ATTACKER_HP_BG.displayHeight / 1.5).setOrigin(0);
        const ATTACKER_HP = this.add.image(2.5, 40, "hpbar_big_fill");
        ATTACKER_HP.setDisplaySize(ATTACKER_HP.displayWidth / 1.5, ATTACKER_HP.displayHeight / 1.5)
            .setOrigin(0);
        ATTACKER_HP.name = "hpbar_fill_green";
        this.attackerContainer.add([ATTACKER_HP_BG, ATTACKER_HP]);
        this.updatePlayerHp();

        this.tweens.add({
            targets: this.attackerContainer,
            x: PLAYER_PANE.x,
            duration: 400,
            ease: 'Power2'
        });




        this.defenderContainer = this.add.container(-200, ENEMY_PANE.y).setDepth(101);

        const defenderPane = this.add.image(0, 0, `pane_big_${this.battleState.enemyMonster.element}`);
        defenderPane.setDisplaySize(defenderPane.displayWidth / 1.5, defenderPane.displayHeight / 1.5)
            .setOrigin(0);
        this.defenderContainer.add(defenderPane);

        let defenderTokenWidth = 0
        let levelTokenWidth = 0;
        const enemyLv = this.add.image(defenderPane.displayWidth - 40, 10, "ch35")
        enemyLv.setDisplaySize(enemyLv.displayWidth / 1.5, enemyLv.displayHeight / 1.5).setOrigin(0)

        const enemyLevel = Array.from(this.battleState.enemyMonster.level.toString(), chr => chr.charCodeAt(0));
        enemyLevel.forEach(token => {
            const letter = this.add.image(enemyLv.x + 10 + levelTokenWidth, 10, `ch${token}`);
            letter.setDisplaySize(letter.displayWidth / 1.5, letter.displayHeight / 1.5).setOrigin(0);
            levelTokenWidth += letter.displayWidth;
            this.defenderContainer.add(letter);
        });

        this.defenderContainer.add(enemyLv)
        const defenderTitle = Array.from(this.battleState.enemyMonster.title, chr => chr.charCodeAt(0));
        defenderTitle.forEach(token => {
            const letter = this.add.image(10 + defenderTokenWidth, 10, `c${token}`);
            letter.setDisplaySize(letter.displayWidth / 1.5, letter.displayHeight / 1.5).setOrigin(0);
            defenderTokenWidth += letter.displayWidth;
            this.defenderContainer.add(letter);
        });
        const DEFENDER_HP_BG = this.add.image(2.5, 40, "hpbar_big_bg");
        DEFENDER_HP_BG.setDisplaySize(DEFENDER_HP_BG.displayWidth / 1.5, DEFENDER_HP_BG.displayHeight / 1.5).setOrigin(0);
        const DEFENDER_HP = this.add.image(2.5, 40, "hpbar_big_fill");
        DEFENDER_HP.setDisplaySize(DEFENDER_HP.displayWidth / 1.5, DEFENDER_HP.displayHeight / 1.5)
            .setOrigin(0);
        DEFENDER_HP.name = "hpbar_fill_green";
        this.defenderContainer.add([DEFENDER_HP_BG, DEFENDER_HP]);
        this.updateEnemyHp();

        this.tweens.add({
            targets: this.defenderContainer,
            x: ENEMY_PANE.x,
            duration: 400,
            ease: 'Power2'
        });


        this.turnIndicator = this.add.image(0, 0, "turn_indicator");
        this.turnIndicator.setDisplaySize(this.turnIndicator.displayWidth / 1.5, this.turnIndicator.displayHeight / 1.5)
            .setOrigin(0.5, 0.5)
            .setDepth(1);
        this.turnIndicator.setPosition(ATTACKRT_POS.x, ATTACKRT_POS.y);

        this.tweens.add({
            targets: this.turnIndicator,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 800,
            ease: 'Sine.easeInOut'
        });





        this.itemsButton = this.add.image(395, 5, "btn_items");
        this.itemsButton.setDisplaySize(this.itemsButton.displayWidth / 1.5, this.itemsButton.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(1);

        this.catchButton = this.add.image(0, 0, "btn_catch");
        this.catchButton.setDisplaySize(this.catchButton.displayWidth / 1.5, this.catchButton.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(1);

        this.escapeButton = this.add.image(-this.catchButton.displayWidth, 0, "btn_escape");
        this.escapeButton.setDisplaySize(this.escapeButton.displayWidth / 1.5, this.escapeButton.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(1);



        this.moreButton = this.add.image(-100, OPTIONS_POS_Y, "btn_more");
        this.moreButton.setDisplaySize(this.moreButton.displayWidth / 1.5, this.moreButton.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5, 1);
        this.backButton = this.add.image(40, OPTIONS_POS_Y, "btn_back");
        this.backButton.setDisplaySize(this.backButton.displayWidth / 1.5, this.backButton.displayHeight / 1.5)
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5, 1)
            .setDepth(-1);

        this.uiShield = this.add.rectangle(20, OPTIONS_POS_Y, 1000, 100, 0x000000, 0).setDepth(106).setOrigin(0.5, 1);

        this.moreOptions = this.add.container(395, 1000, [this.catchButton, this.escapeButton]).setDepth(101);
        this.skillContainer = this.add.container(0, OPTIONS_POS_Y, [this.itemsButton]);
        this.skillContainer.setDepth(105);





        this.moreButton.on("pointerup", () => {
            this.createOverlay();
            this.backButton.setDepth(101);
            this.tweens.add({
                targets: this.skillContainer,
                y: 1000,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {

                    this.tweens.add({
                        targets: this.moreOptions,
                        y: OPTIONS_POS_Y,
                        duration: 200,
                        ease: 'Power2'
                    });
                }
            });

        });

        this.itemsButton.on("pointerup", () => {
            this.scene.launch("ItemScene", { inBattle: true });
        });

        this.catchButton.on("pointerup", () => {
            this.backButton.emit('pointerup');
            this.captureMonster();
        });
        this.backButton.on("pointerup", () => {
            this.backButton.setDepth(-1);

            this.tweens.add({
                targets: this.moreOptions,
                y: 1000,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {

                    this.tweens.add({
                        targets: this.skillContainer,
                        y: OPTIONS_POS_Y,
                        duration: 200,
                        ease: 'Power2',
                        onComplete: () => {
                            this.destroyOverlay();
                        }
                    });
                }
            });
        });









        this.escapeButton.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;

            api.EscapeBattle(this.battleState.battleId).then(result => {
                if (result.success) {
                    console.log(this.world);
                    console.log("successful");
                    this.scene.stop();

                    this.scene.start("MapScene", { map: this.world });
                } else {
                    showNotification(this, result.reason);
                }
            });
        });

        this.lastPlayerHp = this.battleState.playerMonster.hp;
        this.lastEnemyHp = this.battleState.enemyMonster.hp;

        this.preventOptions();

    }


    showPlayerStats() {


        const aimIcon = this.add.image(20, 305, "icon_aim").setOrigin(0).setDisplaySize(70, 30);
        const atkIcon = this.add.image(20, 225, "icon_atk").setOrigin(0).setDisplaySize(70, 30);
        const defIcon = this.add.image(20, 265, "icon_def").setOrigin(0).setDisplaySize(70, 30);
        const spdIcon = this.add.image(14, 344, "icon_speed").setOrigin(0).setDisplaySize(75, 30);

        const atkStatBg = this.add.image(40, 247, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);
        const defStatBg = this.add.image(40, 287, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);
        const aimStatBg = this.add.image(40, 327, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);
        const spdStatBg = this.add.image(40, 367, "hpbar_big_bg").setOrigin(0).setDisplaySize(110, 15);

        const atkStat = this.add.image(40, 247, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);
        const defStat = this.add.image(40, 287, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);
        const aimStat = this.add.image(40, 327, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);
        const spdStat = this.add.image(40, 367, "hpbar_big_fill").setOrigin(0).setDisplaySize(110, 15).setDepth(10);

        const container = this.add.container();
        container.add([spdIcon, aimIcon, atkIcon, defIcon, atkStatBg, aimStatBg, defStatBg, spdStatBg, atkStat, defStat, aimStat]);

        const atkFullWidth = atkStat.width;
        const atkcropWidth = (this.attackerAtk / 100) * atkFullWidth;
        atkStat.setCrop(0, 0, atkcropWidth, atkStat.height);

        const defFullWidth = defStat.width;
        const defcropWidth = (this.attackerDef / 100) * defFullWidth;
        defStat.setCrop(0, 0, defcropWidth, defStat.height);

        const aimFullWidth = aimStat.width;
        const aimcropWidth = (this.attackerAim / 100) * aimFullWidth;
        aimStat.setCrop(0, 0, aimcropWidth, aimStat.height);

        const spdFullWidth = spdStat.width;
        const spdcropWidth = (this.attackerSpd / 100) * spdFullWidth;
        spdStat.setCrop(0, 0, spdcropWidth, spdStat.height);

        this.time.delayedCall(1000, () => {

            this.attackerAtk = this.battleState.playerState.atk;
            this.attackerDef = this.battleState.playerState.def;
            this.attackerAim = this.battleState.playerState.aim;


            const atkFullWidth = atkStat.width;
            const atkcropWidth = (this.attackerAtk / 100) * atkFullWidth;
            atkStat.setCrop(0, 0, atkcropWidth, atkStat.height);

            const defFullWidth = defStat.width;
            const defcropWidth = (this.attackerDef / 100) * defFullWidth;
            defStat.setCrop(0, 0, defcropWidth, defStat.height);

            const aimFullWidth = aimStat.width;
            const aimcropWidth = (this.attackerAim / 100) * aimFullWidth;
            aimStat.setCrop(0, 0, aimcropWidth, aimStat.height);

        });


        this.time.delayedCall(1000, () => {
            container.destroy();
        });


    }


    captureMonster() {
        this.preventOptions();
        const fx = this.add.sprite(-100, 350, "catch_use");
        fx.setDisplaySize(fx.displayWidth / 2, fx.displayHeight / 2).setOrigin(0);
        this.tweens.add({
            targets: fx,
            x: 30,
            duration: 500,
            onComplete: () => {
                fx.anims.play("anim_catch_start", true);
                fx.once("animationcomplete", (animation) => {
                    if (animation.key === "anim_catch_start") {
                        fx.anims.play("anim_catch_status", true);

                        api.CatchMonster(this.battleState.battleId).then(result => {
                            if (result.success) {
                                this.battleState = result.battleState;
                                this.rewards = result.rewards;
                                if (result.capture) {
                                    fx.anims.stop();
                                    fx.setFrame(2);
                                    this.tweens.add({
                                        targets: this.defender,
                                        scale: 0.3,
                                        x: fx.x,
                                        y: fx.y,
                                        duration: 1000,
                                        onComplete: () => {
                                            this.time.delayedCall(1500, () => {
                                                this.createOverlay();
                                                this.victoryAnim();
                                            });
                                        }
                                    });
                                } else {
                                    this.enemyAttack = result.enemyAttack;
                                    fx.anims.play("anim_catch_failed", true);
                                    fx.once("animationcomplete", (anim) => {
                                        if (anim.key === "anim_catch_failed") {
                                            fx.destroy();
                                            this.time.delayedCall(1500, () => {
                                                this.enemySkillEffect();
                                            });
                                        }
                                    });
                                }
                            } else {
                                fx.destroy();
                                this.allowOptions();
                                showNotification(this, result.reason);
                            }
                        }).catch(err => {
                            fx.destroy();
                            this.allowOptions();
                            console.error(err);
                        });
                    }
                });
            }
        });
    }

    deckSuffle() {
        this.cardDeck = this.add.sprite(50, OPTIONS_POS_Y + 40, "deck_shuffle");
        this.cardDeck.setDisplaySize(this.cardDeck.displayWidth / 1.5, this.cardDeck.displayHeight / 1.5).setOrigin(0.5, 1);
        this.cardDeck.anims.play("anim_deck_shuffle");

        this.cardDeck.on('animationcomplete', (animation) => {
            if (animation.key === 'anim_deck_shuffle') {
                this.cardDeck.setFrame(0);
                this.renderActiveSkills(true, true);
            }
        });
    }

    renderActiveSkills(animateShuffle = false, isInitial = false, animateLastCard = false) {
        if (this.skillCards) {
            this.skillCards.forEach(card => card.destroy());
        }
        this.skillCards = [];

        const skillsCount = this.battleState.playerActiveSkills.length;

        if (skillsCount > 3) {
            this.itemsButton.setAlpha(0);
            this.itemsButton.disableInteractive();
        } else {
            this.itemsButton.setAlpha(1);
            this.itemsButton.setInteractive();
        }

        let skill_posX = (skillsCount > 3) ? 360 : 290;
        const spacing = 69;

        this.battleState.playerActiveSkills.forEach((skill, index) => {
            const cardBack = this.add.image(50, 0, "cardback");
            cardBack.setScale(0.66).setOrigin(0.5, 1);
            this.skillContainer.add(cardBack);
            this.skillCards.push(cardBack);

            const targetX = skill_posX - index * spacing - 10;
            const isCooldown = this.battleState.playerCooldownSkill === skill;

            if (animateShuffle) {
                this.tweens.add({
                    targets: cardBack,
                    x: targetX,
                    duration: 400,
                    onComplete: () => {
                        this.tweens.add({
                            targets: cardBack,
                            scaleX: 0,
                            duration: 200,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                cardBack.setTexture(`icon_${skill.split("-")[0]}`);
                                cardBack.scaleY = 0.66;
                                cardBack.scaleX = 0;
                                if (isCooldown) {
                                    cardBack.setAlpha(0.4);
                                    cardBack.setTint(0x555555);
                                }
                                this.tweens.add({
                                    targets: cardBack,
                                    scaleX: 0.66,
                                    duration: 200,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        if (isInitial && this.battleState.playerActiveSkills.length - 1 == index) {
                                            if (this.cardDeck) {
                                                this.cardDeck.destroy();
                                                this.cardDeck = null;
                                            }
                                            this.tweens.add({
                                                targets: this.moreButton,
                                                x: 40,
                                                duration: 300,
                                                ease: 'Power2'
                                            });
                                            if (this.turnIndicator) {
                                                this.turnIndicator.setPosition(this.attacker.x, this.attacker.y);
                                            }
                                            this.time.delayedCall(1200, () => {
                                                this.allowOptions();
                                            });
                                        }
                                        if (isCooldown) {
                                            cardBack.disableInteractive();
                                        } else {
                                            cardBack.setInteractive({ useHandCursor: true });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            } else if (animateLastCard && index === skillsCount - 1) {
                // Animate new skill slot appearing from the items button position
                cardBack.x = 350;
                cardBack.y = 0;
                cardBack.setScale(0);
                cardBack.setAlpha(0);

                this.tweens.add({
                    targets: cardBack,
                    x: targetX,
                    scale: 0.66,
                    alpha: isCooldown ? 0.4 : 1,
                    duration: 500,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: cardBack,
                            scaleX: 0,
                            duration: 250,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                cardBack.setTexture(`icon_${skill.split("-")[0]}`);
                                cardBack.scaleY = 0.66;
                                cardBack.scaleX = 0;
                                if (isCooldown) {
                                    cardBack.setTint(0x555555);
                                }
                                this.tweens.add({
                                    targets: cardBack,
                                    scaleX: 0.66,
                                    duration: 250,
                                    ease: 'Quad.easeOut',
                                    onComplete: () => {
                                        if (isCooldown) {
                                            cardBack.disableInteractive();
                                        } else {
                                            cardBack.setInteractive({ useHandCursor: true });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                cardBack.x = targetX;
                cardBack.setTexture(`icon_${skill.split("-")[0]}`);
                if (isCooldown) {
                    cardBack.setAlpha(0.4);
                    cardBack.setTint(0x555555);
                } else {
                    cardBack.setAlpha(1);
                    cardBack.clearTint();
                }
                if (isCooldown) {
                    cardBack.disableInteractive();
                } else {
                    cardBack.setInteractive({ useHandCursor: true });
                }
            }

            this.setupCardInteraction(cardBack, index);
        });
    }

    setupCardInteraction(cardBack, index) {
        cardBack.on("pointerup", () => {
            const skill = this.battleState.playerActiveSkills[index];
            if (!skill) return;

            if (this.battleState.playerCooldownSkill === skill) {
                showNotification(this, "This skill is on cooldown!");
                return;
            }

            this.preventOptions();

            api.Attack(this.battleState.battleId, skill).then(result => {
                if (result.success) {
                    const isConsumable = skill.split("-")[1] === "consumable";

                    this.battleState = result.battleState;
                    this.playerAttack = result.playerAttack;
                    this.enemyAttack = result.enemyAttack;
                    this.rewards = result.rewards;

                    this.tweens.add({
                        targets: cardBack,
                        y: OPTIONS_POS_Y - 80,
                        duration: 400,
                        ease: 'Power2',
                        onComplete: () => {
                            const fx = this.add.sprite(cardBack.x, cardBack.y, "anim_card_use");
                            fx.setDisplaySize(fx.displayWidth / 1.5, fx.displayHeight / 1.5).setOrigin(0.5, 1);
                            fx.anims.play("anim_card_use");

                            cardBack.y = 1000;

                            fx.on("animationcomplete", () => {
                                fx.destroy();
                                this.playerSkillEffect();

                                if (isConsumable) {
                                    cardBack.destroy();
                                    this.skillCards = this.skillCards.filter(c => c !== cardBack);

                                    const skillsCount = this.battleState.playerActiveSkills.length;
                                    let skill_posX = (skillsCount > 3) ? 360 : 290;
                                    const spacing = 69;

                                    let activeTweens = 0;
                                    if (this.skillCards.length === 0) {
                                        this.renderActiveSkills();
                                    } else {
                                        this.skillCards.forEach((c, idx) => {
                                            activeTweens++;
                                            const newX = skill_posX - idx * spacing - 10;
                                            this.tweens.add({
                                                targets: c,
                                                x: newX,
                                                duration: 400,
                                                ease: 'Power2',
                                                onComplete: () => {
                                                    activeTweens--;
                                                    if (activeTweens === 0) {
                                                        this.renderActiveSkills();
                                                    }
                                                }
                                            });
                                        });
                                    }
                                } else {
                                    cardBack.setTexture("cardback");
                                    this.tweens.add({
                                        targets: cardBack,
                                        y: 0,
                                        duration: 400,
                                        onComplete: () => {
                                            this.tweens.add({
                                                targets: cardBack,
                                                scaleX: 0,
                                                duration: 200,
                                                ease: 'Quad.easeIn',
                                                onComplete: () => {
                                                    const currentSkill = this.battleState.playerActiveSkills[index];
                                                    cardBack.setTexture(`icon_${currentSkill.split("-")[0]}`);
                                                    cardBack.scaleY = 0.66;
                                                    cardBack.scaleX = 0;
                                                    this.tweens.add({
                                                        targets: cardBack,
                                                        scaleX: 0.66,
                                                        duration: 200,
                                                        ease: 'Quad.easeOut'
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    cardBack.setTexture(skill);

                } else {
                    this.allowOptions();
                    showNotification(this, result.reason);
                }
            }).catch(err => {
                this.allowOptions();
            });
        });
    }

    preventOptions() {
        this.uiShield.setInteractive();
        this.uiShield.setAlpha(0.5);
        this.uiShield.on("pointerup", () => { });

        // Dim skills and buttons during enemy turn
        if (this.skillCards) {
            this.skillCards.forEach(card => {
                if (card && card.scene) {
                    card.setAlpha(0.5);
                    card.disableInteractive();
                }
            });
        }
        if (this.moreButton) {
            this.moreButton.setAlpha(0.5);
            this.moreButton.disableInteractive();
        }
        if (this.itemsButton) {
            this.itemsButton.disableInteractive();
            const skillsCount = this.battleState.playerActiveSkills.length;
            if (skillsCount <= 3) {
                this.itemsButton.setAlpha(0.5);
            } else {
                this.itemsButton.setAlpha(0);
            }
        }
    }
    allowOptions() {
        this.uiShield.disableInteractive();
        this.uiShield.setAlpha(0);
        if (this.turnIndicator) {
            this.turnIndicator.setPosition(this.attacker.x, this.attacker.y);
        }

        // Restore skills and buttons alpha on player turn
        if (this.skillCards) {
            this.skillCards.forEach((card, index) => {
                if (card && card.scene) {
                    const skill = this.battleState.playerActiveSkills[index];
                    if (this.battleState.playerCooldownSkill === skill) {
                        card.setAlpha(0.4);
                        card.setTint(0x555555);
                        card.disableInteractive();
                    } else {
                        card.setAlpha(1.0);
                        card.clearTint();
                        card.setInteractive();
                    }
                }
            });
        }
        if (this.moreButton) {
            this.moreButton.setAlpha(1.0);
            this.moreButton.setInteractive();
        }
        if (this.itemsButton) {
            const skillsCount = this.battleState.playerActiveSkills.length;
            if (skillsCount <= 3) {
                this.itemsButton.setAlpha(1.0);
                this.itemsButton.setInteractive();
            } else {
                this.itemsButton.setAlpha(0);
                this.itemsButton.disableInteractive();
            }
        }
    }

    updateHpTween(hpbar, targetHp, maxHp) {
        const fullWidth = hpbar.width;
        const targetCropWidth = Math.max(0, (targetHp / (maxHp || 100)) * fullWidth);

        if (hpbar.cropTween) {
            hpbar.cropTween.stop();
        }

        let currentCropWidth = hpbar._crop ? hpbar._crop.width : fullWidth;

        hpbar.cropTween = this.tweens.addCounter({
            from: currentCropWidth,
            to: targetCropWidth,
            duration: 800,
            ease: 'Quad.easeOut',
            onUpdate: (tween) => {
                hpbar.setCrop(0, 0, tween.getValue(), hpbar.height);
            }
        });
    }

    flashSprite(sprite) {
        if (!sprite) return;
        this.tweens.add({
            targets: sprite,
            alpha: 0.3,
            tint: 0xff0000,
            yoyo: true,
            repeat: 3,
            duration: 100,
            onComplete: () => {
                sprite.setAlpha(1);
                sprite.clearTint();
            }
        });
    }

    updatePlayerHp() {
        let hpbar = this.attackerContainer.getByName("hpbar_fill_green");
        if (hpbar) {
            const newHp = this.battleState.playerMonster.hp;
            this.updateHpTween(hpbar, newHp, this.battleState.playerMonster.maxHP);
            if (newHp < this.lastPlayerHp) {
                this.flashSprite(this.attacker);
            }
            this.lastPlayerHp = newHp;
        }
    }

    updateEnemyHp() {
        let hpbar = this.defenderContainer.getByName("hpbar_fill_green");
        if (hpbar) {
            const newHp = this.battleState.enemyMonster.hp;
            this.updateHpTween(hpbar, newHp, this.battleState.enemyMonster.maxHP);
            if (newHp < this.lastEnemyHp) {
                this.flashSprite(this.defender);
            }
            this.lastEnemyHp = newHp;
        }
    }



    playerSkillEffect() {
        const skillId = this.battleState.playerLastEffect;
        this.playerState = this.battleState.playerState;
        this.enemyState = this.battleState.enemyState;

        let animTarget = this.defender;
        let updateHpCallback = () => this.updateEnemyHp();
        if (this.playerAttack.backfired) {
            animTarget = this.attacker;
            updateHpCallback = () => this.updatePlayerHp();
        }

        if (skillId && !specialSkills.includes(skillId) && !cloudEffects.includes(skillId) && !strikeEffects.includes(skillId) && skillId !== "suck_life" && !this.anims.exists(`anim_${skillId}`)) {
            console.warn(`Animation for skill ${skillId} not found. Skipping.`);
            updateHpCallback();
            this.time.delayedCall(1500, () => {
                this.enemySkillEffect();
            });
            return;
        }

        if (this.playerAttack.missed) {
            //missing animation
            this.tweens.add({
                targets: this.attacker,
                x: this.attacker.x + 80,
                y: this.attacker.y - 80,
                yoyo: true,
                duration: 400
            });

            this.tweens.add({
                targets: this.defender,
                x: this.defender.x + 50,
                yoyo: true,
                duration: 400,
                onComplete: () => {
                    this.time.delayedCall(1500, () => {
                        this.enemySkillEffect();
                    });
                }
            });
        }
        else if (specialSkills.includes(skillId)) {
            const onAnimComplete = () => {
                updateHpCallback();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });
            };

            if (skillId === "scratch") {
                playAnimScratch(this, animTarget.x, animTarget.y - 50, onAnimComplete);
            }
            else if (skillId === "quick_attack") {
                this.attacker.setAlpha(0);
                playQuickAttackAnim(this, this.attacker.x, this.attacker.y, animTarget.x, animTarget.y, onAnimComplete);
            }
            else if (skillId === "rage") {
                const targetMonster = (this.playerAttack.backfired) ? this.defender : this.attacker;
                const fx = rageAnim(this, targetMonster);
                if (this.playerAttack.backfired) {
                    this.stateFlags.enemyRage = true;
                    this.enemyRage = fx;
                } else {
                    this.stateFlags.playerRage = true;
                    this.playerRage = fx;
                }
                fx.fx_front.on("animationcomplete", () => {
                    onAnimComplete();
                });
            }
            else if (skillId === "tentacles" || skillId === "strangle") {
                tentaclesAnim(this, animTarget, skillId, onAnimComplete);
            } else if (skillId === "bubble" || skillId === "bubbles") {
                bubbleAnim(this, animTarget, onAnimComplete);
            } else if (skillId === "flash") {
                flashAnim(this, animTarget, onAnimComplete);
            } else if (skillId === "shockwave" || skillId === "shock_waves" || skillId === "sonic_waves") {
                shockWaveAnim(this, this.attacker.x, this.attacker.y, animTarget.x, animTarget.y, onAnimComplete);
            }
        }
        else if (cloudEffects.includes(skillId)) {
            cloudEffectAnim(this, animTarget.x, animTarget.y - animTarget.displayHeight, skillId, () => {
                updateHpCallback();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });
            });
        } else if (strikeEffects.includes(skillId)) {
            strikeAnim(this, animTarget.x + 50, animTarget.y - animTarget.displayHeight, skillId, () => {
                updateHpCallback();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });
            });
        } else if (skillId === "suck_life") {
            suckLifeAnim(this, animTarget, onAnimComplete);
        }

        else {
            const actor = {
                x: this.defender.x,
                y: this.defender.y
            }
            if (this.playerAttack.backfired || toOwnEffectSkill.includes(skillId)) {
                actor.x = this.attacker.x,
                    actor.y = this.attacker.y
            }
            console.log("player skill ", skillId);
            const fx = this.add.sprite(actor.x, actor.y, `anim_${skillId}`);
            fx.setDisplaySize(fx.displayWidth / 1.5, fx.displayHeight / 1.5).setDepth(105)
                .setOrigin(0.5, 1);

            fx.anims.play(`anim_${skillId}`, true);

            fx.on("animationcomplete", () => {
                updateHpCallback();
                fx.destroy();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });

            });
        }

        if (this.battleState.playerState.atk - this.attackerAtk > 0 || this.battleState.playerState.def - this.attackerDef > 0 || this.battleState.playerState.aim - this.attackerAim > 0) {
            this.showPlayerStats();
        }
        //checks for states
        this.time.delayedCall(1500, () => {
            updatePlayerState(this);
        });

    }


    enemySkillEffect() {
        if (this.enemyAttack == null) {
            if (this.battleState.status === 2) {
                if (this.battleState.victory) {
                    this.time.delayedCall(2000, () => {
                        this.victoryAnim();
                        console.log("victory");
                    });
                } else {
                    this.time.delayedCall(2000, () => {
                        this.defeatAnim();
                        console.log("defeat");
                    });
                }
            }
            return;
        }

        if (this.turnIndicator) {
            this.turnIndicator.setPosition(this.defender.x, this.defender.y);
        }

        this.time.delayedCall(1200, () => {
            this.executeEnemySkill();
        });
    }

    executeEnemySkill() {
        const skillId = this.battleState.enemyLastEffect;

        let animTarget = this.attacker;
        let updateHpCallback = () => this.updatePlayerHp();
        if (this.enemyAttack.backfired) {
            animTarget = this.defender;
            updateHpCallback = () => this.updateEnemyHp();
        }

        const onEnemyAnimComplete = () => {
            updateHpCallback();
            this.time.delayedCall(1500, () => {
                updateEnemyState(this);
                if (this.battleState.status === 2) {
                    this.time.delayedCall(1000, () => {
                        if (this.battleState.victory) {
                            this.victoryAnim();
                        } else {
                            this.defeatAnim();
                        }
                    });
                } else {
                    if (this.turnIndicator) {
                        this.turnIndicator.setPosition(this.attacker.x, this.attacker.y);
                    }
                    this.time.delayedCall(1200, () => {
                        this.allowOptions();
                    });
                }
            });
        };

        if (skillId && !specialSkills.includes(skillId) && !cloudEffects.includes(skillId) && !strikeEffects.includes(skillId) && skillId !== "suck_life" && !this.anims.exists(`anim_${skillId}`)) {
            console.warn(`Animation for skill ${skillId} not found. Skipping.`);
            onEnemyAnimComplete();
            return;
        }

        if (this.enemyAttack.missed) {
            console.log("enemy missed");
            //miss animation
            this.tweens.add({
                targets: this.defender,
                x: this.defender.x - 80,
                y: this.defender.y + 80,
                yoyo: true,
                duration: 400,
            });

            this.tweens.add({
                targets: this.attacker,
                x: this.attacker.x - 50,
                yoyo: true,
                duration: 400,
                onComplete: () => {
                    onEnemyAnimComplete();
                }
            });

        }
        else if (specialSkills.includes(skillId)) {

            if (skillId === "scratch") {
                console.log("enemy scratch");
                playAnimScratch(this, animTarget.x, animTarget.y - 50, onEnemyAnimComplete);
            }
            else if (skillId === "quick_attack") {
                console.log("enemy quick attack");
                this.defender.setAlpha(0);
                playQuickAttackAnim(this, this.defender.x, this.defender.y, animTarget.x, animTarget.y, onEnemyAnimComplete);
            }
            else if (skillId === "rage") {
                const targetMonster = (this.enemyAttack.backfired) ? this.attacker : this.defender;
                const fx = rageAnim(this, targetMonster);
                if (this.enemyAttack.backfired) {
                    this.stateFlags.playerRage = true;
                    this.playerRage = fx;
                } else {
                    this.stateFlags.enemyRage = true;
                    this.enemyRage = fx;
                }
                fx.fx_front.on("animationcomplete", () => {
                    onEnemyAnimComplete();
                });
            }
            else if (skillId === "tentacles" || skillId === "strangle") {
                tentaclesAnim(this, animTarget, skillId, onEnemyAnimComplete);
            } else if (skillId === "bubble" || skillId === "bubbles") {
                bubbleAnim(this, animTarget, onEnemyAnimComplete);
            } else if (skillId === "flash") {
                flashAnim(this, animTarget, onEnemyAnimComplete);
            } else if (skillId === "shockwave" || skillId === "shock_waves" || skillId === "sonic_waves") {
                shockWaveAnim(this, this.defender.x, this.defender.y, animTarget.x, animTarget.y, onEnemyAnimComplete);
            }


        } else if (cloudEffects.includes(skillId)) {
            cloudEffectAnim(this, animTarget.x, animTarget.y - animTarget.displayHeight, skillId, onEnemyAnimComplete);
        } else if (strikeEffects.includes(skillId)) {
            strikeAnim(this, animTarget.x + 50, animTarget.y - animTarget.displayHeight, skillId, onEnemyAnimComplete);
        } else if (skillId === "suck_life") {
            suckLifeAnim(this, animTarget, onAnimComplete);
        }

        else {
            const actor = {
                x: this.attacker.x,
                y: this.attacker.y
            }
            if (this.enemyAttack.backfired || toOwnEffectSkill.includes(skillId)) {
                actor.x = this.defender.x,
                    actor.y = this.defender.y
            }
            console.log("enemy skill ", skillId);
            const fx = this.add.sprite(actor.x, actor.y, `anim_${skillId}`).setDepth(105);
            fx.setDisplaySize(fx.displayWidth / 1.5, fx.displayHeight / 1.5)
                .setOrigin(0.5, 1);

            fx.anims.play(`anim_${skillId}`, true);

            fx.on("animationcomplete", () => {
                fx.destroy();
                onEnemyAnimComplete();
            });
        }
    }


    victoryAnim() {
        this.createOverlay();

        const superlative = this.add.image(120, -100, "superlative2")
            .setOrigin(0, 0)
            .setDisplaySize(155, 35)
            .setDepth(100)
            .setAlpha(0);

        const youWin = this.add.image(90, -100, "you_win")
            .setOrigin(0, 0)
            .setDisplaySize(220, 50)
            .setDepth(100)
            .setAlpha(0);

        this.tweens.add({
            targets: superlative,
            y: 175,
            alpha: 1,
            duration: 800,
            ease: "Back.out"
        });

        this.tweens.add({
            targets: youWin,
            y: 220,
            alpha: 1,
            delay: 300,
            duration: 800,
            ease: "Back.out",
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: [superlative, youWin],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            superlative.destroy();
                            youWin.destroy();

                            MonsterUpgradeScreen(this, this.battleState.playerMonster, () => {
                                const rewardsContainer = this.add.container(0, 0).setDepth(101).setAlpha(0);

                                const rewardsBg = this.add.image(65, 450, "rewards_modal")
                                    .setOrigin(0, 0)
                                    .setDisplaySize(270, 95);
                                rewardsContainer.add(rewardsBg);

                                const formatRewardAmount = (rewardId, amount) => {
                                    const isCurrency = ["gold", "eggs", "ton", "toncoin"].includes(rewardId.toLowerCase());
                                    if (isCurrency) {
                                        if (amount % 1 === 0) {
                                            return amount.toFixed(0);
                                        } else {
                                            return parseFloat(amount.toFixed(2)).toString();
                                        }
                                    } else {
                                        return Math.floor(amount).toString();
                                    }
                                };

                                const getRewardImageKey = (rewardId) => {
                                    const key = `rewards_${rewardId.toLowerCase()}`;
                                    if (this.textures.exists(key)) {
                                        return key;
                                    }
                                    const fallbackKey = `item_${rewardId.toLowerCase()}`;
                                    if (this.textures.exists(fallbackKey)) {
                                        return fallbackKey;
                                    }
                                    const fallbackItem = `item_${rewardId}`;
                                    if (this.textures.exists(fallbackItem)) {
                                        return fallbackItem;
                                    }
                                    return "rewards_gold";
                                };

                                const itemSize = 60;
                                const spacing = 10;
                                const rewards = Object.entries(this.rewards || {});
                                const count = rewards.length;
                                const totalWidth = count * itemSize + (count - 1) * spacing;
                                const startX = rewardsBg.x + (rewardsBg.displayWidth - totalWidth) / 2;

                                rewards.forEach(([rewardId, amount], index) => {
                                    const x = startX + index * (itemSize + spacing);
                                    const y = rewardsBg.y + rewardsBg.displayHeight / 2;

                                    const itemBg = this.add.image(x, y, "reward_slot")
                                        .setOrigin(0, 0.5)
                                        .setDisplaySize(itemSize, itemSize);

                                    const item = this.add.image(x + itemSize / 2, y, getRewardImageKey(rewardId))
                                        .setDisplaySize(45, 45);

                                    const formattedAmount = formatRewardAmount(rewardId, amount);
                                    const countText = this.add.text(x + itemSize - 8, y + 20, formattedAmount, {
                                        fontFamily: "Lilita One, sans-serif",
                                        fontSize: "14px",
                                        color: "#ffffff"
                                    }).setOrigin(1, 1);
                                    countText.setStroke("#000000", 3);

                                    rewardsContainer.add([itemBg, item, countText]);
                                });

                                const okBtn = this.add.image(165, 535, "btn_ok")
                                    .setOrigin(0)
                                    .setDisplaySize(70, 35)
                                    .setInteractive({ useHandCursor: true });

                                okBtn.on("pointerup", (pointer) => {
                                    if (!checkClick(pointer)) return;

                                    this.cameras.main.fadeOut(500, 0, 0, 0);
                                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                                        this.scene.start("MapScene", { map: this.world });
                                    });
                                });
                                rewardsContainer.add(okBtn);

                                rewardsContainer.setScale(0.8);
                                rewardsContainer.setPosition(this.scale.width * 0.1, this.scale.height * 0.1);
                                this.tweens.add({
                                    targets: rewardsContainer,
                                    alpha: 1,
                                    scale: 1,
                                    x: 0,
                                    y: 0,
                                    duration: 500,
                                    ease: "Back.out"
                                });
                            });
                        }
                    });
                });
            }
        });
    }


    defeatAnim() {
        this.createOverlay();

        const defeatBanner = this.add.image(this.scale.width / 2, -100, "defeat_banner")
            .setOrigin(0.5)
            .setDepth(100)
            .setAlpha(0);

        defeatBanner.setDisplaySize(defeatBanner.displayWidth / 2, defeatBanner.displayHeight / 2);

        this.tweens.add({
            targets: defeatBanner,
            y: 250,
            alpha: 1,
            duration: 800,
            ease: "Back.out",
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: defeatBanner,
                        alpha: 0,
                        y: 350,
                        duration: 500,
                        onComplete: () => {
                            defeatBanner.destroy();

                            MonsterUpgradeScreen(this, this.battleState.playerMonster, () => {
                                this.cameras.main.fadeOut(500, 0, 0, 0);
                                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                                    this.scene.start("MapScene", { map: this.world });
                                });
                            });
                        }
                    });
                });
            }
        });
    }


}

function suckLifeAnim(scene, target, callback) {
    const fx = scene.add.sprite(target.x, target.y, "anim_suck_life");
    fx.anims.play("anim_suck_life");
    fx.setDepth(102);

    scene.tweens.add({
        targets: fx,
        x: target.x - 30,
        y: target.y - 20,
        duration: 1200,

    });

    fx.on("animationcomplete", () => {
        fx.destroy();
        callback();
    });


}


function tentaclesAnim(scene, target, animKey, callback) {

    const tentaclesTop = scene.add.image(target.x, target.y - 30, animKey + "_top").setDepth(105);
    tentaclesTop.setDisplaySize(tentaclesTop.displayWidth / 1.5, tentaclesTop.displayHeight / 1.5);

    const tentaclesBack = scene.add.image(tentaclesTop.x, tentaclesTop.y + 12, animKey + "_back").setDepth(104);
    const tentaclesBack2 = scene.add.image(tentaclesTop.x, tentaclesTop.y - 12, animKey + "_back").setDepth(104);

    tentaclesBack.setDisplaySize(tentaclesBack.displayWidth / 1.5, tentaclesBack.displayHeight / 1.5);
    tentaclesBack2.setDisplaySize(tentaclesBack2.displayWidth / 1.5, tentaclesBack2.displayHeight / 1.5);


    scene.tweens.add({
        targets: [tentaclesTop, tentaclesBack, tentaclesBack2],
        scale: 0.4,
        duration: 400,
        onComplete: () => {

            scene.time.delayedCall(1000, () => {
                tentaclesBack.destroy();
                tentaclesBack2.destroy();
                tentaclesTop.destroy();
                callback();
            })

        }
    });

    scene.tweens.add({
        targets: target,
        displayWidth: target.displayWidth - 20,
        duration: 1200,
        delay: 150,
        yoyo: true
    });
}





function bubbleAnim(scene, target, callback) {
    for (let i = 0; i < 4; i++) {
        scene.time.delayedCall(i * 50, () => {
            const bubble = scene.add.sprite((target.x - 40) + i * 15, target.y - 30, "anim_bubbles").setDepth(105);
            // bubble.anims.play("anim_bubbles");



            scene.tweens.add({
                targets: bubble,
                y: target.y + 20,
                duration: 300,
                yoyo: true,
                repeat: 5,
                onComplete: () => { bubble.destroy(); callback(); }
            });

            // bubble.on("animationcomplete", () => {
            //     bubble.destroy()
            // });
        });
    }
}
function flashAnim(scene, target, callback) {
    scene.cameras.main.flash(1000, 255, 255, 255);

    target.setTint(0xffffff);

    scene.tweens.add({
        targets: target,
        scaleX: 0.9,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        onComplete: () => {
            scene.tweens.add({
                targets: target,
                alpha: 0.3,
                duration: 250,
                yoyo: true,
                repeat: 3,
                onComplete: () => { target.clearTint(); callback(); }
            });

        }
    });
}

function shockWaveAnim(scene, playerX, playerY, enemyX, enemyY, callback) {
    const fx = scene.add.sprite(playerX, playerY, "anim_shockwave").setDepth(105);
    fx.setDisplaySize(fx.displayWidth / 1.5, fx.displayHeight / 1.5);

    fx.anims.play("anim_shockwave", 1);

    scene.tweens.add({
        targets: fx,
        x: enemyX,
        y: enemyY,
        duration: 1000,
        onComplete: () => {
            fx.destroy();
            callback();
        }
    })
}


function playQuickAttackAnim(scene, x1, y1, x2, y2, callback) {
    const disappearFx = scene.add.sprite(x1 - 20, y1 - 50, "anim_quick_disappear").setDepth(105);
    disappearFx.setDisplaySize(disappearFx.displayWidth / 1.5, disappearFx.displayHeight / 1.5);

    disappearFx.anims.play("anim_quick_disappear");
    disappearFx.on("animationcomplete", () => {
        const quickPunchFx = scene.add.sprite(x2 - 20, y2 - 50, "anim_quick_punch").setDepth(105);
        quickPunchFx.setDisplaySize(quickPunchFx.displayWidth / 1.5, quickPunchFx.displayHeight / 1.5);

        quickPunchFx.anims.play("anim_quick_punch");

        quickPunchFx.on("animationcomplete", () => {
            disappearFx.destroy();
            quickPunchFx.destroy();
            scene.attacker.setAlpha(1);
            scene.defender.setAlpha(1);
            callback();
        });
    })
}


function cloudEffectAnim(scene, targetX, targetY, animKey, callback) {
    const cloud1 = scene.add.image(targetX - 100, targetY, animKey).setDepth(105);
    const cloud2 = scene.add.image(targetX + 100, targetY, animKey).setDepth(105);

    cloud1.setDisplaySize(cloud1.displayWidth / 1.5, cloud1.displayHeight / 1.5);
    cloud2.setDisplaySize(cloud2.displayWidth / 1.5, cloud2.displayHeight / 1.5);

    scene.tweens.add({
        targets: cloud1,
        x: targetX - 30,
        duration: 400,
        onComplete: () => {
            scene.tweens.add({
                targets: cloud1,
                x: targetX + 5,
                y: targetY + 2,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: () => { cloud1.destroy() }
            })
        }
    });

    scene.tweens.add({
        targets: cloud2,
        x: targetX + 30,
        duration: 400,
        onComplete: () => {
            scene.tweens.add({
                targets: cloud2,
                x: targetX + 5,
                y: targetY + 2,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: () => { cloud2.destroy(); callback(); }
            })
        }
    });
}

function strikeAnim(scene, targetX, targetY, skillId, callback) {

    for (let i = 0; i < 15; i++) {

        const obj = scene.add.image(
            targetX + i * Phaser.Math.Between(1, 30),
            targetY - i * Phaser.Math.Between(1, 30),
            skillId
        ).setDepth(105);
        obj.setDisplaySize(obj.displayWidth / 1.5, obj.displayHeight / 1.5);

        obj.setScale(0.7);
        obj.setAngle(-160);

        scene.tweens.add({
            targets: obj,
            x: '-=180',
            y: '+=180',
            duration: 800,
            delay: i * 50,
            ease: 'Linear',
            onComplete: () => {
                scene.time.delayedCall(0, () => {
                    obj.destroy();
                    callback();
                });
            }
        });
    }

}

function playAnimScratch(scene, x, y, callback) {
    const totalSlashes = 3;
    const scratch1 = scene.add.image(x - 20, y - 20, 'slash').setDepth(105);
    const scratch0 = scene.add.image(x, y, 'slash').setDepth(105);
    const scratch2 = scene.add.image(x + 20, y + 20, 'slash').setDepth(105);
    scratch0.setDisplaySize(scratch0.displayWidth / 1.5, scratch0.displayHeight / 1.5);
    scratch0.setAngle(-45);

    scratch1.setDisplaySize(scratch1.displayWidth / 1.5, scratch1.displayHeight / 1.5);
    scratch1.setAngle(-45);

    scratch2.setDisplaySize(scratch2.displayWidth / 1.5, scratch2.displayHeight / 1.5);
    scratch2.setAngle(-45);

    // START at full size (No setScale 0)
    scratch0.setAlpha(1);
    scratch1.setAlpha(1);
    scratch2.setAlpha(1);


    scene.tweens.add({
        targets: [scratch0, scratch1, scratch2],
        scaleY: 0,
        scaleX: 1.1,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.in',
        onComplete: (tween, targets) => {
            targets.forEach(scratch => scratch.destroy());
            callback();
        }
    });



}



function updatePlayerState(scene) {
    if (!scene.playerState) {
        scene.playerState = scene.battleState.playerState;
    }
    if (!scene.enemyState) {
        scene.enemyState = scene.battleState.enemyState;
    }

    // Manage Rage status
    if (scene.playerState.rage && !scene.stateFlags.playerRage) {
        scene.stateFlags.playerRage = true;
        scene.playerRage = rageAnim(scene, scene.attacker);
    } else if (!scene.playerState.rage && scene.stateFlags.playerRage) {
        scene.stateFlags.playerRage = false;
        if (scene.playerRage) {
            if (scene.playerRage.fx_front) scene.playerRage.fx_front.destroy();
            if (scene.playerRage.fx_back) scene.playerRage.fx_back.destroy();
            scene.playerRage = null;
        }
    }

    if (scene.enemyState.rage && !scene.stateFlags.enemyRage) {
        scene.stateFlags.enemyRage = true;
        scene.enemyRage = rageAnim(scene, scene.defender);
    } else if (!scene.enemyState.rage && scene.stateFlags.enemyRage) {
        scene.stateFlags.enemyRage = false;
        if (scene.enemyRage) {
            if (scene.enemyRage.fx_front) scene.enemyRage.fx_front.destroy();
            if (scene.enemyRage.fx_back) scene.enemyRage.fx_back.destroy();
            scene.enemyRage = null;
        }
    }

    if (scene.playerState.hypno && !scene.stateFlags.playerHypno) {
        if (scene.playerAttack && scene.playerAttack.backfired) {
            scene.stateFlags.playerHypno = true;
            scene.playerHypno = scene.add.sprite(scene.attacker.x - 10, scene.attacker.y - scene.attacker.displayHeight, "hypno_fx").setDepth(105);
            scene.playerHypno.setDisplaySize(scene.playerHypno.displayWidth / 1.5, scene.playerHypno.displayHeight / 1.5);
            scene.tweens.add({
                targets: scene.playerHypno,
                angle: 360,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }
    else if (scene.enemyState.hypno && !scene.stateFlags.enemyHypno) {
        if (scene.playerAttack && !scene.playerAttack.backfired) {
            scene.stateFlags.enemyHypno = true;
            scene.enemyHypno = scene.add.sprite(scene.defender.x - 10, scene.defender.y - scene.defender.displayHeight, "hypno_fx").setDepth(105);
            scene.enemyHypno.setDisplaySize(scene.enemyHypno.displayWidth / 1.5, scene.enemyHypno.displayHeight / 1.5);
            scene.tweens.add({
                targets: scene.enemyHypno,
                angle: 360,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    if (scene.playerState.sick && !scene.stateFlags.playerSick) {
        if (scene.playerAttack && scene.playerAttack.backfired) {
            scene.stateFlags.playerSick = true;
            scene.playerSick = scene.add.sprite(scene.attacker.x + 20, scene.attacker.y - scene.attacker.displayHeight, "anim_sick_fx").setDepth(105);
            scene.playerSick.setDisplaySize(scene.playerSick.displayWidth / 1.5, scene.playerSick.displayHeight / 1.5);
            scene.playerSick.anims.play("anim_sick_fx");
        }
    }
    else if (scene.enemyState.sick && !scene.stateFlags.enemySick) {
        if (scene.playerAttack && !scene.playerAttack.backfired) {
            scene.stateFlags.enemySick = true;
            scene.enemySick = scene.add.sprite(scene.defender.x + 20, scene.defender.y - scene.defender.displayHeight, "anim_sick_fx").setDepth(105);
            scene.enemySick.setDisplaySize(scene.enemySick.displayWidth / 1.5, scene.enemySick.displayHeight / 1.5);
            scene.enemySick.anims.play("anim_sick_fx");
        }
    }
}

function rageAnim(scene, monster) {
    const fx_front = scene.add.sprite(monster.x, monster.y, "rage_fx_front").setDepth(1); // beneath monster depth (1)
    fx_front.setDisplaySize(fx_front.displayWidth / 1.5, fx_front.displayHeight / 1.5).setOrigin(0.5, 1);

    const fx_back = scene.add.sprite(monster.x, monster.y, "rage_fx_back").setDepth(105); //after monster depth
    fx_back.setDisplaySize(fx_back.displayWidth / 1.5, fx_back.displayHeight / 1.5).setDepth(0.5, 1);

    fx_front.anims.play("anim_rage_fx_front");

    fx_front.on("animationcomplete", () => {
        fx_back.anims.play("anim_rage_fx_back"); //anim rage back will run infinitely until players next turn
    });

    return { fx_front, fx_back };
}

function updateEnemyState(scene) {
    if (!scene.playerState) {
        scene.playerState = scene.battleState.playerState;
    }
    if (!scene.enemyState) {
        scene.enemyState = scene.battleState.enemyState;
    }

    // Manage Rage status
    if (scene.playerState.rage && !scene.stateFlags.playerRage) {
        scene.stateFlags.playerRage = true;
        scene.playerRage = rageAnim(scene, scene.attacker);
    } else if (!scene.playerState.rage && scene.stateFlags.playerRage) {
        scene.stateFlags.playerRage = false;
        if (scene.playerRage) {
            if (scene.playerRage.fx_front) scene.playerRage.fx_front.destroy();
            if (scene.playerRage.fx_back) scene.playerRage.fx_back.destroy();
            scene.playerRage = null;
        }
    }

    if (scene.enemyState.rage && !scene.stateFlags.enemyRage) {
        scene.stateFlags.enemyRage = true;
        scene.enemyRage = rageAnim(scene, scene.defender);
    } else if (!scene.enemyState.rage && scene.stateFlags.enemyRage) {
        scene.stateFlags.enemyRage = false;
        if (scene.enemyRage) {
            if (scene.enemyRage.fx_front) scene.enemyRage.fx_front.destroy();
            if (scene.enemyRage.fx_back) scene.enemyRage.fx_back.destroy();
            scene.enemyRage = null;
        }
    }

    if (scene.playerState.hypno && !scene.stateFlags.playerHypno) {
        if (scene.enemyAttack && !scene.enemyAttack.backfired) {
            scene.stateFlags.playerHypno = true;
            scene.playerHypno = scene.add.sprite(scene.attacker.x - 10, scene.attacker.y - scene.attacker.displayHeight, "hypno_fx").setDepth(105);
            scene.playerHypno.setDisplaySize(scene.playerHypno.displayWidth / 1.5, scene.playerHypno.displayHeight / 1.5);
            scene.tweens.add({
                targets: scene.playerHypno,
                angle: 360,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }
    else if (scene.enemyState.hypno && !scene.stateFlags.enemyHypno) {
        if (scene.enemyAttack && scene.enemyAttack.backfired) {
            scene.stateFlags.enemyHypno = true;
            scene.enemyHypno = scene.add.sprite(scene.defender.x - 10, scene.defender.y - scene.defender.displayHeight, "hypno_fx").setDepth(105);
            scene.enemyHypno.setDisplaySize(scene.enemyHypno.displayWidth / 1.5, scene.enemyHypno.displayHeight / 1.5);
            scene.tweens.add({
                targets: scene.enemyHypno,
                angle: 360,
                duration: 2000,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    if (scene.playerState.sick && !scene.stateFlags.playerSick) {
        if (scene.enemyAttack && !scene.enemyAttack.backfired) {
            scene.stateFlags.playerSick = true;
            scene.playerSick = scene.add.sprite(scene.attacker.x + 20, scene.attacker.y - scene.attacker.displayHeight, "anim_sick_fx").setDepth(105);
            scene.playerSick.setDisplaySize(scene.playerSick.displayWidth / 1.5, scene.playerSick.displayHeight / 1.5);
            scene.playerSick.anims.play("anim_sick_fx", true);
        }
    }
    else if (scene.enemyState.sick && !scene.stateFlags.enemySick) {
        if (scene.enemyAttack && scene.enemyAttack.backfired) {
            scene.stateFlags.enemySick = true;
            scene.enemySick = scene.add.sprite(scene.defender.x + 20, scene.defender.y - scene.defender.displayHeight, "anim_sick_fx").setDepth(105);
            scene.enemySick.setDisplaySize(scene.enemySick.displayWidth / 1.5, scene.enemySick.displayHeight / 1.5);
            scene.enemySick.anims.play("anim_sick_fx", true);
        }
    }
}
