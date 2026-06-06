export class PreloadScene extends Phaser.Scene{
    constructor(){
        super({key: "PreloadScene"});
    }

    preload(){

        
    const { width, height } = this.scale;

    // Background
    const bg = this.add.image(0, 0, "loading-bg")
        .setOrigin(0)
        .setDisplaySize(width, height);

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

            playButton.on("pointerdown", () => {
                this.game.clickSFX.play();
                this.cameras.main.fadeOut(500, 0, 0, 0);

                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("GameScene");
                });

            });
            
        });

    });

        //tiled world json
        this.load.tilemapTiledJSON("tileMap", "assets/tiled/world1.json");

        //world spritesheets
        this.load.image("layer1", "assets/world/New Piskel-13.png(1)(4).png");
        this.load.image("layer2", "assets/world/New Piskel-13.png(1)(4).png");
        this.load.image("layer3", "assets/world/New Piskel-13.png(1)-93.png.png");
        this.load.image("layer4", "assets/world/New Piskel-13.png(1)-3.png.png");
        this.load.image("layer5", "assets/world/New Piskel-13.png(1)-2.png.png");

        this.load.image("startingbackground", "assets/world/startingbackground.png");
        this.load.spritesheet("character1", "assets/character/Character 1.png", { frameWidth: 36, frameHeight: 56});


        //load battle background
        this.load.image("water-battleground", "assets/world/background/water-battleground.png");
        //inventory background
        this.load.image("inventory-background", "assets/world/background/inventory.png");
        this.load.image("slots-background", "assets/world/background/slots.png");

        //load pin point location
        this.load.image("pin-location", "assets/world/pinpoint.png");
        this.load.image("location-mark", "assets/world/location.png");

        //load i-icon
        this.load.image("i-icon", "assets/world/i-icon.png");
        this.load.image("flag-icon", "assets/world/flag-icon.png");
        this.load.image("gold-icon", "assets/world/coin.png");
        this.load.image("blue-gem", "assets/world/blue-gem.png");
        this.load.image("map-back", "assets/world/map-back.png");
    

        //Assasin front idle
        this.load.image("assasin-Front-idle0", "assets/character/assasin/Front - Idle/Front - Idle_000.png");
        this.load.image("assasin-Front-idle1", "assets/character/assasin/Front - Idle/Front - Idle_001.png");
        this.load.image("assasin-Front-idle2", "assets/character/assasin/Front - Idle/Front - Idle_002.png");
        this.load.image("assasin-Front-idle3", "assets/character/assasin/Front - Idle/Front - Idle_003.png");
        this.load.image("assasin-Front-idle4", "assets/character/assasin/Front - Idle/Front - Idle_004.png");
        this.load.image("assasin-Front-idle5", "assets/character/assasin/Front - Idle/Front - Idle_005.png");
        this.load.image("assasin-Front-idle6", "assets/character/assasin/Front - Idle/Front - Idle_006.png");
        this.load.image("assasin-Front-idle7", "assets/character/assasin/Front - Idle/Front - Idle_007.png");
        this.load.image("assasin-Front-idle8", "assets/character/assasin/Front - Idle/Front - Idle_008.png");
        this.load.image("assasin-Front-idle9", "assets/character/assasin/Front - Idle/Front - Idle_009.png");
        this.load.image("assasin-Front-idle10", "assets/character/assasin/Front - Idle/Front - Idle_010.png");
        this.load.image("assasin-Front-idle11", "assets/character/assasin/Front - Idle/Front - Idle_011.png");
        this.load.image("assasin-Front-idle12", "assets/character/assasin/Front - Idle/Front - Idle_012.png");
        this.load.image("assasin-Front-idle13", "assets/character/assasin/Front - Idle/Front - Idle_013.png");
        this.load.image("assasin-Front-idle14", "assets/character/assasin/Front - Idle/Front - Idle_014.png");
        this.load.image("assasin-Front-idle15", "assets/character/assasin/Front - Idle/Front - Idle_015.png");



        //Assasin Left Idle

        this.load.image("assasin-Left-idle0", "assets/character/assasin/Left - Idle/Left - Idle_000.png");
        this.load.image("assasin-Left-idle1", "assets/character/assasin/Left - Idle/Left - Idle_001.png");
        this.load.image("assasin-Left-idle2", "assets/character/assasin/Left - Idle/Left - Idle_002.png");
        this.load.image("assasin-Left-idle3", "assets/character/assasin/Left - Idle/Left - Idle_003.png");
        this.load.image("assasin-Left-idle4", "assets/character/assasin/Left - Idle/Left - Idle_004.png");
        this.load.image("assasin-Left-idle5", "assets/character/assasin/Left - Idle/Left - Idle_005.png");
        this.load.image("assasin-Left-idle6", "assets/character/assasin/Left - Idle/Left - Idle_006.png");
        this.load.image("assasin-Left-idle7", "assets/character/assasin/Left - Idle/Left - Idle_007.png");
        this.load.image("assasin-Left-idle8", "assets/character/assasin/Left - Idle/Left - Idle_008.png");
        this.load.image("assasin-Left-idle9", "assets/character/assasin/Left - Idle/Left - Idle_009.png");
        this.load.image("assasin-Left-idle10", "assets/character/assasin/Left - Idle/Left - Idle_010.png");
        this.load.image("assasin-Left-idle11", "assets/character/assasin/Left - Idle/Left - Idle_011.png");
        this.load.image("assasin-Left-idle12", "assets/character/assasin/Left - Idle/Left - Idle_012.png");
        this.load.image("assasin-Left-idle13", "assets/character/assasin/Left - Idle/Left - Idle_013.png");
        this.load.image("assasin-Left-idle14", "assets/character/assasin/Left - Idle/Left - Idle_014.png");
        this.load.image("assasin-Left-idle15", "assets/character/assasin/Left - Idle/Left - Idle_015.png");

        //Assasin Right Idle

        this.load.image("assasin-Right-idle0", "assets/character/assasin/Right - Idle/Right - Idle_000.png");
        this.load.image("assasin-Right-idle1", "assets/character/assasin/Right - Idle/Right - Idle_001.png");
        this.load.image("assasin-Right-idle2", "assets/character/assasin/Right - Idle/Right - Idle_002.png");
        this.load.image("assasin-Right-idle3", "assets/character/assasin/Right - Idle/Right - Idle_003.png");
        this.load.image("assasin-Right-idle4", "assets/character/assasin/Right - Idle/Right - Idle_004.png");
        this.load.image("assasin-Right-idle5", "assets/character/assasin/Right - Idle/Right - Idle_005.png");
        this.load.image("assasin-Right-idle6", "assets/character/assasin/Right - Idle/Right - Idle_006.png");
        this.load.image("assasin-Right-idle7", "assets/character/assasin/Right - Idle/Right - Idle_007.png");
        this.load.image("assasin-Right-idle8", "assets/character/assasin/Right - Idle/Right - Idle_008.png");
        this.load.image("assasin-Right-idle9", "assets/character/assasin/Right - Idle/Right - Idle_009.png");
        this.load.image("assasin-Right-idle10", "assets/character/assasin/Right - Idle/Right - Idle_010.png");
        this.load.image("assasin-Right-idle11", "assets/character/assasin/Right - Idle/Right - Idle_011.png");
        this.load.image("assasin-Right-idle12", "assets/character/assasin/Right - Idle/Right - Idle_012.png");
        this.load.image("assasin-Right-idle13", "assets/character/assasin/Right - Idle/Right - Idle_013.png");
        this.load.image("assasin-Right-idle14", "assets/character/assasin/Right - Idle/Right - Idle_014.png");
        this.load.image("assasin-Right-idle15", "assets/character/assasin/Right - Idle/Right - Idle_015.png");


        //Assasin Back Idle

        this.load.image("assasin-Back-idle0", "assets/character/assasin/Back - Idle/Back - Idle_000.png");
        this.load.image("assasin-Back-idle1", "assets/character/assasin/Back - Idle/Back - Idle_001.png");
        this.load.image("assasin-Back-idle2", "assets/character/assasin/Back - Idle/Back - Idle_002.png");
        this.load.image("assasin-Back-idle3", "assets/character/assasin/Back - Idle/Back - Idle_003.png");
        this.load.image("assasin-Back-idle4", "assets/character/assasin/Back - Idle/Back - Idle_004.png");
        this.load.image("assasin-Back-idle5", "assets/character/assasin/Back - Idle/Back - Idle_005.png");
        this.load.image("assasin-Back-idle6", "assets/character/assasin/Back - Idle/Back - Idle_006.png");
        this.load.image("assasin-Back-idle7", "assets/character/assasin/Back - Idle/Back - Idle_007.png");
        this.load.image("assasin-Back-idle8", "assets/character/assasin/Back - Idle/Back - Idle_008.png");
        this.load.image("assasin-Back-idle9", "assets/character/assasin/Back - Idle/Back - Idle_009.png");
        this.load.image("assasin-Back-idle10", "assets/character/assasin/Back - Idle/Back - Idle_010.png");
        this.load.image("assasin-Back-idle11", "assets/character/assasin/Back - Idle/Back - Idle_011.png");
        this.load.image("assasin-Back-idle12", "assets/character/assasin/Back - Idle/Back - Idle_012.png");
        this.load.image("assasin-Back-idle13", "assets/character/assasin/Back - Idle/Back - Idle_013.png");
        this.load.image("assasin-Back-idle14", "assets/character/assasin/Back - Idle/Back - Idle_014.png");
        this.load.image("assasin-Back-idle15", "assets/character/assasin/Back - Idle/Back - Idle_015.png");


        //Assasin Left Running
        this.load.image("assasin-Left-Running0", "assets/character/assasin/Left - Running/Left - Running_000.png");
        this.load.image("assasin-Left-Running1", "assets/character/assasin/Left - Running/Left - Running_001.png");
        this.load.image("assasin-Left-Running2", "assets/character/assasin/Left - Running/Left - Running_002.png");
        this.load.image("assasin-Left-Running3", "assets/character/assasin/Left - Running/Left - Running_003.png");
        this.load.image("assasin-Left-Running4", "assets/character/assasin/Left - Running/Left - Running_004.png");
        this.load.image("assasin-Left-Running5", "assets/character/assasin/Left - Running/Left - Running_005.png");
        this.load.image("assasin-Left-Running6", "assets/character/assasin/Left - Running/Left - Running_006.png");
        this.load.image("assasin-Left-Running7", "assets/character/assasin/Left - Running/Left - Running_007.png");
        this.load.image("assasin-Left-Running8", "assets/character/assasin/Left - Running/Left - Running_008.png");
        this.load.image("assasin-Left-Running9", "assets/character/assasin/Left - Running/Left - Running_009.png");
        this.load.image("assasin-Left-Running10", "assets/character/assasin/Left - Running/Left - Running_010.png");
        this.load.image("assasin-Left-Running11", "assets/character/assasin/Left - Running/Left - Running_011.png");

        //Assasin Right Running
        this.load.image("assasin-Right-Running0", "assets/character/assasin/Right - Running/Right - Running_000.png");
        this.load.image("assasin-Right-Running1", "assets/character/assasin/Right - Running/Right - Running_001.png");
        this.load.image("assasin-Right-Running2", "assets/character/assasin/Right - Running/Right - Running_002.png");
        this.load.image("assasin-Right-Running3", "assets/character/assasin/Right - Running/Right - Running_003.png");
        this.load.image("assasin-Right-Running4", "assets/character/assasin/Right - Running/Right - Running_004.png");
        this.load.image("assasin-Right-Running5", "assets/character/assasin/Right - Running/Right - Running_005.png");
        this.load.image("assasin-Right-Running6", "assets/character/assasin/Right - Running/Right - Running_006.png");
        this.load.image("assasin-Right-Running7", "assets/character/assasin/Right - Running/Right - Running_007.png");
        this.load.image("assasin-Right-Running8", "assets/character/assasin/Right - Running/Right - Running_008.png");
        this.load.image("assasin-Right-Running9", "assets/character/assasin/Right - Running/Right - Running_009.png");
        this.load.image("assasin-Right-Running10", "assets/character/assasin/Right - Running/Right - Running_010.png");
        this.load.image("assasin-Right-Running11", "assets/character/assasin/Right - Running/Right - Running_011.png");

        //Assasin Front Running

        this.load.image("assasin-Front-Running0", "assets/character/assasin/Front - Running/Front - Running_000.png");
        this.load.image("assasin-Front-Running1", "assets/character/assasin/Front - Running/Front - Running_001.png");
        this.load.image("assasin-Front-Running2", "assets/character/assasin/Front - Running/Front - Running_002.png");
        this.load.image("assasin-Front-Running3", "assets/character/assasin/Front - Running/Front - Running_003.png");
        this.load.image("assasin-Front-Running4", "assets/character/assasin/Front - Running/Front - Running_004.png");
        this.load.image("assasin-Front-Running5", "assets/character/assasin/Front - Running/Front - Running_005.png");
        this.load.image("assasin-Front-Running6", "assets/character/assasin/Front - Running/Front - Running_006.png");
        this.load.image("assasin-Front-Running7", "assets/character/assasin/Front - Running/Front - Running_007.png");
        this.load.image("assasin-Front-Running8", "assets/character/assasin/Front - Running/Front - Running_008.png");
        this.load.image("assasin-Front-Running9", "assets/character/assasin/Front - Running/Front - Running_009.png");
        this.load.image("assasin-Front-Running10", "assets/character/assasin/Front - Running/Front - Running_010.png");
        this.load.image("assasin-Front-Running11", "assets/character/assasin/Front - Running/Front - Running_011.png");


        //Assasin Back Running

        this.load.image("assasin-Back-Running0", "assets/character/assasin/Back - Running/Back - Running_000.png");
        this.load.image("assasin-Back-Running1", "assets/character/assasin/Back - Running/Back - Running_001.png");
        this.load.image("assasin-Back-Running2", "assets/character/assasin/Back - Running/Back - Running_002.png");
        this.load.image("assasin-Back-Running3", "assets/character/assasin/Back - Running/Back - Running_003.png");
        this.load.image("assasin-Back-Running4", "assets/character/assasin/Back - Running/Back - Running_004.png");
        this.load.image("assasin-Back-Running5", "assets/character/assasin/Back - Running/Back - Running_005.png");
        this.load.image("assasin-Back-Running6", "assets/character/assasin/Back - Running/Back - Running_006.png");
        this.load.image("assasin-Back-Running7", "assets/character/assasin/Back - Running/Back - Running_007.png");
        this.load.image("assasin-Back-Running8", "assets/character/assasin/Back - Running/Back - Running_008.png");
        this.load.image("assasin-Back-Running9", "assets/character/assasin/Back - Running/Back - Running_009.png");
        this.load.image("assasin-Back-Running10", "assets/character/assasin/Back - Running/Back - Running_010.png");
        this.load.image("assasin-Back-Running11", "assets/character/assasin/Back - Running/Back - Running_011.png");



        //load monster icons
        this.load.image("aqua-leviathan-icon", "assets/monster/monster-icon/aqua-leviathan.png");
        this.load.image("gravi-corrupter-icon", "assets/monster/monster-icon/gravi-corrupter.png");
        this.load.image("igni-beast-icon", "assets/monster/monster-icon/igni-beast.png");
        this.load.image("volt-draco-icon", "assets/monster/monster-icon/volt-draco.png");
        this.load.image("terra-behomth-icon", "assets/monster/monster-icon/terra-behomth.png");
        this.load.image("blaze-raptor-icon", "assets/monster/monster-icon/blaze-raptor.png");
        this.load.image("cinder-wolf-icon", "assets/monster/monster-icon/cinder-wolf.png");
        this.load.image("crystal-lynx-icon", "assets/monster/monster-icon/crystal-lynx.png");
        this.load.image("dune-striker-icon", "assets/monster/monster-icon/dune-striker.png");
        this.load.image("frost-titan-icon", "assets/monster/monster-icon/frost-titan.png");
        this.load.image("glacial-warden-icon", "assets/monster/monster-icon/glacial-warden.png");
        this.load.image("settings-title", "assets/world/settings-title.png");


        //ui
        this.load.image("bag-background", "assets/world/bag.png");
        this.load.image("monsta-ball", "assets/world/monsta-ball.png");
        this.load.image("victory-banner", "assets/world/victory.png");
        this.load.image("defeat-banner", "assets/world/defeat.png");
        this.load.image("stand-land", "assets/world/stand-land.png");
        this.load.image("monster-battle-pop", "assets/world/monster-battle-pop.png");


        //moster load front
        this.load.image("aqua-leviathan", "assets/monster/aqua-leviathan.png");
        this.load.image("gravi-corrupter", "assets/monster/gravi-corrupter.png");
        this.load.image("volt-draco", "assets/monster/volt-draco.png");
        this.load.image("igni-beast", "assets/monster/igni-beast.png");
        this.load.image("terra-behomth", "assets/monster/terra-behomth.png");
        this.load.image("blaze-raptor", "assets/monster/blaze-raptor.png");
        this.load.image("cinder-wolf", "assets/monster/cinder-wolf.png");
        this.load.image("crystal-lynx", "assets/monster/crystal-lynx.png");
        this.load.image("dune-striker", "assets/monster/dune-striker.png");
        this.load.image("frost-titan", "assets/monster/frost-titan.png");
        this.load.image("glacial-warden", "assets/monster/glacial-warden.png");
        
        //monster load back
        this.load.image("volt-draco-back", "assets/monster/volt-draco-back.png");
        this.load.image("igni-beast-back", "assets/monster/monster-back/igni-beast.png");
        this.load.image("terra-behomth-back", "assets/monster/monster-back/terra-behomth.png");
        


        //buttons

        this.load.image("pets-button", "assets/world/pets-button.png");
        this.load.image("shop-button", "assets/world/shop-button.png");
        this.load.image("mission-button", "assets/world/mission-button.png");
        this.load.image("items-button", "assets/world/items-button.png");
        this.load.image("characters-button", "assets/world/characters-button.png");
        this.load.image("pop-up", "assets/world/pop-up.png");
        this.load.image("close-button", "assets/world/close-button.png");
        this.load.image("more-button", "assets/world/more-button.png");
        this.load.image("back-button", "assets/world/back-button.png");
        this.load.image("back", "assets/world/back-img.png");
        this.load.image("back-icon", "assets/world/back.png");
        this.load.image("settings-button", "assets/world/settings.png");
        this.load.image("escape-button", "assets/world/escape-button.png");
        this.load.image("catch-button", "assets/world/catch-button.png");
        this.load.image("choose-button", "assets/world/choose-button.png");
        this.load.image("fight-button", "assets/world/fight-button.png");

        //background scenes
        this.load.image("grass-background", "assets/world/background/grass-background.png");
        this.load.image("setting-background", "assets/world/settings-background.png");

        



        //load skills
        this.load.image("aqua-blast", "assets/monster/skill-icon/Icons/aqua-blast.png");
        this.load.image("chaos-blast", "assets/monster/skill-icon/Icons/chaos-blast.png");
        this.load.image("electric-nova", "assets/monster/skill-icon/Icons/electric-nova.png");
        this.load.image("fireball-brust", "assets/monster/skill-icon/Icons/fireball-brust.png");
        this.load.image("hydro-swrill", "assets/monster/skill-icon/Icons/hydro-swrill.png");
        this.load.image("lightning-shard", "assets/monster/skill-icon/Icons/lightning-shard.png");
        this.load.image("poision-gas", "assets/monster/skill-icon/Icons/poision-gas.png");
        this.load.image("shadow-smoke", "assets/monster/skill-icon/Icons/shadow-smoke.png");
        this.load.image("tornado-strike", "assets/monster/skill-icon/Icons/tornado-strike.png");
        this.load.image("toxic-cloud", "assets/monster/skill-icon/Icons/toxic-cloud.png");
        this.load.image("volcanic-eruption", "assets/monster/skill-icon/Icons/volcanic-eruption.png");
        this.load.image("smoke-cloud", "assets/monster/skill-icon/Icons/smoke-cloud.png");
        this.load.image("nuclear-blast", "assets/monster/skill-icon/Icons/nuclear-blast.png");
        this.load.image("lava-blast", "assets/monster/skill-icon/Icons/lava-blast.png");


        //load monsters data
        this.load.json("monsters", "assets/monster/monsters.json");
        this.load.json("monster-skills", "assets/monster/skills.json");


        //load skill animation png
        //lightning-shard
        this.load.image("lightning-shard-01", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning1.png");
        this.load.image("lightning-shard-02", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning2.png");
        this.load.image("lightning-shard-03", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning3_part.png");
        this.load.image("lightning-shard-04", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning3.png");
        this.load.image("lightning-shard-05", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning4_part.png");
        this.load.image("lightning-shard-06", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning4.png");
        this.load.image("lightning-shard-07", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning5_part.png");
        this.load.image("lightning-shard-08", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_beginning5.png");
        this.load.image("lightning-shard-09", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle1.png");
        this.load.image("lightning-shard-10", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle2.png");
        this.load.image("lightning-shard-11", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle3.png");
        this.load.image("lightning-shard-12", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle4.png");
        this.load.image("lightning-shard-13", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle5.png");
        this.load.image("lightning-shard-14", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_cycle6.png");
        this.load.image("lightning-shard-15", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_end1.png");
        this.load.image("lightning-shard-16", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_end2.png");
        this.load.image("lightning-shard-17", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_end3.png");
        this.load.image("lightning-shard-18", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_spot1.png");
        this.load.image("lightning-shard-19", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_spot2.png");
        this.load.image("lightning-shard-20", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_spot3.png");
        this.load.image("lightning-shard-21", "assets/monster/skill-anim/explosive-skills/PNG/lightning-shard/Lightning_spot4.png");

        //tornado-strike

        this.load.image("tornado-strike-01", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors1.png");
        this.load.image("tornado-strike-02", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors2.png");
        this.load.image("tornado-strike-03", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors3.png");
        this.load.image("tornado-strike-04", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors4.png");
        this.load.image("tornado-strike-05", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors5.png");
        this.load.image("tornado-strike-06", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors6.png");
        this.load.image("tornado-strike-07", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors7.png");
        this.load.image("tornado-strike-08", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors8.png");
        this.load.image("tornado-strike-09", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors9.png");
        this.load.image("tornado-strike-10", "assets/monster/skill-anim/explosive-skills/PNG/tornado-strike/Explosion_two_colors10.png");


        //hydro-swril

        this.load.image("hydro-swril-01", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle1.png");
        this.load.image("hydro-swril-02", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle2.png");
        this.load.image("hydro-swril-03", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle3.png");
        this.load.image("hydro-swril-04", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle4.png");
        this.load.image("hydro-swril-05", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle5.png");
        this.load.image("hydro-swril-06", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle6.png");
        this.load.image("hydro-swril-07", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle7.png");
        this.load.image("hydro-swril-08", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle8.png");
        this.load.image("hydro-swril-09", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle9.png");
        this.load.image("hydro-swril-10", "assets/monster/skill-anim/explosive-skills/PNG/hydro-swril/Explosion_blue_circle10.png");


        //fireball-brust

        this.load.image("fireball-brust-01", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire1.png");
        this.load.image("fireball-brust-02", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire2.png");
        this.load.image("fireball-brust-03", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire3.png");
        this.load.image("fireball-brust-04", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire4.png");
        this.load.image("fireball-brust-05", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire5.png");
        this.load.image("fireball-brust-06", "assets/monster/skill-anim/explosive-skills/PNG/fireball-brust/Fire6.png");


        //aqua-blast
        this.load.image("aqua-blast-01", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval1.png");
        this.load.image("aqua-blast-02", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval2.png");
        this.load.image("aqua-blast-03", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval3.png");
        this.load.image("aqua-blast-04", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval4.png");
        this.load.image("aqua-blast-05", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval5.png");
        this.load.image("aqua-blast-06", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval6.png");
        this.load.image("aqua-blast-07", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval7.png");
        this.load.image("aqua-blast-08", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval8.png");
        this.load.image("aqua-blast-09", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval9.png");
        this.load.image("aqua-blast-10", "assets/monster/skill-anim/explosive-skills/PNG/aqua-blast/Explosion_blue_oval10.png");



        //lava-blast
        this.load.image("lava-blast-01", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion1.png");
        this.load.image("lava-blast-02", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion2.png");
        this.load.image("lava-blast-03", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion3.png");
        this.load.image("lava-blast-04", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion4.png");
        this.load.image("lava-blast-05", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion5.png");
        this.load.image("lava-blast-06", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion6.png");
        this.load.image("lava-blast-07", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion7.png");
        this.load.image("lava-blast-08", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion9.png");
        this.load.image("lava-blast-09", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion9.png");
        this.load.image("lava-blast-10", "assets/monster/skill-anim/explosive-skills/PNG/lava-blast/Explosion10.png");


        //nuclear-blast
        this.load.image("nuclear-blast-01", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion1.png");
        this.load.image("nuclear-blast-02", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion2.png");
        this.load.image("nuclear-blast-03", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion3.png");
        this.load.image("nuclear-blast-04", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion4.png");
        this.load.image("nuclear-blast-05", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion5.png");
        this.load.image("nuclear-blast-06", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion6.png");
        this.load.image("nuclear-blast-07", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion7.png");
        this.load.image("nuclear-blast-08", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion8.png");
        this.load.image("nuclear-blast-09", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion9.png");
        this.load.image("nuclear-blast-10", "assets/monster/skill-anim/explosive-skills/PNG/nuclear-blast/Nuclear_explosion10.png");


        //posion-gas
        this.load.image("poision-gas-01", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle1.png");
        this.load.image("poision-gas-02", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle2.png");
        this.load.image("poision-gas-03", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle3.png");
        this.load.image("poision-gas-04", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle4.png");
        this.load.image("poision-gas-05", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle5.png");
        this.load.image("poision-gas-06", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle6.png");
        this.load.image("poision-gas-07", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle7.png");
        this.load.image("poision-gas-08", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle8.png");
        this.load.image("poision-gas-09", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle9.png");
        this.load.image("poision-gas-10", "assets/monster/skill-anim/explosive-skills/PNG/poision-gas/Explosion_gas_circle10.png");


        //shoadow-smoke
        this.load.image("shadow-smoke-01", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke1.png");
        this.load.image("shadow-smoke-02", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke2.png");
        this.load.image("shadow-smoke-03", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke3.png");
        this.load.image("shadow-smoke-04", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke4.png");
        this.load.image("shadow-smoke-05", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke5.png");
        this.load.image("shadow-smoke-06", "assets/monster/skill-anim/explosive-skills/PNG/shadow-smoke/Smoke6.png");


        //smoke-cloud
        this.load.image("smoke-cloud-01", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas1.png");
        this.load.image("smoke-cloud-02", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas2.png");
        this.load.image("smoke-cloud-03", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas3.png");
        this.load.image("smoke-cloud-04", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas4.png");
        this.load.image("smoke-cloud-05", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas5.png");
        this.load.image("smoke-cloud-06", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas6.png");
        this.load.image("smoke-cloud-07", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas7.png");
        this.load.image("smoke-cloud-08", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas8.png");
        this.load.image("smoke-cloud-09", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas9.png");
        this.load.image("smoke-cloud-10", "assets/monster/skill-anim/explosive-skills/PNG/smoke-cloud/Explosion_gas10.png");


        //volcanic-eruption
        this.load.image("volcanic-eruption-01", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion1.png");
        this.load.image("volcanic-eruption-02", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion2.png");
        this.load.image("volcanic-eruption-03", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion3.png");
        this.load.image("volcanic-eruption-04", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion4.png");
        this.load.image("volcanic-eruption-05", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion5.png");
        this.load.image("volcanic-eruption-06", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion6.png");
        this.load.image("volcanic-eruption-07", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion7.png");
        this.load.image("volcanic-eruption-08", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion8.png");
        this.load.image("volcanic-eruption-09", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion9.png");
        this.load.image("volcanic-eruption-10", "assets/monster/skill-anim/explosive-skills/PNG/volcanic-eruption/Circle_explosion10.png");



        //explosion anim image
        this.load.image("explosion-01", "assets/anim/explosion/1_0.png");
        this.load.image("explosion-02", "assets/anim/explosion/1_1.png");
        this.load.image("explosion-03", "assets/anim/explosion/1_2.png");
        this.load.image("explosion-04", "assets/anim/explosion/1_3.png");
        this.load.image("explosion-05", "assets/anim/explosion/1_4.png");
        this.load.image("explosion-06", "assets/anim/explosion/1_5.png");
        this.load.image("explosion-07", "assets/anim/explosion/1_6.png");
        this.load.image("explosion-08", "assets/anim/explosion/1_7.png");
        this.load.image("explosion-09", "assets/anim/explosion/1_8.png");
        this.load.image("explosion-10", "assets/anim/explosion/1_9.png");
        this.load.image("explosion-11", "assets/anim/explosion/1_10.png");
        this.load.image("explosion-12", "assets/anim/explosion/1_11.png");
        this.load.image("explosion-13", "assets/anim/explosion/1_12.png");
        this.load.image("explosion-14", "assets/anim/explosion/1_13.png");
        this.load.image("explosion-15", "assets/anim/explosion/1_14.png");
        this.load.image("explosion-16", "assets/anim/explosion/1_15.png");
        this.load.image("explosion-17", "assets/anim/explosion/1_16.png");
        this.load.image("explosion-18", "assets/anim/explosion/1_17.png");
        this.load.image("explosion-19", "assets/anim/explosion/1_18.png");
        this.load.image("explosion-20", "assets/anim/explosion/1_19.png");
        this.load.image("explosion-21", "assets/anim/explosion/1_20.png");
        this.load.image("explosion-22", "assets/anim/explosion/1_21.png");
        this.load.image("explosion-23", "assets/anim/explosion/1_22.png");
        this.load.image("explosion-24", "assets/anim/explosion/1_23.png");
        this.load.image("explosion-25", "assets/anim/explosion/1_24.png");
        this.load.image("explosion-26", "assets/anim/explosion/1_25.png");
        this.load.image("explosion-27", "assets/anim/explosion/1_26.png");
        this.load.image("explosion-28", "assets/anim/explosion/1_27.png");
        this.load.image("explosion-29", "assets/anim/explosion/1_28.png");
        this.load.image("explosion-30", "assets/anim/explosion/1_29.png");
        this.load.image("explosion-31", "assets/anim/explosion/1_30.png");
        this.load.image("explosion-32", "assets/anim/explosion/1_31.png");
        this.load.image("explosion-33", "assets/anim/explosion/1_32.png");
        this.load.image("explosion-34", "assets/anim/explosion/1_33.png");
        this.load.image("explosion-35", "assets/anim/explosion/1_34.png");
        this.load.image("explosion-36", "assets/anim/explosion/1_35.png");
        this.load.image("explosion-37", "assets/anim/explosion/1_36.png");
        this.load.image("explosion-38", "assets/anim/explosion/1_37.png");
        this.load.image("explosion-39", "assets/anim/explosion/1_38.png");
        this.load.image("explosion-40", "assets/anim/explosion/1_39.png");
        this.load.image("explosion-41", "assets/anim/explosion/1_40.png");
        this.load.image("explosion-42", "assets/anim/explosion/1_41.png");
        this.load.image("explosion-43", "assets/anim/explosion/1_42.png");
        this.load.image("explosion-44", "assets/anim/explosion/1_43.png");
        this.load.image("explosion-45", "assets/anim/explosion/1_44.png");
        this.load.image("explosion-46", "assets/anim/explosion/1_45.png");
        this.load.image("explosion-47", "assets/anim/explosion/1_46.png");
        this.load.image("explosion-48", "assets/anim/explosion/1_47.png");
        this.load.image("explosion-49", "assets/anim/explosion/1_48.png");
        this.load.image("explosion-50", "assets/anim/explosion/1_49.png");


        //blue-flame anim
        this.load.image("blue-flame-01", "assets/anim/blue-flame/effect1.png");
        this.load.image("blue-flame-02", "assets/anim/blue-flame/effect2.png");
        this.load.image("blue-flame-03", "assets/anim/blue-flame/effect3.png");
        this.load.image("blue-flame-04", "assets/anim/blue-flame/effect4.png");
        this.load.image("blue-flame-05", "assets/anim/blue-flame/effect5.png");
        this.load.image("blue-flame-06", "assets/anim/blue-flame/effect6.png");
        this.load.image("blue-flame-07", "assets/anim/blue-flame/effect7.png");
        

        this.load.image("red-aura-01", "assets/anim/red-aura/1.png");
        this.load.image("red-aura-02", "assets/anim/red-aura/2.png");
        this.load.image("red-aura-03", "assets/anim/red-aura/3.png");
        this.load.image("red-aura-04", "assets/anim/red-aura/4.png");
        this.load.image("red-aura-05", "assets/anim/red-aura/5.png");
        this.load.image("red-aura-06", "assets/anim/red-aura/6.png");
        this.load.image("red-aura-07", "assets/anim/red-aura/7.png");
        this.load.image("red-aura-08", "assets/anim/red-aura/8.png");
        this.load.image("red-aura-09", "assets/anim/red-aura/9.png");
        this.load.image("red-aura-10", "assets/anim/red-aura/10.png");
        this.load.image("red-aura-11", "assets/anim/red-aura/11.png");
        this.load.image("red-aura-12", "assets/anim/red-aura/12.png");
        this.load.image("red-aura-13", "assets/anim/red-aura/13.png");
        this.load.image("red-aura-14", "assets/anim/red-aura/14.png");
        this.load.image("red-aura-15", "assets/anim/red-aura/15.png");
        this.load.image("red-aura-16", "assets/anim/red-aura/16.png");
        this.load.image("red-aura-17", "assets/anim/red-aura/17.png");
        this.load.image("red-aura-18", "assets/anim/red-aura/18.png");
        this.load.image("red-aura-19", "assets/anim/red-aura/19.png");
        this.load.image("red-aura-20", "assets/anim/red-aura/20.png");
        this.load.image("red-aura-21", "assets/anim/red-aura/21.png");
        this.load.image("red-aura-22", "assets/anim/red-aura/22.png");
        this.load.image("red-aura-23", "assets/anim/red-aura/23.png");
        this.load.image("red-aura-24", "assets/anim/red-aura/24.png");
        this.load.image("red-aura-25", "assets/anim/red-aura/25.png");
        this.load.image("red-aura-26", "assets/anim/red-aura/26.png");
        this.load.image("red-aura-27", "assets/anim/red-aura/27.png");
        this.load.image("red-aura-28", "assets/anim/red-aura/28.png");
        this.load.image("red-aura-29", "assets/anim/red-aura/29.png");
        this.load.image("red-aura-30", "assets/anim/red-aura/30.png");
        this.load.image("red-aura-31", "assets/anim/red-aura/31.png");
        this.load.image("red-aura-32", "assets/anim/red-aura/32.png");
        this.load.image("red-aura-33", "assets/anim/red-aura/33.png");
        this.load.image("red-aura-34", "assets/anim/red-aura/34.png");
        this.load.image("red-aura-35", "assets/anim/red-aura/35.png");
        this.load.image("red-aura-36", "assets/anim/red-aura/36.png");
        this.load.image("red-aura-37", "assets/anim/red-aura/37.png");
        this.load.image("red-aura-38", "assets/anim/red-aura/38.png");
        this.load.image("red-aura-39", "assets/anim/red-aura/39.png");
        this.load.image("red-aura-40", "assets/anim/red-aura/40.png");
        this.load.image("red-aura-41", "assets/anim/red-aura/41.png");
        this.load.image("red-aura-42", "assets/anim/red-aura/42.png");
        this.load.image("red-aura-43", "assets/anim/red-aura/43.png");
        this.load.image("red-aura-44", "assets/anim/red-aura/44.png");
        this.load.image("red-aura-45", "assets/anim/red-aura/45.png");
        this.load.image("red-aura-46", "assets/anim/red-aura/46.png");
        this.load.image("red-aura-47", "assets/anim/red-aura/47.png");
        this.load.image("red-aura-48", "assets/anim/red-aura/48.png");
        this.load.image("red-aura-49", "assets/anim/red-aura/49.png");
        this.load.image("red-aura-50", "assets/anim/red-aura/50.png");
        this.load.image("red-aura-51", "assets/anim/red-aura/51.png");
        this.load.image("red-aura-52", "assets/anim/red-aura/52.png");
        this.load.image("red-aura-53", "assets/anim/red-aura/53.png");
        this.load.image("red-aura-54", "assets/anim/red-aura/54.png");
        this.load.image("red-aura-55", "assets/anim/red-aura/55.png");
        this.load.image("red-aura-56", "assets/anim/red-aura/56.png");
        this.load.image("red-aura-57", "assets/anim/red-aura/57.png");
        this.load.image("red-aura-58", "assets/anim/red-aura/58.png");
        this.load.image("red-aura-59", "assets/anim/red-aura/59.png");
        this.load.image("red-aura-60", "assets/anim/red-aura/60.png");




        //entry-aura

        this.load.image("entry-aura-1", "assets/anim/entry_aura/1.png");
        this.load.image("entry-aura-2", "assets/anim/entry_aura/2.png");
        this.load.image("entry-aura-3", "assets/anim/entry_aura/3.png");
        this.load.image("entry-aura-4", "assets/anim/entry_aura/4.png");
        this.load.image("entry-aura-5", "assets/anim/entry_aura/5.png");
        this.load.image("entry-aura-6", "assets/anim/entry_aura/6.png");
        this.load.image("entry-aura-7", "assets/anim/entry_aura/7.png");
        this.load.image("entry-aura-8", "assets/anim/entry_aura/8.png");
        this.load.image("entry-aura-9", "assets/anim/entry_aura/9.png");
        this.load.image("entry-aura-10", "assets/anim/entry_aura/10.png");
        this.load.image("entry-aura-11", "assets/anim/entry_aura/11.png");
        this.load.image("entry-aura-12", "assets/anim/entry_aura/12.png");
        this.load.image("entry-aura-13", "assets/anim/entry_aura/13.png");
        this.load.image("entry-aura-14", "assets/anim/entry_aura/14.png");
        this.load.image("entry-aura-15", "assets/anim/entry_aura/15.png");


        //blue-light
        this.load.spritesheet("blue-light", "assets/anim/light-effect/cyan-light.png", {frameWidth: 400, frameHeight: 400});

        this.load.image("inventory-bg", "assets/world/inventory-bg.png");
        this.load.image("cinder-wolf-icon1", "assets/monster/monster-icon/cinder-wolf-icon.png");


        //player
        this.load.spritesheet("player-up", "assets/character/player/Character_Up.png", {frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-down",  "assets/character/player/Character_Down.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-right",  "assets/character/player/Character_Right.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-left",  "assets/character/player/Character_Left.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-up-left", "assets/character/player/Character_UpLeft.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-down-left",  "assets/character/player/Character_DownLeft.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-up-right",  "assets/character/player/Character_UpRight.png",{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet("player-down-right",  "assets/character/player/Character_DownRight.png",{frameWidth: 32, frameHeight: 32});

    }

    create(){
        this.scale.on("resize", (gameSize) => {
            const { width, height } = gameSize;
            this.cameras.resize(width, height);
        });
       // create world
        // const world = this.make.tilemap({key: "tileMap"});m-but

        // //add world layers
        // const object32 = world.addTilesetImage("tilelayer1", "layer1");
        // const object64 = world.addTilesetImage("tilelayer2", "layer1");
        // const blackLayer = world.addTilesetImage("tilelayer3", "layer3");
        // const treeShed = world.addTilesetImage("tilelayer4", "layer4");
        // const treeTrunk = world.addTilesetImage("tilelayer5", "layer5");

        // //create layers
        // const ground1 = world.createLayer("Tile Layer 1", object32, 0 ,0);
        // const ground2 = world.createLayer("fence", object64, 0, 0);
        // const ground3 = world.createLayer("Tile Layer 3",[object32,object64, blackLayer], 0, 0);

        // const ground4 = world.createLayer("Tile Layer 4", [object64, treeShed, blackLayer], 0, 0);
        // const ground5 = world.createLayer("Tile Layer 5", object64, 0 ,0);


        // const bg = this.add.image(0, 0, "landing-img").setOrigin(0);
        // bg.setDisplaySize(this.scale.width, this.scale.height);

        // const start_bg = this.add.rectangle(100,100, 300,50, 0xffffff);
        // const start_text = this.add.text(100,100, "START", {fontFamily: "Nunito",fontSize: "24px", fontStyle:"bold", color: "#000000"}).setOrigin();

        // const button = this.add.container(100,100, [start_bg, start_text]);
        // start_bg.setInteractive({ useHandCursor: true });

        // start_bg.on("pointerdown", () => {
        //     this.scene.start("GameScene");
        // });

        // const playButton = this.add.image(this.scale.width/2,this.scale.height/2+300,"play-button");
        // playButton.setDisplaySize(120,48).setInteractive({useHandCursor:true});

        // playButton.on("pointerdown", () => {
        //     this.cameras.main.fadeOut(1000, 0, 0, 0);

        //     this.cameras.main.once("camerafadeoutcomplete", () => {
        //         this.scene.start("GameScene");
        //     });

        // });


        //create player anim
        this.anims.create({
            key: "assasin-Front-run",
            frames: [
                {key:"assasin-Front-Running0"},
                {key:"assasin-Front-Running1"},
                {key:"assasin-Front-Running2"},
                {key:"assasin-Front-Running3"},
                {key:"assasin-Front-Running4"},
                {key:"assasin-Front-Running5"},
                {key:"assasin-Front-Running6"},
                {key:"assasin-Front-Running7"},
                {key:"assasin-Front-Running8"},
                {key:"assasin-Front-Running9"},
                {key:"assasin-Front-Running10"},
                {key:"assasin-Front-Running11"}

            ],
            frameRate: 20,
            repeat: -1
        });


        this.anims.create({
            key: "assasin-Back-run",
            frames: [
                {key:"assasin-Back-Running0"},
                {key:"assasin-Back-Running1"},
                {key:"assasin-Back-Running2"},
                {key:"assasin-Back-Running3"},
                {key:"assasin-Back-Running4"},
                {key:"assasin-Back-Running5"},
                {key:"assasin-Back-Running6"},
                {key:"assasin-Back-Running7"},
                {key:"assasin-Back-Running8"},
                {key:"assasin-Back-Running9"},
                {key:"assasin-Back-Running10"},
                {key:"assasin-Back-Running11"}

            ],
            frameRate: 20,
            repeat: -1
        });


        this.anims.create({
            key: "assasin-Right-run",
            frames: [
                {key:"assasin-Right-Running0"},
                {key:"assasin-Right-Running1"},
                {key:"assasin-Right-Running2"},
                {key:"assasin-Right-Running3"},
                {key:"assasin-Right-Running4"},
                {key:"assasin-Right-Running5"},
                {key:"assasin-Right-Running6"},
                {key:"assasin-Right-Running7"},
                {key:"assasin-Right-Running8"},
                {key:"assasin-Right-Running9"},
                {key:"assasin-Right-Running10"},
                {key:"assasin-Right-Running11"}

            ],
            frameRate: 20,
            repeat: -1
        });


        this.anims.create({
            key: "assasin-Left-run",
            frames: [
                {key:"assasin-Left-Running0"},
                {key:"assasin-Left-Running1"},
                {key:"assasin-Left-Running2"},
                {key:"assasin-Left-Running3"},
                {key:"assasin-Left-Running4"},
                {key:"assasin-Left-Running5"},
                {key:"assasin-Left-Running6"},
                {key:"assasin-Left-Running7"},
                {key:"assasin-Left-Running8"},
                {key:"assasin-Left-Running9"},
                {key:"assasin-Left-Running10"},
                {key:"assasin-Left-Running11"}

            ],
            frameRate: 20,
            repeat: -1
        });


        //Idle anim
        this.anims.create({
            key: "assasin-Front-Idle",
            frames: [
                {key: "assasin-Front-idle0"},
                {key: "assasin-Front-idle1"},
                {key: "assasin-Front-idle2"},
                {key: "assasin-Front-idle3"},
                {key: "assasin-Front-idle4"},
                {key: "assasin-Front-idle5"},
                {key: "assasin-Front-idle6"},
                {key: "assasin-Front-idle7"},
                {key: "assasin-Front-idle8"},
                {key: "assasin-Front-idle9"},
                {key: "assasin-Front-idle10"},
                {key: "assasin-Front-idle11"},
                {key: "assasin-Front-idle12"},
                {key: "assasin-Front-idle13"},
                {key: "assasin-Front-idle14"},
                {key: "assasin-Front-idle15"}
            ],
            frameRate: 12,
            frames: -1
        })


        this.anims.create({
            key: "assasin-Back-Idle",
            frames: [
                {key: "assasin-Back-idle0"},
                {key: "assasin-Back-idle1"},
                {key: "assasin-Back-idle2"},
                {key: "assasin-Back-idle3"},
                {key: "assasin-Back-idle4"},
                {key: "assasin-Back-idle5"},
                {key: "assasin-Back-idle6"},
                {key: "assasin-Back-idle7"},
                {key: "assasin-Back-idle8"},
                {key: "assasin-Back-idle9"},
                {key: "assasin-Back-idle10"},
                {key: "assasin-Back-idle11"},
                {key: "assasin-Back-idle12"},
                {key: "assasin-Back-idle13"},
                {key: "assasin-Back-idle14"},
                {key: "assasin-Back-idle15"}
            ],
            frameRate: 12,
            frames: -1
        })

        this.anims.create({
            key: "assasin-Left-Idle",
            frames: [
                {key: "assasin-Left-idle0"},
                {key: "assasin-Left-idle1"},
                {key: "assasin-Left-idle2"},
                {key: "assasin-Left-idle3"},
                {key: "assasin-Left-idle4"},
                {key: "assasin-Left-idle5"},
                {key: "assasin-Left-idle6"},
                {key: "assasin-Left-idle7"},
                {key: "assasin-Left-idle8"},
                {key: "assasin-Left-idle9"},
                {key: "assasin-Left-idle10"},
                {key: "assasin-Left-idle11"},
                {key: "assasin-Left-idle12"},
                {key: "assasin-Left-idle13"},
                {key: "assasin-Left-idle14"},
                {key: "assasin-Left-idle15"}
            ],
            frameRate: 12,
            frames: -1
        })

        this.anims.create({
            key: "assasin-Right-Idle",
            frames: [
                {key: "assasin-Right-idle0"},
                {key: "assasin-Right-idle1"},
                {key: "assasin-Right-idle2"},
                {key: "assasin-Right-idle3"},
                {key: "assasin-Right-idle4"},
                {key: "assasin-Right-idle5"},
                {key: "assasin-Right-idle6"},
                {key: "assasin-Right-idle7"},
                {key: "assasin-Right-idle8"},
                {key: "assasin-Right-idle9"},
                {key: "assasin-Right-idle10"},
                {key: "assasin-Right-idle11"},
                {key: "assasin-Right-idle12"},
                {key: "assasin-Right-idle13"},
                {key: "assasin-Right-idle14"},
                {key: "assasin-Right-idle15"}
            ],
            frameRate: 12,
            frames: -1
        })


        //create skills anims
        //lightning-shard
        this.anims.create({
            key: "lightning-shard-anim",
            frames: [
                {key: "lightning-shard-01"},
                {key: "lightning-shard-02"},
                {key: "lightning-shard-03"},
                {key: "lightning-shard-04"},
                {key: "lightning-shard-05"},
                {key: "lightning-shard-06"},
                {key: "lightning-shard-07"},
                {key: "lightning-shard-08"},
                {key: "lightning-shard-09"},
                {key: "lightning-shard-10"},
                {key: "lightning-shard-11"},
                {key: "lightning-shard-12"},
                {key: "lightning-shard-13"},
                {key: "lightning-shard-14"},
                {key: "lightning-shard-15"},
                {key: "lightning-shard-16"},
                {key: "lightning-shard-17"},
                {key: "lightning-shard-18"},
                {key: "lightning-shard-19"},
                {key: "lightning-shard-20"},
                {key: "lightning-shard-21"}

            ],
            frameRate: 12,
            repeat: 1
        });

        this.anims.create({
            key: "tornado-strike-anim",
            frames: [
                {key: "tornado-strike-01"},
                {key: "tornado-strike-02"},
                {key: "tornado-strike-03"},
                {key: "tornado-strike-04"},
                {key: "tornado-strike-05"},
                {key: "tornado-strike-06"},
                {key: "tornado-strike-07"},
                {key: "tornado-strike-08"},
                {key: "tornado-strike-09"},
                {key: "tornado-strike-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "hydro-swril-anim",
            frames: [
                {key: "hydro-swril-01"},
                {key: "hydro-swril-02"},
                {key: "hydro-swril-03"},
                {key: "hydro-swril-04"},
                {key: "hydro-swril-05"},
                {key: "hydro-swril-06"},
                {key: "hydro-swril-07"},
                {key: "hydro-swril-08"},
                {key: "hydro-swril-09"},
                {key: "hydro-swril-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "aqua-blast-anim",
            frames: [
                {key: "aqua-blast-01"},
                {key: "aqua-blast-02"},
                {key: "aqua-blast-03"},
                {key: "aqua-blast-04"},
                {key: "aqua-blast-05"},
                {key: "aqua-blast-06"},
                {key: "aqua-blast-07"},
                {key: "aqua-blast-08"},
                {key: "aqua-blast-09"},
                {key: "aqua-blast-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

    
        this.anims.create({
            key: "lava-blast-anim",
            frames: [
                {key: "lava-blast-01"},
                {key: "lava-blast-02"},
                {key: "lava-blast-03"},
                {key: "lava-blast-04"},
                {key: "lava-blast-05"},
                {key: "lava-blast-06"},
                {key: "lava-blast-07"},
                {key: "lava-blast-08"},
                {key: "lava-blast-09"},
                {key: "lava-blast-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "volcanic-eruption-anim",
            frames: [
                {key: "volcanic-eruption-01"},
                {key: "volcanic-eruption-02"},
                {key: "volcanic-eruption-03"},
                {key: "volcanic-eruption-04"},
                {key: "volcanic-eruption-05"},
                {key: "volcanic-eruption-06"},
                {key: "volcanic-eruption-07"},
                {key: "volcanic-eruption-08"},
                {key: "volcanic-eruption-09"},
                {key: "volcanic-eruption-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "smoke-cloud-anim",
            frames: [
                {key: "smoke-cloud-01"},
                {key: "smoke-cloud-02"},
                {key: "smoke-cloud-03"},
                {key: "smoke-cloud-04"},
                {key: "smoke-cloud-05"},
                {key: "smoke-cloud-06"},
                {key: "smoke-cloud-07"},
                {key: "smoke-cloud-08"},
                {key: "smoke-cloud-09"},
                {key: "smoke-cloud-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "shadow-smoke-anim",
            frames: [
                {key: "shadow-smoke-01"},
                {key: "shadow-smoke-02"},
                {key: "shadow-smoke-03"},
                {key: "shadow-smoke-04"},
                {key: "shadow-smoke-05"},
                {key: "shadow-smoke-06"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "poision-gas-anim",
            frames: [
                {key: "poision-gas-01"},
                {key: "poision-gas-02"},
                {key: "poision-gas-03"},
                {key: "poision-gas-04"},
                {key: "poision-gas-05"},
                {key: "poision-gas-06"},
                {key: "poision-gas-07"},
                {key: "poision-gas-08"},
                {key: "poision-gas-09"},
                {key: "poision-gas-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        this.anims.create({
            key: "nuclear-blast-anim",
            frames: [
                {key: "nuclear-blast-01"},
                {key: "nuclear-blast-02"},
                {key: "nuclear-blast-03"},
                {key: "nuclear-blast-04"},
                {key: "nuclear-blast-05"},
                {key: "nuclear-blast-06"},
                {key: "nuclear-blast-07"},
                {key: "nuclear-blast-08"},
                {key: "nuclear-blast-09"},
                {key: "nuclear-blast-10"},
            ],
            frameRate: 12,
            repeat: 2
        });

        


        //explosion-anim
        this.anims.create({
            key: "explode",
            frames: [
                {key:"explosion-01"},
                {key:"explosion-02"},
                {key:"explosion-03"},
                {key:"explosion-04"},
                {key:"explosion-05"},
                {key:"explosion-06"},
                {key:"explosion-07"},
                {key:"explosion-08"},
                {key:"explosion-09"},
                {key:"explosion-10"},
                {key:"explosion-11"},
                {key:"explosion-12"},
                {key:"explosion-13"},
                {key:"explosion-14"},
                {key:"explosion-15"},
                {key:"explosion-16"},
                {key:"explosion-17"},
                {key:"explosion-18"},
                {key:"explosion-19"},
                {key:"explosion-20"},
                {key:"explosion-21"},
                {key:"explosion-22"},
                {key:"explosion-23"},
                {key:"explosion-24"},
                {key:"explosion-25"},
                {key:"explosion-26"},
                {key:"explosion-27"},
                {key:"explosion-28"},
                {key:"explosion-29"},
                {key:"explosion-30"},
                // {key:"explosion-31"},
                // {key:"explosion-32"},
                // {key:"explosion-33"},
                // {key:"explosion-34"},
                // {key:"explosion-35"},
                // {key:"explosion-36"},
                // {key:"explosion-37"},
                // {key:"explosion-38"},
                // {key:"explosion-39"},
                // {key:"explosion-40"},
                // {key:"explosion-41"},
                // {key:"explosion-42"},
                // {key:"explosion-43"},
                // {key:"explosion-44"},
                // {key:"explosion-45"},
                // {key:"explosion-46"},
                // {key:"explosion-47"},
                // {key:"explosion-48"},
                // {key:"explosion-49"},
                // {key:"explosion-50"}
            ],
            frameRate: 12
        });

        //blue-flame
        this.anims.create({
            key: "blue-flame",
            frames: [
                {key: "blue-flame-01"},
                {key: "blue-flame-02"},
                {key: "blue-flame-03"},
                {key: "blue-flame-04"},
                {key: "blue-flame-05"},
                {key: "blue-flame-06"},
                {key: "blue-flame-07"},
                {key: "blue-flame-04"},
                {key: "blue-flame-05"},
                {key: "blue-flame-06"},
                {key: "blue-flame-07"},
                {key: "blue-flame-04"},
                {key: "blue-flame-05"},
                {key: "blue-flame-06"},
                {key: "blue-flame-07"}

            ],
            frameRate: 12,
            repeat:1
        });


        this.anims.create({
            key: "red-aura",
            frames: [
                {key: "red-aura-01"},
                {key: "red-aura-02"},
                {key: "red-aura-03"},
                {key: "red-aura-04"},
                {key: "red-aura-05"},
                {key: "red-aura-06"},
                {key: "red-aura-07"},
                {key: "red-aura-08"},
                {key: "red-aura-09"},
                {key: "red-aura-10"},
                {key: "red-aura-11"},
                {key: "red-aura-12"},
                {key: "red-aura-13"},
                {key: "red-aura-14"},
                {key: "red-aura-15"},
                {key: "red-aura-16"},
                {key: "red-aura-17"},
                {key: "red-aura-18"},
                {key: "red-aura-19"},
                {key: "red-aura-20"},
                {key: "red-aura-21"},
                {key: "red-aura-22"},
                {key: "red-aura-23"},
                {key: "red-aura-24"},
                {key: "red-aura-25"},
                {key: "red-aura-26"},
                {key: "red-aura-27"},
                {key: "red-aura-28"},
                {key: "red-aura-29"},
                {key: "red-aura-30"},
                {key: "red-aura-31"},
                {key: "red-aura-32"},
                {key: "red-aura-33"},
                {key: "red-aura-34"},
                {key: "red-aura-35"},
                {key: "red-aura-36"},
                {key: "red-aura-37"},
                {key: "red-aura-38"},
                {key: "red-aura-39"},
                {key: "red-aura-40"},
                {key: "red-aura-41"},
                {key: "red-aura-42"},
                {key: "red-aura-43"},
                {key: "red-aura-44"},
                {key: "red-aura-45"},
                {key: "red-aura-46"},
                {key: "red-aura-47"},
                {key: "red-aura-48"},
                {key: "red-aura-49"},
                {key: "red-aura-50"},
                {key: "red-aura-51"},
                {key: "red-aura-52"},
                {key: "red-aura-53"},
                {key: "red-aura-54"},
                {key: "red-aura-55"},
                {key: "red-aura-56"},
                {key: "red-aura-57"},
                {key: "red-aura-58"},
                {key: "red-aura-59"},
                {key: "red-aura-60"},

            ],
            frameRate: 12,
            repeat: -1
        });


        this.anims.create({
            key: "entry-aura",
            frames: [
                {key: "entry-aura-1"},
                {key: "entry-aura-2"},
                {key: "entry-aura-3"},
                {key: "entry-aura-4"},
                {key: "entry-aura-5"},
                {key: "entry-aura-6"},
                {key: "entry-aura-7"},
                {key: "entry-aura-8"},
                {key: "entry-aura-9"},
                {key: "entry-aura-10"},
                {key: "entry-aura-11"},
                {key: "entry-aura-12"},
                {key: "entry-aura-13"},
                {key: "entry-aura-14"},
                {key: "entry-aura-15"},
            ],
            frameRate: 12,
            repeat: 3
        });


        this.anims.create({
            key: "player-up-anim",
            frames: this.anims.generateFrameNumbers("player-up", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });


        this.anims.create({
            key: "player-down-anim",
            frames: this.anims.generateFrameNumbers("player-down", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "player-stand-anim",
            frames: this.anims.generateFrameNumbers("player-down", {start: 0, end: 0}),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "player-right-anim",
            frames: this.anims.generateFrameNumbers("player-right", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "player-left-anim",
            frames: this.anims.generateFrameNumbers("player-left", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "player-up-left-anim",
            frames: this.anims.generateFrameNumbers("player-up-left", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: "player-up-right-anim",
            frames: this.anims.generateFrameNumbers("player-up-right", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: "player-down-left-anim",
            frames: this.anims.generateFrameNumbers("player-down-left", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: "player-down-right-anim",
            frames: this.anims.generateFrameNumbers("player-down-right", {start: 0, end: 3}),
            frameRate: 12,
            repeat: -1
        });




        this.anims.create({
            key:"blue-light-aura",
            frames: this.anims.generateFrameNumbers("blue-light",{start:0 ,end:8}),
            frameRate: 12,
            repeat: 4
        });
    }

}