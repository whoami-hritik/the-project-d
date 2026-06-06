import { MapScene  } from "./map.js";
import { state } from "../state.js";
import { InventoryScene } from "./inventory.js";
import * as api from "../webapp/api.js";

const BOTTOM = 740;
const ICONWIDTH = 80;

export class WorldScene extends Phaser.Scene{
    constructor(){
        super({key: "WorldScene"});
    }

    create(){
        this.width = this.scale.width;
        this.height = this.scale.height;
        
        

        this.initializeBG();
        this.createMenu();

        api.loadUser().then(result => {
            this.USER = state.user;
            this.createProfile();

            if (!this.USER.bonus){
                this.createOverlay();
                this.initiateBonus();
            }
        })
       
    }

    createProfile(){
        const username = this.USER.username;
        const tokens = Array.from(username, chr => chr.charCodeAt(0));
        const profileHud = this.add.image(0, 15, "hud_profile");

        profileHud.setDisplaySize(profileHud.displayWidth/1.2, profileHud.displayHeight/1.2).setScrollFactor(0).setOrigin(0);
        let lastCharWidth = 0;
        tokens.forEach((t) => {
            const chara = this.add.image(100 +lastCharWidth, 40, "c"+t);
            chara.setDisplaySize(chara.displayWidth/2, chara.displayHeight/2).setScrollFactor(0).setOrigin(0);
            lastCharWidth += chara.displayWidth;
        });

        const toncoin = this.add.image(100, 65, "item_ton");
        toncoin.setDisplaySize(toncoin.displayWidth/3.5, toncoin.displayHeight/3.5).setOrigin(0).setScrollFactor(0);


        const formatNumber = (num) => {
            return new Intl.NumberFormat('en', { 
                notation: 'compact',
                maximumFractionDigits: 2 // Adjust decimal places here
            }).format(num);
        };

        const tonAmt = formatNumber(this.USER.ton).toString();
        const tonChars = Array.from(tonAmt, chr => chr.charCodeAt(0));
        let tonCharsWidth = 0
        tonChars.forEach(ch => {

            const chars = this.add.image(105+toncoin.displayWidth+ tonCharsWidth, 70, `sw${ch}`);
            chars.setDisplaySize(chars.displayWidth/1.5, chars.displayHeight/1.5).setScrollFactor(0).setOrigin(0);
            tonCharsWidth += chars.displayWidth;
        });

        const goldCoinx = 105+toncoin.displayWidth+ tonCharsWidth +10;
        const goldCoin = this.add.image(goldCoinx, 65, "item_gold");
        goldCoin.setDisplaySize(goldCoin.displayWidth/4, goldCoin.displayHeight/4).setScrollFactor(0).setOrigin(0);


        const goldAmt = formatNumber(this.USER.gold).toString();
        const goldChars = Array.from(goldAmt, chr => chr.charCodeAt(0));
        let goldCharWidth = 0;
        goldChars.forEach(ch => {
            const chars = this.add.image(goldCoinx+goldCoin.displayWidth+goldCharWidth+5, 70, `sw${ch}`);
            chars.setDisplaySize(chars.displayWidth/1.5, chars.displayHeight/1.5).setScrollFactor(0).setOrigin(0);
            goldCharWidth+= chars.displayWidth;
        });


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

    createMenu(){
        this.menu = this.add.container(20, BOTTOM);
        const icons = ["btn_shop", "", "btn_missions", "btn_items", "btn_team"]
        const scenes = ["ShopScene", "", "MissionScene", "ItemScene", "InventoryScene"]

        icons.forEach((e, i) => {
            if (i == 1) return;
            const icon = this.add.image(20 + (i*ICONWIDTH), 0, e);
            icon.setDisplaySize(80,80);
            icon.setInteractive({useHandCursor: true}).setScrollFactor(0);
            this.menu.add(icon);


            icon.on("pointerup", (pointer) => {
                if(!checkClick(pointer)) return;
                if (scenes[i] === ""){
                   
                }else{
                    this.scene.launch(scenes[i]);
                    console.log(scenes[i]+" started");
                }
                
            });
            
        });

    }

    initiateBonus(){
        const bonusMonsters = ["kikflick", "snorky", "torchip"]
        const container = this.add.container(0,-1000).setDepth(100).setScrollFactor(0);

        const title = this.add.image(90, 320, "choose_title").setDisplaySize(220, 20).setOrigin(0);
        const pannelEarth = this.add.image(10, 350, "choose_panel_earth").setDisplaySize(120,210).setOrigin(0);
        const pannelWater = this.add.image(137.5, 350, "choose_panel_water").setDisplaySize(120,210).setOrigin(0);
        const pannelFire = this.add.image(265, 350, "choose_panel_fire").setDisplaySize(120,210).setOrigin(0);

        container.add([title, pannelEarth, pannelFire, pannelWater]);


        bonusMonsters.forEach((m ,index) => {
            const monster = this.add.image(20+ index*125, 415, "front_"+m ).setDisplaySize(110, 95).setOrigin(0);
            const btnChoose = this.add.image(20 + index*130, 530, "btn_choose").setDisplaySize(95,45).setOrigin(0).setInteractive({useHandCursor:true});
            btnChoose.on("pointerup", (pointer) => {
                if(!checkClick(pointer)) return;

                
                api.GetBonus(index).then(data => {
                    if(data.success){
                        console.log("bonus received");
                        container.destroy();
                        const selectedMons = this.add.image(80, this.height/3, "front_"+m).setDisplaySize(120, 125).setOrigin(0).setDepth(100).setScrollFactor(0);
                        localStorage.setItem("selectedMonster",  JSON.stringify(data.monster));
                        state.selectedMonster = data.monster;
                        this.tweens.add({
                            targets: selectedMons,
                            scale: 1,
                            duration: 500,
                            ease: "Power2",
                            yoyo: false,
                            onComplete: () => {
                                this.overlay.on("pointerup", (pointer) => {
                                    if(!checkClick(pointer)) return;
                                    selectedMons.destroy();
                                    this.destroyOverlay();
                                });
                            }
                        })
                    }
                });



            });
            container.add([monster, btnChoose]);

            this.tweens.add({
                targets: container,
                y: 0,
                duration: 500,
                delay: 1000
            })
        });

    }

    initializeBG(){
        const bg = this.add.image( 0 , 0, "world-bg");
        bg.setOrigin(0);

        const texture = this.textures.get("world-bg").getSourceImage();

     
        const scale = (this.height + 100) / bg.height;
        bg.setScale(scale);

        const worldWidth = bg.displayWidth;
        const worldHeight = bg.displayHeight;

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight); //camera bound
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight); //world bound

        const worlds = [
            { name: "bootcamp", x: 90, y: 600 },
            { name: "riverfall", x: 475, y: 476 },
            // { name: "ruins", x: 1058, y: 488 },
            // { name: "costa", x: 602, y: 372 },
            // { name: "volcano", x: 827, y: 549 },
            // { name: "winterdale", x: 610, y: 583 },
            // { name: "castle", x: 772,y:395 },
            // { name: "gold_city", x: 1131, y: 429 },
            // { name: "fire_temple", x:135, y: 380 },
            // { name: "powerplant", x: 408, y: 453 }
        ];

        worlds.forEach((w, i) => {
            // if (i > 3) return;
            const world = this.add.image(w.x, w.y, "world-"+w.name+"-icon");
            world.setDisplaySize(80,80).setOrigin(0).setInteractive({useHandCursor:true});

            world.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                this.createOverlay();
                const info_container = this.add.container(200, 400).setDepth(101);
                const map_info = this.add.image(0, 0, "map-info").setDisplaySize(this.width, 400).setScrollFactor(0);
                const map_header = this.add.image(0, -150, w.name+"-header").setDisplaySize(this.width, 100).setScrollFactor(0);
                const btn_close = this.add.image(180, -200, "close-button").setDisplaySize(32,32).setInteractive({useHandCursor: true}).setScrollFactor(0);
                const btn_go = this.add.image(140, -60, "go-button").setDisplaySize(90, 45).setInteractive({useHandCursor:true}).setScrollFactor(0);
                info_container.add([map_info, map_header, btn_close, btn_go]);

                btn_close.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    this.destroyOverlay();
                    info_container.destroy();
                });

                btn_go.on("pointerup", (pointer) => {
                    if (!checkClick(pointer)) return;
                    this.scene.stop();
                    this.scene.start("MapScene", { map: w.name });
                    
                });
            });
        });
        
        this.cameras.main.scrollY = 0;
        this.input.on("pointermove", (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
            }
        });

    
    }
}

export function checkClick(pointer){
    const dist = Phaser.Math.Distance.Between(
        pointer.downX, pointer.downY,
        pointer.upX, pointer.upY
    );

    if (dist < 10) { 
        return true;
    }
    return false;
}