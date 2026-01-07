using VehicleServiceManagement.API.DTOs.Payment;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<IEnumerable<PaymentDto>> GetAllAsync();
        Task<PaymentDto?> GetByIdAsync(int id);
        Task<IEnumerable<PaymentDto>> GetByBillIdAsync(int billId);
        Task<PaymentDto> ProcessPaymentAsync(int billId, ProcessPaymentDto dto);
        Task<PaymentDto> UpdateAsync(int id, UpdatePaymentDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> RefundAsync(int id);
    }
}
