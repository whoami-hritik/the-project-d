using monster_world.Models.Dto;
using monster_world.Models;

namespace monster_world.Mapper
{
    public static class MapTo
    {
        public static UserBaseDto UserBaseDto(UserBase user)
        {
            UserBaseDto User = new()
            {
                ID = user.ID,
                Role = (int)user.Role,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Username = user.Username,
                LanguageCode = user.LanguageCode,
                PhotoUrl = user.PhotoUrl,
                AllowsWriteToPm = user.AllowsWriteToPm,
                TON = user.Balance.TON,
                GOLD = user.Balance.GOLD,
                CRYSTAL = user.Balance.CRYSTAL,
                Bonus = user.Bonus,
                TotalVictory = user.TotalVictory,
                TotalBattles = user.TotalBattles,
                TotalCaptured = user.TotalCaptured,
                Tutorial = user.Tutorial,
                Level = user.Level,
                RegistrationDate = user.RegistrationDate
                
            };

            return User;
        }

    }
}