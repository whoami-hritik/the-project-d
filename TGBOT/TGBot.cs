
using Telegram.Bot.Types;
using Telegram.Bot;
using Telegram.Bot.Types.ReplyMarkups;
using monster_world.Models;
using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;
using monster_world.Services;
namespace TGBOT
{
    public class TelegramBot
    {
        private readonly ITelegramBotClient _bot;
        private readonly AppDbContext _dbContext;
        private readonly UserService _userService;

        public static readonly List<long> ADMINS;
        
        static TelegramBot()
        {
            var adminEnv = System.Environment.GetEnvironmentVariable("ADMIN_USER_IDS");
            if (!string.IsNullOrEmpty(adminEnv))
            {
                ADMINS = adminEnv.Split(',')
                    .Select(s => s.Trim())
                    .Where(s => long.TryParse(s, out _))
                    .Select(long.Parse)
                    .ToList();
            }
            else
            {
                ADMINS = new List<long> { 7243182477, 8673128062, 6427784379, 7485848172 };
            }
        }

        public static bool IsUnderMaintenance { get; set; } = false;
        public static string MaintenanceMessage { get; set; } = "";
        private readonly List<string> TopUpItems = new() {"TON", "GOLD"};
    
        public TelegramBot(ITelegramBotClient bot, AppDbContext dbContext, UserService userService)
        {
            _bot = bot;
            _dbContext = dbContext;
            _userService = userService;
        }

        public static bool IsAdmin(long ChatId)
        {
            return ADMINS.Contains(ChatId);
        }
        
        public async Task Notify(long chatId, string message)
        {
            await _bot.SendMessage(chatId, message);
        }

        public async Task NotifyAdmin(string message)
        {
            // Sends the message to all admins at the same time
            var tasks = ADMINS.Select(adminId => _bot.SendMessage(adminId, message));
            await Task.WhenAll(tasks);
        }

        public async Task OnMessage(Update update)
        {
            if (update.Message?.Text == null)
                return;

            var text = update.Message.Text;
            var chatId = update.Message.Chat.Id;

            if (text.StartsWith("/"))
            {
                var commander = new Commander(update);
                if (commander.command.Equals("start", StringComparison.OrdinalIgnoreCase) || IsAdmin(chatId))
                {
                    await OnCommand(commander);
                }
            }
        }        
        public async Task OnCommand(Commander commander)
        {
            commander.Bind("start", async () =>
                    {
                        long referrerId = 0;
                        if (commander.Parameters.Count > 0 && long.TryParse(commander.Parameters[0], out var refId))
                        {
                            referrerId = refId;
                        }

                        if (commander.FromUser != null)
                        {
                            var tgUser = new TelegramUser
                            {
                                ID = commander.FromUser.Id,
                                FirstName = commander.FromUser.FirstName ?? "",
                                LastName = commander.FromUser.LastName ?? "",
                                Username = commander.FromUser.Username ?? "",
                                LanguageCode = commander.FromUser.LanguageCode ?? "en",
                                AllowsWriteToPm = true
                            };
                            await _userService.GetOrCreateUser(tgUser, referrerId);
                        }

                        var webAppUrl = System.Environment.GetEnvironmentVariable("WEBAPP_URL") ?? "https://projectd.qzz.io/index.html";
                        if (referrerId > 0)
                        {
                            webAppUrl += $"?tgWebAppStartParam={referrerId}";
                        }

                        var keyboard = new InlineKeyboardMarkup(new[]
                        {
                            InlineKeyboardButton.WithWebApp(
                                text: "Play Project D 🎮",
                                webApp: new WebAppInfo
                                {
                                    Url = webAppUrl
                                }
                            )
                        });
                        
                        try
                        {
                            await _bot.SendMessage(7243182477, $"{commander.Chatid} started the bot, Referrer: {referrerId}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[TELEGRAM_BOT] Failed to notify admin: {ex.Message}");
                        }
                        
                        var name = commander.FromUser != null ? System.Net.WebUtility.HtmlEncode(commander.FromUser.FirstName) : "Trainer";
                        string welcomeMsg = $"👾 <b>Welcome to Project D, {name}!</b> 👾\n\n" +
                                            "Step into a mystical world where you can hunt, capture, and battle legendary monsters directly inside Telegram! 🦖⚡\n\n" +
                                            "🔥 <b>Key Features</b>:\n" +
                                            "• <b>Explore & Capture</b>: Hunt for rare and epic monsters across diverse maps 🗺️\n" +
                                            "• <b>Epic Battles</b>: Challenge wild beasts and powerful bosses to level up your team ⚔️\n" +
                                            "• <b>PvE & Economy</b>: Earn rewards, breed/enhance monsters, and climb the leaderboard 🏆\n\n" +
                                            "🚀 <b>How to Start</b>:\n" +
                                            "Click the button below to open the WebApp, claim your sign-up bonus, and start your adventure!";

                        await _bot.SendMessage(commander.Chatid, welcomeMsg, parseMode: Telegram.Bot.Types.Enums.ParseMode.Html, replyMarkup: keyboard);
                    });
            commander.Bind("help", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        string helpMsg = "⚙️ *Admin Commands List*:\n\n" +
                                         "• `/help` - Show this help message\n" +
                                         "• `/topup <uid> <currency/item> <amount>` - Top up user currencies (TON, GOLD, EGGS) or items (MonstaBall, HealSpell, etc.)\n" +
                                         "• `/user <uid>` - Inspect user data, balances, items, and monsters\n" +
                                         "• `/totalplayers` - View total registered players\n" +
                                         "• `/analytics` - View game financial and token analytics\n" +
                                         "• `/referralBoard` - View top 10 referrers leaderboard\n" +
                                         "• `/resetdb <password>` - Wipe all user data (requires password: `AdminDBReset2026!`)\n" +
                                         "• `/maintenance [message]` - Enable maintenance mode (blocks non-admin users)\n" +
                                         "• `/removemaintenance` - Disable maintenance mode\n" +
                                         "• `/addadmins <uid>` - Add a new user ID to the admin list";

                        await _bot.SendMessage(commander.Chatid, helpMsg, parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown);
                    });

            commander.Bind("topup", async() => 
                    {
                        if(!IsAdmin(commander.Chatid)) return;

                        List<string> Parameters = commander.Parameters;

                        if (Parameters.Count < 3)
                        {
                            await _bot.SendMessage(commander.Chatid, "Usage: /topup <userID> <currency/item> <amount>");
                            return;
                        }

                        if (!long.TryParse(Parameters[0], out long UserID))
                        {
                            await _bot.SendMessage(commander.Chatid, "Invalid UserID format");
                            return;
                        }

                        string TopupItem = Parameters[1];

                        if (!double.TryParse(Parameters[2], out double topupAmt))
                        {
                            await _bot.SendMessage(commander.Chatid, "Invalid amount format");
                            return;
                        }
                        
                        UserBase User = await _dbContext.Users.FirstOrDefaultAsync(x => x.ID == UserID);

                        if (User == null )
                        {
                            await _bot.SendMessage(commander.Chatid, "User not found");
                            return;
                        }

                        string itemLower = TopupItem.ToLower();
                        int amtInt = (int)topupAmt;
                        bool isItem = true;

                        switch (itemLower)
                        {
                            case "monstaball": User.Items.MonstaBall += amtInt; break;
                            case "ragepotion": User.Items.RagePotion += amtInt; break;
                            case "windspell": User.Items.WindSpell += amtInt; break;
                            case "waterfallspell": User.Items.WaterFallSpell += amtInt; break;
                            case "avalanchespell": User.Items.AvalancheSpell += amtInt; break;
                            case "lavaspell": User.Items.LavaSpell += amtInt; break;
                            case "thunderspell": User.Items.ThunderSpell += amtInt; break;
                            case "darkspell": User.Items.DarkSpell += amtInt; break;
                            case "healspell": User.Items.HealSpell += amtInt; break;
                            case "shield": User.Items.Shield += amtInt; break;
                            case "poison": User.Items.Poison += amtInt; break;
                            case "hallucinogen": User.Items.Hallucinogen += amtInt; break;
                            default: isItem = false; break;
                        }

                        if (!isItem)
                        {
                            string currencyUpper = TopupItem.ToUpper();
                            if (currencyUpper == "TON" || currencyUpper == "GOLD" || currencyUpper == "EGGS")
                            {
                                User.Credit(currencyUpper, topupAmt, "admintopup");
                            }
                            else
                            {
                                await _bot.SendMessage(commander.Chatid, "❌ Invalid currency or item. Currencies: TON, GOLD, EGGS. Items: MonstaBall, HealSpell, etc.");
                                return;
                            }
                        }
                        
                        _dbContext.Users.Update(User);
                        await _dbContext.SaveChangesAsync();

                        await _bot.SendMessage(commander.Chatid, $"✅ Successfully topped up User {UserID} with +{topupAmt} {TopupItem}");
                    });                         

            commander.Bind("user", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        if (commander.Parameters.Count < 1 || !long.TryParse(commander.Parameters[0], out long targetUid))
                        {
                            await _bot.SendMessage(commander.Chatid, "Usage: /user <userID>");
                            return;
                        }

                        UserBase targetUser = await _dbContext.Users.FirstOrDefaultAsync(x => x.ID == targetUid);
                        if (targetUser == null)
                        {
                            await _bot.SendMessage(commander.Chatid, "User not found.");
                            return;
                        }

                        var message = $"👤 User Details for {targetUser.FirstName} {targetUser.LastName} ({targetUser.Username ?? "N/A"})\n" +
                                      $"ID: {targetUser.ID}\n" +
                                      $"Level: {targetUser.Level}\n" +
                                      $"Role: {targetUser.Role}\n" +
                                      $"Registered: {targetUser.RegistrationDate:yyyy-MM-dd HH:mm:ss} UTC\n\n" +
                                      $"💰 Balances:\n" +
                                      $"• TON: {targetUser.Balance.TON:F4}\n" +
                                      $"• GOLD: {targetUser.Balance.GOLD}\n" +
                                      $"• CRYSTAL: {targetUser.Balance.CRYSTAL}\n" +
                                      $"• EGGS: {targetUser.Balance.EGGS}\n\n" +
                                      $"🎒 Items:\n" +
                                      $"• MonstaBalls: {targetUser.Items.MonstaBall}\n" +
                                      $"• HealSpells: {targetUser.Items.HealSpell}\n" +
                                      $"• RagePotions: {targetUser.Items.RagePotion}\n" +
                                      $"• Shields: {targetUser.Items.Shield}\n" +
                                      $"• Poison/Hallucinogens: {targetUser.Items.Hallucinogen}\n\n" +
                                      $"🦖 Monsters Owned: {targetUser.Monsters?.Count ?? 0}";

                        await _bot.SendMessage(commander.Chatid, message);
                    });

            commander.Bind("totalplayers", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        int totalCount = await _dbContext.Users.CountAsync();
                        await _bot.SendMessage(commander.Chatid, $"📊 Total Registered Players: {totalCount}");
                    });

            commander.Bind("analytics", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        try
                        {
                            // 1. Total EGGS from pool
                            double totalEggsPool = 0;
                            var pool = await _dbContext.Pool.FirstOrDefaultAsync(x => x.PoolID == 1);
                            if (pool != null)
                            {
                                totalEggsPool = pool.TotalEGGS;
                            }

                            // 2. Sum of all users' EGGS balance
                            double totalEggsCirculation = await _dbContext.Users.SumAsync(u => u.Balance.EGGS);

                            // 3. TON to GOLD conversions
                            var users = await _dbContext.Users.ToListAsync();
                            double totalGoldFromTon = 0;
                            double totalTonConvertedToGold = 0;
                            foreach (var u in users)
                            {
                                if (u.Transactions != null)
                                {
                                    foreach (var t in u.Transactions)
                                    {
                                        var parts = t.Split('|');
                                        if (parts.Length >= 4)
                                        {
                                            string currency = parts[1];
                                            string amtStr = parts[2];
                                            string action = parts[3];
                                            if (action == "exchange=TONtoGOLD" && double.TryParse(amtStr, out double amt))
                                            {
                                                if (currency == "GOLD")
                                                {
                                                    totalGoldFromTon += amt;
                                                }
                                                else if (currency == "TON")
                                                {
                                                    totalTonConvertedToGold += Math.Abs(amt);
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // 4. Total Users
                            int totalUsersCount = users.Count;

                            // 5. Total Deposits
                            double totalDepositsCount = await _dbContext.Deposits.Where(d => d.Successful || d.Completed).SumAsync(d => d.Amount);
                            double totalDepositsAnalytics = await _dbContext.Analytics.SumAsync(a => a.TotalDeposit);

                            // 6. Total Withdrawals
                            double totalWithdrawalsEggs = await _dbContext.Withdraws.Where(w => w.Completed && w.Currency == "EGGS").SumAsync(w => w.Amount);
                            double totalWithdrawalsTon = await _dbContext.Withdraws.Where(w => w.Completed && w.Currency == "TON").SumAsync(w => w.Amount);

                            // 7. Total Gold in Circulation
                            double totalGoldCirculation = users.Sum(u => u.Balance.GOLD);

                            // 8. Top 20 EGG holders
                            var topHolders = await _dbContext.Users
                                .Where(u => u.Balance.EGGS > 0)
                                .OrderByDescending(u => u.Balance.EGGS)
                                .Take(20)
                                .Select(u => new { u.FirstName, u.LastName, u.Username, u.ID, u.Balance.EGGS })
                                .ToListAsync();

                            var message = $"📊 <b>Project D Analytics Report</b> 📊\n" +
                                          $"----------------------------------\n\n" +
                                          $"👥 <b>User Base</b>:\n" +
                                          $"• Total Registered Players: <code>{totalUsersCount}</code>\n\n" +
                                          $"🍳 <b>EGGS Emission</b>:\n" +
                                          $"• Total Pool Supply: <code>{totalEggsPool:F4} EGGS</code>\n" +
                                          $"• In Circulation: <code>{totalEggsCirculation:F4} EGGS</code>\n" +
                                          $"• Combined Total Eggs: <code>{(totalEggsPool + totalEggsCirculation):F4} EGGS</code>\n\n" +
                                          $"💰 <b>GOLD Circulation</b>:\n" +
                                          $"• Total Gold in Circulation: <code>{totalGoldCirculation:F0} GOLD</code>\n" +
                                          $"• Total Gold Generated from TON: <code>{totalGoldFromTon:F0} GOLD</code>\n\n" +
                                          $"📥 <b>Deposits</b>:\n" +
                                          $"• Completed Deposits (TON): <code>{totalDepositsCount:F4} TON</code>\n" +
                                          $"• Analytics Logged (USDT): <code>{totalDepositsAnalytics:F4} USDT</code>\n\n" +
                                          $"📤 <b>Withdrawals</b>:\n" +
                                          $"• Completed Withdrawals (EGGS): <code>{totalWithdrawalsEggs:F4} EGGS</code>\n" +
                                          $"• Completed Withdrawals (TON): <code>{totalWithdrawalsTon:F4} TON</code>\n\n" +
                                          $"🔄 <b>TON to GOLD Conversions</b>:\n" +
                                          $"• TON Exchanged: <code>{totalTonConvertedToGold:F4} TON</code>\n" +
                                          $"• GOLD Generated: <code>{totalGoldFromTon:F0} GOLD</code>\n\n" +
                                          $"🏆 <b>Top 20 EGGS Holders</b> (Balance > 0):\n";

                            if (topHolders.Any())
                            {
                                int rank = 1;
                                foreach (var h in topHolders)
                                {
                                    string userHandle = string.IsNullOrEmpty(h.Username) ? "N/A" : $"@{h.Username}";
                                    string fullName = System.Net.WebUtility.HtmlEncode($"{h.FirstName} {h.LastName}".Trim());
                                    message += $"{rank}. <b>{fullName}</b> ({userHandle}, ID: <code>{h.ID}</code>) - <b>{h.EGGS:F4} EGGS</b>\n";
                                    rank++;
                                }
                            }
                            else
                            {
                                message += "<i>No users currently hold any EGGS.</i>\n";
                            }

                            await _bot.SendMessage(commander.Chatid, message, parseMode: Telegram.Bot.Types.Enums.ParseMode.Html);
                        }
                        catch (Exception ex)
                        {
                            await _bot.SendMessage(commander.Chatid, $"❌ Failed to generate analytics: {ex.Message}");
                        }
                    });

            commander.Bind("referralBoard", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        try
                        {
                            var dbReferrals = await _dbContext.Referrals.ToListAsync();
                            
                            var prelaunchReferrals = new List<PrelaunchReferral>();
                            string referralsPath = "/root/project-d-prelaunch/data/referrals.json";
                            if (System.IO.File.Exists(referralsPath))
                            {
                                var referralsJson = await System.IO.File.ReadAllTextAsync(referralsPath);
                                prelaunchReferrals = System.Text.Json.JsonSerializer.Deserialize<List<PrelaunchReferral>>(referralsJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
                            }
                            
                            var prelaunchPending = new List<PendingReferral>();
                            string pendingPath = "/root/project-d-prelaunch/data/pending_referrals.json";
                            if (System.IO.File.Exists(pendingPath))
                            {
                                var pendingJson = await System.IO.File.ReadAllTextAsync(pendingPath);
                                prelaunchPending = System.Text.Json.JsonSerializer.Deserialize<List<PendingReferral>>(pendingJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
                            }

                            var registeredUserIds = await _dbContext.Users.Select(u => u.ID).ToListAsync();
                            var registeredUserMap = await _dbContext.Users.ToDictionaryAsync(u => u.ID, u => u);

                            var referrerStats = new Dictionary<long, (int Registered, int Pending)>();

                            foreach (var pr in prelaunchReferrals)
                            {
                                if (pr.referrals == null || pr.referrals.Count == 0) continue;
                                if (!referrerStats.ContainsKey(pr.id))
                                {
                                    referrerStats[pr.id] = (0, 0);
                                }

                                var current = referrerStats[pr.id];
                                foreach (var refId in pr.referrals)
                                {
                                    if (registeredUserIds.Contains(refId))
                                    {
                                        current.Registered++;
                                    }
                                    else
                                    {
                                        current.Pending++;
                                    }
                                }
                                referrerStats[pr.id] = current;
                            }

                            foreach (var p in prelaunchPending)
                            {
                                if (!referrerStats.ContainsKey(p.referrerId))
                                {
                                    referrerStats[p.referrerId] = (0, 0);
                                }
                                var current = referrerStats[p.referrerId];
                                if (registeredUserIds.Contains(p.newUserId))
                                {
                                    current.Registered++;
                                }
                                else
                                {
                                    current.Pending++;
                                }
                                referrerStats[p.referrerId] = current;
                            }

                            foreach (var r in dbReferrals)
                            {
                                if (r.Referrals == null || r.Referrals.Count == 0) continue;
                                if (!referrerStats.ContainsKey(r.ID))
                                {
                                    referrerStats[r.ID] = (0, 0);
                                }
                                var current = referrerStats[r.ID];
                                foreach (var refId in r.Referrals)
                                {
                                    current.Registered++;
                                }
                                referrerStats[r.ID] = current;
                            }

                            var leaderboardList = new List<(long UserId, int Registered, int Pending, int Total, string DisplayName)>();
                            foreach (var kv in referrerStats)
                            {
                                long userId = kv.Key;
                                int reg = kv.Value.Registered;
                                int pend = kv.Value.Pending;
                                int total = reg + pend;

                                string displayName = $"ID: {userId}";
                                if (registeredUserMap.TryGetValue(userId, out var userObj))
                                {
                                    string userHandle = string.IsNullOrEmpty(userObj.Username) ? "" : $" (@{userObj.Username})";
                                    displayName = $"{userObj.FirstName} {userObj.LastName}{userHandle}".Trim();
                                }

                                leaderboardList.Add((userId, reg, pend, total, displayName));
                            }

                            var top10 = leaderboardList
                                .OrderByDescending(l => l.Total)
                                .ThenByDescending(l => l.Registered)
                                .Take(10)
                                .ToList();

                            var message = $"🏆 <b>Top 10 Referrals Leaderboard</b> 🏆\n" +
                                          $"----------------------------------\n\n";

                            int rank = 1;
                            foreach (var item in top10)
                            {
                                message += $"{rank}. <b>{System.Net.WebUtility.HtmlEncode(item.DisplayName)}</b>\n" +
                                           $"• Total: <code>{item.Total}</code> (Registered: <code>{item.Registered}</code> | Pending: <code>{item.Pending}</code>)\n" +
                                           $"• User ID: <code>{item.UserId}</code>\n\n";
                                rank++;
                            }

                            if (!top10.Any())
                            {
                                message += "<i>No referrals found.</i>\n";
                            }

                            await _bot.SendMessage(commander.Chatid, message, parseMode: Telegram.Bot.Types.Enums.ParseMode.Html);
                        }
                        catch (Exception ex)
                        {
                            await _bot.SendMessage(commander.Chatid, $"❌ Failed to generate referral board: {ex.Message}");
                        }
                    });

            commander.Bind("maintenance", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        IsUnderMaintenance = true;
                        if (commander.Parameters.Count > 0)
                        {
                            MaintenanceMessage = string.Join(" ", commander.Parameters);
                        }
                        else
                        {
                            MaintenanceMessage = "";
                        }

                        string msg = "⚠️ Maintenance mode enabled.";
                        if (!string.IsNullOrEmpty(MaintenanceMessage))
                        {
                            msg += $"\nMessage: {MaintenanceMessage}";
                        }
                        await _bot.SendMessage(commander.Chatid, msg);
                    });

            commander.Bind("removemaintenance", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        IsUnderMaintenance = false;
                        MaintenanceMessage = "";
                        await _bot.SendMessage(commander.Chatid, "✅ Maintenance mode disabled. Users can now load the game normally.");
                    });

            commander.Bind("addadmins", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        if (commander.Parameters.Count < 1 || !long.TryParse(commander.Parameters[0], out long newAdminId))
                        {
                            await _bot.SendMessage(commander.Chatid, "Usage: /addadmins <userID>");
                            return;
                        }

                        if (ADMINS.Contains(newAdminId))
                        {
                            await _bot.SendMessage(commander.Chatid, $"User {newAdminId} is already an admin.");
                        }
                        else
                        {
                            ADMINS.Add(newAdminId);
                            await _bot.SendMessage(commander.Chatid, $"👤 User {newAdminId} has been added to the Admins list.");
                        }
                    });

            commander.Bind("resetdb", async () =>
                    {
                        if (!IsAdmin(commander.Chatid)) return;

                        if (commander.Parameters.Count < 1)
                        {
                            await _bot.SendMessage(commander.Chatid, "Usage: /resetdb <password>");
                            return;
                        }

                        string passwordInput = commander.Parameters[0];
                        string expectedPassword = System.Environment.GetEnvironmentVariable("RESET_PASSWORD") ?? "AdminDBReset2026!";
                        if (passwordInput != expectedPassword)
                        {
                            await _bot.SendMessage(commander.Chatid, "❌ Incorrect password. Reset database aborted.");
                            return;
                        }

                        try
                        {
                            // Truncate all user-related data tables and reset identity columns
                            await _dbContext.Database.ExecuteSqlRawAsync(
                                "TRUNCATE TABLE \"Users\", \"Monsters\", \"Spawns\", \"Referrals\", \"UserMissions\", \"Deposits\", \"ShopItems\", \"Invoices\", \"Withdraws\", \"Battles\", \"Analytics\" RESTART IDENTITY CASCADE;"
                            );
                            await _bot.SendMessage(commander.Chatid, "🧹 Database reset completed successfully! All user data has been cleared.");
                        }
                        catch (Exception ex)
                        {
                            await _bot.SendMessage(commander.Chatid, $"❌ Failed to reset database: {ex.Message}");
                        }
                    });

            await commander.Execute();
        }
    }

    public class Commander
    {
        public string command { get; }
        public long Chatid { get; set ; }
        public long ReferrerID { get; set; } = 0;
        public string Message { get; set; }
        public List<string> Parameters { get; }
        public Telegram.Bot.Types.User FromUser { get; }
        private Dictionary<string, Func<Task>> _commands = new();
        public Commander(Update update)
        {
            string message = update.Message.Text;
            long chatid = update.Message.Chat.Id;
            var parts = message.Split(' ');


            command = parts[0].TrimStart('/');
            Chatid = chatid;
            Message = message;
            Parameters = parts.Skip(1).ToList();
            FromUser = update.Message?.From;
        }

        public void Bind(string command, Func<Task> action)
        {
            _commands[command] = action;
            return;
        }

        public async Task Execute()
        {
            if (_commands.ContainsKey(command))
            {
                await _commands[command]();
            }
            else
            {
                Console.WriteLine("Unkonw Command");
            }
        }
    }

    public class PrelaunchReferral
    {
        public long id { get; set; }
        public List<long> referrals { get; set; }
    }

    public class PendingReferral
    {
        public long referrerId { get; set; }
        public long newUserId { get; set; }
    }
}