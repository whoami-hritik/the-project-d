import * as utility from "../utility.js";
import * as api from "../webapp/api.js";

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: "LeaderboardScene" });
    }
    create() {
        utility.createOverlay(this);
        this.initialzieBg();
        utility.createloadingOverlay(this);
        api.Leaderboard().then((result) => {

            if (result.success) {
                const leaderboard = result.leaderboard;
                const container = this.add.container(10, 185).setDepth(101);
                leaderboard.forEach((player, i) => {

                    const blockContainer = this.add.container(0, 0);

                    if (i == 0) {
                        const rank1 = this.add.image(0, i * 43, "rank_1").setOrigin(0);
                        blockContainer.add(rank1);
                    }
                    else if (i == 1) {
                        const rank2 = this.add.image(0, i * 43, "rank_2").setOrigin(0);
                        blockContainer.add(rank2);
                    }
                    else if (i == 2) {
                        const rank3 = this.add.image(0, i * 43, "rank_3").setOrigin(0);
                        blockContainer.add(rank3);
                    }
                    if (i > 2){
                        this.DisplayText(5, i * 47, utility.WordToTokens(player.rank), blockContainer);
                    }
                    

                
                    this.DisplayText(5 + 75, i * 48, utility.WordToTokens(player.username), blockContainer);

                    this.DisplayText(5 + 230, i * 48, utility.WordToTokens(player.totalReferral), blockContainer);

                    this.DisplayText(5 + 310 , i * 48, utility.WordToTokens(player.prize), blockContainer);

                    container.add(blockContainer);

                });
            }

            utility.destroyloadingOverlay(this);
        });


    }

    initialzieBg() {

        const bg = this.add.image(5, 100, "leaderboard_bg");
        bg.setDisplaySize(bg.displayWidth / 2.3, bg.displayHeight / 2.3).setOrigin(0).setDepth(101);


        const closeBtn = this.add.image(bg.displayWidth - 20, bg.y, "close-button").setOrigin(0).setInteractive().setDepth(101);
        closeBtn.setDisplaySize(closeBtn.displayWidth / 2, closeBtn.displayHeight / 2);
        closeBtn.on("pointerup", () => {
            utility.destroyOverlay(this);
            this.scene.stop();
        });


    }


    DisplayText(posX, posY, tokens, container) {
        let lastCharWidth = 0;
        tokens.forEach((t) => {
            const chara = this.add.image(posX + lastCharWidth, posY, "c" + t);
            chara.setDisplaySize(chara.displayWidth / 2.3, chara.displayHeight / 2.3).setScrollFactor(0).setOrigin(0);
            lastCharWidth += chara.displayWidth;
            container.add(chara);
        });
    }




}