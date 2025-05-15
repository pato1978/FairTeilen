using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAssembly.Server.Migrations.SharedDb
{
    /// <inheritdoc />
    public partial class AddScopeToBudget_Shared : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Scope",
                table: "SharedBudgets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Scope",
                table: "SharedBudgets");
        }
    }
}
