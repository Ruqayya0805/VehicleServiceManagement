using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class DoubleServicePrices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 1,
                column: "BasePrice",
                value: 400.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 2,
                column: "BasePrice",
                value: 1200.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 3,
                column: "BasePrice",
                value: 320.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 4,
                column: "BasePrice",
                value: 800.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 5,
                column: "BasePrice",
                value: 960.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 6,
                column: "BasePrice",
                value: 1440.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 7,
                column: "BasePrice",
                value: 640.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 8,
                column: "BasePrice",
                value: 720.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 9,
                column: "BasePrice",
                value: 480.00m);

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "CategoryId",
                keyValue: 10,
                column: "BasePrice",
                value: 560.00m);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
    }
}
