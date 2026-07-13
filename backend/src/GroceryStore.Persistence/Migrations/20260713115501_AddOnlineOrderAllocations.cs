using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GroceryStore.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOnlineOrderAllocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OnlineOrderAllocations",
                columns: table => new
                {
                    OnlineOrderAllocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OnlineOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OnlineOrderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InventoryBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnlineOrderAllocations", x => x.OnlineOrderAllocationId);
                    table.ForeignKey(
                        name: "FK_OnlineOrderAllocations_InventoryBatches_InventoryBatchId",
                        column: x => x.InventoryBatchId,
                        principalTable: "InventoryBatches",
                        principalColumn: "InventoryBatchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnlineOrderAllocations_OnlineOrderItems_OnlineOrderItemId",
                        column: x => x.OnlineOrderItemId,
                        principalTable: "OnlineOrderItems",
                        principalColumn: "OnlineOrderItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnlineOrderAllocations_OnlineOrders_OnlineOrderId",
                        column: x => x.OnlineOrderId,
                        principalTable: "OnlineOrders",
                        principalColumn: "OnlineOrderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrderAllocations_InventoryBatchId",
                table: "OnlineOrderAllocations",
                column: "InventoryBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrderAllocations_OnlineOrderId",
                table: "OnlineOrderAllocations",
                column: "OnlineOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrderAllocations_OnlineOrderItemId",
                table: "OnlineOrderAllocations",
                column: "OnlineOrderItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnlineOrderAllocations");
        }
    }
}
