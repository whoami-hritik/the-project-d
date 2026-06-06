import { WorldScene } from "./game.js";
export class PreloadScene extends Phaser.Scene{
    constructor(){
        super({key: "PreloadScene"});
    }

    preload(){

        console.log("Preload Scene Started")
        
        const { width, height } = this.scale;

        
        // Progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();

        progressBox.fillStyle(0x000000, 0.6);
        progressBox.fillRoundedRect(width/2 - 150, height - 150, 300, 40, 20);

        const percentText = this.add.text(width/2, height - 130, "0%", {
            font: "20px Arial",
            fill: "#ffffff"
        }).setOrigin(0.5);

        this.load.on("progress", (value) => {

            percentText.setText(parseInt(value * 100) + "%");

            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);

            progressBar.fillRoundedRect(
                width/2 - 145,
                height - 145,
                290 * value,
                30,
                15
            );
        });

        this.load.on("complete", () => {

            this.time.delayedCall(500, () => {
                const playButton = this.add.image(this.scale.width/2,this.scale.height/2+300,"play-button");
                playButton.setDisplaySize(120,48).setInteractive({useHandCursor:true});
                console.log("game - scene starting");
                this.scene.start("WorldScene");
                // playButton.on("pointerdown", () => {
                //     this.game.clickSFX.play();
                //     this.cameras.main.fadeOut(500, 0, 0, 0);

                //     this.cameras.main.once("camerafadeoutcomplete", () => {
                //         this.scene.start("GameScene");
                //     });

                // });
                
            });



        }); 
        
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

        this.load.spritesheet("dark_beam", "images/battle/abilities/fx/dark_beam.png", { frameWidth: 160, frameHeight: 470 });
        this.load.spritesheet("haunt", "images/battle/abilities/fx/haunt.png", { frameWidth: 60, frameHeight: 200 });
        this.load.spritesheet("rage_fx_front", "images/battle/abilities/fx/rage_fx_front.png", { frameWidth:302 , frameHeight: 458 });
        this.load.spritesheet("rage_fx_back", "images/battle/abilities/fx/rage_fx_back.png", { frameWidth: 302, frameHeight: 458 });
        this.load.spritesheet("poison_bite", "images/battle/abilities/fx/poison_bite.png", { frameWidth: 230, frameHeight: 316 });
        this.load.spritesheet("quick_disappear", "images/battle/abilities/fx/quick_disappear.png", { frameWidth: 299, frameHeight: 311 });
        this.load.spritesheet("quick_punch", "images/battle/abilities/fx/quick_punch.png", { frameWidth: 352, frameHeight: 317 });

        this.load.spritesheet("sick_fx", "images/battle/abilities/fx/sick_fx.png", { frameWidth: 90, frameHeight: 100 });
        this.load.spritesheet("catch_use", "images/battle/catch_disk.png", { frameWidth: 201, frameHeight: 207 });

    
        //Shop
        this.load.image("bg_shop", "images/shop/bg_shop.png");
        this.load.image("bg_slot", "images/shop/bg_slot.png");
        this.load.image("exchange_slot", "images/shop/exchange_slot.png");
        this.load.image("btn_exchange", "images/shop/btn_exchange.png");
        this.load.image("btn_sell", "images/shop/btn_sell.png");


        //exchagne terms items
        // this.load.image("ITEM_EGGS", "images/general/")
        this.load.image("item_dust", "images/items/icons/dust.png");
        this.load.image("item_can_water_blast", "images/items/icons/can_water_blast.png");

        //item
        this.load.image("bg_item", "images/items/bg_item_and_outfit.png");
        this.load.image("item_slot", "images/items/item_slot.png");
        this.load.image("item_selected", "images/items/item_selected.png");
        this.load.image("btn_use", "images/items/btn_use.png");
        this.load.image("item_monstaBall", "images/items/icons/discatch.png");
        
        const monsters = ["kikflick", "snorky", "torchip", "pyropine", "duckron", "tuffnut","tortunk", "sluglug", "psython", "hopchop", "humzee"]
        monsters.forEach(key => {
            //monster icon
            this.load.image(`icon_${key}`, `images/mons/${key}/icon.png`);

            //monster front
            this.load.image(`front_${key}`, `images/mons/${key}/front.png`);

            //monster back
            this.load.image(`back_${key}`, `images/mons/${key}/back.png`);
        });

        const abilities = [
            "scratch", 
            "leaf_strike", 
            "shockwave", 
            "rage", 
            "rainbow", 
            "spores", 
            "sonic_waves", 
            "bubbles", "flash", 
            "freeze", 
            "ice_storm", 
            "rain_fire", 
            "quick_attack", 
            "enflame", 
            "hellfire", 
            "magma", 
            "smoke",
            "poison_bite", 
            "confuse", 
            "dark_beam", 
            "haunt"
        ]

        //abilities spritesheet


        //abilities icon
        abilities.forEach(ab => {
            this.load.image(`icon_${ab}`, `images/battle/abilities/icons/${ab}.png`);
        });
    }

    create(){


        this.anims.create({
            key: "anim_deck_shuffle",
            frames: this.anims.generateFrameNumbers("deck_shuffle",{ start: 0, end: 4 }),
            frameRate: 12,
            repeat: 1
        });

        this.anims.create({
            key: "anim_card_use",
            frames: this.anims.generateFrameNumbers("card_use", { start: 0, end: 5 }),
            frameRate: 10
        });

        this.anims.create({
            key: "anim_sick_fx",
            frames: this.anims.generateFrameNumbers("sick_fx", { start: 0, end: 4}),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: "anim_dark_beam",
            frames: this.anims.generateFrameNumbers("dark_beam", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: "anim_haunt",
            frames: this.anims.generateFrameNumbers("haunt", { start: 0, end: 2 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: "anim_rage_fx_front",
            frames: this.anims.generateFrameNumbers("rage_fx_front", { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "anim_rage_fx_back",
            frames: this.anims.generateFrameNumbers("rage_fx_back", { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: "anim_poison_bite",
            frames: this.anims.generateFrameNumbers("poison_bite"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'anim_quick_disappear',
            frames: this.anims.generateFrameNumbers('quick_disappear', { start: 0, end: 1 }),
            frameRate: 8,
            repeat: 0,
        });

        this.anims.create({
            key: "anim_catch_start",
            frames: this.anims.generateFrameNumbers("catch_use", { start: 0, end: 2 }),
            frameRate: 8
        });

        this.anims.create({
            key: "anim_catch_status",
            frames: [
                { key: 'catch_use', frame: 1 }, 
                { key: 'catch_use', frame: 2 }, 
                { key: 'catch_use', frame: 1 }  
            ],
            frameRate: 5,
            repeat: 3
        });

        this.anims.create({
            key: "anim_catch_failed",
            frames: [
                { key: 'catch_use', frame: 3, duration: 1200 }, 
                { key: 'catch_use', frame: 4 },
                { key: 'catch_use', frame: 5 },
                { key: "catch_use", frame: 6 },
                { key: "catch_use", frame: 7 }  
            ],
            frameRate: 5
        })
 
        this.anims.create({
            key: 'anim_quick_punch',
            frames: this.anims.generateFrameNumbers('quick_punch', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 2,
            onUpdate: (sprite, frame) => {
                if (frame.index === 0) {
                    sprite.y -= 10;
                } else if (frame.index === 1) {
                    sprite.x += 20; 
                } else if (frame.index === 2) {
                    sprite.y += 10;
                }
            }
        });




    }
}
