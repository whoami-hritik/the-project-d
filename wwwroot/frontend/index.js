document.addEventListener("DOMContentLoaded", () => {
    const sendReq = document.getElementById("send-req");
    const spanText = document.getElementById("content");
    const spanText2 = document.getElementById("content-2");
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    console.log(tg.initData);
    spanText.innerHTML = tg.initData;
    console.log("start");
    sendReq.addEventListener("click", async () => {

        console.log("initData:", tg.initData);
        console.log("initDataUnsafe:", tg.initDataUnsafe);


        try {
            const res = await fetch("https://monsterworld.qzz.io/monsterworld/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "InitData": tg.initData
                }
            });

            if (!res.ok) {
                throw new Error("Request failed");
            }

            const data = await res.json();
            console.log(data);
            spanText2.innerHTML = JSON.stringify(data);

        } catch (err) {
            console.error(err);
        }
    });
});