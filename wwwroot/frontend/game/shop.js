import * as api from "../webapp/api.js";

const viewX = 20;
const viewY = 170;
const viewWidth = 380;
const viewHeight = 250;



export class ShopScene extends Phaser.Scene{
    constructor(){
        super({key: "ShopScene"});
    }

    init(){

    }


    create(){
        this.initializeBg();
        this.shopSlots();
        // this.exchangeSlots();
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

    createloadingOverlay(){
        this.loadOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5)
            .setOrigin(0)
            .setDepth(105)
            .setScrollFactor(0)
            .setInteractive();

        this.loadOverlay.on('pointerdown', () => {
           
        });

        this.buffer = this.add.image(this.scale.width/2, this.scale.height/2, "loading_buffer");
        this.buffer.setScale(0.05).setDepth(105);

    
        const buffering = this.tweens.add({
            targets: this.buffer,
            angle: 360,
            duration: 1000,
            repeat: -1
        });

        buffering.play();

    }

    destroyloadingOverlay(){
        this.loadOverlay.destroy();
        this.buffer.destroy();
        
    }


    initializeBg(){
        this.createOverlay();
        const bg = this.add.image(0, 0, "bg_shop").setOrigin(0);

        const itemSelect = this.add.rectangle(25, 75, 115, 80, 0x000000);
        itemSelect.setAlpha(0.4).setOrigin(0);
        itemSelect.setRounded(10).setInteractive({useHandCursor:true});

        const crystalSelect = this.add.rectangle(25+itemSelect.width, 75, 115, 80, 0x000000);
        crystalSelect.setAlpha(0.001).setOrigin(0);
        crystalSelect.setRounded(10).setInteractive({useHandCursor:true});

        const exchagneSelect = this.add.rectangle(27+itemSelect.width+crystalSelect.width, 75, 115, 80, 0x000000);
        exchagneSelect.setAlpha(0.001).setOrigin(0);
        exchagneSelect.setRounded(10).setInteractive({useHandCursor:true});

        const btn_back = this.add.image(this.scale.width-65, 25, "close-button");
        btn_back.setDisplaySize(btn_back.displayWidth/1.5, btn_back.displayHeight/1.5).setOrigin(0).setInteractive({ useHandCursor: true });

        this.container = this.add.container(0, 180).setDepth(101);
        this.container.add([bg, btn_back, itemSelect, crystalSelect, exchagneSelect]);

        this.slot_content = this.add.container(0, 0);

        // add content into main container
        this.container.add(this.slot_content);

        btn_back.on("pointerup", () => {
            this.destroyOverlay();
            this.scene.stop("ShopScene");
        });


        itemSelect.on("pointerup", () => {
            crystalSelect.setAlpha(0.001);
            exchagneSelect.setAlpha(0.001);
            itemSelect.setAlpha(0.4);
            this.slot_content.removeAll(true); 
            this.shopSlots();
        });

        crystalSelect.on("pointerup", () => {
            itemSelect.setAlpha(0.001);
            exchagneSelect.setAlpha(0.001);
            crystalSelect.setAlpha(0.4);
            this.slot_content.removeAll(true);

        });

        exchagneSelect.on("pointerup", () => {
            itemSelect.setAlpha(0.001);
            crystalSelect.setAlpha(0.001);
            exchagneSelect.setAlpha(0.4);

            this.slot_content.removeAll(true);
            this.exchangeSlots();
        });

    }

    shopSlots(){

        const total_items = 30;

        // viewport position/size
        const viewX = 20;
        const viewY = 170;
        const viewWidth = 380;
        const viewHeight = 250;

        const slotWidth = 120;
        const slotHeight = 120;

        for (let i = 0; i < total_items / 3; i++) {

            for (let j = 0; j < 3; j++) {

                const slot = this.add.image(
                    viewX + j * slotWidth,
                    viewY + i * slotHeight,
                    "bg_slot"
                );

                slot.setDisplaySize(
                    slot.displayWidth / 2,
                    slot.displayHeight / 2
                ).setOrigin(0);

                this.slot_content.add(slot);
            }
        }

     

        // create mask
        const maskGraphics = this.make.graphics({ add: false });

        maskGraphics.fillRect(
            viewX,
            this.container.y + viewY,
            viewWidth,
            viewHeight
        );

        const mask = maskGraphics.createGeometryMask();

        this.slot_content.setMask(mask);

        // save limits
        this.contentHeight = Math.ceil(total_items / 3) * slotHeight;

        this.viewHeight = viewHeight;

        // enable scroll
        this.enableScrolling();
    }
    enableScrolling(){

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {

            this.slot_content.y -= deltaY * 0.5;

            // clamp scrolling
            const minY = -(this.contentHeight - this.viewHeight);

            this.slot_content.y = Phaser.Math.Clamp(
                this.slot_content.y,
                minY,
                0
            );
        });
    }

    exchangeSlots(){
        this.createloadingOverlay();
        api.GetExchangeTerms().then(result => {
            if(result.success){
                const avaiablePairs = result.exchangePairs;

                avaiablePairs.forEach((pair, index) => {
                    

                    const slot_bg = this.add.image(viewX, 0, "exchange_slot").setOrigin(0);
                    slot_bg.setDisplaySize(slot_bg.displayWidth/1.1, slot_bg.displayHeight/1.1);
                    slot_bg.setPosition(viewX+7.5, 165 + index*slot_bg.displayHeight );

                    const itemFrom = this.add.image(46, slot_bg.y+18, `item_can_water_blast`)
                    itemFrom.setDisplaySize(itemFrom.displayWidth/1.7, itemFrom.displayHeight/1.7).setOrigin(0);

                    const itemTo = this.add.image(162, slot_bg.y+18, `item_dust`).setOrigin(0); 
                    itemTo.setDisplaySize(itemTo.displayWidth/1.7, itemTo.displayHeight/1.7).setOrigin(0);

                    const btn_exe = this.add.image(280, slot_bg.y+30, "btn_sell");
                    btn_exe.setDisplaySize(btn_exe.displayWidth/2, btn_exe.displayHeight/2).setOrigin(0);

                    this.slot_content.add([slot_bg, itemFrom,itemTo, btn_exe]);
                });

                
            }

            this.destroyloadingOverlay();
        });
    }





}

