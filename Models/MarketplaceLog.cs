using System;
using System.ComponentModel.DataAnnotations;

namespace monster_world.Models
{
    public class MarketplaceLog
    {
        [Key]
        public Guid ID { get; set; }
        public string ActivityType { get; set; } // "List", "Buy", "Delist"
        public string ListingType { get; set; } // "monster", "item"
        public long SellerId { get; set; }
        public string? SellerUsername { get; set; }
        public long? BuyerId { get; set; }
        public string? BuyerUsername { get; set; }
        public string TargetId { get; set; } // MonsterId (e.g. "malakite") or ItemId (e.g. "MonstaBall")
        public string? MonsterInstanceId { get; set; } // Only for monsters
        public int MonsterLevel { get; set; } // Only for monsters
        public string Details { get; set; } // Human readable name
        public double Price { get; set; }
        public string Currency { get; set; }
        public int Quantity { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
