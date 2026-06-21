using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRegenerating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRegenerating",
                table: "Monsters",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRegenerating",
                table: "Monsters");
        }
    }
}
