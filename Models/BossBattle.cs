// using System.ComponentModel.DataAnnotations;

// namespace monster_world.Models
// {
//     public class BossBattle
//     {
//         [Key]
//         public Guid Id { get; set; }
//         public long UserID { get; set; }
//         public string MapId { get; set; }
//         public BossMonster Boss { get; set; }
//         public DateTime StartedAt { get; set; }
//         public DateTime EndAt { get; set; }
//         public string AttackingMonster { get; set; }
//         public bool Defeated { get; set; }
//         public Balance BalanceRewarded  { get; set; } = new()
//         {
//             TON = 0,
//             GOLD = 0,
//             CRYSTAL = 0,
//             EGGS = 0
//         };
//         public Items ItemsRewarded { get; set; } = new()
//         {
//             MonstaBall = 0,
//             RagePotion = 0,
//             LavaSpell = 0,
//             AvalancheSpell = 0,
//             WindSpell = 0,
//             WaterFallSpell = 0,
//             ThunderSpell = 0,
//             DarkSpell = 0,
//             HealSpell = 0,
//             Shield = 0,
//             Poison = 0,
//             Hallucinogen = 0
//         };
//     }

    // public class BossMonster
    // {
    //     public string InstanceId { get; set; }    
    //     public string Id { get; set; } 
    //     public string BossTitle { get; set; }
    //     public string BossDesc { get; set; }
    //     public string Element { get; set; }
    //     public string Role { get; set; }
    //     public string BossRarity { get; set; }
    //     public int Level { get; set; }
    //     public int HP { get; set; }
    //     public int ATK { get; set; }
    //     public int DEF { get; set; }
    //     public int SPD { get; set; }
    //     public int ENERGY { get; set; }        
    // }
// }