import { WorldScene } from "./game.js";
import { state } from "../state.js";
import * as api from "../webapp/api.js";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: "PreloadScene" });
    }

    preload() {
        console.log("Preload Scene Started");

        const { width, height } = this.scale;

        // Render loading background image immediately
        this.add.image(width / 2, height / 2, "loading_bg").setDisplaySize(width, height);

        // Enhanced Progress bar box
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x334155, 0.4); // Slate-700 semi-transparent
        progressBox.fillRoundedRect(width / 2 - 140, height - 105, 280, 20, 10);
        progressBox.lineStyle(2, 0x475569, 1);
        progressBox.strokeRoundedRect(width / 2 - 140, height - 105, 280, 20, 10);

        const progressBar = this.add.graphics();

        const percentText = this.add.text(width / 2, height - 95, "0%", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "14px",
            fill: "#ffffff"
        }).setOrigin(0.5).setDepth(10);
        percentText.setStroke("#0f172a", 3);

        // Random Tip System
        const tips = [
            "Tip: Capture wild monsters to expand your team!",
            "Tip: Fire type monsters are strong against Grass type!",
            "Tip: Heal your monsters in the Lab using Heal Spells.",
            "Tip: Check the Shop daily for promotional packs!",
            "Tip: Higher level monsters have stronger attributes.",
            "Tip: Complete missions to earn valuable EGGS and GOLD!",
            "Tip: Loading assets... Opening the first time may take a moment."
        ];

        const tipText = this.add.text(width / 2, height - 150, Phaser.Utils.Array.GetRandom(tips), {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "13px",
            fontWeight: "800",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: width - 60, useAdvancedWrap: true }
        }).setOrigin(0.5);
        tipText.setStroke("#0f172a", 3);

        const tipTimer = this.time.addEvent({
            delay: 2500,
            callback: () => {
                tipText.setText(Phaser.Utils.Array.GetRandom(tips));
            },
            loop: true
        });

        this.load.on("progress", (value) => {
            percentText.setText(parseInt(value * 100) + "%");
            progressBar.clear();
            progressBar.fillStyle(0xd97706, 1); // Amber 600
            progressBar.fillRoundedRect(
                width / 2 - 136,
                height - 101,
                272 * value,
                12,
                6
            );
        });

        this.load.on("complete", () => {
            tipTimer.destroy();
            this.time.delayedCall(500, () => {
                const dbAccepted = state && state.user && state.user.hasAcceptedAgreement;
                const localAccepted = localStorage.getItem("user_agreement_accepted") === "true";
                if (dbAccepted || localAccepted) {
                    this.scene.start("WorldScene");
                } else {
                    // Hide loading components
                    progressBar.clear();
                    progressBox.clear();
                    percentText.destroy();
                    tipText.destroy();

                    // Show agreement popup
                    this.showAgreementPopup();
                }
            });
        });

        this.load.image("world-bg", "images/hub/worldbg.png");
        // world icons
        this.load.image("world-bootcamp-icon", "images/hub/bootcamp-icon.png");
        this.load.image("world-riverfall-icon", "images/hub/icon_cave.png");
        this.load.image("world-costa-gueta-icon", "images/hub/icon_costa.png");
        this.load.image("world-volcano-icon", "images/hub/icon_volcano.png");


        // worlds backgrounds
        this.load.image("bootcamp-bg-1", "images/map/area_bootcamp/bg-1.png");
        this.load.image("bootcamp-bg-2", "images/map/area_bootcamp/bg-2.png");

        this.load.image("riverfall-bg-1", "images/map/area_cave/bg1.jpg");
        this.load.image("riverfall-bg-2", "images/map/area_cave/bg2.jpg");
        this.load.image("riverfall-bg-3", "images/map/area_cave/bg3.jpg");

        this.load.image("costa-gueta-bg-1", "images/map/area_costa/bg1.jpg");
        this.load.image("costa-gueta-bg-2", "images/map/area_costa/bg2.jpg");
        this.load.image("costa-gueta-bg-3", "images/map/area_costa/bg3.jpg");
        this.load.image("costa-gueta-bg-4", "images/map/area_costa/bg4.jpg");
        this.load.image("costa-gueta-bg-5", "images/map/area_costa/bg5.jpg");
        this.load.image("costa-gueta-bg-6", "images/map/area_costa/bg6.jpg");

        this.load.image("volcano-bg-1", "images/map/area_volcano/bg1.jpg");
        this.load.image("volcano-bg-2", "images/map/area_volcano/bg2.jpg");


        //battle map backgrounds
        this.load.image("bgs_camp", "images/map/area_bootcamp/camp.png");
        this.load.image("bgs_riverfall_water", "images/map/area_cave/water.jpg");
        this.load.image("bgs_riverfall_cave", "images/map/area_cave/cave.jpg");
        this.load.image("bgs_riverfall_tall_pine", "images/map/area_cave/tall_pine.jpg");

        this.load.image("bgs_costa", "images/map/area_costa/beach.jpg");
        this.load.image("bgs_volcano", "images/map/area_volcano/volcano.jpg");

        this.load.image("bgs_castle", "images/map/area_boss/boss_castle.jpg")
        this.load.image("bgs_out_temple", "images/map/area_boss/boss_out_temple.jpg")

        this.load.image("btn_world", "images/buttons/btn_world.png");
        this.load.image("btn_shop", "images/buttons/btn_shop.png");
        this.load.image("btn_team", "images/buttons/btn_team.png");
        this.load.image("btn_items", "images/buttons/btn_items.png");
        this.load.image("btn_missions", "images/buttons/btn_missions.png");
        this.load.image("btn_referral", "images/buttons/btn_referral.png");


        //character icons
        this.load.image("alaska-icon", "images/char_icons/alaska-icon.png");
        this.load.image("blaze-icon", "images/char_icons/blaze_icon.png");
        this.load.image("boris-icon", "images/char_icons/boris_icon.png");
        this.load.image("bradley-icon", "images/char_icons/bradley_icon.png");
        this.load.image("cable-icon", "images/char_icons/cable_icon.png");


        //fonts (white_stroked_big)
        for (let i = 32; i <= 122; i++) {
            this.load.image(`c${i}`, `images/fonts/white_stroked_big/c${i}.png`);
        }

        //font black_mediumi 
        this.load.image(`ch32`, `images/fonts/black_medium/c32.png`);
        this.load.image(`ch35`, `images/fonts/black_medium/c35.png`);
        for (let i = 48; i <= 57; i++) {
            this.load.image(`ch${i}`, `images/fonts/black_medium/c${i}.png`);
        }


        for (let i = 32; i <= 95; i++) {
            this.load.image(`wss${i}`, `images/fonts/white_stroked_small/c${i}.png`);
        }

        //small white
        for (let i = 32; i <= 122; i++) {
            this.load.image(`sw${i}`, `images/fonts/white_small/c${i}.png`);
        }

        //small black
        for (let i = 32; i <= 122; i++) {
            this.load.image(`sb${i}`, `images/fonts/black_small/c${i}.png`);
        }

        //hud
        this.load.image("profile-bg", "images/modals/profile_bg.png");
        this.load.image("hud_profile", "images/modals/hud_profile.png");
        this.load.image("item_coin", "images/items/icons/coins.png");
        this.load.image("item_ton", "images/items/icons/ton.png");
        this.load.image("item_gold", "images/items/icons/item_gold.png");
        this.load.image("mission_battle", "images/items/icons/mission_battle.png");
        this.load.image("mission_heal", "images/items/icons/mission_heal.png");
        this.load.image("mission_chest", "images/items/icons/mission_chest.png");
        this.load.image("mission_social", "images/items/icons/mission_social.png");
        this.load.image("mission_streak", "images/items/icons/mission_streak.png");
        this.load.image("mission_default", "images/items/icons/mission_default.png");


        //rewards
        this.load.image("rewards_gold", "images/items/icons/item_coins.png");
        this.load.image("rewards_monstaball", "images/items/icons/discatch.png");
        this.load.image("rewards_healspell", "images/items/icons/heal_spray.png");
        this.load.image("rewards_darkspell", "images/items/icons/can_dark_beam.png");
        this.load.image("rewards_lavaspell", "images/items/icons/can_hellfire.png");
        this.load.image("rewards_avalanchespell", "images/items/icons/can_avalanche.png");
        this.load.image("rewards_windspell", "images/items/icons/can_tornado.png");
        this.load.image("rewards_thunderspell", "images/items/icons/can_thunderstrom.png");
        this.load.image("rewards_waterfallspell", "images/items/icons/can_water_blast.png");
        this.load.image("rewards_rainbow", "images/items/icons/can_rainbow.png");
        this.load.image("rewards_hallucinogen", "images/items/icons/can_poison.png");
        this.load.image("rewards_shield", "images/items/icons/antidot.png");
        this.load.image("rewards_ragepotion", "images/items/icons/rage_root.png");




        //general

        this.load.image("map-info", "images/general/map_info/bg.png");
        this.load.image("go-button", "images/general/btn_go.png");
        this.load.image("close-button", "images/general/btn_close.png");
        this.load.image("go-button", "images/general/btn_go.png");
        this.load.image("ton-icon", "images/general/ton.png");
        this.load.image("hud-currency", "images/general/hud_currency.png");
        this.load.image("node", "images/general/node.png");
        this.load.image("player", "images/general/avatar_boy.png");
        this.load.image("marker_battle", "images/general/marker_battle.png");
        this.load.image("marker_boss", "images/general/marker_boss.png");
        this.load.image("mons_shadow", "images/general/mon_shadow.png");

        this.load.image("btn_blank", "images/general/btn_blank.png");

        this.load.image("badge_levelup", "images/general/badge_levelup.png");
        this.load.image("badge_red", "images/general/badge_red.png");
        this.load.image("btn_levelup", "images/general/btn_levelup.png");
        this.load.image("btn_levelup_text", "images/general/btn_levelup_text.png");
        this.load.image("btn_ok", "images/general/btn_ok.png");
        this.load.image("icon_aim", "images/general/icon_aim.png");
        this.load.image("icon_atk", "images/general/icon_atk.png");
        this.load.image("icon_def", "images/general/icon_def.png");
        this.load.image("speed_icon", "images/general/speed_icon.png");

        this.load.image("btn_blank", "images/general/btn_blank.png");
        this.load.image("btn_cancel", "images/general/btn_cancel.png");
        this.load.image("settings_button", "images/general/settings_button.png");

        this.load.image("slider_button_green", "images/general/slider_button_green.png");
        this.load.image("notice_bg", "images/general/notice_bg.png");
        this.load.image("rewards_bg", "images/general/rewards_bg.png");
        this.load.image("icon_completed", "images/general/icon_completed.png");
        this.load.image("btn_player-info", "images/general/btn_player-info.png");
        this.load.image("icon_trophy", "images/general/icon_trophy.png");
        this.load.image("btn_claim", "images/general/btn_claim.png");
        this.load.image("icon_speed", "images/general/icon_speed.png");


        //general hud
        this.load.image("pane_big_fire", "images/general/hud/pane_big_fire.png");
        this.load.image("pane_big_water", "images/general/hud/pane_big_water.png");
        this.load.image("pane_big_earth", "images/general/hud/pane_big_earth.png");
        this.load.image("pane_big_electric", "images/general/hud/pane_big_elec.png");
        this.load.image("pane_big_dark", "images/general/hud/pane_big_dark.png");
        this.load.image("pane_mini_dark", "images/general/hud/pane_mini_dark.png");
        this.load.image("pane_mini_electric", "images/general/hud/pane_mini_elec.png");
        this.load.image("pane_mini_earth", "images/general/hud/pane_mini_earth.png");
        this.load.image("pane_mini_water", "images/general/hud/pane_mini_water.png");
        this.load.image("pane_mini_fire", "images/general/hud/pane_mini_fire.png");
        this.load.image("hpbar_big_bg", "images/general/hud/hpbar_big_bg.png");
        this.load.image("hpbar_big_fill_red", "images/general/hud/hpbar_big_fill_red.png");
        this.load.image("hpbar_big_fill", "images/general/hud/hpbar_big_fill.png");
        this.load.image("hpbar_med_bg", "images/general/hud/hpbar_med_bg.png");
        this.load.image("hpbar_med_fill", "images/general/hud/hpbar_med_fill.png");
        this.load.image("hp_bar", "images/general/hud/hpbar_med_bg.png");
        this.load.image("hp_bar_fill", "images/general/hud/hpbar_med_fill.png");
        this.load.image("hpbar_small_bg", "images/general/hud/hpbar_small_bg.png");
        this.load.image("hpbar_small_fill", "images/general/hud/hpbar_small_fill.png");
        this.load.image("pane_tooltip_electric", "images/general/hud/pane_tooltip_elec.png");
        this.load.image("pane_tooltip_dark", "images/general/hud/pane_tooltip_dark.png");
        this.load.image("pane_tooltip_water", "images/general/hud/pane_tooltip_water.png");
        this.load.image("pane_tooltip_fire", "images/general/hud/pane_tooltip_fire.png");
        this.load.image("pane_tooltip_earth", "images/general/hud/pane_tooltip_earth.png");
        this.load.image("loading_buffer", "images/general/loading_buffer.png");

        this.load.image("btn_withdraw", "images/general/btn_withdraw.png");
        this.load.image("btn_deposit", "images/general/btn_deposit.png");


        //map headers
        this.load.image("bootcamp-header", "images/general/map_info/headers/bootcamp.png");
        this.load.image("riverfall-header", "images/general/map_info/headers/cave.png");
        this.load.image("ruins-header", "images/general/map_info/headers/ruins.png");
        this.load.image("costa-header", "images/general/map_info/headers/costa.png");
        this.load.image("castle-header", "images/general/map_info/headers/castle.png");
        this.load.image("winterdale-header", "images/general/map_info/headers/festive.png");
        this.load.image("volcano-header", "images/general/map_info/headers/volcano.png");
        this.load.image("powerplant-header", "images/general/map_info/headers/powerplant.png");
        this.load.image("fire_temple-header", "images/general/map_info/headers/fire_temple.png");
        this.load.image("gold_city-header", "images/general/map_info/headers/gold_city.png");


        //xp
        this.load.image("xp_bar_bg", "images/battle/endscreen/league_xp/progressbar_bg.png");
        this.load.image("xp_bar_fill", "images/battle/endscreen/league_xp/progressbar_fill.png");





        //inventory
        this.load.image("inventory-bg", "images/general/inventory/bg_inventory.png");
        this.load.image("team-slot", "images/general/inventory/team_slot.png");
        this.load.image("btn-back-map", "images/general/inventory/btn_back_map.png");
        this.load.image("pane_thumb_earth", "images/general/inventory/pane_thumb_earth.png");
        this.load.image("pane_thumb_water", "images/general/inventory/pane_thumb_water.png");
        this.load.image("pane_thumb_fire", "images/general/inventory/pane_thumb_fire.png");
        this.load.image("pane_thumb_dark", "images/general/inventory/pane_thumb_dark.png");
        this.load.image("pane_thumb_electric", "images/general/inventory/pane_thumb_elec.png");
        this.load.image("btn_back_all", "images/general/inventory/btn_back_all.png");
        this.load.image("btn_arrow_right", "images/general/btn_arrow_right.png");


        //info
        this.load.image("xpbar_bg", "images/general/xpbar_bg.png");
        this.load.image("xpbar_fill", "images/general/xpbar_fill.png");
        this.load.image("skills_bg", "images/general/inventory/skills_bg.png");
        this.load.image("skill_lock", "images/general/inventory/skill_lock.png");
        this.load.image("btn_release", "images/general/inventory/btn_release.png");


        //onboarding
        this.load.image("choose_panel_earth", "images/onboarding/choose_panel_earth.png");
        this.load.image("choose_panel_water", "images/onboarding/choose_panel_water.png");
        this.load.image("choose_panel_fire", "images/onboarding/choose_panel_fire.png");
        this.load.image("choose_title", "images/onboarding/choose_title.png");
        this.load.image("btn_choose", "images/onboarding/btn_choose.png");


        //leaderboard
        this.load.image("leaderboard_bg", "images/general/leaderboard_bg.png");
        this.load.image("rank_1", "images/general/rank_1.png")
        this.load.image("rank_2", "images/general/rank_2.png")
        this.load.image("rank_3", "images/general/rank_3.png")

        //battle 
        this.load.image("btn_back", "images/battle/btn_back.png");
        this.load.image("btn_catch_off", "images/battle/btn_catch_off.png");
        this.load.image("btn_catch", "images/battle/btn_catch.png");
        this.load.image("btn_escape", "images/battle/btn_escape.png");
        this.load.image("btn_more", "images/battle/btn_more.png");
        this.load.image("cardback", "images/battle/abilities/cardback.png");

        this.load.image("icon_aim", "images/battle/icon_aim.png");
        this.load.image("icon_atk", "images/battle/icon_atk.png");
        this.load.image("icon_def", "images/battle/icon_def.png");
        this.load.image("levelup_blast", "images/battle/levelup_blast.png");
        this.load.image("turn_indicator", "images/battle/turn.png");

        this.load.image("defeat_banner", "images/battle/defeat.png");

        //starter pack
        this.load.image("starter_pack_frame", "images/packs/starter_pack1.png");
        this.load.image("loading_bg", "images/bgs/loading_bg.png");


        this.load.image("slash", "images/battle/abilities/fx/slash.png");
        this.load.image("hypno_fx", "images/battle/abilities/fx/hypno_fx.png");


        //battle endscreen
        this.load.image("superlative1", "images/battle/endscreen/superlative1.png");
        this.load.image("superlative2", "images/battle/endscreen/superlative2.png");
        this.load.image("superlative3", "images/battle/endscreen/superlative3.png");
        this.load.image("superlative3", "images/battle/endscreen/superlative3.png");
        this.load.image("winner", "images/battle/endscreen/winner.png");
        this.load.image("rewards_modal", "images/battle/endscreen/rewards_modal.png");
        this.load.image("loser_popup", "images/battle/endscreen/loser_popup.png");
        this.load.image("you_win", "images/battle/endscreen/you_win.png");


        //endscreen
        this.load.image("pedestal", "images/general/pedestal.png");
        this.load.image("btn_later", "images/general/btn_later.png");
        this.load.image("rewards_modal", "images/battle/endscreen/rewards_modal.png");
        this.load.image("lose_modal", "images/battle/endscreen/loser_modal.png");
        this.load.image("reward_slot", "images/battle/endscreen/reward_slot.png");

        //spritesheets
        this.load.spritesheet("deck_shuffle", "images/battle/deck_shuffle.png", { frameWidth: 220, frameHeight: 220 });
        this.load.spritesheet("card_use", "images/battle/card_use.png", { frameWidth: 150, frameHeight: 150 });

        this.load.spritesheet("levelup_blast", "images/general/levelup_blast.png", { frameWidth: 240, frameHeight: 660 });


        //battle report
        this.load.image("report_backfire", "images/battle/report_backfire.png");
        this.load.image("report_critical", "images/battle/report_critical.png");
        this.load.image("report_rage", "images/battle/report_rage.png");
        this.load.image("report_weak", "images/battle/report_weak.png");
        this.load.image("report_strong", "images/battle/report_strong.png");
        this.load.image("report_sick", "images/battle/report_sick.png");



        //collector
        this.load.image("collector_icon", "images/collector/collector_icon.png");



        //Shop
        this.load.image("bg_shop", "images/shop/bg_shop.png");
        this.load.image("bg_slot", "images/shop/bg_slot.png");
        this.load.image("exchange_slot", "images/shop/exchange_slot.png");
        this.load.image("btn_exchange", "images/shop/btn_exchange.png");
        this.load.image("btn_sell", "images/shop/btn_sell.png");


        //exchagne terms items
        // this.load.image("ITEM_EGGS", "images/general/")
        this.load.image("item_dust", "images/items/icons/dust.png");
        this.load.image("item_can_water_blast", "images/items/icons/can_water_blast.png");

        //item
        this.load.image("bg_item", "images/items/bg_item_and_outfit.png");
        this.load.image("item_slot", "images/items/item_slot.png");
        this.load.image("item_selected", "images/items/item_selected.png");
        this.load.image("btn_use", "images/items/btn_use.png");
        this.load.image("item_monstaBall", "images/items/icons/discatch.png");
        this.load.image("item_healSpell", "images/items/icons/heal_spray.png");
        this.load.image("item_darkSpell", "images/items/icons/can_dark_beam.png");
        this.load.image("item_lavaSpell", "images/items/icons/can_hellfire.png");
        this.load.image("item_avalancheSpell", "images/items/icons/can_avalanche.png");
        this.load.image("item_windSpell", "images/items/icons/can_tornado.png");
        this.load.image("item_thunderSpell", "images/items/icons/can_thunderstorm.png");
        this.load.image("item_waterFallSpell", "images/items/icons/can_water_blast.png");
        this.load.image("item_rainbow", "images/items/icons/can_rainbow.png");
        this.load.image("item_hallucinogen", "images/items/icons/can_poison.png");
        this.load.image("item_shield", "images/items/icons/antidote.png");
        this.load.image("item_ragePotion", "images/items/icons/rage_root.png");



        this.load.image("item_blue_ball", "images/items/icons/blue_ball.png");
        this.load.image("item_box_blue", "images/items/icons/box_blue.png");
        this.load.image("item_box_red", "images/items/icons/box_red.png");

        this.load.image("item_eggs", "images/items/icons/eggs.png");

        const monsters = [
            "kikflick",
            "blubbo",
            "torchip",
            "blazik",
            "quabble",
            "grunko",
            "torky",
            "slumbo",
            "cobrix",
            "chompy",
            "buzzle",
            "scarfy",
            "aquos",
            "gourdo",
            "brasko",
            "fynox",
            "wavvy",
            "wingo",
            "nocty",
            "umbrik",
            "torky",
            "krimson",
            "malakite",
            "kobalt",
            "zenix",
            "xomox",
            "kitine",
            "groffy",
            "peblo"
        ]
        monsters.forEach(key => {
            //monster icon
            this.load.image(`icon_${key}`, `images/mons/${key}/icon.png`);

            //monster front
            this.load.image(`front_${key}`, `images/mons/${key}/front.png`);

            //monster back
            this.load.image(`back_${key}`, `images/mons/${key}/back.png`);
        });


        //ability spritesheets

        this.load.spritesheet("dark_beam", "images/battle/abilities/fx/dark_beam.png", { frameWidth: 160, frameHeight: 470 });
        this.load.spritesheet("haunt", "images/battle/abilities/fx/haunt.png", { frameWidth: 60, frameHeight: 200 });
        this.load.spritesheet("rage_fx_front", "images/battle/abilities/fx/rage_fx_front.png", { frameWidth: 302, frameHeight: 458 });
        this.load.spritesheet("rage_fx_back", "images/battle/abilities/fx/rage_fx_back.png", { frameWidth: 302, frameHeight: 458 });
        this.load.spritesheet("poison_bite", "images/battle/abilities/fx/poison_bite.png", { frameWidth: 230, frameHeight: 316 });
        this.load.spritesheet("quick_disappear", "images/battle/abilities/fx/quick_disappear.png", { frameWidth: 299, frameHeight: 311 });
        this.load.spritesheet("quick_punch", "images/battle/abilities/fx/quick_punch.png", { frameWidth: 352, frameHeight: 317 });

        this.load.spritesheet("eating_plant", "images/battle/abilities/fx/eating_plant.png", { frameWidth: 230, frameHeight: 316 });

        this.load.spritesheet("sick_fx", "images/battle/abilities/fx/sick_fx.png", { frameWidth: 90, frameHeight: 100 });
        this.load.spritesheet("catch_use", "images/battle/catch_disk.png", { frameWidth: 201, frameHeight: 207 });
        this.load.spritesheet("shockwave", "images/battle/abilities/fx/shockwave.png", { frameWidth: 337, frameHeight: 412 });
        this.load.spritesheet("rainbow", "images/battle/abilities/fx/rainbow.png", { frameWidth: 280, frameHeight: 950 });
        this.load.spritesheet("heat_waves", "images/battle/abilities/fx/heatwave.png", { frameWidth: 300, frameHeight: 300 });
        this.load.spritesheet("water_blast", "images/battle/abilities/fx/blast_water.png", { frameWidth: 290, frameHeight: 940 });
        this.load.spritesheet("hellfire", "images/battle/abilities/fx/blast.png", { frameWidth: 290, frameHeight: 940 });
        this.load.spritesheet("bubbles", "images/battle/abilities/fx/bubble.png", { frameWidth: 80, frameHeight: 80 });
        this.load.spritesheet("enflame", "images/battle/abilities/fx/enflame.png", { frameWidth: 320, frameHeight: 380 });
        this.load.spritesheet("magma", "images/battle/abilities/fx/boulder_fire.png", { frameWidth: 280, frameHeight: 220 });
        this.load.spritesheet("earth_shield", "images/battle/abilities/fx/rock_shield.png", { frameWidth: 340, frameHeight: 400 });
        this.load.spritesheet("ice_shield", "images/battle/abilities/fx/ice_shield.png", { frameWidth: 340, frameHeight: 400 });
        this.load.spritesheet("fire_spin", "images/battle/abilities/fx/fire_spin.png", { frameWidth: 350, frameHeight: 350 });
        this.load.spritesheet("tornado", "images/battle/abilities/fx/tornado.png", { frameWidth: 198, frameHeight: 326 });
        this.load.spritesheet("recharge", "images/battle/abilities/fx/recharge.png", { frameWidth: 320, frameHeight: 189 });
        this.load.spritesheet("direct_hit_1", "images/battle/abilities/fx/direct_hit.png", { frameWidth: 602, frameHeight: 483 });
        this.load.spritesheet("boulder", "images/battle/abilities/fx/boulder_earth.png", { frameWidth: 280, frameHeight: 220 });
        this.load.spritesheet("ice_splash", "images/battle/abilities/fx/splash.png", { frameWidth: 400, frameHeight: 370 });
        this.load.spritesheet("volcano", "images/battle/abilities/fx/splash_fire.png", { frameWidth: 300, frameHeight: 300 });
        this.load.spritesheet("electric_punch", "images/battle/abilities/fx/electric_punch.png", { frameWidth: 372, frameHeight: 230 });
        this.load.spritesheet("subzero", "images/battle/abilities/fx/winter.png", { frameWidth: 300, frameHeight: 300 });
        this.load.spritesheet("thunderstorm", "images/battle/abilities/fx/thunderbolt.png", { frameWidth: 180, frameHeight: 940 });
        this.load.spritesheet("suck_life", "images/battle/abilities/fx/leech.png", { frameWidth: 70, frameHeight: 70 });
        this.load.spritesheet("static_shock", "images/battle/abilities/fx/static_shock.png", { frameWidth: 266, frameHeight: 320 });

        this.load.spritesheet("avalanche", "images/battle/abilities/fx/boulder_ice.png", { frameWidth: 279, frameHeight: 220 });
        this.load.spritesheet("bite", "images/battle/abilities/fx/bite.png", { frameWidth: 230, frameHeight: 316 });
        this.load.spritesheet("revenge_earth_1", "images/battle/abilities/fx/nature_beam.png", { frameWidth: 135, frameHeight: 460 });
        this.load.spritesheet("shadow_slash", "images/battle/abilities/fx/shadow_slash.png", { frameWidth: 260, frameHeight: 251 });
        this.load.spritesheet("nightfall", "images/battle/abilities/fx/nightfall.png", { frameWidth: 300, frameHeight: 300 });
        this.load.spritesheet("fireworks", "images/battle/abilities/fx/fireworks.png", { frameWidth: 90, frameHeight: 90 });
        this.load.spritesheet("ion_beam", "images/battle/abilities/fx/ion_beam.png", { frameWidth: 160, frameHeight: 470 });
        this.load.spritesheet("sonic_waves", "images/battle/abilities/fx/sonic_wave.png", { frameWidth: 337, frameHeight: 449 });
        this.load.spritesheet("dark_shield", "images/battle/abilities/fx/dark_shield.png", { frameWidth: 340, frameHeight: 400 });
        this.load.spritesheet("double_bite", "images/battle/abilities/fx/double_bite.png", { frameWidth: 230, frameHeight: 316 });
        this.load.spritesheet("healing_rain", "images/battle/abilities/fx/healing_rain.png", { frameWidth: 320, frameHeight: 380 });
        this.load.spritesheet("healing_rain", "images/battle/abilities/fx/healing_rain.png", { frameWidth: 320, frameHeight: 380 });



        this.load.image("levelup_blast", "images/battle/levelup_blast.png");

        //ability images
        this.load.image("leaf_strike", "images/battle/abilities/fx/rain_leaf.png");
        this.load.image("spores", "images/battle/abilities/fx/spores_cloud.png");
        // this.load.image("sonic_waves", "images/battle/abilities/fx/wave.png");
        this.load.image("freeze", "images/battle/abilities/fx/freeze_gas.png");
        this.load.image("ice_strom", "images/battle/abilities/fx/rain_ice.png");
        this.load.image("rain_fire", "images/battle/abilities/fx/rain_fire.png");
        this.load.image("smoke", "images/battle/abilities/fx/smoke.png");
        // this.load.image("ice_splash", "images/battle/abilities/fx/ice_rock.png");
        this.load.image("poison_gas", "images/battle/abilities/fx/poison_gas.png");
        this.load.image("sparks", "images/battle/abilities/fx/sparks.png");

        //vine top and back
        this.load.image("strangle_top", "images/battle/abilities/fx/vine_top.png");
        this.load.image("strangle_back", "images/battle/abilities/fx/vine_back.png");
        this.load.image("tentacles_top", "images/battle/abilities/fx/tentacle_top.png");
        this.load.image("tentacles_back", "images/battle/abilities/fx/tentacle_back.png");



        const cloudEffects = ["spores", "smoke", "poison_gas"]
        const strikeEffects = ["leaf_strike", "ice_storm", "rain_fire", "sparks"]

        const abilities = [
            "avalanche",
            "scratch",  //
            "leaf_strike",  //
            "shockwave",  //
            "rage", //
            "rainbow", //  
            "spores",//   
            "sonic_waves",
            "heat_waves",//
            "water_blast",//
            "bubbles",
            "flash", //
            "freeze", //
            "ice_storm", //
            "rain_fire", //
            "quick_attack",// 
            "enflame", //
            "hellfire", //
            "magma", //
            "smoke", //
            "poison_bite", //
            "confuse", //
            "dark_beam", //
            "haunt",//
            "ice_splash",
            "earth_shield",//
            "ice_shield", //
            "strangle", //
            "poison_gas",//
            "fire_spin",//
            "tornado",//
            "recharge",//
            "sparks",//
            "direct_hit_1",//
            "revive",
            "tentacles",
            "boulders",//
            "bite",//
            "eating_plant",  //--
            "earth_revenge_1", //
            "shadow_slash", //
            "nightfall", //
            "fireworks", //
            "suck_life", //--
            "ion_beam", //
            "subzero", //
            "dark_shield", //
            "double_bite", //
            "healing_rain", //
            "suck_life", //
            "ice_shield", //
            "volcano",
            "thunderstorm",
            "electric_punch",
            "static_shock"
        ]

        //abilities spritesheet


        //abilities icon
        abilities.forEach(ab => {
            this.load.image(`icon_${ab}`, `images/battle/abilities/icons/${ab}.png`);
        });

        // Load json metadata files
        this.load.json("gameplay_data", "data/gameplay.json");
        this.load.json("monsters_data", "data/monsters.json");
        this.load.json("skills_data", "data/skills.json");
    }

    create() {


        this.anims.create({
            key: "anim_deck_shuffle",
            frames: this.anims.generateFrameNumbers("deck_shuffle", { start: 0, end: 4 }),
            frameRate: 12,
            repeat: 1
        });

        this.anims.create({
            key: "anim_card_use",
            frames: this.anims.generateFrameNumbers("card_use", { start: 0, end: 5 }),
            frameRate: 10
        });

        this.anims.create({
            key: "anim_sick_fx",
            frames: this.anims.generateFrameNumbers("sick_fx", { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: "anim_levelup_blast",
            frames: this.anims.generateFrameNumbers("levelup_blast"),
            frameRate: 8,
            repeat: 0
        })

        this.anims.create({
            key: "anim_dark_beam",
            frames: this.anims.generateFrameNumbers("dark_beam", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: "anim_thunderstorm",
            frames: this.anims.generateFrameNumbers("thunderstorm"),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: "anim_electric_punch",
            frames: this.anims.generateFrameNumbers("electric_punch"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_static_shock",
            frames: this.anims.generateFrameNumbers("static_shock"),
            frameRate: 8,
            repeat: 0
        });


        this.anims.create({
            key: "anim_haunt",
            frames: this.anims.generateFrameNumbers("haunt", { start: 0, end: 2 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: "anim_rage_fx_front",
            frames: this.anims.generateFrameNumbers("rage_fx_front"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_rage_fx_back",
            frames: this.anims.generateFrameNumbers("rage_fx_back"),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: "anim_poison_bite",
            frames: this.anims.generateFrameNumbers("poison_bite"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_suck_life",
            frames: this.anims.generateFrameNumbers("suck_life"),
            frameRate: 8,
            repeat: 1
        });

        this.anims.create({
            key: "anim_eating_plant",
            frames: this.anims.generateFrameNumbers("eating_plant"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_healing_rain",
            frames: this.anims.generateFrameNumbers("healing_rain"),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'anim_quick_disappear',
            frames: this.anims.generateFrameNumbers('quick_disappear'),
            frameRate: 8,
            repeat: 0,
        });

        this.anims.create({
            key: "anim_catch_start",
            frames: this.anims.generateFrameNumbers("catch_use", { start: 0, end: 2 }),
            frameRate: 8
        });

        this.anims.create({
            key: "anim_catch_status",
            frames: [
                { key: 'catch_use', frame: 1 },
                { key: 'catch_use', frame: 2 },
                { key: 'catch_use', frame: 1 }
            ],
            frameRate: 6,
            repeat: 3
        });


        this.anims.create({
            key: "anim_catch_failed",
            frames: [
                { key: 'catch_use', frame: 3, duration: 1200 },
                { key: 'catch_use', frame: 4 },
                { key: 'catch_use', frame: 5 },
                { key: "catch_use", frame: 6 },
                { key: "catch_use", frame: 7 }
            ],
            frameRate: 6
        })

        this.anims.create({
            key: 'anim_quick_punch',
            frames: this.anims.generateFrameNumbers('quick_punch', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 2,
            onUpdate: (sprite, frame) => {
                if (frame.index === 0) {
                    sprite.y -= 10;
                } else if (frame.index === 1) {
                    sprite.x += 20;
                } else if (frame.index === 2) {
                    sprite.y += 10;
                }
            }
        });


        this.anims.create({
            key: "anim_shockwave",
            frames: this.anims.generateFrameNumbers('shockwave'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_rainbow",
            frames: this.anims.generateFrameNumbers('rainbow'),
            frameRate: 8,
            repeat: 1
        });

        this.anims.create({
            key: "anim_heatwave",
            frames: this.anims.generateFrameNumbers('heatwave'),
            frameRate: 8,
            repeat: 3
        });

        this.anims.create({
            key: "anim_water_blast",
            frames: this.anims.generateFrameNumbers('water_blast'),
            frameRate: 8,
            repeat: 1
        });

        this.anims.create({
            key: "anim_enflame",
            frames: this.anims.generateFrameNumbers('enflame'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_hellfire",
            frames: this.anims.generateFrameNumbers('hellfire'),
            frameRate: 8,
            repeat: 0
        });


        this.anims.create({
            key: "anim_magma",
            frames: this.anims.generateFrameNumbers('magma'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_avalanche",
            frames: this.anims.generateFrameNumbers('avalanche'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_earth_shield",
            frames: this.anims.generateFrameNumbers('earth_shield'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_ice_shield",
            frames: this.anims.generateFrameNumbers('ice_shield'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_dark_shield",
            frames: this.anims.generateFrameNumbers('dark_shield'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_fire_spin",
            frames: this.anims.generateFrameNumbers('fire_spin'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_tornado",
            frames: this.anims.generateFrameNumbers('tornado'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_recharge",
            frames: this.anims.generateFrameNumbers('recharge'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_direct_hit_1",
            frames: this.anims.generateFrameNumbers('direct_hit_1'),
            frameRate: 6,
            repeat: 0
        });


        this.anims.create({
            key: "anim_boulders",
            frames: this.anims.generateFrameNumbers('boulders'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_ice_splash",
            frames: this.anims.generateFrameNumbers('ice_splash'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_volcano",
            frames: this.anims.generateFrameNumbers('volcano'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_bite",
            frames: this.anims.generateFrameNumbers('bite'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_double_bite",
            frames: this.anims.generateFrameNumbers('double_bite'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_earth_revenge_1",
            frames: this.anims.generateFrameNumbers('earth_revenge_1'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_shadow_slash",
            frames: this.anims.generateFrameNumbers('shadow_slash'),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: "anim_nightfall",
            frames: this.anims.generateFrameNumbers('nightfall'),
            frameRate: 6,
            repeat: 3
        });

        this.anims.create({
            key: "anim_subzero",
            frames: this.anims.generateFrameNumbers('subzero'),
            frameRate: 6,
            repeat: 3
        });

        this.anims.create({
            key: "anim_fireworks",
            frames: this.anims.generateFrameNumbers('fireworks'),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: "anim_ion_beam",
            frames: this.anims.generateFrameNumbers('ion_beam'),
            frameRate: 8,
            repeat: 1
        });

        this.anims.create({
            key: "anim_bubbles",
            frames: this.anims.generateFrameNumbers('bubbles'),
            frameRate: 6,
            repeat: 1
        });


        this.anims.create({
            key: "anim_sonic_waves",
            frames: this.anims.generateFrameNames('sonic_waves'),
            frameRate: 8,
            repeat: 2
        });

    }

    showAgreementPopup() {
        const { width, height } = this.scale;
        const popupContainer = this.add.container(0, 0).setDepth(200);

        // Dark blocker
        const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
            .setOrigin(0)
            .setInteractive();
        popupContainer.add(blocker);

        // Container card - Slate-50 bright premium light theme
        const cardW = 340;
        const cardH = 580;
        const cardX = width / 2;
        const cardY = height / 2;

        const card = this.add.graphics();
        card.fillStyle(0xf8fafc, 0.98); // Slate 50
        card.lineStyle(3, 0x0f172a, 1);  // Slate 900
        card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);
        card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);
        popupContainer.add(card);

        // Title
        const titleTxt = this.add.text(cardX, cardY - cardH / 2 + 30, "USER AGREEMENT", {
            fontFamily: "Lilita One, Coiny, sans-serif",
            fontSize: "22px",
            color: "#1e3a8a" // Premium Navy Blue
        }).setOrigin(0.5);
        titleTxt.setStroke("#ffffff", 4);
        popupContainer.add(titleTxt);

        // Subtitle
        const subTxt = this.add.text(cardX, cardY - cardH / 2 + 55, "Please read and accept to play", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            fontWeight: "700",
            color: "#64748b"
        }).setOrigin(0.5);
        popupContainer.add(subTxt);

        // Agreement Text Content (Shortened & formatted)
        const agreementText =
            `1. Eligibility & Accounts
You must be at least 15 years old. The Game uses Telegram authentication. You are responsible for account and wallet security.

2. Virtual Assets & Utility
All virtual assets (GOLD, EGGS, Monsters, Items) are for entertainment, have no guaranteed real-world value, and can be modified or balanced.

3. Deposits & Withdrawals
TON deposits unlock features. Withdrawals may be delayed, limited, or suspended. Availability is not guaranteed.

4. No Financial Advice
Nothing in the Game constitutes investment or financial advice. Participation is at your own risk.

5. Prohibited Activities
No bots, multi-accounts, or bug exploitation. Violations will result in account suspension or termination.`;

        const contentTxt = this.add.text(cardX, cardY - 50, agreementText, {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12.5px",
            fontWeight: "700",
            color: "#334155",
            align: "left",
            wordWrap: { width: cardW - 40, useAdvancedWrap: true },
            lineSpacing: 4
        }).setOrigin(0.5);
        popupContainer.add(contentTxt);

        // Checkbox & Label Group
        let isChecked = false;
        const checkboxX = cardX - cardW / 2 + 30;
        const checkboxY = cardY + cardH / 2 - 85;

        // Checkbox graphics
        const checkboxGraphics = this.add.graphics().setInteractive(
            new Phaser.Geom.Rectangle(checkboxX - 12, checkboxY - 12, 24, 24),
            Phaser.Geom.Rectangle.Contains
        );
        popupContainer.add(checkboxGraphics);

        // Label
        const checkboxLabel = this.add.text(checkboxX + 20, checkboxY, "I have read and agree to the terms", {
            fontFamily: "Nunito, Arial, sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#1e293b"
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        popupContainer.add(checkboxLabel);

        // Redraw Checkbox function
        const drawCheckbox = () => {
            checkboxGraphics.clear();
            if (isChecked) {
                checkboxGraphics.fillStyle(0x16a34a, 1); // Green fill
                checkboxGraphics.lineStyle(2, 0x0f172a, 1);
                checkboxGraphics.fillRoundedRect(checkboxX - 10, checkboxY - 10, 20, 20, 4);
                checkboxGraphics.strokeRoundedRect(checkboxX - 10, checkboxY - 10, 20, 20, 4);

                // Draw white checkmark check
                checkboxGraphics.lineStyle(2.5, 0xffffff, 1);
                checkboxGraphics.beginPath();
                checkboxGraphics.moveTo(checkboxX - 5, checkboxY);
                checkboxGraphics.lineTo(checkboxX - 1, checkboxY + 4);
                checkboxGraphics.lineTo(checkboxX + 5, checkboxY - 4);
                checkboxGraphics.strokePath();
            } else {
                checkboxGraphics.fillStyle(0xffffff, 1); // White fill
                checkboxGraphics.lineStyle(2, 0x475569, 1); // Slate border
                checkboxGraphics.fillRoundedRect(checkboxX - 10, checkboxY - 10, 20, 20, 4);
                checkboxGraphics.strokeRoundedRect(checkboxX - 10, checkboxY - 10, 20, 20, 4);
            }
        };
        drawCheckbox();

        // Toggle state
        const toggleCheckbox = () => {
            isChecked = !isChecked;
            drawCheckbox();

            // Enable/disable accept button
            if (isChecked) {
                btnAccept.setTint(0x16a34a); // Bright Green
                btnAccept.setInteractive({ useHandCursor: true });
                acceptTxt.setAlpha(1);
            } else {
                btnAccept.setTint(0x94a3b8); // Dimmed Slate
                btnAccept.disableInteractive();
                acceptTxt.setAlpha(0.6);
            }
        };

        checkboxGraphics.on("pointerup", toggleCheckbox);
        checkboxLabel.on("pointerup", toggleCheckbox);

        // Accept Button (at the bottom)
        const btnW = 180;
        const btnH = 38;
        const btnX = cardX;
        const btnY = cardY + cardH / 2 - 40;

        const btnAccept = this.add.image(btnX, btnY, "btn_blank").setDisplaySize(btnW, btnH);
        btnAccept.setTint(0x94a3b8); // Initially disabled (dimmed slate)
        popupContainer.add(btnAccept);

        const acceptTxt = this.add.text(btnX, btnY, "ACCEPT & PLAY", {
            fontFamily: "Lilita One, sans-serif",
            fontSize: "14px",
            color: "#ffffff"
        }).setOrigin(0.5).setAlpha(0.6);
        acceptTxt.setStroke("#0f172a", 3);
        popupContainer.add(acceptTxt);

        btnAccept.on("pointerover", () => {
            if (isChecked) {
                btnAccept.setScale((btnW / btnAccept.width) * 1.05, (btnH / btnAccept.height) * 1.05);
                acceptTxt.setScale(1.05);
            }
        });
        btnAccept.on("pointerout", () => {
            btnAccept.setScale(btnW / btnAccept.width, btnH / btnAccept.height);
            acceptTxt.setScale(1.0);
        });
        btnAccept.on("pointerdown", () => {
            if (isChecked) {
                btnAccept.setScale((btnW / btnAccept.width) * 0.95, (btnH / btnAccept.height) * 0.95);
                acceptTxt.setScale(0.95);
            }
        });

        btnAccept.on("pointerup", () => {
            if (isChecked) {
                api.AcceptAgreement().then(res => {
                    if (res && res.success) {
                        if (state && state.user) {
                            state.user.hasAcceptedAgreement = true;
                        }
                    }
                });
                localStorage.setItem("user_agreement_accepted", "true");
                popupContainer.destroy();
                this.scene.start("WorldScene");
            }
        });
    }
}
