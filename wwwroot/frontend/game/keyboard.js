import { checkClick } from "./game.js";

export class KeyboardScene extends Phaser.Scene {
    constructor() {
        super({ key: "KeyboardScene" });
    }

    init(data) {
        this.type = data.type || "text"; // "text" or "numeric"
        this.initialValue = data.value !== undefined ? String(data.value) : "";
        this.placeholder = data.placeholder || "Enter text...";
        this.onCommit = data.onCommit;
        this.onCancel = data.onCancel;
        this.currentValue = this.initialValue;
        this.isShiftActive = false;
        this.alphabetButtons = [];
        this.cursorIndex = this.currentValue.length;
    }

    create() {
        // Blocker background using dynamic dimensions
        const blocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6).setOrigin(0);
        blocker.setInteractive();

        // Keyboard panel container
        this.panel = this.add.container(0, 0);

        // Panel background at the bottom
        const panelHeight = this.type === "numeric" ? 360 : 420;
        // Shift it up slightly (e.g. 20px) from the bottom of the screen to prevent cut-off
        const panelY = this.scale.height - panelHeight - 20;
        
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1513, 0.95);
        panelBg.lineStyle(3, 0x7c4dff, 1);
        panelBg.fillRoundedRect(10, panelY, 380, panelHeight - 10, 16);
        panelBg.strokeRoundedRect(10, panelY, 380, panelHeight - 10, 16);
        this.panel.add(panelBg);

        // Auto close if clicking outside the keyboard panel area
        blocker.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            if (pointer.y < panelY || pointer.x < 10 || pointer.x > 390) {
                if (this.onCancel) this.onCancel();
                this.scene.stop();
            }
        });

        // Input Box Preview Background
        const inputBoxY = panelY + 20;
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x000000, 0.7);
        inputBg.lineStyle(2, 0xffffff, 0.5);
        inputBg.fillRoundedRect(25, inputBoxY, 350, 50, 12);
        inputBg.strokeRoundedRect(25, inputBoxY, 350, 50, 12);
        this.panel.add(inputBg);

        // Input Text display
        this.displayText = this.add.text(40, inputBoxY + 12, "", {
            fontFamily: "Lilita One",
            fontSize: "20px",
            color: "#ffffff"
        });
        this.panel.add(this.displayText);

        // Cursor caret blinking
        this.cursor = this.add.text(40, inputBoxY + 12, "|", {
            fontFamily: "Lilita One",
            fontSize: "20px",
            color: "#7c4dff"
        });
        this.panel.add(this.cursor);
        this.time.addEvent({
            delay: 500,
            callback: () => { this.cursor.visible = !this.cursor.visible; },
            loop: true
        });

        // Input text click hit zone to position cursor on tap
        const inputHit = this.add.rectangle(200, inputBoxY + 25, 350, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        this.panel.add(inputHit);

        inputHit.on("pointerdown", (pointer) => {
            const clickX = pointer.x - this.displayText.x;
            if (clickX <= 0) {
                this.cursorIndex = 0;
            } else if (clickX >= this.displayText.width) {
                this.cursorIndex = this.currentValue.length;
            } else {
                let bestIdx = 0;
                let minDiff = Math.abs(clickX);
                
                for (let i = 1; i <= this.currentValue.length; i++) {
                    const subStr = this.currentValue.substring(0, i);
                    const originalText = this.displayText.text;
                    this.displayText.setText(subStr);
                    const subWidth = this.displayText.width;
                    this.displayText.setText(originalText);
                    
                    const diff = Math.abs(clickX - subWidth);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestIdx = i;
                    }
                }
                this.cursorIndex = bestIdx;
            }
            this.updateDisplay();
        });

        this.updateDisplay();

        if (this.type === "text") {
            const pasteBtn = this.add.container(340, inputBoxY + 25);
            const pasteBg = this.add.graphics();
            pasteBg.fillStyle(0x7c4dff, 0.4);
            pasteBg.lineStyle(1.5, 0xb388ff, 1);
            pasteBg.fillRoundedRect(-24, -12, 48, 24, 6);
            pasteBg.strokeRoundedRect(-24, -12, 48, 24, 6);
            pasteBtn.add(pasteBg);

            const pasteTxt = this.add.text(0, 0, "PASTE", {
                fontFamily: "Lilita One",
                fontSize: "10px",
                color: "#ffffff"
            }).setOrigin(0.5);
            pasteBtn.add(pasteTxt);

            const pasteHit = this.add.rectangle(-24, -12, 48, 24, 0x000000, 0).setOrigin(0)
                .setInteractive({ useHandCursor: true });
            pasteBtn.add(pasteHit);
            this.panel.add(pasteBtn);

            pasteHit.on("pointerup", async () => {
                const handlePasteText = (text) => {
                    if (text) {
                        const trimmed = text.trim();
                        this.currentValue = this.currentValue.slice(0, this.cursorIndex) + trimmed + this.currentValue.slice(this.cursorIndex);
                        this.cursorIndex += trimmed.length;
                        this.updateDisplay();
                    }
                };

                // 1. Try Telegram native WebApp Clipboard API first
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.readTextFromClipboard) {
                    try {
                        window.Telegram.WebApp.readTextFromClipboard((text) => {
                            handlePasteText(text);
                        });
                        return; // Handled by Telegram SDK
                    } catch (tgErr) {
                        console.warn("Telegram native clipboard read failed: ", tgErr);
                    }
                }

                // 2. Fallback to standard navigator.clipboard
                try {
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        handlePasteText(text);
                    }
                } catch (err) {
                    console.error("Keyboard paste failed: ", err);
                }
            });
        }

        this.keyboardStartY = panelY + 90;

        if (this.type === "numeric") {
            this.createNumericKeyboard(this.keyboardStartY);
        } else {
            this.drawAlphabetKeyboard();
        }
    }

    updateDisplay() {
        this.cursorIndex = Math.max(0, Math.min(this.cursorIndex, this.currentValue.length));
        if (this.currentValue === "") {
            this.displayText.setText(this.placeholder);
            this.displayText.setColor("#888888");
            this.cursor.x = this.displayText.x;
        } else {
            this.displayText.setText(this.currentValue);
            this.displayText.setColor("#ffffff");

            // Measure substring width up to cursorIndex
            const subStr = this.currentValue.substring(0, this.cursorIndex);
            const originalText = this.displayText.text;
            this.displayText.setText(subStr);
            const subWidth = this.displayText.width;
            this.displayText.setText(originalText);

            this.cursor.x = this.displayText.x + subWidth + 1;
        }
    }

    createKeyButton(x, y, width, height, label, callback, color = 0x2b2624) {
        const btn = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.strokeRoundedRect(0, 0, width, height, 8);
        btn.add(bg);

        const txt = this.add.text(width / 2, height / 2, label, {
            fontFamily: "Lilita One",
            fontSize: "18px",
            color: "#ffffff"
        }).setOrigin(0.5);
        btn.add(txt);

        const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
        btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        btn.on("pointerdown", () => {
            bg.clear();
            bg.fillStyle(0x7c4dff, 1);
            bg.lineStyle(2, 0xffffff, 0.5);
            bg.fillRoundedRect(0, 0, width, height, 8);
            bg.strokeRoundedRect(0, 0, width, height, 8);
        });

        btn.on("pointerup", () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.lineStyle(2, 0xffffff, 0.2);
            bg.fillRoundedRect(0, 0, width, height, 8);
            bg.strokeRoundedRect(0, 0, width, height, 8);
            callback();
        });

        btn.on("pointerout", () => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.lineStyle(2, 0xffffff, 0.2);
            bg.fillRoundedRect(0, 0, width, height, 8);
            bg.strokeRoundedRect(0, 0, width, height, 8);
        });

        this.panel.add(btn);
        return btn;
    }

    createNumericKeyboard(startY) {
        const keys = [
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            [".", "0", "⌫"]
        ];

        const keyWidth = 100;
        const keyHeight = 50;
        const gapX = 15;
        const gapY = 12;
        const startX = 35; // centered: (400 - (3 * 100 + 2 * 15)) / 2 = 35

        for (let row = 0; row < keys.length; row++) {
            for (let col = 0; col < keys[row].length; col++) {
                const label = keys[row][col];
                const x = startX + col * (keyWidth + gapX);
                const y = startY + row * (keyHeight + gapY);

                this.createKeyButton(x, y, keyWidth, keyHeight, label, () => {
                    if (label === "⌫") {
                        if (this.cursorIndex > 0) {
                            this.currentValue = this.currentValue.slice(0, this.cursorIndex - 1) + this.currentValue.slice(this.cursorIndex);
                            this.cursorIndex--;
                        }
                    } else if (label === ".") {
                        if (!this.currentValue.includes(".")) {
                            this.currentValue = this.currentValue.slice(0, this.cursorIndex) + "." + this.currentValue.slice(this.cursorIndex);
                            this.cursorIndex++;
                        }
                    } else {
                        this.currentValue = this.currentValue.slice(0, this.cursorIndex) + label + this.currentValue.slice(this.cursorIndex);
                        this.cursorIndex++;
                    }
                    this.updateDisplay();
                });
            }
        }

        // Action Buttons Row: Cancel, Clear, and Ok
        const actionY = startY + 4 * (keyHeight + gapY);
        this.createKeyButton(startX, actionY, 110, 50, "CANCEL", () => {
            if (this.onCancel) this.onCancel();
            this.scene.stop();
        }, 0xd32f2f);

        this.createKeyButton(startX + 110 + gapX, actionY, 110, 50, "CLEAR", () => {
            this.currentValue = "";
            this.cursorIndex = 0;
            this.updateDisplay();
        }, 0x757575);

        this.createKeyButton(startX + 220 + 2 * gapX, actionY, 100, 50, "OK", () => {
            if (this.onCommit) this.onCommit(this.currentValue);
            this.scene.stop();
        }, 0x388e3c);
    }

    drawAlphabetKeyboard() {
        if (this.alphabetButtons) {
            this.alphabetButtons.forEach(btn => btn.destroy());
        }
        this.alphabetButtons = [];

        const startY = this.keyboardStartY;
        
        let row1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
        let row2 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
        let row3 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
        let row4 = ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"];

        if (this.isShiftActive) {
            row2 = row2.map(c => c.toUpperCase());
            row3 = row3.map(c => c.toUpperCase());
            row4 = row4.map(c => c === "⇧" || c === "⌫" ? c : c.toUpperCase());
        }

        const keyWidth = 32;
        const keyHeight = 45;
        const gapX = 5;
        const gapY = 8;

        // Row 1: Numbers
        const startX1 = 18;
        row1.forEach((char, idx) => {
            const btn = this.createKeyButton(startX1 + idx * (keyWidth + gapX), startY, keyWidth, keyHeight, char, () => {
                this.currentValue = this.currentValue.slice(0, this.cursorIndex) + char + this.currentValue.slice(this.cursorIndex);
                this.cursorIndex++;
                this.updateDisplay();
            });
            this.alphabetButtons.push(btn);
        });

        // Row 2: Q-P
        const startY2 = startY + keyHeight + gapY;
        row2.forEach((char, idx) => {
            const btn = this.createKeyButton(startX1 + idx * (keyWidth + gapX), startY2, keyWidth, keyHeight, char, () => {
                this.currentValue = this.currentValue.slice(0, this.cursorIndex) + char + this.currentValue.slice(this.cursorIndex);
                this.cursorIndex++;
                this.updateDisplay();
            });
            this.alphabetButtons.push(btn);
        });

        // Row 3: A-L
        const startY3 = startY2 + keyHeight + gapY;
        const startX3 = 36;
        row3.forEach((char, idx) => {
            const btn = this.createKeyButton(startX3 + idx * (keyWidth + gapX), startY3, keyWidth, keyHeight, char, () => {
                this.currentValue = this.currentValue.slice(0, this.cursorIndex) + char + this.currentValue.slice(this.cursorIndex);
                this.cursorIndex++;
                this.updateDisplay();
            });
            this.alphabetButtons.push(btn);
        });

        // Row 4: Shift, Z-M, Backspace
        const startY4 = startY3 + keyHeight + gapY;
        row4.forEach((char, idx) => {
            const x = startX1 + idx * (keyWidth + gapX);
            let btn;
            if (char === "⌫") {
                btn = this.createKeyButton(x, startY4, 69, keyHeight, "⌫", () => {
                    if (this.cursorIndex > 0) {
                        this.currentValue = this.currentValue.slice(0, this.cursorIndex - 1) + this.currentValue.slice(this.cursorIndex);
                        this.cursorIndex--;
                        this.updateDisplay();
                    }
                });
            } else if (char === "⇧") {
                const shiftColor = this.isShiftActive ? 0x7c4dff : 0x2b2624;
                btn = this.createKeyButton(x, startY4, keyWidth, keyHeight, "⇧", () => {
                    this.isShiftActive = !this.isShiftActive;
                    this.drawAlphabetKeyboard();
                }, shiftColor);
            } else {
                btn = this.createKeyButton(x, startY4, keyWidth, keyHeight, char, () => {
                    this.currentValue = this.currentValue.slice(0, this.cursorIndex) + char + this.currentValue.slice(this.cursorIndex);
                    this.cursorIndex++;
                    this.updateDisplay();
                });
            }
            this.alphabetButtons.push(btn);
        });

        // Row 5: Action Row. CANCEL, ←, SPACE, →, OK
        const startY5 = startY4 + keyHeight + gapY;
        const startX5 = 20;
        
        const cancelBtn = this.createKeyButton(startX5, startY5, 70, keyHeight, "CANCEL", () => {
            if (this.onCancel) this.onCancel();
            this.scene.stop();
        }, 0xd32f2f);
        this.alphabetButtons.push(cancelBtn);

        const leftBtn = this.createKeyButton(startX5 + 70 + 10, startY5, 32, keyHeight, "←", () => {
            if (this.cursorIndex > 0) {
                this.cursorIndex--;
                this.updateDisplay();
            }
        });
        this.alphabetButtons.push(leftBtn);

        const spaceBtn = this.createKeyButton(startX5 + 70 + 10 + 32 + 10, startY5, 120, keyHeight, "SPACE", () => {
            this.currentValue = this.currentValue.slice(0, this.cursorIndex) + " " + this.currentValue.slice(this.cursorIndex);
            this.cursorIndex++;
            this.updateDisplay();
        });
        this.alphabetButtons.push(spaceBtn);

        const rightBtn = this.createKeyButton(startX5 + 70 + 10 + 32 + 10 + 120 + 10, startY5, 32, keyHeight, "→", () => {
            if (this.cursorIndex < this.currentValue.length) {
                this.cursorIndex++;
                this.updateDisplay();
            }
        });
        this.alphabetButtons.push(rightBtn);

        const okBtn = this.createKeyButton(startX5 + 70 + 10 + 32 + 10 + 120 + 10 + 32 + 10, startY5, 70, keyHeight, "OK", () => {
            if (this.onCommit) this.onCommit(this.currentValue);
            this.scene.stop();
        }, 0x388e3c);
        this.alphabetButtons.push(okBtn);
    }
}
