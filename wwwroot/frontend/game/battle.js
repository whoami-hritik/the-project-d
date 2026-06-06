import { state } from "../state.js";
import * as api from "../webapp/api.js";
import { ItemScene } from "./item.js";
import { checkClick } from "./game.js";


const ATTACKRT_POS = {
    x : 100,
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

const specialSkills = ["scratch", "quick_attack", "rage", "confuse"]

export class BattleScene extends Phaser.Scene{
    constructor(){
        super({ key: "BattleScene"});
    }

    init(data){
        this.world = data.map;
        this.node = data.node;
        this.player = state.seletdMonster;
        this.battleState = data.battleState;
        console.log(this.battleState);
    }

    create(){
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.initalizeBg();
        this.deckSuffle();

        this.events.on("useItem", this.useItem, this);

        this.stateFlags = {
            playerSick : false,
            enemySick : false,
            playerHypno : false,
            enemyHypno : false,
            playerRage : false,
            enemyRage : false
        }
    }


    useItem(item){
        console.log("items ", item);
        if (item === "monstaBall"){
            this.captureMonster();
        }
    }

    createOverlay(){
        this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5)
            .setOrigin(0)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive();

        this.overlay.on('pointerdown', () => {
           
        });
    }

    destroyOverlay(){
        this.overlay.destroy();
    }

    initalizeBg(){
        const img = this.add.image(0,0, this.node.bgs).setOrigin(0);
        img.setDisplaySize(this.width, this.height);
        

        //add attacker monster
        this.attacker = this.add.sprite(-300, ATTACKRT_POS.y, `back_${this.battleState.playerMonster.id}`);
        this.attacker.setDisplaySize(this.attacker.displayWidth/1.5, this.attacker.displayHeight/1.5).setOrigin(0.5,1);

        this.tweens.add({
            targets: this.attacker,
            x: ATTACKRT_POS.x,
            duration: 300,
            ease: 'Power2'
        });
                        

        this.defender = this.add.sprite(600, DEFFENDER_POS.y, `front_${this.battleState.enemyMonster.id}`);
        this.defender.setDisplaySize(this.defender.displayWidth/1.5, this.defender.displayHeight/1.5).setOrigin(0.5, 1);

        this.tweens.add({
            targets: this.defender,
            x: DEFFENDER_POS.x,
            duration: 300,
            ease: 'Power2'
        });



        
        
        this.attackerContainer = this.add.container(500, PLAYER_PANE.y);

        const attackerPane = this.add.image(0, 0, `pane_big_${this.battleState.playerMonster.kind}`); 
        attackerPane.setDisplaySize(attackerPane.displayWidth/1.5, attackerPane.displayHeight/1.5)
                    .setOrigin(0);
        this.attackerContainer.add(attackerPane);

        const attackerTitle = Array.from(this.battleState.playerMonster.title, chr => chr.charCodeAt(0));
        let attackerTokenWidth = 0;
        attackerTitle.forEach(token => {
            const letter = this.add.image(10 + attackerTokenWidth, 10, `c${token}`);
            letter.setDisplaySize(letter.displayWidth/1.5, letter.displayHeight/1.5).setOrigin(0);
            attackerTokenWidth += letter.displayWidth;
            this.attackerContainer.add(letter);
        });
        const ATTACKER_HP_BG = this.add.image(2.5, 40, "hpbar_big_bg");
        ATTACKER_HP_BG.setDisplaySize(ATTACKER_HP_BG.displayWidth/1.5, ATTACKER_HP_BG.displayHeight/1.5).setOrigin(0);
        const ATTACKER_HP = this.add.image(2.5, 40, "hpbar_big_fill");
        ATTACKER_HP.setDisplaySize(ATTACKER_HP.displayWidth/1.5, ATTACKER_HP.displayHeight/1.5)
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

        const defenderPane = this.add.image(0, 0, `pane_big_${this.battleState.enemyMonster.kind}`);
        defenderPane.setDisplaySize(defenderPane.displayWidth/1.5, defenderPane.displayHeight/1.5)
                    .setOrigin(0);
        this.defenderContainer.add(defenderPane);

        let defenderTokenWidth = 0
        const defenderTitle = Array.from(this.battleState.enemyMonster.title, chr => chr.charCodeAt(0));
        defenderTitle.forEach(token => {
            const letter = this.add.image(10 + defenderTokenWidth, 10, `c${token}`);
            letter.setDisplaySize(letter.displayWidth/1.5, letter.displayHeight/1.5).setOrigin(0);
            defenderTokenWidth += letter.displayWidth;
            this.defenderContainer.add(letter);
        });
        const DEFENDER_HP_BG = this.add.image(2.5, 40, "hpbar_big_bg");
        DEFENDER_HP_BG.setDisplaySize(DEFENDER_HP_BG.displayWidth/1.5, DEFENDER_HP_BG.displayHeight/1.5).setOrigin(0);
        const DEFENDER_HP = this.add.image(2.5, 40, "hpbar_big_fill");
        DEFENDER_HP.setDisplaySize(DEFENDER_HP.displayWidth/1.5, DEFENDER_HP.displayHeight/1.5)
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





        this.itemsButton = this.add.image(395, 5, "btn_items");
        this.itemsButton.setDisplaySize(this.itemsButton.displayWidth/1.5, this.itemsButton.displayHeight/1.5)
                        .setInteractive({useHandCursor: true})
                        .setOrigin(1);

        this.catchButton = this.add.image(0, 0, "btn_catch");
        this.catchButton.setDisplaySize(this.catchButton.displayWidth/1.5, this.catchButton.displayHeight/1.5)
                        .setInteractive({useHandCursor:true})
                        .setOrigin(1);

        this.escapeButton = this.add.image(-this.catchButton.displayWidth, 0, "btn_escape");
        this.escapeButton.setDisplaySize(this.escapeButton.displayWidth/1.5,this.escapeButton.displayHeight/1.5)
                         .setInteractive({useHandCursor:true})
                         .setOrigin(1);



        this.moreButton = this.add.image(-100, OPTIONS_POS_Y, "btn_more");
        this.moreButton.setDisplaySize(this.moreButton.displayWidth/1.5, this.moreButton.displayHeight/1.5)
                       .setInteractive({useHandCursor:true})
                       .setOrigin(0.5,1);
        this.backButton = this.add.image(40, OPTIONS_POS_Y, "btn_back");
        this.backButton.setDisplaySize(this.backButton.displayWidth/1.5, this.backButton.displayHeight/1.5)
                       .setInteractive({useHandCursor:true})
                       .setOrigin(0.5,1)
                       .setDepth(-1);
            
        this.uiShield = this.add.rectangle(20, OPTIONS_POS_Y, 1000, 100, 0x000000, 0).setDepth(102).setOrigin(0.5, 1);
    
        this.moreOptions = this.add.container(395, 1000, [this.catchButton, this.escapeButton]).setDepth(101);
        this.skillContainer = this.add.container(0, OPTIONS_POS_Y, [this.itemsButton]);





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
                if(result.success){
                    console.log(this.world);
                    console.log("successful");
                    this.scene.stop();
                    
                    this.scene.start("MapScene", { map: this.world });
                }
            });
        });
        


    }

    captureMonster(){
            const fx = this.add.sprite(-100, 350, "anim_catch_use");
            fx.setDisplaySize(fx.displayWidth/2, fx.displayHeight/2).setOrigin(0);
            this.tweens.add({
                targets: fx,
                x: 30,
                duration: 500,
                onComplete: () => {
                    fx.anims.play("anim_catch_start", true);
                    fx.on("animationcomplete", (animation) => {
                        if (animation.key == "anim_catch_start"){
                            fx.anims.play("anim_catch_status", true);
                        }
                    })
                    api.CatchMonster(this.battleState.battleId).then(result => {
                        if (result.success){
                            this.battleState = result.battleState;
                            if (result.capture){
                                fx.setFrame(2);
                                this.tweens.add({
                                    targets: this.defender,
                                    scale: 0.3,
                                    x: fx.x,
                                    y: fx.y,
                                    duration: 1000,
                                    onComplete: () => {
                                        //victory
                                        this.time.delayedCall(1000, () => {
                                            this.createOverlay();
                                            this.victoryAnim();
                                        });
                                    }
                                })
                                
                            }else{
                                this.enemyAttack = result.enemyAttack;
                                fx.anims.play("anim_catch_failed", true);
                                fx.on("animationcomplete", (animation) => {
                                    if(animation.key == "anim_catch_failed"){
                                        fx.destroy();
                                        this.time.delayedCall(1500, () => {
                                            this.enemySkillEffect();
                                        });
                                        
                                    }
                                })
                                
                            }
                        }
                    });

                }
            });
            
    }

    deckSuffle(){
        const cardDeck = this.add.sprite(50, OPTIONS_POS_Y+40, "deck_shuffle");
        cardDeck.setDisplaySize(cardDeck.displayWidth/1.5, cardDeck.displayHeight/1.5).setOrigin(0.5,1);
        cardDeck.anims.play("anim_deck_shuffle");


        cardDeck.on('animationcomplete', (animation) => {
            if (animation.key === 'anim_deck_shuffle') {
                cardDeck.setFrame(0);

                let skill_posX = 290;
                
                this.battleState.playerActiveSkills.forEach((skill, index) => {
                    
                    const cardBack = this.add.image(50, 0,  "cardback");
                    cardBack.setScale(0.66).setOrigin(0.5,1);
                    this.skillContainer.add(cardBack);

                    this.tweens.add({
                        targets: cardBack,
                        x: skill_posX - index*((cardBack.displayWidth/1.5)+25) - 10,
                        duration: 400,
                        onComplete: () => {
                            // This will flip the card while keeping its base (bottom) locked in place
                            this.tweens.add({
                                targets: cardBack,
                                scaleX: 0,
                                duration: 200,
                                ease: 'Quad.easeIn', // Slightly slower start for a more natural feel
                                onComplete: () => {
                                    // Swap the texture at the "edge-on" moment
                                    cardBack.setTexture(`icon_${skill.split("-")[0]}`);
                                    cardBack.scaleY = 0.66;
                                    cardBack.scaleX = 0;
                                    this.tweens.add({
                                        targets: cardBack,
                                        scaleX: 0.66,
                                        duration: 200,
                                        ease: 'Quad.easeOut',
                                        onComplete: () => {
                                            if (this.battleState.playerActiveSkills.length-1 == index){
                                                cardDeck.destroy();
                                                this.tweens.add({
                                                    targets: this.moreButton,
                                                    x: 40,
                                                    duration: 300,
                                                    ease: 'Power2'
                                                });
                                            }

                                            //use of abilities
                                            cardBack.setInteractive({useHandCursor: true});
                                        }
                                    });
                                }
                            });

                        }
                    });

                    cardBack.on("pointerup", () => {
                        api.Attack(this.battleState.battleId, this.battleState.playerActiveSkills[index]).then(result => {
                            if (result.success){
                                this.preventOptions();
                                this.battleState = result.battleState;
                                this.playerAttack = result.playerAttack;
                                this.enemyAttack = result.enemyAttack;
                                this.tweens.add({
                                    targets: cardBack,
                                    y: OPTIONS_POS_Y - 80,
                                    duration: 400,
                                    ease: 'Power2',
                                    onComplete: () =>{
                                        const fx = this.add.sprite(cardBack.x, cardBack.y, "anim_card_use");
                                        fx.setDisplaySize(fx.displayWidth/1.5, fx.displayHeight/1.5).setOrigin(0.5, 1);
                                        fx.anims.play("anim_card_use");

                                        cardBack.y = 1000;

                                        fx.on("animationcomplete", () => {
                                            fx.destroy();
                                            cardBack.setTexture("cardback");
                                            this.playerSkillEffect();

                                            this.tweens.add({
                                            targets: cardBack,
                                            y: 0,
                                            duration: 400,
                                            onComplete: () => {
                                               
                                                // This will flip the card while keeping its base (bottom) locked in place
                                                this.tweens.add({
                                                    targets: cardBack,
                                                    scaleX: 0,
                                                    duration: 200,
                                                    ease: 'Quad.easeIn', // Slightly slower start for a more natural feel
                                                    onComplete: () => {
                                                        // enemyAttack()
                                                        

                                                        // Swap the texture at the "edge-on" moment
                                                        cardBack.setTexture(`icon_${this.battleState.playerActiveSkills[index].split("-")[0]}`);
                                                        console.log(this.battleState.playerActiveSkills[index]);
                                                        cardBack.scaleY = 0.66;
                                                        cardBack.scaleX = 0;
                                                        this.tweens.add({
                                                            targets: cardBack,
                                                            scaleX: 0.66,
                                                            duration: 200,
                                                            ease: 'Quad.easeOut',
                                                            onComplete: () => {
                                                                this.allowOptions()

                                                                
                                                            }
                                                        });
                                                    }
                                                });

                                            }
                                        });

                                        });

                                    }
                                })
                                cardBack.setTexture(this.battleState.playerActiveSkills[index]);

                            }
                        });

                    });
                    
                    
                    
                });
            }
        });

        
    }

    preventOptions(){
        this.uiShield.setInteractive();
        this.uiShield.setAlpha(0.5);
        this.uiShield.on("pointerup", () => {});
    }
    allowOptions(){
        this.uiShield.disableInteractive();
        this.uiShield.setAlpha(0);
    }

    updatePlayerHp(){
        let hpbar = this.attackerContainer.getByName("hpbar_fill_green");
        const fullWidth = hpbar.width; 
        const cropWidth = (this.battleState.playerMonster.currentHP / 100) * fullWidth;
        hpbar.setCrop(0, 0, cropWidth, hpbar.height);
    }

    updateEnemyHp(){
        let hpbar = this.defenderContainer.getByName("hpbar_fill_green");
        const fullWidth = hpbar.width; 
        const cropWidth = (this.battleState.enemyMonster.currentHP / 100) * fullWidth;
        hpbar.setCrop(0, 0, cropWidth, hpbar.height);
    }



    playerSkillEffect(){
        const skillId = this.battleState.playerLastEffect;
        this.playerState = this.battleState.playerState;
        this.enemyState = this.battleState.enemyState;

        if (this.playerAttack.missed){
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
        else if(specialSkills.includes(skillId)){
            if (skillId === "scratch"){
                playAnimScratch(this, this.defender.x, this.defender.y-50);
                this.updateEnemyHp();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });
            }
            else if(skillId === "quick_attack"){
                this.attacker.setAlpha(0);
                playQuickAttackAnim(this, this.attacker.x, this.attacker.y, this.defender.x, this.defender.y);
                this.updateEnemyHp();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });
            }
        }else{
            const actor = {
                x: this.defender.x,
                y: this.defender.y
            }
            if(this.playerAttack.backfired){
                actor.x = this.attacker.x,
                actor.y = this.attacker.y
            }
            console.log("player skill ", skillId);
            const fx = this.add.sprite( actor.x, actor.y,  `anim_${skillId}`);
            fx.setDisplaySize(fx.displayWidth/1.5, fx.displayHeight/1.5)
            .setOrigin(0.5,1);

            fx.anims.play(`anim_${skillId}`, true);

            fx.on("animationcomplete", () => {
                this.updateEnemyHp();
                fx.destroy();
                this.time.delayedCall(1500, () => {
                    this.enemySkillEffect();
                });

            });
        }
        

        //checks for states
        this.time.delayedCall(1500, () => {
             updatePlayerState(this);
        });
        
    }
    

    enemySkillEffect(){
        if(this.enemyAttack == null && this.battleState.status == 2){
            if(this.battleState.victory){
                //victory
                console.log("victory")
                return;
            }
            //player lose defeat anim
            console.log("defeat");
            return;
        };
        const skillId = this.battleState.enemyLastEffect;
        if (this.enemyAttack.missed){
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
            });
            
        }
        else if(specialSkills.includes(skillId)){
            
            if (skillId === "scratch"){
                console.log("enemy scratch");
                playAnimScratch(this, this.attacker.x, this.attacker.y-50);
                this.updatePlayerHp();
            }
            else if(skillId === "quick_attack"){
                console.log("enemy quick attack");
                this.defender.setAlpha(0);
                playQuickAttackAnim(this, this.defender.x, this.defender.y, this.attacker.x, this.attacker.y);
                this.updatePlayerHp();
            }

        }else{
            const actor = {
                x: this.attacker.x,
                y: this.attacker.y
            }
            if(this.enemyAttack.backfired){
                actor.x = this.defender.x,
                actor.y = this.defender.y
            }
            console.log("enemy skill ", skillId);
            const fx = this.add.sprite(actor.x, actor.y, `anim_${skillId}`);
            fx.setDisplaySize(fx.displayWidth/1.5, fx.displayHeight/1.5)
            .setOrigin(0.5,1);

            fx.anims.play(`anim_${skillId}`, true);

            fx.on("animationcomplete", () => {
                this.updatePlayerHp();
                fx.destroy();
            });
        }
        this.time.delayedCall(1500, () => {
             updateEnemyState(this);
        });
    }


    victoryAnim(){
        const land = this.add.image(0, 0, "pedestal");
        land.setDisplaySize(land.displayWidth/2, land.displayHeight/2).setOrigin(0);
        
        const container = this.add.container(-100, this.scale.height/2);

        const monster = this.add.image(0,0 , `front_${this.battleState.playerMonster.id}`);
        monster.setDisplaySize(monster.displayWidth/1.5, monster.displayHeight/1.5).setOrigin(0.5, 1);
        monster.setPosition(this.scale.width/2 - monster.displayWidth/2, 40)

        const btn_later = this.add.image(land.displayWidth/2 - 30, 130, "btn_later");
        btn_later.setDisplaySize(btn_later.displayWidth/2, btn_later.displayHeight/2).setInteractive({useHandCursor: true}).setOrigin(0);

        container.add([land, monster, btn_later]);
        container.setDepth(100);

        this.tweens.add({
            targets: container,
            x: this.scale.width/2- land.displayWidth/2,
            duration: 500
        });

        btn_later.on("pointerup", () => {
            this.tweens.add({
                targets: container,
                x: this.scale.width+200,
                duration: 500,
                onComplete: () => {
                    this.time.delayedCall(500, () => {
                        this.scene.stop();
                        this.scene.start("MapScene", { map : this.world })
                    });
                }
            })
        });
        

    }
}

function playQuickAttackAnim(scene, x1, y1, x2, y2){
    const disappearFx = scene.add.sprite(x1-20, y1-50, "anim_quick_disappear");
    disappearFx.setDisplaySize(disappearFx.displayWidth/1.5, disappearFx.displayHeight/1.5);

    disappearFx.anims.play("anim_quick_disappear");
    disappearFx.on("animationcomplete", () => {
        const quickPunchFx = scene.add.sprite(x2-20, y2-50, "anim_quick_punch");
        quickPunchFx.setDisplaySize(quickPunchFx.displayWidth/1.5, quickPunchFx.displayHeight/1.5);

        quickPunchFx.anims.play("anim_quick_punch");

        quickPunchFx.on("animationcomplete", () => {
            disappearFx.destroy();
            quickPunchFx.destroy();
            scene.attacker.setAlpha(1);
            scene.defender.setAlpha(1);
        });
    })
}

function playAnimScratch(scene, x, y) {
    const totalSlashes = 3;
    const scratch1 = scene.add.image(x - 20, y - 20, 'slash');
    const scratch0 = scene.add.image(x , y, 'slash');
    const scratch2 = scene.add.image(x + 20, y + 20, 'slash');
    scratch0.setDisplaySize(scratch0.displayWidth/1.5, scratch0.displayHeight/1.5);
    scratch0.setAngle(-45);

    scratch1.setDisplaySize(scratch1.displayWidth/1.5, scratch1.displayHeight/1.5);
    scratch1.setAngle(-45);

    scratch2.setDisplaySize(scratch2.displayWidth/1.5, scratch2.displayHeight/1.5);
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
        }
    });



}


function updatePlayerState(scene){
    
    if (scene.playerState.hypno && !scene.stateFlags.playerHypno ){
        if (scene.playerAttack.backfired){
            scene.stateFlags.playerHypno = true;
            scene.playerHypno = scene.add.sprite(scene.attacker.x - 10, scene.attacker.y-scene.attacker.displayHeight, "hypno_fx");
            scene.playerHypno.setDisplaySize(scene.playerHypno.displayWidth/1.5, scene.playerHypno.displayHeight/1.5);
            scene.tweens.add({
                    targets: scene.playerHypno,
                    angle: 360,          
                    duration: 2000,      
                    repeat: -1,          
                    ease: 'Linear'       
            });

            // if (scene.stateFlags.playerRage){
            //     scene.stateFlags.playerRage = false;
            //     scene.playerRage.destroy();

            // }
        }
         
    }
    else if (scene.enemyState.hypno && !scene.stateFlags.enemyHypno){
        if (!scene.enemyAttack.backfired){
            scene.stateFlags.enemyHypno = true;
            scene.enemyHypno = scene.add.sprite(scene.defender.x - 10, scene.defender.y - scene.defender.displayHeight, "hypno_fx");
            scene.enemyHypno.setDisplaySize(scene.enemyHypno.displayWidth/1.5, scene.enemyHypno.displayHeight/1.5);
            scene.tweens.add({
                    targets: scene.enemyHypno,
                    angle: 360,          
                    duration: 2000,      
                    repeat: -1,          
                    ease: 'Linear'       
            });

            // if (scene.stateFlags.enemyRage){
            //     scene.stateFlags.enemyRage = false;
            //     scene.enemyRage.destroy();
            // }
        }    
    }

    if (scene.playerState.sick && !scene.stateFlags.playerSick ){
        if (scene.playerAttack.backfired){
            scene.stateFlags.playerSick = true;
            scene.playerSick = scene.add.sprite(scene.attacker.x+ 20, scene.attacker.y-scene.attacker.displayHeight, "anim_sick_fx");
            scene.playerSick.setDisplaySize(scene.playerSick.displayWidth/1.5, scene.playerSick.displayHeight/1.5);
            scene.playerSick.anims.play("anim_sick_fx");

            // if (scene.stateFlags.playerRage){
            //     scene.stateFlags.playerRage = false;
            //     scene.playerRage.destroy();

            // }
        }
         
    }
    else if (scene.enemyState.sick && !scene.stateFlags.enemySick){
        if (!scene.enemyAttack.backfired){
            scene.stateFlags.enemySick = true;
            scene.enemySick = scene.add.sprite(scene.defender.x+ 20, scene.defender.y - scene.defender.displayHeight, "anim_sick_fx");
            scene.enemySick.setDisplaySize(scene.enemySick.displayWidth/1.5, scene.enemySick.displayHeight/1.5);
            scene.enemySick.anims.play("anim_sick_fx");

            // if (scene.stateFlags.enemyRage){
            //     scene.stateFlags.enemyRage = false;
            //     scene.enemyRage.destroy();
            // }
        }    
    }
}



function updateEnemyState(scene){
    if (scene.playerState.hypno && !scene.stateFlags.playerHypno){
        if (!scene.playerAttack.backfired){
            scene.stateFlags.playerHypno = true;
            scene.playerHypno = scene.add.sprite(scene.attacker.x- 10, scene.attacker.y-scene.attacker.displayHeight, "hypno_fx");
            scene.playerHypno.setDisplaySize(scene.playerHypno.displayWidth/1.5, scene.playerHypno.displayHeight/1.5);
            scene.tweens.add({
                    targets: scene.playerHypno,
                    angle: 360,          
                    duration: 2000,      
                    repeat: -1,          
                    ease: 'Linear'       
            });


            // if (scene.stateFlags.playerRage){
            //     scene.stateFlags.playerRage = false;
            //     scene.playerRage.destroy();
            // }
        }
        
    }
    else if (scene.enemyState.hypno && !scene.stateFlags.enemyHypno){
        if (scene.enemyAttack.backfired){
            scene.stateFlags.enemyHypno = true;
            scene.enemyHypno = scene.add.sprite(scene.defender.x - 10, scene.defender.y - scene.defender.displayHeight, "hypno_fx");
            scene.enemyHypno.setDisplaySize(scene.enemyHypno.displayWidth/1.5, scene.enemyHypno.displayHeight/1.5);
            scene.tweens.add({
                    targets: scene.enemyHypno,
                    angle: 360,          
                    duration: 2000,      
                    repeat: -1,          
                    ease: 'Linear'       
            });

            // if (scene.stateFlags.enemyRage){
            //     scene.stateFlags.enemyRage = false;
            //     scene.enemyRage.destroy();
            // }
        }
         
    }


    if (scene.playerState.sick && !scene.stateFlags.playerSick){
        if ( !scene.playerAttack.backfired ){
            scene.stateFlags.playerSick = true;
            scene.playerSick = scene.add.sprite(scene.attacker.x+ 20, scene.attacker.y-scene.attacker.displayHeight, "anim_sick_fx");
            scene.playerSick.setDisplaySize(scene.playerSick.displayWidth/1.5, scene.playerSick.displayHeight/1.5);
            scene.playerSick.anims.play("anim_sick_fx", true);

            // if (scene.stateFlags.playerRage){
            //     scene.stateFlags.playerRage = false;
            //     sick.playerRage.destroy();
            // }
        
        }    
    }
    else if (scene.enemyState.sick && !scene.stateFlags.enemySick){
        if ( scene.enemyAttack.backfired){
            scene.stateFlags.enemySick = true;
            scene.enemySick = scene.add.sprite(scene.defender.x+20, scene.defender.y - scene.defender.displayHeight, "anim_sick_fx");
            scene.enemySick.setDisplaySize(scene.enemySick.displayWidth/1.5, scene.enemySick.displayHeight/1.5);
            scene.enemySick.anims.play("anim_sick_fx", true);

            // if (scene.stateFlags.enemyRage){
            //     scene.stateFlags.enemyRage = false;
            //     //remove rage anim
            //     scene.enemyRage.destroy();
            // }
        }
    }
}
