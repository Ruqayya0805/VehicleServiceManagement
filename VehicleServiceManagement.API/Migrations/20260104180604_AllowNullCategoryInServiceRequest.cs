using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AllowNullCategoryInServiceRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "ServiceRequests",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "ServiceRequests",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$6sC8X.wN24nE1pCh9bUef.aFTAHkGUTHv5v3346SYxKQiQRUCIVeW");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$DkXRlwElGyWbLNwv5jyNi.vaQrWWiPm0vdcpEkI1AIzV6NjyqrCU.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$G6g/WhXkpDB3t4wMmIc5EOnk2oj8OLyO1my1rCcuAfo1m4Ksivqi2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$Ds4Xx0f92mwtCyY8505XHOKNit5bUJjEQ2aGPYIYJR8uNhY6Kw.U.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$meidNkCRDGz/SqYYGTFYfOQi3cKdmEymY2WUHfF6edULpoFTduJ0a");
        }
    }
}
