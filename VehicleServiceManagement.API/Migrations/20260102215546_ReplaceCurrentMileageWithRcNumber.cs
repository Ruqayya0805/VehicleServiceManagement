using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceCurrentMileageWithRcNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RcNumber",
                table: "Vehicles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RcNumber",
                table: "Vehicles");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$N8Nxpa0OwlDQOH1o5fG4AeIk5bj2BnKLevQXt4rvE.ZNsISwUV4m.");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$QvwLnXipT4YVfmzz.Q5Gde0R4T6SgGpfkT5LirH/lqdkWn4zbw8F6");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$mnTwMhrbVbEpwZpxGgPYGOmRtR1OGwXXCyzrcimE6X6AziykpHyAu");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$Apcr/s8uYl02tv2BxjDGf.UtlOKIS.riZsdJvLX0/wun/K2drVhiW");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$jh4lz5QMA2Dg21QHfp5oTeHYPA4qvZq9eMqrO3lHl2Jy6VTrrhJNS");
        }
    }
}
