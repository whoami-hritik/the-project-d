using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;
using monster_world.Models;
using monster_world.Filters;

namespace monster_world.Controller
{
    [ApiController]
    [Route("api/admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDashboardController(AppDbContext context)
        {
            _context = context;
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
                    Balance = new { u.Balance.TON, u.Balance.GOLD, u.Balance.EGGS }
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
                    m.Rarity,
                    m.Element,
                    m.IsFighting
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
                TotalGoldCirculation = totalGoldCirculation
            });
        }
    }
}
