using monster_world.Models;
using monster_world.DBContext;
using Microsoft.EntityFrameworkCore;
using Telegram.Bot.Types;

namespace monster_world.Services
{
    public class UserService
    {
        
        private readonly AppDbContext _dbContext;

        public UserService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<UserBase> GetOrCreateUser(TelegramUser User)
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
                user = new UserBase
                {
                    ID = User.ID,
                    FirstName = User.FirstName,
                    LastName = User.LastName,
                    Username = User.Username,
                    LanguageCode = User.LanguageCode,
                    PhotoUrl = User.PhotoUrl,
                    AllowsWriteToPm = User.AllowsWriteToPm,
                    ReferrerID = 0,
                    Tutorial = false,
                    TotalBattles = 0,
                    TotalCaptured = 0,
                    TotalVictory = 0,
                    Bonus = false,
                    Balance = new()
                    {
                        TON = 0,
                        GOLD = 10,
                        CRYSTAL = 100
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
                    }
                };

                await _dbContext.Users.AddAsync(user);
                await _dbContext.SaveChangesAsync();
                return user;
            }
            return user;
        }

        
    }
}