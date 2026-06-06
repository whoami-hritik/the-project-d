export class MissionScene extends Phaser.Scene{
    constructor(){
        super({key: "MissionScene"});
    }

    create(){

        const container = this.add.container(0, 0);
        const { width, height } = this.scale;

        const backOption = this.add.image(20,20, "back-icon");
        backOption.setDisplaySize(48,48).setInteractive({useHandCursor: true});

        backOption.on("pointerdown", () => {
            this.game.clickSFX.play();
            this.scene.stop();
        });

        const screen = this.add.graphics();
        screen.fillStyle(0x1e2238, 0.95);
        screen.fillRoundedRect(0, 0, width, height, 10);
        screen.lineStyle(3, 0x000000, 0.95)
        screen.strokeRect(0, 0 , width, height);

       

        const titleBG = this.add.graphics();
        titleBG.fillStyle(0x4CAF50);
        titleBG.fillRoundedRect(width/2-100, 30, 200, 40, 5);

        const title = this.add.text(width/2-55, 35, "MISSIONS", {fontFamily: "Coiny", fontStyle: "bold", fontSize: "20px", color: "#ffffff", stroke: "#000000", strokeThickness: 2});
        
        let missions = [
            {id: 1, name: "First Battle", reward: {gold: 10}, target: 1, done: 0, completed: false},
            {id: 2, name: "Collect 5 Monsters", reward: { gold: 10}, target: 5, done: 0, completed: false},
            {id: 3, name: "Complele a online battle", reward: {gold: 20}, target: 1, done: 0, completed: false}
        ];

         container.add([screen, titleBG, titleBG, title, backOption]);

        const spacingY = 50;
        let nextTask = 40;
     
        missions.forEach( mission => {
            const taskWidthX = width/2-170;
            

            
            const task = this.add.graphics();
            task.fillStyle(0x2A2F4F);
            nextTask = nextTask+spacingY;
            task.fillRoundedRect(taskWidthX,nextTask, width-20, 30, 4);
            task.strokeRect(taskWidthX, nextTask, width-20, 30);
            
            const taskText = this.add.text(taskWidthX, nextTask+5, ` ${mission.id}. ${mission.name} `, {fontSize: "15px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 2});
            
            if(mission.completed){
                // const claimBtn = this.add.image(250, yPosition, "claim-btn")
                // .setInteractive({useHandCursor: true});

                // claimBtn.on("pointerdown", () => {
                //     //this.claimMission(mission);
                //     console.log(mission);
                // });
            }else{
                this.add.text(width-60, nextTask+2, ` ${mission.done}/${mission.target}`, {fontFamily: "Poppins", fontSize: "20px", fontStyle: "bold", color: "#def887", stroke: "#000000", strokeThickness: 2} )
            }
            
            container.add(task);
            container.add(taskText);


        });
        
    }
}