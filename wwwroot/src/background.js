
export class BattlegroundScene extends Phaser.Scene{
    constructor(){
        super({key: "BattlegroundScene"});
    }

    create(){
        this.game.bgMusic.stop();

        this.game.battleMusic.play();

        this.USER = JSON.parse(localStorage.getItem("USER"));
        console.log(this.USER)
        // const waterBG = this.add.image(0, 0, "water-battleground").setOrigin(0);
        // waterBG.setDisplaySize(this.scale.width, this.scale.height);
        

        

        // monster1.setFlipX(true);

        const grassBG = this.add.image(180,360, "grass-background");
        grassBG.setDisplaySize(this.scale.width, this.scale.height);
        this.backgroundDull = this.add.rectangle(180, 360, this.scale.width, this.scale.height, 0x000000, 0.4).setDepth(-1);

        
        // const monster2 = this.add.image(140,200, "gravi-corrupter").setOrigin(0);
        // const monster1 = this.add.image(-30,320, "aqua-leviathan-back").setOrigin(0);
        // monster1.setDisplaySize(320,320);
        // monster2.setDisplaySize(240, 240);

        this.my_monsterX = 100;
        this.my_monsterY = 400;
        this.my_monsterWH = 320;
        this.enemy_monsterWH = 240;

        this.enemy_monsterX = 280;
        this.enemy_monsterY = 270;
        
        this.my_monsterID = this.USER.slot1;
        const monster_demo = ["dune-striker", "terra-behomth", "igni-beast", "volt-draco"];
        this.enemy_monsterID = monster_demo[Phaser.Math.Between(0,3)];

        
        
        this.enemy_monster = this.add.image(300, this.enemy_monsterY, this.enemy_monsterID).setDisplaySize(this.enemy_monsterWH, this.enemy_monsterWH);
        this.my_monster = this.add.image(50, this.my_monsterY, this.my_monsterID+"-back").setDisplaySize(this.my_monsterWH, this.my_monsterWH).setDepth(100);

        this.tweens.add({
            targets: this.enemy_monster,
            x: this.enemy_monsterX,
            duration: 100
        });
        this.tweens.add({
            targets: this.my_monster,
            x: this.my_monsterX,
            duration: 100
        });
        
        this.monsters = this.cache.json.get("monsters");
        console.log(this.monsters);


        this.self = JSON.parse(JSON.stringify(this.monsters[this.my_monsterID]));
        this.enemy = JSON.parse(JSON.stringify(this.monsters[this.enemy_monsterID]));


        this.enemyMaxHP = this.enemy.baseStats.hp;
        this.selfMaxHP = this.self.baseStats.hp;
        
        this.skillslot1 = this.RandomSkill("SLOT1");
        this.skillslot2 = this.RandomSkill("SLOT2");
        this.skillslot3 = this.RandomSkill("SLOT3");
        console.log(this.skillslot1);
        console.log(this.skillslot2);
        console.log(this.skillslot3)

        this.skill_slot1 = this.add.image(110,0, this.skillslot1).setDisplaySize(64,64);
        this.skill_slot2 = this.add.image(180,0, this.skillslot2).setDisplaySize(64,64);
        this.skill_slot3 = this.add.image(250,0, this.skillslot3).setDisplaySize(64,64);
        
        this.items = this.add.image(320, 0, "items-button").setDisplaySize(64,64).setInteractive({useHandCursor:true});
        this.moreButton = this.add.image(30, 0, "more-button").setDisplaySize(80,80);
        

        //moreOptions
        this.backButton = this.add.image(30, 650, "back-button").setDisplaySize(80,80).setDepth(1000);
        this.escapeButton = this.add.image(250, 650, "escape-button").setDisplaySize(60,64).setDepth(100).setInteractive({useHandCursor:true});
        this.catchButton = this.add.image(320, 650, "catch-button").setDisplaySize(60,64).setDepth(100).setInteractive({useHandCursor:true});

        this.moreOptions = this.add.container(0,0, [this.backButton, this.escapeButton, this.catchButton]).setDepth(-1);
        

        //skill options
        this.skills_container = this.add.container(0, 650, [
            this.skill_slot1,
            this.skill_slot2,
            this.skill_slot3,
            this.items,
            this.moreButton,
           
        ]);



        this.skills = this.cache.json.get("monster-skills");
        console.log(this.skills+"   -------");

        this.skill_slot1.setInteractive({useHandCursor: true});
        this.skill_slot2.setInteractive({useHandCursor: true});
        this.skill_slot3.setInteractive({ useHandCursor: true });
        this.moreButton.setInteractive({useHandCursor:true});
        this.backButton.setInteractive({useHandCursor:true});

        this.skill_slot1.on("pointerdown", () => {
            this.SkillSlot1(); 
            this.skillslot1 = this.RandomSkill("SLOT1");
            this.skill_slot1.setTexture(this.skillslot1);
        });

        this.skill_slot2.on("pointerdown", () => {
            this.SkillSlot2(); 
            this.skillslot2 = this.RandomSkill("SLOT2"); 
            this.skill_slot2.setTexture(this.skillslot2);  
        });

        this.skill_slot3.on("pointerdown", () => {
            this.SkillSlot3();
            this.skillslot3 = this.RandomSkill("SLOT3");
            this.skill_slot3.setTexture(this.skillslot3);
        });

        this.moreButton.on("pointerdown", () => {
            this.MoreOptions();
        });

        this.backButton.on("pointerdown", () => {
            this.BackOption();
        });

        this.items.on("pointerdown", () => {
            
            console.log("bag open");
        });

        this.escapeButton.on("pointerdown", () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0);

            this.cameras.main.once("camerafadeoutcomplete", () => {
  
                this.scene.start("GameScene");

            });
        });

        this.catchButton.on("pointerdown", () => {
            this.BackOption();
            this.CatchMonster();

        });

       
        //monster-icons
        const selfIcon = this.add.image(this.scale.width/2, this.scale.height/2+210, this.my_monsterID+"-icon").setDisplaySize(48,48).setDepth(100);

        //enemy monster-icon
        const enemyIcon = this.add.image(40, 80, this.enemy_monsterID+"-icon").setDisplaySize(48,48).setDepth(100);



        //health bar

        const my_monsterHpBg = this.add.graphics();
        my_monsterHpBg.fillStyle(0x0facde, 1)
        .fillRoundedRect(0, 0, 200, 60, 4)
        .lineStyle(1, 0x000000)
        .strokeRoundedRect(0, 0, 200, 60, 4);

        my_monsterHpBg.setPosition(this.scale.width/2-30, this.scale.height/2+180);
        const selfName = this.add.text(this.scale.width/2+30, this.scale.height/2+215, this.my_monsterID.toUpperCase(), {fontFamily: "Coiny", fontStyle:"bold", fontSize: "14px", color: "#ffffff", stroke: "0x000000", strokeThickness: 4});

        //health
        const my_monsterHealthBG = this.add.graphics();
        this.my_monsterHealth = this.add.graphics();
        my_monsterHealthBG.fillStyle(0xffffff, 1).fillRoundedRect(this.scale.width/2+30, this.scale.height/2+200, 130, 10, 2).lineStyle(1, 0x000000).strokeRoundedRect(this.scale.width/2+30, this.scale.height/2+200, 130, 10, 2);
        this.my_monsterHealth.fillStyle(0x2ee850, 1).fillRoundedRect(this.scale.width/2+30, this.scale.height/2+200, 130, 10, 2);
        
        
        
        const enemy_monsterHpBg = this.add.graphics();
        enemy_monsterHpBg.fillStyle(0x93b93a, 1)
        .fillRoundedRect(0, 0, 200, 60, 4)
        .lineStyle(1, 0x000000)
        .strokeRoundedRect(0, 0, 200, 60, 4);

        enemy_monsterHpBg.setPosition(10, 50);
        const enemyName = this.add.text(70, 85, this.enemy_monsterID.toUpperCase(), {fontFamily: "Coiny", fontStyle:"bold", fontSize: "14px", color: "#ffffff", stroke: "0x000000", strokeThickness: 4});


        //enmy health
        const enemy_mosnterHealthBG = this.add.graphics();
        this.enemy_monsterHealth = this.add.graphics();
        enemy_mosnterHealthBG.fillStyle(0xffffff, 1).fillRoundedRect(70, 70, 130, 10, 2).lineStyle(1, 0x000000).strokeRoundedRect(70,70, 130, 10, 2);
        this.enemyWidthHP = 130;
        this.enemy_monsterHealth.fillStyle(0x2ee850, 1).fillRoundedRect(70,70, this.enemyWidthHP, 10, 2);
        
        //self health profile and health container
        this.selfProfile = this.add.container(0,0, [ my_monsterHpBg, selfName, my_monsterHealthBG, this.my_monsterHealth, selfIcon]);
        
        //enemy profile and health
        this.enemyProfile = this.add.container(0,0, [enemy_monsterHpBg, enemyName, enemy_mosnterHealthBG, this.enemy_monsterHealth, enemyIcon]);

        this.turn = this.BattleTurn();
        this.firstAttack = false;
        this.attacking = false;
        console.log(this.turn);

        
    }

    Capture(){
        const enemy = this.monsters[this.enemy_monsterID];
        console.log(enemy);
        if (Math.random() < enemy.captureRate){
            return true;
        }
        return false;
    }


    CatchMonster(){
        this.skills_container.setAlpha(0.4);
        const monstaBall = this.add.image(100, 250, "monsta-ball").setDepth(50).setDisplaySize(90,80);
        const fx = this.add.sprite(this.enemy_monsterX, this.enemy_monsterY, "blue-flame").setDepth(50);
        fx.anims.play("blue-flame", true);
        fx.once("animationcomplete", () => {
            fx.setVisible(false);
            this.enemy_monster.setTint(0xffffff);
            this.enemy_monster.setAlpha(0.5);

            this.tweens.add({
                targets: this.enemy_monster,
                scale: 0.1,
                x: 100,
                y: 250,
                duration: 2000,
                onComplete: () => {
                    this.enemy_monster.setVisible(false);
                    this.tweens.add({
                        targets: monstaBall,
                        x: 97,
                        yoyo: true,
                        repeat: 8,
                        duration: 100,
                        onComplete: () => {

                            if (!this.Capture()){
                                fx.setPosition(100, 150);
                                fx.setVisible(true).setDisplaySize(700, 500);
                                fx.anims.play("explode", true);
                                monstaBall.destroy();
                                fx.once("animationcomplete", () => {
                                    
                                    
                                    fx.destroy();
                                    this.enemy_monster.setVisible(true);
                                    this.tweens.add({
                                        targets: this.enemy_monster,
                                        scale: 0.5,
                                        x: 300,
                                        y: this.enemy_monsterY,
                                        duration: 300,
                                        onComplete: () => {
                                            
                                            this.enemy_monster.setAlpha(1);
                                            this.enemy_monster.clearTint();
                                            this.turn = "ENEMY";
                                        }
                                    });

                                });
                            }else{
                                fx.setPosition(100, 250).setDepth(1000);
                                fx.setVisible(true).setDisplaySize(700, 500);

                                fx.anims.play("red-aura", true);
                                this.tweens.add({
                                    targets: [monstaBall, fx],
                                    x: 320,
                                    y: 650,
                                    duration: 2000,
                                    onComplete: () => {
                                        fx.destroy();
                                        this.tweens.add({
                                            targets: monstaBall,
                                            scale: 0.2,
                                            duration: 300,
                                            onComplete: () => {
                                                monstaBall.destroy();
                                                const victory = this.add.image(this.scale.width/2, this.scale.height/2 - 80, "victory-banner");
                                                victory.setDisplaySize(250, 200).setDepth(1002).setScale(0.2);
                                                this.backgroundDull.setDepth(1001);
                                                this.tweens.add({
                                                    targets:victory,
                                                    scale: 0.4,
                                                    duration: 2000,
                                                    onComplete: () => {
                                                        victory.destroy();
                                                        this.USER.monsters.push(this.enemy_monsterID);
                                                        console.log(this.USER);
                                                        if (this.USER.slot1 == null)
                                                            this.USER.slot1 = this.enemy_monsterID;
                                                        else if (this.USER.slot2 == null)
                                                            this.USER.slot2 = this.enemy_monsterID;
                                                        else if (this.USER.slot3 == null)
                                                            this.USER.slot3 = this.enemy_monsterID;
                                                        this.USER.gold += 50;
                                                        localStorage.setItem("USER", JSON.stringify(this.USER));
                                                        this.showMonsterAnim(this.my_monsterID);
                                                        this.time.delayedCall(4000, () => {
                                                            this.scene.start("GameScene");
                                                        });
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })

                            }
                            
                            
                        }
                    });
                }
            });
        });
    }

    showMonsterAnim(m){
        const land = this.add.image(this.scale.width/2, this.scale.height/2+30, "stand-land").setDisplaySize(250,160).setDepth(1001).setScrollFactor(0);
        const monster = this.add.image(this.scale.width/2, -100, m).setDepth(1002).setDisplaySize(180,180).setScrollFactor(0);
        
        let entryAnim = "blue-light-aura";
        
        this.tweens.add({
            targets: monster,
            y: this.scale.height/2-60,
            duration: 500,
            onComplete: () => {
                const fx = this.add.sprite(this.scale.width/2, this.scale.height/2-80, entryAnim, 0).setDepth(1001).setScrollFactor(0);
                fx.anims.play(entryAnim, true).setDisplaySize(400,400);
                fx.once("animationcomplete", () => {
                    
                    fx.destroy();
                    land.destroy();
                    monster.destroy();
                    this.backgroundDull.setDepth(-1);
                });
            }
        });
        
        
    }

    RandomSkill(skillslot){
        const skills = this.self.skills;
        const skillID = skills[Phaser.Math.Between(0, skills.length-1)];
        console.log(skills);
        console.log(skillID, skillslot);
        return skillID;
        
    }

    SkillSlot1(){
        if (this.attacking) return;
        if (this.turn == "ENEMY") return;
        this.attacking = true;
        const fx = this.add.sprite(
            this.enemy_monsterX,
            this.enemy_monsterY-30,
            this.skillslot1+"-01"
        );
        fx.setScale(1.5);

        this.tweens.add({
            targets: this.enemy_monster,
            x : this.enemy_monsterX+20,
            yoyo: true,
            repeat: 8,
            duration: 100
        });
        fx.anims.play(this.skillslot1+"-anim", true);
        
        
        this.skills_container.setAlpha(0.4);
        this.DealDamage("self", this.skills[this.skillslot1]);
        fx.once("animationcomplete", () => {
            fx.destroy();
            this.CheckVictory();
            
        });
    }


    SkillSlot2(){
        if (this.attacking) return;
        if (this.turn == "ENEMY") return;
        this.attacking = true;
        const fx = this.add.sprite(
            this.enemy_monsterX,
            this.enemy_monsterY-30,
            this.skillslot2+"-01"
        );
        fx.setScale(1.5);   // 200% size

        this.tweens.add({
            targets: this.enemy_monster,
            x : this.enemy_monsterX+20,
            yoyo: true,
            repeat: 8,
            duration: 100
        });

        

        fx.anims.play(this.skillslot2+"-anim", true);
        
        
        this.skills_container.setAlpha(0.4);
        this.DealDamage("self", this.skills[this.skillslot2]);
        fx.once("animationcomplete", () => {
            fx.destroy();
            this.CheckVictory();
            
        });
    }

    SkillSlot3(){
        if (this.attacking) return;
        if (this.turn == "ENEMY") return;
        this.attacking = true;
        const fx = this.add.sprite(
            this.enemy_monsterX,
            this.enemy_monsterY-30,
            this.skillslot3+"-01"
        );

        this.tweens.add({
            targets: this.enemy_monster,
            x : this.enemy_monsterX+20,
            yoyo: true,
            repeat: 8,
            duration: 100
        });
        fx.anims.play(this.skillslot3+"-anim", true);
        
        
        this.skills_container.setAlpha(0.4);
        this.DealDamage("self", this.skills[this.skillslot3]);
        fx.once("animationcomplete", () => {
            fx.destroy();
            this.CheckVictory();
        });
    }

    CheckVictory(){
        if (this.enemy.baseStats.hp <= 0){
                this.turn = "NONE";
                this.backgroundDull.setDepth(1001);
                this.tweens.add({
                    targets: this.skills_container,
                    y: 1500,
                    duration: 300
                });
                this.tweens.add({
                    targets:this.enemy_monster,
                    x: 500,
                    duration: 300,
                    onComplete: () => {
                        this.enemy_monster.destroy();
                        const victory = this.add.image(this.scale.width/2, this.scale.height/2 - 80, "victory-banner");
                        this.USER.gold += 50;
                        localStorage.setItem("USER", JSON.stringify(this.USER));
                        victory.setDisplaySize(250, 200).setDepth(1002).setScale(0.2);
                        this.tweens.add({
                            targets: victory,
                            scale: 0.4,
                            duration:500,
                            onComplete: () => {
                                this.time.delayedCall(2000, () => {
                                    this.scene.start("GameScene");
                                });
                            }
                        })
                        
                    }
                });
            }
            else{
                this.turn = "ENEMY";
                this.attacking = false;
            }
    }


    BattleTurn(){
        const myTrun = "MY";
        const enemyTurn = "ENEMY";
        let turn = myTrun;
        const probability = Phaser.Math.FloatBetween(0,1);
        if (probability > 0.5) turn = enemyTurn;
        return turn;
    }

    EnemyAttack(){
        if (this.attacking) return;
        this.attacking = true;
        const enemy = this.monsters[this.enemy_monsterID];
        const skills = enemy.skills;
        const attack = Phaser.Math.Between(0, skills.length-1);
        const enemySkill = skills[attack]+"-anim";
        console.log(enemySkill);
        const skill = this.skills[skills[attack]];
        console.log(skill)
        this.DealDamage("enemy", skill);
        const fx = this.add.sprite(this.my_monsterX, this.my_monsterY, enemySkill, 0);
        
        fx.anims.play(enemySkill).setDepth(100);
        this.tweens.add({
            targets: this.my_monster,
            x: this.my_monsterX+20,
            yoyo: true,
            repeat: 8,
            duration: 100
        });
        fx.once("animationcomplete", () => {
            fx.destroy();
            if (this.self.baseStats.hp <= 0){
                this.turn = "NONE";
                this.backgroundDull.setDepth(1001);
                this.tweens.add({
                    targets: this.skills_container,
                    y: 1500,
                    duration: 300
                });
                this.tweens.add({
                    targets:this.my_monster,
                    x: -100,
                    duration: 300,
                    onComplete: () => {
                        this.my_monster.destroy();
                        const defeat = this.add.image(this.scale.width/2, this.scale.height/2 - 80, "defeat-banner");
                        defeat.setDisplaySize(250, 200).setDepth(1002).setScale(0.2);
                        this.tweens.add({
                            targets: defeat,
                            scale: 0.4,
                            duration:1000,
                            onComplete: () => {
                                this.time.delayedCall(2000, () => {
                                    this.scene.start("GameScene");
                                });
                            }
                        })
                        
                    }
                });
            }
            else{
                this.attacking = false;
                this.skills_container.setAlpha(1);
                this.turn = "MY";
            }
            
        });
    }

    MoreOptions(){
        console.log("More options");
        
        this.backgroundDull.setDepth(1000);
        this.tweens.add({
            targets: this.skills_container,
            y: 1000,
        });
        this.moreOptions.setDepth(1001);
        this.selfProfile.setDepth(-1);
        this.enemyProfile.setDepth(1001);
    }

    BackOption(){
        this.backgroundDull.setDepth(-1);
        this.moreOptions.setDepth(-100);
        this.tweens.add({
            targets: this.skills_container,
            y: 650,
            duration: 200
        });
        this.selfProfile.setDepth(100);
        this.enemyProfile.setDepth(100);
    }

    updateHp() {

        const enemyHp = this.enemy.baseStats.hp;
        const selfHp = this.self.baseStats.hp;

        const enemyhpPercent = enemyHp / this.enemyMaxHP;
        const selfhpPercent = selfHp / this.selfMaxHP;
    

        let enmyWidthHp = 130 * enemyhpPercent;
        let selfWidthHp = 130* selfhpPercent;

        this.enemy_monsterHealth.clear();
        this.my_monsterHealth.clear();

        if (enmyWidthHp < 0){
            enmyWidthHp = 0;
        }
        if (selfWidthHp < 0){
            selfWidthHp = 0;
        }
        this.enemy_monsterHealth
            .fillStyle(0x2ee850, 1)
            .fillRoundedRect(70, 70, enmyWidthHp, 10, 2);
        this.my_monsterHealth.
            fillStyle(0x2ee850, 1)
            .fillRoundedRect(this.scale.width/2+30, this.scale.height/2+200, selfWidthHp, 10, 2);
        
    }


    calculateDamage(attacker, defender, skill) {

        const level = attacker.baseStats.level || 1;
        const attack = attacker.baseStats.attack;
        const defense = defender.baseStats.defense;
        const skillPower = skill.power;

        let damage =
            ((2 * level / 5 + 2) * attack * skillPower) /
            defense;

        damage = damage / 10 + 2;

        // Random factor (0.85 – 1)
        const randomFactor = Phaser.Math.FloatBetween(0.85, 1);

        // Critical (15% chance)
        const critMultiplier =
            Phaser.Math.RND.frac() < 0.15 ? 1.5 : 1;

        // Type effectiveness
        const typeMultiplier =
            getTypeMultiplier(skill.type, defender.type);

        damage = damage * randomFactor * critMultiplier * typeMultiplier;

        return Math.floor(damage);
    }

    DealDamage(attacker, skill){

        let damage = 0;
        if (attacker == "self"){
            damage = this.calculateDamage(this.self, this.enemy, skill);
            this.enemy.baseStats.hp = this.enemy.baseStats.hp - damage;
            this.updateHp();
            console.log(this.enemy.baseStats.hp);
            
        }
        else
        {
            damage = this.calculateDamage(this.enemy, this.self, skill);
            this.self.baseStats.hp = this.self.baseStats.hp - damage;
            this.updateHp();
            console.log(this.self.baseStats.hp);
        }
        
    }


    update(){
        
        if (this.turn == "MY"){
            // console.log(this.self.baseStats.hp+ "----self");
            // console.log(this.enemy.baseStats.hp+"-------enemy");
            if(!this.firstAttack){
                this.firstAttack = true;
            }
            
            

        }
        else if(this.turn == "NONE"){

        }
        else{
            
            this.skills_container.setAlpha(0.4);
            if(!this.firstAttack){
                this.time.delayedCall(2000, () =>{
                    this.EnemyAttack();
                    this.firstAttack = true;
                })
            }
            else{
                this.EnemyAttack();
                this.time.delayedCall(2000, () => {
                    
                    
                    
                    // console.log(this.turn);
                    // console.log("-");
                });

            }
            
        }
    }
        
}

// import { Loader } from "phaser";
import { typeChart } from "./typeChart.js";
function getTypeMultiplier(attackType, defenderTypes) {

    let multiplier = 1;

    // Defender can have multiple types
    if (!Array.isArray(defenderTypes)) {
        defenderTypes = [defenderTypes];
    }

    defenderTypes.forEach(defType => {

        const typeEffect =
            typeChart[attackType]?.[defType];

        if (typeEffect) {
            multiplier *= typeEffect;
        }
    });

    return multiplier;
}
