using monster_world.Extentions;
using monster_world.Models;
using System.Runtime.InteropServices;
using System.Text.Json;
namespace monster_world.Services
{
    public class GameplayService
    {
        private readonly MonsterDefination  _monsterDefs;
        private readonly List<SkillDef>     _skillDefs;
        private readonly GameConfig     _gameplay;

        public GameplayService(
            MonsterDefination monsterDefs, 
            List<SkillDef> skillDefs, 
            GameConfig gameplay)
        {
            _monsterDefs = monsterDefs;
            _skillDefs   = skillDefs;
            _gameplay    = gameplay;
        }

        public GameConfig Gameplay => _gameplay;

        public List<MonsDef> GetRarityMons(string rarity)
        {
            
            if (rarity == "common")
            {
                return _monsterDefs.CommonMons;
            }
            else if ( rarity == "rare")
            {
                return _monsterDefs.RareMons;
            }
            else if ( rarity == "epic" )
            {
                return _monsterDefs.EpicMons;
            }
            else if ( rarity == "legendary")
            {
                return _monsterDefs.LegendaryMons;
            }

            return null;
        }

        public List<MonsDef> GetRandomNodeMonster(string mapid, string rarity, string node)
        {
            var mapLocation = _gameplay.MapLocations.FirstOrDefault(x => x.Key == mapid);
            if (mapLocation.Value == null) return new List<MonsDef>();

            var nodeObj = mapLocation.Value.FirstOrDefault(x => x.Node == node);
            if (nodeObj == null || nodeObj.Monsters == null) return new List<MonsDef>();

            var NodeMonsters = nodeObj.Monsters;
            List<MonsDef> monsDefs = new();

            // Try the rolled rarity first
            var primaryRarityMons = GetRarityMons(rarity);
            if (primaryRarityMons != null)
            {
                foreach (var m in primaryRarityMons)
                {
                    if (NodeMonsters.Contains(m.MonsterId))
                    {
                        monsDefs.Add(m);
                    }
                }
            }

            // Fallback to other rarities if no monsters match the rolled rarity on this node
            if (!monsDefs.Any())
            {
                string[] rarities = { "common", "rare", "epic" };
                foreach (var r in rarities)
                {
                    if (r == rarity) continue;
                    var fallbackRarityMons = GetRarityMons(r);
                    if (fallbackRarityMons != null)
                    {
                        foreach (var m in fallbackRarityMons)
                        {
                            if (NodeMonsters.Contains(m.MonsterId))
                            {
                                monsDefs.Add(m);
                            }
                        }
                    }
                    if (monsDefs.Any()) break;
                }
            }

            // Absolute fallback to first available common monster if still empty
            if (!monsDefs.Any() && _monsterDefs.CommonMons != null && _monsterDefs.CommonMons.Any())
            {
                monsDefs.Add(_monsterDefs.CommonMons.First());
            }

            return monsDefs;
        }

        public List<MapData> GetMapData()
        {
            return _gameplay.Maps;
        }

        public MonsDef GetMonsDef(string monsterid)
        {
            MonsDef monsDef = _monsterDefs.CommonMons.FirstOrDefault(x => x.MonsterId == monsterid)
                ?? _monsterDefs.RareMons.FirstOrDefault(x => x.MonsterId == monsterid)
                ?? _monsterDefs.EpicMons.FirstOrDefault(x => x.MonsterId == monsterid)
                ?? _monsterDefs.LegendaryMons.FirstOrDefault(x => x.MonsterId == monsterid);

            if (monsDef == null)
            {
                throw new InvalidOperationException($"Monster definition not found for ID: {monsterid}");
            }
            return monsDef;
        }

        public int GetTotalBudget(string rarity)
        {
            int TotalBuget = 0;
            if (rarity == "common")
            {
                TotalBuget = Extentions.Extentions.RandomBetween(_gameplay.Budget.Common, ":");
            }
            else if ( rarity == "rare")
            {
                TotalBuget = Extentions.Extentions.RandomBetween(_gameplay.Budget.Rare, ":");
            }
            else if ( rarity == "epic" )
            {
                TotalBuget = Extentions.Extentions.RandomBetween(_gameplay.Budget.Epic, ":");
            }
            else if ( rarity == "legendary" )
            {
                string sep = _gameplay.Budget.Legendary?.Contains("-") == true ? "-" : ":";
                TotalBuget = Extentions.Extentions.RandomBetween(_gameplay.Budget.Legendary, sep);
            }

            return TotalBuget;
        }

        public List<string> GetBosses()
        {
            return _gameplay.Bosses;
        }

        public List<string> GetRandomBosses(int count)
        {
            List<string> Bosses = new();
            if (_gameplay.Bosses == null || !_gameplay.Bosses.Any())
            {
                return Bosses;
            }

            int targetCount = Math.Min(count, _gameplay.Bosses.Count);
            Random rnd = new();

            while (Bosses.Count < targetCount)
            {
                string boss = _gameplay.Bosses[rnd.Next(_gameplay.Bosses.Count)];
                if (!Bosses.Contains(boss))
                {
                    Bosses.Add(boss);
                }
            }

            return Bosses;
        }

        public List<BossLvl> GetBossLevels()
        {
            return _gameplay.BossLvls;
        }

        public DateTime GetRandomBusinessHalfHour(DateTime givenDate)
        {
            DateTime baseDate = givenDate.Date;

            // 9:00 AM is the 18th half-hour block of the day (9 * 2)
            int startBlock = 18; 
            
            // 5:00 PM (17:00) is the 34th half-hour block of the day (17 * 2)
            // We use 35 as the exclusive upper bound so 17:00 is a possible result
            int endBlock = 35; 

            int randomBlock = Random.Shared.Next(startBlock, endBlock);

            return baseDate.AddMinutes(randomBlock * 30);
        }

        public string RandomRarity(string mapid)
        {
            Random rnd = new();
            var roll = rnd.NextDouble();

            var rarityChances = _gameplay.MapMonsters.FirstOrDefault(x => x.Map == mapid).RarityChance;


            foreach ( var r in rarityChances)
            {
                if (roll < r.Value)
                {
                    return r.Key;
                }
            }

            Console.WriteLine("[ALERT] Forcefully rarity common");
            return "common";
            
        }


        public Team GetTeamData()
        {
            return _gameplay.TeamData;
        }


        public SkillDef GetSkillDef(string id)
        {
            return _skillDefs.FirstOrDefault(s => s.Id == id);
        }


        public List<EmissionRate> GetEggsEmissionRates()
        {
            return _gameplay.EGGEmission;
        }

        public MonsDef RandomMons(List<MonsDef> monsDefs)
        {
            Random rnd = new Random();
            return monsDefs[rnd.Next(0, monsDefs.Count)];
        }

        public int GetMonsterXp(string monsterRole)
        {
            return Extentions.Extentions.RandomBetween(_gameplay.StatsUps.FirstOrDefault(x => x.Role == monsterRole).XP, ":");
        }

        public Stat UpStats(string role, int level)
        {
            UpStat upStat = _gameplay.StatsUps.FirstOrDefault(x => x.Role == role);

            Stat stat = new()
            {
                Atk = Extentions.Extentions.RandomBetween(upStat.Atk, ":") * (level - 1),
                Def = Extentions.Extentions.RandomBetween(upStat.Def, ":") * (level - 1),
                Spd = Extentions.Extentions.RandomBetween(upStat.Spd, ":") * (level - 1),
                HP = Extentions.Extentions.RandomBetween(upStat.HP, ":") * (level - 1)
            };
            return stat;            
        }

        // public Monster GenerateMonster(int level = 1)
        // {
        //     Random rnd = new Random();
        //     double chance = rnd.NextDouble();
    
        //     string rarity = RandomRarity();
        //     MonsDef monsDef = RandomMons(GetRarityMons(rarity));

        //     int TotalBuget = GetTotalBudget(rarity);

        //     BaseStat baseStat = _gameplay.BaseStats.FirstOrDefault(x => x.Role == monsDef.Role);

        //     Monster monster = new()
        //     {
        //         InstanceId =  Extentions.Extentions.RandomHex(),
        //         Id = monsDef.MonsterId,
        //         Title = monsDef.Title,
        //         Desc = monsDef.Desc,
        //         OwnerID = 0,
        //         Rarity = monsDef.Rarity,
        //         Role = monsDef.Role,
        //         Element = monsDef.Element,
        //         Level = level,
        //         ATK = Extentions.Extentions.RandomBetween(baseStat.Atk, ":"),
        //         DEF = Extentions.Extentions.RandomBetween(baseStat.Def, ":"),
        //         SPD = Extentions.Extentions.RandomBetween(baseStat.Spd, ":"),
        //         XP = 0,
        //         IsFighting = false,
        //         CaptureAt = DateTime.UtcNow

        //     };
        //     monster.MaxHP = TotalBuget - (monster.ATK + monster.DEF + monster.SPD);
        //     monster.HP = monster.MaxHP;
            
        //     return monster;
        // }




        public Monster CreateMonsterInstance(string monsterid, long OwnerID, int level)
        {
            MonsDef monsDef = GetMonsDef(monsterid);

            int TotalBuget = GetTotalBudget(monsDef.Rarity);

            BaseStat statDef = _gameplay.BaseStats.FirstOrDefault(x => x.Role == monsDef.Role);
            
            int baseAtk = Extentions.Extentions.RandomBetween(statDef.Atk, ":");
            int baseDef = Extentions.Extentions.RandomBetween(statDef.Def, ":");
            int baseSpd = Extentions.Extentions.RandomBetween(statDef.Spd, ":");
            int baseHP = Math.Max(1, TotalBuget - (baseAtk + baseDef + baseSpd));

            Stat upStats = UpStats(monsDef.Role, level);
            
            baseAtk += upStats.Atk;
            baseDef += upStats.Def;
            baseSpd += upStats.Spd;
            baseHP = Math.Max(1, baseHP + upStats.HP);

            int maxXP = (int)(Math.Round((100 * Math.Pow(level, 1.5)) / 100.0) * 100);

            Monster monster = new()
            {
                InstanceId =  Extentions.Extentions.RandomHex(),
                Id = monsDef.MonsterId,
                Title = monsDef.Title,
                Desc = monsDef.Desc,
                OwnerID = OwnerID,
                Rarity = monsDef.Rarity,
                Role = monsDef.Role,
                Element = monsDef.Element,
                Level = level,
                ATK = baseAtk,
                DEF = baseDef,
                SPD = baseSpd,
                MaxHP = baseHP,
                HP = baseHP,
                MaxXP = maxXP,
                XP = 0,
                IsFighting = false,
                CaptureAt = DateTime.UtcNow

            };

            return monster;

        }

        public void LevelUpMonster(Monster monster)
        {
            MonsDef monsDef = GetMonsDef(monster.Id);
            UpStat upStat = _gameplay.StatsUps.FirstOrDefault(x => x.Role == monsDef.Role);

            int atkInc = 0;
            int defInc = 0;
            int spdInc = 0;
            int hpInc = 0;

            if (upStat != null)
            {
                atkInc = Extentions.Extentions.RandomBetween(upStat.Atk, ":");
                defInc = Extentions.Extentions.RandomBetween(upStat.Def, ":");
                spdInc = Extentions.Extentions.RandomBetween(upStat.Spd, ":");
                hpInc = Extentions.Extentions.RandomBetween(upStat.HP, ":");
            }

            monster.Level++;
            monster.ATK += atkInc;
            monster.DEF += defInc;
            monster.SPD += spdInc;
            monster.MaxHP += hpInc;
            monster.HP = monster.MaxHP;
            monster.XP = 0;
            monster.MaxXP = (int)(Math.Round((100 * Math.Pow(monster.Level, 1.5)) / 100.0) * 100);
            monster.Log(monster.InstanceId, monster.Level, "levelup");
        }


        public BattleData GetBattleData()
        {
            return _gameplay.BattleData;
        }


        public double ElementMultiplier(string AttackerElement, string DefenderElement)
        {
            double bonus = _gameplay.ElementMultiplier.Same;

            if (string.IsNullOrEmpty(AttackerElement) || string.IsNullOrEmpty(DefenderElement))
            {
                Console.WriteLine("[ALERT] AttackerElemnet or DefenderElement is NULL");
                return bonus;
            }

            if (_gameplay.StrongAgainst.TryGetValue(AttackerElement, out var attackerStrongAgainst) &&
                attackerStrongAgainst.Contains(DefenderElement))
            {
                bonus = _gameplay.ElementMultiplier.Strong;
            }
            else if (_gameplay.StrongAgainst.TryGetValue(DefenderElement, out var defenderStrongAgainst) &&
                     defenderStrongAgainst.Contains(AttackerElement))
            {
                bonus = _gameplay.ElementMultiplier.Weak;
            }

            return bonus;
        }

        public Bonus GetBonusData()
        {
            return _gameplay.Bonus;
        }

        public List<string> RandomLocations(string map)
        {
            List<Point> nodes = map switch
            {
                "bootcamp" => _gameplay.MapLocations[map],
                "riverfall" => _gameplay.MapLocations[map],
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
           
            ActiveNodes.Add("BOSS"); //ading of boss node;

            return ActiveNodes;
        }

        public int CalculateHealing(Monster monster)
        {
            int CurrentHP = monster.HP;
            int MaxHP = monster.MaxHP;

            int requiredHp = MaxHP - CurrentHP;

            int requiredHealing = (int)Math.Ceiling(requiredHp / 100.0);

            return requiredHealing;
        }
        public List<string> GetLocationMonsters(string map, string node)
        {
            List<string> LocationMonsters = map switch
            {
                "bootcamp" => _gameplay.MapLocations[map].FirstOrDefault(x => x.Node == node)?.Monsters,
                "riverfall" => _gameplay.MapLocations[map].FirstOrDefault(x => x.Node == node)?.Monsters,
                _ => null
            };

            return LocationMonsters ?? new List<string>();
        }


        public bool CheckBetween(int value, string str)
        {
            int value1 = int.Parse(str.Split(":")[0]);
            int value2 = int.Parse(str.Split(":")[1]);

            return value >= value1 && value <= value2;
        }

        public double GetOddRange(Monster defendingMonster, Monster attackingMonster)
        {
            if (_gameplay.CatchOdds == null || !_gameplay.CatchOdds.Any())
            {
                throw new InvalidOperationException("CatchOdds configuration is empty or missing from gameplay config.");
            }

            var catchRange = _gameplay.CatchOdds.FirstOrDefault(x =>
                string.Equals(x.Rarity?.Trim(), defendingMonster.Rarity?.Trim(), StringComparison.OrdinalIgnoreCase));

            if (catchRange == null)
            {
                throw new InvalidOperationException($"Catch odds not configured for rarity '{defendingMonster.Rarity ?? "<null>"}'.");
            }

            int hpPercent = 0;
            if (defendingMonster.MaxHP > 0)
            {
                hpPercent = (int)Math.Round((double)defendingMonster.HP / defendingMonster.MaxHP * 100);
                hpPercent = Math.Clamp(hpPercent, 0, 100);
            }
            else
            {
                hpPercent = Math.Clamp(defendingMonster.HP, 0, 100);
            }

            var oddRange = catchRange.OddRanges.FirstOrDefault(y => CheckBetween(hpPercent, y.HpWhen));
            if (oddRange == null)
            {
                throw new InvalidOperationException($"No catch odds range found for HP% {hpPercent} (raw HP {defendingMonster.HP}, max HP {defendingMonster.MaxHP}) in rarity '{catchRange.Rarity}'.");
            }

            double baseChance = oddRange.Chance;
            if (attackingMonster == null)
            {
                return baseChance;
            }

            int levelDifference = attackingMonster.Level - defendingMonster.Level;
            double scalingFactor = 0.02; // 2% per level difference
            double levelModifier = 1.0 + (levelDifference * scalingFactor);
            levelModifier = Math.Clamp(levelModifier, 0.25, 2.0);

            return Math.Clamp(baseChance * levelModifier, 0.01, 0.99);
        }


        public Dictionary<string, ListedItems> GetShopItems()
        {
            return _gameplay.ShopItems;
        }

        public List<string> GetExchangePairs()
        {
            return _gameplay.ExchangePairs;
        }

        public List<ExchangeRate> GetExchangeRates()
        {
            return _gameplay.ExchangeRates;
        }

        public LeaderboardConfig GetLeaderboardConfig()
        {
            return _gameplay.Leaderboard;
        }




        
    

        // public BossMonster GenerateBossMonster(string rarity, int level)
        // {
        //     MonsDef monsDef = RandomMons(GetMonsterDef(rarity));  //change it to random boss

        //     BossMonster boss = new()
        //     {
        //         InstanceId = Extentions.Extentions.RandomHex(),
        //         Id = monsDef.MonsterId,
        //         BossTitle = monsDef.Title,
        //         BossDesc = monsDef.Desc,
        //         Element = monsDef.Element,
        //         Role = monsDef.Role,
        //         BossRarity = rarity,
        //         Level = level,

        //     }
        // }

    }
    
}