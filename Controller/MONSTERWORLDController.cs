using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using monster_world.Filters;
using monster_world.Models;
using monster_world.DBContext;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot.Types;
using Telegram.Bot;
using monster_world.Services;
using Telegram.Bot.Types.Payments;
using monster_world.Models.Dto;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Diagnostics.Eventing.Reader;
using Microsoft.VisualBasic;
using Newtonsoft.Json;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc.Filters;



namespace monster_world.Controller
{
    [ValidateRequest]
    [ApiController]
    [Route("[controller]")]
    public class MonsterWorld : EnhanceController
    {

        
                
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly BattleService _battleService;
        private readonly GameplayService _gameplayService;
        private readonly MapService _mapService;
        private readonly TGBOT.TelegramBot _tgbot;
        private readonly PoolService _poolService;
        private readonly Telegram.Bot.ITelegramBotClient _botClient;
        private static readonly HttpClient _httpClient = new HttpClient();

        public MonsterWorld(
            AppDbContext context, 
            TGBOT.TelegramBot tgbot, 
            UserService userService, 
            BattleService battleService,
            GameplayService gameplayService,
            PoolService poolService,
            MapService mapService,
            Telegram.Bot.ITelegramBotClient botClient)
        {
            _context = context;
            _tgbot = tgbot;
            _userService = userService; 
            _battleService = battleService; 
            _gameplayService = gameplayService;      
            _poolService = poolService;
            _botClient = botClient;
            _mapService = mapService;
        }        
        
        [ValidateRequestIgnore]
        [HttpPost("telegram/update")]
        public async Task<IActionResult> TGUpdate([FromBody]Update update)
        {
            
            if (update.Message!= null)
            {
                await _tgbot.OnMessage(update);
            }
            return Ok();
        }

        [ValidateRequestIgnore]
        [HttpPost("blockchain/update")]
        public async Task<IActionResult> BlockchainUpdate([FromBody] TonWebhookPayload update)
        {

            Console.WriteLine("Blockchain Update!");
            string expectedAccountId = System.Environment.GetEnvironmentVariable("BLOCKCHAIN_ACCOUNT_ID")
                ?? "0:039792779f72c766aa194341e4bc72d55e26584b6b7497a190f77f2acbcb7769";
            if (update.AccountId != expectedAccountId)
            {
                await _tgbot.NotifyAdmin($"Update! Invalid Account ID! {update.AccountId}");
                Console.WriteLine($"Invalid Account ID! {update.AccountId}");
                return Ok();
            }
            Console.WriteLine("Valid Account ID!");

            string tonApiBaseUrl = System.Environment.GetEnvironmentVariable("TONAPI_URL") ?? "https://tonapi.io/v2";
            var url = $"{tonApiBaseUrl}/blockchain/transactions/{update.TxHash}";

            var response = await _httpClient.GetAsync(url);

            var json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode || !json.TrimStart().StartsWith('{'))
                return Ok();

            var tx = JsonConvert.DeserializeObject<TonTransaction>(json);

            if (!tx.Success) return Ok();
            
            if (await _context.Deposits.FirstOrDefaultAsync(x => x.Hash == update.TxHash) != null)
            {
                await _tgbot.NotifyAdmin($"Update! Deposit already exists! {update.TxHash}");
                Console.WriteLine($"Deposit already exists! {update.TxHash}");
                return Ok();
            }
            await _tgbot.NotifyAdmin($"Update! Deposit Arrived! {update.TxHash}");
            Console.WriteLine("Deposit Arrived!");

            var outMsg = tx?.OutMsgs?.FirstOrDefault();

            string comment = outMsg?.DecodedBody?.Text ?? tx?.InMsg?.DecodedBody?.Text;
            long valueNano = outMsg?.Value > 0 ? outMsg.Value : (tx?.InMsg?.Value ?? 0);
            double tonAmount = valueNano / 1_000_000_000.0;
            if (string.IsNullOrEmpty(comment) || !long.TryParse(comment, out long userId))
                return Ok();

            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.ID == userId);
            UserAnalytics analytics = await _context.Analytics.FirstOrDefaultAsync( x => x.ID == User.ID);

            if (User == null)
                return Ok();

            Console.WriteLine($"Before Credit - User TON: {User.Balance.TON}");
            User.Credit("TON", tonAmount, "deposit=" + update.TxHash);
            Console.WriteLine($"After Credit - User TON: {User.Balance.TON}");

            if (analytics == null)
            {
                analytics = new UserAnalytics { ID = User.ID };
                await _context.Analytics.AddAsync(analytics);
            }

            // Balance is now replaced as a whole, EF Core detects the change automatically
            _context.Users.Update(User);

            if (User.ReferrerID > 0)
            {
                var referrer = await _context.Users.FirstOrDefaultAsync(r => r.ID == User.ReferrerID);
                if (referrer != null)
                {
                    double goldBonus = tonAmount * 0.05;
                    referrer.Credit("GOLD", goldBonus, $"referral_deposit_bonus={User.ID}");
                    _context.Users.Update(referrer);

                    try
                    {
                        string friendName = string.IsNullOrEmpty(User.Username) 
                            ? $"{User.FirstName} {User.LastName}".Trim() 
                            : $"@{User.Username}";

                        string msg = $"💸 You received a referral deposit bonus!\n\n" +
                                     $"👤 Friend: {friendName}\n" +
                                     $"💰 Deposit: {tonAmount:F2} TON\n" +
                                     $"🎁 Your 5% Bonus: +{goldBonus:F4} GOLD";

                        _ = _botClient.SendMessage(User.ReferrerID, msg);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[REFERRAL] Failed to send deposit bonus notification: {ex.Message}");
                    }
                }
            }

            Deposit deposit = new()
            {
                UserID = User.ID,
                Amount = tonAmount,
                Balance = new Balance { TON = User.Balance.TON, GOLD = User.Balance.GOLD, CRYSTAL = 0 },
                Successful = true,
                Completed = true,
                Hash = update.TxHash,
                Time = DateTimeOffset.FromUnixTimeSeconds(tx.Utime).UtcDateTime,
                SuccessfulAt = DateTime.UtcNow
            };
            
            double USDTConversion = await GetTonPrice() * tonAmount;
            analytics.TotalDeposit += USDTConversion;

            await _context.Deposits.AddAsync(deposit);
            try
            {
                Console.WriteLine($"Saving changes - User ID: {User.ID}, TON Balance to save: {User.Balance.TON}");
                int changesCount = await _context.SaveChangesAsync();
                Console.WriteLine($"SaveChangesAsync returned: {changesCount} rows affected");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving deposit/credit: {ex.Message}\n{ex.InnerException}\n{ex.StackTrace}");
                await _tgbot.NotifyAdmin($"Error saving deposit: {ex.Message}");
                return Ok();
            }

            string AdminMsg = $"Deposit Done!\n\n ID: {User.ID}\nDeposit Amt: {tonAmount:F2}\nHash: {update.TxHash}\nTON Bal: {User.Balance.TON}\nGOLD Bal: {User.Balance.GOLD}\nRegistered At: {User.RegistrationDate}";
            await _tgbot.Notify(User.ID, $"Deposit confirmed! {tonAmount:F2} TON added to your balance.");
            await _tgbot.NotifyAdmin(AdminMsg);
            return Ok();

        }

        [HttpPost("user")]
        public async Task<IActionResult> GetOrCreateUser()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            if (TGBOT.TelegramBot.IsUnderMaintenance && !TGBOT.TelegramBot.IsAdmin(telegramUser.ID))
            {
                string maintenanceMsg = string.IsNullOrEmpty(TGBOT.TelegramBot.MaintenanceMessage)
                    ? "The game is currently under maintenance. Please check back later!"
                    : TGBOT.TelegramBot.MaintenanceMessage;
                return Ok(new { success = false, isMaintenance = true, message = maintenanceMsg });
            }

            long referrerId = 0;
            if (HttpContext.Items.TryGetValue("StartParam", out var startParamObj) && startParamObj is string startParamStr)
            {
                long.TryParse(startParamStr, out referrerId);
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser, referrerId);

            object prelaunchReward = null;
            if (User.Bonus)
            {
                prelaunchReward = await ProcessPrelaunchRewardsAsync(User);
            }

            return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User), prelaunchReward = prelaunchReward });
        }

        [HttpPost("user/accept-agreement")]
        public async Task<IActionResult> AcceptAgreement()
        {
            HttpContext.Items.TryGetValue("User", out var userObj);
            if (userObj == null || userObj is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase user = await _context.Users.FindAsync(telegramUser.ID);
            if (user == null)
            {
                return NotFound(new { success = false, reason = "User not found" });
            }

            user.HasAcceptedAgreement = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, HasAcceptedAgreement = true });
        }

        [HttpPost("user/claim-streak")]
        public async Task<IActionResult> ClaimStreakReward()
        {
            HttpContext.Items.TryGetValue("User", out var userObj);
            if (userObj == null || userObj is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase user = await _userService.GetOrCreateUser(telegramUser);
            if (user == null)
            {
                return NotFound(new { success = false, reason = "User not found" });
            }

            if (user.StreakClaimed)
            {
                return Ok(new { success = false, reason = "Streak reward already claimed for today" });
            }

            int currentDay = user.LoginStreak;
            if (currentDay < 1 || currentDay > 7)
            {
                user.LoginStreak = 1;
                currentDay = 1;
            }

            string rewardType = "";
            int rewardAmount = 0;
            Dictionary<string, int> multiRewards = null;

            if (currentDay == 1)
            {
                rewardType = "GOLD";
                rewardAmount = new Random().Next(10, 16); // 10 to 15 inclusive
                user.Credit("GOLD", rewardAmount, "claim_streak_day_1");
            }
            else if (currentDay == 2)
            {
                rewardType = "HealSpell";
                rewardAmount = 1;
                user.AddItems("HealSpell", 1, "claim_streak_day_2");
            }
            else if (currentDay == 3)
            {
                rewardType = "GOLD";
                rewardAmount = 15;
                user.Credit("GOLD", 15, "claim_streak_day_3");
            }
            else if (currentDay == 4)
            {
                rewardType = "MonstaBall";
                rewardAmount = 1;
                user.AddItems("MonstaBall", 1, "claim_streak_day_4");
            }
            else if (currentDay == 5)
            {
                rewardType = "GOLD";
                rewardAmount = 20;
                user.Credit("GOLD", 20, "claim_streak_day_5");
            }
            else if (currentDay == 6)
            {
                rewardType = "HealSpell";
                rewardAmount = 1;
                user.AddItems("HealSpell", 1, "claim_streak_day_6");
            }
            else if (currentDay == 7)
            {
                rewardType = "Chest";
                multiRewards = new Dictionary<string, int>
                {
                    { "GOLD", new Random().Next(30, 51) },
                    { "MonstaBall", 2 },
                    { "HealSpell", 1 },
                    { "RagePotion", 1 }
                };

                foreach (var reward in multiRewards)
                {
                    if (reward.Key == "GOLD")
                    {
                        user.Credit("GOLD", reward.Value, "claim_streak_day_7_chest");
                    }
                    else
                    {
                        user.AddItems(reward.Key, reward.Value, "claim_streak_day_7_chest");
                    }
                }
            }

            user.StreakClaimed = true;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                success = true, 
                day = currentDay,
                rewardType,
                rewardAmount,
                multiRewards,
                User = Mapper.MapTo.UserBaseDto(user)
            });
        }

        [HttpPost("world/unlock/map")]
        public async Task<IActionResult> UnlockMap()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            var form = await GetForm( new {
                Map = "",
            });


            if (User.UnlockedWorlds.Contains(form.Map))
            {
                return Ok(new { success = false, reason = "world already unlocked"});
            }

            List<MapData> mapData = _gameplayService.GetMapData();

            var map = mapData.FirstOrDefault(x => x.Map == form.Map);
            if (map == null)
            {
                return Ok( new { success = false, reason = "invalid map id"});
            }

            if (User.Level < map.UnlockAt)
            {
                return Ok( new { success = false, reason = $"reach level {map.UnlockAt} to Unlock the map"});
            }


            double UnlockCost = map.UnlockCost["TON"];

            if (User.Balance.TON < UnlockCost)
            {
                return Ok( new { success = false, reason = "insufficient balance"});
            }

            MapBase mapBase = await _context.MapLiquidity.FirstOrDefaultAsync(x => x.MapId == form.Map);

            if (mapBase == null)
            {
                mapBase = new()
                {
                    MapId = form.Map,
                    MapLiquidity = 0,
                    DailyUSDTLiquidity = 0,
                    TotalUsers = 0,
                    Users = new List<long>()
                };

                await _context.MapLiquidity.AddAsync(mapBase);
                await _context.SaveChangesAsync();
            }
            // TON
           
            User.Credit("TON", -UnlockCost, $"unlockMap={form.Map}");
            double TON_USDT_PRICE = await GetTonPrice();
            
            await _context.SaveChangesAsync();
            await _poolService.AddUnlockMapLiquidity(form.Map, TON_USDT_PRICE, User.ID);

            // Detach mapBase so that the controller's context does not overwrite the updated values in the DB
            _context.Entry(mapBase).State = EntityState.Detached;
        
        
            
            User.UnlockedWorlds.Add(form.Map);

            await _context.SaveChangesAsync();

            return Ok ( new { success = true, unlockedMaps = User.UnlockedWorlds, balance = User.Balance });
        }

        [HttpPost("referrals")]
        public async Task<IActionResult> GetReferrals()
        {
            HttpContext.Items.TryGetValue("User", out var userContext);
            if (userContext == null || userContext is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            string botUsername = "MonsterWorldBot";
            try
            {
                var me = await _botClient.GetMe();
                botUsername = me.Username;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[REFERRALS] Failed to fetch bot username: {ex.Message}");
            }

            string referralLink = $"https://t.me/{botUsername}?start={telegramUser.ID}";

            UserBase User = await _context.Users.FirstOrDefaultAsync(u => u.ID == telegramUser.ID);
            Referral referrals = await _context.Referrals.FirstOrDefaultAsync(u => u.ID == telegramUser.ID);

            int totalReferrals = 0;
            double totalEarnedGold = 0;
            double totalEarnedCrystal = 0;
            int totalEarnedBalls = 0;
            List<long> userIds = new();
            
            if (referrals == null)
            {
                return Ok( new { 
                    success = true, 
                    referralLink = referralLink,
                    totalReferrals = totalReferrals,
                    totalEarnedGold = totalEarnedGold,
                    totalEarnedCrystal = totalEarnedCrystal,
                    totalEarnedBalls = totalEarnedBalls,
                    referrals = userIds 
                });
            }
            userIds = referrals.Referrals.ToList();

            var referredUsers = await _context.Users.Where(x => userIds.Contains(x.ID)).Select(u => new
                                                                    {
                                                                        Username = u.Username,
                                                                        FirstName = u.FirstName,
                                                                        LastName = u.LastName,
                                                                        RegistrationDate = u.RegistrationDate,
                                                                        Level = u.Level
                                                                    })
                                                                    .ToListAsync();   

            totalReferrals = userIds.Count;
            int validReferralsCount = referredUsers.Count(u => u.Level >= 2);

            double depositCommissionsGold = 0;
            if (User != null && User.Transactions != null)
            {
                foreach (var tx in User.Transactions)
                {
                    var parts = tx.Split('|');
                    if (parts.Length >= 4 && parts[3].StartsWith("referral_deposit_bonus"))
                    {
                        if (double.TryParse(parts[2], out double amt))
                        {
                            depositCommissionsGold += amt;
                        }
                    }
                }
            }

            totalEarnedGold = (validReferralsCount * 5) + depositCommissionsGold;
            totalEarnedBalls = validReferralsCount * 1;

            return Ok(new
            {
                success = true,
                referralLink = referralLink,
                totalReferrals = totalReferrals,
                totalEarnedGold = totalEarnedGold,
                totalEarnedCrystal = totalEarnedCrystal,
                totalEarnedBalls = totalEarnedBalls,
                referrals = referredUsers
            });
        }

        [HttpGet("deposit")]
        public async Task<IActionResult> Deposit()
        {
            string DepositAddress = System.Environment.GetEnvironmentVariable("DEPOSIT_ADDRESS")
                ?? "UQADl5J3n3LHZqoZQ0HkvHLVXiZYS2t0l6GQ938qy8t3aQKf"; //main wallet address
            return Ok(new{ success = true, DepositAddress});
        }

        [ValidateRequestIgnore]
        [HttpGet("proxy-avatar")]
        public async Task<IActionResult> ProxyAvatar([FromQuery] string url)
        {
            if (string.IsNullOrEmpty(url))
                return BadRequest();

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode);

                var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
                var bytes = await response.Content.ReadAsByteArrayAsync();

                return File(bytes, contentType);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error proxying avatar: " + ex.Message);
                return BadRequest();
            }
        }

        [HttpPost("bonus/receive")]
        public async Task<IActionResult> GetBonus()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            var SignUpBonus = _gameplayService.GetBonusData();
            var form = await GetForm(new { index = 0 });
            if (form.index < 0 || form.index >= SignUpBonus.Monsters.Count)
            {
                return BadRequest(new { success = false });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);

            if (User.Bonus) return Ok(new { success = false, reason = "bonus already received"});
            var monsterId = _gameplayService.GetBonusData().Monsters[form.index];

            Monster monster = _gameplayService.CreateMonsterInstance(monsterId, User.ID, 1);
            monster.Log(monster.InstanceId, monster.Level, "signupbonus=" + monster.InstanceId);

            await _context.Monsters.AddAsync(monster);

            User.Monsters.Add(monster.InstanceId);
            User.Bonus = true;

            if (SignUpBonus.Currency != null)
            {
                foreach (var cur in SignUpBonus.Currency)
                {
                    User.Credit(cur.Key, cur.Value, $"signupbonus={monster.InstanceId}");
                }
            }

            if (SignUpBonus.Items != null)
            {
                foreach (var item in SignUpBonus.Items)
                {
                    User.AddItems(item.Key, item.Value, $"signupbonus={monster.InstanceId}");
                }
            }            

            var prelaunchReward = await ProcessPrelaunchRewardsAsync(User);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, User = Mapper.MapTo.UserBaseDto(User), Monster = monster, prelaunchReward = prelaunchReward });
        }


        private async Task ScheduleBossBattle()
        {
            List<EmissionRate> emissionRates = _gameplayService.GetEggsEmissionRates();
            List<MapBase> mapBases = await _context.MapLiquidity.ToListAsync();
            BattleService.BossBattle bossBattleData = new()
            {
                Date = DateTime.UtcNow.Date,
                TotalBossBattles = 0,
                TotalUSDTCap = 0
            };

            MapBase FreeMapBase = mapBases.FirstOrDefault(x => x.MapId == "bootcamp");
            FreeMapBase.DailyUSDTLiquidity = 0; //setting Daily liquidity


            double DAILY_EGG_CAP = 0;

            foreach ( var map in mapBases)
            {
                
                map.DailyUSDTLiquidity = map.MapLiquidity * 10/100;

                if (map.DailyUSDTLiquidity < 5)
                {
                    map.DailyUSDTLiquidity = 5;
                }

                DAILY_EGG_CAP += map.DailyUSDTLiquidity;

                EmissionRate rate = emissionRates.FirstOrDefault(x => x.WinType == "jackpot");

                int TotalMapUsers = map.TotalUsers;

                double RequiredEGGSEmission = TotalMapUsers * double.Parse(rate.USDTEmission.Split("-")[1]);
                
                if (RequiredEGGSEmission < map.DailyUSDTLiquidity)
                {
                    FreeMapBase.DailyUSDTLiquidity += map.DailyUSDTLiquidity - RequiredEGGSEmission;
                }

                DateTime StartingAt = _gameplayService.GetRandomBusinessHalfHour(DateTime.UtcNow.Date);
                BattleService.BOSS Boss = new()
                {
                    Map = map.MapId,
                    BOSSES = _gameplayService.GetRandomBosses(3),
                    Day = DateTime.UtcNow.Date,
                    StartingAt =  StartingAt,
                    EndingAt = StartingAt.AddHours(1),
                    Active = false,
                    USDTCap = map.DailyUSDTLiquidity
                };

                bossBattleData.MapBosses.Add(Boss);

            }

            bossBattleData.TotalUSDTCap = DAILY_EGG_CAP;

            await _context.BossBattleData.AddAsync(bossBattleData);
            await _context.SaveChangesAsync();
        }



        [HttpPost("world/spawn")]
        public async Task<IActionResult> SpawnMonsterLocation()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            var form = await GetForm(new { world = "" });

            if (!User.UnlockedWorlds.Contains(form.world))
            {
                return Ok(new { success = false, reason = "world locked" });
            }

            BattleService.BossBattle bossBattle = await _context.BossBattleData.FirstOrDefaultAsync( x => x.Date == DateTime.UtcNow.Date);

            if (bossBattle == null)
            {
                await ScheduleBossBattle();
            }

            var spawns = await _context.Spawns.FirstOrDefaultAsync(x => x.UserId == User.ID);
            if (spawns == null)
            {
                spawns = new WorldSpawns
                {
                    UserId = User.ID,
                    Spawns = new List<Models.Location>()
                };
                await _context.Spawns.AddAsync(spawns);
            }

            var locations = spawns.Spawns.FirstOrDefault(x => x.World == form.world);
            if (locations == null)
            {
                locations = new Models.Location
                {
                    World = form.world,
                    Nodes = _gameplayService.RandomLocations(form.world),
                    LastSpawned = DateTime.UtcNow
                };
                spawns.Spawns.Add(locations);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, spawns = locations });
            }

            if (locations.LastSpawned.AddHours(1) <= DateTime.UtcNow)
            {
                locations.Nodes = _gameplayService.RandomLocations(form.world);
                locations.LastSpawned = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, spawns = locations });
        }

        [HttpPost("battle/start")]
        public async Task<IActionResult> FightBattle()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            var form = await GetForm(new { Map = "", Node = "", AttackerId = "" });

            if (!User.UnlockedWorlds.Contains(form.Map))
            {
                return Ok(new { success = false, reason = "Map locked" });
            }
            if (!User.Monsters.Contains(form.AttackerId))
            {
                return Ok(new { success = false, reason = "no such monster found" });
            }

            WorldSpawns spawns = await _context.Spawns.FirstOrDefaultAsync(x => x.UserId == User.ID);
            if (spawns == null)
            {
                return BadRequest(new { success = false });
            }

            Models.Location map = spawns.Spawns.FirstOrDefault(x => x.World == form.Map);
            if (map == null || map.LastSpawned.AddMinutes(60) < DateTime.UtcNow)
            {
                return Ok(new { success = false, reason = "monster location became older" });
            }

            if (!map.Nodes.Contains(form.Node))
            {
                return Ok(new { success = false, reason = "not an active location" });
            }

            Monster Attacker = _context.Monsters.FirstOrDefault(m => m.InstanceId == form.AttackerId);
            if (Attacker == null || Attacker.OwnerID != User.ID)
            {
                return Ok(new { success = false, reason = "invalid monster hash or not owner" });
            }
            if (Attacker.HP <= 0)
            {
                return Ok(new { success = false, reason = "monster HP is 0" });
            }

            if (Attacker.IsFighting)
            {
                //old battle lookup
                var battle = _context.Battles.FirstOrDefault(b => b.PlayerMonster.InstanceId == Attacker.InstanceId && b.Status == BattleStatus.Active);

                if (battle != null)
                {
                    if (battle.StartedAt.AddMinutes(2) <= DateTime.UtcNow)
                    {
                        battle.Status = BattleStatus.Forfeited;
                        Attacker.IsFighting = false;
                    }
                    else 
                    {
                        return Ok(new { success = false, reason = "monster already in battle" });
                    }
                }
            }

            Monster Enemymonster = null;

            if (form.Node == "BOSS")
            {
                BattleService.BossBattle bossBattle = await _context.BossBattleData.FirstOrDefaultAsync(x => x.Date == DateTime.UtcNow.Date);
                if (bossBattle == null)
                {
                    return Ok(new { success = false, reason = "daily boss battles are not scheduled yet" });
                }

                BattleService.BOSS bosses = bossBattle.MapBosses.FirstOrDefault(x => x.Map == form.Map);
                if (bosses == null)
                {
                    return Ok(new { success = false, reason = "no boss scheduled for this map" });
                }

                if (DateTime.UtcNow >= bosses.StartingAt && DateTime.UtcNow <= bosses.EndingAt)
                {
                    bosses.Active = true;
                }

                if (!bosses.Active)
                {
                    if (DateTime.UtcNow > bosses.EndingAt)
                    {
                        return Ok(new { success = false, reason = "daily boss battle has ended, come tomorrow" });
                    }
                    else
                    {
                        return Ok(new { success = false, reason = $"daily boss battle will be available after {bosses.StartingAt}", startingAt = bosses.StartingAt });
                    }
                }

                if (bosses.PlayerIds.Contains(User.ID))
                {
                    return Ok(new { success = false, reason = "you already fought this area boss, try another map bosses" });
                }

                bosses.PlayerIds.Add(User.ID);



                string bossId = bosses.BOSSES[new Random().Next(bosses.BOSSES.Count())];

                var bossLvlDef = _gameplayService.GetBossLevels().FirstOrDefault(x => _gameplayService.CheckBetween(User.Level, x.PlayerLevel));
                string rndLevels = bossLvlDef?.BossLevel ?? "10:15";

                int bossLevel = Extentions.Extentions.RandomBetween(rndLevels, ":");

               
                Enemymonster = _gameplayService.CreateMonsterInstance(bossId, 0, bossLevel);
                Enemymonster.IsBoss = true;

                // Scale boss stats to provide a legendary challenge
                Enemymonster.MaxHP *= 2;
                Enemymonster.HP = Enemymonster.MaxHP;
                Enemymonster.ATK = (int)(Enemymonster.ATK * 1.3);
                Enemymonster.DEF = (int)(Enemymonster.DEF * 1.5);


            }
            else
            {
                map.Nodes.Remove(form.Node);

                Random rnd = new();
                string randomRarity = _gameplayService.RandomRarity(form.Map);

                Console.WriteLine($"[CONSOLE]random rarity = {randomRarity}");
                List<MonsDef> monsDefs = _gameplayService.GetRandomNodeMonster(form.Map, randomRarity, form.Node);
                MonsDef monsDef = _gameplayService.RandomMons(monsDefs);
                Console.WriteLine($"[CONSOLE]monsDef = {monsDef.MonsterId} {monsDef.Title} {monsDef.Element}");
                int rndLevel = rnd.Next(1, Attacker.Level + 5);

                Enemymonster = _gameplayService.CreateMonsterInstance(monsDef.MonsterId, 0, rndLevel);

                
            }
            //boss battle logic

            
            // var NodeMonsters = _gameplayService.GetLocationMonsters(form.World, form.Node);
            // if (NodeMonsters == null || !NodeMonsters.Any())
            // {
            //     return BadRequest(new { success = false, reason = "no monsters at location" });
            // }

            
            // string selectMonsterId = NodeMonsters[rnd.Next(NodeMonsters.Count)];
            
            BattleState battleState = new()
            {
                PlayerId = User.ID,
                PlayerMonster = Attacker,
                EnemyMonster = Enemymonster,
                PlayerState = new MonsterState(Attacker),
                EnemyState = new MonsterState(Enemymonster),
                Status = BattleStatus.Active,
                StartedAt = DateTime.UtcNow,
                Map = form.Map,
                TurnCount = 0,
                PlayerActiveSkills = _battleService.GetActiveSkills(Attacker),
                EnemyActiveSkills = _battleService.GetActiveSkills(Enemymonster),
                PlayerCooldownSkill = null,
                EnemyCooldownSkill = null,
                PlayerLastEffect = null,
                EnemyLastEffect = null,
            };

            Attacker.IsFighting = true;
            User.TotalBattles += 1;
            User.DailyBattles += 1;


            if (battleState.EnemyMonster.IsBoss)
            {
                battleState.BossBattle = true;
            }

            await _context.Battles.AddAsync(battleState);
            await _context.SaveChangesAsync();

            Dictionary<string, double> rewards = null;
            AttackResult playerAttack = new AttackResult();
            AttackResult enemyAttack = new AttackResult();

            return Ok(new { success = true, battleState, playerAttack, enemyAttack, rewards });
        }

        private void DistributeRewards(ref UserBase User, Dictionary<string, double> Rewards)
        {
           if (Rewards != null)
            {
                foreach ( var k in Rewards)
                {
                    if (k.Key == "TON" || k.Key == "GOLD" || k.Key == "EGGS")
                    {
                        User.Credit(k.Key, k.Value, $"battle_rewards");
                    }
                    else
                    {
                        User.AddItems(k.Key, (int)k.Value, "battle_rewards");
                    }
                }
            } 
        }

        [HttpPost("use-consumable")]
        public async Task<IActionResult> UseConsumable()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            var form = await GetForm( new
            {
                Consumable = "",
                BattleId = new Guid()
            });

            BattleState battleState = await _context.Battles
                .Include(b => b.PlayerMonster)
                .Include(b => b.EnemyMonster)
                .FirstOrDefaultAsync(x => x.BattleId == form.BattleId);

            if (battleState == null)
            {
                return Ok(new { success = false, reason = "battle not found"});
            }
            if (battleState.PlayerMonster == null || battleState.EnemyMonster == null)
            {
                return Ok( new { success = false, reason = "invalid battle data"});
            }
            if (battleState.PlayerId != User.ID)
            {
                return Ok( new { success = false });
            }
                

            if (battleState.Status != BattleStatus.Active)
            {
                return Ok( new { success = false, reason = "battle already ended"});
            }
                
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = false, reason = "battle is forfeited"});
            }
            
            string consumable = form.Consumable;

            if (consumable == "MonstaBall")
            {
                return Ok (new { success = true, battleState });
            }

            string consumable_id = _userService.CheckConsumable(User, consumable);

            if (consumable_id == null)
            {
                return Ok( new { success = false, reason = "invalid consumable_id"});
            }

            
            if (consumable_id == "HealSpell")
            {
                battleState.BattleConusmable.HealSpell += 1;
                battleState.PlayerMonster.HealMonster(100, "battle_heal");
                User.AddItems(consumable, -1, $"heal={battleState.PlayerMonster.InstanceId}");
            }
            else
            {
                User.AddItems(consumable, -1, $"use={battleState.BattleId}");
                battleState.PlayerActiveSkills.Add(consumable_id+"-consumable");
            }

            await _context.SaveChangesAsync();
            return Ok( new { success = true, battleState});
        }




        [HttpPost("battle/attack")]
        public async Task<IActionResult> Attack()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            HttpContext.Items.TryGetValue("ID", out var id);

            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //test user

            var form = await GetForm( new
            {
                BattleId = new Guid(),
                SkillId = ""
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);

            if (battleState == null)
                return Ok( new { success = false, reason = "battle not found"});

            if (battleState.PlayerMonster == null || battleState.EnemyMonster == null)
                return Ok( new { success = false, reason = "invalid battle data"});

            battleState.PlayerState ??= new MonsterState(battleState.PlayerMonster);
            battleState.EnemyState ??= new MonsterState(battleState.EnemyMonster);
            battleState.PlayerActiveSkills ??= _battleService.GetActiveSkills(battleState.PlayerMonster);
            battleState.EnemyActiveSkills ??= _battleService.GetActiveSkills(battleState.EnemyMonster);

            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });

            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = false, reason = "battle already ended"});
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = false, reason = "battle is forfeited"});
            }

            if (!battleState.PlayerActiveSkills.Contains(form.SkillId))
                return Ok( new { success = false, reason = "unknown skill"});

            if (battleState.PlayerCooldownSkill == form.SkillId)
                return Ok( new { success = false, reason = "skill cooldown"});

            string skillId = form.SkillId.Split('-', 2)[0];
            SkillDef skillDef = _gameplayService.GetSkillDef(skillId);
            if (skillDef == null)
                return Ok( new { success = false, reason = "unknown skill"});

            if (battleState.PlayerState.Energy - skillDef.EnergyCost < 0)
            {
                return Ok( new { success = false, reason = "no sufficient energy to use the skill"});
            }


            battleState.TurnCount += 1;

            // --- Energy Regeneration Boost (SPD-based) ---
            int playerEnergyRegen = 10 + (battleState.PlayerMonster.SPD / 5);
            int enemyEnergyRegen = 10 + (battleState.EnemyMonster.SPD / 5);
            battleState.PlayerState.Energy = Math.Min(100, battleState.PlayerState.Energy + playerEnergyRegen);
            battleState.EnemyState.Energy = Math.Min(100, battleState.EnemyState.Energy + enemyEnergyRegen);

            //player attack on enemy
            MonsterState PlayerState = battleState.PlayerState;
            MonsterState EnemyState = battleState.EnemyState;
            //reset pending heal
            PlayerState.PendingHeal = 0;
            EnemyState.PendingHeal = 0;
            
            AttackResult playerAttack = _battleService.PlayerAttack(ref battleState, form.SkillId, ref PlayerState, ref EnemyState);
            AttackResult enemyAttack = null;

            Dictionary<string, double> rewards = null;

            BattleService.BossBattle bossBattle = null;
            if (battleState.BossBattle && battleState.TurnCount == 1)
            {
                bossBattle = await _context.BossBattleData.FirstOrDefaultAsync(x => x.Date == DateTime.UtcNow.Date);
                if (!bossBattle.BattleIds.Contains(battleState.BattleId))
                {
                    bossBattle.BattleIds.Add(battleState.BattleId);
                }
            }
            int upXP = _gameplayService.GetMonsterXp(battleState.PlayerMonster.Role);


            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;

            if (battleState.PlayerMonster.HP >= battleState.PlayerMonster.MaxHP)
             {   battleState.PlayerMonster.HP = battleState.PlayerMonster.MaxHP;}

            //player lose
            if (battleState.PlayerMonster.HP <= 0)
            {
                battleState.PlayerMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;

                battleState.PlayerMonster.AddXP(upXP);

                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, battleState, playerAttack, enemyAttack, rewards });

            }

            //player won
            if (battleState.EnemyMonster.HP <= 0)
            {
                battleState.EnemyMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                User.DailyVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;

                battleState.PlayerMonster.AddXP(upXP*2);

                //give victory reward to player
                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, battleState, playerAttack, enemyAttack, rewards });
            }
            
            enemyAttack = _battleService.EnemyAttack(ref battleState, ref EnemyState, ref PlayerState);

            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;
            
            if (battleState.EnemyMonster.HP >= battleState.EnemyMonster.MaxHP)
                battleState.EnemyMonster.HP = battleState.EnemyMonster.MaxHP;

            //enemy loase
            if (battleState.EnemyMonster.HP <= 0)
            {
                battleState.EnemyMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                User.DailyVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;


                battleState.PlayerMonster.AddXP(upXP*2);


                //give victory reward to player
                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, battleState, playerAttack, enemyAttack, rewards});

                
            }

            //player lose
            if (battleState.PlayerMonster.HP <= 0)
            {
                battleState.PlayerMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;


                battleState.PlayerMonster.AddXP(upXP);


                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;
            }

            await _context.SaveChangesAsync();

            return Ok( new { success = true, battleState, playerAttack, enemyAttack, rewards }); 
        }


        




        [HttpPost("monster/catch")]
        public async Task<IActionResult> CatchMonster()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            if (user == null || user is not TelegramUser telegramUser)
            {
                return BadRequest(new { success = false, reason = "Invalid user context" });
            }

            UserBase User = await _userService.GetOrCreateUser(telegramUser);
            
            var form = await GetForm( new
            {
                BattleId = new Guid()
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);
            if (battleState == null)
                return Ok(new { success = false });
            
            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });
            
            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = false, reason = "battle is ended" });
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = false, reason = "battle is forfeited"});
            }

            battleState.PlayerState ??= new MonsterState(battleState.PlayerMonster);
            battleState.EnemyState ??= new MonsterState(battleState.EnemyMonster);
            battleState.PlayerActiveSkills ??= _battleService.GetActiveSkills(battleState.PlayerMonster);
            battleState.EnemyActiveSkills ??= _battleService.GetActiveSkills(battleState.EnemyMonster);

            if (User.Items.MonstaBall <= 0)
                return Ok( new { success = false, reason = "not enough monsta ball"});

            double catchChance;
            try
            {
                catchChance = _gameplayService.GetOddRange(battleState.EnemyMonster);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CatchMonster] failed to compute catch odds for rarity='{battleState.EnemyMonster.Rarity}' hp={battleState.EnemyMonster.HP}: {ex}");
                return Ok(new { success = false, reason = "catch odds unavailable" });
            }

            battleState.TurnCount += 1;
            Random random = new Random();

            int upXP = _gameplayService.GetMonsterXp(battleState.PlayerMonster.Role);
            Dictionary<string, double> rewards = new();

            AttackResult playerAttack = new();
            AttackResult enemyAttack = new();

            if (User.Items.MonstaBall > 0)
            {
                User.AddItems("MonstaBall", -1, $"trycatch={battleState.EnemyMonster.InstanceId}");
                battleState.BattleConusmable.MonstaBall += 1;
            }
            
            if (random.NextDouble() <= catchChance)
            {
                battleState.EnemyMonster.OwnerID = User.ID;
                User.Monsters.Add(battleState.EnemyMonster.InstanceId);
                User.TotalVictory += 1;
                User.DailyVictory += 1;
                battleState.Victory = true;
                battleState.PlayerMonster.IsFighting = false;
                battleState.EnemyMonster.CaptureAt = DateTime.UtcNow;
                battleState.Status = BattleStatus.Completed;
                
                //give the victory rewards

                battleState.PlayerMonster.AddXP(upXP*2);

                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, capture = true, battleState, playerAttack, enemyAttack, rewards });
                
            }

            //catch is unsuccessful, let enemy attack
            MonsterState PlayerState = battleState.PlayerState;
            MonsterState EnemyState = battleState.EnemyState;

            enemyAttack = _battleService.EnemyAttack(ref battleState, ref EnemyState, ref PlayerState);

            battleState.PlayerState = PlayerState;
            battleState.EnemyState = EnemyState;

            
            
            if (battleState.EnemyMonster.HP >= battleState.EnemyMonster.MaxHP)
                battleState.EnemyMonster.HP = battleState.EnemyMonster.MaxHP;

            //enemy loase
            if (battleState.EnemyMonster.HP <= 0)
            {
                battleState.EnemyMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                User.TotalVictory += 1;
                User.DailyVictory += 1;
                battleState.Victory = true;
                battleState.Status = BattleStatus.Completed;


                //give victory reward to player
                battleState.PlayerMonster.AddXP(upXP*2);

                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;

                await _context.SaveChangesAsync();

                return Ok( new { success = true, capture = false, battleState, playerAttack, enemyAttack, rewards });

                

                
            }

            //player lose
            if (battleState.PlayerMonster.HP <= 0)
            {
                battleState.PlayerMonster.HP = 0;
                battleState.PlayerMonster.IsFighting = false;
                battleState.Victory = false;
                battleState.Status = BattleStatus.Completed;

                battleState.PlayerMonster.AddXP(upXP);

                rewards = await _mapService.CalculateRewards(battleState);
                DistributeRewards(ref User, rewards);
                battleState.RewardProcessed = true;
            }

            await _context.SaveChangesAsync();

            return Ok( new { success = true, capture = false, battleState, playerAttack, enemyAttack, rewards });            
        }

        [HttpPost("battle/escape")]
        public async Task<IActionResult> EscapeBattle()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //testuser
            var form = await GetForm( new
            {
                BattleId = new Guid()
            });

            BattleState battleState = await _context.Battles.Include(b => b.PlayerMonster).Include(b => b.EnemyMonster).FirstOrDefaultAsync(b => b.BattleId == form.BattleId);
            if (battleState == null)
                return Ok(new { success = false });
            
            if (battleState.PlayerId != User.ID)
                return Ok( new { success = false });
            
            if (battleState.Status != BattleStatus.Active)
                return Ok( new { success = true, reason = "battle is ended" });
            
            if (battleState.StartedAt.AddMinutes(15) < DateTime.UtcNow && battleState.Status == BattleStatus.Active)
            {
                battleState.Status = BattleStatus.Forfeited;
                battleState.PlayerMonster.IsFighting = false;
                await _context.SaveChangesAsync();
                return Ok( new { success = true, reason = "battle is forfeited"});
            }

            battleState.Status = BattleStatus.Forfeited;
            battleState.PlayerMonster.IsFighting = false;
            

            await _context.SaveChangesAsync();

            return Ok( new { success = true, battleState });
        }

        [HttpPost("items")]
        public async Task<IActionResult> Items()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            return Ok(new { success = true, Items = User.Items });
        }

        [HttpPost("inventory")]
        public async Task<IActionResult> Inventory()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user); //testuser

            var form = await GetForm(new { pageIndex = 0 });

            int startIndex = 6 * form.pageIndex;

            var monsterIds = (User.Monsters ?? Enumerable.Empty<string>())
                .Skip(startIndex)
                .Take(6)
                .ToList();

            if (!monsterIds.Any())
            {
                return Ok(new { success = true, Monsters = new List<Monster>(), totalMonsters = User.Monsters.Count() });
            }

            var monsters = await _context.Monsters
                .Where(m => monsterIds.Contains(m.InstanceId))
                .ToListAsync();

            return Ok(new { success = true, Monsters = monsters, totalMonsters = User.Monsters.Count() });
        }


        private static double _cachedTonPrice = 0;
        private static DateTime _priceCacheExpiration = DateTime.MinValue;
        private static SemaphoreSlim? _priceCacheLock;
        private static SemaphoreSlim PriceCacheLock => _priceCacheLock ??= new SemaphoreSlim(1, 1);

        private async Task<double> GetTonPrice()
        {
            if (DateTime.UtcNow < _priceCacheExpiration && _cachedTonPrice > 0)
            {
                return _cachedTonPrice;
            }

            await PriceCacheLock.WaitAsync();
            try
            {
                // Double check after acquiring lock
                if (DateTime.UtcNow < _priceCacheExpiration && _cachedTonPrice > 0)
                {
                    return _cachedTonPrice;
                }

                if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
                {
                    _httpClient.DefaultRequestHeaders.Add("User-Agent", "MonsterWorldApp/1.0");
                }

                // Primary API: Gate.io (fast, free, very high rate limit)
                string url = System.Environment.GetEnvironmentVariable("TON_PRICE_API_URL")
                    ?? "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=TON_USDT";
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                    {
                        var lastStr = doc.RootElement[0].GetProperty("last").GetString();
                        if (double.TryParse(lastStr, System.Globalization.CultureInfo.InvariantCulture, out double parsedPrice) && parsedPrice > 0)
                        {
                            _cachedTonPrice = parsedPrice;
                            _priceCacheExpiration = DateTime.UtcNow.AddSeconds(30);
                            return _cachedTonPrice;
                        }
                    }
                }

                // Fallback API: CoinGecko (slower, low rate limit)
                string fallbackUrl = System.Environment.GetEnvironmentVariable("TON_PRICE_FALLBACK_API_URL")
                    ?? "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currency=usd";
                var fallbackResponse = await _httpClient.GetAsync(fallbackUrl);
                if (fallbackResponse.IsSuccessStatusCode)
                {
                    var json = await fallbackResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    double parsedPrice = (double)doc.RootElement
                        .GetProperty("the-open-network")
                        .GetProperty("usd")
                        .GetDecimal();
                    if (parsedPrice > 0)
                    {
                        _cachedTonPrice = parsedPrice;
                        _priceCacheExpiration = DateTime.UtcNow.AddSeconds(30);
                        return _cachedTonPrice;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching TON price: {ex.Message}");
            }
            finally
            {
                PriceCacheLock.Release();
            }

            // Return last successfully cached price, or 5.0 as a safe fallback if never loaded
            return _cachedTonPrice > 0 ? _cachedTonPrice : 5.0;
        }

        // private readonly List<string> ExchangePairs = new() { "TON:GOLD", "EGGS:TON"};
        [ValidateRequestIgnore]
        [HttpPost("exchange-terms")]
        public async Task<IActionResult> ExchangeTerms()
        {
            var EGGSPriceUSDT = await _poolService.GetEggsPrice();
            var EGGSPriceTON = EGGSPriceUSDT / await GetTonPrice();

            var ExchangePairs = _gameplayService.GetExchangePairs();
            var ExchangeRate = _gameplayService.GetExchangeRates();

            ExchangeRate.First(x => x.Pair == "EGGS-TON").Rate = "1:"+EGGSPriceTON;


            
            return Ok(new { success = true, ExchangePairs, ExchangeRate, EGGSPriceUSDT, EGGSPriceTON });
        }


        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var leaderboardConfig = _gameplayService.GetLeaderboardConfig();
            if (leaderboardConfig == null)
            {
                return BadRequest(new { success = false, reason = "Leaderboard configuration is missing." });
            }

            var start = leaderboardConfig.StartDate;
            var end = leaderboardConfig.EndDate;

            // Find all users who registered between start and end and have a referrer
            var qualifiedUsers = await _context.Users
                // .Where(u => u.RegistrationDate >= start && u.RegistrationDate <= end && u.ReferrerID > 0)
                // .Select(u => new { u.ID, u.ReferrerID })
                .ToListAsync();

            // Group by ReferrerID to get referral count in this period
            var referralCounts = qualifiedUsers
                .GroupBy(u => u.ReferrerID)
                .Select(g => new { ReferrerID = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            // Get usernames of the top referrers
            var topReferrers = referralCounts.Take(20).ToList();
            var referrerIds = topReferrers.Select(r => r.ReferrerID).ToList();
            var usersInfo = await _context.Users
                .Where(u => referrerIds.Contains(u.ID))
                .ToDictionaryAsync(u => u.ID, u => new { u.Username, u.FirstName, u.LastName });

            var leaderboardList = topReferrers.Select((r, index) =>
            {
                int rank = index + 1;
                string usernameOrId = "Unknown";
                if (usersInfo.TryGetValue(r.ReferrerID, out var info))
                {
                    usernameOrId = !string.IsNullOrEmpty(info.Username) ? info.Username : r.ReferrerID.ToString();
                }
                else
                {
                    usernameOrId = r.ReferrerID.ToString();
                }

                double prize = 0;
                var dist = leaderboardConfig.Distribution.FirstOrDefault(d => d.Rank == rank);
                if (dist != null)
                {
                    prize = leaderboardConfig.TotalPool * (dist.Percentage / 100.0);
                }

                return new
                {
                    Rank = rank,
                    Username = usernameOrId,
                    TotalReferral = r.Count,
                    Prize = prize
                };
            }).ToList();

            // Determine requesting user's rank and count
            int myRank = 0;
            int myCount = 0;
            var myGroup = referralCounts.Select((r, index) => new { r.ReferrerID, Rank = index + 1, r.Count })
                .FirstOrDefault(x => x.ReferrerID == User.ID);
            if (myGroup != null)
            {
                myRank = myGroup.Rank;
                myCount = myGroup.Count;
            }

            return Ok(new
            {
                success = true,
                startDate = start,
                endDate = end,
                totalPool = leaderboardConfig.TotalPool,
                rewardCurrency = leaderboardConfig.RewardCurrency,
                isActive = DateTime.UtcNow >= start && DateTime.UtcNow <= end,
                myRank,
                myCount,
                leaderboard = leaderboardList
            });
        }


        [HttpPost("leaderboard/distribute")]
        public async Task<IActionResult> DistributeLeaderboardRewards()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            if (User.Role != Roles.Administrator)
            {
                return Ok(new { success = false, reason = "Unauthorized. Admin role is required." });
            }

            var leaderboardConfig = _gameplayService.GetLeaderboardConfig();
            if (leaderboardConfig == null)
            {
                return BadRequest(new { success = false, reason = "Leaderboard configuration is missing." });
            }

            var start = leaderboardConfig.StartDate;
            var end = leaderboardConfig.EndDate;

            if (DateTime.UtcNow < end)
            {
                return Ok(new { success = false, reason = "Leaderboard period has not ended yet. End date: " + end });
            }

            var payloadMarker = $"leaderboard_rewards_distributed_{start:yyyyMMdd}_{end:yyyyMMdd}";

            using var dbTx = await _context.Database.BeginTransactionAsync();
            try
            {
                // Find all users who registered between start and end and have a referrer
                var qualifiedUsers = await _context.Users
                    .Where(u => u.RegistrationDate >= start && u.RegistrationDate <= end && u.ReferrerID > 0)
                    .Select(u => new { u.ID, u.ReferrerID })
                    .ToListAsync();

                // Group by ReferrerID to get referral count in this period
                var referralCounts = qualifiedUsers
                    .GroupBy(u => u.ReferrerID)
                    .Select(g => new { ReferrerID = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                var distributionList = leaderboardConfig.Distribution.OrderBy(d => d.Rank).ToList();
                var distributedUserIds = new List<long>();
                var rewardsPaid = new List<object>();

                foreach (var dist in distributionList)
                {
                    int rankIndex = dist.Rank - 1;
                    if (rankIndex >= referralCounts.Count)
                    {
                        continue; // Not enough players participated
                    }

                    var topReferrer = referralCounts[rankIndex];
                    var recipientUser = await _context.Users.FirstOrDefaultAsync(u => u.ID == topReferrer.ReferrerID);
                    if (recipientUser == null)
                    {
                        continue;
                    }

                    // Check if they already received this reward
                    if (recipientUser.Payloads != null && recipientUser.Payloads.Contains(payloadMarker))
                    {
                        continue;
                    }

                    double rewardAmount = leaderboardConfig.TotalPool * (dist.Percentage / 100.0);

                    // Credit the reward
                    recipientUser.Credit(leaderboardConfig.RewardCurrency, rewardAmount, $"leaderboard_reward_rank_{dist.Rank}");
                    if (leaderboardConfig.RewardCurrency == "EGGS" && rewardAmount > 0)
                    {
                        try
                        {
                            string userNameInfo = string.IsNullOrEmpty(recipientUser.Username) ? "N/A" : $"@{recipientUser.Username}";
                            await _tgbot.NotifyAdmin($"🍳 <b>Egg Reward Alert!</b>\nUser: <b>{recipientUser.FirstName} {recipientUser.LastName}</b> ({userNameInfo}, ID: <code>{recipientUser.ID}</code>) received <b>{rewardAmount:F4} EGGS</b> as leaderboard reward (Rank {dist.Rank}).");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[EGGS_NOTIFICATION] Failed to notify admin: {ex.Message}");
                        }
                    }

                    if (recipientUser.Payloads == null)
                    {
                        recipientUser.Payloads = new List<string>();
                    }
                    recipientUser.Payloads.Add(payloadMarker);

                    _context.Users.Update(recipientUser);
                    distributedUserIds.Add(recipientUser.ID);
                    rewardsPaid.Add(new { rank = dist.Rank, userId = recipientUser.ID, username = recipientUser.Username, reward = rewardAmount });
                }

                if (distributedUserIds.Any())
                {
                    await _context.SaveChangesAsync();
                    await dbTx.CommitAsync();
                    return Ok(new { success = true, message = "Rewards successfully distributed.", rewards = rewardsPaid });
                }
                else
                {
                    await dbTx.RollbackAsync();
                    return Ok(new { success = false, reason = "Rewards were already distributed or no qualifying users exist." });
                }
            }
            catch (Exception ex)
            {
                await dbTx.RollbackAsync();
                return StatusCode(500, new { success = false, reason = "Internal error distributing rewards: " + ex.Message });
            }
        }

        [HttpGet("missions")]
        public async Task<IActionResult> GetMissions()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var activeMissions = await _context.AvailableMissions
                .Where(m => m.IsActive)
                .ToListAsync();

            var userCompletedMissions = User.Missions ?? new List<string>();

            var maxLevel = await _context.Monsters
                .Where(m => m.OwnerID == User.ID)
                .Select(m => (int?)m.Level)
                .MaxAsync() ?? 1;

            var uniqueCount = User.Monsters?.Distinct().Count() ?? 0;

            var missionsList = activeMissions.Select(m => {
                int progress = 0;
                int target = 1;
                bool completed = false;

                if (m.VerificationType == "defeat_monsters")
                {
                    progress = User.DailyVictory;
                    target = 10;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "complete_battles")
                {
                    progress = User.DailyBattles;
                    target = 3;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "heal_hp")
                {
                    progress = User.DailyHealedHP;
                    target = 200;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "open_chests")
                {
                    progress = User.DailyChestsOpened;
                    target = 2;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "defeat_monsters_weekly")
                {
                    progress = (int)User.TotalVictory;
                    target = 50;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "complete_battles_weekly")
                {
                    progress = User.TotalBattles;
                    target = 20;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "monster_level_achievement")
                {
                    progress = maxLevel;
                    target = 10;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "collect_monsters_achievement")
                {
                    progress = uniqueCount;
                    target = 5;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }
                else if (m.VerificationType == "daily_login_streak")
                {
                    progress = User.LoginStreak;
                    target = 7;
                    completed = User.StreakClaimed;
                }
                else
                {
                    progress = userCompletedMissions.Contains(m.MissionId.ToString()) ? 1 : 0;
                    target = 1;
                    completed = userCompletedMissions.Contains(m.MissionId.ToString());
                }

                return new
                {
                    m.MissionId,
                    m.Title,
                    m.Description,
                    m.RewardAmount,
                    m.RewardCurrency,
                    m.VerificationType,
                    m.VerificationUrl,
                    Category = m.Category ?? "Daily",
                    Progress = progress,
                    Target = target,
                    Completed = completed
                };
            }).ToList();

            return Ok(new { success = true, missions = missionsList });
        }

        [HttpPost("mission/create")]
        public async Task<IActionResult> CreateMission()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            if (User.Role != Roles.Administrator)
            {
                return Ok(new { success = false, reason = "Unauthorized. Admin role is required." });
            }

            var form = await GetForm(new
            {
                Title = "",
                Description = "",
                RewardAmount = 0.0,
                RewardCurrency = "GOLD",
                VerificationType = "telegram_join",
                VerificationUrl = "",
                Category = "Daily"
            });

            if (string.IsNullOrWhiteSpace(form.Title))
            {
                return Ok(new { success = false, reason = "Title is required." });
            }

            var newMission = new Mission
            {
                MissionId = Guid.NewGuid(),
                Title = form.Title,
                Description = form.Description,
                RewardAmount = form.RewardAmount,
                RewardCurrency = form.RewardCurrency,
                VerificationType = form.VerificationType,
                VerificationUrl = form.VerificationUrl,
                IsActive = true,
                Category = form.Category
            };

            await _context.AvailableMissions.AddAsync(newMission);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, mission = newMission });
        }

        [HttpPost("mission/verify")]
        public async Task<IActionResult> VerifyMission()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm(new
            {
                MissionId = ""
            });

            if (!Guid.TryParse(form.MissionId, out Guid missionGuid))
            {
                return Ok(new { success = false, reason = "Invalid MissionId format." });
            }

            var mission = await _context.AvailableMissions.FirstOrDefaultAsync(m => m.MissionId == missionGuid && m.IsActive);
            if (mission == null)
            {
                return Ok(new { success = false, reason = "Mission not found or inactive." });
            }

            if (User.Missions == null)
            {
                User.Missions = new List<string>();
            }

            if (User.Missions.Contains(mission.MissionId.ToString()))
            {
                return Ok(new { success = false, reason = "Mission already completed." });
            }

            if (mission.VerificationType == "daily_login_streak")
            {
                return Ok(new { success = false, reason = "Claim streak rewards directly inside the Streak menu." });
            }

            if (mission.VerificationType == "telegram_join")
            {
                string channelUsername = "";
                if (!string.IsNullOrEmpty(mission.VerificationUrl))
                {
                    var uriStr = mission.VerificationUrl.Trim();
                    if (uriStr.Contains("t.me/"))
                    {
                        var parts = uriStr.Split("t.me/");
                        if (parts.Length > 1)
                        {
                            channelUsername = "@" + parts[1].Split('/')[0].Split('?')[0].Trim();
                        }
                    }
                    else if (uriStr.StartsWith("@"))
                    {
                        channelUsername = uriStr;
                    }
                }

                if (string.IsNullOrEmpty(channelUsername))
                {
                    return Ok(new { success = false, reason = "Telegram channel URL is not configured correctly." });
                }

                try
                {
                    var member = await _botClient.GetChatMember(channelUsername, User.ID);
                    var statusStr = member.Status.ToString().ToLower();
                    if (statusStr == "left" || statusStr == "kicked")
                    {
                        return Ok(new { success = false, reason = "You haven't joined the Telegram channel yet!" });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[TELEGRAM_JOIN_VERIFICATION] Failed to verify membership on {channelUsername} for user {User.ID}. Exception: {ex.Message}");
                    return Ok(new { success = false, reason = $"Verification failed. Make sure you joined the channel {channelUsername} and try again." });
                }
            }

            // Verify progress criteria for daily missions
            if (mission.VerificationType == "defeat_monsters" && User.DailyVictory < 10)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Defeat 10 monsters required)." });
            }
            if (mission.VerificationType == "complete_battles" && User.DailyBattles < 3)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Complete 3 battles required)." });
            }
            if (mission.VerificationType == "heal_hp" && User.DailyHealedHP < 200)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Heal in total 200 HP required)." });
            }
            if (mission.VerificationType == "open_chests" && User.DailyChestsOpened < 2)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Open 2 chests required)." });
            }
            if (mission.VerificationType == "defeat_monsters_weekly" && User.TotalVictory < 50)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Defeat 50 monsters required)." });
            }
            if (mission.VerificationType == "complete_battles_weekly" && User.TotalBattles < 20)
            {
                return Ok(new { success = false, reason = "Mission not completed yet (Complete 20 battles required)." });
            }
            if (mission.VerificationType == "monster_level_achievement")
            {
                var maxLevel = await _context.Monsters.Where(m => m.OwnerID == User.ID).Select(m => (int?)m.Level).MaxAsync() ?? 1;
                if (maxLevel < 10) return Ok(new { success = false, reason = "Mission not completed yet (Level 10 monster required)." });
            }
            if (mission.VerificationType == "collect_monsters_achievement")
            {
                var uniqueCount = User.Monsters?.Distinct().Count() ?? 0;
                if (uniqueCount < 5) return Ok(new { success = false, reason = "Mission not completed yet (Collect 5 unique monsters required)." });
            }

            // Mark mission as complete, add to User's completed list, and credit reward
            if (mission.RewardCurrency == "GOLD" || mission.RewardCurrency == "TON" || mission.RewardCurrency == "EGGS")
            {
                User.Credit(mission.RewardCurrency, mission.RewardAmount, $"mission_verify={mission.MissionId}");
                if (mission.RewardCurrency == "EGGS" && mission.RewardAmount > 0)
                {
                    try
                    {
                        string userNameInfo = string.IsNullOrEmpty(User.Username) ? "N/A" : $"@{User.Username}";
                        await _tgbot.NotifyAdmin($"🍳 <b>Egg Reward Alert!</b>\nUser: <b>{User.FirstName} {User.LastName}</b> ({userNameInfo}, ID: <code>{User.ID}</code>) received <b>{mission.RewardAmount:F4} EGGS</b> as reward for mission <b>{mission.Title}</b>.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[EGGS_NOTIFICATION] Failed to notify admin: {ex.Message}");
                    }
                }
            }
            else
            {
                User.AddItems(mission.RewardCurrency, (int)mission.RewardAmount, $"mission_verify={mission.MissionId}");
            }
            User.Missions.Add(mission.MissionId.ToString());

            _context.Users.Update(User);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Mission verified and reward credited.", balance = User.Balance });
        }

        [HttpPost("chest/open")]
        public async Task<IActionResult> OpenChest()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            if (User.Balance.GOLD < 50)
            {
                return Ok(new { success = false, reason = "Not enough Gold. Opening a chest costs 50 Gold." });
            }

            User.Credit("GOLD", -50, "open_chest_fee");
            User.DailyChestsOpened += 1;

            var random = new Random();
            var itemsReward = new Dictionary<string, int>();

            if (random.NextDouble() < 0.6) itemsReward["MonstaBall"] = 1;
            if (random.NextDouble() < 0.6) itemsReward["HealSpell"] = 1;
            if (random.NextDouble() < 0.2) itemsReward["RagePotion"] = 1;

            if (itemsReward.Count == 0)
            {
                itemsReward["HealSpell"] = 1;
            }

            foreach (var kvp in itemsReward)
            {
                User.AddItems(kvp.Key, kvp.Value, "open_chest_reward");
            }

            _context.Users.Update(User);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Chest opened!",
                rewards = itemsReward,
                balance = User.Balance,
                dailyChestsOpened = User.DailyChestsOpened
            });
        }


        [HttpPost("exchange")]
        public async Task<IActionResult> Exchange()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);
            UserAnalytics analytics = await _context.Analytics.FirstOrDefaultAsync(x => x.ID == User.ID);

            POOL pool = await _context.Pool.FirstAsync();

            var form = await GetForm(new
            {
                To = "",
                From = "",
                Amount = 0d
            });

            var ExchangePairs = _gameplayService.GetExchangePairs();
            var exchangeRates = _gameplayService.GetExchangeRates();

            if (!ExchangePairs.Contains(form.From + "-" + form.To))
                return Ok(new { success = false, reason = "pair not found" });

            var rateObj = exchangeRates.FirstOrDefault(x => x.Pair.Equals(form.From + "-" + form.To, StringComparison.OrdinalIgnoreCase));
            if (rateObj == null)
                return Ok(new { success = false, reason = "pair not found" });

            string[] rateParts = rateObj.Rate.Split(':');
            if (rateParts.Length != 2 || !double.TryParse(rateParts[0], out double fromPart) || !double.TryParse(rateParts[1], out double toPart))
                return Ok(new { success = false, reason = "invalid rate configuration" });

            if (form.From == "EGGS" && form.To == "TON")
            {
                if (User.Balance.EGGS >= form.Amount && form.Amount > 0)
                {
                    double EGGSPrice = await _poolService.GetEggsPrice();
                    double ExchangePrice = form.Amount * EGGSPrice;
                    double TONConversion = ExchangePrice / await GetTonPrice();

                    await _poolService.BurnEggsSupply(form.Amount);
                    await _poolService.RemoveUSDTLiquidity(ExchangePrice);

                    analytics.TotalExchanged += ExchangePrice;
                
                    User.Credit("EGGS", -form.Amount, $"exchange=EGGStoTON");
                    User.Credit("TON", TONConversion, $"exchange=EGGStoTON");

                    await _context.SaveChangesAsync();
                }
                else
                {
                    return Ok(new { success = false, reason = "insufficient balance" });
                }
            }
            else if (form.From == "TON" && form.To == "GOLD")
            {
                if (User.Balance.TON >= form.Amount && form.Amount > 0)
                {
                    double USDTLiquidity = form.Amount * await GetTonPrice();
                    double GOLDReceiving = (form.Amount / fromPart) * toPart;

                    await _poolService.AddUSDTLiquidity(USDTLiquidity);
                    analytics.TotalInvested += USDTLiquidity;

                    User.Credit("TON", -form.Amount, "exchange=TONtoGOLD");
                    User.Credit("GOLD", GOLDReceiving, "exchange=TONtoGOLD");

                    await _context.SaveChangesAsync();    
                }
                else
                {
                    return Ok(new { success = false, reason = "insufficient balance" });
                }
            }
            else if (form.To == "GOLD")
            {
                // Item to GOLD exchange
                int currentQty = GetItemQuantity(User, form.From);
                if (currentQty >= form.Amount && form.Amount > 0)
                {
                    double GOLDReceiving = (form.Amount / fromPart) * toPart;

                    User.AddItems(form.From, -(int)form.Amount, $"exchange={form.From}toGOLD");
                    User.Credit("GOLD", GOLDReceiving, $"exchange={form.From}toGOLD");

                    await _context.SaveChangesAsync();
                }
                else
                {
                    return Ok(new { success = false, reason = "insufficient balance" });
                }
            }
            
            return Ok(new { success = true, User.Balance, User.Items, pool });
        }


        [ValidateRequestIgnore]
        [HttpGet("add/monster/{name}")]
        public async Task<IActionResult> AddMonsters(string name)
        {
            UserBase User1 = await _context.Users.FirstOrDefaultAsync(x => x.ID == 7243182477);
            UserBase User2 = await _context.Users.FirstOrDefaultAsync(x => x.ID == 7485848172);

            List<string> Monsters = new List<string>() 
            {
                "blubbo",
                "blazik",
                "quabble",
                "grunko",
                "torky",
                "slumbo",
                "cobrix",
                "chompy",
                "buzzle",
                "scarfy",
                "aquos",
                "gourdo",
                "brasko",
                "fynox",
                "wavvy",
                "wingo",
                "nocty",
                "umbrik",   
                "torky",
                "krimson",
                "malakite",
                "kobalt",
                "zenix",
                "xomox",
                "kitine"
            };

            foreach (var m in Monsters)
            {
                Monster monster = _gameplayService.CreateMonsterInstance(m, User1.ID, 10);
                User1.Monsters.Add(monster.InstanceId);

                Monster monster1 = _gameplayService.CreateMonsterInstance(m, User2.ID, 10);
                User2.Monsters.Add(monster1.InstanceId);

                await _context.Monsters.AddAsync(monster);
                await _context.Monsters.AddAsync(monster1);
            }

            await _context.SaveChangesAsync();
            return Ok(new{});
        }

        [ValidateRequestIgnore]
        [HttpGet("heal-all/{username}")]
        public async Task<IActionResult> HealAll(string username){
            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.Username == username);

            var monsters = await _context.Monsters.Where(x => User.Monsters.Contains(x.InstanceId)).ToListAsync();
            
            foreach(var monster in monsters)
            {
                monster.HP = monster.MaxHP;
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
            
        }

        [ValidateRequestIgnore]
        [HttpGet("add/items/{username}")]
        public async Task<IActionResult> AddItems( string username)
        {
            UserBase User = await _context.Users.FirstOrDefaultAsync(x => x.Username == username );
            User.Items.MonstaBall += 10;

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("monster/heal")]
        public async Task<IActionResult> HealMonster()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm( new {
                MonsterId = ""
            });

            Monster monster = await _context.Monsters.FirstOrDefaultAsync( x => x.InstanceId == form.MonsterId);

            if(monster == null)
                return Ok(new { success = false, reason = "monster not found"});

            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner"});
            
            if (monster.HP == monster.MaxHP)
                return Ok(new { success = false, reason = "hp is already max"});

            int requiredHealing = _gameplayService.CalculateHealing(monster);
            if (!(User.Items.HealSpell >= requiredHealing))
                return Ok(new { success = false, reason = "not enough healings", required = requiredHealing });

            int hpHealed = monster.MaxHP - monster.HP;
            User.AddItems("HealSpell", -requiredHealing, $"heal={monster.InstanceId}");

            monster.HP = monster.MaxHP;
            User.DailyHealedHP += hpHealed;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, monster });
        }

        [HttpPost("monster/heal-gold")]
        public async Task<IActionResult> HealMonsterWithGold()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm( new {
                MonsterId = ""
            });

            Monster monster = await _context.Monsters.FirstOrDefaultAsync( x => x.InstanceId == form.MonsterId);

            if(monster == null)
                return Ok(new { success = false, reason = "monster not found"});

            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner"});
            
            if (monster.HP == monster.MaxHP)
                return Ok(new { success = false, reason = "hp is already max"});

            int missingHP = monster.MaxHP - monster.HP;
            int requiredSpells = (int)Math.Ceiling(missingHP / 100.0);
            int goldCost = requiredSpells * 10;

            if (User.Balance.GOLD < goldCost)
                return Ok(new { success = false, reason = $"not enough GOLD, need {goldCost} GOLD" });

            User.Balance.GOLD -= goldCost;
            monster.HP = monster.MaxHP;
            User.DailyHealedHP += missingHP;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, monster, goldLeft = User.Balance.GOLD });
        }

        [HttpGet("user/monsters/all")]
        public async Task<IActionResult> GetAllUserMonsters()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var monsters = await _context.Monsters
                .Where(m => User.Monsters.Contains(m.InstanceId))
                .ToListAsync();

            return Ok(new { success = true, monsters });
        }

        [HttpGet("map/info/{mapName}")]
        public async Task<IActionResult> GetMapInfo(string mapName)
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var nextWorldMap = new Dictionary<string, string>
            {
                { "bootcamp", "riverfall" },
                { "riverfall", "costa-gueta" },
                { "costa-gueta", "volcano" },
                { "volcano", null }
            };
            nextWorldMap.TryGetValue(mapName, out var nextWorld);
            bool isBossDefeated = nextWorld != null && User.UnlockedWorlds != null && User.UnlockedWorlds.Contains(nextWorld);

            var mapEntry = _gameplayService.Gameplay.MapMonsters.FirstOrDefault(m => m.Map.Equals(mapName, StringComparison.OrdinalIgnoreCase));
            var uniqueMapMonsters = mapEntry != null ? mapEntry.Monsters : new List<string>();

            var userMonsters = await _context.Monsters
                .Where(m => User.Monsters.Contains(m.InstanceId))
                .ToListAsync();
            var userMonsterSpecies = userMonsters.Select(m => m.Id).ToList();

            var capturedMonsters = uniqueMapMonsters.Where(m => userMonsterSpecies.Contains(m)).ToList();

            return Ok(new {
                success = true,
                monsters = uniqueMapMonsters,
                capturedMonsters = capturedMonsters,
                isBossDefeated = isBossDefeated
            });
        }

        public class MonsterInfo
        {
            public string InstanceId { get; set; }
            public long OwnerID { get; set; }
            public string Title { get; set; }
            public string Element { get; set; }
            public string Desc { get; set; }
            public int Level { get; set; }
            public int XP { get; set; }
            public int MaxXP { get; set; }
            public int MaxHP { get; set; }
            public int HP { get; set; }
            public int Attack { get; set; }
            public int Defense { get; set; }
            public int Speed { get; set; }
            public List<Ability> Abilities { get; set; } = new();
            public DateTime CapturedAt { get; set; }
        }
        
        [HttpPost("monster/info")]
        public async Task<IActionResult> GetMonsterInfo()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm(new
            {
                monsterId = ""
            });

            if (!User.Monsters.Contains(form.monsterId))
                return Ok(new { success = false, reason = "no such monster in inventory"});

            Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == form.monsterId);

            if (monster == null)
                return Ok(new { success = false, reason = "monster not found" });

            
            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner"});


            MonsDef def = _gameplayService.GetMonsDef(monster.Id);
            // LevelTable levelTable = _gameplayService.GetLevelTable(def.LvlTableId);
            // LevelStat stat = levelTable.LvlTable.FirstOrDefault(x => x.Lvl == monster.Level);
            MonsterInfo Info = new()
            {
                InstanceId = monster.InstanceId,
                OwnerID = monster.OwnerID,
                Title = monster.Title,
                Element = monster.Element,
                Desc = monster.Desc,
                Level = monster.Level,
                XP = monster.XP,
                MaxXP = monster.MaxXP,
                MaxHP = monster.MaxHP,
                HP = monster.HP,
                Attack = monster.ATK,
                Defense = monster.DEF,
                Speed = monster.SPD,
                Abilities = def.Abilities.DistinctBy(x => x.SkillId).ToList(),
                CapturedAt = monster.CaptureAt
            };

            return Ok( new { success = true, Info });
        }

        [HttpPost("monster/level-up")]
        public async Task<IActionResult> LevelUpMonster()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser)user);

            var form = await GetForm(new
            {
                monsterId = ""
            });

            if (!User.Monsters.Contains(form.monsterId))
                return Ok(new { success = false, reason = "no such monster in inventory" });

            Monster monster = await _context.Monsters.FirstOrDefaultAsync(x => x.InstanceId == form.monsterId);

            if (monster == null)
                return Ok(new { success = false, reason = "monster not found" });

            if (monster.OwnerID != User.ID)
                return Ok(new { success = false, reason = "not an owner" });

            if (monster.XP < monster.MaxXP)
                return Ok(new { success = false, reason = "not enough XP to level up" });

            _gameplayService.LevelUpMonster(monster);
            _context.Monsters.Update(monster);

            // Recalculate and update user level
            int maxMonsterLevel = await _context.Monsters
                .Where(m => m.OwnerID == User.ID)
                .Select(m => (int?)m.Level)
                .MaxAsync() ?? 1;

            if (maxMonsterLevel > User.Level)
            {
                User.Level = maxMonsterLevel;
                _context.Users.Update(User);
            }

            await CheckAndRewardReferrer(User);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, monster });
        }

        private async Task CheckAndRewardReferrer(UserBase user)
        {
            if (user.Level >= 2 && user.ReferrerID > 0 && !user.ReferrerRewarded)
            {
                var referrer = await _context.Users.FirstOrDefaultAsync(u => u.ID == user.ReferrerID);
                if (referrer != null)
                {
                    // Referrer gets 5 GOLD and 1 MonstaBall
                    referrer.Credit("GOLD", 5, $"referral_level2_reward={user.ID}");
                    referrer.AddItems("MonstaBall", 1, $"referral_level2_reward={user.ID}");
                    _context.Users.Update(referrer);

                    user.ReferrerRewarded = true;
                    _context.Users.Update(user);

                    try
                    {
                        string friendName = string.IsNullOrEmpty(user.Username) 
                            ? $"{user.FirstName} {user.LastName}".Trim() 
                            : $"@{user.Username}";

                        string msg = $"🎉 Your referred friend {friendName} reached Level 2!\n\n" +
                                     $"🎁 Your Reward: +5 GOLD, +1 MonstaBall";

                        _ = _botClient.SendMessage(user.ReferrerID, msg);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[REFERRAL] Failed to send level up bot notification: {ex.Message}");
                    }
                }
            }
        }

        [ValidateRequestIgnore]
        [HttpPost("shop")]
        public async Task<IActionResult> ShopItems()
        {

            // HttpContext.Items.TryGetValue("User", out var user);
            // UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            var form = await GetForm( new
            {
                Section = ""
            });

            if (form.Section == "crystal-shop")
            {
            
            }
            if (form.Section == "exchange")
            {
                
            }

            var listedItems = _gameplayService.GetShopItems();
        
            return Ok(new { success = true, listedItems }); 

        }

       
        [HttpPost("shop/buy")]
        public async Task<IActionResult> ShopPurchase()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            var form = await GetForm( new
            {
                Payload = "",
                Currency = "GOLD"
            });
            
            string Item = form.Payload.Split("=")[1];
            int Quantity = int.Parse(form.Payload.Split("=")[2]);

            var Listed = _gameplayService.GetShopItems();

            if (form.Payload.Split("=")[0] != "buy")
            {
                return Ok(new { success = false, reason = "invalid payload" });
            }

            if (!Listed.ContainsKey(Item))
            {
                return Ok( new { success = false, reason = "invalid payload" });
            }

            if (Quantity <= 0)
            {
                return Ok( new { success = false, reason = "not a valid quantity" });
            }

            if (!Listed[Item].PurchaseCost.ContainsKey(form.Currency))
            {
                return Ok (new { success = false, reason = "wrong paying currency"});
            }

            double itemCost = Listed[Item].PurchaseCost[form.Currency];
            double finalCost = itemCost * Quantity;

            if (User.Balance.GOLD >= finalCost)
            {
                User.Credit(form.Currency, -finalCost, form.Payload);
                User.AddItems(Item, Quantity, form.Payload);
                await _context.SaveChangesAsync();
                return Ok( new { success = true, Balance = User.Balance, Items = User.Items });
            }

            return Ok( new { success = false, reason = "insufficient balance"});
            
        }

        [HttpPost("shop/buy-pack")]
        public async Task<IActionResult> BuyPack()
        {
            HttpContext.Items.TryGetValue("User", out var user);
            UserBase User = await _userService.GetOrCreateUser((TelegramUser) user);

            var form = await GetForm( new
            {
                PackId = ""
            });

            if (form.PackId != "starter")
            {
                return Ok(new { success = false, reason = "invalid pack id" });
            }

            double packCost = 1.5; // 1.5 TON

            if (User.Balance.TON >= packCost)
            {
                // Deduct 1.5 TON
                User.Credit("TON", -packCost, "buy_pack_" + form.PackId);

                // Add rewards: 100 GOLD, 5 MonstaBall, 5 HealSpell
                User.Credit("GOLD", 100, "buy_pack_reward_" + form.PackId);
                User.AddItems("MonstaBall", 5, "buy_pack_reward_" + form.PackId);
                User.AddItems("HealSpell", 5, "buy_pack_reward_" + form.PackId);

                await _context.SaveChangesAsync();
                return Ok(new { success = true, Balance = User.Balance, Items = User.Items });
            }

            return Ok(new { success = false, reason = "insufficient TON balance" });
        }


        [HttpPost("shop/exchange")]
        public async Task<IActionResult> ShopExchange()
        {
            return Ok( new { success = true });
        }

        private int GetItemQuantity(UserBase user, string itemName)
        {
            if (string.Equals(itemName, "HealSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.HealSpell;
            if (string.Equals(itemName, "MonstaBall", StringComparison.OrdinalIgnoreCase)) return user.Items.MonstaBall;
            if (string.Equals(itemName, "RagePotion", StringComparison.OrdinalIgnoreCase)) return user.Items.RagePotion;
            if (string.Equals(itemName, "WindSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.WindSpell;
            if (string.Equals(itemName, "WaterFallSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.WaterFallSpell;
            if (string.Equals(itemName, "AvalancheSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.AvalancheSpell;
            if (string.Equals(itemName, "LavaSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.LavaSpell;
            if (string.Equals(itemName, "ThunderSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.ThunderSpell;
            if (string.Equals(itemName, "DarkSpell", StringComparison.OrdinalIgnoreCase)) return user.Items.DarkSpell;
            if (string.Equals(itemName, "Shield", StringComparison.OrdinalIgnoreCase)) return user.Items.Shield;
            if (string.Equals(itemName, "Poison", StringComparison.OrdinalIgnoreCase)) return user.Items.Poison;
            if (string.Equals(itemName, "Hallucinogen", StringComparison.OrdinalIgnoreCase)) return user.Items.Hallucinogen;
            return 0;
        }

        private class PrelaunchUser
        {
            public long id { get; set; }
            public string username { get; set; }
            public string firstName { get; set; }
            public string lastName { get; set; }
            public string languageCode { get; set; }
            public string photoUrl { get; set; }
            public bool registered { get; set; }
        }

        private class PrelaunchReferral
        {
            public long id { get; set; }
            public List<long> referrals { get; set; }
        }

        private async Task<object> ProcessPrelaunchRewardsAsync(UserBase dbUser)
        {
            try
            {
                if (dbUser.Payloads == null)
                {
                    dbUser.Payloads = new List<string>();
                }

                if (dbUser.Payloads.Contains("prelaunch_reward_claimed"))
                {
                    return null;
                }

                string usersPath = "/root/project-d-prelaunch/data/users.json";
                string referralsPath = "/root/project-d-prelaunch/data/referrals.json";

                if (!System.IO.File.Exists(usersPath) || !System.IO.File.Exists(referralsPath))
                {
                    Console.WriteLine("[PRELAUNCH] Prelaunch JSON files do not exist.");
                    return null;
                }

                var usersJson = await System.IO.File.ReadAllTextAsync(usersPath);
                var referralsJson = await System.IO.File.ReadAllTextAsync(referralsPath);

                var prelaunchUsers = System.Text.Json.JsonSerializer.Deserialize<List<PrelaunchUser>>(usersJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var prelaunchReferrals = System.Text.Json.JsonSerializer.Deserialize<List<PrelaunchReferral>>(referralsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (prelaunchUsers == null || prelaunchReferrals == null)
                {
                    Console.WriteLine("[PRELAUNCH] Failed to deserialize prelaunch JSON files.");
                    return null;
                }

                var prelaunchUser = prelaunchUsers.FirstOrDefault(u => u.id == dbUser.ID);
                if (prelaunchUser == null)
                {
                    if (!string.IsNullOrEmpty(dbUser.Username))
                    {
                        var cleanDbUser = dbUser.Username.Trim().TrimStart('@').ToLowerInvariant();
                        prelaunchUser = prelaunchUsers.FirstOrDefault(u => 
                            !string.IsNullOrEmpty(u.username) && 
                            u.username.Trim().TrimStart('@').ToLowerInvariant() == cleanDbUser
                        );
                    }
                }

                if (prelaunchUser == null)
                {
                    return null;
                }

                var referralEntry = prelaunchReferrals.FirstOrDefault(r => r.id == prelaunchUser.id);
                var referredIds = referralEntry?.referrals ?? new List<long>();

                var registeredReferrals = prelaunchUsers
                    .Where(u => referredIds.Contains(u.id) && u.registered)
                    .ToList();

                int registeredCount = registeredReferrals.Count;

                bool isSelectedForStarter = false;
                if (!string.IsNullOrEmpty(dbUser.Username))
                {
                    var cleanUsername = dbUser.Username.Trim().TrimStart('@').ToLowerInvariant();
                    if (cleanUsername == "olyaolgita" || cleanUsername == "santjagonav" || cleanUsername == "white1shadov")
                    {
                        isSelectedForStarter = true;
                    }
                }
                
                if (!isSelectedForStarter && !string.IsNullOrEmpty(prelaunchUser.username))
                {
                    var cleanUsername = prelaunchUser.username.Trim().TrimStart('@').ToLowerInvariant();
                    if (cleanUsername == "olyaolgita" || cleanUsername == "santjagonav" || cleanUsername == "white1shadov")
                    {
                        isSelectedForStarter = true;
                    }
                }

                int monstaBalls = registeredCount * 1;
                int healSpells = registeredCount * 1;
                int ragePotions = registeredCount * 1;
                double extraGold = 0;

                if (isSelectedForStarter)
                {
                    monstaBalls += 5;
                    healSpells += 5;
                    extraGold += 100;
                }

                if (monstaBalls > 0) dbUser.AddItems("MonstaBall", monstaBalls, "prelaunch_reward");
                if (healSpells > 0) dbUser.AddItems("HealSpell", healSpells, "prelaunch_reward");
                if (ragePotions > 0) dbUser.AddItems("RagePotion", ragePotions, "prelaunch_reward");
                if (extraGold > 0) dbUser.Credit("GOLD", extraGold, "prelaunch_starter_bundle");

                dbUser.Payloads.Add("prelaunch_reward_claimed");

                var userReferralsRecord = await _context.Referrals.FirstOrDefaultAsync(r => r.ID == dbUser.ID);
                if (userReferralsRecord == null)
                {
                    userReferralsRecord = new Referral
                    {
                        ID = dbUser.ID,
                        Referrals = new List<long>()
                    };
                    await _context.Referrals.AddAsync(userReferralsRecord);
                }

                foreach (var refUser in registeredReferrals)
                {
                    if (!userReferralsRecord.Referrals.Contains(refUser.id))
                    {
                        userReferralsRecord.Referrals.Add(refUser.id);
                    }

                    var dbRefUser = await _context.Users.FirstOrDefaultAsync(u => u.ID == refUser.id);
                    if (dbRefUser == null)
                    {
                        dbRefUser = new UserBase
                        {
                            ID = refUser.id,
                            FirstName = refUser.firstName ?? "",
                            LastName = refUser.lastName ?? "",
                            Username = refUser.username ?? "",
                            LanguageCode = refUser.languageCode ?? "en",
                            PhotoUrl = refUser.photoUrl,
                            AllowsWriteToPm = true,
                            ReferrerID = dbUser.ID,
                            Level = 1,
                            Bonus = false,
                            Tutorial = false,
                            Balance = new Balance { TON = 0, GOLD = 10, CRYSTAL = 0, EGGS = 0 },
                            Items = new Items
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
                            }
                        };
                        await _context.Users.AddAsync(dbRefUser);

                        var analytics = new UserAnalytics { ID = refUser.id };
                        await _context.Analytics.AddAsync(analytics);
                    }
                    else
                    {
                        if (dbRefUser.ReferrerID == 0)
                        {
                            dbRefUser.ReferrerID = dbUser.ID;
                        }
                    }
                }

                var prelaunchReferrerEntry = prelaunchReferrals.FirstOrDefault(r => r.referrals != null && r.referrals.Contains(dbUser.ID));
                if (prelaunchReferrerEntry == null && prelaunchUser != null)
                {
                    prelaunchReferrerEntry = prelaunchReferrals.FirstOrDefault(r => r.referrals != null && r.referrals.Contains(prelaunchUser.id));
                }

                if (prelaunchReferrerEntry != null)
                {
                    long referrerId = prelaunchReferrerEntry.id;
                    if (dbUser.ReferrerID == 0 && referrerId != dbUser.ID)
                    {
                        dbUser.ReferrerID = referrerId;
                    }

                    var referrerDbRecord = await _context.Referrals.FirstOrDefaultAsync(r => r.ID == referrerId);
                    if (referrerDbRecord == null)
                    {
                        referrerDbRecord = new Referral
                        {
                            ID = referrerId,
                            Referrals = new List<long>()
                        };
                        await _context.Referrals.AddAsync(referrerDbRecord);
                    }
                    if (!referrerDbRecord.Referrals.Contains(dbUser.ID))
                    {
                        referrerDbRecord.Referrals.Add(dbUser.ID);
                    }

                    var dbReferrerUser = await _context.Users.FirstOrDefaultAsync(u => u.ID == referrerId);
                    if (dbReferrerUser == null)
                    {
                        var refUserInfo = prelaunchUsers.FirstOrDefault(u => u.id == referrerId);
                        if (refUserInfo != null)
                        {
                            dbReferrerUser = new UserBase
                            {
                                ID = refUserInfo.id,
                                FirstName = refUserInfo.firstName ?? "",
                                LastName = refUserInfo.lastName ?? "",
                                Username = refUserInfo.username ?? "",
                                LanguageCode = refUserInfo.languageCode ?? "en",
                                PhotoUrl = refUserInfo.photoUrl,
                                AllowsWriteToPm = true,
                                ReferrerID = 0,
                                Level = 1,
                                Bonus = false,
                                Tutorial = false,
                                Balance = new Balance { TON = 0, GOLD = 10, CRYSTAL = 0, EGGS = 0 },
                                Items = new Items
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
                                }
                            };
                            await _context.Users.AddAsync(dbReferrerUser);

                            var analytics = new UserAnalytics { ID = refUserInfo.id };
                            await _context.Analytics.AddAsync(analytics);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return new
                {
                    success = true,
                    registeredReferralsCount = registeredCount,
                    monstaBalls = monstaBalls,
                    healSpells = healSpells,
                    ragePotions = ragePotions,
                    hasStarterBundle = isSelectedForStarter,
                    extraGold = extraGold
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PRELAUNCH] Error processing prelaunch rewards: {ex.Message}\n{ex.StackTrace}");
                return null;
            }
        }
    }
}