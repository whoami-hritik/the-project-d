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

        public AdminDashboardController(AppDbContext context, GameplayService gameplayService)
        {
            _context = context;
            _gameplayService = gameplayService;
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

            monster.Level = payload.Level;
            monster.HP = payload.HP;
            monster.MaxHP = payload.MaxHP;
            monster.XP = payload.XP;
            monster.MaxXP = payload.MaxXP;
            monster.ATK = payload.ATK;
            monster.DEF = payload.DEF;
            monster.SPD = payload.SPD;
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

            // Load all users who either have collector monsters, or have unlocked > 1 slot
            var userIdsWithMonsters = monsters.Select(m => m.OwnerID).Distinct().ToList();
            
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => u.UnlockedCollectorSlots > 1 || userIdsWithMonsters.Contains(u.ID))
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
                    user.UnlockedCollectorSlots,
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

        private (double Gold, double Crystal, double GoldRate, double CrystalRate) CalculateMonsterYield(Monster monster, string activeMap)
        {
            double baseScale = Math.Ceiling(monster.Level / 5.0);
            double matchBonus = (monster.CapturedMap?.ToLower() == activeMap?.ToLower()) ? 0.2 : 0.0;
            double multiplier = GetRarityMultiplier(monster.Rarity) + matchBonus;

            double goldRate = 0;
            double crystalRate = 0;

            string r = monster.Rarity?.ToLower() ?? "common";
            if (r == "common")
            {
                goldRate = baseScale * 1.0 * multiplier;
            }
            else if (r == "rare")
            {
                if (monster.CollectorFocus?.ToLower() == "crystal")
                {
                    crystalRate = baseScale * 0.5 * multiplier;
                }
                else
                {
                    goldRate = baseScale * 1.0 * multiplier;
                }
            }
            else // epic & legendary
            {
                goldRate = baseScale * 1.0 * multiplier;
                crystalRate = baseScale * 0.5 * multiplier;
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

            double goldEarned = elapsedHours * goldRate;
            double crystalEarned = elapsedHours * crystalRate;

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
            
            var commonIds = _gameplayService.GetRarityMons("common")?.Select(m => m.MonsterId.ToLower()).ToList() ?? new List<string>();
            var rareIds = _gameplayService.GetRarityMons("rare")?.Select(m => m.MonsterId.ToLower()).ToList() ?? new List<string>();
            var epicIds = _gameplayService.GetRarityMons("epic")?.Select(m => m.MonsterId.ToLower()).ToList() ?? new List<string>();
            var legendaryIds = _gameplayService.GetRarityMons("legendary")?.Select(m => m.MonsterId.ToLower()).ToList() ?? new List<string>();

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
                    eligibleList.Add(mapCommons[rnd.Next(mapCommons.Count)]);
                }
                if (mapRares.Any())
                {
                    eligibleList.Add(mapRares[rnd.Next(mapRares.Count)]);
                }
                if (mapEpics.Any())
                {
                    eligibleList.Add(mapEpics[rnd.Next(mapEpics.Count)]);
                }
                if (mapLegendaries.Any())
                {
                    eligibleList.Add(mapLegendaries[rnd.Next(mapLegendaries.Count)]);
                }
            }
            
            return eligibleList.Select(id => id.ToLower()).Distinct().ToList();
        }

        private async Task ProcessExpiredCollectorStakes(long userId)
        {
            var stakedMonsters = await _context.Monsters
                .Where(m => m.OwnerID == userId && m.StakedInCollector)
                .ToListAsync();

            if (!stakedMonsters.Any()) return;

            var activeMap = GetActiveExhibitionMap();
            bool changed = false;
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == userId);
            if (user == null) return;

            foreach (var monster in stakedMonsters)
            {
                if (monster.CollectorDepositTime.HasValue)
                {
                    double totalStakedHours = (DateTime.UtcNow - monster.CollectorDepositTime.Value).TotalHours;
                    if (totalStakedHours >= 24.0)
                    {
                        double claimableHours = 0;
                        if (monster.CollectorLastClaimTime.HasValue)
                        {
                            var limitTime = monster.CollectorDepositTime.Value.AddHours(24.0);
                            claimableHours = (limitTime - monster.CollectorLastClaimTime.Value).TotalHours;
                            if (claimableHours < 0) claimableHours = 0;

                            var collectorConfig = _gameplayService.GetCollectorData();
                            double capHours = collectorConfig?.FarmingCapHours ?? 1.0;
                            if (claimableHours > capHours) claimableHours = capHours;
                        }

                        double baseScale = Math.Ceiling(monster.Level / 5.0);
                        double matchBonus = (monster.CapturedMap?.ToLower() == activeMap?.ToLower()) ? 0.2 : 0.0;
                        double multiplier = GetRarityMultiplier(monster.Rarity) + matchBonus;

                        double goldRate = 0;
                        double crystalRate = 0;
                        string r = monster.Rarity?.ToLower() ?? "common";
                        if (r == "common")
                        {
                            goldRate = baseScale * 1.0 * multiplier;
                        }
                        else if (r == "rare")
                        {
                            if (monster.CollectorFocus?.ToLower() == "crystal")
                            {
                                crystalRate = baseScale * 0.5 * multiplier;
                            }
                            else
                            {
                                goldRate = baseScale * 1.0 * multiplier;
                            }
                        }
                        else
                        {
                            goldRate = baseScale * 1.0 * multiplier;
                            crystalRate = baseScale * 0.5 * multiplier;
                        }

                        double goldEarned = claimableHours * goldRate;
                        double crystalEarned = claimableHours * crystalRate;

                        if (goldEarned > 0)
                        {
                            user.Balance.GOLD += Math.Round(goldEarned, 4);
                        }
                        if (crystalEarned > 0)
                        {
                            user.Balance.CRYSTAL += Math.Round(crystalEarned, 4);
                        }

                        monster.StakedInCollector = false;
                        monster.CollectorDepositTime = DateTime.UtcNow.AddHours(24.0); // Cooldown end time
                        monster.CollectorLastClaimTime = null;
                        
                        changed = true;
                    }
                }
            }

            if (changed)
            {
                await _context.SaveChangesAsync();
            }
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

            int currentlyStakedCount = await _context.Monsters
                .CountAsync(m => m.OwnerID == user.ID && m.StakedInCollector);

            if (currentlyStakedCount >= user.UnlockedCollectorSlots)
            {
                return Ok(new { success = false, reason = "all unlocked collector slots are occupied" });
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
    }
}
