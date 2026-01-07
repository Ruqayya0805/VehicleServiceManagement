using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPendingApprovalToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPendingApproval",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "IsPendingApproval", "PasswordHash" },
                values: new object[] { false, "$2a$11$6sC8X.wN24nE1pCh9bUef.aFTAHkGUTHv5v3346SYxKQiQRUCIVeW" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                columns: new[] { "IsPendingApproval", "PasswordHash" },
                values: new object[] { false, "$2a$11$DkXRlwElGyWbLNwv5jyNi.vaQrWWiPm0vdcpEkI1AIzV6NjyqrCU." });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                columns: new[] { "IsPendingApproval", "PasswordHash" },
                values: new object[] { false, "$2a$11$G6g/WhXkpDB3t4wMmIc5EOnk2oj8OLyO1my1rCcuAfo1m4Ksivqi2" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                columns: new[] { "IsPendingApproval", "PasswordHash" },
                values: new object[] { false, "$2a$11$Ds4Xx0f92mwtCyY8505XHOKNit5bUJjEQ2aGPYIYJR8uNhY6Kw.U." });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                columns: new[] { "IsPendingApproval", "PasswordHash" },
                values: new object[] { false, "$2a$11$meidNkCRDGz/SqYYGTFYfOQi3cKdmEymY2WUHfF6edULpoFTduJ0a" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPendingApproval",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$sphgoGKq4DMnOIvVY5ZfROW8X.kviZGJvxJznqS9SFyHI7lmRvRtK");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$oz1wjzrlUYdkn/iC.QIezOyBh5bE0AwWNOYB9sp13bXfGUol848Ny");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$5wiMhvt6VxIjgFtr376joe/2O8FWVzngR.IcE7WRYwOkyPavSeTae");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$U6S.vHgyWJKTW3g68Q9Tdu1BKnMJUUXlt35tmsxfVdygTyZKKhHIu");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$t5HuXz/VO11AZl/X2d2H3eJy2lFRCq/zDHDHUL6bv7PMhh4FZWjk2");
        }
    }
}
