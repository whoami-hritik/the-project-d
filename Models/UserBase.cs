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
        public List<string> UnlockedWorlds { get; set; }
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
        public int Level { get; set; } = 0;
        public DateTime RegistrationDate { get; set; }
        public UserBase()
        {
            UnlockedWorlds = new List<string>()
            {
                "bootcamp",
                "riverfall"
            };
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
    }


    public class Referral
    {
        [Key]
        public Guid RefID { get; set; }
        public long ID { get; set; }
        public ICollection<long> Referrals { get; set; }
    }
    public class UserMission
    {
        [Key]
        public Guid MissionId { get; set; }
        public DateTime? StartedAt { get; set; }
        public bool Active { get; set; }
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

    public class Monster
    {
        [Key]
        public int GlobalID { get; set; }
        public string InstanceId { get; set; }      // unique per captured instance
        public string Id { get; set; }         // "armadigo" → look up MonsterDef
        public string Title { get; set; }         // denormalized for display speed
        public long OwnerID { get; set; }
        public string Kind { get; set; }
        public int Level { get; set; }
        public int XP { get; set; }
        public bool IsFighting { get; set; } = false;
        public DateTime CaptureAt { get; set; }
        public DateTime? HealTime { get; set; }
        
        // Live state
        public int CurrentHP { get; set; } = 100;        
        public List<string> Logs { get; set; } = new List<string>();


        public void Log(string monster, int level, string action)
        {
            Logs.Add(DateTime.UtcNow+"|"+monster+"|"+level+"|"+action);
        }
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