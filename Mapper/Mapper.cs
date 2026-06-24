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
                UnlockedWorlds = user.UnlockedWorlds,
                UnlockedSlots = user.UnlockedSlots,
                UnlockedCollectorSlots = user.UnlockedCollectorSlots,
                CRYSTAL = user.Balance.CRYSTAL,
                EGGS = user.Balance.EGGS,
                Bonus = user.Bonus,
                TotalVictory = user.TotalVictory,
                TotalBattles = user.TotalBattles,
                TotalCaptured = user.TotalCaptured,
                Tutorial = user.Tutorial,
                HasAcceptedAgreement = user.HasAcceptedAgreement,
                Level = user.Level,
                Transactions = user.Transactions,
                RegistrationDate = user.RegistrationDate,
                LoginStreak = user.LoginStreak,
                LastLoginDate = user.LastLoginDate,
                StreakClaimed = user.StreakClaimed,
                DailyVictory = user.DailyVictory,
                DailyBattles = user.DailyBattles,
                DailyHealedHP = user.DailyHealedHP,
                DailyChestsOpened = user.DailyChestsOpened
            };

            return User;
        }

    }
}