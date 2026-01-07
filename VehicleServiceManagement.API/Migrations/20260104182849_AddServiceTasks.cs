using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceTasks",
                columns: table => new
                {
                    ServiceTaskId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedByUserId = table.Column<int>(type: "int", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceTasks", x => x.ServiceTaskId);
                    table.ForeignKey(
                        name: "FK_ServiceTasks_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceTasks_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$P.tk5Gv4k.5z6Kvy.q2pLezzwh8w6kub5DlSS2RJGuKIOHEx80xGS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$asLTb5wy3pZVquulCpysdeZMeXhf4vRJtfUjAOIEtO779uxuDB5Ke");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$E6KR5KXI4mNjPbX9/yrzdODH0oF.6K/XumLwDir1Gf3ZoV4J4xf/a");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$sbtTLqOyW4jgrPnuSdA.2uqFbWTOftIR6mTTBOB7NguDgf3eBGN5.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$hJEDQLZBwz.Dubzx7w/C5OLPzv/4h1Q9XXnvMeWKPunEsoc7JGnea");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceTasks_CompletedByUserId",
                table: "ServiceTasks",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceTasks_ServiceRequestId",
                table: "ServiceTasks",
                column: "ServiceRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceTasks");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$QvPVgO4YO8HvEdcE9XoEBeaq/hEmBfR6djR4fazW7jYZZkRO0qzT6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$6OfztDPPPuBbb2vjEDx/EO10YtWWNT/hAPGE5BFOLFoKYH7w4Z3Ym");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$RTzXqKa9vdx8dmFj0h8MlOjCzFVXSpdNeS7rj2JAtpJH9wAuyzr2O");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$L0Ct1fiikFiCGgJskNXH9.BYvJ1BE.4WuS9sIlz8AffcgEIQJ8SKm");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$DCbyNAJ580dZQQo.n4wWDutMq1xx.RjcqaVJ3kF7Txu22wTwgQTvi");
        }
    }
}
