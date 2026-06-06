
import { state } from "../state.js";
import * as api from "../webapp/api.js"
import { WorldScene } from "./game.js";

let width;
let height;
const OPPONENTWIDTH = 240;
const OPPONENTHEIGHT = 240;
const PLAYERWIDTH = 320;
const PLAYERHEIGHT = 320;
const PADDING = 20;
const DISPLAYBARW = 200;
const DISPLAYBARH = 60;
const skillContainerY = 720;
const skillSlotX = 70;
const HPPADDING = PADDING/2;
const HPBOTTOMPAD = DISPLAYBARH-20;
const HPWIDTH = DISPLAYBARW-PADDING;

const type = {
    "grass" : 0x98b500,
    "stone": 0xAFD5B8,
    "water" : 0x00a8cd,
    "electric" : 0xdebe00, 
    "dark" : 0x9858ed,
    "ice" : 0x0ad2e3,
    "fire" : 0xFF6F00,
    "desert" : 0xEDC9AF,
    "earth" : 0x8B4513,
};
const lineStyle = {
    "grass" : 0xAAC719,
    "stone": 0x96E3A8,
    "fire" : 0xF27D23,
    "water" : 0x19B5D8,
    "electric" : 0xEECF23, 
    "dark" : 0x822DF0,
    "ice" : 0x21E1F2,
    "desert" : 0xD2B48C,
    "earth" : 0x654321
};

const monsterType = [
    "grass",
    "stone",
    "water",
    "ice",
    "desert",
    "dark",
    "electric",
    "earth",
    "fire"
]

export class BattleScene extends Phaser.Scene{
    constructor(){
        super({key: "BattleScene"});
    }
    init(data){
        this.battle = data.battle;
        console.log("battle started");
        console.log(this.battle);
    }
    create(){
        width = this.scale.width;
        height = this.scale.height;
        this.game.bgMusic.stop();
        this.game.battleMusic.play();
        const grassBG = this.add.image(200,400, "grass-background");
        grassBG.setDisplaySize(width, height)
               .setScrollFactor(0);

        //black shade screen
        this.backgroundDull = this.add.rectangle(0, 0,  width, height, 0x000000, 0.4).setDepth(-1).setScrollFactor(0);
        if (!this.textures.exists('hpGradient')) {
            this.createHPGradient();
        }
        this.spawnMonsters();
        this.displayBars();
        this.displayOptionContainer();
        this.displaySkills();
        


    }

    spawnMonsters(){
        this.enemy = this.physics.add.image(width- (3*PADDING), height/2.7, this.battle.spawnnedOpponent.monsterMeta.monsterID)
                        .setDisplaySize(OPPONENTWIDTH,OPPONENTHEIGHT);
        this.player = this.physics.add.image( 3* PADDING, height/1.5, this.battle.playerMonster.name+"-back")
                                      .setDisplaySize(PLAYERWIDTH, PLAYERHEIGHT);
    }

    typeBars(t, of){
        console.log(t); 
        const container = this.add.container(0,0);

        const bg = this.add.graphics();
        bg.fillStyle(type[t],0.9)
          .fillRoundedRect(0, 0, DISPLAYBARW, DISPLAYBARH, 6)
          .lineStyle(1.5, lineStyle[t])
          .strokeRoundedRect(0, 0, DISPLAYBARW, DISPLAYBARH, 6);

        container.add(bg);
        return container;
        
    }
    updateHP(bar, current, max) {
            const ratio = current / max;
            bar.displayWidth = HPWIDTH * ratio;
    }
    createHPGradient() {
        const width = HPWIDTH;
        const height = 13;

        const canvas = this.textures.createCanvas('hpGradient', width, height);
        const ctx = canvas.context;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);

        // gradient.addColorStop(0, '#ff0000');   // low HP
        // gradient.addColorStop(0.5, '#ffff00'); // mid HP
        gradient.addColorStop(1, '#00ff00');   // full HP

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        canvas.refresh();
    }

    displayBars(){
        this.playerBar = this.typeBars(monsterType[this.battle.playerMonster.meta.type], "player");
        this.playerBar.setPosition(width- (DISPLAYBARW+PADDING), height/1.3);
        this.enemyBar = this.typeBars(monsterType[this.battle.spawnnedOpponent.monsterMeta.type], "opponent");
        this.enemyBar.setPosition(PADDING,  5* PADDING);


        const playerName = this.add.text(HPPADDING, DISPLAYBARH/2 - 30, this.battle.playerMonster.name, {
            fontSize: "32px",
            color: "#f2f2f2",
            fontFamily: "Arial",
            stroke: "#000000",
            padding: { x: 10, y: 5 }
        });
        const monsterName = this.add.text(HPPADDING, DISPLAYBARH/2 - 30, this.battle.spawnnedOpponent.monsterMeta.monsterID, {
            fontSize: "32px",
            color: "#f2f2f2",
            fontFamily: "Arial",
            stroke: "#000000",
            padding: { x: 10, y: 5 }
        });

        const HPBG = this.add.graphics();
        HPBG.fillStyle(0x000000)
                       .fillRoundedRect(HPPADDING-1, HPBOTTOMPAD-1, HPWIDTH+2, 17, 3);


        // this.playerHP = this.add.graphics();
        // this.playerHP.fillStyle(0x0dff00)
        //              .fillRoundedRect(HPPADDING, HPBOTTOMPAD, HPWIDTH, 15, 3);
                     
        
        // this.monsterHP = this.add.graphics();
        // this.monsterHP.fillStyle(0x0dff00)
        //              .fillRoundedRect(HPPADDING, HPBOTTOMPAD, HPWIDTH, 15, 3);
                     
        this.playerHP = this.add.image(HPPADDING+2, HPBOTTOMPAD, 'hpGradient')
            .setOrigin(0, 0);

        this.enemyHP = this.add.image(HPPADDING+2, HPBOTTOMPAD, 'hpGradient')
            .setOrigin(0, 0);
        this.enemyBar.add([HPBG, monsterName, this.enemyHP]);
        this.playerBar.add([HPBG, playerName, this.playerHP]);

        this.updateHP(this.enemyHP, this.battle.spawnnedOpponent.monsterMeta.hp, this.battle.spawnnedOpponent.monsterMeta.maxHP);
        this.updateHP(this.playerHP, this.battle.playerMonster.meta.hp, this.battle.playerMonster.meta.maxHP);
    }
    defeatAnim(){
        const defeat = this.add.image(width/2, height/2 - 80, "defeat-banner");
        defeat.setDisplaySize(250, 200).setDepth(1002).setScale(0.2);
        this.tweens.add({
            targets: defeat,
            scale : 0.4,
            duration : 2000,
            onComplete: () => {
                this.scene.stop();
                this.scene.start("WorldScene");

            }
        });
    }

    victoryAnim(){
        const victory = this.add.image(width/2, height/2 - 80, "victory-banner");
        victory.setDisplaySize(250, 200).setDepth(1002).setScale(0.2);
        this.tweens.add({
            targets: victory,
            scale : 0.4,
            duration : 2000,
            onComplete: () => {
                this.scene.stop();
                this.scene.start("WorldScene");

            }
        })
    }

    displaySkills(){
        this.isAttacking = false;
        const skillContainer = this.add.container(0,skillContainerY);

        this.battle.playerMonsterAttacks.forEach((skill, i) => {

            const slot = this.add.image(skillSlotX +(70*(i+1)), 0, skill).setDisplaySize(64,64).setInteractive();
            slot.index = i;

            slot.on("pointerdown", () => {
                if (this.isAttacking){
                    return;
                }
                this.isAttacking = true;

                api.Attack(this.battle.id, this.battle.playerMonsterAttacks[i]).then( data => {
                    
                    if (data.success){
                        this.battle = data.battle;
                        console.log(this.battle.playerLastAttack);
                        const fx = this.add.sprite(this.enemy.x, this.enemy.y, "hurricane_anim"); //slot.i anims to be played
                        fx.anims.play("hurricane_anim", true);

                        fx.once("animationcomplete", () => {
                            this.updateHP(this.enemyHP, this.battle.spawnnedOpponent.monsterMeta.hp, this.battle.spawnnedOpponent.monsterMeta.maxHP);
                            
                        //         this.tweens.add({
                        //             targets: slot,
                        //             scaleX: 0,
                        //             scaleY: 1.2,
                        //             duration: 100,
                        //             onComplete: () => {
                        //                 slot.setTexture(data.battle.playerMonsterAttacks[slot2.i]);

                        //                 this.tweens.add({
                        //                     targets: slot,
                        //                     scaleX: 1,
                        //                     scaleY: 1,
                        //                     duration: 100
                        //                 });
                        //             }
                        //         });
                                fx.destroy(); 
                                if (this.battle.status == 2 && this.battle.playerVictory == true){ //battle over, opponent won
                                            this.tweens.add({
                                                targets : this.player,
                                                x : -100,
                                                yoyo : false,
                                                duration : 200,
                                                onComplete : () => {
                                                    this.victoryAnim();
                                                }
                                            });
                                            return;
                                
                                }
                                //enemy attack
                                this.time.delayedCall(1000, () => {

                                    console.log(this.battle.opponentLastAttack);
                                    const fx2 = this.add.sprite(this.player.x, this.player.y, "hurricane_anim"); //monster skill anims to be played
                                    fx2.anims.play("hurricane_anim", true); //this.battle.opponentLastAttack
                                    fx2.once("animationcomplete", () => {
                                        this.updateHP(this.playerHP, this.battle.playerMonster.meta.hp, this.battle.playerMonster.meta.maxHP);
                                        
                                        fx2.destroy();
                                        if (this.battle.status == 2){ //battle over, opponent won
                                            this.tweens.add({
                                                targets : this.player,
                                                x : -100,
                                                yoyo : false,
                                                duration : 200,
                                                onComplete : () => {
                                                    this.defeatAnim();
                                                }
                                            });
                                        }
                                        this.isAttacking = false;
                                    });
                                });
                        });
                    }
                });
                
            });
            skillContainer.add(slot);
        });


    }

    displayOptionContainer(){
        
        const moreBtn = this.add.image(2* PADDING, skillContainerY, "more-button");
        const escapeBtn = this.add.image(0, 0, "escape-button");
        escapeBtn.setPosition(width -( 6*  PADDING), 0)
                 .setInteractive()
                 .setDisplaySize(64,64);
        const catchBtn = this.add.image(0, 0, "catch-button");
        catchBtn.setPosition(width - (3*PADDING), 0)
                .setDisplaySize(64,64)
                .setInteractive();
        moreBtn.setDisplaySize(80,80).setInteractive();


        const moreContainer = this.add.container(0, skillContainerY).setDepth(-1);

        moreContainer.add([escapeBtn, catchBtn]);
        catchBtn.on("pointerdown", () => {
            this.isAttacking = true;
            api.CatchMonster(this.battle.id).then(data => {
                if (data.success){
                    this.battle = data.battle;
                    console.log(this.battle);
                    if (data.capture){
                        console.log("Captured");
                    }else{
                         //enemy attack
                        this.time.delayedCall(1000, () => {

                            console.log(this.battle.opponentLastAttack);
                            const fx2 = this.add.sprite(this.player.x, this.player.y, "hurricane_anim"); //monster skill anims to be played
                            fx2.anims.play("hurricane_anim", true); //this.battle.opponentLastAttack
                            fx2.once("animationcomplete", () => {
                                this.updateHP(this.playerHP, this.battle.playerMonster.meta.hp, this.battle.playerMonster.meta.maxHP);
                                
                                fx2.destroy();
                                if (this.battle.status == 2){ //battle over, opponent won
                                    this.tweens.add({
                                        targets : this.player,
                                        x : -100,
                                        yoyo : false,
                                        duration : 200,
                                        onComplete : () => {
                                            this.defeatAnim();
                                        }
                                    });
                                }
                                this.isAttacking = false;
                            });
                        });
                    }
                    
                    
                }
            });
        });
        moreBtn.on("pointerdown", () => {
            moreContainer.setDepth(1);
        });

        escapeBtn.on("pointerdown", () => {
            api.escapeBattle(this.battle.id).then(data => {
                if (data.success){
                    this.battle = data.battle;
                    console.log("Successfully escaped");
                    this.scene.stop();
                    this.scene.start("WorldScene");
                }
            });
        });
    }


}