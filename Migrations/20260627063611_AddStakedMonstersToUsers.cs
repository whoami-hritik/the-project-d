using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddStakedMonstersToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "StakedMonsters",
                table: "Users",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionHourCap",
                table: "Monsters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Collectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LastEligibleTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collectors", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Collectors");

            migrationBuilder.DropColumn(
                name: "StakedMonsters",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CollectionHourCap",
                table: "Monsters");
        }
    }
}
