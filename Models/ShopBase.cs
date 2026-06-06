using System.Security.Cryptography.X509Certificates;

namespace monster_world.Models
{
        public class Listed
        {
            public Guid ID { get; set; }
            public string PayloadId { get; set; }  // buyhealspray
            public string Name { get; set; }
            public string Category { get; set; }
            public string Description { get; set; }
            public double GOLD { get; set; }
            public int Stock { get; set; }
            public bool IsAvailable { get; set; }
            public DateTime AvailableTill { get; set; }
            public DateTime CreatedAt { get; set; } 
        }


        
}