using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Auth
{
    public class UpdateProfileDto
    {
        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }

        [Phone]
        [MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }
}
