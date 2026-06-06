const tg = window.Telegram.WebApp;


if(tg){
    tg.expand();
    tg.ready();
}

export { tg };
