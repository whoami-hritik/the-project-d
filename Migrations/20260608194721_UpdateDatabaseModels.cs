using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabaseModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HealTime",
                table: "Monsters");

            migrationBuilder.RenameColumn(
                name: "Kind",
                table: "Monsters",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "CurrentHP",
                table: "Monsters",
                newName: "SPD");

            migrationBuilder.RenameColumn(
                name: "PlayerState_DefBonus",
                table: "Battles",
                newName: "PlayerState_Def");

            migrationBuilder.RenameColumn(
                name: "PlayerState_AtkBonus",
                table: "Battles",
                newName: "PlayerState_Atk");

            migrationBuilder.RenameColumn(
                name: "PlayerState_AimBonus",
                table: "Battles",
                newName: "PlayerState_Aim");

            migrationBuilder.RenameColumn(
                name: "EnemyState_DefBonus",
                table: "Battles",
                newName: "EnemyState_Def");

            migrationBuilder.RenameColumn(
                name: "EnemyState_AtkBonus",
                table: "Battles",
                newName: "EnemyState_Atk");

            migrationBuilder.RenameColumn(
                name: "EnemyState_AimBonus",
                table: "Battles",
                newName: "EnemyState_Aim");

            migrationBuilder.AddColumn<int>(
                name: "PlayerState_Energy",
                table: "Battles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EnemyState_Energy",
                table: "Battles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ATK",
                table: "Monsters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DEF",
                table: "Monsters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Desc",
                table: "Monsters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Element",
                table: "Monsters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HP",
                table: "Monsters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxHP",
                table: "Monsters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Rarity",
                table: "Monsters",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MapLiquidity",
                columns: table => new
                {
                    MapId = table.Column<string>(type: "text", nullable: false),
                    MapLiquidity = table.Column<double>(type: "double precision", nullable: false),
                    DailyUSDTLiquidity = table.Column<double>(type: "double precision", nullable: false),
                    TotalUsers = table.Column<int>(type: "integer", nullable: false),
                    Users = table.Column<List<long>>(type: "bigint[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapLiquidity", x => x.MapId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MapLiquidity");

            migrationBuilder.DropColumn(
                name: "ATK",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "DEF",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "Desc",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "Element",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "HP",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "MaxHP",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "Rarity",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "PlayerState_Energy",
                table: "Battles");

            migrationBuilder.DropColumn(
                name: "EnemyState_Energy",
                table: "Battles");

            migrationBuilder.RenameColumn(
                name: "SPD",
                table: "Monsters",
                newName: "CurrentHP");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "Monsters",
                newName: "Kind");

            migrationBuilder.RenameColumn(
                name: "PlayerState_Def",
                table: "Battles",
                newName: "PlayerState_DefBonus");

            migrationBuilder.RenameColumn(
                name: "PlayerState_Atk",
                table: "Battles",
                newName: "PlayerState_AtkBonus");

            migrationBuilder.RenameColumn(
                name: "PlayerState_Aim",
                table: "Battles",
                newName: "PlayerState_AimBonus");

            migrationBuilder.RenameColumn(
                name: "EnemyState_Def",
                table: "Battles",
                newName: "EnemyState_DefBonus");

            migrationBuilder.RenameColumn(
                name: "EnemyState_Atk",
                table: "Battles",
                newName: "EnemyState_AtkBonus");

            migrationBuilder.RenameColumn(
                name: "EnemyState_Aim",
                table: "Battles",
                newName: "EnemyState_AimBonus");

            migrationBuilder.AddColumn<DateTime>(
                name: "HealTime",
                table: "Monsters",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
