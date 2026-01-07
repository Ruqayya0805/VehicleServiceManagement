using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInAppNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InAppNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    TargetUserId = table.Column<int>(type: "int", nullable: true),
                    TargetRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    RelatedEntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ActionUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InAppNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InAppNotifications_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InAppNotifications_Users_TargetUserId",
                        column: x => x.TargetUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$E4CmSIcEmYRa4fzfKdo0MuFmlZFM1Ax3dgg1vswkNDYZ9/YvvlWx6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$yM1EjxQ9IY21S.CpluYXFux7Ly.Scs9xhZJzzL3lwC32ElyJHnqsW");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$uhPdIrAh0n/yhaTxqiAo/OaFagKdtVdgIfSXPbwHSxunIUX/QX7C.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$p/VeDz.8wBi48bbsAQD7gudbFfAnN/KnlVWtOx3N8XiHG6k9O7f0O");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$4.dZZEl8en8lruGKH5cyF.HEhj4Aqk2FGFjrVKjCfs1ZnGDHbAhyW");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_CreatedAt",
                table: "InAppNotifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_CreatedByUserId",
                table: "InAppNotifications",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_IsRead",
                table: "InAppNotifications",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_TargetRole",
                table: "InAppNotifications",
                column: "TargetRole");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_TargetUserId",
                table: "InAppNotifications",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InAppNotifications");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$.VjNLF6vrZijHNM6GDvSsOAzHFisMoAXZzm8sm9GQM5.26nFZ.Z.C");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$0Szscd3xjoNu8.LNpOzNOuTM7rEEw9gUnvbOrXn7O/31xzh2PjOue");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$o57zIZH6Oji7iPhVUhzsceu40dHbFae21UkGiUWdIFmlLhZ/XTzty");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$XYcZ9cDKv6kpXes2I.6ORuWKy0jho7Ss8wogYWLVrguVUNaSK2Yn6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$OmcL9Cg.exWjqSGlkZGDfOheRIApQp1.tHoAXvqkD9qIkHgWD/Wxm");
        }
    }
}
