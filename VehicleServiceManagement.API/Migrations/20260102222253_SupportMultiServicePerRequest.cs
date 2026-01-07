using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class SupportMultiServicePerRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceRequestCategories",
                columns: table => new
                {
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceRequestCategories", x => new { x.ServiceRequestId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_ServiceRequestCategories_ServiceCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ServiceCategories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceRequestCategories_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$M3mf/GEcWFi9Zz5ItB1fIOpOgo0xbeBxynqFyssURWs9F6wrDLiku");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$XDniAQs9MHyea7amFD/ST.8EvEawBlkCesr.xX57XgZfMadXp/46O");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$m9.lF4Vlu/EW1Yy4GJ7Kve7jcNSmciEC7LPIviinW2osJ6TFkn1pW");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$rSVSg7qP3ChUlDRakdlewemIXMJW8JdJI.r6uU/urwyH1SsFyJgpK");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$Fp9OYGbXqHBzH0aqt639pe0.6w5SjAHY/5pfLSk9QkTxEh17P.Gny");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestCategories_CategoryId",
                table: "ServiceRequestCategories",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceRequestCategories");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$YhcUy/6tmlpCgU.DgnJzrOCPL5sNvZdO90ac99T.RUge1Hh4L7Ce2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$lo2wvPMa61IoyS7DH6Yt3eAr2/7KMEIpFZX2x7BzdmN38xnE37S/y");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$jKDYx.uODbdFHcl1rhCz.OJfAlmhf04I0WHefWfuLDhZDR7bYjUQC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$TrVBZI4VYaT1WKYf3TPBDuVH3CtOPLM3xmWSVh17kDKSG8g4hLfyC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$xOyC7O79PCNExjXQU0nLBuIYLPYh1OpNodBt1eWYJ6noWxgfbxYhi");
        }
    }
}
