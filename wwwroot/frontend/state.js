export const state = {
    user : null,
    selectedMonster: (() => {
        const monsterData = localStorage.getItem("selectedMonster");
        try {
            return monsterData ? JSON.parse(monsterData) : null;
        } catch (e) {
            console.error("Failed to parse selectedMonster from localStorage:", e);
            return null;
        }
    })(),
    isLoaded : false
}

export function updateUser(){
    
}

