import { state } from "./state.js";
import * as api from "./webapp/api.js"
import {startGame} from "./game/main.js";
// import Phaser from "phaser";

await api.loadUser();
console.log("User is loading...")
if (state.isLoaded){
    console.log(state.user);
    startGame();
}
