import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { checkClick } from "./game.js";
import { t } from "../translations.js";

export class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: "TutorialScene" });
    }

    init(data) {
        this.mode = data.mode || "world"; // "world" or "map"
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.currentStep = 0;

        if (this.mode === "world") {
            this.steps = [
                {
                    titleKey: "tut_title_welcome",
                    descKey: "tut_desc_welcome",
                    highlight: null
                },
                {
                    titleKey: "tut_title_team",
                    descKey: "tut_desc_team",
                    highlight: { x: 360, y: 740, w: 80, h: 80 }
                },
                {
                    titleKey: "tut_title_missions",
                    descKey: "tut_desc_missions",
                    highlight: { x: 200, y: 740, w: 80, h: 80 }
                },
                {
                    titleKey: "tut_title_shop",
                    descKey: "tut_desc_shop",
                    highlight: { x: 40, y: 740, w: 80, h: 80 }
                },
                {
                    titleKey: "tut_title_explore",
                    descKey: "tut_desc_explore",
                    highlight: { x: 90, y: 600, w: 100, h: 100 }
                },
                {
                    titleKey: "tut_title_ready",
                    descKey: "tut_desc_ready",
                    highlight: null
                }
            ];
        } else {
            // Map tutorial mode
            this.steps = [
                {
                    titleKey: "map_tut_welcome",
                    descKey: "map_tut_welcome_desc",
                    highlight: null
                },
                {
                    titleKey: "map_tut_nodes",
                    descKey: "map_tut_nodes_desc",
                    highlight: { x: 320, y: 500, w: 70, h: 60 }
                },
                {
                    titleKey: "map_tut_battles",
                    descKey: "map_tut_battles_desc",
                    highlight: { x: 241, y: 526, w: 70, h: 60 }
                },
                {
                    titleKey: "map_tut_boss",
                    descKey: "map_tut_boss_desc",
                    highlight: { x: 680, y: 150, w: 140, h: 140 }
                },
                {
                    titleKey: "map_tut_prompt",
                    descKey: "map_tut_prompt_desc",
                    highlight: null
                }
            ];
        }

        // Draw backdrop
        this.overlay = this.add.graphics();
        this.overlay.setDepth(100);

        // Add dialogue card container
        this.cardContainer = this.add.container(20, this.height / 2 - 120).setDepth(200);

        // Card bg
        this.cardBg = this.add.graphics();
        this.cardBg.fillStyle(0x0f172a, 0.96); // Slate 900
        this.cardBg.lineStyle(3, 0xf59e0b, 1);  // Amber 500 glowing border
        this.cardBg.fillRoundedRect(0, 0, this.width - 40, 240, 16);
        this.cardBg.strokeRoundedRect(0, 0, this.width - 40, 240, 16);
        this.cardContainer.add(this.cardBg);

        // Avatar (Emoji guide!)
        this.avatarText = this.add.text(45, 45, "🧑‍🏫", {
            fontSize: "48px"
        }).setOrigin(0.5);
        this.cardContainer.add(this.avatarText);

        // Bounce tween for the avatar
        this.tweens.add({
            targets: this.avatarText,
            y: 52,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        // Title
        this.titleText = this.add.text(90, 25, "", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px",
            color: "#f59e0b"
        });
        this.titleText.setStroke("#000000", 3);
        this.cardContainer.add(this.titleText);

        // Description text
        this.descText = this.add.text(25, 95, "", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "14px",
            color: "#ffffff",
            wordWrap: { width: this.width - 90, useAdvancedWrap: true },
            lineSpacing: 4
        });
        this.cardContainer.add(this.descText);

        // Skip Button
        this.skipBtn = this.add.text(this.width - 40 - 25, 25, "", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "12px",
            color: "#ef4444"
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        this.skipBtn.setStroke("#000000", 2);
        this.skipBtn.setText(t("skip_btn") + " ⏭️");
        this.cardContainer.add(this.skipBtn);

        this.skipBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.skipAll();
        });

        // Next / Action Button
        this.btnNext = this.add.image(this.width - 40 - 75, 200, "btn_blank")
            .setDisplaySize(130, 36)
            .setInteractive({ useHandCursor: true });
        this.btnNext.setTint(0xf59e0b);
        this.cardContainer.add(this.btnNext);

        this.btnText = this.add.text(this.width - 40 - 75, 200, "", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "13px",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.cardContainer.add(this.btnText);

        // Button pulsing tween
        this.tweens.add({
            targets: [this.btnNext, this.btnText],
            scaleX: 1.04,
            scaleY: 1.04,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        this.btnNext.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.nextStep();
        });

        // Initial render
        this.renderStep();
    }

    renderStep() {
        const step = this.steps[this.currentStep];
        this.titleText.setText(t(step.titleKey));
        this.descText.setText(t(step.descKey));

        // Adjust position dynamically to avoid covering highlighted areas
        if (step.highlight) {
            if (step.highlight.y > this.height / 2) {
                // Highlight is on bottom half of the screen; place card at the top
                this.cardContainer.y = 40;
            } else {
                // Highlight is on top half of the screen; place card at the bottom
                this.cardContainer.y = this.height - 280;
            }
        } else {
            // Default center position
            this.cardContainer.y = this.height / 2 - 120;
        }

        // Change button text on final step
        if (this.currentStep === this.steps.length - 1) {
            if (this.mode === "world") {
                this.btnText.setText(t("start_btn"));
            } else {
                this.btnText.setText(t("start_btn") + " MOCK");
            }
        } else {
            this.btnText.setText(t("next_btn"));
        }

        // Redraw overlay highlight spotlight
        this.overlay.clear();
        this.overlay.fillStyle(0x020617, 0.75); // Slate 950 semi-transparent

        if (step.highlight) {
            const { x, y, w, h } = step.highlight;
            const topY = y - h / 2;
            const bottomY = y + h / 2;
            const leftX = x - w / 2;
            const rightX = x + w / 2;

            // Draw the 4 blocking rectangles around highlight spot
            this.overlay.fillRect(0, 0, this.width, topY); // Top
            this.overlay.fillRect(0, bottomY, this.width, this.height - bottomY); // Bottom
            this.overlay.fillRect(0, topY, leftX, h); // Left
            this.overlay.fillRect(rightX, topY, this.width - rightX, h); // Right

            // Draw a glowing orange border around highlight spot
            this.overlay.lineStyle(3, 0xf59e0b, 1);
            this.overlay.strokeRect(leftX, topY, w, h);
        } else {
            // Full screen cover if no highlight
            this.overlay.fillRect(0, 0, this.width, this.height);
        }
    }

    async nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.btnNext.disableInteractive();
            if (this.mode === "world") {
                try {
                    await api.completeTutorial();
                    state.user.tutorial = true;
                } catch (err) {
                    console.error("Failed to complete tutorial:", err);
                }
                
                // Close scene and resume WorldScene
                this.overlay.destroy();
                this.scene.stop();
                const worldScene = this.scene.get("WorldScene");
                if (worldScene) {
                    worldScene.scene.resume();
                }
            } else {
                // Map tutorial finished, start mock battle!
                localStorage.setItem("map_tutorial_done", "true");
                this.overlay.destroy();
                this.scene.stop();

                // Stop MapScene and launch mock BattleScene
                const mapScene = this.scene.get("MapScene");
                if (mapScene) {
                    mapScene.scene.stop();
                }

                this.scene.start("BattleScene", {
                    map: "bootcamp",
                    isMockBattle: true,
                    battleState: {
                        battleId: "mock-battle-id",
                        playerMonsters: [
                            {
                                instanceId: "mock-player-id",
                                monsterId: "grunko",
                                id: "grunko",
                                title: "Grunko",
                                level: 5,
                                hp: 40,
                                maxHP: 40,
                                atk: 12,
                                def: 10,
                                element: "earth",
                                isFighting: true,
                                skills: ["scratch", "boulders"]
                            }
                        ],
                        playerStates: [
                            {
                                instanceId: "mock-player-id",
                                hp: 40,
                                maxHP: 40,
                                activeSkills: ["scratch-skill", "boulders-skill"]
                            }
                        ],
                        enemyMonsters: [
                            {
                                instanceId: "mock-enemy-id",
                                monsterId: "grunko",
                                id: "grunko",
                                title: "Grunko",
                                level: 3,
                                hp: 30,
                                maxHP: 30,
                                atk: 10,
                                def: 8,
                                element: "earth",
                                isFighting: true,
                                skills: ["scratch", "bubbles"]
                            }
                        ],
                        enemyStates: [
                            {
                                instanceId: "mock-enemy-id",
                                hp: 30,
                                maxHP: 30,
                                activeSkills: ["scratch-skill", "bubbles-skill"]
                            }
                        ],
                        status: "Active"
                    },
                    selectedMonsters: [
                        {
                            instanceId: "mock-player-id",
                            monsterId: "grunko",
                            id: "grunko",
                            title: "Grunko",
                            level: 5,
                            hp: 40,
                            maxHP: 40,
                            atk: 12,
                            def: 10,
                            element: "earth"
                        }
                    ]
                });
            }
        }
    }

    async skipAll() {
        this.skipBtn.disableInteractive();
        this.btnNext.disableInteractive();

        try {
            await api.completeTutorial();
            state.user.tutorial = true;
        } catch (err) {
            console.error("Failed to complete tutorial:", err);
        }

        localStorage.setItem("map_tutorial_done", "true");
        localStorage.setItem("battle_tutorial_done", "true");

        this.overlay.destroy();
        this.scene.stop();

        if (this.mode === "world") {
            const worldScene = this.scene.get("WorldScene");
            if (worldScene) {
                worldScene.scene.resume();
            }
        } else {
            const mapScene = this.scene.get("MapScene");
            if (mapScene) {
                mapScene.scene.resume();
            }
        }
    }
}
