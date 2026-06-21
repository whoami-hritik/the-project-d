using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddUnlockedSlotsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Battles_Monsters_EnemyMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropForeignKey(
                name: "FK_Battles_Monsters_PlayerMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropIndex(
                name: "IX_Battles_EnemyMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropIndex(
                name: "IX_Battles_PlayerMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyActiveSkills",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyCooldownSkill",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyLastEffect",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Aim",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Atk",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Def",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Energy",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Hypno",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_JustMissed",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_PendingHeal",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Rage",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Sick",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerActiveSkills",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerCooldownSkill",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerLastEffect",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerMonsterGlobalID",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Aim",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Atk",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Def",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Energy",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Hypno",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_JustMissed",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Rage",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "PlayerState_Sick",
                table: "Battles");

            migrationBuilder.RenameColumn(
                name: "PlayerState_PendingHeal",
                table: "Battles",
                newName: "EnemyStates_Capacity");

            migrationBuilder.AddColumn<int>(
                name: "UnlockedSlots",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "BattleStateBattleId",
                table: "Monsters",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BattleStateBattleId1",
                table: "Monsters",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MonsterState",
                columns: table => new
                {
                    BattleStateBattleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InstanceId = table.Column<string>(type: "text", nullable: true),
                    Energy = table.Column<int>(type: "integer", nullable: false),
                    Rage = table.Column<bool>(type: "boolean", nullable: false),
                    Sick = table.Column<bool>(type: "boolean", nullable: false),
                    Hypno = table.Column<bool>(type: "boolean", nullable: false),
                    JustMissed = table.Column<bool>(type: "boolean", nullable: false),
                    Atk = table.Column<int>(type: "integer", nullable: false),
                    Def = table.Column<int>(type: "integer", nullable: false),
                    Aim = table.Column<int>(type: "integer", nullable: false),
                    PendingHeal = table.Column<int>(type: "integer", nullable: false),
                    ActiveSkills = table.Column<List<string>>(type: "text[]", nullable: true),
                    LastEffect = table.Column<string>(type: "text", nullable: true),
                    CooldownSkill = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonsterState", x => new { x.BattleStateBattleId, x.Id });
                    table.ForeignKey(
                        name: "FK_MonsterState_Battles_BattleStateBattleId",
                        column: x => x.BattleStateBattleId,
                        principalTable: "Battles",
                        principalColumn: "BattleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Monsters_BattleStateBattleId",
                table: "Monsters",
                column: "BattleStateBattleId");

            migrationBuilder.CreateIndex(
                name: "IX_Monsters_BattleStateBattleId1",
                table: "Monsters",
                column: "BattleStateBattleId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Monsters_Battles_BattleStateBattleId",
                table: "Monsters",
                column: "BattleStateBattleId",
                principalTable: "Battles",
                principalColumn: "BattleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Monsters_Battles_BattleStateBattleId1",
                table: "Monsters",
                column: "BattleStateBattleId1",
                principalTable: "Battles",
                principalColumn: "BattleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Monsters_Battles_BattleStateBattleId",
                table: "Monsters");

            migrationBuilder.DropForeignKey(
                name: "FK_Monsters_Battles_BattleStateBattleId1",
                table: "Monsters");

            migrationBuilder.DropTable(
                name: "MonsterState");

            migrationBuilder.DropIndex(
                name: "IX_Monsters_BattleStateBattleId",
                table: "Monsters");

            migrationBuilder.DropIndex(
                name: "IX_Monsters_BattleStateBattleId1",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "UnlockedSlots",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BattleStateBattleId",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "BattleStateBattleId1",
                table: "Monsters");

            migrationBuilder.RenameColumn(
                name: "EnemyStates_Capacity",
                table: "Battles",
                newName: "PlayerState_PendingHeal");

            migrationBuilder.AddColumn<List<string>>(
                name: "EnemyActiveSkills",
                table: "Battles",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnemyCooldownSkill",
                table: "Battles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnemyLastEffect",
                table: "Battles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyMonsterGlobalID",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_Aim",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_Atk",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_Def",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_Energy",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnemyState_Hypno",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnemyState_JustMissed",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_PendingHeal",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnemyState_Rage",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnemyState_Sick",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "PlayerActiveSkills",
                table: "Battles",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerCooldownSkill",
                table: "Battles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerLastEffect",
                table: "Battles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerMonsterGlobalID",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerState_Aim",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerState_Atk",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerState_Def",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerState_Energy",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PlayerState_Hypno",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PlayerState_JustMissed",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PlayerState_Rage",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PlayerState_Sick",
                table: "Battles",
                type: "boolean",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Battles_EnemyMonsterGlobalID",
                table: "Battles",
                column: "EnemyMonsterGlobalID");

            migrationBuilder.CreateIndex(
                name: "IX_Battles_PlayerMonsterGlobalID",
                table: "Battles",
                column: "PlayerMonsterGlobalID");

            migrationBuilder.AddForeignKey(
                name: "FK_Battles_Monsters_EnemyMonsterGlobalID",
                table: "Battles",
                column: "EnemyMonsterGlobalID",
                principalTable: "Monsters",
                principalColumn: "GlobalID");

            migrationBuilder.AddForeignKey(
                name: "FK_Battles_Monsters_PlayerMonsterGlobalID",
                table: "Battles",
                column: "PlayerMonsterGlobalID",
                principalTable: "Monsters",
                principalColumn: "GlobalID");
        }
    }
}
