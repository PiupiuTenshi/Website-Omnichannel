using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GroceryStore.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewsAndReturns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductReviews",
                columns: table => new
                {
                    ProductReviewId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OnlineOrderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductVariantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ManagerReply = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RepliedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductReviews", x => x.ProductReviewId);
                    table.CheckConstraint("CK_ProductReviews_Rating", "[Rating] BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_ProductReviews_AspNetUsers_BuyerUserId",
                        column: x => x.BuyerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductReviews_OnlineOrderItems_OnlineOrderItemId",
                        column: x => x.OnlineOrderItemId,
                        principalTable: "OnlineOrderItems",
                        principalColumn: "OnlineOrderItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductReviews_ProductVariants_ProductVariantId",
                        column: x => x.ProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "ProductVariantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReturnRequests",
                columns: table => new
                {
                    ReturnRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OnlineOrderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductVariantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Reason = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Disposition = table.Column<int>(type: "int", nullable: true),
                    ManagerNote = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnRequests", x => x.ReturnRequestId);
                    table.ForeignKey(
                        name: "FK_ReturnRequests_AspNetUsers_BuyerUserId",
                        column: x => x.BuyerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnRequests_OnlineOrderItems_OnlineOrderItemId",
                        column: x => x.OnlineOrderItemId,
                        principalTable: "OnlineOrderItems",
                        principalColumn: "OnlineOrderItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnRequests_ProductVariants_ProductVariantId",
                        column: x => x.ProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "ProductVariantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviews_BuyerUserId",
                table: "ProductReviews",
                column: "BuyerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviews_OnlineOrderItemId",
                table: "ProductReviews",
                column: "OnlineOrderItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductReviews_ProductVariantId",
                table: "ProductReviews",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnRequests_BuyerUserId_CreatedAtUtc",
                table: "ReturnRequests",
                columns: new[] { "BuyerUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ReturnRequests_OnlineOrderItemId",
                table: "ReturnRequests",
                column: "OnlineOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnRequests_ProductVariantId",
                table: "ReturnRequests",
                column: "ProductVariantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductReviews");

            migrationBuilder.DropTable(
                name: "ReturnRequests");
        }
    }
}
