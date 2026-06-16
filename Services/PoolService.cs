using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using monster_world.DBContext;

using Microsoft.Extensions.DependencyInjection;
using monster_world.Models;
using Telegram.Bot.Types;

namespace monster_world.Services
{

    public class POOL
    {
        [Key]
        public int PoolID { get; set; } = 1;
        public double USDTLiquidity { get; set; }
        public double TreasuryReserve { get; set; }
        public double RewardReserve { get; set; }
        public double TotalEGGS { get; set; }
        public double EGGSPrice { get; set; } // USDTLiquidity / TotalEGGS (cached)
    }

    public class PoolService
    {
        private readonly GameConfig _gameConfig;
        private static readonly SemaphoreSlim _poolLock = new(1, 1);
        private readonly IServiceScopeFactory _scopeFactory;


        public PoolService(IServiceScopeFactory scopeFactory, GameConfig gameConfig)
        {
            _scopeFactory = scopeFactory;
            _gameConfig = gameConfig;
        }

        public async Task<double> GetEggsPrice()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            POOL pool = await context.Pool.FirstOrDefaultAsync(x => x.PoolID == 1);
            if (pool == null || pool.TotalEGGS == 0) return 0;
            return pool.USDTLiquidity / pool.TotalEGGS;
        }
        
        public async Task<double> GetUSDTLiquidity()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            POOL pool = await context.Pool.FirstAsync();
            return pool.USDTLiquidity;
        }
        public async Task AddUSDTLiquidity(double amount)
        {
            await _poolLock.WaitAsync();
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                using var transaction = await context.Database.BeginTransactionAsync();

                POOL pool = await context.Pool
                    .FromSqlRaw("SELECT * FROM \"Pool\" WHERE \"PoolID\" = 1 FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (pool != null)
                {
                    double treasuryReserve = amount * 0.05;
                    double rewardReserve = treasuryReserve * 0.1;
                    
                    Console.WriteLine("USDT Amount: "+amount);
                    Console.WriteLine("Treasury Resureve Amt: "+(treasuryReserve - rewardReserve));
                    Console.WriteLine("Reward Reserve: "+ rewardReserve);

                    Console.WriteLine($"Before Liquidity: {pool.USDTLiquidity}");
                    pool.USDTLiquidity += amount - treasuryReserve;
                    Console.WriteLine($"After Liquidity: {pool.USDTLiquidity}");
                    
                    pool.TreasuryReserve += treasuryReserve - rewardReserve;
                    pool.RewardReserve += rewardReserve;
                    pool.EGGSPrice = pool.TotalEGGS > 0 ? pool.USDTLiquidity / pool.TotalEGGS : 0;

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
            }
            finally
            {
                _poolLock.Release();
            }
        }

        public async Task AddEggsSupply(double amount)
        {
            await _poolLock.WaitAsync();
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                using var transaction = await context.Database.BeginTransactionAsync();

                POOL pool = await context.Pool
                    .FromSqlRaw("SELECT * FROM \"Pool\" WHERE \"PoolID\" = 1 FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (pool != null)
                {
                    pool.TotalEGGS += amount;
                    pool.EGGSPrice = pool.TotalEGGS > 0 ? pool.USDTLiquidity / pool.TotalEGGS : 0;
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
            }
            finally
            {
                _poolLock.Release();
            }
        }

        public async Task BurnEggsSupply(double amount)
        {
            await _poolLock.WaitAsync();
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                using var transaction = await context.Database.BeginTransactionAsync();

                POOL pool = await context.Pool
                    .FromSqlRaw("SELECT * FROM \"Pool\" WHERE \"PoolID\" = 1 FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (pool != null)
                {
                    pool.TotalEGGS = Math.Max(0, pool.TotalEGGS - amount);
                    pool.EGGSPrice = pool.TotalEGGS > 0 ? pool.USDTLiquidity / pool.TotalEGGS : 0;
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
            }
            finally
            {
                _poolLock.Release();
            }
        }

        public async Task RemoveUSDTLiquidity(double amount)
        {
            await _poolLock.WaitAsync();
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                using var transaction = await context.Database.BeginTransactionAsync();

                POOL pool = await context.Pool
                    .FromSqlRaw("SELECT * FROM \"Pool\" WHERE \"PoolID\" = 1 FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (pool != null)
                {
                    pool.USDTLiquidity = Math.Max(0, pool.USDTLiquidity - amount);
                    pool.EGGSPrice = pool.TotalEGGS > 0 ? pool.USDTLiquidity / pool.TotalEGGS : 0;
                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
            }
            finally
            {
                _poolLock.Release();
            }
        }

        



        public async Task AddUnlockMapLiquidity(string MapId, double TON_USDT_PRICE, long? userId = null)
        {
            double LiquidityAdded = TON_USDT_PRICE * _gameConfig.Maps.FirstOrDefault(x => x.Map == MapId).UnlockCost["TON"]; //usdt conversion
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            using var transaction = await context.Database.BeginTransactionAsync();

            var mapBase = await context.MapLiquidity
                .FromSqlInterpolated($@"
                    SELECT *
                    FROM ""MapLiquidity""
                    WHERE ""MapId"" = {MapId}
                    FOR UPDATE")
                .FirstAsync();

            var pool = await context.Pool
                .FromSqlRaw(@"
                    SELECT *
                    FROM ""Pool""
                    WHERE ""PoolID"" = 1
                    FOR UPDATE")
                .FirstAsync();

            // update map liquidity and pool in same transaction to avoid races
            mapBase.MapLiquidity += LiquidityAdded;
            pool.USDTLiquidity += LiquidityAdded;

            // if a userId was provided, atomically increment TotalUsers and add to Users list
            if (userId.HasValue)
            {
                mapBase.TotalUsers += 1;
                if (mapBase.Users == null)
                    mapBase.Users = new List<long>();
                if (!mapBase.Users.Contains(userId.Value))
                    mapBase.Users.Add(userId.Value);
            }

            await context.SaveChangesAsync();
            await transaction.CommitAsync();
        }        


        
    }
}