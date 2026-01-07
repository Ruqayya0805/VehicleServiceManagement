using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFuelTypeToVehicle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FuelType",
                table: "Vehicles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FuelType",
                table: "Vehicles");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$dAHCgJxG4jLnUV4FLS3AgeqCsG27zfqCTX7c78QIdA/65iTkyxnlS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 2,
                column: "PasswordHash",
                value: "$2a$11$xZMMJyPL6RE1wDHNWpFJge5FMM91ny1Fpmq.pmOaaEeqh/4FMLpbW");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 3,
                column: "PasswordHash",
                value: "$2a$11$/y4oH4xkiHYnBKoV86O.0.quZw6D84qtBnQ8m2z/CX0/f3j4VFat2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 4,
                column: "PasswordHash",
                value: "$2a$11$VZocb9Fj3Aga7955CpBar.TdOrINf93Xa9ijf0hEGmMgyMNKvPfDO");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5,
                column: "PasswordHash",
                value: "$2a$11$v5IP5hUyokS6/JtLpzKSPeldmzUC8R70sesa1m1upwsBxPoQhMNJC");
        }
    }
}
