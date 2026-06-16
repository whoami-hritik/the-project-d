import { state } from "../state.js";

const translations = {
    "Invalid user context": {
        en: "Invalid user context.",
        ru: "Неверный контекст пользователя."
    },
    "world already unlocked": {
        en: "World is already unlocked.",
        ru: "Мир уже разблокирован."
    },
    "invalid map id": {
        en: "Invalid map ID.",
        ru: "Неверный ID карты."
    },
    "insufficient balance": {
        en: "Insufficient balance.",
        ru: "Недостаточный баланс."
    },
    "bonus already received": {
        en: "Bonus already received.",
        ru: "Бонус уже получен."
    },
    "world locked": {
        en: "World is locked.",
        ru: "Мир заблокирован."
    },
    "Map locked": {
        en: "Map is locked.",
        ru: "Карта заблокирована."
    },
    "no such monster found": {
        en: "No such monster found.",
        ru: "Такой монстр не найден."
    },
    "monster location became older": {
        en: "Monster location is outdated.",
        ru: "Местоположение монстра устарело."
    },
    "not an active location": {
        en: "Not an active location.",
        ru: "Неактивная локация."
    },
    "invalid monster hash or not owner": {
        en: "Invalid monster hash or you are not the owner.",
        ru: "Неверный хэш монстра или вы не являетесь владельцем."
    },
    "monster already in battle": {
        en: "Monster is already in battle.",
        ru: "Монстр уже в бою."
    },
    "daily boss battles are not scheduled yet": {
        en: "Daily boss battles are not scheduled yet.",
        ru: "Ежедневные битвы с боссами еще не запланированы."
    },
    "no boss scheduled for this map": {
        en: "No boss is scheduled for this map.",
        ru: "Для этой карты босс не запланирован."
    },
    "daily boss battle has ended, come tomorrow": {
        en: "Daily boss battle has ended. Please come back tomorrow.",
        ru: "Ежедневная битва с боссом завершена. Приходите завтра."
    },
    "you already fought this area boss, try another map bosses": {
        en: "You already fought this area boss. Try other map bosses.",
        ru: "Вы уже сражались с боссом этой зоны. Попробуйте боссов других карт."
    },
    "battle not found": {
        en: "Battle not found.",
        ru: "Битва не найдена."
    },
    "invalid battle data": {
        en: "Invalid battle data.",
        ru: "Неверные данные битвы."
    },
    "battle already ended": {
        en: "Battle has already ended.",
        ru: "Битва уже завершена."
    },
    "battle is forfeited": {
        en: "Battle is forfeited.",
        ru: "Битва аннулирована."
    },
    "invalid consumable_id": {
        en: "Invalid consumable item ID.",
        ru: "Неверный ID расходуемого предмета."
    },
    "unknown skill": {
        en: "Unknown skill.",
        ru: "Неизвестный навык."
    },
    "skill cooldown": {
        en: "Skill is on cooldown.",
        ru: "Навык на перезарядке."
    },
    "no sufficient energy to use the skill": {
        en: "Not enough energy to use this skill.",
        ru: "Недостаточно энергии для использования навыка."
    },
    "not enough monsta ball": {
        en: "Not enough Monsta Balls.",
        ru: "Недостаточно Монстаболов."
    },
    "catch odds unavailable": {
        en: "Catch odds are unavailable.",
        ru: "Шансы на поимку недоступны."
    },
    "Mission already completed": {
        en: "Mission already completed.",
        ru: "Миссия уже выполнена."
    },
    "Mission not found or inactive": {
        en: "Mission not found or inactive.",
        ru: "Миссия не найдена или неактивна."
    },
    "Invalid MissionId format": {
        en: "Invalid Mission ID format.",
        ru: "Неверный формат ID миссии."
    },
    "Unauthorized. Admin role is required.": {
        en: "Unauthorized. Admin role is required.",
        ru: "Неавторизовано. Требуется роль администратора."
    },
    "Leaderboard configuration is missing.": {
        en: "Leaderboard configuration is missing.",
        ru: "Конфигурация таблицы лидеров отсутствует."
    }
};

export function getLocalizedMessage(reason, langCode) {
    const lang = langCode === "ru" ? "ru" : "en";

    if (!reason) {
        return lang === "ru" ? "Произошла неизвестная ошибка." : "An unknown error occurred.";
    }

    // Direct translation lookup
    if (translations[reason]) {
        return translations[reason][lang];
    }

    // Dynamic checks
    const lowerReason = reason.toLowerCase();
    
    // reach level {map.UnlockAt} to Unlock the map
    if (lowerReason.includes("reach level") && lowerReason.includes("unlock")) {
        const match = reason.match(/\d+/);
        const lvl = match ? match[0] : "";
        if (lang === "ru") {
            return `Достигните уровня ${lvl}, чтобы разблокировать карту.`;
        }
        return `Reach level ${lvl} to unlock this map.`;
    }

    // daily boss battle will be available after ...
    if (lowerReason.includes("daily boss battle will be available after")) {
        const timePart = reason.substring(reason.indexOf("after") + 5).trim();
        if (lang === "ru") {
            return `Ежедневная битва с боссом будет доступна после ${timePart}.`;
        }
        return `Daily boss battle will be available after ${timePart}.`;
    }

    // Leaderboard period has not ended yet. End date: ...
    if (lowerReason.includes("leaderboard period has not ended")) {
        const datePart = reason.substring(reason.indexOf("date:") + 5).trim();
        if (lang === "ru") {
            return `Период таблицы лидеров еще не закончился. Дата окончания: ${datePart}.`;
        }
        return `Leaderboard period has not ended yet. End date: ${datePart}.`;
    }

    // Default fallback
    return reason;
}

export class NotificationScene extends Phaser.Scene {
    constructor() {
        super({ key: "NotificationScene" });
    }

    init(data) {
        this.message = data.message || "";
        console.log("Notification Scene");
    }

    create() {
        const width = this.scale.width;
        const bannerWidth = width - 40; // Spans 360px on a 400px screen
        const bannerHeight = 75;
        const startX = 20;
        const startY = -120; // Off-screen at top
        const endY = 40; // Target position just below the status bar

        // Create container to animate elements together
        const container = this.add.container(0, 0).setDepth(1000);

        // Dark glassmorphic background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x1e1d24, 0.95);
        bg.lineStyle(2, 0xffa500, 1); // Premium glowing amber/gold border
        bg.fillRoundedRect(startX, 0, bannerWidth, bannerHeight, 15);
        bg.strokeRoundedRect(startX, 0, bannerWidth, bannerHeight, 15);
        container.add(bg);

        // Circular exclamation/warning icon block
        const iconCircle = this.add.graphics();
        iconCircle.fillStyle(0xffa500, 0.2);
        iconCircle.lineStyle(2, 0xffa500, 1);
        iconCircle.fillCircle(startX + 35, 37.5, 20);
        iconCircle.strokeCircle(startX + 35, 37.5, 20);
        container.add(iconCircle);

        const iconText = this.add.text(startX + 35, 37.5, "!", {
            fontFamily: "Lilita One, Coiny, Arial, sans-serif",
            fontSize: "24px",
            color: "#ffa500"
        }).setOrigin(0.5);
        container.add(iconText);

        // Text message container with auto-wrapping
        const textX = startX + 70;
        const textWidth = bannerWidth - 90;
        const text = this.add.text(textX, 37.5, this.message, {
            fontFamily: "Lilita One, Nunito, Arial, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
            align: "left",
            wordWrap: { width: textWidth, useAdvancedWrap: true }
        }).setOrigin(0, 0.5);
        text.setStroke("#1e1d24", 3.5);
        container.add(text);

        // Position container off-screen initially
        container.y = startY;

        // Slide down animation
        this.tweens.add({
            targets: container,
            y: endY,
            duration: 450,
            ease: "Back.easeOut",
            onComplete: () => {
                // Keep notification visible for 3.5 seconds
                this.time.delayedCall(3500, () => {
                    this.tweens.add({
                        targets: container,
                        y: startY,
                        alpha: 0,
                        duration: 350,
                        ease: "Power2.easeIn",
                        onComplete: () => {
                            this.scene.stop();
                        }
                    });
                });
            }
        });
    }
}
