using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class QuadrupleServicePrices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 1,
                column: "BasePrice",
                value: 200.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 2,
                column: "BasePrice",
                value: 600.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 3,
                column: "BasePrice",
                value: 160.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 4,
                column: "BasePrice",
                value: 400.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 5,
                column: "BasePrice",
                value: 480.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 6,
                column: "BasePrice",
                value: 720.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 7,
                column: "BasePrice",
                value: 320.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 8,
                column: "BasePrice",
                value: 360.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 9,
                column: "BasePrice",
                value: 240.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 10,
                column: "BasePrice",
                value: 280.00m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$LmVGBawZwq0QHwL1tNHjVeVjZzzaSCiUizF7SJ8Y8vTRKPrStA57K");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$8LV94m4R8If4EHXrp8dj2ebuDVJStybua9Nu77fWgxYkXcB9H.1/y");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$uty89ektHyzhFBMFQiRp/ed4nMMKHShQS7qaLQ8hkbfX3nUR6v3QG");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$WtP4uTy8yUk/52jOrX..te1.gL.Us054kFSK9AwBOb2RwJZGZWdz.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$A5zGegSgcEMLXc0gb9N9C.jdsCyKwPcLQ2zNU89iYeQ/Oqxp3MDbG");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 1,
                column: "BasePrice",
                value: 50.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 2,
                column: "BasePrice",
                value: 150.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 3,
                column: "BasePrice",
                value: 40.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 4,
                column: "BasePrice",
                value: 100.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 5,
                column: "BasePrice",
                value: 120.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 6,
                column: "BasePrice",
                value: 180.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 7,
                column: "BasePrice",
                value: 80.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 8,
                column: "BasePrice",
                value: 90.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 9,
                column: "BasePrice",
                value: 60.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 10,
                column: "BasePrice",
                value: 70.00m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$DXiUcJ23sYmcgObsD./pU.dOFs3wWg34dnrJnGDkmDFpim0/FyHoq");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$UzHAZ69s4WG9itcYh22ldeResPOQBlWLHf2RZCNy7cWHKtLcuO.tO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$tBuWGcE2V.tcfwGnZg9kE.rb1jHP5Z5ekW5I6w.974.BMBHT0yYg6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$SYPgJXCLUOUNAQHXbKJ9g.MCYJiXfj2jLBRSe82SV3TdYs1XQEJ32");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$gmptFk8COOW2inonn2aVBuScPkKuM7BIJWXf/sNNP5zC3MLp2Sa2S");
        }
    }
}
