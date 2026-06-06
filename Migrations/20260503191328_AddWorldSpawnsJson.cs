using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddWorldSpawnsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Location");

            migrationBuilder.AddColumn<string>(
                name: "Spawns",
                table: "Spawns",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Spawns",
                table: "Spawns");

            migrationBuilder.CreateTable(
                name: "Location",
                columns: table => new
                {
                    LastSpawned = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Nodes = table.Column<List<string>>(type: "text[]", nullable: true),
                    World = table.Column<string>(type: "text", nullable: true),
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

            migrationBuilder.CreateIndex(
                name: "IX_Location_WorldSpawnsUserId",
                table: "Location",
                column: "WorldSpawnsUserId");
        }
    }
}
