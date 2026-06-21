using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class FixEnemyStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MonsterState");

            migrationBuilder.DropColumn(
                name: "EnemyStates_Capacity",
                table: "Battles");

            migrationBuilder.CreateTable(
                name: "Battles_EnemyStates",
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
                    table.PrimaryKey("PK_Battles_EnemyStates", x => new { x.BattleStateBattleId, x.Id });
                    table.ForeignKey(
                        name: "FK_Battles_EnemyStates_Battles_BattleStateBattleId",
                        column: x => x.BattleStateBattleId,
                        principalTable: "Battles",
                        principalColumn: "BattleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Battles_PlayerStates",
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
                    table.PrimaryKey("PK_Battles_PlayerStates", x => new { x.BattleStateBattleId, x.Id });
                    table.ForeignKey(
                        name: "FK_Battles_PlayerStates_Battles_BattleStateBattleId",
                        column: x => x.BattleStateBattleId,
                        principalTable: "Battles",
                        principalColumn: "BattleId",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Battles_EnemyStates");

            migrationBuilder.DropTable(
                name: "Battles_PlayerStates");

            migrationBuilder.AddColumn<int>(
                name: "EnemyStates_Capacity",
                table: "Battles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MonsterState",
                columns: table => new
                {
                    BattleStateBattleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActiveSkills = table.Column<List<string>>(type: "text[]", nullable: true),
                    Aim = table.Column<int>(type: "integer", nullable: false),
                    Atk = table.Column<int>(type: "integer", nullable: false),
                    CooldownSkill = table.Column<string>(type: "text", nullable: true),
                    Def = table.Column<int>(type: "integer", nullable: false),
                    Energy = table.Column<int>(type: "integer", nullable: false),
                    Hypno = table.Column<bool>(type: "boolean", nullable: false),
                    InstanceId = table.Column<string>(type: "text", nullable: true),
                    JustMissed = table.Column<bool>(type: "boolean", nullable: false),
                    LastEffect = table.Column<string>(type: "text", nullable: true),
                    PendingHeal = table.Column<int>(type: "integer", nullable: false),
                    Rage = table.Column<bool>(type: "boolean", nullable: false),
                    Sick = table.Column<bool>(type: "boolean", nullable: false)
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
        }
    }
}
