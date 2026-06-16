using monster_world.Models;
using monster_world.DBContext;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot.Types;
using Telegram.Bot;
using System.Collections.Concurrent;
using System.Threading;

namespace monster_world.Services
{
    public class UserService
    {
        private static readonly ConcurrentDictionary<long, SemaphoreSlim> _userLocks = new();
        private readonly AppDbContext _dbContext;
        private readonly ITelegramBotClient _botClient;
        private readonly GameConfig _gameConfig;

        public UserService(AppDbContext dbContext, ITelegramBotClient botClient, GameConfig gameConfig)
        {
            _dbContext = dbContext;
            _botClient = botClient;
            _gameConfig = gameConfig;
        }

        public async Task<UserBase> GetOrCreateUser(TelegramUser User, long referrerId = 0)
        {
            var userLock = _userLocks.GetOrAdd(User.ID, _ => new SemaphoreSlim(1, 1));
            await userLock.WaitAsync();

            try
            {
                UserAnalytics analytics = await _dbContext.Analytics.FirstOrDefaultAsync(x => x.ID == User.ID);
                if (analytics == null)
                {
                    analytics = new UserAnalytics
                    {
                        ID = User.ID
                    };
                    await _dbContext.Analytics.AddAsync(analytics);
                    await _dbContext.SaveChangesAsync();
                }

                UserBase user = await _dbContext.Users.FirstOrDefaultAsync(x => x.ID == User.ID);
                if (user == null)
                {
                    long validReferrerId = 0;
                    if (referrerId > 0 && referrerId != User.ID)
                    {
                        var referrerExists = await _dbContext.Users.FirstOrDefaultAsync(x => x.ID == referrerId);
                        if (referrerExists != null)
                        {
                            Referral referrerRecords = await _dbContext.Referrals.FirstOrDefaultAsync(x => x.ID == referrerId);
                            if (referrerRecords == null)
                            {
                                referrerRecords = new Referral
                                {
                                    ID = referrerId,
                                    Referrals = new List<long> { User.ID }
                                };
                                await _dbContext.Referrals.AddAsync(referrerRecords);
                            }
                            else
                            {
                                referrerRecords.Referrals.Add(User.ID);
                                _dbContext.Referrals.Update(referrerRecords);
                            }
                            validReferrerId = referrerId;
                        }
                    }

                    user = new UserBase
                    {
                        ID = User.ID,
                        FirstName = User.FirstName,
                        LastName = User.LastName,
                        Username = User.Username,
                        LanguageCode = User.LanguageCode,
                        PhotoUrl = User.PhotoUrl,
                        AllowsWriteToPm = User.AllowsWriteToPm,
                        ReferrerID = validReferrerId,
                        Tutorial = false,
                        TotalBattles = 0,
                        TotalCaptured = 0,
                        TotalVictory = 0,
                        Bonus = false,
                        Level = 1,
                        Balance = new()
                        {
                            TON = 0,
                            GOLD = 10,
                            CRYSTAL = 0,
                            EGGS = 0
                        },
                        Items = new()
                        {
                            MonstaBall = 0,
                            RagePotion = 0,
                            LavaSpell = 0,
                            AvalancheSpell = 0,
                            WindSpell = 0,
                            WaterFallSpell = 0,
                            ThunderSpell = 0,
                            DarkSpell = 0,
                            HealSpell = 0,
                            Shield = 0,
                            Poison = 0,
                            Hallucinogen = 0
                        },
                        LoginStreak = 1,
                        LastLoginDate = DateTime.UtcNow,
                        StreakClaimed = false
                    };

                    await _dbContext.Users.AddAsync(user);

                    if (validReferrerId > 0 && _gameConfig.ReferralRewards != null)
                    {
                        var referrer = await _dbContext.Users.FirstOrDefaultAsync(x => x.ID == validReferrerId);
                        if (referrer != null)
                        {
                            var refereeConfig = _gameConfig.ReferralRewards.Referee;
                            if (refereeConfig != null)
                            {
                                if (refereeConfig.Currency != null)
                                {
                                    foreach (var cur in refereeConfig.Currency)
                                    {
                                        user.Credit(cur.Key, cur.Value, $"referred_by={validReferrerId}");
                                    }
                                }
                                if (refereeConfig.Items != null)
                                {
                                    foreach (var item in refereeConfig.Items)
                                    {
                                        user.AddItems(item.Key, item.Value, $"referred_by={validReferrerId}");
                                    }
                                }
                            }

                            var referralMapping = await _dbContext.Referrals.FirstOrDefaultAsync(r => r.ID == validReferrerId);
                            if (referralMapping == null)
                            {
                                referralMapping = new Referral
                                {
                                    RefID = Guid.NewGuid(),
                                    ID = validReferrerId,
                                    Referrals = new List<long> { User.ID }
                                };
                                await _dbContext.Referrals.AddAsync(referralMapping);
                            }
                            else
                            {
                                if (referralMapping.Referrals == null)
                                {
                                    referralMapping.Referrals = new List<long>();
                                }
                                if (!referralMapping.Referrals.Contains(User.ID))
                                {
                                    referralMapping.Referrals.Add(User.ID);
                                    _dbContext.Referrals.Update(referralMapping);
                                }
                            }

                            try
                            {
                                string friendName = string.IsNullOrEmpty(User.Username) 
                                    ? $"{User.FirstName} {User.LastName}".Trim() 
                                    : $"@{User.Username}";

                                string msg = $"🎉 A new friend joined using your referral link!\n\n" +
                                             $"👤 Friend: {friendName}\n" +
                                             $"⏳ Status: Pending (reaches Level 2 to unlock your reward)";

                                _ = _botClient.SendMessage(validReferrerId, msg);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[REFERRAL] Failed to send bot notification to referrer: {ex.Message}");
                            }
                        }
                    }

                    await _dbContext.SaveChangesAsync();
                    return user;
                }
                else
                {
                    if (user.Level == 0)
                    {
                        user.Level = 1;
                    }
                    var today = DateTime.UtcNow.Date;
                    if (user.LastLoginDate == null)
                    {
                        user.LoginStreak = 1;
                        user.LastLoginDate = DateTime.UtcNow;
                        user.StreakClaimed = false;
                    }
                    else
                    {
                        var lastLogin = user.LastLoginDate.Value.Date;
                        if (lastLogin == today)
                        {
                            // Same day, do nothing
                        }
                        else if (lastLogin == today.AddDays(-1))
                        {
                            // Next day login
                            if (user.StreakClaimed)
                            {
                                user.LoginStreak = user.LoginStreak >= 7 ? 1 : user.LoginStreak + 1;
                                user.StreakClaimed = false;
                            }
                            user.LastLoginDate = DateTime.UtcNow;

                            user.DailyVictory = 0;
                            user.DailyBattles = 0;
                            user.DailyHealedHP = 0;
                            user.DailyChestsOpened = 0;
                            
                            var dailyIds = await _dbContext.AvailableMissions
                                .Where(m => (m.Category == "Daily" || m.Category == null) && m.IsActive)
                                .Select(m => m.MissionId.ToString())
                                .ToListAsync();

                            if (user.Missions != null && dailyIds.Any())
                            {
                                user.Missions = user.Missions.Where(id => !dailyIds.Contains(id)).ToList();
                            }
                        }
                        else
                        {
                            // Missed a day, reset streak
                            user.LoginStreak = 1;
                            user.StreakClaimed = false;
                            user.LastLoginDate = DateTime.UtcNow;

                            user.DailyVictory = 0;
                            user.DailyBattles = 0;
                            user.DailyHealedHP = 0;
                            user.DailyChestsOpened = 0;

                            var dailyIds = await _dbContext.AvailableMissions
                                .Where(m => (m.Category == "Daily" || m.Category == null) && m.IsActive)
                                .Select(m => m.MissionId.ToString())
                                .ToListAsync();

                            if (user.Missions != null && dailyIds.Any())
                            {
                                user.Missions = user.Missions.Where(id => !dailyIds.Contains(id)).ToList();
                            }
                        }
                    }
                    _dbContext.Users.Update(user);
                    await _dbContext.SaveChangesAsync();
                }
                return user;
            }
            finally
            {
                userLock.Release();
            }
        }

        public string CheckConsumable(UserBase User, string consumable)
        {
            string consumable_id = "";
            if (string.Equals(consumable, "MonstaBall", StringComparison.OrdinalIgnoreCase) && User.Items.MonstaBall > 0)
            {
                consumable_id = consumable;
            }
            else if (string.Equals(consumable, "HealSpell", StringComparison.OrdinalIgnoreCase) && User.Items.HealSpell > 0)
            {
                consumable_id = "revive";
            }
            else if (string.Equals(consumable, "RagePotion", StringComparison.OrdinalIgnoreCase) && User.Items.RagePotion > 0)
            {
                consumable_id = "rage";
            }
            else if (string.Equals(consumable, "AvalancheSpell", StringComparison.OrdinalIgnoreCase) && User.Items.AvalancheSpell > 0)
            {
                consumable_id = "avalanche";
            }
            else if (string.Equals(consumable, "DarkSpell", StringComparison.OrdinalIgnoreCase) && User.Items.DarkSpell > 0)
            {
                consumable_id = "dark_beam";
            }
            else if (string.Equals(consumable, "LavaSpell", StringComparison.OrdinalIgnoreCase) && User.Items.LavaSpell > 0)
            {
                consumable_id = "hellfire";
            }
            else if (string.Equals(consumable, "WindSpell", StringComparison.OrdinalIgnoreCase) && User.Items.WindSpell > 0)
            {
                consumable_id = "tornado";
            }
            else if (string.Equals(consumable, "WaterFallSpell", StringComparison.OrdinalIgnoreCase) && User.Items.WaterFallSpell > 0)
            {
                consumable_id = "water_blast";
            }
            else if (string.Equals(consumable, "ThunderSpell", StringComparison.OrdinalIgnoreCase) && User.Items.ThunderSpell > 0)
            {   
                consumable_id = "thunderstorm";
            }
            else if (string.Equals(consumable, "Poison", StringComparison.OrdinalIgnoreCase) && User.Items.Poison > 0)
            {
                consumable_id = "Poison";
            }
            else if (string.Equals(consumable, "Hallucinogen", StringComparison.OrdinalIgnoreCase) && User.Items.Hallucinogen > 0)
            {
                consumable_id = "confuse";
            }
            else if (string.Equals(consumable, "Shield", StringComparison.OrdinalIgnoreCase) && User.Items.Shield > 0)
            {
                consumable_id = "earth_shield";
            }
            else
            {
                consumable_id = null;
            }

            return consumable_id;

        }
    }
}