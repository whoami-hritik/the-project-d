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
    isLoaded : false,
    language: localStorage.getItem("language") || (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code === 'ru' ? 'ru' : 'en')
}

export function updateUser(){
    
}

export function setLanguage(lang) {
    state.language = lang;
    localStorage.setItem("language", lang);
}

