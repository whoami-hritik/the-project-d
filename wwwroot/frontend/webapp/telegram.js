const tg = window.Telegram.WebApp;


if(tg){
    tg.expand();
    tg.ready();
    tg.setHeaderColor('bg_color'); 
    // tg.enableClosingConfirmation(); 
    if (tg.requestFullscreen) {
        try {
            tg.requestFullscreen();
        } catch (e) {
            console.warn("Telegram WebApp requestFullscreen not supported or blocked:", e);
        }
    }
}

export { tg };
