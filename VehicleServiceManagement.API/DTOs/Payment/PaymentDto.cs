using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Payment
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int BillId { get; set; }
        public string BillNumber { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
    }

    public class CreatePaymentDto
    {
        [Required]
        public int BillId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? TransactionId { get; set; }
    }

    public class UpdatePaymentDto
    {
        [Range(0.01, double.MaxValue)]
        public decimal? AmountPaid { get; set; }

        public string? PaymentMethod { get; set; }

        public string? TransactionId { get; set; }

        public string? PaymentStatus { get; set; }
    }

    public class ProcessPaymentDto
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? TransactionId { get; set; }

        public string? Notes { get; set; }
    }
}
