using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Numerics;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot.Types;

namespace monster_world.Models
{
    public class TelegramUser
    {
        [JsonPropertyName("id")]
        public long ID { get; set; }
        
        [JsonPropertyName("username")]
        public string Username { get; set; }

        [JsonPropertyName("first_name")]
        public string FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string LastName { get; set; }
        
        [JsonPropertyName("language_code")]
        public string LanguageCode { get; set; }

        [JsonPropertyName("allow_write_to_pm")]
        public bool AllowsWriteToPm { get; set; }

        [JsonPropertyName("photo_url")]
        public string PhotoUrl { get; set; }

    }



    public class UserBase
    {
        [Key]
        public long ID { get; set; }
        public Roles Role { get; set; } = Roles.User;
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string LanguageCode { get; set; }
        public bool AllowsWriteToPm { get; set; }
        public string PhotoUrl { get; set; }
        public Balance Balance { get; set; }
        public long TotalVictory { get; set; }
        public bool Bonus { get; set; }
        public long ReferrerID { get; set; }
        public bool ReferrerRewarded { get; set; } = false;
        public List<string> UnlockedWorlds { get; set; }
        private int _unlockedSlots = 1;
        public int UnlockedSlots
        {
            get => System.Math.Max(1, _unlockedSlots);
            set => _unlockedSlots = System.Math.Max(1, value);
        }
        private int _unlockedCollectorSlots = 1;
        public int UnlockedCollectorSlots
        {
            get => System.Math.Max(1, _unlockedCollectorSlots);
            set => _unlockedCollectorSlots = System.Math.Max(1, value);
        }
        public List<string> Monsters { get; set; }
        public Items Items { get; set; }
        public List<string> Transactions { get; set; }
        public List<string> Payloads { get; set; }
        public ICollection<Deposit> Deposits { get; set; }
        public ICollection<Withdraw> Withdraws { get; set; }
        public List<string> Missions { get; set; } 
        public int TotalBattles { get; set; }
        public int TotalCaptured { get; set; }
        public bool Tutorial { get; set; }
        public bool HasAcceptedAgreement { get; set; } = false;
        public int Level { get; set; } = 1;
        public DateTime RegistrationDate { get; set; }
        public int LoginStreak { get; set; } = 0;
        public DateTime? LastLoginDate { get; set; } = null;
        public bool StreakClaimed { get; set; } = false;
        public int DailyVictory { get; set; } = 0;
        public int DailyBattles { get; set; } = 0;
        public int DailyHealedHP { get; set; } = 0;
        public int DailyChestsOpened { get; set; } = 0;
        public UserBase()
        {
            UnlockedWorlds = new List<string>();
            Monsters = new List<string>();
            Transactions = new List<string>();
            Payloads = new List<string>();
            Deposits = new List<Deposit>();
            Withdraws = new List<Withdraw>();
            Missions = new List<string>();
            Balance = new Balance();
            Items = new Items();
            RegistrationDate = DateTime.UtcNow;
        }

        
        public void Credit(string Currency, double Amount, string Action)
        {
            // Replace entire Balance object so EF Core detects the change
            Balance = new Balance 
            { 
                TON = Currency == "TON" ? Balance.TON + Amount : Balance.TON,
                GOLD = Currency == "GOLD" ? Balance.GOLD + Amount : Balance.GOLD,
                CRYSTAL = Currency == "CRYSTAL" ? Balance.CRYSTAL + Amount : Balance.CRYSTAL,
                EGGS = Currency == "EGGS" ? Balance.EGGS + Amount : Balance.EGGS
            };

            Transactions.Add(DateTime.UtcNow+"|"+Currency+"|"+Amount+"|"+Action);
        }


        public void AddItems(string Item, int Quantity, string Action)
        {
            Items = new Items
            {
                MonstaBall = (string.Equals(Item, "MonstaBall", StringComparison.OrdinalIgnoreCase)) ? Items.MonstaBall + Quantity: Items.MonstaBall,
                RagePotion = (string.Equals(Item, "RagePotion", StringComparison.OrdinalIgnoreCase)) ? Items.RagePotion + Quantity: Items.RagePotion,
                LavaSpell = (string.Equals(Item, "LavaSpell", StringComparison.OrdinalIgnoreCase)) ? Items.LavaSpell + Quantity: Items.LavaSpell,
                AvalancheSpell = (string.Equals(Item, "AvalancheSpell", StringComparison.OrdinalIgnoreCase)) ? Items.AvalancheSpell + Quantity: Items.AvalancheSpell,
                WindSpell = (string.Equals(Item, "WindSpell", StringComparison.OrdinalIgnoreCase)) ? Items.WindSpell + Quantity: Items.WindSpell,
                WaterFallSpell = (string.Equals(Item, "WaterFallSpell", StringComparison.OrdinalIgnoreCase)) ? Items.WaterFallSpell + Quantity: Items.WaterFallSpell,
                ThunderSpell = (string.Equals(Item, "ThunderSpell", StringComparison.OrdinalIgnoreCase)) ? Items.ThunderSpell + Quantity: Items.ThunderSpell,
                DarkSpell = (string.Equals(Item, "DarkSpell", StringComparison.OrdinalIgnoreCase)) ? Items.DarkSpell + Quantity: Items.DarkSpell,
                HealSpell = (string.Equals(Item, "HealSpell", StringComparison.OrdinalIgnoreCase)) ? Items.HealSpell + Quantity: Items.HealSpell,
                Shield = (string.Equals(Item, "Shield", StringComparison.OrdinalIgnoreCase)) ? Items.Shield + Quantity: Items.Shield,
                Poison = (string.Equals(Item, "Poison", StringComparison.OrdinalIgnoreCase)) ? Items.Poison + Quantity: Items.Poison,
                Hallucinogen = (string.Equals(Item, "Hallucinogen", StringComparison.OrdinalIgnoreCase)) ? Items.Hallucinogen + Quantity: Items.Hallucinogen,
            };

            Transactions.Add(DateTime.UtcNow+"|"+Item+"|"+Quantity+"|"+Action);
        }
    }


    public class Referral
    {
        [Key]
        public Guid RefID { get; set; }
        public long ID { get; set; }
        public List<long> Referrals { get; set; } = new List<long>();
    }
    public class UserMission
    {
        [Key]
        public Guid MissionId { get; set; }
        public DateTime? StartedAt { get; set; }
        public bool Active { get; set; }
    }

    public class Mission
    {
        [Key]
        public Guid MissionId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public double RewardAmount { get; set; }
        public string RewardCurrency { get; set; }
        public string VerificationType { get; set; }
        public string VerificationUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public string Category { get; set; } = "Daily";
    }

    public class Deposit
    {
        [Key]
        public Guid Id { get; set; }
        public long UserID { get; set; }
        public double Amount { get; set; }
        public Balance Balance { get; set; }
        public bool Successful { get; set; }
        public bool Completed { get; set; }
        public string Hash { get; set; }
        public DateTime Time { get; set; }
        public DateTime SuccessfulAt { get; set; }
    }

    public class Invoice
    {
        [Key]
        public Guid InvoiceId { get; set; }
        public string Payload { get; set; } // buyhealspray=10
        public Guid ItemId { get; set; }
        public int Quantity { get; set; }
        public bool Paid { get; set; }
        public DateTime PaidAt { get; set; }
        public long BuyerId { get; set; }
        public string PayingCurrency { get; set; }
        public double PayingAmount { get; set; }
        public double AmountUSDT { get; set; }
        public DateTime ExpireAfter { get; set; }
        public bool ServiceDelivered { get; set; }

    }


    [Owned]
    public class Balance
    {
        public double TON { get; set; }
        public double GOLD { get; set; }
        public double CRYSTAL { get; set; }
        public double EGGS { get; set; }

    }

    [Owned]
    public class Items
    {
        public int MonstaBall { get; set; }
        public int RagePotion { get; set; }
        public int WindSpell { get; set; }
        public int WaterFallSpell { get; set; }
        public int AvalancheSpell { get; set; }
        public int LavaSpell { get; set; }
        public int ThunderSpell { get; set; }
        public int DarkSpell { get; set; }
        public int HealSpell { get; set; }
        public int Shield { get; set; }
        public int Poison { get; set; }
        public int Hallucinogen { get; set; }
    }

    public enum Roles
    {
        User = 0,
        Moderator = 1,
        Tester = 2,
        Administrator = 3
    }

    public class Withdraw
    {
        [Key]
        public Guid ID { get; set; }
        public long UserID { get; set; }
        public double Amount { get; set; }
        public string Currency { get; set; }
        public string Hash { get; set; }
        public bool Processing { get; set; }
        public bool Completed { get; set; }
    }

   


    // public enum MonsterType
    // {
    //     Earth   = 0,
    //     Water = 1,
    //     Desert = 2,
    //     Dark = 3,
    //     Electric = 4,
    //     Fire = 5
    // }

    
    // public enum LocationType
    // {
    //     Earth   = 0,
    //     Water = 1,
    //     Desert = 2,
    //     Dark = 3,
    //     Electric = 4,
    //     Fire = 5
    // }
    
    public enum BattleStatus
    {
        Active = 1,
        Completed = 2,
        Forfeited = 3
    }   

    //Anaytics based on USDT
    public class UserAnalytics
    {
        [Key]
        public long ID { get; set; }
        public double TotalDeposit { get; set; } = 0;
        public double TotalInvested { get; set; } = 0;
        public double TotalWithdrawn { get; set; } = 0;
        public double TotalFarm { get; set; } = 0;
        public double TotalExchanged { get; set; } = 0;

    } 
}