using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Net.Http.Headers;
using Telegram.Bot.Types;

namespace monster_world.Models
{
    public class Location
    {
        public string World { get; set; }
        public List<string> Nodes { get; set; } = new List<string>();
        public DateTime LastSpawned { get; set; }
    }
    public class WorldSpawns
    {
        public long UserId { get; set; }
        public ICollection<Location> Spawns { get; set; } = new List<Location>();
    }


    public class MapBase
    {
        [Key]
        public string MapId { get; set; }
        public double MapLiquidity { get; set; }
        public double DailyUSDTLiquidity { get; set; }
        public int TotalUsers { get; set; }
        public List<long> Users { get; set; } = new List<long>();
    }

}