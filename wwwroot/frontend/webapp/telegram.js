const tg = window.Telegram.WebApp;


if(tg){
    tg.expand();
    tg.ready();
    tg.setHeaderColor('bg_color'); 
    // tg.enableClosingConfirmation(); 
}

export { tg };
