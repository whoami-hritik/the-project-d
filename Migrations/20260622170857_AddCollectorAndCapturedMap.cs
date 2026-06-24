using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectorAndCapturedMap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnlockedCollectorSlots",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CapturedMap",
                table: "Monsters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CollectorDepositTime",
                table: "Monsters",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectorFocus",
                table: "Monsters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CollectorLastClaimTime",
                table: "Monsters",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "StakedInCollector",
                table: "Monsters",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnlockedCollectorSlots",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CapturedMap",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "CollectorDepositTime",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "CollectorFocus",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "CollectorLastClaimTime",
                table: "Monsters");

            migrationBuilder.DropColumn(
                name: "StakedInCollector",
                table: "Monsters");
        }
    }
}
