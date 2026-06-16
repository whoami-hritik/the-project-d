
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
}