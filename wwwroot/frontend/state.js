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
    selectedMonsters: (() => {
        try {
            return JSON.parse(localStorage.getItem("selectedMonsters") || "[]");
        } catch (e) {
            return [];
        }
    })(),
    isLoaded : false,
    language: localStorage.getItem("language") || (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code === 'ru' ? 'ru' : 'en')
}

export function updateUser(){
    
}

export function setLanguage(lang) {
    state.language = lang;
    localStorage.setItem("language", lang);
}