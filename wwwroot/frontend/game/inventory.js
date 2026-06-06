import { checkClick } from "./game.js";
import * as api from "../webapp/api.js";
import { state } from "../state.js";
import * as utility from "../utility.js";

const rows = 3;
const column = 2;
const slotWidth = 160;
const slotHeight = 85;
export class InventoryScene extends Phaser.Scene{
    constructor(){
        super({ key: "InventoryScene" });
    }

    create(){
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.initializeBG();
        this.pageIndex = 0;
        this.maxIndex = -1;
        this.inventoryContainer = this.add.container();
        this.updateInventory();
        this.displayMonsters();
        
    }

    initializeBG(){
        const bg = this.add.image(0, 0, "inventory-bg").setOrigin(0);
        bg.setDisplaySize(this.width, this.height);
        
        

        const btnBack = this.add.image(20, 35, "btn-back-map").setDisplaySize(80, 35).setOrigin(0).setInteractive({useHandCursor:true});

        
        for (let i = 0; i < rows; i++){
            for( let j = 0; j < column; j++){
                let x = 45 + (j*slotWidth);
                let y = 500 + (i*slotHeight)+(i*10);
                this.add.image(x,y,"team-slot").setDisplaySize(slotWidth, slotHeight).setOrigin(0);
            }
        }

        const nextSlots = this.add.image(0,0, "btn_arrow_right");
        nextSlots.setDisplaySize(nextSlots.displayWidth/2, nextSlots.displayHeight/2).setOrigin(0).setInteractive({useHandCursor: true});
        nextSlots.setPosition(this.scale.width - nextSlots.displayWidth - 5, this.scale.height/2 + 200,);


        const prevSlots = this.add.image(5, this.scale.height/2+200, "btn_arrow_right");
        prevSlots.setDisplaySize(prevSlots.displayWidth/2, prevSlots.displayHeight/2).setOrigin(0).setInteractive({useHandCursor: true});
        prevSlots.setFlipX(true);
        

        nextSlots.on("pointerup", () => {
            this.nextIndex();
        })

        prevSlots.on("pointerup", () => {
            this.previousIndex();
        })

        
        btnBack.on("pointerup", (pointer) => {
            if(!checkClick(pointer)) return;
            this.scene.stop("InventoryScene");
        })

    }

    nextIndex(){
        if (this.pageIndex >= this.maxIndex){
            return;
        }
        this.pageIndex ++;
        this.updateInventory();
    }

    previousIndex(){
        this.pageIndex --;
        if (this.pageIndex < 0){
            this.pageIndex = 0
            return;
        }
        this.updateInventory();
    }
    async updateInventory(){
        utility.createloadingOverlay(this);
        try {
            
            // Clear previous page monsters
            this.inventoryContainer.removeAll(true);

            const result = await api.loadInventory(this.pageIndex);
            this.maxIndex = Math.ceil(result.totalMonsters/6);
            this.inventory = result.monsters || [];
            
            if (state.selectedMonster == null){

                state.selectedMonster = this.inventory[0];

                localStorage.setItem(
                    "selectedMonster",
                    JSON.stringify(this.inventory[0])
                );
            }

            console.log("selected monster ", state.selectedMonster);

            this.inventory.forEach((monster, index) => {

                const row = Math.floor(index / column);
                const col = index % column;

                const x = 45 + col * slotWidth;
                const y = 500 + row * (slotHeight + 10);

                const paneThumb = this.add.image(
                    x,
                    y,
                    `pane_thumb_${monster.kind}`
                )
                .setOrigin(0)
                .setDisplaySize(160, 85)
                .setInteractive({ useHandCursor: true });

                const icon = this.add.image(
                    10 + x,
                    8 + y,
                    "icon_" + monster.id
                )
                .setDisplaySize(70, 70)
                .setOrigin(0);

                const nameTokens = Array.from(
                    monster.title,
                    chr => chr.charCodeAt(0)
                );

                let lastTokenWidth = 0;

                const letters = [];

                nameTokens.forEach((token) => {

                    const letter = this.add.image(
                        x + 45 + lastTokenWidth,
                        y - 10,
                        `c${token}`
                    ).setOrigin(0);

                    letter.setDisplaySize(
                        letter.displayWidth / 2,
                        letter.displayHeight / 2
                    );

                    lastTokenWidth += letter.displayWidth;

                    letters.push(letter);
                });

                const lv = this.add.image(
                    x + 90,
                    y + 30,
                    "ch35"
                ).setOrigin(0);

                paneThumb.on("pointerup", (pointer) => {

                    if (!checkClick(pointer)) return;

                    this.updateSelectedMonster(monster);

                    console.log("selected monster ", monster.id);
                });

                // Add EVERYTHING to container
                this.inventoryContainer.add(paneThumb);
                this.inventoryContainer.add(icon);
                this.inventoryContainer.add(lv);

                letters.forEach(letter => {
                    this.inventoryContainer.add(letter);
                });

            });

        } catch (error) {

            console.error("Failed to load inventory:", error);
        } finally {
            utility.destroyloadingOverlay(this);
        }
    }    

    updateSelectedMonster(monster){
        localStorage.setItem("selectedMonster",  JSON.stringify(monster));
        state.selectedMonster = monster;
        this.monsterTexture.setTexture("front_"+monster.id);
        this.monsterPane.setTexture(`pane_tooltip_${monster.kind}`);
        this.paneTooltip.setPosition(140, 500 - this.monsterTexture.displayHeight);
        this.updateMonsterPane(monster);
        console.log("new selected monster ", state.selectedMonster);
    }

    displayMonsters(){
        state.selectedMonster = JSON.parse(localStorage.getItem("selectedMonster"));
        const monsterShadow = this.add.image(80, 425, "mons_shadow").setOrigin(0);
        this.monsterTexture = this.add.image(200, 470, "front_"+state.selectedMonster.id).setInteractive({useHandCursor: true});
        this.monsterTexture.setDisplaySize(this.monsterTexture.displayWidth/1.5, this.monsterTexture.displayHeight/1.5).setOrigin(0.5,1);
        
        
        this.monsterPane = this.add.image(0, 0, `pane_tooltip_${state.selectedMonster.kind}`);
        this.monsterPane.setDisplaySize(this.monsterPane.displayWidth/1.5, this.monsterPane.displayHeight/1.5)
                   .setInteractive({useHandCursor:true})
                   .setOrigin(0, 1.5);
        this.paneTooltip = this.add.container(140, 500 - this.monsterTexture.displayHeight );
        
        const hpBarBG = this.add.image(3, -80, `hpbar_med_bg`);
        hpBarBG.setDisplaySize(hpBarBG.displayWidth/1.5, hpBarBG.displayHeight/1.5).setOrigin(0);

        this.hpBar = this.add.image(3, -80, "hpbar_med_fill");
        this.hpBar.setDisplaySize(this.hpBar.displayWidth/1.5, this.hpBar.displayHeight/1.5).setOrigin(0);

        this.titleContainer = this.add.container(0, 0);
        this.updateMonsterPane(state.selectedMonster);

        this.paneTooltip.add([this.monsterPane, this.titleContainer, hpBarBG, this.hpBar]);




        this.monsterTexture.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;

            this.scene.launch("LabScene", { monster: state.selectedMonster})
        })

    }

    updateMonsterPane(monster){
        this.titleContainer.removeAll(true);
        this.titleContainer.setPosition(10, -100);

        this.updateMonsterHp(this.hpBar, monster);
        
        const nameTokens = Array.from(monster.title, chr => chr.charCodeAt(0));
        let lastTokenWidth = 0;
        nameTokens.forEach((token, i) => {
            const letter = this.add.image(lastTokenWidth, 0, `c${token}`).setOrigin(0);
            letter.setDisplaySize(letter.displayWidth/2,letter.displayHeight/2);
            lastTokenWidth +=letter.displayWidth;
            this.titleContainer.add(letter);
        });


        

    }

    updateMonsterHp(hpBar, monster){
        const fullWidth = hpBar.width; 
        const cropWidth = (monster.currentHP / 100) * fullWidth;
        hpBar.setCrop(0, 0, cropWidth, hpBar.height);
    }
}