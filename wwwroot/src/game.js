import { tg } from "../js/"
export class GameScene extends Phaser.Scene{

    constructor(){
        super({key: "GameScene"})
    }

    // spawnPinsFromRects(spawnRects, maxPins, textureKey) {
    //     if (!spawnRects || spawnRects.length === 0) return;

    //     for (let i = 0; i < maxPins; i++) {
    //         // pick a random rectangle zone
    //         const rect = Phaser.Math.RND.pick(spawnRects);

    //         // random position inside that rectangle
    //         const { x, y } = randomPointInRect(rect);

    //         // create pin
    //         this.add.image(x, y, textureKey)
    //             .setDepth(0).setDisplaySize(48, 48);
    //     }
    // }

    startingBonus() {
        this.backgroundDull.setDepth(1000).setScrollFactor(0);
        
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const slot1 = this.add.graphics();
        const slot2 = this.add.graphics();
        const slot3 = this.add.graphics();

        const grassBackground = this.monsterGradients.grass;
        const waterBackground = this.monsterGradients.water;
        const fireBackground = this.monsterGradients.fire;


        slot1.fillGradientStyle(
            grassBackground.top, 
            grassBackground.top, 
            grassBackground.bottom, 
            grassBackground.bottom, 
            1
        );
        slot1.fillRoundedRect(centerX - 40, centerY - 40, 100, 150, 8);

        
        slot1.lineStyle(4, 0x000000, 1);
        slot1.strokeRoundedRect(centerX - 40, centerY - 40, 100, 150, 8);
        slot1.setDepth(1001); 
        const monster1 = this.add.image(centerX+10, centerY+30, "terra-behomth").setDisplaySize(120, 120);
        const monster1Name = this.add.text(centerX-40, centerY- 60, "TERRA-BEHOMTH",
            {
                fontFamily: "Coiny",
                fontSize: "10px",
                color: "#ffffff",
                stroke: "0x000000",
                strokeThickness: 4
            }).setDepth(1002);
        const choose1 = this.add.image(centerX+10, centerY+100, "choose-button").setDisplaySize(56,24).setDepth(1002).setInteractive({useHandCursor: true}).setScrollFactor(0);



        slot2.fillGradientStyle(
            waterBackground.top, 
            waterBackground.top, 
            waterBackground.bottom, 
            waterBackground.bottom, 
            1
        );

        slot2.fillRoundedRect(centerX+70 , centerY - 40, 100, 150, 8);

        slot2.lineStyle(4, 0x000000, 1);
        slot2.strokeRoundedRect(centerX+70 , centerY - 40, 100, 150, 8);

        slot2.setDepth(1001);
        const monster2 = this.add.image(centerX+120, centerY+35, "volt-draco").setDisplaySize(120,120);     
        const monster2Name = this.add.text(centerX+85, centerY- 60, "VOLT-DRACO",
            {
                fontFamily: "Coiny",
                fontSize: "10px",
                color: "#ffffff",
                stroke: "0x000000",
                strokeThickness: 4
            }).setDepth(1002);
        const choose2 = this.add.image(centerX+120, centerY+100, "choose-button").setDisplaySize(56,24).setDepth(1002).setInteractive({useHandCursor: true}).setScrollFactor(0);



        slot3.fillGradientStyle(
            fireBackground.top, 
            fireBackground.top, 
            fireBackground.bottom, 
            fireBackground.bottom, 
            1
        );

        slot3.fillRoundedRect(centerX+180 , centerY - 40, 100, 150, 8);

        slot3.lineStyle(4, 0x000000, 1);
        slot3.strokeRoundedRect(centerX+180 , centerY - 40, 100, 150, 8);

        slot3.setDepth(1001);
        const monster3 = this.add.image(centerX+232, centerY+35, "igni-beast").setDisplaySize(120,120);
        const monster3Name = this.add.text(centerX+200, centerY- 60, "IGNI-BEAST",
            {
                fontFamily: "Coiny",
                fontSize: "10px",
                color: "#ffffff",
                stroke: "0x000000",
                strokeThickness: 4
            }).setDepth(1002);
        const choose3 = this.add.image(centerX+230, centerY+100, "choose-button").setDisplaySize(56,24).setDepth(1002).setInteractive({useHandCursor:true}).setScrollFactor(0);

        const container = this.add.container(centerX/2-210, 0, [
                                                    slot1,
                                                    monster1,
                                                    monster1Name,
                                                    choose1,
                                                    slot2,
                                                    monster2,
                                                    monster2Name,
                                                    choose2,
                                                    slot3, 
                                                    monster3, 
                                                    monster3Name,
                                                    choose3
                                                ]).setDepth(1002).setScrollFactor(0);

        
        
        choose1.on("pointerdown", () => {
            this.game.clickSFX.play();
            this.USER.monsters.push("terra-behomth");
            this.USER.slot1 = "terra-behomth";
            this.USER.bonus = true;
            container.destroy();
            this.saveUser();
            this.showMonsterAnim("terra-behomth");
            
            
        });
        choose2.on("pointerdown", () => {
            this.game.clickSFX.play();
            this.USER.monsters.push("volt-draco");
            this.USER.slot1 = "volt-draco";
            this.USER.bonus = true;
            container.destroy();
            this.saveUser();
            this.showMonsterAnim("volt-draco");
        });
        choose3.on("pointerdown", () => {
            this.game.clickSFX.play();
            this.USER.monsters.push("igni-beast");
            this.USER.slot1 = "igni-beast";
            this.USER.bonus = true;
            container.destroy();
            this.saveUser();
            this.showMonsterAnim("igni-beast");
           
        });

    }

    showMonsterAnim(m){
        const land = this.add.image(this.scale.width/2, this.scale.height/2+30, "stand-land").setDisplaySize(250,160).setDepth(1000).setScrollFactor(0);
        const monster = this.add.image(this.scale.width/2, -100, m).setDepth(1000).setDisplaySize(180,180).setScrollFactor(0);
        
        let entryAnim = "entry-aura";
        
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

    saveUser(){
        localStorage.setItem("USER", JSON.stringify(this.USER));
        console.log("User updated");
    }

    create(){
        this.game.battleMusic.stop();
        this.game.bgMusic.play();
        this.backgroundDull = this.add.rectangle(180, 360, this.scale.width, this.scale.height, 0x000000, 0.8).setDepth(-1);
        //user-data
        this.USER = JSON.parse(localStorage.getItem("USER"));
        if (this.USER == null){
            //create new user
            const user = {
                id : Phaser.Math.Between(100000, 999999),
                gold : 100,
                monsters : [],
                bonus: false,
                slot1: null,
                slot2: null,
                slot3: null,
                wins: 0,
                intro: false,
                progress: 1,
                lastX: null,
                lastY: null

            }
            localStorage.setItem("USER", JSON.stringify(user));
            this.USER = user;
        }
        console.log(this.USER);
        if (!this.USER.intro){

        }
        if(!this.USER.bonus){

        }
        

        //create world
        const world = this.make.tilemap({key: "tileMap"});

        //add world layers
        const object32 = world.addTilesetImage("tilelayer1", "layer1");
        const object64 = world.addTilesetImage("tilelayer2", "layer1");
        const blackLayer = world.addTilesetImage("tilelayer3", "layer3");
        const treeShed = world.addTilesetImage("tilelayer4", "layer4");
        const treeTrunk = world.addTilesetImage("tilelayer5", "layer5");

        //collision layer

        const collision = world.addTilesetImage("tilelayer1", "layer1");
        const collisionLayer = world.createLayer(
            "Collision",
            collision,
            0,
            0
        );

        collisionLayer.setCollisionByExclusion([-1]);

        
        //create layers
        const ground1 = world.createLayer("Tile Layer 1", object32, 0 ,0);
        const ground2 = world.createLayer("fence", object64, 0, 0);
        const ground3 = world.createLayer("Tile Layer 3",[object32,object64, blackLayer], 0, 0);


        //settings
        const settings = this.add.image(this.scale.width-30, 35, "settings-button");
        settings.setDisplaySize(32,32);
        settings.setDepth(100).setScrollFactor(0);

        settings.setInteractive({useHandCursor: true});

        settings.on("pointerdown", () => {
            this.scene.launch("SettingScene");
        });
        

        //object layer (monster location spawns)
        const spawnObj = world.getObjectLayer("SpawnLayer");
        
        const desertSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "desert")
        );

        const waterSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "water")
        );

        const grassSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "grass")
        );

        const landSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "land")
        );

        const darkSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "dark")
        );

        const fireSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "fire")
        );

        const iceSpawns = spawnObj.objects.filter(obj =>
            obj.type === "monsterSpawn" &&
            obj.properties?.some(p => p.name === "spawnType" && p.value === "ice")
        );

        const TotalWaterMonster = 5;
        const TotalDesertMonster = 7;
        const TotalIceMonster = 4;
        const TotalDarkMonster = 2;
        const TotalFireMonster = 3;
        const TotalGrassMonster = 6;
        const TotalLandMonster = 3;


        // this.spawnPinsFromRects(desertSpawns, TotalDesertMonster, 'pin-location');
        // this.spawnPinsFromRects(waterSpawns, TotalWaterMonster, 'pin-location');
        // this.spawnPinsFromRects(grassSpawns, TotalGrassMonster, 'pin-location');
        // this.spawnPinsFromRects(landSpawns, TotalLandMonster, 'pin-location');
        // this.spawnPinsFromRects(fireSpawns, TotalFireMonster, 'pin-location');
        // this.spawnPinsFromRects(iceSpawns, TotalIceMonster, 'pin-location');
        // this.spawnPinsFromRects(darkSpawns, TotalDarkMonster, 'pin-location');



        //col
        // or-gradient
        this.monsterGradients = {
            fire:     { top: 0xFF4B2B, bottom: 0xD4145A },
            earth:    { top: 0xA9703E, bottom: 0x603813 },
            water:    { top: 0x00D2FF, bottom: 0x3A7BD5 },
            ice:      { top: 0xE0FFFF, bottom: 0x87CEEB },
            grass:    { top: 0x32CD32, bottom: 0x006400 },
            electric: { top: 0xFFF200, bottom: 0xF9A73E },
            sand:     { top: 0xFFE29F, bottom: 0xD2B48C },
            dark:     { top: 0x434343, bottom: 0x000000 }
        };

        if(!this.USER.bonus){
            this.startingBonus();
        }
                


        
    

        //enable keyboard
        this.cursor = this.input.keyboard.createCursorKeys();

        const ground4 = world.createLayer("Tile Layer 4", [object64, treeShed, blackLayer], 0, 0);
        const ground5 = world.createLayer("Tile Layer 5", object64, 0 ,0);

        //character
        this.player = this.physics.add.sprite(300,800, "player-down", 0);
        if (this.USER.lastX != null && this.USER.lastY){
            this.player.setPosition(this.USER.lastX, this.USER.lastY);
        }
        this.player.setDepth(10);
        //this.player.setDisplaySize(48,48);
        this.facing = "front";
        this.physics.add.collider(this.player, collisionLayer);


        //character world bound
        this.physics.world.setBounds(0,0, world.widthInPixels, world.heightInPixels);
        this.player.setCollideWorldBounds(true);

        // Limit camera to the world and collide layer
        this.cameras.main.setBounds(
            0,
            0,
            world.widthInPixels,
            world.heightInPixels
        );

        this.physics.add.collider(this.player, collision);

        // Camera follows the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true;


        const { width, height} = this.scale;


        //progress bar
        const barContainer = this.add.container(20, 20);
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1)
        .fillRoundedRect(0, 0, 70, 25, 12)
        .lineStyle(2, 0x000000)
        .strokeRoundedRect(0, 0, 70, 25, 12);

        const fill = this.add.graphics();
        fill.fillStyle(0x115779, 1)
            .fillRoundedRect(0, 0, 70, 25, 12);

        this.progressText = this.add.text(35, 13, "1%", {
        fontFamily: "Poppins",
        fontSize: "13px",
        color: "#fff",
        fontStyle : "bold",
        // stroke: "#fff",
        // strokeThickness: 1
        }).setOrigin(0.5);

        const flag = this.add.image(5, 12, "flag-icon").setDisplaySize(40,40);
        const info = this.add.image(70, 23, "i-icon").setDisplaySize(48,48);

        barContainer.add([bg, fill, this.progressText, flag, info]);
        barContainer.setScrollFactor(0).setDepth(100);
        

        // //gold coin bar
        const goldBoxBg = this.add.graphics();
        const goldBox = this.add.graphics();
        goldBoxBg
            .fillStyle(0xffffff, 1)
            .fillRoundedRect(0, 0, 70, 25, 12)
            .lineStyle(2, 0x000000, 1)
            .strokeRoundedRect(0, 0, 70, 25, 12);

        goldBox
            .fillStyle(0x115779, 1)
            .fillRoundedRect(0, 0, 70, 25, 12);

        const gold_icon = this.add.image(10,12, "gold-icon");
        gold_icon.setDisplaySize(32,32);

        this.gold_text = this.add.text(35+10, 12, "1000", {
            fontFamily: "Poppins",
            fontSize: "13px",
            color: "#fff",
            fontStyle: "bold",
            // stroke: "#fff",
            // strokeThickness: 1
        }).setOrigin(0.5);

        const goldBoxContainer = this.add.container(width/2-60, 20, [goldBoxBg, goldBox, gold_icon, this.gold_text])
            .setDepth(100)
            .setScrollFactor(0);
        
        this.updateBalance(0);
        // this.hud = this.add.container(0, 0, [
        //     this.healthBarBg,
        //     this.healthBar, i_icon, flag_icon,
        //     hpText,
        //     this.goldCoinBg,
        //     this.goldCoin,
        //     gold_icon
        // ]);

        // this.hud.setScrollFactor(0);
        // this.hud.setDepth(1000); // always on top
        // this.hud.y = 15;


        this.pin = this.physics.add.image(600, 600, "location-mark")
                                    .setDisplaySize(32,48);

        this.pin.setImmovable(true);
        this.pin.body.allowGravity = false;

        this.tweens.add({
            targets: this.pin,
            scale: 0.4,
            yoyo: true,
            repeat: -1,
            duration: 500
        });
        this.popupOpen = false;
        this.physics.add.overlap(this.player, this.pin, () => {
           
            this.updatePlayerXY();
            console.log("Pin collide");
            if (this.popupOpen) return;
            this.popupOpen = true;
            // pin.body.enable = false; // stop repeat

            const { width, height } = this.scale;

            const monsterBattle = this.add.image(width/2, height/2, "monster-battle-pop")
                .setDepth(100).setDisplaySize(320, 250).setScrollFactor(0);
            const fightButton = this.add.image(width/2, height/2+120, "fight-button").setDisplaySize(80,32).setDepth(101).setScrollFactor(0).setInteractive({useHandCursor:true});
             this.game.popupSFX.play();
            const closeButton = this.add.image(
                monsterBattle.x + monsterBattle.displayWidth/2 - 20,
                monsterBattle.y - monsterBattle.displayHeight/2 + 20,
                "close-button"
            )
            .setDisplaySize(32,32)
            .setDepth(101)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0);

            fightButton.on("pointerdown", () => {
                
                this.game.clickSFX.play();

                monsterBattle.destroy();
                closeButton.destroy();
                fightButton.destroy();

                this.cameras.main.fadeOut(1000, 0, 0, 0);

                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("BattlegroundScene");
                });


            });

            closeButton.on("pointerdown", () => {
                this.game.clickSFX.play();
                monsterBattle.destroy();
                closeButton.destroy();
                fightButton.destroy();
                
                // pin.body.enable = true; // allow re-trigger
            });

        }, null, this);

    
        


        

        //pets-buttons
        const pets_button = this.add.image(0+3,0, "pets-button");
        pets_button.setDisplaySize(64,64);
        

        //shop-button
        const shop_button = this.add.image(0-275-5,0, "shop-button");
        shop_button.setDisplaySize(64,64);
        

        //mission-button
        const mission_button = this.add.image(0-210,0, "mission-button");
        mission_button.setDisplaySize(64,64);
        


        //items-button
        const items_button = this.add.image(0-145+5,0, "items-button");
        items_button.setDisplaySize(64,64);
        
    
        //characters-button
        const characters_button = this.add.image(0-80+10,0, "characters-button");
        characters_button.setDisplaySize(64,64);
       

        this.menu = this.add.container(width-42, height-42, [
            pets_button,
            shop_button,
            mission_button,
            items_button,
            characters_button
        ]);

        this.menu.setDepth(100);
        this.menu.setScrollFactor(0);

        shop_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        shop_button.on("pointerdown", () => {
            this.game.clickSFX.play();
            console.log("clicked on shop button");
        });

        characters_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        //testing
        characters_button.on("pointerdown", () => {
            
        });

        mission_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        mission_button.on("pointerdown", () => {
            this.game.clickSFX.play();
            console.log("clicked on mission button");
            
            this.scene.launch("MissionScene");
        });

        pets_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        pets_button.on("pointerdown", () => {
            this.game.clickSFX.play();
            this.scene.pause();
            this.scene.launch("PetScene");
        });

        items_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        items_button.on("pointerdown", () => {
            this.game.clickSFX.play();

            console.log("clicked on items button");
            
        });



        // //pop up container
        // const popUp = this.add.sprite(0, 0, "pop-up");
        // popUp.setScrollFactor(0).setDepth(100);
        // const popUpTitle = this.add.text(0, 0, "MONSTER BATTLE", {
        //     fontFamily: "Poppins",
        //     fontSize: "17px",
        //     color: "#fff",
        //     fontStyle: "bold",
            
        // }).setOrigin(0.5, 0).setDepth(101);
        // popUpTitle.setPosition(0, -popUp.displayHeight / 2 + 5);

        // const closeButton = this.add.image(0,0, "close-button");
        // closeButton.setDisplaySize(32,32).setDepth(101).setPosition(popUp.displayWidth/2-20, -popUp.displayHeight/2+15);
        

        // const popUpContainer = this.add.container(width/2, height/2, [popUp, popUpTitle, closeButton]).setScrollFactor(0);
        // closeButton.setInteractive({useHandCursor: true}).setScrollFactor(0);
        // closeButton.on("pointerdown", () => {
        //     popUpContainer.destroy();
        // });
        





        this.anims.create( {key: "move", frames: this.anims.generateFrameNumbers("character1", {start: 13, end: 19}), frameRate: 12, repeat: -1});


        this.anims.create({
            key: "stand",
            frames: this.anims.generateFrameNumbers("character1", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });

        
    


        this.joystick = this.rexVirtualJoystick.add(this, {
        x: 100,
        y: this.scale.height - 200,
        radius: 60,
        base: this.add.circle(0, 0, 60, 0x000000, 0.3),
        thumb: this.add.circle(0, 0, 30, 0xffffff, 0.5),
    });
    

    }



    updatePlayerXY(){
        this.USER.lastX = Math.floor(this.player.x + (Math.random()*100));
        this.USER.lastY = Math.floor(this.player.y + (Math.random()*100));
        localStorage.setItem("USER", JSON.stringify(this.USER));
    }
    updateBalance(value){
        this.USER.gold = this.USER.gold + value;
        this.gold_text.setText((this.USER.gold));
    }

    update(){
        if (!this.physics.overlap(this.player, this.pin)) {
            this.popupOpen = false;
            
        }

        const speed = 120;
        // Always reset first
        
        this.player.setVelocity(0);

        let moved = false;
        
        // -------- JOYSTICK --------
        if (this.joystick && this.joystick.force > 0) {

            let vec = new Phaser.Math.Vector2(
                this.joystick.forceX,
                this.joystick.forceY
            );

            if (vec.length() > 0) {

                    let angle = vec.angle();

                    // Snap to 45 degrees
                    let snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

                    let speed = 150;

                    let vx = Math.cos(snapAngle) * speed;
                    let vy = Math.sin(snapAngle) * speed;

                    this.player.setVelocity(vx, vy);
                    moved = true;

                    // Get direction index (0–7)
                    let direction = Math.round(snapAngle / (Math.PI / 4));

                    if (direction < 0) {
                        direction += 8;
                    }

                    // Save last direction (for idle later)
                    this.lastDirection = direction;

                    switch (direction) {

                        case 0:
                            this.player.anims.play("player-right-anim", true);
                            break;

                        case 1:
                            this.player.anims.play("player-down-right-anim", true);
                            break;

                        case 2:
                            this.player.anims.play("player-down-anim", true);
                            break;

                        case 3:
                            this.player.anims.play("player-down-left-anim", true);
                            break;

                        case 4:
                            this.player.anims.play("player-left-anim", true);
                            break;

                        case 5:
                            this.player.anims.play("player-up-left-anim", true);
                            break;

                        case 6:
                            this.player.anims.play("player-up-anim", true);
                            break;

                        case 7:
                            this.player.anims.play("player-up-right-anim", true);
                            break;
                    }
                }
        }


        // -------- KEYBOARD --------
        if (!moved) {

            if (this.cursor.up.isDown){
                this.player.setVelocityY(-speed);
                this.player.anims.play("player-up-anim", true);
            }
            else if (this.cursor.down.isDown){
                this.player.setVelocityY(speed);
                this.player.anims.play("player-down-anim", true);
            }

            else if (this.cursor.left.isDown){
                this.player.setVelocityX(-speed);
                this.player.anims.play("player-left-anim", true);
            }
            else if (this.cursor.right.isDown){
                this.player.setVelocityX(speed);
                this.player.anims.play("player-right-anim", true);
            }
            else{
                 this.player.anims.play("player-stand-anim", true);
            }
        }


    }
}

function randomPointInRect(obj) {
    return {
        x: obj.x + Math.random() * obj.width,
        y: obj.y + Math.random() * obj.height
    };
}
