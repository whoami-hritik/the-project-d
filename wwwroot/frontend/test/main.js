const BOTTOM = 740;
const ICONWIDTH = 80;


export class MainScene extends Phaser.Scene{
    constructor(){
        super({key: "MainScene"});
    }


    preload(){
    
        console.log("Main loaded");


             
        this.load.image("world-bg", "images/hub/worldbg.png");

        // world icons
        this.load.image("world-bootcamp-icon", "images/hub/bootcamp-icon.png");
        this.load.image("world-riverfall-icon", "images/hub/icon_cave.png");
        this.load.image("world-ruins-icon", "images/hub/icon_ruins.png");
        this.load.image("world-costa-icon", "images/hub/icon_costa.png");
        this.load.image("world-castle-icon", "images/hub/icon_castle.png");
        this.load.image("world-winterdale-icon", "images/hub/icon_festive.png");
        this.load.image("world-volcano-icon", "images/hub/icon_volcano.png");
        this.load.image("world-powerplant-icon", "images/hub/icon_powerplant.png");
        this.load.image("world-fire_temple-icon", "images/hub/icon_fire_temple.png");
        this.load.image("world-gold_city-icon", "images/hub/icon_gold_city.png");
    

        // worlds backgrounds
        this.load.image("bootcamp-bg-1", "images/area_bootcamp/bg-1.png");
        this.load.image("bootcamp-bg-2", "images/area_bootcamp/bg-2.png");

        //battle world backgrounds
        this.load.image("bgs_camp", "images/area_bootcamp/camp.png");

        this.load.image("btn_world", "images/buttons/btn_world.png");
        this.load.image("btn_shop", "images/buttons/btn_shop.png");
        this.load.image("btn_team", "images/buttons/btn_team.png");
        this.load.image("btn_items", "images/buttons/btn_items.png");
        this.load.image("btn_missions", "images/buttons/btn_missions.png");
        this.load.image("btn_referral", "images/buttons/btn_referral.png");


        //character icons
        this.load.image("alaska-icon", "images/char_icons/alaska-icon.png");
        this.load.image("blaze-icon", "images/char_icons/blaze_icon.png");
        this.load.image("boris-icon", "images/char_icons/boris_icon.png");
        this.load.image("bradley-icon", "images/char_icons/bradley_icon.png");
        this.load.image("cable-icon", "images/char_icons/cable_icon.png");


        //fonts (white_stroked_big)
        for (let i = 32; i <= 122; i++) {
            this.load.image(`c${i}`, `images/fonts/white_stroked_big/c${i}.png`);
        }

        //font black_medium
        this.load.image(`ch32`, `images/fonts/black_medium/c32.png`);
        this.load.image(`ch35`, `images/fonts/black_medium/c35.png`);
        for (let i = 48; i <= 57; i++) {
            this.load.image(`ch${i}`, `images/fonts/black_medium/c${i}.png`);
        }

        //small white
        for (let i = 32; i <= 122; i++){
            this.load.image(`sw${i}`, `images/fonts/white_small/c${i}.png`);
        }

        //hud
        this.load.image("profile-bg", "images/modals/profile_bg.png");
        this.load.image("hud_profile", "images/modals/hud_profile.png");
        this.load.image("item_coin", "images/items/icons/coins.png");
        this.load.image("item_ton", "images/items/icons/ton.png");
        this.load.image("item_gold", "images/items/icons/item_gold.png");


        //general
        
        this.load.image("map-info", "images/general/map_info/bg.png");
        this.load.image("go-button", "images/general/btn_go.png");
        this.load.image("close-button", "images/general/btn_close.png");
        this.load.image("go-button", "images/general/btn_go.png");
        this.load.image("ton-icon", "images/general/ton.png");
        this.load.image("hud-currency", "images/general/hud_currency.png");
        this.load.image("node", "images/general/node.png");
        this.load.image("player", "images/general/avatar_boy.png");
        this.load.image("marker_battle", "images/general/marker_battle.png");
        this.load.image("mons_shadow", "images/general/mon_shadow.png");


        //general hud
        this.load.image("pane_big_fire", "images/general/hud/pane_big_fire.png");
        this.load.image("pane_big_water", "images/general/hud/pane_big_water.png");
        this.load.image("pane_big_earth", "images/general/hud/pane_big_earth.png");
        this.load.image("pane_big_elec", "images/general/hud/pane_big_elec.png");
        this.load.image("pane_big_dark", "images/general/hud/pane_big_dark.png");
        this.load.image("pane_mini_dark", "images/general/hud/pane_mini_dark.png");
        this.load.image("pane_mini_elec", "images/general/hud/pane_mini_elec.png");
        this.load.image("pane_mini_earth", "images/general/hud/pane_mini_earth.png");
        this.load.image("pane_mini_water", "images/general/hud/pane_mini_water.png");
        this.load.image("pane_mini_fire", "images/general/hud/pane_mini_fire.png");
        this.load.image("hpbar_big_bg", "images/general/hud/hpbar_big_bg.png");
        this.load.image("hpbar_big_fill_red", "images/general/hud/hpbar_big_fill_red.png");
        this.load.image("hpbar_big_fill", "images/general/hud/hpbar_big_fill.png");
        this.load.image("hpbar_med_bg", "images/general/hud/hpbar_med_bg.png");
        this.load.image("hpbar_med_fill", "images/general/hud/hpbar_med_fill.png");
        this.load.image("hpbar_small_bg", "images/general/hud/hpbar_small_bg.png");
        this.load.image("hpbar_small_fill", "images/general/hud/hpbar_small_fill.png");
        this.load.image("pane_tooltip_elec", "images/general/hud/pane_tooltip_elec.png");
        this.load.image("pane_tooltip_dark", "images/general/hud/pane_tooltip_dark.png");
        this.load.image("pane_tooltip_water", "images/general/hud/pane_tooltip_water.png");
        this.load.image("pane_tooltip_fire", "images/general/hud/pane_tooltip_fire.png");
        this.load.image("pane_tooltip_earth", "images/general/hud/pane_tooltip_earth.png");
        this.load.image("loading_buffer", "images/general/loading_buffer.png");

    
        //map headers
        this.load.image("bootcamp-header", "images/general/map_info/headers/bootcamp.png");
        this.load.image("riverfall-header", "images/general/map_info/headers/cave.png");
        this.load.image("ruins-header", "images/general/map_info/headers/ruins.png");
        this.load.image("costa-header", "images/general/map_info/headers/costa.png");
        this.load.image("castle-header", "images/general/map_info/headers/castle.png");
        this.load.image("winterdale-header", "images/general/map_info/headers/festive.png");
        this.load.image("volcano-header", "images/general/map_info/headers/volcano.png");
        this.load.image("powerplant-header", "images/general/map_info/headers/powerplant.png");
        this.load.image("fire_temple-header", "images/general/map_info/headers/fire_temple.png");
        this.load.image("gold_city-header", "images/general/map_info/headers/gold_city.png");


        //inventory
        this.load.image("inventory-bg", "images/general/inventory/bg_inventory.png");
        this.load.image("team-slot", "images/general/inventory/team_slot.png");
        this.load.image("btn-back-map", "images/general/inventory/btn_back_map.png");
        this.load.image("pane_thumb_earth", "images/general/inventory/pane_thumb_earth.png");
        this.load.image("pane_thumb_water", "images/general/inventory/pane_thumb_water.png");
        this.load.image("pane_thumb_fire", "images/general/inventory/pane_thumb_fire.png");
        this.load.image("pane_thumb_dark", "images/general/inventory/pane_thumb_dark.png");
        this.load.image("pane_thumb_elec", "images/general/inventory/pane_thumb_elec.png");
        this.load.image("btn_back_all", "images/general/inventory/btn_back_all.png");
        this.load.image("btn_arrow_right", "images/general/btn_arrow_right.png");

        //info
        this.load.image("xpbar_bg", "images/general/xpbar_bg.png");
        this.load.image("xpbar_fill", "images/general/xpbar_fill.png");
        this.load.image("skills_bg", "images/general/inventory/skills_bg.png");
        this.load.image("skill_lock", "images/general/inventory/skill_lock.png");
        this.load.image("btn_release", "images/general/inventory/btn_release.png");


        //onboarding
        this.load.image("choose_panel_earth", "images/onboarding/choose_panel_earth.png");
        this.load.image("choose_panel_water", "images/onboarding/choose_panel_water.png");
        this.load.image("choose_panel_fire", "images/onboarding/choose_panel_fire.png");
        this.load.image("choose_title", "images/onboarding/choose_title.png");
        this.load.image("btn_choose", "images/onboarding/btn_choose.png");

        //battle 
        this.load.image("btn_back", "images/battle/btn_back.png");
        this.load.image("btn_catch_off", "images/battle/btn_catch_off.png");
        this.load.image("btn_catch", "images/battle/btn_catch.png");
        this.load.image("btn_escape", "images/battle/btn_escape.png");
        this.load.image("btn_more", "images/battle/btn_more.png");
        this.load.image("cardback", "images/battle/abilities/cardback.png");


        this.load.image("slash", "images/battle/abilities/fx/slash.png");
        this.load.image("hypno_fx", "images/battle/abilities/fx/hypno_fx.png");
        
        //endscreen
        this.load.image("pedestal", "images/general/pedestal.png");
        this.load.image("btn_later", "images/general/btn_later.png");

        //spritesheets
        this.load.spritesheet("deck_shuffle", "images/battle/deck_shuffle.png", { frameWidth: 220, frameHeight: 220 });
        this.load.spritesheet("card_use", "images/battle/card_use.png", { frameWidth: 150, frameHeight: 150 });



    }

    create(){
        this.width = this.scale.width;
        this.height = this.scale.height;
        
        

        this.initializeBG();
        this.createMenu();

      
       
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

    createProfile(){
        const username = "this_is_hritik";
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


    destroyOverlay(){
            this.overlay.destroy();
        }
    
        createMenu(){
            this.menu = this.add.container(20, BOTTOM);
            const icons = ["btn_shop", "btn_referral", "btn_missions", "btn_items", "btn_team"]
            const scenes = ["ShopScene", "ReferralScene", "TestScene", "ItemScene", "InventoryScene"]
    
            icons.forEach((e, i) => {
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
    
}

export function startGame(){
    const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 800,
        backgroundColor: "#ffffff",
        parent: 'game-container',
        physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // or 300 if platformer
            debug: false // optional
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [MainScene],
        plugins: {
        scene: [{
            key: 'rexVirtualJoystick',
            plugin: window.rexvirtualjoystickplugin, 
            mapping: 'rexVirtualJoystick'
        }]
        },
        render: {
                pixelArt: false,
                roundPixels: true
        }
    }

    const game = new Phaser.Game(config);
}

startGame();