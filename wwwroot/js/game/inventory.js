import { state } from "../state.js";
import * as api from "../webapp/api.js";

export class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: "InventoryScene" });
    }

    create() {
        const { width, height } = this.scale;
        this.width = width;
        this.height = height;

        this.scrollY = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;



        // const monsters = this.getMockMonsters();
        // monsters.forEach((m, i) => this.setMonster(i, m));

        api.loadInventory().then(data => {
            if (data.success) {

                state.inventory.monsters.forEach((m, i) => {

                    const monster = {
                        texture: m.name + "-icon",
                        name: m.name,
                        level: m.level,
                        hp: m.meta.hp,
                        maxHp: m.meta.maxHP
                    };
                    this.inventoryUI = this.createMonsterInventory();
                    this.setMonster(i, monster);
                });
            }
        })
    }


    createMonsterInventory() {
        const containerX = 20;
        const containerY = 100;

        const container = this.add.container(containerX, containerY);

        const width = this.width - 40;
        const height = this.height - this.height / 4;

        // Background
        const bg = this.add.rectangle(0, 0, width, height, 0xffffff)
            .setOrigin(0);

        const title = this.add.text(20, 10, "Monsters", {
            fontSize: '20px',
            color: '#000'
        });

        // Scroll container
        this.scrollContainer = this.add.container(0, 50);

        container.add([bg, title, this.scrollContainer]);

        const maskShape = this.add.graphics();

        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(
            containerX,
            containerY + 50, // offset inside container
            width,
            height - 50
        );

        maskShape.setVisible(false); // IMPORTANT

        const mask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(mask);

        // Grid
        this.createMonsterGrid(this.scrollContainer, 20, 0);

        // Scroll
        this.enableScroll(height - 50);

        return container;
    }

    createMonsterGrid(container, startX, startY) {
        const cols = 3;
        const cardWidth = 100;
        const cardHeight = 120;
        const padding = 15;

        this.monsterSlots = [];
        const totalMonsters = 30

        for (let i = 0; i < totalMonsters; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = startX + col * (cardWidth + padding);
            const y = startY + row * (cardHeight + padding);

            const card = this.createMonsterCard(x, y, cardWidth, cardHeight);

            container.add(card);
            this.monsterSlots.push(card);
        }

        this.totalContentHeight =
            Math.ceil(totalMonsters / cols) * (cardHeight + padding);
    }


    createMonsterCard(x, y, w, h) {
        const card = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, w, h, 0xf5f5f5)
            .setOrigin(0)
            .setStrokeStyle(2, 0x999999);

        const image = this.add.image(w / 2, 35, '')
            .setDisplaySize(60, 60);

        const name = this.add.text(5, 75, "", {
            fontSize: '12px',
            color: '#000'
        });

        const level = this.add.text(w - 5, 75, "", {
            fontSize: '12px',
            color: '#000'
        }).setOrigin(1, 0);

        const hpBg = this.add.rectangle(5, 95, w - 10, 8, 0x444444)
            .setOrigin(0);

        const hpFill = this.add.rectangle(5, 95, w - 10, 8, 0x00ff00)
            .setOrigin(0);

        bg.setInteractive()
            .on('pointerover', () => bg.setStrokeStyle(2, 0xffff00))
            .on('pointerout', () => bg.setStrokeStyle(2, 0x999999))
            .on('pointerdown', () => {
                if (this.isDragging) return;
                this.selectMonster(card);
            });

        card.add([bg, image, name, level, hpBg, hpFill]);

        card.bg = bg;
        card.image = image;
        card.nameText = name;
        card.levelText = level;
        card.hpFill = hpFill;
        card.hpMaxWidth = w - 10;

        return card;
    }


    setMonster(index, data) {
        const card = this.monsterSlots[index];
        if (!card) return;

        card.image.setTexture(data.texture).setDisplaySize(64, 64);
        card.nameText.setText(data.name);
        card.levelText.setText("Lv." + data.level);

        console.log(data);
        const hpPercent = Phaser.Math.Clamp(data.hp / data.maxHp, 0, 1);

        card.hpFill.width = card.hpMaxWidth * hpPercent;

        if (hpPercent < 0.3) card.hpFill.setFillStyle(0xff0000);
        else if (hpPercent < 0.6) card.hpFill.setFillStyle(0xffff00);
        else card.hpFill.setFillStyle(0x00ff00);
    }


    selectMonster(selectedCard) {
        this.monsterSlots.forEach(card => {
            card.bg.setStrokeStyle(2, 0x999999);
        });

        selectedCard.bg.setStrokeStyle(2, 0x00ff00);
    }


    enableScroll(viewHeight) {
        this.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.lastPointerY = pointer.y;
            this.scrollVelocity = 0;
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.isDragging) return;

            const delta = pointer.y - this.lastPointerY;
            this.scrollY += delta;
            this.scrollVelocity = delta;

            this.lastPointerY = pointer.y;

            this.updateScroll(viewHeight);
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
            this.scrollVelocity -= dy * 0.2;
        });
    }

    updateScroll(viewHeight) {
        const maxScroll = Math.max(0, this.totalContentHeight - viewHeight);

        if (this.scrollY > 0) this.scrollY *= 0.5;

        if (this.scrollY < -maxScroll) {
            this.scrollY = -maxScroll + (this.scrollY + maxScroll) * 0.5;
        }

        this.scrollContainer.y = this.scrollY + 50;
    }


    update() {
        if (!this.isDragging) {
            this.scrollY += this.scrollVelocity;
            this.scrollVelocity *= 0.9;

            if (Math.abs(this.scrollVelocity) < 0.1) {
                this.scrollVelocity = 0;
            }

            this.updateScroll(this.height - this.height / 4 - 50);
        }
    }


    getMockMonsters() {




    }
}