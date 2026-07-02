import * as api from "../webapp/api.js";
import { state } from "../state.js";
import { checkClick } from "./game.js";
import { showNotification, createloadingOverlay, destroyloadingOverlay } from "../utility.js";
import { t } from "../translations.js";
import { getWalletAddress, initTonConnect } from "../webapp/tonconnect.js";

export class WithdrawalScene extends Phaser.Scene {
    constructor() {
        super({ key: "WithdrawalScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.USER = state.user || {};
        this.amountVal = "";
        this.walletAddressVal = "";

        const ui = initTonConnect();
        if (ui) {
            this.unsubscribeTon = ui.onStatusChange((wallet) => {
                if (this.scene.isActive("WithdrawalScene")) {
                    this.scene.restart();
                }
            });
        }

        this.events.once("shutdown", () => {
            if (this.unsubscribeTon) {
                this.unsubscribeTon();
                this.unsubscribeTon = null;
            }
        });

        // 1. Full Screen Overlay to dim background
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.65)
            .setOrigin(0)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive();

        // 2. Dialog Container
        this.container = this.add.container(0, 0).setDepth(201);

        const modalW = 350;
        const modalH = 460;
        const modalX = this.width / 2;
        const modalY = this.height / 2;
        const cardTop = modalY - modalH / 2;

        // Shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, cardTop + 5, modalW, modalH, 18);
        this.container.add(shadow);

        // Main outer dialog card - Premium Bright Light Theme matching ProfileScene
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outline
        card.fillRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);
        card.strokeRoundedRect(modalX - modalW / 2, cardTop, modalW, modalH, 18);

        // Inner border line
        card.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, cardTop + 4, modalW - 8, modalH - 8, 14);
        this.container.add(card);

        // Ribbon Banner for Title
        const ribbonW = 220;
        const ribbonH = 40;
        const ribbonX = modalX;
        const ribbonY = cardTop + 15;

        const ribbon = this.add.graphics();
        ribbon.fillStyle(0x0f172a, 0.95);
        ribbon.lineStyle(2, 0xf59e0b, 1); // Amber 500 border
        ribbon.fillRoundedRect(ribbonX - ribbonW / 2, ribbonY, ribbonW, ribbonH, 8);
        ribbon.strokeRoundedRect(ribbonX - ribbonW / 2, ribbonY, ribbonW, ribbonH, 8);
        this.container.add(ribbon);

        // Title text
        const titleText = this.add.text(ribbonX, ribbonY + ribbonH / 2, "WITHDRAW TON", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "18px"
        }).setOrigin(0.5);
        const titleGrad = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        titleGrad.addColorStop(0, '#fbbf24');
        titleGrad.addColorStop(1, '#f59e0b');
        titleText.setFill(titleGrad);
        titleText.setStroke("#020617", 4.5);
        titleText.setShadow(1, 1, "#000000", 1, true, true);
        this.container.add(titleText);

        // Close button
        const closeBtn = this.add.image(modalX + modalW / 2 - 25, ribbonY + ribbonH / 2, "close-button")
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);

        closeBtn.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.stop("WithdrawalScene");
        });

        // 3. Balance Display Block
        const balY = cardTop + 75;
        const balW = 300;
        const balH = 48;
        const balX = modalX - balW / 2;

        const balBoxBg = this.add.graphics();
        balBoxBg.fillStyle(0x0f172a, 0.05); // Very light slate fill
        balBoxBg.lineStyle(1.5, 0xe2e8f0, 1); // Border
        balBoxBg.fillRoundedRect(balX, balY, balW, balH, 12);
        balBoxBg.strokeRoundedRect(balX, balY, balW, balH, 12);
        this.container.add(balBoxBg);

        const balLabel = this.add.text(balX + 16, balY + balH / 2, "Available Balance", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            color: "#64748b",
            fontWeight: "bold"
        }).setOrigin(0, 0.5);
        this.container.add(balLabel);

        const balanceValue = this.USER.ton || 0;
        const balValueText = this.add.text(balX + balW - 16, balY + balH / 2, `${balanceValue.toFixed(4)} TON`, {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "18px",
            color: "#3b82f6"
        }).setOrigin(1, 0.5);
        this.container.add(balValueText);

        // 4. Amount Input Section
        const amtY = cardTop + 140;
        const amtLabelText = this.add.text(balX, amtY, "WITHDRAW AMOUNT", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            color: "#94a3b8",
            fontWeight: "900"
        });
        this.container.add(amtLabelText);

        const inputW = 300;
        const inputH = 46;
        const inputX = modalX - inputW / 2;
        const amtInputY = amtY + 18;

        const amtBox = this.add.graphics();
        amtBox.fillStyle(0x0f172a, 0.9); // Dark slate input field
        amtBox.lineStyle(1.5, 0x334155, 1);
        amtBox.fillRoundedRect(inputX, amtInputY, inputW, inputH, 10);
        amtBox.strokeRoundedRect(inputX, amtInputY, inputW, inputH, 10);
        this.container.add(amtBox);

        this.amountText = this.add.text(inputX + 14, amtInputY + inputH / 2, "0.00", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "16px",
            color: "#888888"
        }).setOrigin(0, 0.5);
        this.container.add(this.amountText);

        // MAX Button inside Amount Input
        const maxBtn = this.add.container(inputX + inputW - 48, amtInputY + inputH / 2);
        const maxBg = this.add.graphics();
        maxBg.fillStyle(0x3b82f6, 0.2);
        maxBg.lineStyle(1, 0x3b82f6, 0.4);
        maxBg.fillRoundedRect(-24, -12, 48, 24, 6);
        maxBg.strokeRoundedRect(-24, -12, 48, 24, 6);
        maxBtn.add(maxBg);

        const maxTxt = this.add.text(0, 0, "MAX", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "11px",
            color: "#60a5fa"
        }).setOrigin(0.5);
        maxBtn.add(maxTxt);

        const maxHit = this.add.rectangle(-24, -12, 48, 24, 0x000000, 0).setOrigin(0)
            .setInteractive({ useHandCursor: true });
        maxBtn.add(maxHit);
        this.container.add(maxBtn);

        maxHit.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.amountVal = balanceValue.toString();
            this.amountText.setText(this.amountVal);
            this.amountText.setColor("#ffffff");
            this.updateFeeDisplay();
        });

        // Click zone for Amount Keyboard
        const amtHitZone = this.add.rectangle(inputX, amtInputY, inputW - 60, inputH, 0x000000, 0).setOrigin(0)
            .setInteractive({ useHandCursor: true });
        this.container.add(amtHitZone);

        amtHitZone.on("pointerup", (pointer) => {
            if (!checkClick(pointer)) return;
            this.scene.launch("KeyboardScene", {
                type: "numeric",
                value: this.amountVal,
                placeholder: "0.00",
                onCommit: (val) => {
                    this.amountVal = val;
                    this.amountText.setText(val || "0.00");
                    this.amountText.setColor(val ? "#ffffff" : "#888888");
                    this.updateFeeDisplay();
                }
            });
        });

        // 4.5 Fee Subtext Display
        const feeSubtextY = amtInputY + inputH + 5;
        this.feeSubtext = this.add.text(modalX, feeSubtextY, "", {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            color: "#64748b",
            align: "center"
        }).setOrigin(0.5, 0);
        this.container.add(this.feeSubtext);
        this.updateFeeDisplay();

        // Fetch connected wallet address from TonConnect
        const connectedAddress = getWalletAddress();
        if (connectedAddress) {
            this.walletAddressVal = connectedAddress;
        } else {
            this.walletAddressVal = "";
        }

        if (this.walletAddressVal) {
            // 5. Wallet Address Section
            const walletY = cardTop + 225;
            const walletLabelText = this.add.text(balX, walletY, "TON WALLET ADDRESS", {
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: "900"
            });
            this.container.add(walletLabelText);

            const walletInputY = walletY + 18;

            const walletBox = this.add.graphics();
            walletBox.fillStyle(0x0f172a, 0.9);
            walletBox.lineStyle(1.5, 0x334155, 1);
            walletBox.fillRoundedRect(inputX, walletInputY, inputW, inputH, 10);
            walletBox.strokeRoundedRect(inputX, walletInputY, inputW, inputH, 10);
            this.container.add(walletBox);

            const displayVal = this.walletAddressVal.length > 22 
                ? this.walletAddressVal.substring(0, 10) + "..." + this.walletAddressVal.substring(this.walletAddressVal.length - 10) 
                : this.walletAddressVal;
            
            this.walletText = this.add.text(inputX + 14, walletInputY + inputH / 2, displayVal, {
                fontFamily: "Nunito, sans-serif",
                fontSize: "14px",
                color: "#ffffff"
            }).setOrigin(0, 0.5);
            this.container.add(this.walletText);

            // Small tip subtext below the input box
            const walletTipY = walletInputY + inputH + 6;
            const walletTip = this.add.text(modalX, walletTipY, "Connected wallet address. Reconnect wallet in Profile to change.", {
                fontFamily: "Nunito, sans-serif",
                fontSize: "10px",
                color: "#64748b",
                align: "center"
            }).setOrigin(0.5, 0);
            this.container.add(walletTip);

            // 6. Disclaimer Text
            const descY = cardTop + 315;
            const disclaimer = this.add.text(modalX, descY, "Escrow requests are reviewed manually by game admins.\nWithdrawals will be sent to your connected wallet.", {
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                color: "#94a3b8",
                align: "center",
                lineHeight: 1.3
            }).setOrigin(0.5, 0);
            this.container.add(disclaimer);

            // 7. Submit Button Section (Active)
            const btnY = cardTop + 395;
            const submitBtn = this.add.container(modalX, btnY);

            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x10b981, 1);
            btnBg.lineStyle(2, 0x047857, 1);
            btnBg.fillRoundedRect(-110, -20, 220, 40, 10);
            btnBg.strokeRoundedRect(-110, -20, 220, 40, 10);
            submitBtn.add(btnBg);

            const submitTxt = this.add.text(0, 0, "SUBMIT REQUEST", {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "16px",
                color: "#ffffff"
            }).setOrigin(0.5);
            submitTxt.setStroke("#065f46", 3.5);
            submitBtn.add(submitTxt);

            const submitHit = this.add.rectangle(-110, -20, 220, 40, 0x000000, 0).setOrigin(0)
                .setInteractive({ useHandCursor: true });
            submitBtn.add(submitHit);
            this.container.add(submitBtn);

            submitHit.on("pointerover", () => this.tweens.add({ targets: submitBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
            submitHit.on("pointerout", () => this.tweens.add({ targets: submitBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
            submitHit.on("pointerdown", () => this.tweens.add({ targets: submitBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
            submitHit.on("pointerup", async (pointer) => {
                this.tweens.add({ targets: submitBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
                if (!checkClick(pointer)) return;

                const amount = parseFloat(this.amountVal);
                const address = this.walletAddressVal.trim();

                if (isNaN(amount) || amount <= 0) {
                    showNotification(this, "Please enter a valid amount greater than 0.");
                    return;
                }

                const gameplay = this.cache.json.get("gameplay_data");
                const withdrawalFee = (gameplay && gameplay.withdrawalFee) ? gameplay.withdrawalFee : { percentage: 0.05, minFee: 0.1, maxFee: 1.0, minWithdrawalAmount: 1.0 };
                
                const minWithdrawalAmt = withdrawalFee.minWithdrawalAmount !== undefined ? withdrawalFee.minWithdrawalAmount : 1.0;
                if (amount < minWithdrawalAmt) {
                    showNotification(this, `Minimum withdrawal amount is ${minWithdrawalAmt} TON.`);
                    return;
                }

                const feePercentage = withdrawalFee.percentage !== undefined ? withdrawalFee.percentage : 0.05;
                const minFee = withdrawalFee.minFee !== undefined ? withdrawalFee.minFee : 0.1;
                const maxFee = withdrawalFee.maxFee !== undefined ? withdrawalFee.maxFee : 1.0;

                const fee = Math.max(minFee, Math.min(amount * feePercentage, maxFee));
                const netAmount = amount - fee;

                if (netAmount <= 0) {
                    showNotification(this, `Amount is too small to cover the withdrawal fee of ${fee.toFixed(4)} TON.`);
                    return;
                }

                if (amount > balanceValue) {
                    showNotification(this, `Insufficient balance. You only have ${balanceValue.toFixed(4)} TON.`);
                    return;
                }

                createloadingOverlay(this);

                try {
                    const res = await api.submitWithdrawalRequest(amount, "TON", address);
                    destroyloadingOverlay(this);

                    if (res && res.success) {
                        showNotification(this, "Withdrawal request submitted successfully!");
                        if (res.Balance) {
                            state.user.ton = res.Balance.TON;
                            state.user.gold = res.Balance.GOLD;
                            state.user.eggs = res.Balance.EGGS;
                            state.user.crystal = res.Balance.CRYSTAL;
                        }

                        // Refresh ProfileScene behind us
                        const profileScene = this.scene.get("ProfileScene");
                        if (profileScene && profileScene.sys.isActive()) {
                            profileScene.scene.restart();
                        }

                        this.scene.stop("WithdrawalScene");
                    } else {
                        showNotification(this, res?.reason || "Failed to submit request.");
                    }
                } catch (err) {
                    destroyloadingOverlay(this);
                    console.error("Error submitting withdrawal request:", err);
                    showNotification(this, "An unexpected error occurred.");
                }
            });
        } else {
            // Not connected: show the beautiful CONNECT WALLET button
            const connectBtnY = cardTop + 245;
            const connectBtn = this.add.container(modalX, connectBtnY);

            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x0088cc, 1); // TON Blue
            btnBg.lineStyle(2, 0x005580, 1); // Dark blue outline
            btnBg.fillRoundedRect(-120, -22, 240, 44, 10);
            btnBg.strokeRoundedRect(-120, -22, 240, 44, 10);
            connectBtn.add(btnBg);

            const btnText = this.add.text(0, 0, "CONNECT TON WALLET", {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "15px",
                color: "#ffffff"
            }).setOrigin(0.5);
            btnText.setStroke("#004466", 3);
            connectBtn.add(btnText);

            const connectHit = this.add.rectangle(-120, -22, 240, 44, 0x000000, 0).setOrigin(0)
                .setInteractive({ useHandCursor: true });
            connectBtn.add(connectHit);
            this.container.add(connectBtn);

            // Connect button animation
            connectHit.on("pointerover", () => this.tweens.add({ targets: connectBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
            connectHit.on("pointerout", () => this.tweens.add({ targets: connectBtn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
            connectHit.on("pointerdown", () => this.tweens.add({ targets: connectBtn, scaleX: 0.95, scaleY: 0.95, duration: 50 }));
            connectHit.on("pointerup", async (pointer) => {
                this.tweens.add({ targets: connectBtn, scaleX: 1.0, scaleY: 1.0, duration: 50 });
                if (!checkClick(pointer)) return;
                try {
                    const ui = initTonConnect();
                    if (ui) {
                        await ui.openModal();
                    } else {
                        showNotification(this, "TON Connect unavailable.");
                    }
                } catch (err) {
                    console.error("Failed to connect wallet:", err);
                    showNotification(this, "Failed to connect wallet.");
                }
            });

            // 6. Connect wallet instruction text below the button
            const instructY = connectBtnY + 40;
            const instruction = this.add.text(modalX, instructY, "You must connect your TON wallet to request a withdrawal.", {
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                color: "#ef4444",
                align: "center",
                fontWeight: "700"
            }).setOrigin(0.5, 0);
            this.container.add(instruction);

            // 7. Greyed-out/Disabled Submit Button
            const btnY = cardTop + 395;
            const disabledBtn = this.add.container(modalX, btnY);

            const dBtnBg = this.add.graphics();
            dBtnBg.fillStyle(0x334155, 1); // slate gray
            dBtnBg.lineStyle(2, 0x1e293b, 1);
            dBtnBg.fillRoundedRect(-110, -20, 220, 40, 10);
            dBtnBg.strokeRoundedRect(-110, -20, 220, 40, 10);
            disabledBtn.add(dBtnBg);

            const dTxt = this.add.text(0, 0, "WALLET NOT CONNECTED", {
                fontFamily: "Lilita One, Coiny, sans-serif",
                fontSize: "14px",
                color: "#94a3b8"
            }).setOrigin(0.5);
            disabledBtn.add(dTxt);
            this.container.add(disabledBtn);
        }
    }

    updateFeeDisplay() {
        if (!this.feeSubtext) return;
        const gameplay = this.cache.json.get("gameplay_data");
        const withdrawalFee = (gameplay && gameplay.withdrawalFee) ? gameplay.withdrawalFee : { percentage: 0.05, minFee: 0.1, maxFee: 1.0, minWithdrawalAmount: 1.0 };
        const amount = parseFloat(this.amountVal) || 0;
        if (amount > 0) {
            const feePercentage = withdrawalFee.percentage !== undefined ? withdrawalFee.percentage : 0.05;
            const minFee = withdrawalFee.minFee !== undefined ? withdrawalFee.minFee : 0.1;
            const maxFee = withdrawalFee.maxFee !== undefined ? withdrawalFee.maxFee : 1.0;
            
            const fee = Math.max(minFee, Math.min(amount * feePercentage, maxFee));
            const netAmount = Math.max(0, amount - fee);
            this.feeSubtext.setText(`Fee: ${fee.toFixed(4)} TON | Net Payout: ${netAmount.toFixed(4)} TON`);
            this.feeSubtext.setColor("#3b82f6");
        } else {
            const percentDisplay = ((withdrawalFee.percentage || 0.05) * 100).toFixed(0);
            this.feeSubtext.setText(`Min Fee: ${withdrawalFee.minFee || 0.1} TON | Fee: ${percentDisplay}% (max ${withdrawalFee.maxFee || 1.0} TON)`);
            this.feeSubtext.setColor("#64748b");
        }
    }
}
