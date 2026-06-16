
using System.Diagnostics.Contracts;
using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json.Serialization;
using Telegram.Bot.Types;

namespace monster_world.Models
{
    // main gameplay config
    public class GameConfig
    {

        [JsonPropertyName("eggEmission")]
        public List<EmissionRate> EGGEmission { get; set; }

        [JsonPropertyName("maps")]
        public List<MapData> Maps { get; set; }

        [JsonPropertyName("mapLocations")]
        public Dictionary<string, List<Point>> MapLocations { get; set; }

        [JsonPropertyName("bosses")]
        public List<string> Bosses { get; set; }

        [JsonPropertyName("mapMonsters")]
        public List<MapMonster> MapMonsters { get; set; }
        
        [JsonPropertyName("strongAgainst")]
        public Dictionary<string, List<string>> StrongAgainst { get; set; } = new();

        [JsonPropertyName("bossLvl")]
        public List<BossLvl> BossLvls { get; set; }

        [JsonPropertyName("elementMultiplier")]
        public Multiplier ElementMultiplier { get; set; }

        [JsonPropertyName("exchange-pairs")]
        public List<string> ExchangePairs { get; set; }

        [JsonPropertyName("exchange-rate")]
        public List<ExchangeRate> ExchangeRates { get; set; }

        [JsonPropertyName("baseStat")]
        public List<BaseStat> BaseStats { get; set; }

        [JsonPropertyName("statsUp")]
        public List<UpStat> StatsUps { get; set; }

        [JsonPropertyName("rarity")]
        public List<string> AvilableRarity { get; set; }

        [JsonPropertyName("rarityMultiplier")]
        public Dictionary<string, double> RarityMultiplier { get; set; }

        [JsonPropertyName("rarityBudget")]
        public RarityBudget Budget { get; set; }

        [JsonPropertyName("battleData")]
        public BattleData BattleData { get; set; }

        [JsonPropertyName("signupBonus")]
        public Bonus Bonus { get; set; }

        [JsonPropertyName("referralRewards")]
        public ReferralRewardsConfig ReferralRewards { get; set; }

        [JsonPropertyName("catchOddRanges")]
        public List<CatchOddRange> CatchOdds { get; set; } = new();

        [JsonPropertyName("shopItems")]
        public Dictionary<string, ListedItems> ShopItems { get; set; }

        [JsonPropertyName("leaderboard")]
        public LeaderboardConfig Leaderboard { get; set; }

        [JsonPropertyName("missionToSeed")]
        public List<Mission> MissionsToSeed { get; set; } = new();
    }


    public class BossLvl
    {
        [JsonPropertyName("playerLevel")]
        public string PlayerLevel { get; set; }

        [JsonPropertyName("bossLevel")]
        public string BossLevel { get; set; }
    }

    public class EmissionRate
    {
        [JsonPropertyName("winType")]
        public string WinType { get; set; }

        [JsonPropertyName("prize")]
        public string USDTEmission { get; set; }

        [JsonPropertyName("chance")]
        public double Chance { get; set; }
    }

    public class ReferralRewardsConfig
    {
        [JsonPropertyName("referrer")]
        public Bonus Referrer { get; set; }

        [JsonPropertyName("referee")]
        public Bonus Referee { get; set; }
    }

    public class CatchOddRange
    {
        [JsonPropertyName("rarity")]
        public string Rarity { get; set; }

        [JsonPropertyName("odds")]
        public List<OddRange> OddRanges { get; set; }
    }

    public class OddRange
    {
        [JsonPropertyName("hpWhen")]
        public string HpWhen { get; set; }

        [JsonPropertyName("chance")]
        public double Chance { get; set; }
    }

    public class Bonus
    {
        [JsonPropertyName("monsters")]
        public List<string> Monsters { get; set; }

        [JsonPropertyName("currency")]
        public Dictionary<string, double> Currency { get; set; }

        [JsonPropertyName("items")]
        public Dictionary<string, int> Items { get; set; }
    }

    public class BattleData
    {
        [JsonPropertyName("rageFactor")]
        public double RageFactor { get; set; }

        [JsonPropertyName("sickDamage")]
        public int SickDamage { get; set; }

        [JsonPropertyName("extraByHurtThreshold")]
        public double ExtraByHurtThreshold { get; set; }

        [JsonPropertyName("extraDamageFactor")]
        public double ExtraDamageFactor { get; set; }

        [JsonPropertyName("hynoChanceBonus")]
        public HypnoBonus HynoBonus { get; set; }
        
        [JsonPropertyName("critChance")]
        public List<CriticalChance> CritChance { get; set; }

        [JsonPropertyName("missChance")]
        public List<MissChance> MissChance { get; set; }

        [JsonPropertyName("hypnoBackfireChance")]
        public string HypnoBackfireChance { get; set; }

        [JsonPropertyName("backfireDamageFactor")]
        public double BackfireDamageFactor { get; set; }

        [JsonPropertyName("criticalDamage")]
        public double CriticalDamage { get; set; }

        [JsonPropertyName("changeAtk")]
        public double ChangeAtk { get; set; }

        [JsonPropertyName("changeDef")]
        public double ChangeDef { get; set; }

    }

    public class CriticalChance
    {
        [JsonPropertyName("hpWhen")]
        public string HpWhen { get; set; }

        [JsonPropertyName("crit")]
        public double Crit { get; set; }
    }

    public class MissChance
    {
        [JsonPropertyName("aim")]
        public string Aim { get; set; }

        [JsonPropertyName("miss")]
        public double Miss { get; set; }
    }

    public class HypnoBonus
    {
        [JsonPropertyName("isSick")]
        public double IsSick { get; set; }

        [JsonPropertyName("isWeak")]
        public double IsWeak { get; set; }

        [JsonPropertyName("isStrong")]
        public double IsStrong { get; set; }

        [JsonPropertyName("levelDiff")]
        public string LevelDiff { get; set; }
    }
    public class SkillDefination
    {
        public List<SkillDef> Skills { get; set; }
    }

    public class SkillDef
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("desc")]
        public string Desc { get; set; }

        [JsonPropertyName("element")]
        public string Element { get; set; }

        [JsonPropertyName("effects")]
        public Effects Effects { get; set; }

        [JsonPropertyName("noMiss")]
        public bool NoMiss { get; set; } = false;

        [JsonPropertyName("extraWhen")]
        public string? ExtraWhen { get; set; } = null;

        [JsonPropertyName("noBackire")]
        public bool NoBackFire { get; set; } = false;

        [JsonPropertyName("cooldown")]
        public int Cooldown { get; set; }

        [JsonPropertyName("energyCost")]
        public int EnergyCost { get; set; }
    }

    public class Effects
    {
        [JsonPropertyName("attackMultiplier")]
        public double? AttackMultiplier { get; set; } = null;

        [JsonPropertyName("heal_percent")]
        public string? HealPercent { get; set; } = null;

        [JsonPropertyName("incr_atk")]
        public double? IncrAttack { get; set; } = null;

        [JsonPropertyName("incr_def")]
        public double? IncrDefense { get; set; } = null;

        [JsonPropertyName("incr_aim")]
        public double? IncrAim { get; set; } = null;

        [JsonPropertyName("decr_atk")]
        public double? DecrAttack { get; set; }= null;

        [JsonPropertyName("decr_def")]
        public double? DecrDefense { get; set; } = null;

        [JsonPropertyName("decr_aim")]
        public double? DecrAim { get; set; } = null;

        [JsonPropertyName("state_rage")]
        public string? StateRage { get; set; } = null;

        [JsonPropertyName("state_hypno")]
        public string? StateHypno { get; set; } = null;

        [JsonPropertyName("state_sick")]
        public string? StateSick { get; set; } = null;
    }

    public class MonsterDefination
    {
        [JsonPropertyName("common")]
        public List<MonsDef> CommonMons { get; set; }

        [JsonPropertyName("rare")]
        public List<MonsDef> RareMons { get; set; }

        [JsonPropertyName("epic")]
        public List<MonsDef> EpicMons { get; set; }

        [JsonPropertyName("legendary")]
        public List<MonsDef> LegendaryMons { get; set; }
    }

    public class MonsDef
    {
        [JsonPropertyName("monsterid")]
        public string MonsterId { get; set; }

        [JsonPropertyName("desc")]
        public string Desc { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("element")]
        public string Element { get; set; }

        [JsonPropertyName("rarity")]
        public string Rarity { get; set; }

        [JsonPropertyName("role")]
        public string Role{ get; set; }

        [JsonPropertyName("abilities")]
        public List<Ability> Abilities { get; set; }
    }

    public class MapData
    {
        [JsonPropertyName("map")]
        public string Map { get; set;}

        [JsonPropertyName("unlockCost")]
        public Dictionary<string, double> UnlockCost { get; set; }

        [JsonPropertyName("UnlockAt")]
        public int UnlockAt { get; set; }

        [JsonPropertyName("bossBattle")]
        public string BossBattle { get; set; }

        [JsonPropertyName("goldMultiplier")]
        public double GoldMultiplier { get; set; }

        [JsonPropertyName("totalItemDrops")]
        public string TotalItemDrops { get; set; }

        [JsonPropertyName("maxDropItemQuantity")]
        public string MaxDropItemQuantity { get; set; }

        [JsonPropertyName("itemsDrop")]
        public Dictionary<string, string> ItemsDrop { get; set; }
    }



    public class MapMonster
    {
        [JsonPropertyName("map")]
        public string Map { get; set; }

        [JsonPropertyName("monsters")]
        public List<string> Monsters { get; set; }

        [JsonPropertyName("rarityChance")]
        public Dictionary<string, double> RarityChance { get; set; }
    }

    public class ExchangeRate
    {
        [JsonPropertyName("pair")]
        public string Pair { get; set; }

        [JsonPropertyName("rate")]
        public string Rate { get; set; }

        [JsonPropertyName("limit")]
        public string Limit { get; set; }
    }

    public class Multiplier
    {
        [JsonPropertyName("weak")]
        public float Weak { get; set; }

        [JsonPropertyName("same")]
        public float Same { get; set; }

        [JsonPropertyName("strong")]
        public float Strong { get; set; }
    }

    public class BaseStat
    {
        [JsonPropertyName("role")]
        public string Role { get; set; }

        [JsonPropertyName("atk")]
        public string Atk { get; set; }

        [JsonPropertyName("def")]
        public string Def { get; set; }

        [JsonPropertyName("spd")]
        public string Spd { get; set; }
    }

    public class UpStat
    {
        [JsonPropertyName("role")]
        public string Role { get; set; }

        [JsonPropertyName("atk")]
        public string Atk { get; set; }

        [JsonPropertyName("def")]
        public string Def { get; set; }

        [JsonPropertyName("spd")]
        public string Spd { get; set; }

        [JsonPropertyName("hp")]
        public string HP { get; set; }

        [JsonPropertyName("xp")]
        public string XP { get; set; }
    }

    public class Stat
    {
        public int Atk { get; set; }
        public int Def { get; set; }
        public int Spd { get; set; }
        public int HP { get; set; }
    }


    public class RarityBudget
    {
        [JsonPropertyName("common")]
        public string Common { get; set; }

        [JsonPropertyName("rare")]
        public string Rare { get; set; }

        [JsonPropertyName("epic")]
        public string Epic { get; set; }
    }

    public class Ability
    {
        [JsonPropertyName("id")]
        public string SkillId { get; set; }

        [JsonPropertyName("getsAt")]
        public int GetsAt { get; set; }

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

    public class ListedItems
    {
        [JsonPropertyName("payload")]
        public string Payload { get; set; }

        [JsonPropertyName("cost")]
        public Dictionary<string, double> PurchaseCost { get; set; }
    }

    public class LeaderboardConfig
    {
        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }

        [JsonPropertyName("rewardCurrency")]
        public string RewardCurrency { get; set; }

        [JsonPropertyName("totalPool")]
        public double TotalPool { get; set; }

        [JsonPropertyName("distribution")]
        public List<LeaderboardDistribution> Distribution { get; set; } = new();
    }

    public class LeaderboardDistribution
    {
        [JsonPropertyName("rank")]
        public int Rank { get; set; }

        [JsonPropertyName("percentage")]
        public double Percentage { get; set; }
    }

}