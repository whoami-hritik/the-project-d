using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace monster_world.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserOffer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deposits_Invoices_InvoiceID",
                table: "Deposits");

            migrationBuilder.DropTable(
                name: "Offers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Invoices",
                table: "Invoices");

            migrationBuilder.RenameColumn(
                name: "UserID",
                table: "Invoices",
                newName: "BuyerId");

            migrationBuilder.RenameColumn(
                name: "InvoiceType",
                table: "Invoices",
                newName: "PayingCurrency");

            migrationBuilder.RenameColumn(
                name: "ExpireAt",
                table: "Invoices",
                newName: "PaidAt");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Invoices",
                newName: "ExpireAfter");

            migrationBuilder.RenameColumn(
                name: "ID",
                table: "Invoices",
                newName: "ItemId");

            migrationBuilder.RenameColumn(
                name: "InvoiceID",
                table: "Deposits",
                newName: "InvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_Deposits_InvoiceID",
                table: "Deposits",
                newName: "IX_Deposits_InvoiceId");

            migrationBuilder.AddColumn<List<string>>(
                name: "Payloads",
                table: "Users",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Invoices",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<double>(
                name: "AmountUSDT",
                table: "Invoices",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "Paid",
                table: "Invoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "PayingAmount",
                table: "Invoices",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "Invoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ServiceDelivered",
                table: "Invoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Invoices",
                table: "Invoices",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Deposits_Invoices_InvoiceId",
                table: "Deposits",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "InvoiceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deposits_Invoices_InvoiceId",
                table: "Deposits");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Invoices",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Payloads",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "AmountUSDT",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Paid",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PayingAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ServiceDelivered",
                table: "Invoices");

            migrationBuilder.RenameColumn(
                name: "PayingCurrency",
                table: "Invoices",
                newName: "InvoiceType");

            migrationBuilder.RenameColumn(
                name: "PaidAt",
                table: "Invoices",
                newName: "ExpireAt");

            migrationBuilder.RenameColumn(
                name: "ItemId",
                table: "Invoices",
                newName: "ID");

            migrationBuilder.RenameColumn(
                name: "ExpireAfter",
                table: "Invoices",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "BuyerId",
                table: "Invoices",
                newName: "UserID");

            migrationBuilder.RenameColumn(
                name: "InvoiceId",
                table: "Deposits",
                newName: "InvoiceID");

            migrationBuilder.RenameIndex(
                name: "IX_Deposits_InvoiceId",
                table: "Deposits",
                newName: "IX_Deposits_InvoiceID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Invoices",
                table: "Invoices",
                column: "ID");

            migrationBuilder.CreateTable(
                name: "Offers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<long>(type: "bigint", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    OfferId = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<double>(type: "double precision", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Offers_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Offers_UserID",
                table: "Offers",
                column: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Deposits_Invoices_InvoiceID",
                table: "Deposits",
                column: "InvoiceID",
                principalTable: "Invoices",
                principalColumn: "ID");
        }
    }
}
