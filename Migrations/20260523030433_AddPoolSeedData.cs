using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class AddPoolSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Pool",
                columns: new[] { "PoolID", "EGGSPrice", "RewardReserve", "TotalEGGS", "TreasuryReserve", "USDTLiquidity" },
                values: new object[] { 1, 1.0, 0.0, 400.0, 0.0, 400.0 });

            migrationBuilder.AddCheckConstraint(
                name: "CK_POOL_SingleRow",
                table: "Pool",
                sql: "\"PoolID\" = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_POOL_SingleRow",
                table: "Pool");

            migrationBuilder.DeleteData(
                table: "Pool",
                keyColumn: "PoolID",
                keyValue: 1);
        }
    }
}
