using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Vehicle
{
    public class VehicleDto
    {
        public int VehicleId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string VehicleType { get; set; } = string.Empty;
        public string FuelType { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string RcNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int TotalServiceRequests { get; set; }
    }

    public class CreateVehicleDto
    {
        [Required]
        [MaxLength(20)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Make { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        [Range(1900, 2100)]
        public int Year { get; set; }

        [Required]
        [MaxLength(30)]
        public string VehicleType { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Color { get; set; } = string.Empty;

        [MaxLength(20)]
        public string FuelType { get; set; } = string.Empty;

        [MaxLength(50)]
        public string RcNumber { get; set; } = string.Empty;
    }

    public class UpdateVehicleDto
    {
        [MaxLength(50)]
        public string? Make { get; set; }

        [MaxLength(50)]
        public string? Model { get; set; }

        [Range(1900, 2100)]
        public int? Year { get; set; }

        [MaxLength(30)]
        public string? VehicleType { get; set; }

        [MaxLength(30)]
        public string? Color { get; set; }

        [MaxLength(20)]
        public string? FuelType { get; set; }

        [MaxLength(50)]
        public string? RcNumber { get; set; }
    }
}