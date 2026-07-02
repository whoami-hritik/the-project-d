using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace monster_world.Models
{
    public class MarketplaceBase
    {
        [Key]
        public Guid ID { get; set; }
        public long SellerId { get; set; }
        public string ListingType { get; set; }
        public string? ItemId { get; set; } 
        public string? MonsterId { get; set; }
        public double Price { get; set; }
        public string Currency { get; set; }
        public int Quantity { get; set; } = 1;
        public int InitialQuantity { get; set; } = 1;
        public DateTime ListedDate { get; set; }
        public bool IsSold { get; set; } = false;
        public long BuyerId { get; set; }
        public DateTime SoldDate { get; set; }
    }
}