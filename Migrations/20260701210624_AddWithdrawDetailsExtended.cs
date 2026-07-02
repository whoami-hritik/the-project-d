using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddWithdrawDetailsExtended : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Withdraws",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "PlayerStatsJson",
                table: "Withdraws",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Withdraws",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WalletAddress",
                table: "Withdraws",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Withdraws");

            migrationBuilder.DropColumn(
                name: "PlayerStatsJson",
                table: "Withdraws");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Withdraws");

            migrationBuilder.DropColumn(
                name: "WalletAddress",
                table: "Withdraws");
        }
    }
}
