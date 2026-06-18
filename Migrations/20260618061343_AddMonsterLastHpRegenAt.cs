using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    public partial class AddMonsterLastHpRegenAt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastHpRegenAt",
                table: "Monsters",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastHpRegenAt",
                table: "Monsters");
        }
    }
}
