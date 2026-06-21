// TestingScene.js - Interactive Phaser Text Style & Font Showcase
// Demonstrates various text rendering techniques in Phaser 3, focusing on Google Web Fonts.
// // Translation dictionary for testing
const translations = {
    en: {
        "lab_title": "PHASER FONT LABORATORY",
        "tab_lilita": "LILITA ONE",
        "tab_compare": "COMPARE ALL",
        "tab_presets": "UI PRESETS",
        "lilita_title": "Lilita One Outline & Effects",
        "lilita_plain": "Lilita Plain Style",
        "lilita_thin": "Lilita Thin Outline",
        "lilita_thick": "Lilita Thick Outline",
        "amber_glow": "Amber Glowing Text",
        "crit_hit": "CRITICAL HIT!"
    },
    ru: {
        "lab_title": "ЛАБОРАТОРИЯ ШРИФТОВ PHASER",
        "tab_lilita": "LILITA ONE",
        "tab_compare": "СРАВНИТЬ ВСЕ",
        "tab_presets": "UI ПРЕСЕТЫ",
        "lilita_title": "Контуры и Эффекты Lilita One",
        "lilita_plain": "Простой стиль Lilita",
        "lilita_thin": "Тонкий контур Lilita",
        "lilita_thick": "Толстый контур Lilita",
        "amber_glow": "Янтарный светящийся текст",
        "crit_hit": "КРИТИЧЕСКИЙ УДАР!"
    }
};

// Force Russian for this demo to showcase Cyrillic text rendering
const userLang = "ru"; 

function t(key) {
    return translations[userLang]?.[key] || translations['en'][key] || key;
}

export class TestingScene extends Phaser.Scene {
    constructor() {
        super({ key: "TestingScene" });
        this.activeTab = "lilita"; // "lilita" | "compare" | "presets"
        this.activeBgType = "slate"; // "camp" | "world" | "slate" | "light" | "forest" | "ocean"
    }

    preload() {
        console.log("TestingScene preload started");
        
        // Load actual game backgrounds to test text readability on game scenes
        this.load.image("world-bg", "images/hub/worldbg.png");
        this.load.image("bgs_camp", "images/area_bootcamp/camp.png");
    }

    create() {
        const { width, height } = this.scale;
        
        // 1. Initialize Backgrounds
        this.createBackgroundSystem(width, height);

        // 2. Create Scrollable/Switchable Containers for each Showcase Tab
        this.tabContainers = {
            lilita: this.add.container(0, 0),
            compare: this.add.container(0, 0),
            presets: this.add.container(0, 0)
        };

        // Populate the containers
        this.buildLilitaShowcase(width);
        this.buildCompareShowcase(width);
        this.buildPresetsShowcase(width);

        // Hide all except active tab
        this.updateTabVisibility();

        // 3. Create Navigation Header and Tabs (Top UI)
        this.createHeaderAndTabs(width);

        // 4. Create Background Selector (Bottom UI)
        this.createBackgroundSelector(width, height);

        this.displayMonsters()
    }


    displayMonsters() {
        // const monsters = JSON.parse(localStorage.getItem("selectedMonsters"));
        const monsters = ["brasko", "chompy", "grunko"]
        monsters.forEach((monster, i) => {

            const x = 140 + i * 180;
            const y = 500;

            // Monster
            const monsterSprite = this.add.image(
                x,
                y,
                `front_brasko`
            );

            monsterSprite
                .setOrigin(0.5, 1)
                .setScale(0.7);

            // Floating panel above monster
            const panel = this.add.container(
                x,
                y - monsterSprite.displayHeight - 20
            );

            const bg = this.add.image(
                0,
                0,
                `pane_tooltip_fire`
            );

            bg.setOrigin(0.5);

            const nameText = this.add.text(
                0,
                -10,
                monster.toUpperCase(),
                {
                    fontSize: "18px",
                    color: "#ffffff",
                    fontStyle: "bold"
                }
            ).setOrigin(0.5);

            const levelText = this.add.text(
                -50,
                -35,
                `LV ${i}`,
                {
                    fontSize: "14px",
                    color: "#ffffff"
                }
            );

            // HP bar background
            const hpBg = this.add.rectangle(
                0,
                20,
                100,
                12,
                0x222222
            ).setOrigin(0.5);

            // HP fill
            const hpFill = this.add.rectangle(
                -50,
                20,
                100 * (100 / 100),
                12,
                0x00ff00
            ).setOrigin(0, 0.5);

            panel.add([
                bg,
                nameText,
                levelText,
                hpBg,
                hpFill
            ]);
        });
    }

    createBackgroundSystem(width, height) {
        // Create solid background graphics
        this.bgGraphics = this.add.graphics().setDepth(0);
        
        // Create image backgrounds (hidden by default unless active)
        this.bgCampImage = this.add.image(width / 2, height / 2, "bgs_camp")
            .setDepth(1)
            .setDisplaySize(width, height)
            .setVisible(false);
            
        this.bgWorldImage = this.add.image(width / 2, height / 2, "world-bg")
            .setDepth(1)
            .setDisplaySize(width, height)
            .setVisible(false);

        this.updateBackgroundDisplay(width, height);
    }

    updateBackgroundDisplay(width, height) {
        // Reset image visibilities
        this.bgCampImage.setVisible(false);
        this.bgWorldImage.setVisible(false);
        this.bgGraphics.clear();

        const colors = {
            slate: 0x18181c,
            light: 0xf3f4f6,
            forest: 0x143b18,
            ocean: 0x0f3057
        };

        if (this.activeBgType === "camp") {
            this.bgCampImage.setVisible(true);
        } else if (this.activeBgType === "world") {
            this.bgWorldImage.setVisible(true);
        } else {
            const hexColor = colors[this.activeBgType] || 0x18181c;
            this.bgGraphics.fillStyle(hexColor, 1);
            this.bgGraphics.fillRect(0, 0, width, height);

            // Add simple grid overlay on slate & light for aligning perspective
            if (this.activeBgType === "slate" || this.activeBgType === "light") {
                const gridColor = this.activeBgType === "slate" ? 0x2d2d34 : 0xe5e7eb;
                this.bgGraphics.lineStyle(1, gridColor, 1);
                
                // Draw vertical grid lines
                for (let x = 40; x < width; x += 40) {
                    this.bgGraphics.lineBetween(x, 110, x, 680);
                }
                // Draw horizontal grid lines
                for (let y = 120; y < 680; y += 40) {
                    this.bgGraphics.lineBetween(0, y, width, y);
                }
            }
        }
    }

    createHeaderAndTabs(width) {
        const headerContainer = this.add.container(0, 0).setDepth(100);

        // Header Background
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x111115, 0.95);
        headerBg.fillRect(0, 0, width, 110);
        headerBg.lineStyle(2, 0xffa500, 1);
        headerBg.lineBetween(0, 110, width, 110);
        headerContainer.add(headerBg);

        // Main Title
        const mainTitle = this.add.text(width / 2, 22, t("lab_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px",
            color: "#ffa500"
        }).setOrigin(0.5);
        
        mainTitle.setStroke("#000000", 4);
        mainTitle.setShadow(2, 2, "#000000", 2, true, true);
        headerContainer.add(mainTitle);

        // Create Tabs
        const tabData = [
            { id: "lilita", label: t("tab_lilita"), x: width * 0.18 },
            { id: "compare", label: t("tab_compare"), x: width * 0.5 },
            { id: "presets", label: t("tab_presets"), x: width * 0.82 }
        ];

        this.tabTextObjects = {};

        tabData.forEach((tab) => {
            // Tab Pill Background (will draw dynamically)
            const isTabActive = this.activeTab === tab.id;
            
            const tabBtn = this.add.text(tab.x, 75, tab.label, {
                fontFamily: "Nunito, Arial, sans-serif",
                fontSize: "12px",
                fontWeight: "900",
                color: isTabActive ? "#ffffff" : "#9ca3af",
                backgroundColor: isTabActive ? "#ffa500" : "#1f2937",
                padding: { x: 14, y: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            // Make background styling match active/inactive state
            if (isTabActive) {
                tabBtn.setStyle({ color: "#111115", backgroundColor: "#ffa500" });
            } else {
                tabBtn.setStyle({ color: "#9ca3af", backgroundColor: "#22222a" });
            }

            // Click Handler
            tabBtn.on("pointerdown", () => {
                // Micro animation
                this.tweens.add({
                    targets: tabBtn,
                    scale: 0.92,
                    duration: 80,
                    yoyo: true,
                    onComplete: () => {
                        this.activeTab = tab.id;
                        this.updateTabStyles(width);
                        this.updateTabVisibility();
                    }
                });
            });

            this.tabTextObjects[tab.id] = tabBtn;
            headerContainer.add(tabBtn);
        });
    }

    updateTabStyles(width) {
        Object.keys(this.tabTextObjects).forEach((tabId) => {
            const tabBtn = this.tabTextObjects[tabId];
            const isTabActive = this.activeTab === tabId;
            
            if (isTabActive) {
                tabBtn.setStyle({ color: "#111115", backgroundColor: "#ffa500" });
            } else {
                tabBtn.setStyle({ color: "#9ca3af", backgroundColor: "#22222a" });
            }
        });
    }

    updateTabVisibility() {
        Object.keys(this.tabContainers).forEach((tabId) => {
            const container = this.tabContainers[tabId];
            const isActive = this.activeTab === tabId;
            
            if (isActive) {
                container.setVisible(true);
                container.alpha = 0;
                this.tweens.add({
                    targets: container,
                    alpha: 1,
                    duration: 250,
                    ease: "Power2"
                });
            } else {
                container.setVisible(false);
            }
        });
    }

    // ==========================================
    // TAB 1: LILITA ONE SHOWCASE
    // ==========================================
    buildLilitaShowcase(width) {
        const container = this.tabContainers.lilita;
        container.setDepth(5);

        let startY = 140;
        const spacing = 65;

        // Title
        const sectionTitle = this.add.text(width / 2, startY, t("lilita_title"), {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#999999"
        }).setOrigin(0.5);
        container.add(sectionTitle);
        startY += 40;

        // 1. Plain Text (No outline)
        const txtPlain = this.add.text(width / 2, startY, t("lilita_plain"), {
            fontFamily: "Lilita One, Coiny, Nunito, Arial",
            fontSize: "26px",
            color: "#ffffff"
        }).setOrigin(0.5);
        container.add(txtPlain);
        startY += spacing;

        // 2. Lilita One with Thin Outline
        const txtThinStroke = this.add.text(width / 2, startY, t("lilita_thin"), {
            fontFamily: "Lilita One, Coiny, Nunito, Arial",
            fontSize: "28px",
            color: "#ffffff"
        }).setOrigin(0.5);
        txtThinStroke.setStroke("#111111", 3);
        container.add(txtThinStroke);
        startY += spacing;

        // 3. Lilita One with Thick Outline (CRITICAL DEMO)
        const txtThickStroke = this.add.text(width / 2, startY, t("lilita_thick"), {
            fontFamily: "Lilita One, Coiny, Nunito, Arial",
            fontSize: "30px",
            color: "#ffffff"
        }).setOrigin(0.5);
        txtThickStroke.setStroke("#000000", 8);
        txtThickStroke.setShadow(2, 4, "#000000", 0, true, true);
        container.add(txtThickStroke);
        
        // Add a small tag showing it is Lilita One
        const labelThick = this.add.text(width / 2, startY + 22, "(stroke: #000000, thickness: 8)", {
            fontFamily: "Courier New, monospace",
            fontSize: "10px",
            color: "#ffbb33"
        }).setOrigin(0.5);
        container.add(labelThick);
        startY += spacing + 10;

        // 4. Glow / Cyber Style
        const txtGlow = this.add.text(width / 2, startY, t("amber_glow"), {
            fontFamily: "Lilita One, Coiny, Nunito, Arial",
            fontSize: "28px",
            color: "#ffe066"
        }).setOrigin(0.5);
        txtGlow.setStroke("#d48a00", 8);
        txtGlow.setShadow(0, 0, "#ffaa00", 8, true, true);
        container.add(txtGlow);
        startY += spacing;

        // 5. Fire/Red Outline
        const txtFire = this.add.text(width / 2, startY, t("crit_hit"), {
            fontFamily: "Lilita One, Coiny, Nunito, Arial",
            fontSize: "32px",
            color: "#ff3333"
        }).setOrigin(0.5);
        txtFire.setStroke("#ffffff", 4);
        txtFire.setShadow(3, 3, "#800000", 0, true, true);
        container.add(txtFire);
        startY += spacing + 10;

        // 6. Gradient Fill (with outline)
        const txtGrad = this.add.text(width / 2, startY, "GRADIENT EFFECT", {
            fontFamily: "Lilita One",
            fontSize: "28px",
            color: "#ffffff" // default fallback
        }).setOrigin(0.5);
        txtGrad.setStroke("#0f172a", 6);
        txtGrad.setShadow(2, 2, "#000000", 2, true, true);
        
        // Generate linear gradient context
        const grad = txtGrad.context.createLinearGradient(0, 0, 0, 30);
        grad.addColorStop(0, '#00ffcc');
        grad.addColorStop(0.5, '#00aaff');
        grad.addColorStop(1, '#0055ff');
        txtGrad.setFill(grad);
        
        container.add(txtGrad);
        startY += spacing;

        // 7. Comic Shadow (Stroke + offset fill shadow)
        const txtComic = this.add.text(width / 2, startY, "COMIC BUBBLE", {
            fontFamily: "Lilita One",
            fontSize: "28px",
            color: "#38bdf8"
        }).setOrigin(0.5);
        txtComic.setStroke("#ffffff", 6);
        txtComic.setShadow(4, 4, "#1e3a8a", 0, true, true);
        container.add(txtComic);
    }

    // ==========================================
    // TAB 2: COMPARE ALL FONTS SIDE-BY-SIDE
    // ==========================================
    buildCompareShowcase(width) {
        const container = this.tabContainers.compare;
        container.setDepth(5);

        let startY = 145;
        const fontFamilies = [
            { name: "Lilita One", key: "Lilita One", size: "26px", desc: "Lilita One (Playful Bold)" },
            { name: "Coiny", key: "Coiny", size: "26px", desc: "Coiny (Round Bubble)" },
            { name: "Press Start 2P", key: "Press Start 2P", size: "14px", desc: "Press Start 2P (Retro 8-Bit)" },
            { name: "Rubik Spray Paint", key: "Rubik Spray Paint", size: "24px", desc: "Rubik Spray (Splatter)" },
            { name: "Nunito", key: "Nunito", size: "24px", desc: "Nunito (Sleek Modern UI)" },
            { name: "Arial / System", key: "Arial", size: "24px", desc: "Arial (Standard Fallback)" }
        ];

        fontFamilies.forEach((f) => {
            // Label
            const label = this.add.text(width / 2, startY, f.desc, {
                fontFamily: "Courier New, monospace",
                fontSize: "11px",
                color: "#a1a1aa"
            }).setOrigin(0.5);
            container.add(label);
            startY += 20;

            // Outlined demo text
            const textObj = this.add.text(width / 2, startY, "Level Up! +100 XP", {
                fontFamily: f.key,
                fontSize: f.size,
                color: "#ffffff"
            }).setOrigin(0.5);
            
            // Apply outline
            textObj.setStroke("#000000", f.key === "Press Start 2P" ? 3 : 5);
            textObj.setShadow(2, 2, "#000000", 0, true, true);
            container.add(textObj);
            
            startY += 58;
        });
    }

    // ==========================================
    // TAB 3: COMMON GAME UI PRESETS
    // ==========================================
    buildPresetsShowcase(width) {
        const container = this.tabContainers.presets;
        container.setDepth(5);

        let startY = 140;

        // --- PRESET 1: GIANT BOUNCING "LEVEL UP!" BANNER ---
        const lvlUpLabel = this.add.text(width / 2, startY, "Level Up Alert", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            color: "#a1a1aa"
        }).setOrigin(0.5);
        container.add(lvlUpLabel);
        startY += 40;

        const levelUpText = this.add.text(width / 2, startY, "LEVEL UP!", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "42px",
            color: "#ffd700"
        }).setOrigin(0.5);
        levelUpText.setStroke("#000000", 10);
        levelUpText.setShadow(3, 4, "#ff4500", 0, true, true);
        container.add(levelUpText);

        // Fun bounce animation
        this.tweens.add({
            targets: levelUpText,
            scaleX: 1.15,
            scaleY: 1.15,
            angle: 2,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: "Quad.easeInOut"
        });
        startY += 85;

        // --- PRESET 2: COMBAT FLOATING DAMAGE NUMBERS ---
        const dmgLabel = this.add.text(width / 2, startY, "Floating Combat Text", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            color: "#a1a1aa"
        }).setOrigin(0.5);
        container.add(dmgLabel);
        startY += 35;

        const critText = this.add.text(width * 0.3, startY, "CRIT! 984", {
            fontFamily: "Lilita One",
            fontSize: "26px",
            color: "#ff2200"
        }).setOrigin(0.5);
        critText.setStroke("#ffffff", 4);
        critText.setShadow(2, 2, "#400000", 0, true, true);
        critText.setAngle(-12);
        container.add(critText);

        const normalText = this.add.text(width * 0.7, startY, "-120", {
            fontFamily: "Lilita One",
            fontSize: "24px",
            color: "#ffffff"
        }).setOrigin(0.5);
        normalText.setStroke("#111111", 5);
        normalText.setShadow(1, 2, "#000000", 0, true, true);
        container.add(normalText);
        startY += 70;

        // --- PRESET 3: INTERACTIVE GAME BUTTON ---
        const btnLabel = this.add.text(width / 2, startY, "Interactive Button State", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            color: "#a1a1aa"
        }).setOrigin(0.5);
        container.add(btnLabel);
        startY += 45;

        // Button container
        const btnContainer = this.add.container(width / 2, startY);
        
        // Button background graphics (pill shape)
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x10b981, 1); // Emerald Green
        btnBg.lineStyle(3, 0xffffff, 1);
        btnBg.fillRoundedRect(-100, -25, 200, 50, 25);
        btnBg.strokeRoundedRect(-100, -25, 200, 50, 25);
        btnContainer.add(btnBg);

        // Button text inside
        const btnText = this.add.text(0, 0, "BATTLE!", {
            fontFamily: "Lilita One",
            fontSize: "22px",
            color: "#ffffff"
        }).setOrigin(0.5);
        btnText.setStroke("#065f46", 4);
        btnText.setShadow(1, 1, "#000000", 1, true, true);
        btnContainer.add(btnText);

        // Make button interactive
        const hitArea = new Phaser.Geom.Rectangle(-100, -25, 200, 50);
        btnContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        btnContainer.on("pointerover", () => {
            btnBg.clear();
            btnBg.fillStyle(0x059669, 1); // Darker Emerald
            btnBg.lineStyle(3, 0xffd700, 1); // Gold border on hover
            btnBg.fillRoundedRect(-100, -25, 200, 50, 25);
            btnBg.strokeRoundedRect(-100, -25, 200, 50, 25);
            btnContainer.setScale(1.05);
        });

        btnContainer.on("pointerout", () => {
            btnBg.clear();
            btnBg.fillStyle(0x10b981, 1);
            btnBg.lineStyle(3, 0xffffff, 1);
            btnBg.fillRoundedRect(-100, -25, 200, 50, 25);
            btnBg.strokeRoundedRect(-100, -25, 200, 50, 25);
            btnContainer.setScale(1.0);
        });

        btnContainer.on("pointerdown", () => {
            btnContainer.setScale(0.95);
            // Flash color
            btnText.setText("READY!");
            this.time.delayedCall(400, () => {
                btnText.setText("BATTLE!");
            });
        });

        btnContainer.on("pointerup", () => {
            btnContainer.setScale(1.05);
        });

        container.add(btnContainer);
        startY += 85;

        // --- PRESET 4: RPG DIALOGUE BOX ---
        const dialogueLabel = this.add.text(width / 2, startY, "RPG Dialogue Box (Nunito)", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            color: "#a1a1aa"
        }).setOrigin(0.5);
        container.add(dialogueLabel);
        startY += 20;

        // Glass box
        const dbg = this.add.graphics();
        dbg.fillStyle(0x1e1d24, 0.9);
        dbg.lineStyle(2, 0xffa500, 0.8);
        dbg.fillRoundedRect(30, startY, width - 60, 105, 10);
        dbg.strokeRoundedRect(30, startY, width - 60, 105, 10);
        container.add(dbg);

        // Speaker name
        const speakerText = this.add.text(45, startY + 12, "Elder Cable:", {
            fontFamily: "Lilita One, Arial, sans-serif",
            fontSize: "14px",
            color: "#ffa500"
        });
        speakerText.setStroke("#000000", 3);
        container.add(speakerText);

        // Dialogue body (wrapped text)
        const dialogueBody = this.add.text(45, startY + 34, "I've scanned the perimeter, adventurer. The ruins ahead hold rare water-type monsters, but they're highly aggressive. Be ready!", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "11px",
            color: "#e2e8f0",
            wordWrap: { width: width - 90, useAdvancedWrap: true },
            lineSpacing: 3
        });
        container.add(dialogueBody);
    }

    // ==========================================
    // BOTTOM NAVIGATION: BACKGROUND SELECTOR
    // ==========================================
    createBackgroundSelector(width, height) {
        const selectorContainer = this.add.container(0, 0).setDepth(100);

        // Selector Bar Background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x111115, 0.95);
        barBg.fillRect(0, height - 105, width, 105);
        barBg.lineStyle(2, 0xffa500, 1);
        barBg.lineBetween(0, height - 105, width, height - 105);
        selectorContainer.add(barBg);

        // Selector Title
        const selTitle = this.add.text(width / 2, height - 90, "TEST BACKGROUND SELECTOR", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "11px",
            fontWeight: "900",
            color: "#9ca3af"
        }).setOrigin(0.5);
        selectorContainer.add(selTitle);

        // Background Buttons configurations
        const buttonsData = [
            { id: "camp", label: "CAMP", x: width * 0.16 },
            { id: "world", label: "WORLD", x: width * 0.50 },
            { id: "slate", label: "SLATE", x: width * 0.84 },
            { id: "light", label: "LIGHT", x: width * 0.16, yOffset: 30 },
            { id: "forest", label: "FOREST", x: width * 0.50, yOffset: 30 },
            { id: "ocean", label: "OCEAN", x: width * 0.84, yOffset: 30 }
        ];

        this.bgButtons = {};

        buttonsData.forEach((btnData) => {
            const yPos = height - 62 + (btnData.yOffset || 0);
            const isActive = this.activeBgType === btnData.id;

            const btnText = this.add.text(btnData.x, yPos, btnData.label, {
                fontFamily: "Nunito, Arial, sans-serif",
                fontSize: "10px",
                fontWeight: "900",
                color: isActive ? "#ffffff" : "#9ca3af",
                backgroundColor: isActive ? "#10b981" : "#1f2937",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            if (isActive) {
                btnText.setStyle({ color: "#ffffff", backgroundColor: "#10b981" });
            } else {
                btnText.setStyle({ color: "#9ca3af", backgroundColor: "#22222a" });
            }

            btnText.on("pointerdown", () => {
                this.tweens.add({
                    targets: btnText,
                    scale: 0.90,
                    duration: 60,
                    yoyo: true,
                    onComplete: () => {
                        this.activeBgType = btnData.id;
                        this.updateBackgroundDisplay(width, height);
                        this.updateBgButtonStyles(height);
                        
                        // Adapt contrast if light background is chosen
                        this.adaptTextColorsForBackground();
                    }
                });
            });

            this.bgButtons[btnData.id] = btnText;
            selectorContainer.add(btnText);
        });
    }

    updateBgButtonStyles(height) {
        Object.keys(this.bgButtons).forEach((btnId) => {
            const btnText = this.bgButtons[btnId];
            const isActive = this.activeBgType === btnId;
            
            if (isActive) {
                btnText.setStyle({ color: "#ffffff", backgroundColor: "#10b981" });
            } else {
                btnText.setStyle({ color: "#9ca3af", backgroundColor: "#22222a" });
            }
        });
    }

    adaptTextColorsForBackground() {
        // Dynamic adaptation to ensure clear viewing:
        // When background is LIGHT (white/grey), we can change helper labels or subtexts to be darker,
        // so that they remain perfectly readable.
        const isLightBg = this.activeBgType === "light";
        const labelColor = isLightBg ? "#4b5563" : "#a1a1aa"; // Dark slate grey vs light grey
        const titleColor = isLightBg ? "#374151" : "#999999";

        // Collect all custom label/description texts from our containers and update them
        this.tabContainers.lilita.list.forEach((child) => {
            // Check if it's a small description label
            if (child.type === "Text" && (child.text.startsWith("(") || child.text.includes("Effects"))) {
                child.setColor(isLightBg ? "#1e3a8a" : "#ffbb33");
            }
        });

        this.tabContainers.compare.list.forEach((child) => {
            if (child.type === "Text" && child.fontSize === "11px") {
                child.setColor(labelColor);
            }
        });

        this.tabContainers.presets.list.forEach((child) => {
            if (child.type === "Text" && child.fontSize === "12px") {
                child.setColor(labelColor);
            }
        });
    }
}

// Ensure the game only boots up after the document web fonts have completed loading.
// This prevents Phaser from falling back to default browser fonts (Arial/sans-serif).
export function startGame() {
    const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 800,
        backgroundColor: "#1d1d1d",
        parent: "game-container",
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [TestingScene, PreloadScene],
        render: {
            pixelArt: false,
            roundPixels: true
        }
    };

    const game = new Phaser.Game(config);
}

// Run the game initialization after verifying that all fonts have been loaded
if (document.fonts) {
    document.fonts.ready.then(() => {
        console.log("All fonts are ready. Initializing Phaser game.");
        startGame();
    }).catch((err) => {
        console.error("Font loading error, starting game anyway:", err);
        startGame();
    });
} else {
    // Fallback if document.fonts is not supported
    window.addEventListener("load", () => {
        startGame();
    });
}