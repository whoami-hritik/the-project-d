using monster_world.Models;
using System.Runtime.InteropServices;
using System.Text.Json;
namespace monster_world.Services
{
    public class GameplayService
    {
        private readonly List<MonsterDef>   _monsterDefs;
        private readonly List<SkillDef>     _skillDefs;
        private readonly GameplayConfig     _gameplay;

        public GameplayService(
            List<MonsterDef> monsterDefs, 
            List<SkillDef> skillDefs, 
            GameplayConfig gameplay)
        {
            _monsterDefs = monsterDefs;
            _skillDefs   = skillDefs;
            _gameplay    = gameplay;
        }

        public MonsterDef GetMonsterDef(string id)
        {
            return _monsterDefs.FirstOrDefault(m => m.Id == id);
        }

        public SkillDef GetSkillDef(string id)
        {
            return _skillDefs.FirstOrDefault(s => s.Id == id);
        }

        // FIX 7: return the highest applicable tier (not just the first match)
        // e.g. level 12 should use fromLvl:11 tier, not fromLvl:1
        public CatchOddsRange GetCatchOddsRange(int level)
        {
            return _gameplay.CatchOddsRanges
                .Where(r => level >= r.FromLvL)
                .OrderByDescending(r => r.FromLvL)
                .FirstOrDefault();
        }

        public LevelTable GetLevelTable(string LvlTableId)
        {
            var table = _gameplay.LevelTables.FirstOrDefault(t => t.Id == LvlTableId);
            return table ?? _gameplay.LevelTables.First(t => t.Id == "common-1");
        }

        public BattleData GetBattleData()
        {
            return _gameplay.BattleData;
        }

        public List<XpRouteEntry> GetXpRouteEntries()
        {
            return _gameplay.XpRoute_Fast;
        }

        public MapLocations GetMapLocations()
        {
            return _gameplay.MapLocations;
        }
        // public string MonsterLogger()
        // {
            
        // }

        public HealingCost GetHealSprayTable(int level)
        {
            return _gameplay.HealingTable.Where(x => level >= x.Level).OrderByDescending(r => r.Level).FirstOrDefault();
        }

     
        public List<string> RandomLocations(string world)
        {
            List<Point> nodes = world switch
            {
                "bootcamp" => _gameplay.MapLocations.Bootcamp,
                "riverfall" => _gameplay.MapLocations.Riverfall,
                _ => new List<Point>()
            };

            if (!nodes.Any()) return new List<string>();

            List<string> ActiveNodes = new();
            Random random = new Random();

            while (ActiveNodes.Count < Math.Min(10, nodes.Count))
            {
                int rnd = random.Next(nodes.Count);
                if (!ActiveNodes.Contains(nodes[rnd].Node))
                {
                    ActiveNodes.Add(nodes[rnd].Node);
                }
            }

            return ActiveNodes;
        }

        public List<string> GetLocationMonsters(string world, string node)
        {
            List<string> LocationMonsters = world switch
            {
                "bootcamp" => _gameplay.MapLocations.Bootcamp.FirstOrDefault(x => x.Node == node)?.Monsters,
                "riverfall" => _gameplay.MapLocations.Riverfall.FirstOrDefault(x => x.Node == node)?.Monsters,
                _ => null
            };

            return LocationMonsters ?? new List<string>();
        }

        public Monster CreateMonsterInstance(string id, long OwnerID, int level)
        {
            var _def = GetMonsterDef(id);
            Monster monster = new()
            {
                InstanceId = Extentions.Extentions.RandomHex(),
                Id = _def.Id,
                Title = _def.Title,
                OwnerID = OwnerID,
                Kind = _def.Kind,
                Level = level,
                XP = GetXpRouteEntries().FirstOrDefault(x => level >= x.Lvl).Xp,
                IsFighting = false,
                CaptureAt = DateTime.UtcNow,
                CurrentHP = 100,
                HealTime = null
            };
            return monster;
        }

        

    


    }
    
}