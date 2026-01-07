using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleServiceManagement.API.Models
{
    public class ServiceRequestCategory
    {
        public int ServiceRequestId { get; set; }
        public ServiceRequest ServiceRequest { get; set; } = null!;

        public int CategoryId { get; set; }
        public ServiceCategory ServiceCategory { get; set; } = null!;

        /// <summary>
        /// Adjusted price set by service manager. If null, uses the category's base price.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? AdjustedPrice { get; set; }
    }
}
