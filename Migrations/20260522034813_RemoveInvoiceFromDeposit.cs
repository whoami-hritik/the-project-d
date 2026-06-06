using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInvoiceFromDeposit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deposits_Invoices_InvoiceId",
                table: "Deposits");

            migrationBuilder.DropIndex(
                name: "IX_Deposits_InvoiceId",
                table: "Deposits");

            migrationBuilder.DropColumn(
                name: "Price_CRYSTAL",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "Price_TON",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Deposits");

            migrationBuilder.RenameColumn(
                name: "Price_GOLD",
                table: "ShopItems",
                newName: "GOLD");

            migrationBuilder.AlterColumn<double>(
                name: "GOLD",
                table: "ShopItems",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GOLD",
                table: "ShopItems",
                newName: "Price_GOLD");

            migrationBuilder.AlterColumn<double>(
                name: "Price_GOLD",
                table: "ShopItems",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AddColumn<double>(
                name: "Price_CRYSTAL",
                table: "ShopItems",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Price_TON",
                table: "ShopItems",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Deposits",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deposits_InvoiceId",
                table: "Deposits",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Deposits_Invoices_InvoiceId",
                table: "Deposits",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "InvoiceId");
        }
    }
}
