using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using monster_world.DBContext;
using monster_world.Models;
using Telegram.Bot.Types;
using TGBOT;

namespace monster_world.Services
{
    public class MapService
    {
        private readonly PoolService _poolService;
        private readonly GameConfig _gameplay;
        private readonly AppDbContext _context;
        private readonly TelegramBot _botService;
        public MapService(AppDbContext dbContext, PoolService poolService, GameConfig gameConfig, TelegramBot botService)
        {
            _context = dbContext;
            _poolService = poolService;
            _gameplay = gameConfig;
            _botService = botService;
        }

        // public async Task UnlockMap(UserBase user, string MapId)
        // {
        //     // perform pool and map update atomically inside PoolService
        //     await _poolService.AddUnlockMapLiquidity(MapId, user.ID);

        //     // refresh local map state
        //     // (optional) reload MapBase if caller needs updated info
        //     // MapBase mapBase = await _context.MapLiquidity.FirstOrDefaultAsync(x => x.MapId == MapId);
        // }


       
        public async Task<double> EmitEGGSReward(EmissionRate rate, string mapid)
        {
            double USDT_WIN = Extentions.Extentions.RandomDoubleBetween(rate.USDTEmission, "-");
            double REMOVED_USDT = await TryRemoveMapLiquidity(mapid, USDT_WIN);

            double EGGS_EMISSION = REMOVED_USDT / await _poolService.GetEggsPrice();
            
            await _poolService.AddEggsSupply(EGGS_EMISSION);

            return EGGS_EMISSION;
            
        }


        public EmissionRate GetWinType(double roll)
        {
            Random rnd = new Random();

            var type = _gameplay.EGGEmission.FirstOrDefault(x => roll <= x.Chance);

            return type;
        }

        public async Task<Dictionary<string, double>> CalculateRewards(BattleState battleState)
        {
            Dictionary<string, double> Rewards = new();

            if (battleState.RewardProcessed == true)
            {
                return null;
            }
        
            string mapId = battleState.Map;
            var map = _gameplay.Maps.FirstOrDefault(x => x.Map == mapId);
            double mapMultiplier = map?.GoldMultiplier > 0 ? map.GoldMultiplier : 1.0;
            double rarityMultiplier = 1.0;
            if (!string.IsNullOrEmpty(battleState.EnemyMonster?.Rarity) && _gameplay.RarityMultiplier != null && _gameplay.RarityMultiplier.TryGetValue(battleState.EnemyMonster.Rarity, out var rarityMult))
            {
                rarityMultiplier = rarityMult;
            }

            double level = Math.Max(1, battleState.EnemyMonster?.Level ?? 1);
            double captureMultiplier = battleState.EnemyMonster?.IsCaptured == true ? 1.2 : 1.0;
            double bossMultiplier = battleState.BossBattle ? 2 : 1.0;
            double victoryMultiplier = battleState.Victory ? 1.0 : new Random().Next(3, 5) / 10.0;

            double baseGoldReward = 10; // stable base reward
            double totalGoldReward = baseGoldReward * mapMultiplier * rarityMultiplier * captureMultiplier * bossMultiplier * (1 + Math.Pow(level, 0.5) / 10.0) * victoryMultiplier;
            totalGoldReward = Math.Max(0, totalGoldReward);

            Rewards["GOLD"] = totalGoldReward;
            Console.WriteLine($"[CONSOLE] Total GOLD Rewards = {totalGoldReward}");

            double EGGS_EMISSION = 0;
            if (battleState.Victory)
            {
                var rnd = new Random();
                MapBase mapBase = await _context.MapLiquidity.FirstOrDefaultAsync(x => x.MapId == battleState.Map );
                if (battleState.BossBattle && mapBase != null && mapBase.DailyUSDTLiquidity > 0)
                {
                    double roll = rnd.NextDouble();
                    EmissionRate rate = GetWinType(roll);

                    if (rate != null && rate.WinType != "nowin" && rate.WinType != "none")
                    {
                        EGGS_EMISSION = await EmitEGGSReward(rate, battleState.Map);
                        Rewards["EGGS"] = EGGS_EMISSION;
                    }
                }
                else if (battleState.EnemyMonster?.IsCaptured == true)
                {
                    if (rnd.NextDouble() < 0.01)
                    {
                        double roll = rnd.NextDouble();
                        EmissionRate rate = GetWinType(roll);

                        if (rate != null && rate.WinType != "nowin" && rate.WinType != "none")
                        {
                            EGGS_EMISSION = await EmitEGGSReward(rate, battleState.Map);
                            Rewards["EGGS"] = EGGS_EMISSION;
                        }
                        
                    } 
                }
            }

            int totalItemDrops = 0;
            if (battleState.Victory && map != null && !string.IsNullOrWhiteSpace(map.TotalItemDrops))
            {
                string itemDropsSep = map.TotalItemDrops.Contains("-") ? "-" : ":";
                totalItemDrops = Extentions.Extentions.RandomBetween(map.TotalItemDrops, itemDropsSep);
                if (battleState.BossBattle)
                {
                    totalItemDrops = totalItemDrops * 2;
                }
                Random rnd = new Random();
                for ( int i = 0; i < totalItemDrops; i++)
                {
                    string drop = map.ItemsDrop.Keys.ElementAt(rnd.Next(map.ItemsDrop.Count));
                    string chanceSep = map.ItemsDrop[drop].Contains("-") ? "-" : ":";
                    double dropChance = Extentions.Extentions.RandomBetween(map.ItemsDrop[drop], chanceSep) / 100.0;
                    if (rnd.NextDouble() < dropChance)
                    {
                        string qtySep = map.MaxDropItemQuantity.Contains("-") ? "-" : ":";
                        double dropQuantity = Extentions.Extentions.RandomBetween(map.MaxDropItemQuantity, qtySep);

                        if (Rewards.TryGetValue(drop, out double currentQuantity))
                        {
                            Rewards[drop] = currentQuantity + dropQuantity;
                        }
                        else
                        {
                            Rewards[drop] = dropQuantity; 
                        }
                        Console.WriteLine($"[CONSOLE] Item {drop} Reward = {dropQuantity}");
                    }
                    
                }
            }

            return Rewards;
        }


      

        public async Task<double> TryRemoveMapLiquidity(string MapId, double USDT)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                MapBase mapBase = await _context.MapLiquidity
                    .FromSqlInterpolated($@"
                        SELECT *
                        FROM ""MapLiquidity""
                        WHERE ""MapId"" = {MapId}
                        FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (mapBase == null)
                {
                    await transaction.CommitAsync();
                    return 0;
                }

                double RemovedLiquidity = 0d;  //USDT
                if (mapBase.DailyUSDTLiquidity - USDT > 0)
                {
                    mapBase.DailyUSDTLiquidity -= USDT;
                    RemovedLiquidity = USDT;
                }
                else
                {
                    RemovedLiquidity = mapBase.DailyUSDTLiquidity;
                    mapBase.DailyUSDTLiquidity = 0;
                }

                // Keep MapLiquidity (permanent pool) synchronized with rewards claiming
                mapBase.MapLiquidity = Math.Max(0, mapBase.MapLiquidity - RemovedLiquidity);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return RemovedLiquidity;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }


        
    }
}