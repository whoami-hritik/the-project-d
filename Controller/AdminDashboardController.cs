using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;
using monster_world.Models;
using monster_world.Filters;
using monster_world.Services;

namespace monster_world.Controller
{
    [ApiController]
    [Route("api/admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GameplayService _gameplayService;
        private readonly TGBOT.TelegramBot _tgbot;

        public AdminDashboardController(AppDbContext context, GameplayService gameplayService, TGBOT.TelegramBot tgbot)
        {
            _context = context;
            _gameplayService = gameplayService;
            _tgbot = tgbot;
        }

        private bool IsAuthorized()
        {
            if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                return false;
            }

            var token = authHeader.ToString().Replace("Bearer ", "").Trim();
            var expectedPassword = System.Environment.GetEnvironmentVariable("RESET_PASSWORD") ?? "AdminDBReset2026!";
            return token == expectedPassword;
        }

        [HttpPost("verify")]
        public IActionResult VerifyPassword([FromBody] Dictionary<string, string> payload)
        {
            if (payload == null || !payload.TryGetValue("password", out var password))
            {
                return BadRequest(new { success = false, message = "Password is required" });
            }

            var expectedPassword = System.Environment.GetEnvironmentVariable("RESET_PASSWORD") ?? "AdminDBReset2026!";
            if (password == expectedPassword)
            {
                return Ok(new { success = true });
            }

            return Unauthorized(new { success = false, message = "Invalid credentials" });
        }

        [HttpGet("search-users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string query)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            IQueryable<UserBase> dbQuery = _context.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query))
            {
                string searchLower = query.Trim().ToLower();
                if (long.TryParse(searchLower, out long uid))
                {
                    dbQuery = dbQuery.Where(u => u.ID == uid || 
                                                 (u.Username != null && u.Username.ToLower().Contains(searchLower)) ||
                                                 (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                                                 (u.LastName != null && u.LastName.ToLower().Contains(searchLower)));
                }
                else
                {
                    dbQuery = dbQuery.Where(u => (u.Username != null && u.Username.ToLower().Contains(searchLower)) ||
                                                 (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                                                 (u.LastName != null && u.LastName.ToLower().Contains(searchLower)));
                }
            }

            var users = await dbQuery
                .OrderByDescending(u => u.RegistrationDate)
                .Take(50)
                .Select(u => new
                {
                    u.ID,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    u.Role,
                    u.RegistrationDate,
                    Balance = new { u.Balance.TON, u.Balance.GOLD, u.Balance.EGGS, u.Balance.CRYSTAL }
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("user-details/{userId}")]
        public async Task<IActionResult> GetUserDetails(long userId)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ID == userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Fetch user analytics
            var analytics = await _context.Analytics
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.ID == userId) ?? new UserAnalytics { ID = userId };

            // Fetch deposits
            var deposits = await _context.Deposits
                .AsNoTracking()
                .Where(d => d.UserID == userId)
                .OrderByDescending(d => d.Time)
                .ToListAsync();

            // Fetch withdrawals
            var withdrawals = await _context.Withdraws
                .AsNoTracking()
                .Where(w => w.UserID == userId)
                .OrderByDescending(w => w.ID) // Order by some sorting criteria
                .ToListAsync();

            // Parse transaction history and calculate currency/item added & utilized summary
            var parsedTransactions = new List<object>();
            var summary = new Dictionary<string, object>();

            if (user.Transactions != null)
            {
                foreach (var tx in user.Transactions)
                {
                    var parts = tx.Split('|');
                    if (parts.Length >= 4)
                    {
                        string timestamp = parts[0];
                        string name = parts[1];
                        if (double.TryParse(parts[2], out double amount))
                        {
                            string action = parts[3];
                            string type = amount >= 0 ? "Added" : "Utilized";

                            parsedTransactions.Add(new
                            {
                                Timestamp = timestamp,
                                Name = name,
                                Amount = amount,
                                Action = action,
                                Type = type
                            });

                            if (!summary.ContainsKey(name))
                            {
                                summary[name] = new { Added = 0.0, Utilized = 0.0 };
                            }

                            var currentObj = summary[name];
                            double addedVal = (double)currentObj.GetType().GetProperty("Added").GetValue(currentObj);
                            double utilizedVal = (double)currentObj.GetType().GetProperty("Utilized").GetValue(currentObj);

                            if (amount >= 0)
                            {
                                addedVal += amount;
                            }
                            else
                            {
                                utilizedVal += Math.Abs(amount);
                            }

                            summary[name] = new { Added = addedVal, Utilized = utilizedVal };
                        }
                    }
                }
            }

            // Fetch referrals
            var referrals = await _context.Users
                .AsNoTracking()
                .Where(u => u.ReferrerID == userId)
                .Select(u => new
                {
                    u.ID,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    Balance = new { u.Balance.TON, u.Balance.GOLD, u.Balance.EGGS },
                    TotalDeposits = _context.Deposits.Where(d => d.UserID == u.ID && d.Successful).Sum(d => d.Amount),
                    TotalWithdrawals = _context.Withdraws.Where(w => w.UserID == u.ID && w.Completed).Sum(w => w.Amount)
                })
                .ToListAsync();

            // Fetch user's monsters
            var monsters = await _context.Monsters
                .AsNoTracking()
                .Where(m => m.OwnerID == userId)
                .Select(m => new {
                    m.InstanceId,
                    m.Id,
                    m.Title,
                    m.Level,
                    m.XP,
                    m.MaxXP,
                    m.HP,
                    m.MaxHP,
                    m.ATK,
                    m.DEF,
                    m.SPD,
                    m.Rarity,
                    m.Element,
                    m.IsFighting,
                    m.StakedInCollector,
                    m.CollectorFocus,
                    m.CollectorDepositTime,
                    m.CollectorLastClaimTime
                })
                .ToListAsync();

            // Return everything
            return Ok(new
            {
                User = user,
                Analytics = analytics,
                Deposits = deposits,
                Withdrawals = withdrawals,
                Transactions = parsedTransactions,
                Summary = summary,
                Referrals = referrals,
                Monsters = monsters
            });
        }

        [HttpGet("overview-stats")]
        public async Task<IActionResult> GetOverviewStats()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            int totalUsers = await _context.Users.CountAsync();
            
            // Deposits (TON and USDT)
            double totalDepositsTon = await _context.Deposits.Where(d => d.Successful || d.Completed).SumAsync(d => d.Amount);
            double totalDepositsUsdt = await _context.Analytics.SumAsync(a => a.TotalDeposit);
            
            // Withdrawals (EGGS and TON)
            double totalWithdrawalsEggs = await _context.Withdraws.Where(w => w.Completed && w.Currency == "EGGS").SumAsync(w => w.Amount);
            double totalWithdrawalsTon = await _context.Withdraws.Where(w => w.Completed && w.Currency == "TON").SumAsync(w => w.Amount);
            
            // Total Eggs (pool supply + user balances in circulation)
            double totalEggsPool = 0;
            var pool = await _context.Pool.FirstOrDefaultAsync(x => x.PoolID == 1);
            if (pool != null)
            {
                totalEggsPool = pool.TotalEGGS;
            }
            double totalEggsCirculation = await _context.Users.SumAsync(u => u.Balance.EGGS);
            double totalEggsCombined = totalEggsPool + totalEggsCirculation;

            // Total Gold
            double totalGoldCirculation = await _context.Users.SumAsync(u => u.Balance.GOLD);

            // Total Crystal
            double totalCrystalCirculation = await _context.Users.SumAsync(u => u.Balance.CRYSTAL);

            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalDepositsTon = totalDepositsTon,
                TotalDepositsUsdt = totalDepositsUsdt,
                TotalWithdrawalsEggs = totalWithdrawalsEggs,
                TotalWithdrawalsTon = totalWithdrawalsTon,
                TotalEggsPool = totalEggsPool,
                TotalEggsCirculation = totalEggsCirculation,
                TotalEggsCombined = totalEggsCombined,
                TotalGoldCirculation = totalGoldCirculation,
                TotalCrystalCirculation = totalCrystalCirculation
            });
        }

        public class UpdateUserPayload
        {
            public long ID { get; set; }
            public int Level { get; set; }
            public double TON { get; set; }
            public double GOLD { get; set; }
            public double CRYSTAL { get; set; }
            public double EGGS { get; set; }
        }

        [HttpPost("update-user")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserPayload payload)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == payload.ID);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.Level = payload.Level;
            user.Balance = new Balance
            {
                TON = payload.TON,
                GOLD = payload.GOLD,
                CRYSTAL = payload.CRYSTAL,
                EGGS = payload.EGGS
            };

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        public class UpdateMonsterPayload
        {
            public string InstanceId { get; set; }
            public int Level { get; set; }
            public int HP { get; set; }
            public int MaxHP { get; set; }
            public int XP { get; set; }
            public int MaxXP { get; set; }
            public int ATK { get; set; }
            public int DEF { get; set; }
            public int SPD { get; set; }
            public bool? IsFighting { get; set; }
        }

        [HttpPost("update-monster")]
        public async Task<IActionResult> UpdateMonster([FromBody] UpdateMonsterPayload payload)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var monster = await _context.Monsters.FirstOrDefaultAsync(m => m.InstanceId == payload.InstanceId);
            if (monster == null)
            {
                return NotFound(new { message = "Monster not found" });
            }

            int targetLevel = payload.Level;
            if (targetLevel > 30) targetLevel = 30;
            if (targetLevel < 1) targetLevel = 1;

            if (monster.Level != targetLevel)
            {
                _gameplayService.RecalculateMonsterStats(monster, targetLevel);
            }
            else
            {
                monster.Level = targetLevel;
                monster.HP = payload.HP;
                monster.MaxHP = payload.MaxHP;
                monster.XP = payload.XP;
                monster.MaxXP = payload.MaxXP;
                monster.ATK = payload.ATK;
                monster.DEF = payload.DEF;
                monster.SPD = payload.SPD;
            }

            if (payload.IsFighting.HasValue)
            {
                monster.IsFighting = payload.IsFighting.Value;
            }

            _context.Monsters.Update(monster);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpGet("search-monster")]
        public async Task<IActionResult> SearchMonster([FromQuery] string query)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Query is required" });
            }

            string searchLower = query.Trim().ToLower();

            // Try exact match on InstanceId first
            var monster = await _context.Monsters
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.InstanceId == query);

            if (monster != null)
            {
                return Ok(new
                {
                    success = true,
                    exactMatch = true,
                    Monster = monster,
                    OwnerId = monster.OwnerID
                });
            }

            // Otherwise, search for monsters by their general ID (e.g. "malakite") or Title
            var monsters = await _context.Monsters
                .AsNoTracking()
                .Where(m => m.Id.ToLower() == searchLower || (m.Title != null && m.Title.ToLower().Contains(searchLower)))
                .Take(50)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                exactMatch = false,
                Monsters = monsters
            });
        }

        [HttpGet("crystal-leaderboard")]
        public async Task<IActionResult> GetCrystalLeaderboard()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var leaderboard = await _context.Users
                .AsNoTracking()
                .OrderByDescending(u => u.Balance.CRYSTAL)
                .Take(100)
                .Select(u => new
                {
                    u.ID,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    Crystals = u.Balance.CRYSTAL,
                    Gold = u.Balance.GOLD,
                    Eggs = u.Balance.EGGS,
                    u.Level
                })
                .ToListAsync();

            return Ok(leaderboard);
        }

        [HttpGet("collector-overview")]
        public async Task<IActionResult> GetCollectorOverview()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var activeMap = GetActiveExhibitionMap();

            // Load all monsters that are staked or on cooldown
            var monsters = await _context.Monsters
                .AsNoTracking()
                .Where(m => m.StakedInCollector || (m.CollectorDepositTime.HasValue && DateTime.UtcNow < m.CollectorDepositTime.Value))
                .ToListAsync();

            // Load all users who either have collector monsters, or have unlocked > 1 slot in any rarity
            var userIdsWithMonsters = monsters.Select(m => m.OwnerID).Distinct().ToList();
            
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => u.UnlockedCommonSlots > 1 || u.UnlockedRareSlots > 0 || u.UnlockedEpicSlots > 0 || u.UnlockedLegendarySlots > 0 || userIdsWithMonsters.Contains(u.ID))
                .ToListAsync();

            var result = new List<object>();

            foreach (var user in users)
            {
                var userMonsters = monsters.Where(m => m.OwnerID == user.ID).ToList();
                var staked = new List<object>();
                var cooldown = new List<object>();

                // Parse transactions to get already collected farm for this player
                double totalGoldCollected = 0;
                double totalCrystalCollected = 0;
                if (user.Transactions != null)
                {
                    foreach (var tx in user.Transactions)
                    {
                        var parts = tx.Split('|');
                        if (parts.Length >= 4)
                        {
                            string currency = parts[1];
                            if (double.TryParse(parts[2], out double amount))
                            {
                                string action = parts[3];
                                if (action.Contains("collector_claim") || action.Contains("collector_unstake"))
                                {
                                    if (currency == "GOLD") totalGoldCollected += amount;
                                    if (currency == "CRYSTAL") totalCrystalCollected += amount;
                                }
                            }
                        }
                    }
                }

                foreach (var m in userMonsters)
                {
                    if (m.StakedInCollector)
                    {
                        var yield = CalculateMonsterYield(m, activeMap);
                        staked.Add(new
                        {
                            m.InstanceId,
                            m.Id,
                            m.Title,
                            m.Level,
                            m.Rarity,
                            m.Element,
                            m.CollectorFocus,
                            m.CollectorDepositTime,
                            m.CollectorLastClaimTime,
                            GoldRate = Math.Round(yield.GoldRate, 2),
                            CrystalRate = Math.Round(yield.CrystalRate, 2),
                            GoldToCollect = Math.Round(yield.Gold, 4),
                            CrystalToCollect = Math.Round(yield.Crystal, 4)
                        });
                    }
                    else if (m.CollectorDepositTime.HasValue && DateTime.UtcNow < m.CollectorDepositTime.Value)
                    {
                        var remaining = m.CollectorDepositTime.Value - DateTime.UtcNow;
                        cooldown.Add(new
                        {
                            m.InstanceId,
                            m.Id,
                            m.Title,
                            m.Level,
                            m.Rarity,
                            m.Element,
                            m.CollectorDepositTime, // Cooldown end time
                            RemainingSeconds = Math.Max(0, (int)remaining.TotalSeconds),
                            RemainingFormatted = $"{(int)remaining.TotalHours}h {remaining.Minutes}m"
                        });
                    }
                }

                result.Add(new
                {
                    UserId = user.ID,
                    user.Username,
                    user.FirstName,
                    user.LastName,
                    user.UnlockedCommonSlots,
                    user.UnlockedRareSlots,
                    user.UnlockedEpicSlots,
                    user.UnlockedLegendarySlots,
                    Crystals = user.Balance?.CRYSTAL ?? 0,
                    GoldCollected = Math.Round(totalGoldCollected, 4),
                    CrystalCollected = Math.Round(totalCrystalCollected, 4),
                    Staked = staked,
                    Cooldown = cooldown
                });
            }

            return Ok(new
            {
                ActiveMap = activeMap,
                Overview = result
            });
        }

        private string GetActiveExhibitionMap()
        {
            var maps = _gameplayService.GetMapData();
            if (maps == null || maps.Count == 0) return "bootcamp";
            int index = DateTime.UtcNow.DayOfYear % maps.Count;
            return maps[index].Map;
        }

        private double GetRarityMultiplier(string rarity)
        {
            if (string.IsNullOrEmpty(rarity)) return 1.0;
            return rarity.ToLower() switch
            {
                "common" => 1.0,
                "rare" => 1.2,
                "epic" => 1.4,
                "legendary" => 1.8,
                _ => 1.0
            };
        }

        private double GetDeterministicRate(string rangeStr, string seedInput)
        {
            if (string.IsNullOrEmpty(rangeStr)) return 0;
            
            if (!rangeStr.Contains("-"))
            {
                if (double.TryParse(rangeStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double val))
                {
                    return val;
                }
                return 0;
            }
            
            var parts = rangeStr.Split('-');
            if (parts.Length == 2 &&
                double.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double min) &&
                double.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double max))
            {
                int hash = seedInput.GetHashCode();
                var rand = new Random(hash);
                double fraction = rand.NextDouble();
                return min + fraction * (max - min);
            }
            
            return 0;
        }

        private (double Gold, double Crystal, double GoldRate, double CrystalRate) CalculateMonsterYield(Monster monster, string activeMap)
        {
            var eligibleIds = GetEligibleCollectorMonsters();
            double levelMult = _gameplayService.GetCollectorLevelMultiplier(monster.Level);
            double goldRate = 0;
            double crystalRate = 0;

            var CollectorRarity = _gameplayService.GetCollectorRarity(monster.Rarity);
            if (CollectorRarity != null)
            {
                double baseGold = CollectorRarity.Farm.ContainsKey("GOLD") ? GetDeterministicRate(CollectorRarity.Farm["GOLD"], monster.InstanceId + "_GOLD") : 0;
                double baseCrystal = CollectorRarity.Farm.ContainsKey("CRYSTAL") ? GetDeterministicRate(CollectorRarity.Farm["CRYSTAL"], monster.InstanceId + "_CRYSTAL") : 0;

                goldRate = baseGold * levelMult;
                crystalRate = baseCrystal * levelMult;
            }

            if (eligibleIds == null || !eligibleIds.Contains(monster.Id.ToLower()))
            {
                return (0, 0, 0, 0);
            }

            double elapsedHours = 0;
            if (monster.StakedInCollector && monster.CollectorLastClaimTime.HasValue)
            {
                elapsedHours = (DateTime.UtcNow - monster.CollectorLastClaimTime.Value).TotalHours;
                if (elapsedHours < 0) elapsedHours = 0;

                var collectorConfig = _gameplayService.GetCollectorData();
                double capHours = collectorConfig?.FarmingCapHours ?? 1.0;
                if (elapsedHours > capHours) elapsedHours = capHours;
            }

            double yieldHours = (elapsedHours >= 1.0 && monster.CollectionHourCap > 0) ? 1.0 : 0.0;

            double goldEarned = yieldHours * goldRate;
            double crystalEarned = yieldHours * crystalRate;

            return (goldEarned, crystalEarned, goldRate, crystalRate);
        }

        private List<string> GetEligibleCollectorMonsters()
        {
            var collectorConfig = _gameplayService.GetCollectorData();
            int rotationDays = collectorConfig?.RotationDays ?? 3;
            
            long unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            long epoch = unixTime / (rotationDays * 24 * 3600);
            
            var rnd = new Random((int)(epoch % int.MaxValue));
            var eligibleList = new List<string>();
            
            var mapMonstersList = _gameplayService.Gameplay.MapMonsters;
            if (mapMonstersList == null) return eligibleList;
            
            var commonIds = _gameplayService.GetRarityMons("common")?.Select(m => m.MonsterId?.ToLower()).Where(id => id != null).ToList() ?? new List<string>();
            var rareIds = _gameplayService.GetRarityMons("rare")?.Select(m => m.MonsterId?.ToLower()).Where(id => id != null).ToList() ?? new List<string>();
            var epicIds = _gameplayService.GetRarityMons("epic")?.Select(m => m.MonsterId?.ToLower()).Where(id => id != null).ToList() ?? new List<string>();
            var legendaryIds = _gameplayService.GetRarityMons("legendary")?.Select(m => m.MonsterId?.ToLower()).Where(id => id != null).ToList() ?? new List<string>();

            foreach (var mapInfo in mapMonstersList)
            {
                var distinctMapMons = mapInfo.Monsters?.Select(id => id.ToLower()).Distinct().ToList();
                if (distinctMapMons == null || distinctMapMons.Count == 0) continue;
                
                var mapCommons = distinctMapMons.Where(id => commonIds.Contains(id)).ToList();
                var mapRares = distinctMapMons.Where(id => rareIds.Contains(id)).ToList();
                var mapEpics = distinctMapMons.Where(id => epicIds.Contains(id)).ToList();
                var mapLegendaries = distinctMapMons.Where(id => legendaryIds.Contains(id)).ToList();
                
                if (mapCommons.Any())
                {
                    var unused = mapCommons.Where(id => !eligibleList.Contains(id)).ToList();
                    eligibleList.Add(unused.Any() ? unused[rnd.Next(unused.Count)] : mapCommons[rnd.Next(mapCommons.Count)]);
                }
                if (mapRares.Any())
                {
                    var unused = mapRares.Where(id => !eligibleList.Contains(id)).ToList();
                    eligibleList.Add(unused.Any() ? unused[rnd.Next(unused.Count)] : mapRares[rnd.Next(mapRares.Count)]);
                }
                if (mapEpics.Any())
                {
                    var unused = mapEpics.Where(id => !eligibleList.Contains(id)).ToList();
                    eligibleList.Add(unused.Any() ? unused[rnd.Next(unused.Count)] : mapEpics[rnd.Next(mapEpics.Count)]);
                }
                if (mapLegendaries.Any())
                {
                    var unused = mapLegendaries.Where(id => !eligibleList.Contains(id)).ToList();
                    eligibleList.Add(unused.Any() ? unused[rnd.Next(unused.Count)] : mapLegendaries[rnd.Next(mapLegendaries.Count)]);
                }
            }
            
            return eligibleList.Select(id => id.ToLower()).Distinct().ToList();
        }

        private async Task ProcessExpiredCollectorStakes(long userId)
        {
            // Disabled under the 1-hour claim cycle mechanism (monsters remain staked indefinitely)
            await Task.CompletedTask;
        }

        public class AdminStakePayload
        {
            public long UserId { get; set; }
            public string MonsterId { get; set; }
            public string Focus { get; set; } = "GOLD";
        }

        [HttpPost("collector-stake")]
        public async Task<IActionResult> AdminStakeMonster([FromBody] AdminStakePayload payload)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            if (payload == null || string.IsNullOrEmpty(payload.MonsterId))
            {
                return BadRequest(new { success = false, reason = "invalid request parameters" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == payload.UserId);
            if (user == null)
            {
                return NotFound(new { success = false, reason = "User not found" });
            }

            await ProcessExpiredCollectorStakes(user.ID);

            var monster = await _context.Monsters
                .FirstOrDefaultAsync(m => m.OwnerID == user.ID && m.InstanceId == payload.MonsterId);

            if (monster == null)
            {
                return Ok(new { success = false, reason = "monster not found or not owned by user" });
            }

            if (!monster.StakedInCollector && monster.CollectorDepositTime.HasValue && DateTime.UtcNow < monster.CollectorDepositTime.Value)
            {
                var remainingSec = (monster.CollectorDepositTime.Value - DateTime.UtcNow).TotalSeconds;
                int hours = (int)(remainingSec / 3600);
                int minutes = (int)((remainingSec % 3600) / 60);
                return Ok(new { success = false, reason = $"Monster is on staking cooldown. Available in {hours}h {minutes}m." });
            }

            var eligibleIds = GetEligibleCollectorMonsters();
            if (!eligibleIds.Contains(monster.Id.ToLower()))
            {
                return Ok(new { success = false, reason = "This monster species is not eligible for the current exhibition." });
            }

            if (monster.StakedInCollector)
            {
                return Ok(new { success = false, reason = "monster is already staked in the collector" });
            }

            if (monster.IsFighting)
            {
                return Ok(new { success = false, reason = "monster is currently in a battle" });
            }

            string rarity = monster.Rarity?.ToLower() ?? "common";
            int currentlyStakedCount = await _context.Monsters
                .CountAsync(m => m.OwnerID == user.ID && m.StakedInCollector && (m.Rarity ?? "common").ToLower() == rarity);

            int allowedSlots = rarity switch
            {
                "common" => user.UnlockedCommonSlots,
                "rare" => user.UnlockedRareSlots,
                "epic" => user.UnlockedEpicSlots,
                "legendary" => user.UnlockedLegendarySlots,
                _ => 0
            };

            if (currentlyStakedCount >= allowedSlots)
            {
                return Ok(new { success = false, reason = $"all unlocked {rarity} collector slots are occupied" });
            }

            string focus = "GOLD";
            if (monster.Rarity?.ToLower() == "rare" && !string.IsNullOrEmpty(payload.Focus))
            {
                if (payload.Focus.ToUpper() == "CRYSTAL")
                {
                    focus = "CRYSTAL";
                }
            }

            monster.StakedInCollector = true;
            monster.CollectorDepositTime = DateTime.UtcNow;
            monster.CollectorLastClaimTime = DateTime.UtcNow;
            monster.CollectorFocus = focus;

            if (!user.StakedMonsters.Contains(monster.InstanceId))
            {
                user.StakedMonsters.Add(monster.InstanceId);
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, monster });
        }

        public class AdminClaimPayload
        {
            public long UserId { get; set; }
            public string MonsterId { get; set; }
        }

        [HttpPost("collector-claim")]
        public async Task<IActionResult> AdminClaimRewards([FromBody] AdminClaimPayload payload)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == payload.UserId);
            if (user == null)
            {
                return NotFound(new { success = false, reason = "User not found" });
            }

            await ProcessExpiredCollectorStakes(user.ID);

            var activeMap = GetActiveExhibitionMap();
            List<Monster> monstersToClaim = new();

            if (payload != null && !string.IsNullOrEmpty(payload.MonsterId))
            {
                var monster = await _context.Monsters
                    .FirstOrDefaultAsync(m => m.OwnerID == user.ID && m.InstanceId == payload.MonsterId && m.StakedInCollector);
                if (monster != null)
                {
                    monstersToClaim.Add(monster);
                }
            }
            else
            {
                monstersToClaim = await _context.Monsters
                    .Where(m => m.OwnerID == user.ID && m.StakedInCollector)
                    .ToListAsync();
            }

            if (monstersToClaim.Count == 0)
            {
                return Ok(new { success = false, reason = "no staked monsters found to claim rewards for" });
            }

            double totalGold = 0;
            double totalCrystal = 0;

            foreach (var monster in monstersToClaim)
            {
                var yield = CalculateMonsterYield(monster, activeMap);
                totalGold += yield.Gold;
                totalCrystal += yield.Crystal;

                monster.CollectorLastClaimTime = DateTime.UtcNow;
            }

            if (totalGold > 0)
            {
                user.Credit("GOLD", Math.Round(totalGold, 4), "admin_collector_claim_gold");
            }
            if (totalCrystal > 0)
            {
                user.Credit("CRYSTAL", Math.Round(totalCrystal, 4), "admin_collector_claim_crystal");
            }

            await _context.SaveChangesAsync();

            return Ok(new {
                success = true,
                goldClaimed = Math.Round(totalGold, 4),
                crystalClaimed = Math.Round(totalCrystal, 4)
            });
        }

        public class AdminUnstakePayload
        {
            public long UserId { get; set; }
            public string MonsterId { get; set; }
        }

        [HttpPost("collector-unstake")]
        public async Task<IActionResult> AdminUnstakeMonster([FromBody] AdminUnstakePayload payload)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            if (payload == null || string.IsNullOrEmpty(payload.MonsterId))
            {
                return BadRequest(new { success = false, reason = "invalid request parameters" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == payload.UserId);
            if (user == null)
            {
                return NotFound(new { success = false, reason = "User not found" });
            }

            await ProcessExpiredCollectorStakes(user.ID);

            var monster = await _context.Monsters
                .FirstOrDefaultAsync(m => m.OwnerID == user.ID && m.InstanceId == payload.MonsterId && m.StakedInCollector);

            if (monster == null)
            {
                return Ok(new { success = false, reason = "staked monster not found or not owned by user" });
            }

            var activeMap = GetActiveExhibitionMap();
            var yield = CalculateMonsterYield(monster, activeMap);

            if (yield.Gold > 0)
            {
                user.Credit("GOLD", Math.Round(yield.Gold, 4), $"admin_collector_unstake_gold={monster.InstanceId}");
            }
            if (yield.Crystal > 0)
            {
                user.Credit("CRYSTAL", Math.Round(yield.Crystal, 4), $"admin_collector_unstake_crystal={monster.InstanceId}");
            }

            monster.StakedInCollector = false;
            if (monster.CollectorDepositTime.HasValue)
            {
                var stakedDuration = DateTime.UtcNow - monster.CollectorDepositTime.Value;
                if (stakedDuration < TimeSpan.Zero) stakedDuration = TimeSpan.Zero;
                if (stakedDuration.TotalHours > 24.0) stakedDuration = TimeSpan.FromHours(24.0);
                monster.CollectorDepositTime = DateTime.UtcNow.Add(stakedDuration);
            }
            else
            {
                monster.CollectorDepositTime = null;
            }
            monster.CollectorLastClaimTime = null;

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("reset-overleveled-monsters")]
        public async Task<IActionResult> ResetOverleveledMonsters()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var overleveledMonsters = await _context.Monsters
                .Where(m => m.Level > 30)
                .ToListAsync();

            int count = overleveledMonsters.Count;

            foreach (var monster in overleveledMonsters)
            {
                _gameplayService.RecalculateMonsterStats(monster, 30);
                _context.Monsters.Update(monster);
            }

            if (count > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, count = count });
        }

        [HttpGet("withdrawals")]
        public async Task<IActionResult> GetWithdrawals()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var withdrawals = await _context.Withdraws
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new
                {
                    w.ID,
                    w.UserID,
                    w.Amount,
                    w.Currency,
                    w.WalletAddress,
                    w.Status,
                    w.CreatedAt,
                    w.PlayerStatsJson
                })
                .ToListAsync();

            return Ok(withdrawals);
        }

        [HttpPost("withdrawals/approve/{id}")]
        public async Task<IActionResult> ApproveWithdrawal(Guid id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var request = await _context.Withdraws.FirstOrDefaultAsync(w => w.ID == id);
            if (request == null)
            {
                return NotFound(new { success = false, message = "Withdrawal request not found" });
            }

            if (request.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Request already processed" });
            }

            request.Status = "Completed";
            request.Completed = true;
            request.Processing = false;

            // Update user analytics withdrawn total
            var analytics = await _context.Analytics.FirstOrDefaultAsync(a => a.ID == request.UserID);
            if (analytics != null)
            {
                analytics.TotalWithdrawn += request.Amount;
                _context.Analytics.Update(analytics);
            }

            await _context.SaveChangesAsync();

            // Notify user via Telegram Bot
            try
            {
                string userMsg = $"✅ <b>Withdrawal Approved!</b>\n\n" +
                                  $"Your withdrawal request for <b>{request.Amount:F4} {request.Currency}</b> (Net Payout: <b>{request.NetAmount:F4} {request.Currency}</b> after fee) to wallet <code>{request.WalletAddress}</code> has been approved and processed successfully!";
                await _tgbot.Notify(request.UserID, userMsg);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify user about withdrawal approval: {ex.Message}");
            }

            return Ok(new { success = true });
        }

        [HttpPost("withdrawals/decline/{id}")]
        public async Task<IActionResult> DeclineWithdrawal(Guid id)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var request = await _context.Withdraws.FirstOrDefaultAsync(w => w.ID == id);
            if (request == null)
            {
                return NotFound(new { success = false, message = "Withdrawal request not found" });
            }

            if (request.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Request already processed" });
            }

            request.Status = "Declined";
            request.Completed = false;
            request.Processing = false;

            // Refund the user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == request.UserID);
            if (user != null)
            {
                user.Credit(request.Currency, request.Amount, $"withdraw_decline_refund={request.Amount}");
                _context.Users.Update(user);
            }

            await _context.SaveChangesAsync();

            // Notify user via Telegram Bot
            try
            {
                string userMsg = $"❌ <b>Withdrawal Declined</b>\n\n" +
                                  $"Your withdrawal request for <b>{request.Amount:F4} {request.Currency}</b> has been declined. The amount has been refunded back to your game balance.";
                await _tgbot.Notify(request.UserID, userMsg);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TELEGRAM_BOT] Failed to notify user about withdrawal decline: {ex.Message}");
            }

            return Ok(new { success = true });
        }

        [HttpPost("adjust-levels")]
        public async Task<IActionResult> AdjustLevels()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var users = await _context.Users.ToListAsync();
            int updatedCount = 0;

            foreach (var user in users)
            {
                int cumulativeXp = user.XP;
                int level = 1;
                int maxXp = 100;

                while (cumulativeXp >= maxXp)
                {
                    cumulativeXp -= maxXp;
                    level++;
                    if (level >= 30)
                    {
                        level = 30;
                        maxXp = (int)(Math.Round((100 * Math.Pow(level, 1.5)) / 100.0) * 100);
                        cumulativeXp = maxXp;
                        break;
                    }
                    maxXp = (int)(Math.Round((100 * Math.Pow(level, 1.5)) / 100.0) * 100);
                }

                user.Level = level;
                user.XP = cumulativeXp;
                user.MaxXP = maxXp;
                
                _context.Users.Update(user);
                updatedCount++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Successfully adjusted levels for {updatedCount} players." });
        }

        [HttpPost("adjust-monsters")]
        public async Task<IActionResult> AdjustMonsters()
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var monsters = await _context.Monsters.ToListAsync();
            int updatedCount = 0;

            foreach (var monster in monsters)
            {
                string rarity = monster.Rarity?.ToLower() ?? "common";
                int targetLevel = rarity switch
                {
                    "common" => 7,
                    "rare" => 5,
                    "epic" => 3,
                    "legendary" => 1,
                    _ => 7
                };

                _gameplayService.RecalculateMonsterStats(monster, targetLevel);
                _context.Monsters.Update(monster);
                updatedCount++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Successfully adjusted levels for {updatedCount} monsters." });
        }

        [HttpGet("marketplace-history")]
        public async Task<IActionResult> GetMarketplaceHistory([FromQuery] int pageIndex = 0, [FromQuery] int pageSize = 100)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            if (pageSize <= 0) pageSize = 100;
            if (pageIndex < 0) pageIndex = 0;

            var logs = await _context.MarketplaceLogs
                .OrderByDescending(x => x.Timestamp)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(logs);
        }

        public class GiveAssetRequest
        {
            public long UserId { get; set; }
            public string Type { get; set; } // "balance", "item", "monster", "slots"
            public string Currency { get; set; }
            public double Amount { get; set; } // also used for monster level, or slot count
            public string ItemName { get; set; }
            public string MonsterId { get; set; }
            public string Rarity { get; set; } // "common", "rare", "epic", "legendary"
        }

        [HttpPost("give-asset")]
        public async Task<IActionResult> GiveAsset([FromBody] GiveAssetRequest request)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == request.UserId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found." });
            }

            if (request.Type == "balance")
            {
                string currencyUpper = request.Currency?.ToUpper();
                if (currencyUpper == "TON" || currencyUpper == "GOLD" || currencyUpper == "CRYSTAL" || currencyUpper == "EGGS")
                {
                    user.Credit(currencyUpper, request.Amount, "admin_give");
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                    return Ok(new { success = true, message = $"Successfully adjusted {request.Amount} {currencyUpper} for user {user.Username ?? user.ID.ToString()}." });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Invalid currency. Must be TON, GOLD, CRYSTAL, or EGGS." });
                }
            }
            else if (request.Type == "item")
            {
                string itemLower = request.ItemName?.ToLower();
                int amtInt = (int)request.Amount;
                bool found = true;

                switch (itemLower)
                {
                    case "monstaball": user.Items.MonstaBall += amtInt; break;
                    case "ragepotion": user.Items.RagePotion += amtInt; break;
                    case "windspell": user.Items.WindSpell += amtInt; break;
                    case "waterfallspell": user.Items.WaterFallSpell += amtInt; break;
                    case "avalanchespell": user.Items.AvalancheSpell += amtInt; break;
                    case "lavaspell": user.Items.LavaSpell += amtInt; break;
                    case "thunderspell": user.Items.ThunderSpell += amtInt; break;
                    case "darkspell": user.Items.DarkSpell += amtInt; break;
                    case "healspell": user.Items.HealSpell += amtInt; break;
                    case "shield": user.Items.Shield += amtInt; break;
                    case "poison": user.Items.Poison += amtInt; break;
                    case "hallucinogen": user.Items.Hallucinogen += amtInt; break;
                    default: found = false; break;
                }

                if (!found)
                {
                    return BadRequest(new { success = false, message = $"Invalid item name: {request.ItemName}." });
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = $"Successfully adjusted {amtInt} {request.ItemName} for user {user.Username ?? user.ID.ToString()}." });
            }
            else if (request.Type == "monster")
            {
                if (string.IsNullOrWhiteSpace(request.MonsterId))
                {
                    return BadRequest(new { success = false, message = "Monster ID is required." });
                }

                int level = (int)request.Amount;
                if (level <= 0) level = 1;

                try
                {
                    Monster monster = _gameplayService.CreateMonsterInstance(request.MonsterId, user.ID, level);
                    if (monster == null)
                    {
                        return BadRequest(new { success = false, message = "Failed to create monster instance. Check if Monster ID exists." });
                    }

                    monster.Log(monster.InstanceId, monster.Level, "admin_give=" + monster.InstanceId);
                    await _context.Monsters.AddAsync(monster);

                    if (user.Monsters == null) user.Monsters = new List<string>();
                    user.Monsters.Add(monster.InstanceId);

                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();

                    return Ok(new { success = true, message = $"Successfully added {monster.Title} (Level {level}) to user {user.Username ?? user.ID.ToString()}." });
                }
                catch (Exception ex)
                {
                    return Ok(new { success = false, message = $"Error creating monster: {ex.Message}" });
                }
            }
            else if (request.Type == "slots")
            {
                string rarityLower = request.Rarity?.ToLower();
                int slotsCount = (int)request.Amount;
                if (slotsCount < 0) slotsCount = 0;

                if (rarityLower == "common")
                {
                    user.UnlockedCommonSlots = slotsCount;
                }
                else if (rarityLower == "rare")
                {
                    user.UnlockedRareSlots = slotsCount;
                }
                else if (rarityLower == "epic")
                {
                    user.UnlockedEpicSlots = slotsCount;
                }
                else if (rarityLower == "legendary")
                {
                    user.UnlockedLegendarySlots = slotsCount;
                }
                else
                {
                    return BadRequest(new { success = false, message = "Invalid rarity. Must be common, rare, epic, or legendary." });
                }

                user.UnlockedCollectorSlots = user.UnlockedCommonSlots + user.UnlockedRareSlots + user.UnlockedEpicSlots + user.UnlockedLegendarySlots;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = $"Successfully set {request.Rarity} collector slots to {slotsCount} for user {user.Username ?? user.ID.ToString()}." });
            }

            return BadRequest(new { success = false, message = "Invalid asset type. Must be balance, item, monster, or slots." });
        }

        public class BroadcastMessageRequest
        {
            public long UserId { get; set; }
            public string Message { get; set; }
        }

        [HttpPost("broadcast-user")]
        public async Task<IActionResult> BroadcastToUser([FromBody] BroadcastMessageRequest request)
        {
            if (!IsAuthorized())
            {
                return Unauthorized();
            }

            if (request == null || request.UserId <= 0 || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { success = false, message = "Invalid request parameters." });
            }

            try
            {
                await _tgbot.Notify(request.UserId, request.Message);
                return Ok(new { success = true, message = "Message sent successfully!" });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, message = $"Failed to send message: {ex.Message}" });
            }
        }
    }
}
