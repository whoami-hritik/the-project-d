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

    
export async function loadInventory() {
    const options = {
        method : "POST",
        headers: {
            "Content-Type":"application/json",
            "InitData": init
        }
    }
    const result = await post("inventory", options);
    if(result){
        console.log("Inventory Loaded");
        state.inventory = { items : result.inventory.items, monsters : result.inventory.monsters }
        return result;
    }
}  

export async function spawnMonsters() {
    const options = {
        method : "POST",
        headers : {
            "Content-Type": "application/json",
            "InitData": init
        }
    }

    const result = await post("monster/spawn", options);
    if (result){
        console.log("monster spawned");
        console.log(result);
        return result;
    }
}

export async function fightBattle(Id, MonsterID) {
    const options = {
        method : "POST",
        headers : {
            "Content-Type": "application/json",
            "InitData": init
        },
        body : { Id, MonsterID}
    }    
    const result = await post("battle/fight", options);   
    if(result){
        console.log("battle started");
        return result;
    }                                                          
}

export async function  Attack(BattleID, SkillId) {
    const options = {
        method : "POST",
        headers : {
            "Content-Type":"application/json",
            "InitData": init
        },
        body : { BattleID, SkillId }
    }

    const result = await post("battle/attack", options);
    if (result){
        console.log("attack");
        return result;
    }
}

export async function escapeBattle(battleId) {
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

