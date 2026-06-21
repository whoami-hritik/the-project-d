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
        public DateTime LastHpRegenAt { get; set; } = DateTime.UtcNow;
        public bool IsRegenerating { get; set; } = false;
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

        public bool ApplyPassiveRegen()
        {
            if (IsFighting)
            {
                if (IsRegenerating)
                {
                    IsRegenerating = false;
                    return true;
                }
                return false;
            }

            if (!IsRegenerating)
            {
                if (HP <= 0)
                {
                    IsRegenerating = true;
                }
                else
                {
                    return false;
                }
            }

            if (HP >= MaxHP)
            {
                IsRegenerating = false;
                return false;
            }

            var now = DateTime.UtcNow;
            var regenStart = LastHpRegenAt == default(DateTime)
                ? (CaptureAt == default(DateTime) ? now : CaptureAt)
                : LastHpRegenAt;

            if (HP < 0)
            {
                HP = 0;
            }

            int ticks = (int)(now.Subtract(regenStart).TotalMinutes / 10.0);
            if (ticks <= 0)
                return false;

            int healPerTick = Math.Max(1, (int)Math.Ceiling(MaxHP * 0.05));
            int healAmount = Math.Min(healPerTick * ticks, MaxHP - HP);
            if (healAmount <= 0)
            {
                LastHpRegenAt = regenStart.AddMinutes(ticks * 10);
                return true;
            }

            HP = Math.Min(HP + healAmount, MaxHP);
            LastHpRegenAt = regenStart.AddMinutes(ticks * 10);

            if (HP >= MaxHP)
            {
                IsRegenerating = false;
            }

            Log(InstanceId, Level, "passive_heal");
            return true;
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