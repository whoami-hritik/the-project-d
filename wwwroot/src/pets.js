export class PetScene extends Phaser.Scene{
    constructor(){
        super({key: "PetScene"})
    };
     
    create(){
    this.USER = localStorage.getItem("USER");
    this.monters = this.cache.json.get("monsters");
    
    const width = this.scale.width;
    const height = this.scale.height;

    this.slots = [];
    this.zones = [];

    // Background
    this.add.image(width/2, height/2, "inventory-bg").setDisplaySize(width, height);
        

    this.playerMonsters = [
    { id: "blaze-raptor-001", level: 5, type: "fire", name: "blaze-raptor" , currentSlot: null},
    { id: "cinder-wolf-002", level: 4, type: "fire", name: "cinder-wolf", currentSlot: null},
    { id: "crystal-lynx-003", level: 6, type: "water", name: "crystal-lynx", currentSlot: null},
    { id: "dune-striker-004", level: 3, type: "electric", name: "dune-striker", currentSlot: null},
    { id: "frost-titan-005", level: 2, type: "water", name: "frost-titan", currentSlot: null},
    { id: "glacial-warden-006", level: 5, type: "water", name: "glacial-warden", currentSlot: null}


   
    ];

     this.createSlot();
     this.InventorySlots();


    const mapBack = this.add.image(40, 20,"back");
    mapBack.setDisplaySize(80,32);
    mapBack.setDepth(100);
    mapBack.setInteractive({useHandCursor: true});
    //map back
    mapBack.on("pointerdown", () => {
        this.scene.resume("GameScene");
        this.scene.stop();
    });




















    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });


    this.input.on("drop", (pointer, gameObject, dropZone) => {

    const oldSlot = gameObject.currentSlot;
    const newSlot = dropZone;

    if (!newSlot) return;

    if (newSlot.currentMonster) {

        const otherMonster = newSlot.currentMonster;

        // Move other monster to old slot
        otherMonster.x = oldSlot.x;
        otherMonster.y = oldSlot.y;

        otherMonster.currentSlot = oldSlot;
        oldSlot.currentMonster = otherMonster;

    } else {
        if (oldSlot) oldSlot.currentMonster = null;
    }

    // Move dragged monster to new slot
    gameObject.x = newSlot.x;
    gameObject.y = newSlot.y;

    gameObject.currentSlot = newSlot;
    newSlot.currentMonster = gameObject;
});


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

    createDropZone(){
        for (let i = 0; i < 3; i++){
            const x = 60+i*120;
            const y = this.scale.height/2;
            const zone = this.add.rectangle(x, y, 100, 100, 0X000000, 0).setInteractive();
            zone.input.dropZone = true;
            zone.id = i+1;
            zone.currentMonster = null;
            this.zones.push(zone);
        }
    }

    createSlot(){

    this.createDropZone();

    this.zones.forEach(zone => {

        const monsterData = this.playerMonsters.find(m => m.currentSlot == null);

        if (monsterData){

            const monsterImage = this.add.image(
                zone.x,
                zone.y,
                monsterData.name
            )
            .setDisplaySize(120,120)
            .setDepth(100)
            .setInteractive({ draggable:true, useHandCursor:true });

           
            zone.currentMonster = monsterImage;
            monsterImage.currentSlot = zone;
            monsterImage.data = monsterData;
            monsterData.currentSlot = zone;
        }

    });

    
}

InventorySlots() {

    const cols = 2;
    const rows = 2;

    const slotWidth = 140;
    const slotHeight = 80;
    const radius = 12; // 🔥 corner roundness

    const spacingX = 20;
    const spacingY = 20;

    const totalWidth = cols * slotWidth + (cols - 1) * spacingX;
    const totalHeight = rows * slotHeight + (rows - 1) * spacingY;

    const startX = (this.scale.width - totalWidth) / 2;
    const startY = (this.scale.height - totalHeight) / 2 + 200;

    for (let i = 0; i < cols * rows; i++) {

        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = startX + col * (slotWidth + spacingX);
        const y = startY + row * (slotHeight + spacingY);

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.6);
        graphics.fillRoundedRect(x, y, slotWidth, slotHeight, radius);



        this.add.image(x+slotWidth/3, y+slotHeight/3+10, this.playerMonsters[i].name).setDisplaySize(60,60);
        this.add.text(x+20, y, this.playerMonsters[i].name.toUpperCase(), {
                fontFamily: "Coiny",
                fontSize: "10px",
                color: "#ffffff",
                stroke: "0x000000",
                strokeThickness: 4
            });

        this.add.text(x+slotWidth/2+10, y+slotHeight/3, "Lv "+this.playerMonsters[i].level, {
                fontFamily: "Coiny",
                fontSize: "16px",
                color: "#ffffff",
                stroke: "0x000000",
                strokeThickness: 4
            });
    }
}




}