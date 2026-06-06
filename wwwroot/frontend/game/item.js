import * as api from "../webapp/api.js";

export class ItemScene extends Phaser.Scene{
    constructor(){
        super({key: "ItemScene"});
    }

    init(data){
        this.inBattle = data.inBattle;
        this.battle = data.battle;
    }
    create(){
        this.initializeBg();
        api.GetItems().then(result => {
            if (result.success){
                console.log(result);
                this.items = result.items;
                this.updateItems();
            }
        });

        this.battleScene = this.scene.get("BattleScene");

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

    updateItems(){
        const TOTAL_ITEMS = Object.keys(this.items).length;
        const COLUMN = 5;
        const SLOT_WIDTH = 73.33;
        const SLOT_HEIGHT = 73.33;

        const item_selected_bg = this.add.image(10, 60, "item_selected");
        item_selected_bg.setDisplaySize(item_selected_bg.displayWidth/1.5, item_selected_bg.displayHeight/1.5)
                        .setOrigin(0)
                        .setAlpha(0);

        this.container.add(item_selected_bg);
        const ROW = Math.ceil(TOTAL_ITEMS/COLUMN);
        let count = 0;
        for (let i = 0; i < ROW; i++){
            for(let j = 0; j < COLUMN; j++){
                if (count === TOTAL_ITEMS) {
                    console.log("all items added ", this.items);
                    break;
                }
                const key = Object.keys(this.items)[count];
                if (this.items[key] > 0){
                    console.log(`item_${key}`);
                    const item_img = this.add.image(18+ j*SLOT_WIDTH, 65 + i*SLOT_HEIGHT, `item_${key}`);
                    item_img.setDisplaySize(item_img.displayWidth/1.5, item_img.displayHeight/1.5).setOrigin(0).setInteractive({useHandCursor: true});
                    this.container.add(item_img);
                    

                    item_img.on("pointerup", () => {
                        item_selected_bg.setAlpha(1);
                        item_selected_bg.setPosition(10+j*SLOT_WIDTH, 60 + i*SLOT_HEIGHT);

                        if (this.inBattle){
                            
                            const use_btn = this.add.image(0, 0, "btn_use");
                            use_btn.setDisplaySize(use_btn.displayWidth/2, use_btn.displayHeight/2)
                                   .setOrigin(0).setInteractive({useHandCursor: true});
                            use_btn.setPosition(this.container.width/2 - use_btn.displayWidth/2, this.container.height);
                            this.container.add(use_btn);


                            use_btn.on("pointerdown", () => {
                                this.destroyOverlay();
                                this.battleScene.events.emit("useItem", key);
                                this.scene.stop("ItemScene");
                            });

                        }
                    });
                }
                

                

                count++;


                
            }
        }
    }

    initializeBg(){
        this.createOverlay();
        const bg = this.add.image(0, 0, "bg_item");
        bg.setDisplaySize(bg.displayWidth/1.5, bg.displayHeight/2).setOrigin(0);

        this.container = this.add.container(this.scale.width/2 - bg.displayWidth/2, this.scale.height/2 - bg.displayHeight/2).setDepth(101);

        const btn_close = this.add.image(bg.displayWidth- 20, 0, "close-button");
        btn_close.setDisplaySize(btn_close.displayWidth/1.5, btn_close.displayHeight/1.5).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.container.add([bg, btn_close]);

        const TOTAL_ITEMS = 10;
        const COLUMN = 5;
        const SLOT_WIDTH = 73.33;
        const SLOT_HEIGHT = 73.33;

        const ROW = Math.ceil(TOTAL_ITEMS/COLUMN);

        for (let i = 0; i < ROW; i++){
            for (let j = 0; j < COLUMN; j++){
                const item_slot = this.add.image(10+ j*SLOT_WIDTH, 60 + i*SLOT_HEIGHT, "item_slot");
                item_slot.setDisplaySize(item_slot.displayWidth/1.5, item_slot.displayHeight/1.5).setOrigin(0);
                
                this.container.add(item_slot);

            }
        }


        btn_close.on("pointerup", () => {
            this.destroyOverlay();
            this.scene.stop("ItemScene");
        });
    }


}