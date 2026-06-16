using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace monster_world.Models
{
     public class Monster
    {
        [Key]
        public int GlobalID { get; set; }
        public string InstanceId { get; set; }      // unique per captured instance
        public string Id { get; set; }         // "armadigo" → look up MonsterDef
        public string Title { get; set; }         // denormalized for display speed
        public string Desc  { get; set; }
        public long OwnerID { get; set; }
        public string Rarity { get; set; }
        public string Role { get; set; }
        public bool IsBoss { get; set; } 
        public string Element { get; set; }
        public int Level { get; set; }
        public int MaxHP { get; set; }
        public int HP { get; set; }
        public int ATK { get; set; }
        public int DEF { get; set; }
        public int SPD { get; set; }
        public int MaxXP { get; set; }
        public int XP { get; set; }
        public bool IsFighting { get; set; } = false;
        public bool IsCaptured { get; set; } =  false;
        public DateTime CaptureAt { get; set; }   
        public List<string> Logs { get; set; } = new List<string>();


        public void HealMonster(int healing, string action)
        {
            HP = Math.Min(HP + healing, MaxHP);
            Log(InstanceId, Level, action);
        }
        public void Log(string monster, int level, string action)
        {
            Logs.Add(DateTime.UtcNow+"|"+monster+"|"+level+"|"+action);
        }

        public void AddXP(int xpAmount)
        {
            XP += xpAmount;

            if (XP >= MaxXP)
            {
                XP = MaxXP;
                return;
            }
            
           
        }

    }

}