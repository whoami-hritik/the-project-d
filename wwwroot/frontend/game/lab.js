import * as api from "../webapp/api.js";
import * as utility from "../utility.js";

export class LabScene extends Phaser.Scene{
    constructor(){
        super({key: "LabScene"});
    }

    init(data){
        this.monster = data.monster;
    }
    create(){
        this.initializeBg();
        utility.createloadingOverlay(this);
        api.GetMonsterInfo(this.monster.instanceId).then(result => {
            if (result.success){
                this.monsInfo = result.info;
                this.showInfo();
            }

            utility.destroyloadingOverlay(this);
        });


    }

    initializeBg(){
        const bg = this.add.image(0, 0, "inventory-bg").setOrigin(0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        const monster = this.add.image(300, 500, `front_${this.monster.id}`);
        monster.setDisplaySize(monster.displayWidth/1.5, monster.displayHeight/1.5)
               .setOrigin(0.5, 1);

        const btn_all = this.add.image(20, 35, "btn_back_all")
        btn_all.setDisplaySize(btn_all.displayWidth/2, btn_all.displayHeight/2).setOrigin(0).setInteractive({useHandCursor:true});
            
        btn_all.on("pointerup", () => {
            this.scene.stop("LabScene");
        })
    }

    showInfo(){
        const PANE_CONTAINER = this.add.container(30, 400);

        const PANE = this.add.image(0, 0, `pane_tooltip_${this.monsInfo.kind}`);
        PANE.setDisplaySize(PANE.displayWidth/1.5, PANE.displayHeight/1.5).setOrigin(0);

        const HPBG = this.add.image(3.5, 45, "hpbar_med_bg");
        HPBG.setDisplaySize(HPBG.displayWidth/1.5, HPBG.displayHeight/1.5).setOrigin(0);

        const HPFILL = this.add.image(3.5, 45, "hpbar_med_fill");
        HPFILL.setDisplaySize(HPFILL.displayWidth/1.5, HPFILL.displayHeight/1.5).setOrigin(0);
        const hpFullWidth = HPFILL.width; 
        const hpCropWidth = (this.monsInfo.hp / 100) * hpFullWidth;
        HPFILL.setCrop(0, 0, hpCropWidth, HPFILL.height);

        const LV = this.add.image(0, -5, "ch35").setOrigin(0);
        
        const levelStr = String(this.monsInfo.level);
        const charCode = levelStr ? levelStr.charCodeAt(0) : null;
        const lev = this.add.image(LV.displayWidth, -5, `ch${charCode}`);
        lev.setOrigin(0);

        PANE_CONTAINER.add([PANE, HPBG, HPFILL, LV, lev]);

        const nameTokens = Array.from(this.monsInfo.title, chr => chr.charCodeAt(0));
        let lastTokenWidth = 0;
        nameTokens.forEach((token, i) => {
            const letter = this.add.image(5+lastTokenWidth, 25, `c${token}`).setOrigin(0);
            letter.setDisplaySize(letter.displayWidth/2,letter.displayHeight/2).setDepth(100);
            lastTokenWidth +=letter.displayWidth;
            
            PANE_CONTAINER.add(letter);
        });

        
        

        const XPBG = this.add.image(20, 500, "xpbar_bg");
        XPBG.setDisplaySize(XPBG.displayWidth/1.5, XPBG.displayHeight/1.5).setOrigin(0);

        const XPFILL = this.add.image(1.5, 500, "xpbar_fill");
        XPFILL.setDisplaySize(XPFILL.displayWidth/1.5, XPFILL.displayHeight/1.5).setOrigin(0);
        const xpFullWidth = XPFILL.width; 
        const xpCropWidth = (this.monsInfo.xp / 100) * xpFullWidth;
        XPFILL.setCrop(0, 0, xpCropWidth, XPFILL.height);


        const RELEASE_BTN = this.add.image(20, 550, "btn_release");
        RELEASE_BTN.setDisplaySize(RELEASE_BTN.displayWidth/1.5, RELEASE_BTN.displayHeight/1.5).setOrigin(0);
        

        const skillContainer = this.add.container(0, 600);

        const skills = this.add.image(0, 0, "skills_bg");
        skills.setDisplaySize(skills.displayWidth/1.5, skills.displayHeight/1.5).setOrigin(0);
        skillContainer.add(skills);
        
        this.monsInfo.abilities.forEach((skill, i) => {
            const skill_icon = this.add.image(i*73.33+10, 40, `icon_${skill.id}`);
            skill_icon.setDisplaySize(skill_icon.displayWidth/1.5, skill_icon.displayHeight/1.5).setOrigin(0);
            skillContainer.add(skill_icon);

            if(skill.getsAt > this.monsInfo.level){
                skill_icon.setAlpha(0.5);
                const lock_skill = this.add.image(i*73.3+5, 60, "skill_lock");
                lock_skill.setDisplaySize(lock_skill.displayWidth/1.5, lock_skill.displayHeight/1.5).setOrigin(0);

                // const lv = this.add.image(0, -5, "ch35").setOrigin(0);
        
                // const unlock_lv_str = String(skill.getsAt);
                // const charCode = unlock_lv ? unlock_lv.charCodeAt(0) : null;
                // const lev = this.add.image(lv.displayWidth, -5, `ch${charCode}`);
                // lev.setOrigin(0);
                skillContainer.add(lock_skill);
            }
        });

        
    }


}