
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

        private readonly List<long> ADMINS = new() {7243182477, 8673128062, 6427784379};
        private readonly List<string> TopUpItems = new() {"TON", "GOLD", "CRYSTAL"};
    
        public TelegramBot(ITelegramBotClient bot, AppDbContext dbContext, UserService userService)
        {
            _bot = bot;
            _dbContext = dbContext;
            _userService = userService;
        }

        public bool IsAdmin(long ChatId)
        {
            if(ADMINS.Contains(ChatId)) return true;
            return false;
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
                await OnCommand(commander);
            }
            else
            {
                await _bot.SendMessage(chatId, "Hello");
            }
        }        
        public async Task OnCommand(Commander commander)
        {
            commander.Bind("start", async () =>
                    {

                        var keyboard = new InlineKeyboardMarkup(new[]
                        {
                            InlineKeyboardButton.WithWebApp(
                                text: "Open App 🚀",
                                webApp: new WebAppInfo
                                {
                                    Url = "https://monsterworld.qzz.io/index.html"
                                }
                            )
                        });
                        await _bot.SendMessage(7243182477, $"{commander.Chatid} started the bot, Message: {commander.Message}app");
                        await _bot.SendMessage(commander.Chatid, "Open the app:", replyMarkup: keyboard);
                    });
            commander.Bind("topup", async() => 
                    {
                        if(!IsAdmin(commander.Chatid)) return;

                        List<string> Parameters = commander.Parameters;

                        if (Parameters.Count < 3)
                        {
                            await _bot.SendMessage(commander.Chatid, "Usage: /topup <userID> <currency> <amount>");
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
                        // UserAnalytics userAnalytics = await _dbContext.Analytics.FirstOrDefaultAsync(x => x.ID == UserID);

                        if (User == null )
                        {
                            await _bot.SendMessage(commander.Chatid, "User not found");
                            return;
                        }

                        if(!TopUpItems.Contains(TopupItem))
                        {
                            await _bot.SendMessage(commander.Chatid, "Invalid currency. Use: TON, GOLD, or CRYSTAL");
                            return;
                        }

                        User.Credit(TopupItem, topupAmt, "admintopup");
                        // if(TopupItem == "TON")
                        // {
                        //     userAnalytics.TotalDeposit += topupAmt;
                        // }
                        
                        
                        // Balance is now replaced as a whole, EF Core detects the change automatically
                        _dbContext.Users.Update(User);

                        Console.WriteLine($"[TOPUP] Before Save - User {UserID}, {TopupItem} amount to add: {topupAmt}");
                        Console.WriteLine($"[TOPUP] User balance - TON: {User.Balance.TON}, GOLD: {User.Balance.GOLD}, CRYSTAL: {User.Balance.CRYSTAL}");
                        
                        int changes = await _dbContext.SaveChangesAsync();
                        Console.WriteLine($"[TOPUP] SaveChangesAsync returned: {changes} rows affected");

                        await _bot.SendMessage(commander.Chatid, $"Topup Successful: +{topupAmt} {TopupItem}");
                        

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