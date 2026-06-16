import { state } from "./state.js";
import * as api from "./webapp/api.js"
import {startGame} from "./game/main.js";
// import Phaser from "phaser";

const result = await api.loadUser();
console.log("User is loading...")

if (result && result.isMaintenance) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, #1e293b 0%, #0f172a 100%);
            color: #f8fafc;
            font-family: 'Nunito', sans-serif;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="font-size: 64px; margin-bottom: 20px;">🛠️</div>
            <h1 style="
                font-family: 'Lilita One', sans-serif;
                font-size: 28px;
                color: #f59e0b;
                margin: 0 0 10px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            ">System Maintenance</h1>
            <p style="
                font-size: 16px;
                font-weight: 700;
                color: #94a3b8;
                max-width: 400px;
                line-height: 1.6;
                margin: 0;
            ">${result.message}</p>
        </div>
    `;
} else if (state.isLoaded) {
    console.log(state.user);
    if (document.fonts) {
        document.fonts.ready.then(() => {
            startGame();
        }).catch((err) => {
            console.error("Font loading error:", err);
            startGame();
        });
    } else {
        startGame();
    }
}
