using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAssembly.Server.Migrations.SharedDb
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SharedBudgets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Month = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedBudgets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SharedUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SharedExpenses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GroupId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MonthKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    YearKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    isPersonal = table.Column<bool>(type: "bit", nullable: false),
                    isChild = table.Column<bool>(type: "bit", nullable: false),
                    isShared = table.Column<bool>(type: "bit", nullable: false),
                    isRecurring = table.Column<bool>(type: "bit", nullable: false),
                    isBalanced = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SharedExpenses_SharedUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "SharedUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_SharedExpenses_CreatedByUserId",
                table: "SharedExpenses",
                column: "CreatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SharedBudgets");

            migrationBuilder.DropTable(
                name: "SharedExpenses");

            migrationBuilder.DropTable(
                name: "SharedUsers");
        }
    }
}
