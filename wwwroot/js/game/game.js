import { state } from "../state.js";
import * as api from "../webapp/api.js"
import { InventoryScene  } from "./inventory.js";
import { BattleScene } from "./battle.js";


let width = 0;
let height = 0;
const POPUPWIDTH = 320;
const POPUPHEIGHT = 250;
const locationWidth = 32;
const locationHeight = 48;


class ProfileUI {
    constructor(scene, x, y, data) {
        this.scene = scene;
        this.container = scene.add.container(x, y);

        this.createUI(data);
    }

    createUI(data) {
        const { scene, container } = this;

        // Background
        const bg = scene.add.rectangle(0, 0, 350, 80, 0x1e1e2f)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff, 0.1);

        // Avatar
        const avatar = scene.add.image(10, 10, 'avatar')
            .setOrigin(0)
            .setDisplaySize(60, 60);

        // Name
        const nameText = scene.add.text(80, 15, data.name, {
            fontSize: '16px',
            color: '#ffffff'
        });

        // TON (Top Right - Important)
        const tonIcon = scene.add.image(300, 20, 'ton').setScale(0.5).setDisplaySize(16,16);
        const tonText = scene.add.text(320, 15, data.ton, {
            fontSize: '14px',
            color: '#00aaff'
        });

        // GOLD
        const goldIcon = scene.add.image(80, 65, 'gold').setScale(0.5);
        const goldText = scene.add.text(100, 58, data.gold, {
            fontSize: '14px',
            color: '#ffd700'
        });

        // CRYSTAL
        const crystalIcon = scene.add.image(200, 65, 'crystal').setScale(0.5);
        const crystalText = scene.add.text(220, 58, data.crystal, {
            fontSize: '14px',
            color: '#00ffff'
        });

        container.add([
            bg,
            avatar,
            nameText,
            tonIcon, tonText,
            goldIcon, goldText,
            crystalIcon, crystalText
        ]);
        container.setScrollFactor(0);

        // Store references (VERY IMPORTANT)
        this.goldText = goldText;
        this.crystalText = crystalText;
        this.tonText = tonText;
        this.nameText = nameText;
    }

    update(data) {
        if (data.gold !== undefined) this.goldText.setText(data.gold);
        if (data.crystal !== undefined) this.crystalText.setText(data.crystal);
        if (data.ton !== undefined) this.tonText.setText(data.ton);
        if (data.name !== undefined) this.nameText.setText(data.name);
    }

    get() {
        return this.container;
    }
}

export class GameScene extends Phaser.Scene{
    constructor(){
        super({key: "GameScene"});
    }
    create(){
        width = this.scale.width;
        height = this.scale.height;
        this.game.battleMusic.stop();
        this.game.bgMusic.play();

        this.USER = state.user;
        console.log(this.USER);

        this.createWorld();

        const profileUI = new ProfileUI(this, 20, 20, {
            name: "Hritik",
            gold: 1200,
            crystal: 45,
            ton: 3.25
        });
        this.createJoystick();
        this.createMenu();
        this.spawnMonsters();
        this.defaultMonster = localStorage.getItem("default-monster");
        if(this.defaultMonster == null){
            this.defaultMonster = "f78d86ff-1efb-4444-9c99-a1c680388b90"
        }

        this.backgroundDull = this.add.rectangle(180, 360, width, height, 0x000000, 0.8).setDepth(-1);
        

        
    }


    createWorld(){
        
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

        //enable keyboard
        this.cursor = this.input.keyboard.createCursorKeys();

        const ground4 = world.createLayer("Tile Layer 4", [object64, treeShed, blackLayer], 0, 0);
        const ground5 = world.createLayer("Tile Layer 5", object64, 0 ,0);

        //character
        this.player = this.physics.add.sprite(300,800, "player-down", 0);
        
        this.player.setPosition(this.USER.coordinates.x, this.USER.coordinates.Y);

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


        

    }

    updateCoords(){
        this.USER.coordinates = { x : this.player.x + (Math.random()*50),
                                  y : this.player.y + (Math.random()*50),
                                };
        this.player.x = this.USER.coordinates.x;
        this.player.y = this.USER.coordinates.y;
    }

    spawnMonsters(){
        // const spawnExpireAt = new Date(this.USER.lastSpawn).getTime() +60*60*1000;
        // if (Date.now() < spawnExpireAt){

        //     return;
        // }
        api.spawnMonsters().then(response => {
            if (response.success){
                
                this.spawns = response.spawns;
                console.log(this.spawns+"     spawns");
                this.USER.lastSpawn = response.lastSpawn;
                this.spawns.forEach(spawn => {
                    console.log("\n"+spawn+"-------");
                    if (spawn.fight){
                        return;
                    }

                    const mark = this.physics.add.image(spawn.x, spawn.y, "location-mark")
                                                .setDisplaySize(locationWidth, locationHeight)
                                                .setImmovable(true)
                                                .setInteractive();
                    
                    
                    this.tweens.add({
                        targets : mark,
                        scale : 0.4,
                        yoyo : true,
                        repeat : -1,
                        duration : 300
                    });

                    this.overlapped = this.physics.add.overlap(this.player, mark, () => {
                        if(this.popupOpen){
                            return;
                        }
                        this.popupOpen = true;
                        this.updateCoords();

                        console.log("Popup open");
                        const overlay = this.add.rectangle(0, 0, width, height, 0xffffff, 0.3)
                        overlay.setOrigin(0);
                        // overlay.setDepth(100);
                        overlay.setInteractive({useHandCursor: true});
                        overlay.setScrollFactor(0);
                        

                        
                        const popup = this.add.container(width/2, height/2).setScrollFactor(0).setDepth(100);

                        const bg = this.add.image(0, 0, "monster-battle-pop");
                        bg.setDisplaySize(POPUPWIDTH, POPUPHEIGHT).setScrollFactor(0);
                          
                        

                        //show inventory monsters those are ready for the battle
                        
                        const fightbtn = this.add.image(0, 0, "fight-button");
                        const padding = 20;
                        fightbtn.setDisplaySize(80, 32)
                                .setPosition(0, bg.height/2 - padding - fightbtn.displayHeight/2)
                                .setInteractive()
                                .setScrollFactor(0);

                        popup.add([bg, fightbtn]);
                        fightbtn.on("pointerdown", async () => {
                           
                            const response = await api.fightBattle(spawn.id, this.defaultMonster);
                            if (response.success){
                                this.popupOpen = false;
                                this.game.bgMusic.stop();
                                this.scene.start("BattleScene", { battle : response.battle });
                            }else{
                                console.log(response.reason);
                            }
                        })

                        overlay.on("pointerdown", () => {
                            bg.destroy();
                            fightbtn.destroy();
                            overlay.destroy();
                            this.popupOpen = false;
                        })
                        

                    });                                
                });
            }else{
                
            }
        });
    }


    async startBattle(Id, MonsterID){
        const response = await api.fightBattle(Id, MonsterID);
        if (response.success){
            this.scene.start("BattleScene", { battle : response.battle });
        }
    }

    createJoystick(){
        this.joystick = this.rexVirtualJoystick.add(this, {
            x: 100,
            y: this.scale.height - 200,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x000000, 0.3),
            thumb: this.add.circle(0, 0, 30, 0xffffff, 0.5),
        });
    }

    openMenu(){
        this.tweens.add({
            target : this.menu,
            y : 1000,
            duration : 300,
            ease : 'Power2'
        });
    }
    createMenu(){
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
       

        this.menu = this.add.container(this.scale.width-42, this.scale.height-42, [
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

            // this.game.clickSFX.play();
            // this.openMenu();
            // this.scene.pause();
            this.scene.launch("InventoryScene");
        });
        
        items_button.setInteractive({ useHandCursor: true }).setScrollFactor(0);

        items_button.on("pointerdown", () => {
            this.game.clickSFX.play();

            console.log("clicked on items button");
            
        });

    }

    

    update(){

        //Player
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