using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddPoolAndAnalyticsAndEggs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Balance_EGGS",
                table: "Users",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Balance_EGGS",
                table: "Deposits",
                type: "double precision",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Analytics",
                columns: table => new
                {
                    ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TotalDeposit = table.Column<double>(type: "double precision", nullable: false),
                    TotalInvested = table.Column<double>(type: "double precision", nullable: false),
                    TotalWithdrawn = table.Column<double>(type: "double precision", nullable: false),
                    TotalFarm = table.Column<double>(type: "double precision", nullable: false),
                    TotalExchanged = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Analytics", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Pool",
                columns: table => new
                {
                    PoolID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    USDTLiquidity = table.Column<double>(type: "double precision", nullable: false),
                    TreasuryReserve = table.Column<double>(type: "double precision", nullable: false),
                    RewardReserve = table.Column<double>(type: "double precision", nullable: false),
                    TotalEGGS = table.Column<double>(type: "double precision", nullable: false),
                    EGGSPrice = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pool", x => x.PoolID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Analytics");

            migrationBuilder.DropTable(name: "Pool");

            migrationBuilder.DropColumn(
                name: "Balance_EGGS",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Balance_EGGS",
                table: "Deposits");
        }
    }
}
