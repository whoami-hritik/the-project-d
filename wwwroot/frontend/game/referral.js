import * as api from "../webapp/api.js";
import { tg } from "../webapp/telegram.js";
import { checkClick } from "./game.js";
import { showNotification } from "../utility.js";
import { t } from "../translations.js";

export class ReferralScene extends Phaser.Scene {
    constructor() {
        super({ key: "ReferralScene" });
    }

    create() {
        this.width = this.scale.width;
        this.height = this.scale.height;

        this.createOverlay();
        this.createDialog();
        this.loadReferralData();
    }

    createOverlay() {
        this.overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.6)
            .setOrigin(0)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive();
    }

    createDialog() {
        this.container = this.add.container(0, 0).setDepth(201);

        const modalW = 360;
        const modalH = 585;
        const modalX = 200;
        const modalY = 400;

        // 1. Shadow background panel
        const shadow = this.add.graphics();
        shadow.fillStyle(0x020617, 0.4);
        shadow.fillRoundedRect(modalX - modalW / 2 + 5, modalY - modalH / 2 + 5, modalW, modalH, 16);
        this.container.add(shadow);

        // 2. Main outer dialog card - Premium Bright Light Theme
        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50 (bright light interior)
        card.lineStyle(3.5, 0x0f172a, 1);  // Slate 900 outer outline (dark)
        card.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);
        card.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 16);

        // Inner frame line
        card.lineStyle(1.5, 0x94a3b8, 0.6); // Slate 400 inner border
        card.strokeRoundedRect(modalX - modalW / 2 + 4, modalY - modalH / 2 + 4, modalW - 8, modalH - 8, 12);
        this.container.add(card);

        // 3. Title Ribbon Banner
        const ribbonW = 220;
        const ribbonH = 38;
        const ribbonX = modalX;
        const ribbonY = modalY - modalH / 2;

        const ribbon = this.add.graphics();
        ribbon.fillStyle(0x064e3b, 0.95); // Dark Green 900
        ribbon.lineStyle(2, 0x10b981, 1); // Green 500 border
        ribbon.fillRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        ribbon.strokeRoundedRect(ribbonX - ribbonW / 2, ribbonY - 15, ribbonW, ribbonH, 8);
        this.container.add(ribbon);

        // Title text
        const titleText = this.add.text(ribbonX, ribbonY + 4, t("referrals_title"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "20px"
        }).setOrigin(0.5);
        const titleGrad = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        titleGrad.addColorStop(0, '#fbbf24'); // Amber 300
        titleGrad.addColorStop(1, '#f59e0b'); // Amber 500
        titleText.setFill(titleGrad);
        titleText.setStroke("#020617", 4.5);
        titleText.setShadow(1, 1, "#000000", 1, true, true);
        this.container.add(titleText);

        // 4. Close Button
        const closeBtn = this.add.image(modalX + modalW / 2 - 20, modalY - modalH / 2 + 20, "close-button")
            .setDisplaySize(24, 24)
            .setInteractive({ useHandCursor: true });
        this.container.add(closeBtn);

        closeBtn.on("pointerdown", () => {
            closeBtn.setScale(0.85);
        });
        closeBtn.on("pointerup", (pointer) => {
            closeBtn.setScale(1.0);
            if (!checkClick(pointer)) return;
            this.overlay.destroy();
            this.scene.stop("ReferralScene");
        });
        closeBtn.on("pointerout", () => {
            closeBtn.setScale(1.0);
        });

        // 5. Rewards Info Panel
        const rewardsBg = this.add.graphics();
        rewardsBg.fillStyle(0xf1f5f9, 0.9); // Slate 100
        rewardsBg.lineStyle(1.5, 0xcbd5e1, 0.8); // Slate 300 border
        rewardsBg.fillRoundedRect(35, 140, 330, 105, 12);
        rewardsBg.strokeRoundedRect(35, 140, 330, 105, 12);
        this.container.add(rewardsBg);

        const rewardsTitle = this.add.text(200, 155, t("referrals_header"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#0f172a" // Slate 900
        }).setOrigin(0.5);
        this.container.add(rewardsTitle);

        const rewardsDesc1 = this.add.text(50, 175, t("referrals_reward1"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#334155" // Slate 700
        });
        this.container.add(rewardsDesc1);

        const rewardsDesc1Sub = this.add.text(58, 192, t("referrals_reward1_rule"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#d97706" // Amber 600
        });
        this.container.add(rewardsDesc1Sub);

        const rewardsDesc2 = this.add.text(50, 212, t("referrals_reward2"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: "800",
            color: "#16a34a" // Green 600
        });
        this.container.add(rewardsDesc2);

        // 6. Stats Grid (Invited & Earned)
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0xf1f5f9, 0.9);
        statsBg.lineStyle(1.5, 0xcbd5e1, 0.8);
        statsBg.fillRoundedRect(35, 255, 155, 75, 12);
        statsBg.strokeRoundedRect(35, 255, 155, 75, 12);
        statsBg.fillRoundedRect(210, 255, 155, 75, 12);
        statsBg.strokeRoundedRect(210, 255, 155, 75, 12);
        this.container.add(statsBg);

        this.invitedTitle = this.add.text(112.5, 270, t("total_invited"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#475569"
        }).setOrigin(0.5);
        this.container.add(this.invitedTitle);

        this.invitedCount = this.add.text(112.5, 298, "0", {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "26px",
            color: "#0f172a"
        }).setOrigin(0.5);
        this.container.add(this.invitedCount);

        this.earnedTitle = this.add.text(287.5, 270, t("total_earned"), {
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#475569"
        }).setOrigin(0.5);
        this.container.add(this.earnedTitle);

        this.earnedCount = this.add.text(287.5, 298, `0 ${t("gold_unit")}\n0 ${t("balls_unit")}`, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ca8a04",
            align: "center"
        }).setOrigin(0.5);
        this.container.add(this.earnedCount);

        // 7. Referral Link Section
        const linkBg = this.add.graphics();
        linkBg.fillStyle(0xe2e8f0, 0.9);
        linkBg.lineStyle(1.5, 0xcbd5e1, 0.8);
        linkBg.fillRoundedRect(35, 340, 330, 40, 8);
        linkBg.strokeRoundedRect(35, 340, 330, 40, 8);
        this.container.add(linkBg);

        this.referralLinkText = this.add.text(45, 352, t("generating_link"), {
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#475569"
        });
        this.container.add(this.referralLinkText);

        // Buttons: Copy & Share
        this.btnCopy = this.createButton(112.5, 405, 155, 35, t("copy_link"), 0x3b82f6, () => {
            this.copyLinkToClipboard();
        });
        this.btnShare = this.createButton(287.5, 405, 155, 35, t("share_link"), 0x10b981, () => {
            this.shareLinkTelegram();
        });

        // 8. Referred Friends Section Header
        const friendsHeader = this.add.text(40, 445, t("referred_friends"), {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#475569"
        });
        this.container.add(friendsHeader);

        // Scrollable List container & mask
        this.listContainer = this.add.container(0, 0);
        this.container.add(this.listContainer);

        const maskGraphics = this.make.graphics({ add: false });
        maskGraphics.fillRect(35, 470, 330, 110);
        const mask = maskGraphics.createGeometryMask();
        this.listContainer.setMask(mask);

        // Enable scroll wheel
        this.enableListScrolling();
    }

    createButton(x, y, w, h, text, color, onClick) {
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 1);
        btnBg.fillRoundedRect(x - w/2, y - h/2, w, h, 8);
        
        // Gloss layer
        btnBg.fillStyle(0xffffff, 0.15);
        btnBg.fillRoundedRect(x - w/2, y - h/2, w, h/2, 8);
        
        // Stroke
        btnBg.lineStyle(1.5, 0x0f172a, 1);
        btnBg.strokeRoundedRect(x - w/2, y - h/2, w, h, 8);
        this.container.add(btnBg);

        const btnText = this.add.text(x, y, text, {
            fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0.5);
        btnText.setStroke("#0f172a", 3);
        this.container.add(btnText);

        // Interaction zone
        const zone = this.add.zone(x, y, w, h)
            .setInteractive({ useHandCursor: true });
        this.container.add(zone);

        zone.on("pointerdown", () => {
            btnText.setScale(0.92);
        });

        zone.on("pointerup", (pointer) => {
            btnText.setScale(1.0);
            if (!checkClick(pointer)) return;
            onClick();
        });

        zone.on("pointerout", () => {
            btnText.setScale(1.0);
        });

        return { bg: btnBg, text: btnText, zone: zone };
    }

    async loadReferralData() {
        this.createloadingOverlay();
        try {
            const result = await api.loadReferrals();
            if (result && result.success) {
                // Update stats
                this.invitedCount.setText(result.totalReferrals);
                this.earnedCount.setText(`${result.totalEarnedGold} ${t("gold_unit")}\n${result.totalEarnedBalls || 0} ${t("balls_unit")}`);
                
                // Update Link
                this.referralLink = result.referralLink;
                // Clamp link text for UI display
                let dispLink = result.referralLink;
                if (dispLink.length > 38) {
                    dispLink = dispLink.substring(0, 35) + "...";
                }
                this.referralLinkText.setText(dispLink).setColor("#475569");

                // Populate referred list
                this.populateFriendsList(result.referrals);
            } else {
                this.referralLinkText.setText(t("failed_to_load_link")).setColor("#ef4444");
                showNotification(this, result.reason);
            }
        } catch (error) {
            console.error("Failed to load referral data:", error);
            this.referralLinkText.setText(t("error_loading_link")).setColor("#ef4444");
        } finally {
            this.destroyloadingOverlay();
        }
    }

    populateFriendsList(friends) {
        this.listContainer.removeAll(true);
        this.listHeight = 0;

        if (!friends || friends.length === 0) {
            const noFriendsText = this.add.text(200, 520, t("no_friends_yet"), {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "13px",
                color: "#94a3b8",
                align: "center"
            }).setOrigin(0.5);
            this.listContainer.add(noFriendsText);
            return;
        }

        const itemHeight = 55;
        friends.forEach((friend, index) => {
            const yPos = 475 + index * itemHeight;

            // Friend entry background
            const entryBg = this.add.graphics();
            entryBg.fillStyle(0xf1f5f9, 0.85);
            entryBg.lineStyle(1.5, 0xe2e8f0, 1);
            entryBg.fillRoundedRect(35, yPos, 330, 48, 8);
            entryBg.strokeRoundedRect(35, yPos, 330, 48, 8);
            this.listContainer.add(entryBg);

            // Display name
            let name = friend.firstName || t("anonymous");
            if (friend.lastName) name += " " + friend.lastName;
            if (friend.username) name = `@${friend.username} (${name})`;
            
            if (name.length > 25) {
                name = name.substring(0, 22) + "...";
            }

            const nameText = this.add.text(45, yPos + 8, name, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "13px",
                color: "#0f172a"
            });
            this.listContainer.add(nameText);

            // Level & Date
            const dateStr = new Date(friend.registrationDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
            const detailsText = this.add.text(45, yPos + 26, t("referred_friend_details", { level: friend.level, date: dateStr }), {
                fontFamily: "Nunito, sans-serif",
                fontSize: "10px",
                fontWeight: "700",
                color: "#475569"
            });
            this.listContainer.add(detailsText);

            // Status or reward
            const isValid = friend.level >= 2;
            const statusLabelColor = isValid ? "#16a34a" : "#ca8a04";
            const statusTextStr = isValid ? t("reward_referred_friend") : t("pending");

            const rewardLabel = this.add.text(355, yPos + 24, statusTextStr, {
                fontFamily: "Lilita One, Coiny, Nunito, sans-serif",
                fontSize: "11px",
                color: statusLabelColor
            }).setOrigin(1, 0.5);
            rewardLabel.setStroke("#ffffff", 2);
            this.listContainer.add(rewardLabel);

            this.listHeight = (index + 1) * itemHeight;
        });
    }

    enableListScrolling() {
        this.viewHeight = 110;
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (this.listHeight <= this.viewHeight) return;

            this.listContainer.y -= deltaY * 0.4;
            const minY = -(this.listHeight - this.viewHeight);
            this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, minY, 0);
        });
    }

    copyLinkToClipboard() {
        if (!this.referralLink) return;

        navigator.clipboard.writeText(this.referralLink).then(() => {
            showNotification(this, t("link_copied"));
        }).catch(err => {
            console.error("Failed to copy:", err);
            if (tg) {
                tg.showPopup({
                    title: "Referral Link",
                    message: this.referralLink,
                    buttons: [{ type: "ok" }]
                });
            }
        });
    }

    shareLinkTelegram() {
        if (!this.referralLink) return;

        const shareText = encodeURIComponent("Join me in Monster World! 🚀 Capture monsters, battle, and win rewards! Use my link to get starter bonuses.");
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.referralLink)}&text=${shareText}`;

        if (tg) {
            tg.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, "_blank");
        }
    }

    createloadingOverlay() {
        this.loadOverlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.4)
            .setOrigin(0)
            .setDepth(210)
            .setScrollFactor(0)
            .setInteractive();

        this.buffer = this.add.image(this.width / 2, this.height / 2, "loading_buffer");
        this.buffer.setScale(0.05).setDepth(211);

        this.buffering = this.tweens.add({
            targets: this.buffer,
            angle: 360,
            duration: 1000,
            repeat: -1
        });
    }

    destroyloadingOverlay() {
        if (this.loadOverlay) this.loadOverlay.destroy();
        if (this.buffer) this.buffer.destroy();
        if (this.buffering) this.buffering.stop();
    }
}
