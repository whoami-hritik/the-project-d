using Microsoft.EntityFrameworkCore;
using monster_world.Models;
using monster_world.Services;

namespace monster_world.DBContext
{
    public class AppDbContext : DbContext
    {
        public DbSet<UserBase> Users { get; set; }
        public DbSet<Monster> Monsters { get; set; }
        // Skill and SkillEffect are loaded from JSON, not the database
        public DbSet<WorldSpawns> Spawns { get; set; }
        public DbSet<Referral> Referrals { get; set; }
        public DbSet<UserMission> UserMissions { get; set; }
        public DbSet<Mission> AvailableMissions { get; set; }
        public DbSet<Deposit> Deposits { get; set; }
        public DbSet<Listed> ShopItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Withdraw> Withdraws { get; set; }
        public DbSet<BattleState> Battles { get; set; }
        public DbSet<UserAnalytics> Analytics { get; set; }
        public DbSet<POOL> Pool { get; set; }
        public DbSet<MapBase> MapLiquidity { get; set; }
        public DbSet<BattleService.BossBattle> BossBattleData { get; set; }
        public DbSet<Collector> Collectors { get; set; }
        public DbSet<MarketplaceBase> Marketplace { get; set; }
        public DbSet<MarketplaceLog> MarketplaceLogs { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public override Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<Monster>();
            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Modified)
                {
                    var hpChanged = entry.Property(m => m.HP).IsModified;
                    var isFightingChanged = entry.Property(m => m.IsFighting).IsModified;
                    var regenChanged = entry.Property(m => m.LastHpRegenAt).IsModified;

                    if (entry.Entity.IsFighting)
                    {
                        entry.Entity.IsRegenerating = false;
                    }
                    else
                    {
                        if (entry.Entity.HP < entry.Entity.MaxHP)
                        {
                            entry.Entity.IsRegenerating = true;
                        }
                        else
                        {
                            entry.Entity.IsRegenerating = false;
                        }
                    }

                    if ((hpChanged || isFightingChanged) && !regenChanged)
                    {
                        entry.Entity.LastHpRegenAt = DateTime.UtcNow;
                    }
                }
                else if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.HP < entry.Entity.MaxHP && !entry.Entity.IsFighting)
                    {
                        entry.Entity.IsRegenerating = true;
                    }
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<WorldSpawns>().HasKey(ws => ws.UserId);
            modelBuilder.Entity<WorldSpawns>().OwnsMany(ws => ws.Spawns, a => a.ToJson());
            
            modelBuilder.Entity<BattleState>().HasKey(bs => bs.BattleId);
            modelBuilder.Entity<BattleState>().OwnsMany(b => b.PlayerStates);
            modelBuilder.Entity<BattleState>().OwnsMany(b => b.EnemyStates);
            
            // Configure MapBase collections as JSON
            modelBuilder.Entity<MapBase>().HasKey(m => m.MapId);
            modelBuilder.Entity<MapBase>().Property(m => m.Users).HasConversion(
                v => v,
                v => v ?? new List<long>());

            // Configure BossBattle and MapBosses owned collection mapped to JSON
            modelBuilder.Entity<BattleService.BossBattle>().HasKey(bb => bb.Id);
            modelBuilder.Entity<BattleService.BossBattle>().OwnsMany(bb => bb.MapBosses, a => a.ToJson());

            modelBuilder.Entity<POOL>(entity =>
            {
                entity.HasKey(p => p.PoolID);
                
                // Enforce that PoolID can ONLY be 1 at the database layer
                entity.ToTable(t => t.HasCheckConstraint("CK_POOL_SingleRow", "\"PoolID\" = 1"));
            });
            modelBuilder.Entity<POOL>().HasData( new POOL { PoolID = 1, USDTLiquidity = 400, RewardReserve = 0, TreasuryReserve = 0, TotalEGGS = 400, EGGSPrice = 1 });
        }
    }
}