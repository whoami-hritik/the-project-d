import { tg } from "./telegram.js";
import { state } from "../state.js";
const init = tg.initData;
const BASE_URL = "https://monsterworld.qzz.io/monsterworld/"
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
async function post(endpoint, options){
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }
    const response = await fetch(BASE_URL+endpoint, options);
    if (response.ok){
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

    const options = {
        method: "POST", 
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };
    const result = await post("user", options);

    if (result){
        state.user = result.user;
        state.isLoaded = true;

        console.log("User loaded");
    }
}

    
export async function loadInventory(pageIndex) {
    const options = {
        method : "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData": init
        },
        body: { pageIndex }
    }
    const result = await post("inventory", options);
    if(result){
        console.log("Inventory Loaded");
        return result;
    }
}  

                                       
export async function  Attack(BattleId, SkillId) {
    const options = {
        method : "POST",
        headers : {
            "Content-Type":"application/json",
            "InitData": init
        },
        body : { BattleId, SkillId }
    }

    const result = await post("battle/attack", options);
    if (result){
        console.log("attack");
        return result;
    }
}

export async function EscapeBattle(battleId) {
    const options = {
        method : "POST",
        headers : {
            "Content-Type":"application/json",
            "InitData":init
        },
        body : { battleId }
    }

    const result = await post("battle/escape", options);
    if (result){
        console.log("battle escaped");
        return result;
    }
}

export async function CatchMonster(battleId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData":init
        },
        body : { battleId }
    }
    const result = await post("monster/catch", options);
    if (result){
        console.log("monster catch");
        return result;
    }
    
}

export async function spawnLocations(world) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData":init
        },
        body: { world }
    }

    const result = await post("world/spawn", options);

    if(result){
        console.log("monster spawn");
        return result;
    }
}
export async function StartBattle(world, node, attackerId) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData": init
        },
        body : { world, node, attackerId }
    }
    const result = await post("battle/start", options);
    if (result){
        console.log("battle started");
        return result;
    }
}

export async function GetBonus(index) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData": init
        },
        body: { index }
    }

    const result = await post("bonus/receive", options);
    if (result){
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

    if (result){
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

    if (result){
        console.log("Items");
        return result;
    }
}

export async function  GetExchangeTerms() {
    const options =  {
        method : "POST",
        headers: {
            "Content-Type": "application/json",
            "InitData": init
        }
    };

    const result = await post("exchange-terms", options);
    if (result){
        console.log("exchange-terms");
        return result;
    }
}

