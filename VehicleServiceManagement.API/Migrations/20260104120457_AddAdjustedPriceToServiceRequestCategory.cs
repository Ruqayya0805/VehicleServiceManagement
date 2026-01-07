using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAdjustedPriceToServiceRequestCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AdjustedPrice",
                table: "ServiceRequestCategories",
                type: "decimal(18,2)",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdjustedPrice",
                table: "ServiceRequestCategories");

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
        }
    }
}
