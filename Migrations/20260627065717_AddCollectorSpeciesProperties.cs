using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectorSpeciesProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "CommonSpecies",
                table: "Collectors",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "EpicSpecies",
                table: "Collectors",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "LegendarySpecies",
                table: "Collectors",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "RareSpecies",
                table: "Collectors",
                type: "text[]",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommonSpecies",
                table: "Collectors");

            migrationBuilder.DropColumn(
                name: "EpicSpecies",
                table: "Collectors");

            migrationBuilder.DropColumn(
                name: "LegendarySpecies",
                table: "Collectors");

            migrationBuilder.DropColumn(
                name: "RareSpecies",
                table: "Collectors");
        }
    }
}
