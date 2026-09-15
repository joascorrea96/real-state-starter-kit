using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Core.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenamePropertyAndLeadTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lead_Property_PropertyId",
                table: "Lead");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Property",
                table: "Property");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Lead",
                table: "Lead");

            migrationBuilder.RenameTable(
                name: "Property",
                newName: "Properties");

            migrationBuilder.RenameTable(
                name: "Lead",
                newName: "Leads");

            migrationBuilder.RenameIndex(
                name: "IX_Property_Type",
                table: "Properties",
                newName: "IX_Properties_Type");

            migrationBuilder.RenameIndex(
                name: "IX_Property_Price",
                table: "Properties",
                newName: "IX_Properties_Price");

            migrationBuilder.RenameIndex(
                name: "IX_Property_Neighborhood",
                table: "Properties",
                newName: "IX_Properties_Neighborhood");

            migrationBuilder.RenameIndex(
                name: "IX_Property_CompanyId",
                table: "Properties",
                newName: "IX_Properties_CompanyId");

            migrationBuilder.RenameIndex(
                name: "IX_Property_City",
                table: "Properties",
                newName: "IX_Properties_City");

            migrationBuilder.RenameIndex(
                name: "IX_Lead_Status",
                table: "Leads",
                newName: "IX_Leads_Status");

            migrationBuilder.RenameIndex(
                name: "IX_Lead_PropertyId",
                table: "Leads",
                newName: "IX_Leads_PropertyId");

            migrationBuilder.RenameIndex(
                name: "IX_Lead_CompanyId",
                table: "Leads",
                newName: "IX_Leads_CompanyId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Properties",
                table: "Properties",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Leads",
                table: "Leads",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Properties_PropertyId",
                table: "Leads",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Properties_PropertyId",
                table: "Leads");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Properties",
                table: "Properties");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Leads",
                table: "Leads");

            migrationBuilder.RenameTable(
                name: "Properties",
                newName: "Property");

            migrationBuilder.RenameTable(
                name: "Leads",
                newName: "Lead");

            migrationBuilder.RenameIndex(
                name: "IX_Properties_Type",
                table: "Property",
                newName: "IX_Property_Type");

            migrationBuilder.RenameIndex(
                name: "IX_Properties_Price",
                table: "Property",
                newName: "IX_Property_Price");

            migrationBuilder.RenameIndex(
                name: "IX_Properties_Neighborhood",
                table: "Property",
                newName: "IX_Property_Neighborhood");

            migrationBuilder.RenameIndex(
                name: "IX_Properties_CompanyId",
                table: "Property",
                newName: "IX_Property_CompanyId");

            migrationBuilder.RenameIndex(
                name: "IX_Properties_City",
                table: "Property",
                newName: "IX_Property_City");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_Status",
                table: "Lead",
                newName: "IX_Lead_Status");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_PropertyId",
                table: "Lead",
                newName: "IX_Lead_PropertyId");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_CompanyId",
                table: "Lead",
                newName: "IX_Lead_CompanyId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Property",
                table: "Property",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Lead",
                table: "Lead",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Lead_Property_PropertyId",
                table: "Lead",
                column: "PropertyId",
                principalTable: "Property",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
