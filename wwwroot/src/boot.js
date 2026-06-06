export class BootScene extends Phaser.Scene{
    constructor(){
        super({key: "BootScene"})
    }

    preload(){
        this.load.image("loading-bg", "assets/world/landing.png");
        this.load.image("play-button", "assets/world/play.png");
        this.load.audio("bg-music","assets/audio/background-music.mp3");
        this.load.audio("click-sfx", "assets/audio/click.mp3");
        this.load.audio("battleground-music", "assets/audio/battleground.mp3");
        this.load.audio("pop-up", "assets/audio/pop_1.wav");


    }

    create(){
        this.game.bgMusic = this.sound.add("bg-music", {
            loop: true,
            volume: 0.5
        });
        this.game.battleMusic = this.sound.add("battleground-music", {
            loop: true,
            volume: 0.5
        });
 
        this.game.clickSFX = this.sound.add("click-sfx", {
            volume: 1
        });

        this.game.popupSFX = this.sound.add("pop-up", {
            volume: 1
        });

        
        this.scene.start("PreloadScene");
    }
}