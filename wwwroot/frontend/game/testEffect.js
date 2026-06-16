export class TestScene extends Phaser.Scene {
    constructor(){
        super({key: "TestScene"});
    }
    
    create() {

        // Dark background
        this.cameras.main.setBackgroundColor('#111111');



        const ATTACKRT_POS = {
            x : 100,
            y: 630
        }

        const DEFFENDER_POS = {
            x: 290,
            y: 430
        }
        // Enemy
        this.attacker = this.add.sprite(ATTACKRT_POS.x, ATTACKRT_POS.y, `back_grunko`);
        this.attacker.setDisplaySize(this.attacker.displayWidth/1.5, this.attacker.displayHeight/1.5).setOrigin(0.5,1);

        this.defender = this.add.sprite(DEFFENDER_POS.x, DEFFENDER_POS.y, `front_cobrix`);
        this.defender.setDisplaySize(this.defender.displayWidth/1.5, this.defender.displayHeight/1.5).setOrigin(0.5, 1);

        // Button
        const btn1 = this.add.text(
            50,
            50,
            'STRIKE',
            {
                fontSize: '24px',
                backgroundColor: '#228822',
                padding: { x: 10, y: 5 }
            }
        );

        const btn2 = this.add.text(
            100,
            50,
            'SHOCKWAVE',
            {
                fontSize: '24px',
                backgroundColor: '#885222',
                padding: { x: 10, y: 5 }
            }
        );

        btn1.setInteractive();

        btn1.on('pointerdown', () => {
            // this.strikeAnim(
            //     this.defender.x,
            //     this.defender.y
            // );

            // this.cloudEffectAnim(this.defender.x, (this.defender.y - this.defender.displayHeight), "spores");

            this.flashAnim(this.defender);
        });

        btn2.setInteractive();

        btn2.on('pointerdown', () => {
            // this.shockWaveAnim(
            //     this.attacker.x,
            //     this.attacker.y,
            //     this.defender.x,
            //     this.defender.y
            // );


            // this.tentaclesAnim(this.defender.x, this.defender.y - 30, "vine", this.defender);

            this.bubbleAnim(this.defender);
        });
    }



bubbleAnim(target){
    for( let i = 0; i < 4; i ++){
        this.time.delayedCall(i*50, () => {
            const bubble = this.add.sprite((target.x-40)+ i*15, target.y, "anim_bubbles");
            // bubble.anims.play("anim_bubbles");



            this.tweens.add({
                targets: bubble,
                y: target.y+10,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => bubble.destroy()
            });

            // bubble.on("animationcomplete", () => {
            //     bubble.destroy()
            // });
        });
    }
}
flashAnim(target){
    this.cameras.main.flash(1000, 255, 255, 255);

    target.setTint(0xffffff);

    this.tweens.add({
        targets: target,
        scaleX: 0.9,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        onComplete: () => {
            this.tweens.add({
                targets: target,
                alpha: 0.3,
                duration: 250,
                yoyo: true,
                repeat: 3,
                onComplete: () => target.clearTint()
            });
            
        }
    });
}

shockWaveAnim(playerX, playerY, enemyX, enemyY){
    const fx = this.add.sprite(playerX, playerY, "anim_shockwave");
    fx.setDisplaySize(fx.displayWidth/1.5, fx.displayHeight/1.5);

    fx.anims.play("anim_shockwave", 1);

    this.tweens.add({
        targets: fx,
        x: enemyX,
        y: enemyY,
        duration: 1000,
        onComplete: ()=> {
            fx.destroy();
        }
    })
}

cloudEffectAnim(targetX, targetY, animKey){
    const cloud1 = this.add.image(targetX-100, targetY, animKey);
    const cloud2 = this.add.image(targetX+100, targetY, animKey);

    cloud1.setDisplaySize(cloud1.displayWidth/1.5, cloud1.displayHeight/1.5);
    cloud2.setDisplaySize(cloud2.displayWidth/1.5, cloud2.displayHeight/1.5);

    this.tweens.add({
        targets: cloud1,
        x: targetX-30,
        duration: 400,
        onComplete: () => {
            this.tweens.add({
                targets:cloud1,
                x: targetX+5,
                y: targetY+2,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: () => { cloud1.destroy() }
            })
        }
    });

    this.tweens.add({
        targets: cloud2,
        x: targetX+30,
        duration: 400,
        onComplete: () => {
            this.tweens.add({
                targets:cloud2,
                x: targetX+5,
                y: targetY+2,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: () => { cloud2.destroy() }
            })
        }
    });
}

tentaclesAnim(targetX, targetY, tentacles, target){

    const tentaclesBack = this.add.image(targetX, targetY+12, tentacles+"_back");
    const tentaclesBack2 = this.add.image(targetX, targetY-12, tentacles+"_back");

    tentaclesBack.setDisplaySize(tentaclesBack.displayWidth/1.5, tentaclesBack.displayHeight/1.5);
    tentaclesBack2.setDisplaySize(tentaclesBack2.displayWidth/1.5, tentaclesBack2.displayHeight/1.5);

    const tentaclesTop = this.add.image(targetX, targetY, tentacles+"_top");
    tentaclesTop.setDisplaySize(tentaclesTop.displayWidth/1.5, tentaclesTop.displayHeight/1.5);
    this.tweens.add({
        targets: [tentaclesTop, tentaclesBack, tentaclesBack2],
        scale: 0.4,
        duration: 400,
        onComplete: () => {
            
            this.time.delayedCall(1000, ()=> {
                tentaclesBack.destroy();
                tentaclesBack2.destroy();
                tentaclesTop.destroy();
            })
            
        }
    });

    this.tweens.add({
        targets: target,
        displayWidth: target.displayWidth - 20,
        duration: 1200,
        delay: 150,
        yoyo: true
    });
}

strikeAnim(targetX, targetY) {

    const leaves = [];

    const rows = 4;
    const cols = 3;

    for(let i = 0; i < 15; i++) {

    const obj = this.add.image(
        410 + i* Phaser.Math.Between(1,30),
        100 - i * Phaser.Math.Between(1,30),
        'rain_fire'
    );
    obj.setDisplaySize(obj.displayWidth/1.5, obj.displayHeight/1.5);

    obj.setScale(0.7);
    obj.setAngle(-160);

    this.tweens.add({
        targets: obj,
        x: '-=180',
        y: '+=180',
        duration: 800,
        delay: i*50,
        ease: 'Linear',
        onComplete: () => {
            this.time.delayedCall(0, () => {
                obj.destroy();
            });
        }
    });
}

    
}
}