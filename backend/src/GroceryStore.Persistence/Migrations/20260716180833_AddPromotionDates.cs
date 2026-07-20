using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GroceryStore.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PromotionEndAtUtc",
                table: "ProductVariants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PromotionStartAtUtc",
                table: "ProductVariants",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PromotionEndAtUtc",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "PromotionStartAtUtc",
                table: "ProductVariants");
        }
    }
}
