using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Core.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedUserId",
                table: "Leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leads_AssignedUserId",
                table: "Leads",
                column: "AssignedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_AssignedUserId",
                table: "Leads",
                column: "AssignedUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_AssignedUserId",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_AssignedUserId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "Leads");
        }
    }
}
