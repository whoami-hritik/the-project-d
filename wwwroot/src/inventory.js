export class InventoryScene extends Phaser.Scene{
    constructor(){
        super({key: "InventoryScene"})
    };
     
    create(){
    this.USER = localStorage.getItem("USER");
    this.monters = this.cache.json.get("monsters");
    const mapBack = this.add.image(40, 20,"back");
    mapBack.setDisplaySize(80,32);
    mapBack.setDepth(100);
    mapBack.setInteractive({useHandCursor: true});
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    this.add.image(width/2, height/2, "inventory-bg").setDisplaySize(width, height);
        

    // TOP PANEL (Selected Monster Area)
    this.selectedContainer = this.add.container(width/2, 150);

    // BOTTOM GRID AREA
    this.gridContainer = this.add.container(0, 300);

    this.playerMonsters = [
    { id: "blaze-raptor", level: 5, type: "fire" },
    { id: "cinder-wolf", level: 4, type: "fire"},
    { id: "crystal-lynx", level: 6, type: "water"},
    { id: "dune-striker", level: 3, type: "electric" },
    { id: "frost-titan", level: 2, type: "water"},
    { id: "glacial-warden", level: 5, type: "water" }
];
    this.container = this.add.container(0, 0);
    // this.createGrid();
    this.createMonsterInventory();
    this.loadSlotMonster();

    //map back
    mapBack.on("pointerdown", () => {
        this.scene.resume("GameScene");
        this.scene.stop();
    });


    // this.zone1 = this.add.rectangle(60, height/2, 100, 100, 0x000000);
    // this.zone2 = this.add.rectangle(180, height/2, 100,100,0x000000);
    // this.zone3 = this.add.rectangle(300, height/2, 100,100, 0x0000000);

    // this.zone1.setInteractive();
    // this.zone1.number = 1;
    // this.zone2.setInteractive();
    // this.zone2.number = 2;
    // this.zone3.setInteractive();
    // this.zone3.number = 3;


    // this.input.on("dragstart", (pointer, gameObject) => {
    //     if (gameObject.number == 1){
    //         this.zone1.input.dropped = false;
    //     }
    //     if (gameObject.number == 2){
    //         this.zone2.input.dropped = false;
    //     }
    //     if (gameObject.number == 3){
    //         this.zone3.input.dropped = false;
    //     }

    // });

    // this.input.on("drag", (pointer, gameObject) => {
    //     gameObject.x = pointer.worldX;
    //     gameObject.y = pointer.worldY;
    // });
    
    // this.input.on("drop", (pointer, gameObject, dropZone) => {
   
    //      gameObject.x = dropZone.x;
    //      gameObject.y = dropZone.y;
         
    // });

    // this.input.on("dragend", (pointer, gameObject, dropZone) => {
    //     if (dropZone.number == 1 && gameObject.number == 3){
    //             gameObject.x = 60;
    //             gameObject.y = height/2;
    //             this.slot1.setPosition(300, height/2);
    //             this.zone3.input.dropped = true;
    //     }
    //     if (this.zone1.input.dropped == false){
    //             gameObject.x = 60;
    //             gameObject.y = height/2;
    //             this.zone1.input.dropped = true;
    //     }
    //     if (this.zone2.input.dropped == false){
    //             gameObject.x = 180;
    //             gameObject.y = height/2;
    //             this.zone2.input.dropped = true;
    //     }
    //     if (this.zone3.input.dropped == false){
    //             gameObject.x = 300;
    //             gameObject.y = height/2;
    //             this.zone3.input.dropped = true;
    //     }
        
            
    // });


}

colorType(type){
    const grass = "0x99b500";
    const water = "0x00a8cd";
    const fire = "0xe37b00";
    const electric = "0xfce605";

    if (type == "grass") return grass;
    else if (type == "water") return water;
    else if (type == "fire") return fire;
    else if (type == "electric") return electric;

}



loadSlotMonster(){
    const USER = JSON.parse(localStorage.getItem("USER"));
    const { width, height } = this.scale;
    if (USER.slot1 != null){
        this.slot1 = this.add.image(60, height/2, USER.slot1).setDisplaySize(160,160).setDepth(100).setInteractive({ draggable: true });
        this.slot1.number = 1;
        const slot1hp = this.add.graphics();
        const slothpwidth = width/3-30;
        const slothpheight = 40;

         slot1hp.fillStyle(this.colorType(this.monters[USER.slot1].type), 1)
            .fillRoundedRect(20, height/2-100, slothpwidth, slothpheight, 4)
            .lineStyle(1, 0x00000, 1)
            .strokeRoundedRect(20, height/2-100, slothpwidth, slothpheight, 4);
            
            this.add.text(25, height/2-100, USER.slot1.toUpperCase(), {
                                                            fontFamily: "Coiny",
                                                            fontSize: "14px",
                                                            color: "#ffffff",
                                                            stroke: "#000000",
                                                            strokeThickness: 2
                                                        });
    }
    if (USER.slot2 != null){
        this.slot2 = this.add.image(180, height/2, USER.slot2).setDisplaySize(160, 160).setDepth(100).setInteractive({draggable: true});
        this.slot2.number = 2;
        const slot2hp = this.add.graphics();
        const slothpwidth = width/3-30;
        const slothpheight = 40;

         slot2hp.fillStyle(this.colorType(this.monters[USER.slot2].type), 1)
            .fillRoundedRect(slothpwidth+45, height/2-100, slothpwidth, slothpheight, 4)
            .lineStyle(1, 0x00000, 1)
            .strokeRoundedRect(slothpwidth+45, height/2-100, slothpwidth, slothpheight, 4);


            
            this.add.text(slothpwidth+50, height/2-100, USER.slot2.toUpperCase(), {
                                                            fontFamily: "Coiny",
                                                            fontSize: "14px",
                                                            color: "#ffffff",
                                                            stroke: "#000000",
                                                            strokeThickness: 2
                                                        });
    }
    if (USER.slot3 != null){
        this.slot3 = this.add.image(300, height/2, USER.slot3).setDisplaySize(160, 160).setDepth(100).setInteractive({draggable: true});
        this.slot3.number = 3;


        const slot3hp = this.add.graphics();
        const slothpwidth = width/3-30;
        const slothpheight = 40;

         slot3hp.fillStyle(this.colorType(this.monters[USER.slot3].type), 1)
            .fillRoundedRect(2*slothpwidth+70, height/2-100, slothpwidth, slothpheight, 4)
            .lineStyle(1, 0x00000, 1)
            .strokeRoundedRect(2*slothpwidth+70, height/2-100, slothpwidth, slothpheight, 4);


            
            this.add.text(2*slothpwidth+70, height/2-100, USER.slot3.toUpperCase(), {
                                                            fontFamily: "Coiny",
                                                            fontSize: "14px",
                                                            color: "#ffffff",
                                                            stroke: "#000000",
                                                            strokeThickness: 2
                                                        });
    }

}

createMonsterInventory(){
    const spaceX = 20;
    const spaceY = 20;
    const {width , height} = this.scale;
    const slotWidth = (width/3);
    const slotHeight = ((height/2)/3 )- 2*spaceY ;
    
    const startingX = width/2-slotWidth-10;
    

    let y = height/2;
    
    const USER = JSON.parse(localStorage.getItem("USER"));
    const monsters = USER.monsters;
    console.log(USER);
    console.log(monsters);

    for (let i = 1; i <= 4 ; i++){

        let monsterName = "";
        if (i <= this.playerMonsters.length){
            monsterName = this.playerMonsters[i-1];
        }
         const SLOT = this.add.graphics();
         if (i % 2 == 0){
            SLOT.fillStyle(this.colorType(monsterName.type), 1)
            .fillRoundedRect(slotWidth+startingX+20, y+100, slotWidth, slotHeight, 4)
            .lineStyle(1, 0x00000, 1)
            .strokeRoundedRect(slotWidth+startingX+20, y+100, slotWidth, slotHeight, 4);

            this.add.image(slotWidth+startingX+60, y+140, monsterName.id+"-icon").setDisplaySize(64,64);

            
            this.add.text(slotWidth+startingX+25, y+90, monsterName.id.toUpperCase(), {
                                                            fontFamily: "Coiny",
                                                            fontSize: "14px",
                                                            color: "#ffffff",
                                                            stroke: "#000000",
                                                            strokeThickness: 2
                                                        });
                        
            
            y = y + slotHeight+spaceY;
                                                        
         }
         else{
            SLOT.fillStyle(this.colorType(monsterName.type), 1)
            .fillRoundedRect(startingX, y+100, slotWidth, slotHeight, 4)
            .lineStyle(1, 0x00000, 1)
            .strokeRoundedRect(startingX, y+100, slotWidth, slotHeight, 4);
            this.add.text(startingX+5, y+90, monsterName.id.toUpperCase(), {
                                                            fontFamily: "Coiny",
                                                            fontSize: "14px",
                                                            color: "#ffffff",
                                                            stroke: "#000000",
                                                            strokeThickness: 2
                                                        });

                                                    
            this.add.image(startingX+40, y+140, monsterName.id+"-icon").setDisplaySize(64,64);
                                                        
         }

         
         
    }
    
    
}

createGrid(){

    const startX = 80;
    const startY = 250;
    const spacingX = 100;
    const spacingY = 110;
    const columns = 3;

    this.playerMonsters.forEach((monster, index) => {

        const row = Math.floor(index / columns);
        const col = index % columns;

        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        const card = this.add.container(x, y);

        const bg = this.add.image(0, 0, "slots-background")
            .setDisplaySize(80, 90);

        const sprite = this.add.image(0, -10, monster.id + "-icon")
            .setDisplaySize(48, 48);

        const level = this.add.text(0, 30, "Lv " + monster.level, {
            fontFamily: "Coiny",
            fontSize: "14px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5);

        card.add([bg, sprite, level]);

        card.setSize(80, 90);
        card.setInteractive({useHandCursor: true});

        card.on("pointerdown", () => {
            this.selectMonster(monster);
        });

        const slot = this.gridContainer.add(card);
        this.container.add(slot);
    });
}

selectMonster(monster){

    this.selectedContainer.removeAll(true);

    const sprite = this.add.image(0, 240, monster.id )
        .setDisplaySize(250, 250);

    const name = this.add.text(0, 100, monster.id.toUpperCase(), {
        fontFamily: "Coiny",
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3
    }).setOrigin(0.5);

    const level = this.add.text(0, 115, "Level " + monster.level, {
        fontFamily: "Coiny",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2
    }).setOrigin(0.5);

    this.selectedContainer.add([sprite, name, level]);
}


}