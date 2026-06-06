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
        public DbSet<Deposit> Deposits { get; set; }
        public DbSet<Listed> ShopItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Withdraw> Withdraws { get; set; }
        public DbSet<BattleState> Battles { get; set; }
        public DbSet<UserAnalytics> Analytics { get; set; }
        public DbSet<POOL> Pool { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<WorldSpawns>().HasKey(ws => ws.UserId);
            modelBuilder.Entity<WorldSpawns>().OwnsMany(ws => ws.Spawns, a => a.ToJson());
            modelBuilder.Entity<BattleState>().HasKey(bs => bs.BattleId);
            modelBuilder.Entity<BattleState>().OwnsOne(b => b.PlayerState);
            modelBuilder.Entity<BattleState>().OwnsOne(b => b.EnemyState);


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