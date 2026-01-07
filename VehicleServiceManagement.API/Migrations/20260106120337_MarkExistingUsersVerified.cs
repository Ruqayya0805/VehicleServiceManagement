using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleServiceManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class MarkExistingUsersVerified : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Set all existing users as verified
            migrationBuilder.Sql("UPDATE Users SET IsEmailVerified = 1 WHERE IsEmailVerified = 0 OR IsEmailVerified IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No easy way to revert this without losing data, so we do nothing
        }
    }
}
