using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "ListedMonsters",
                table: "Users",
                type: "text[]",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Marketplace",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uuid", nullable: false),
                    SellerId = table.Column<long>(type: "bigint", nullable: false),
                    ListingType = table.Column<string>(type: "text", nullable: true),
                    ItemId = table.Column<string>(type: "text", nullable: true),
                    MonsterId = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<double>(type: "double precision", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    ListedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsSold = table.Column<bool>(type: "boolean", nullable: false),
                    BuyerId = table.Column<long>(type: "bigint", nullable: false),
                    SoldDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Marketplace", x => x.ID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Marketplace");

            migrationBuilder.DropColumn(
                name: "ListedMonsters",
                table: "Users");
        }
    }
}
