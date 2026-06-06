export class SettingScene extends Phaser.Scene{
    constructor(){
        super({key: "SettingScene"});
    }

    create(){
        const background = this.add.image(0, 0,"setting-background");
        background.setDisplaySize(300, 320).setDepth(1000);
        const settingsContainer = this.add.container(this.scale.width/2, this.scale.height/2);

        const settingTitle = this.add.image(10, 10, "settings-title");
        settingTitle.setDisplaySize(100,80);
        settingTitle.setPosition(0,-120);
        

        const closeButton = this.add.image(0, 0, "close-button");
        closeButton.setDisplaySize(32,32).setPosition(120,-130).setInteractive({useHandCursor:true});

        settingsContainer.add([background, settingTitle, closeButton]);
        
        closeButton.on("pointerdown", () => {
            this.tweens.add({
                targets: settingsContainer,
                y: -100,
                duration: 100,
                onComplete: () => {
                    this.scene.stop();   
                }
            });

        });
        
        
    }
}