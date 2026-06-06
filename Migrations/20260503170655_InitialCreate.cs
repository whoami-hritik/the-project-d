using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<long>(type: "bigint", nullable: false),
                    InvoiceType = table.Column<string>(type: "text", nullable: true),
                    Payload = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpireAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Monsters",
                columns: table => new
                {
                    GlobalID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InstanceId = table.Column<string>(type: "text", nullable: true),
                    Id = table.Column<string>(type: "text", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: true),
                    OwnerID = table.Column<long>(type: "bigint", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    XP = table.Column<int>(type: "integer", nullable: false),
                    IsFighting = table.Column<bool>(type: "boolean", nullable: false),
                    CaptureAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HealTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentHP = table.Column<int>(type: "integer", nullable: false),
                    Logs = table.Column<string[]>(type: "text[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Monsters", x => x.GlobalID);
                });

            migrationBuilder.CreateTable(
                name: "Referrals",
                columns: table => new
                {
                    RefID = table.Column<Guid>(type: "uuid", nullable: false),
                    ID = table.Column<long>(type: "bigint", nullable: false),
                    Referrals = table.Column<long[]>(type: "bigint[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Referrals", x => x.RefID);
                });

            migrationBuilder.CreateTable(
                name: "Spawns",
                columns: table => new
                {
                    UserId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Spawns", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "UserMissions",
                columns: table => new
                {
                    MissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMissions", x => x.MissionId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: true),
                    LastName = table.Column<string>(type: "text", nullable: true),
                    Username = table.Column<string>(type: "text", nullable: true),
                    LanguageCode = table.Column<string>(type: "text", nullable: true),
                    AllowsWriteToPm = table.Column<bool>(type: "boolean", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    Balance_TON = table.Column<double>(type: "double precision", nullable: true),
                    Balance_GOLD = table.Column<double>(type: "double precision", nullable: true),
                    Balance_CRYSTAL = table.Column<double>(type: "double precision", nullable: true),
                    TotalVictory = table.Column<long>(type: "bigint", nullable: false),
                    Bonus = table.Column<bool>(type: "boolean", nullable: false),
                    ReferrerID = table.Column<long>(type: "bigint", nullable: false),
                    UnlockedWorlds = table.Column<string[]>(type: "text[]", nullable: true),
                    Monsters = table.Column<string[]>(type: "text[]", nullable: true),
                    Items_MonstaBall = table.Column<int>(type: "integer", nullable: true),
                    Items_RagePotion = table.Column<int>(type: "integer", nullable: true),
                    Items_WindSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_WaterFallSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_AvalancheSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_LavaSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_ThunderSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_DarkSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_HealSpell = table.Column<int>(type: "integer", nullable: true),
                    Items_Shield = table.Column<int>(type: "integer", nullable: true),
                    Items_Poison = table.Column<int>(type: "integer", nullable: true),
                    Items_Hallucinogen = table.Column<int>(type: "integer", nullable: true),
                    Transactions = table.Column<string[]>(type: "text[]", nullable: true),
                    Missions = table.Column<string[]>(type: "text[]", nullable: true),
                    TotalBattles = table.Column<int>(type: "integer", nullable: false),
                    TotalCaptured = table.Column<int>(type: "integer", nullable: false),
                    Tutorial = table.Column<bool>(type: "boolean", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    RegistrationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Battles",
                columns: table => new
                {
                    BattleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<long>(type: "bigint", nullable: false),
                    PlayerMonsterGlobalID = table.Column<int>(type: "integer", nullable: true),
                    EnemyMonsterGlobalID = table.Column<int>(type: "integer", nullable: true),
                    PlayerState_Rage = table.Column<bool>(type: "boolean", nullable: true),
                    PlayerState_Sick = table.Column<bool>(type: "boolean", nullable: true),
                    PlayerState_Hypno = table.Column<bool>(type: "boolean", nullable: true),
                    PlayerState_JustMissed = table.Column<bool>(type: "boolean", nullable: true),
                    PlayerState_AtkBonus = table.Column<int>(type: "integer", nullable: true),
                    PlayerState_DefBonus = table.Column<int>(type: "integer", nullable: true),
                    PlayerState_AimBonus = table.Column<int>(type: "integer", nullable: true),
                    PlayerState_PendingHeal = table.Column<int>(type: "integer", nullable: true),
                    EnemyState_Rage = table.Column<bool>(type: "boolean", nullable: true),
                    EnemyState_Sick = table.Column<bool>(type: "boolean", nullable: true),
                    EnemyState_Hypno = table.Column<bool>(type: "boolean", nullable: true),
                    EnemyState_JustMissed = table.Column<bool>(type: "boolean", nullable: true),
                    EnemyState_AtkBonus = table.Column<int>(type: "integer", nullable: true),
                    EnemyState_DefBonus = table.Column<int>(type: "integer", nullable: true),
                    EnemyState_AimBonus = table.Column<int>(type: "integer", nullable: true),
                    EnemyState_PendingHeal = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TurnCount = table.Column<int>(type: "integer", nullable: false),
                    PlayerActiveSkills = table.Column<List<string>>(type: "text[]", nullable: true),
                    EnemyActiveSkills = table.Column<List<string>>(type: "text[]", nullable: true),
                    PlayerLastEffect = table.Column<string>(type: "text", nullable: true),
                    EnemyLastEffect = table.Column<string>(type: "text", nullable: true),
                    PlayerCooldownSkill = table.Column<string>(type: "text", nullable: true),
                    EnemyCooldownSkill = table.Column<string>(type: "text", nullable: true),
                    Victory = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Battles", x => x.BattleId);
                    table.ForeignKey(
                        name: "FK_Battles_Monsters_EnemyMonsterGlobalID",
                        column: x => x.EnemyMonsterGlobalID,
                        principalTable: "Monsters",
                        principalColumn: "GlobalID");
                    table.ForeignKey(
                        name: "FK_Battles_Monsters_PlayerMonsterGlobalID",
                        column: x => x.PlayerMonsterGlobalID,
                        principalTable: "Monsters",
                        principalColumn: "GlobalID");
                });

            migrationBuilder.CreateTable(
                name: "Location",
                columns: table => new
                {
                    World = table.Column<string>(type: "text", nullable: true),
                    Nodes = table.Column<List<string>>(type: "text[]", nullable: true),
                    LastSpawned = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WorldSpawnsUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.ForeignKey(
                        name: "FK_Location_Spawns_WorldSpawnsUserId",
                        column: x => x.WorldSpawnsUserId,
                        principalTable: "Spawns",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Deposits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<long>(type: "bigint", nullable: false),
                    Amount = table.Column<double>(type: "double precision", nullable: false),
                    Balance_TON = table.Column<double>(type: "double precision", nullable: true),
                    Balance_GOLD = table.Column<double>(type: "double precision", nullable: true),
                    Balance_CRYSTAL = table.Column<double>(type: "double precision", nullable: true),
                    Successful = table.Column<bool>(type: "boolean", nullable: false),
                    Completed = table.Column<bool>(type: "boolean", nullable: false),
                    Hash = table.Column<string>(type: "text", nullable: true),
                    InvoiceID = table.Column<Guid>(type: "uuid", nullable: true),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SuccessfulAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserBaseID = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Deposits_Invoices_InvoiceID",
                        column: x => x.InvoiceID,
                        principalTable: "Invoices",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_Deposits_Users_UserBaseID",
                        column: x => x.UserBaseID,
                        principalTable: "Users",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "Offers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<long>(type: "bigint", nullable: false),
                    OfferId = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<double>(type: "double precision", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    PurchasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Offers_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Withdraws",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<long>(type: "bigint", nullable: false),
                    Amount = table.Column<double>(type: "double precision", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    Hash = table.Column<string>(type: "text", nullable: true),
                    Processing = table.Column<bool>(type: "boolean", nullable: false),
                    Completed = table.Column<bool>(type: "boolean", nullable: false),
                    UserBaseID = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Withdraws", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Withdraws_Users_UserBaseID",
                        column: x => x.UserBaseID,
                        principalTable: "Users",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Battles_EnemyMonsterGlobalID",
                table: "Battles",
                column: "EnemyMonsterGlobalID");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_PlayerMonsterGlobalID",
                table: "Battles",
                column: "PlayerMonsterGlobalID");

            migrationBuilder.CreateIndex(
                name: "IX_Deposits_InvoiceID",
                table: "Deposits",
                column: "InvoiceID");

            migrationBuilder.CreateIndex(
                name: "IX_Deposits_UserBaseID",
                table: "Deposits",
                column: "UserBaseID");

            migrationBuilder.CreateIndex(
                name: "IX_Location_WorldSpawnsUserId",
                table: "Location",
                column: "WorldSpawnsUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_UserID",
                table: "Offers",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Withdraws_UserBaseID",
                table: "Withdraws",
                column: "UserBaseID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Battles");

            migrationBuilder.DropTable(
                name: "Deposits");

            migrationBuilder.DropTable(
                name: "Location");

            migrationBuilder.DropTable(
                name: "Offers");

            migrationBuilder.DropTable(
                name: "Referrals");

            migrationBuilder.DropTable(
                name: "UserMissions");

            migrationBuilder.DropTable(
                name: "Withdraws");

            migrationBuilder.DropTable(
                name: "Monsters");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Spawns");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
