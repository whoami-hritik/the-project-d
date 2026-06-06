import { state } from "../state.js";
import { checkClick } from "./game.js";
import { InventoryScene } from "./inventory.js";
import * as api from "../webapp/api.js";
import * as utility from "../utility.js";


const BOTTOM = 740;
const ICONWIDTH = 80;

const locations = {
    "bootcamp": [
    { name: "A", x: 320, y: 500, active: false, bgs: "bgs_camp" },
    { name: "B", x: 241, y: 526, active: false, bgs: "bgs_camp" },
    { name: "C", x: 154, y: 502, active: false, bgs: "bgs_camp" },
    { name: "D", x: 118, y: 435, active: false, bgs: "bgs_camp" },
    { name: "E", x: 208, y: 402, active: false, bgs: "bgs_camp" },
    { name: "F", x: 300, y: 420, active: false, bgs: "bgs_camp" },
    { name: "G", x: 159, y: 352, active: false, bgs: "bgs_camp" },
    { name: "H", x: 240, y: 315, active: false, bgs: "bgs_camp" },
    { name: "I", x: 173, y: 275, active: false, bgs: "bgs_camp" },
    { name: "J", x: 310, y: 283, active: false, bgs: "bgs_camp" },
    { name: "K", x: 385, y: 275, active: false, bgs: "bgs_camp" },

    { name: "L", x: 474, y: 256, active: false, bgs: "bgs_camp" },
    { name: "M", x: 561, y: 279, active: false, bgs: "bgs_camp" },
    { name: "N", x: 608, y: 228, active: false, bgs: "bgs_camp" },
    { name: "O", x: 706, y: 236, active: false, bgs: "bgs_camp" },
    { name: "P", x: 759, y: 346, active: false, bgs: "bgs_camp" },
    { name: "Q", x: 643, y: 383, active: false, bgs: "bgs_camp" },
    { name: "R", x: 729, y: 425, active: false, bgs: "bgs_camp" },
    { name: "S", x: 621, y: 482, active: false, bgs: "bgs_camp" },
    { name: "T", x: 699, y: 515, active: false, bgs: "bgs_camp" }
    ],
    "riverfall": [],
    "costa": []
            
}

const graphs = {
    "bootcamp": {
    'A': ['B'],
    'B': ['A', 'C'],
    'C': ['B', 'D'],
    'D': ['C', 'E'],
    'E': ['D', 'F', 'G'],
    'F': ['E'],
    'G': ['E', 'H'],
    'H': ['G', 'I', 'J'],
    'I': ['H', 'J'],
    'J': ['H', 'K'],
    'K': ['J', 'L'],

    'L': ['K','M'],
    'M': ['L', 'N'],
    'N': ['M', 'O'],
    'O': ['N', 'P'],
    'P': ['O', 'Q'],
    'Q': ['P', 'R'],
    'R': ['Q', 'S'],
    'S': ['R', 'T'],
    'T': ['S']
    },
    "riverfall": {},
    "costa": {}
}


const MAPS = [
    { name: "bootcamp", backgrounds: ["bootcamp-bg-1", "bootcamp-bg-2"]},
    { name: "riverfall", backgrounds: ["riverfall-bg-1", "riverfall-bg-2", "cave-bg-1", "cave-bg-2"]},
]

const icons = ["btn_shop", "btn_world", "btn_missions", "btn_items", "btn_team"]
const scenes = ["ShopScene", "WorldScene", "MissionScene", "ItemScene", "InventoryScene"]

export class MapScene extends Phaser.Scene{
    constructor(){
        super({key:"MapScene"});
    }

    init(data){
        this.world = data.map;
        this.USER = state.user;

    }
    create(){
        this.width = this.scale.width;
        this.height = this.scale.height;
        this.initializeBg();
        this.createMenu();
        utility.createloadingOverlay(this);
        api.spawnLocations(this.world).then(result => {
            console.log(locations);
            const nodes = result.spawns.nodes;     
            nodes.forEach(node => {
                const loc = locations[this.world].find(x => x.name === node);
                if (loc) {
                    loc.active = true;
                }
            });
            console.log(locations);
            this.locations();
            utility.destroyloadingOverlay(this);
        })
        
    }

    createMenu(){
        this.menu = this.add.container(20, BOTTOM);
        

        icons.forEach((e, i) => {
         
            const icon = this.add.image(20 + (i*ICONWIDTH), 0, e);
            icon.setDisplaySize(80,80);
            icon.setInteractive({useHandCursor: true}).setScrollFactor(0);
            this.menu.add(icon);

            icon.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;

                if (scenes[i] === "WorldScene") {
                    this.scene.start(scenes[i]);
                } else {
                    this.scene.launch(scenes[i]);
                }
                console.log(scenes[i] + " started");
            });
        });

    }

    locations(){

        const player = this.add.image(locations[this.world][0].x, locations[this.world][0].y - 20, "player").setDepth(10);
        player.position = locations[this.world][0].name;

        
        locations[this.world].forEach((l, i) => {
            const node = this.add.image(l.x, l.y, "node").setDisplaySize(50, 40).setOrigin().setInteractive({useHandCursor: true});
            console.log("placed "+i )
            if (l.active){
                this.add.image(l.x, l.y - 20, "marker_battle").setDisplaySize(35,40).setDepth(9);
                console.log(l.name+" active");
            }

            node.on("pointerup", (pointer) => {
                if (!checkClick(pointer)) return;
                console.log("clicked-"+l.name,)
                const path = pathCalculator(player.position, l.name, graphs[this.world]);
                if (path == null){
                    console.log("invalid path");
                    return;
                }

                // Stop any current movement before starting a new one
                this.tweens.killTweensOf(player);
                
                
                if (path.length > 0 && path[0] === player.position) {
                    path.shift();
                }

                const moveNext = (index) => {
                    if (index >= path.length) return;
                    
                    const node = path[index];
                    const g = locations[this.world].find(x => x.name == node);
                    
                    this.tweens.add({
                        targets: player,
                        x: g.x,
                        y: g.y - 20,
                        duration: 400,
                        ease: 'Linear',
                        onComplete: () => { 
                            player.position = g.name;
                            moveNext(index + 1); // Trigger the next segment
                            //start battle if active
                            if(player.position == l.name && l.active){
                                api.StartBattle(this.world, l.name, state.selectedMonster.instanceId).then(result => {
                                    if (result.success){
                                        l.active = false;
                                        this.scene.start("BattleScene", { map: this.world, node: l, battleState: result.battleState })
                                    }
                                    else{
                                        console.log(result);
                                    }
                    
                                });
                                
                            }

                        }
                    });
                };
                
                moveNext(0);                
            });
        });

    }

    initializeBg() {
    const mapConfig = MAPS.find(m => m.name === this.world) ?? MAPS[0];
    const bgKeys = mapConfig.backgrounds;

    // HUD (stays fixed)
    const currencies = this.add.image(0, 0, "hud-currency")
        .setOrigin(0)
        .setScrollFactor(0);

    this.edgePadding = 40;

    // ---- CREATE PANELS ----
    this.panels = bgKeys.map((key, i) => {
        const img = this.add.image(0, 0, key).setOrigin(0);

        const scale = this.scale.height / img.height;
        img.setScale(scale);

        img.displayWidth = Math.round(img.displayWidth);
        return img;
    });

    this.bgWidth = this.panels[0].displayWidth;

    // Position panels side-by-side (ONLY ONCE)
    this.panels.forEach((img, i) => {
        img.x = i * this.bgWidth;
    });

    // ---- CAMERA SETUP ----
    const totalWidth = bgKeys.length * this.bgWidth;

    this.maxScroll = (bgKeys.length - 1) * this.bgWidth;
    this.minScroll = 0;

    this.cameras.main.setBounds(0, 0, totalWidth, this.scale.height);

    // ---- STATE ----
    this.dragStartX = 0;
    this.startScrollX = 0;

    // ---- INPUT ----
    this.input.on('pointerdown', (pointer) => {
        this.dragStartX = pointer.x;
        this.startScrollX = this.cameras.main.scrollX;
    });

    this.input.on('pointermove', (pointer) => {
        if (!pointer.isDown) return;

        let dx = pointer.x - this.dragStartX;

        let newScroll = this.startScrollX - dx;

        // Clamp (prevents empty space)
        newScroll = Phaser.Math.Clamp(
            newScroll,
            this.minScroll,
            this.maxScroll
        );

        this.cameras.main.scrollX = Math.round(newScroll);
    });

    this.input.on('pointerup', (pointer) => {
        let dx = pointer.x - this.dragStartX;
        let finalScroll = this.startScrollX - dx;

        finalScroll = Phaser.Math.Clamp(
            finalScroll,
            this.minScroll,
            this.maxScroll
        );

        // Snap to nearest panel
        const snapIndex = Math.round(finalScroll / this.bgWidth);
        const snappedScroll = Phaser.Math.Clamp(
            snapIndex * this.bgWidth,
            this.minScroll,
            this.maxScroll
        );

        // Animate camera instead of panels
        this.tweens.add({
            targets: this.cameras.main,
            scrollX: snappedScroll,
            duration: 300,
            ease: 'Power2'
        });
    });
}
    update(){

    }
}




function pathCalculator(starting, target, graph){
    let queue = [[starting]]
    let visited = new Set();

    while(queue.length > 0){
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === target) {
            console.log("path: "+ path)
            return path
        };

        if (!visited.has(node)){
            visited.add(node);

            let neighbour = graph[node];

            for( let i = 0; i < neighbour.length; i++){
                queue.push([...path, neighbour[i]]);
            }
        }
    }
    return null;
}