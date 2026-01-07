using VehicleServiceManagement.API.DTOs.PartOrder;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IPartOrderService
    {
        Task<IEnumerable<PartOrderDto>> GetAllAsync();
        Task<PartOrderDto?> GetByIdAsync(int id);
        Task<IEnumerable<PartOrderSummaryDto>> GetPendingOrdersAsync();
        Task<IEnumerable<PartOrderSummaryDto>> GetOrdersByPartIdAsync(int partId);
        Task<PartOrderDto> CreateAsync(CreatePartOrderDto dto, int userId);
        Task<PartOrderDto> UpdateAsync(int id, UpdatePartOrderDto dto);
        Task<PartOrderDto> MarkAsDeliveredAsync(int id);
        Task<bool> CancelAsync(int id);
    }
}
