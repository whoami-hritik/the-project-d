using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddBossBattleTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBoss",
                table: "Monsters",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCaptured",
                table: "Monsters",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BossBattle",
                table: "Battles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Map",
                table: "Battles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RewardProcessed",
                table: "Battles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "BossBattleData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalBossBattles = table.Column<int>(type: "integer", nullable: false),
                    TotalUSDTCap = table.Column<double>(type: "double precision", nullable: false),
                    BattleIds = table.Column<List<Guid>>(type: "uuid[]", nullable: true),
                    MapBosses = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BossBattleData", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BossBattleData");

            migrationBuilder.DropColumn(
                name: "IsBoss",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "IsCaptured",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "BossBattle",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "Map",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "RewardProcessed",
                table: "Battles");
        }
    }
}
