import { tg } from "./telegram.js";
import { state } from "../state.js";
const init = tg.initData;
const BASE_URL = window.location.origin + "/monsterworld/"
export function decodeResponse(base64Data) {

    const binaryString = atob(base64Data);

    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const decompressed = window.pako.inflate(bytes, { to: "string" });

    return JSON.parse(decompressed);
}
async function post(endpoint, options) {
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }
    const response = await fetch(BASE_URL + endpoint, options);
    if (response.ok) {
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch {
            json = decodeResponse(text);
        }
        return json;
    }

}

export async function loadUser() {
    console.log("User is loading...")

    let startParam = "";
    try {
        if (tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
            startParam = tg.initDataUnsafe.start_param;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            startParam = urlParams.get('tgWebAppStartParam') || "";
        }
    } catch (e) {
        console.error("Failed to parse start_param", e);
    }

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init,
            "StartParam": startParam
        }
    };
    const result = await post("user", options);

    if (result) {
        if (!result.isMaintenance) {
            state.user = result.user;
            state.isLoaded = true;
            console.log("User loaded");
        }
        return result;
    }
}

export async function getDepositAddress() {
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };
    const response = await fetch(BASE_URL + "deposit", options);
    if (response.ok) {
        return await response.json();
    }
}


export async function loadInventory(pageIndex) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { pageIndex }
    }
    const result = await post("inventory", options);
    if (result) {
        console.log("Inventory Loaded");
        return result;
    }
}


export async function Attack(BattleId, SkillId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { BattleId, SkillId }
    }

    const result = await post("battle/attack", options);
    if (result) {
        console.log("attack");
        return result;
    }
}

export async function EscapeBattle(battleId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { battleId }
    }

    const result = await post("battle/escape", options);
    if (result) {
        console.log("battle escaped");
        return result;
    }
}

export async function CatchMonster(battleId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { battleId }
    }
    const result = await post("monster/catch", options);
    if (result) {
        console.log("monster catch");
        return result;
    }

}

export async function spawnLocations(world) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { world }
    }

    const result = await post("world/spawn", options);

    if (result) {
        console.log("monster spawn");
        return result;
    }
}
export async function StartBattle(world, node, attackerId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { Map: world, node, attackerId }
    }
    const result = await post("battle/start", options);
    if (result) {
        console.log("battle started");
        return result;
    }
}

export async function GetBonus(index) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { index }
    }

    const result = await post("bonus/receive", options);
    if (result) {
        console.log("bonus received");
        return result;
    }
}

export async function GetMonsterInfo(monsterId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { monsterId }
    }
    const result = await post("monster/info", options);

    if (result) {
        console.log("monster info");
        return result;
    }
}

export async function GetItems() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    }
    const result = await post("items", options);

    if (result) {
        console.log("Items");
        return result;
    }
}

export async function GetExchangeTerms() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };

    const result = await post("exchange-terms", options);
    if (result) {
        console.log("exchange-terms");
        return result;
    }
}

export async function loadReferrals() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };

    const result = await post("referrals", options);
    if (result) {
        console.log("referrals loaded successfully", result);
        return result;
    }
}


export async function Leaderboard() {
    const options = {
        method: "GET",
        headers: {
            "InitData": init
        }
    }

    const result = await post("leaderboard", options);

    if (result) {
        console.log("leaderboard loaded");
        return result;
    }
}

export async function GetMissions() {
    const options = {
        method: "GET",
        headers: {
            "InitData": init
        }
    };
    const result = await post("missions", options);
    if (result) {
        console.log("missions loaded");
        return result;
    }
}

export async function VerifyMission(missionId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { MissionId: missionId }
    };
    const result = await post("mission/verify", options);
    if (result) {
        console.log("mission verified");
        return result;
    }
}

export async function OpenChest() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: {}
    };
    const result = await post("chest/open", options);
    if (result) {
        console.log("chest opened");
        return result;
    }
}

export async function UnlockWorld(worldId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { Map: worldId }
    };
    const result = await post("world/unlock/map", options);
    if (result) {
        console.log("world unlocked");
        return result;
    }
}

export async function UseItem(BattleId, Consumable) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { BattleId, Consumable, mode: "MonostaBle" }
    };
    const result = await post("use-consumable", options);
    if (result) {
        console.log("item used");
        return result;
    }
}

export async function LevelUpMonster(monsterId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { monsterId }
    };
    const result = await post("monster/level-up", options);
    if (result) {
        console.log("monster leveled up");
        return result;
    }
}

export async function HealMonsterWithGold(monsterId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { MonsterId: monsterId }
    };
    const result = await post("monster/heal-gold", options);
    if (result) {
        console.log("monster healed with gold");
        return result;
    }
}

export async function getAllUserMonsters() {
    const options = {
        method: "GET",
        headers: {
            "InitData": init
        }
    };
    const response = await fetch(BASE_URL + "user/monsters/all", options);
    if (response.ok) {
        return await response.json();
    }
}

export async function getMapInfo(mapName) {
    const options = {
        method: "GET",
        headers: {
            "InitData": init
        }
    };
    const response = await fetch(BASE_URL + "map/info/" + mapName, options);
    if (response.ok) {
        return await response.json();
    }
}

export async function claimStreak() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };
    const result = await post("user/claim-streak", options);
    if (result) {
        if (result.success) {
            state.user = result.User || result.user;
        }
        return result;
    }
}

export async function GetShop(section = "") {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { Section: section }
    };
    const result = await post("shop", options);
    if (result) {
        return result;
    }
}

export async function BuyItem(payload, currency = "GOLD") {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { Payload: payload, Currency: currency }
    };
    const result = await post("shop/buy", options);
    if (result) {
        return result;
    }
}

export async function BuyPack(packId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { PackId: packId }
    };
    const result = await post("shop/buy-pack", options);
    if (result) {
        return result;
    }
}

export async function Exchange(from, to, amount) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        },
        body: { From: from, To: to, Amount: amount }
    };
    const result = await post("exchange", options);
    if (result) {
        return result;
    }
}

export async function AcceptAgreement() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };
    const result = await post("user/accept-agreement", options);
    if (result) {
        return result;
    }
}


