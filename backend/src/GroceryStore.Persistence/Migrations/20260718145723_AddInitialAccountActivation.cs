using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GroceryStore.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInitialAccountActivation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RequiresInitialActivation",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiresInitialActivation",
                table: "AspNetUsers");
        }
    }
}
