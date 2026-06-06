using System.Net.Http.Headers;
using System.Text.Json.Serialization;
namespace monster_world.Models
{
    public class SkillDef
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("desc")]
        public string Desc { get; set; }

        [JsonPropertyName("kind")]
        public string Kind { get; set; }          // "fire", "water", "dark", "none"

        [JsonPropertyName("cooldown")]
        public int Cooldown { get; set; }

        [JsonPropertyName("noMiss")]
        public bool NoMiss { get; set; }

        [JsonPropertyName("noBackfire")]
        public bool NoBackfire { get; set; }

        [JsonPropertyName("randomHits")]
        public string RandomHits { get; set; }    // "1-3" — null if not present

        [JsonPropertyName("extraWhen")]
        public string ExtraWhen { get; set; }     // "sick", "self_hurt" — null if absent

        [JsonPropertyName("effects")]
        public SkillEffects Effects { get; set; } // single object, not a list
    }

    public class SkillEffects
    {
        [JsonPropertyName("attack")]
        public int? Attack { get; set; }          // int: 18

        [JsonPropertyName("heal_percent")]
        public string HealPercent { get; set; }   // string: "14-28" (range)

        [JsonPropertyName("incr_atk")]
        public int? IncrAtk { get; set; }

        [JsonPropertyName("decr_atk")]
        public int? DecrAtk { get; set; }

        [JsonPropertyName("incr_def")]
        public int? IncrDef { get; set; }

        [JsonPropertyName("decr_def")]
        public int? DecrDef { get; set; }

        [JsonPropertyName("incr_aim")]
        public int? IncrAim { get; set; }

        [JsonPropertyName("decr_aim")]
        public int? DecrAim { get; set; }

        [JsonPropertyName("state_sick")]
        public string StateSick { get; set; }     // "1:1" = 1-in-1 chance

        [JsonPropertyName("state_hypno")]
        public string StateHypno { get; set; }    // "1:3" = 1-in-3 chance

        [JsonPropertyName("state_rage")]
        public string StateRage { get; set; }

        [JsonPropertyName("give_ability")]
        public string GiveAbility { get; set; }   // skill id to grant
    }


    public class MonsterDef
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("desc")]
        public string Desc { get; set; }

        [JsonPropertyName("kind")]
        public string Kind { get; set; }           // "fire", "water", etc.

        [JsonPropertyName("isLegendary")]
        public bool IsLegendary { get; set; }

        [JsonPropertyName("lvlTableId")]
        public string LvlTableId { get; set; }     // "common-1", "legendary-5"

        [JsonPropertyName("healRoute")]
        public string HealRoute { get; set; }

        [JsonPropertyName("xpRoute")]
        public string XpRoute { get; set; }

        [JsonPropertyName("statsRoute")]
        public string StatsRoute { get; set; }

        [JsonPropertyName("minEvolutionLevel")]
        public int? MinEvolutionLevel { get; set; }

        [JsonPropertyName("evolvesTo")]
        public string EvolvesTo { get; set; }

        [JsonPropertyName("evolveRVAmount")]
        public int? EvolveRVAmount { get; set; }

        [JsonPropertyName("minGameVersion")]
        public string MinGameVersion { get; set; }

        [JsonPropertyName("abilities")]
        public List<MonsterAbility> Abilities { get; set; } = new();
    }

    public class MonsterAbility
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }      // skill id

        [JsonPropertyName("getsAt")]
        public int GetsAt { get; set; }     // level when learned
    }


    public class CatchOddsLvlData
    {
        [JsonPropertyName("at")]
        public float At { get; set; }
        
        [JsonPropertyName("odds")]
        public float Odds { get; set; }
    }
    public class CatchOddsRange
    {
        [JsonPropertyName("fromLvl")]
        public int FromLvL { get; set; }
        [JsonPropertyName("data")]
        public List<CatchOddsLvlData> Data { get; set; }
    }

    public class GameplayConfig
    {
        [JsonPropertyName("levelTables")]
        public List<LevelTable> LevelTables { get; set; }

        [JsonPropertyName("healRoute_general")]
        public List<HealRouteEntry> HealRoute_General { get; set; }

        [JsonPropertyName("xpRoute_slow")]
        public List<XpRouteEntry> XpRoute_Slow { get; set; }

        [JsonPropertyName("xpRoute_fast")]
        public List<XpRouteEntry> XpRoute_Fast { get; set; }

        [JsonPropertyName("catchOddsRanges")]
        public List<CatchOddsRange> CatchOddsRanges { get; set; }

        [JsonPropertyName("battleData")]
        public BattleData BattleData { get; set; }
        
        [JsonPropertyName("mapLocations")]
        public MapLocations MapLocations { get; set; }
        
        [JsonPropertyName("healingTable")]
        public List<HealingCost> HealingTable { get; set; }
    }

    public class HealingCost
    {
        [JsonPropertyName("level")]
        public int Level { get; set; }
        
        [JsonPropertyName("healSpray")]
        public int HealSpell { get; set; }
    }

    public class LevelTable
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("lvlTable")]
        public List<LevelStat> LvlTable { get; set; }
    }

    public class LevelStat
    {
        [JsonPropertyName("lvl")]  public int Lvl { get; set; }
        [JsonPropertyName("xp")]   public int Xp { get; set; }
        [JsonPropertyName("atk")]  public int Atk { get; set; }
        [JsonPropertyName("def")]  public int Def { get; set; }
        [JsonPropertyName("aim")]  public int Aim { get; set; }
    }

    public class HealRouteEntry
    {
        [JsonPropertyName("lvl")]       public int Lvl { get; set; }
        [JsonPropertyName("healTime")]  public string HealTime { get; set; }   // "0:5:0"
        [JsonPropertyName("costDust")]  public int CostDust { get; set; }
    }

    public class XpRouteEntry
    {
        [JsonPropertyName("lvl")]       public int Lvl { get; set; }
        [JsonPropertyName("xp")]        public int Xp { get; set; }
        [JsonPropertyName("costDust")]  public int CostDust { get; set; }
    }

    public class BattleData
    {
        [JsonPropertyName("maxHP")]                 public int MaxHP { get; set; }
        [JsonPropertyName("missReduceAfterMiss")]   public int MissReduceAfterMiss { get; set; }
        [JsonPropertyName("critFactor")]            public float CritFactor { get; set; }
        [JsonPropertyName("rageFactor")]            public float RageFactor { get; set; }
        [JsonPropertyName("sickDamage")]            public int SickDamage { get; set; }
        [JsonPropertyName("backfireDamageFactor")]  public float BackfireDamageFactor { get; set; }
        [JsonPropertyName("extraDamageFactor")]     public float ExtraDamageFactor { get; set; }
        [JsonPropertyName("extraByHurtThreshold")]  public float ExtraByHurtThreshold { get; set; }
        [JsonPropertyName("lvlFactorThreshold")]    public int LvlFactorThreshold { get; set; }
        [JsonPropertyName("hypnoBackfireChance")]   public string HypnoBackfireChance { get; set; }
        [JsonPropertyName("kindFactors")]           public KindFactors KindFactors { get; set; }
        [JsonPropertyName("aiming")]                public List<AimBracket> Aiming { get; set; }
        [JsonPropertyName("xpData")]                public List<XpDelta> XpData { get; set; }
    }

    public class KindFactors
    {
        [JsonPropertyName("strong")]  public float Strong { get; set; }
        [JsonPropertyName("weak")]    public float Weak { get; set; }
        [JsonPropertyName("normal")]  public float Normal { get; set; }
    }

    public class AimBracket
    {
        [JsonPropertyName("upTo")]  public int UpTo { get; set; }
        [JsonPropertyName("miss")]  public string Miss { get; set; }   // "17:100"
        [JsonPropertyName("crit")]  public string Crit { get; set; }
    }

    public class XpDelta
    {
        [JsonPropertyName("delta")]  public int Delta { get; set; }
        [JsonPropertyName("xp")]     public int Xp { get; set; }
    }


    public static class SignUpBonus
    {
        public static List<string> Monsters = new()
        {
            "kikflick",
            "snorky",
            "torchip"
        };
        public static double CRYSTAL = 100;
        public static double GOLD = 10;
    }
    public class Point
    {
        [JsonPropertyName("name")]
        public string Node { get; set; }

        [JsonPropertyName("x")]
        public int X { get; set; }

        [JsonPropertyName("y")]
        public int Y { get; set; }

        [JsonPropertyName("monsters")]
        public List<string> Monsters { get; set; }
    }
    public class MapLocations
    {
        [JsonPropertyName("bootcamp")]
        public List<Point> Bootcamp { get; set; }

        [JsonPropertyName("riverfall")]
        public List<Point> Riverfall { get; set; }
    }



}
