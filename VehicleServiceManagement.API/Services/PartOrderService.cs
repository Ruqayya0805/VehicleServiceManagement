using VehicleServiceManagement.API.DTOs.PartOrder;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class PartOrderService : IPartOrderService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PartOrderService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<PartOrderDto>> GetAllAsync()
        {
            var orders = await _unitOfWork.PartOrders.GetAllAsync();
            return await MapToDtos(orders.OrderByDescending(o => o.OrderDate));
        }

        public async Task<PartOrderDto?> GetByIdAsync(int id)
        {
            var order = await _unitOfWork.PartOrders.GetByIdAsync(id);
            if (order == null) return null;
            return (await MapToDtos(new[] { order })).FirstOrDefault();
        }

        public async Task<IEnumerable<PartOrderSummaryDto>> GetPendingOrdersAsync()
        {
            var orders = await _unitOfWork.PartOrders.FindAsync(o => 
                o.Status == "Pending" || o.Status == "Ordered" || o.Status == "Shipped");
            return await MapToSummaryDtos(orders.OrderByDescending(o => o.OrderDate));
        }

        public async Task<IEnumerable<PartOrderSummaryDto>> GetOrdersByPartIdAsync(int partId)
        {
            var orders = await _unitOfWork.PartOrders.FindAsync(o => o.PartId == partId);
            return await MapToSummaryDtos(orders.OrderByDescending(o => o.OrderDate));
        }

        public async Task<PartOrderDto> CreateAsync(CreatePartOrderDto dto, int userId)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(dto.PartId);
            if (part == null)
            {
                throw new NotFoundException("Part", dto.PartId);
            }

            var order = new PartOrder
            {
                OrderNumber = GenerateOrderNumber(),
                PartId = dto.PartId,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice ?? part.UnitPrice,
                TotalAmount = (dto.UnitPrice ?? part.UnitPrice) * dto.Quantity,
                Supplier = part.Supplier,
                Status = "Pending",
                OrderDate = DateTime.UtcNow,
                ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
                OrderedByUserId = userId,
                Notes = dto.Notes
            };

            await _unitOfWork.PartOrders.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { order })).First();
        }

        public async Task<PartOrderDto> UpdateAsync(int id, UpdatePartOrderDto dto)
        {
            var order = await _unitOfWork.PartOrders.GetByIdAsync(id);
            if (order == null)
            {
                throw new NotFoundException("PartOrder", id);
            }

            if (!string.IsNullOrEmpty(dto.Status))
            {
                order.Status = dto.Status;
            }

            if (dto.ExpectedDeliveryDate.HasValue)
            {
                order.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
            }

            if (dto.DeliveredDate.HasValue)
            {
                order.DeliveredDate = dto.DeliveredDate;
            }

            if (dto.Notes != null)
            {
                order.Notes = dto.Notes;
            }

            await _unitOfWork.PartOrders.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { order })).First();
        }

        public async Task<PartOrderDto> MarkAsDeliveredAsync(int id)
        {
            var order = await _unitOfWork.PartOrders.GetByIdAsync(id);
            if (order == null)
            {
                throw new NotFoundException("PartOrder", id);
            }

            order.Status = "Delivered";
            order.DeliveredDate = DateTime.UtcNow;
            var part = await _unitOfWork.Parts.GetByIdAsync(order.PartId);
            if (part != null)
            {
                part.QuantityInStock += order.Quantity;
                await _unitOfWork.Parts.UpdateAsync(part);
            }

            await _unitOfWork.PartOrders.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { order })).First();
        }

        public async Task<bool> CancelAsync(int id)
        {
            var order = await _unitOfWork.PartOrders.GetByIdAsync(id);
            if (order == null)
            {
                throw new NotFoundException("PartOrder", id);
            }

            if (order.Status == "Delivered")
            {
                throw new BadRequestException("Cannot cancel a delivered order");
            }

            order.Status = "Cancelled";
            await _unitOfWork.PartOrders.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        private string GenerateOrderNumber()
        {
            return $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        private async Task<IEnumerable<PartOrderDto>> MapToDtos(IEnumerable<PartOrder> orders)
        {
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();

            return orders.Select(o =>
            {
                var part = parts.FirstOrDefault(p => p.PartId == o.PartId);
                var orderedBy = users.FirstOrDefault(u => u.UserId == o.OrderedByUserId);

                return new PartOrderDto
                {
                    PartOrderId = o.PartOrderId,
                    OrderNumber = o.OrderNumber,
                    PartId = o.PartId,
                    PartName = part?.PartName ?? "Unknown",
                    PartNumber = part?.PartNumber ?? "",
                    Quantity = o.Quantity,
                    UnitPrice = o.UnitPrice,
                    TotalAmount = o.TotalAmount,
                    Supplier = o.Supplier,
                    Status = o.Status,
                    OrderDate = o.OrderDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate,
                    DeliveredDate = o.DeliveredDate,
                    OrderedByUserId = o.OrderedByUserId,
                    OrderedByName = orderedBy != null ? $"{orderedBy.FirstName} {orderedBy.LastName}" : "Unknown",
                    Notes = o.Notes,
                    CurrentStock = part?.QuantityInStock ?? 0,
                    ReorderLevel = part?.ReorderLevel ?? 0
                };
            });
        }

        private async Task<IEnumerable<PartOrderSummaryDto>> MapToSummaryDtos(IEnumerable<PartOrder> orders)
        {
            var parts = await _unitOfWork.Parts.GetAllAsync();

            return orders.Select(o =>
            {
                var part = parts.FirstOrDefault(p => p.PartId == o.PartId);

                return new PartOrderSummaryDto
                {
                    PartOrderId = o.PartOrderId,
                    OrderNumber = o.OrderNumber,
                    PartName = part?.PartName ?? "Unknown",
                    Quantity = o.Quantity,
                    TotalAmount = o.TotalAmount,
                    Supplier = o.Supplier,
                    Status = o.Status,
                    OrderDate = o.OrderDate,
                    ExpectedDeliveryDate = o.ExpectedDeliveryDate
                };
            });
        }
    }
}
