using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAssembly.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddScopeToBudget_App : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Scope",
                table: "Budgets",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Scope",
                table: "Budgets");
        }
    }
}
