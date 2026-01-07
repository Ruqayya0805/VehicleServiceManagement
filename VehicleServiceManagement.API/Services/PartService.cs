using VehicleServiceManagement.API.DTOs.Part;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class PartService : IPartService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly NotificationTriggerService _notificationTrigger;

        public PartService(IUnitOfWork unitOfWork, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _notificationTrigger = notificationTrigger;
        }

        public async Task<IEnumerable<PartDto>> GetAllAsync()
        {
            var parts = await _unitOfWork.Parts.GetAllAsync();
            return parts.Select(MapToDto);
        }

        public async Task<PartDto?> GetByIdAsync(int id)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(id);
            return part == null ? null : MapToDto(part);
        }

        public async Task<PartDto?> GetByPartNumberAsync(string partNumber)
        {
            var parts = await _unitOfWork.Parts.FindAsync(p => p.PartNumber == partNumber);
            var part = parts.FirstOrDefault();
            return part == null ? null : MapToDto(part);
        }

        public async Task<IEnumerable<LowStockPartDto>> GetLowStockAsync()
        {
            var parts = await _unitOfWork.Parts.GetAllAsync();
            return parts
                .Where(p => p.QuantityInStock <= p.ReorderLevel)
                .OrderBy(p => p.QuantityInStock)
                .Select(p => new LowStockPartDto
                {
                    PartId = p.PartId,
                    PartName = p.PartName,
                    PartNumber = p.PartNumber,
                    QuantityInStock = p.QuantityInStock,
                    ReorderLevel = p.ReorderLevel,
                    QuantityToReorder = Math.Max(0, (p.ReorderLevel * 2) - p.QuantityInStock),
                    Supplier = p.Supplier
                });
        }

        public async Task<PartDto> CreateAsync(CreatePartDto dto)
        {
            if (await _unitOfWork.Parts.ExistsAsync(p => p.PartNumber == dto.PartNumber))
            {
                throw new ConflictException($"Part with number '{dto.PartNumber}' already exists");
            }
            if (await _unitOfWork.Parts.ExistsAsync(p => p.PartName == dto.PartName))
            {
                throw new ConflictException($"Part with name '{dto.PartName}' already exists");
            }

            var part = new Part
            {
                PartName = dto.PartName,
                PartNumber = dto.PartNumber,
                Description = dto.Description,
                UnitPrice = dto.UnitPrice,
                QuantityInStock = dto.QuantityInStock,
                ReorderLevel = dto.ReorderLevel,
                Supplier = dto.Supplier
            };

            await _unitOfWork.Parts.AddAsync(part);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(part);
        }

        public async Task<PartDto> UpdateAsync(int id, UpdatePartDto dto)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(id);
            
            if (part == null)
            {
                throw new NotFoundException("Part", id);
            }

            if (dto.PartName != null && dto.PartName != part.PartName)
            {
                if (await _unitOfWork.Parts.ExistsAsync(p => p.PartName == dto.PartName))
                {
                    throw new ConflictException($"Part with name '{dto.PartName}' already exists");
                }
                part.PartName = dto.PartName;
            }

            if (dto.PartNumber != null && dto.PartNumber != part.PartNumber)
            {
                if (await _unitOfWork.Parts.ExistsAsync(p => p.PartNumber == dto.PartNumber))
                {
                    throw new ConflictException($"Part with number '{dto.PartNumber}' already exists");
                }
                part.PartNumber = dto.PartNumber;
            }

            if (dto.Description != null) part.Description = dto.Description;
            if (dto.UnitPrice.HasValue) part.UnitPrice = dto.UnitPrice.Value;
            if (dto.QuantityInStock.HasValue) part.QuantityInStock = dto.QuantityInStock.Value;
            if (dto.ReorderLevel.HasValue) part.ReorderLevel = dto.ReorderLevel.Value;
            if (dto.Supplier != null) part.Supplier = dto.Supplier;

            await _unitOfWork.Parts.UpdateAsync(part);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(part);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(id);
            
            if (part == null)
            {
                throw new NotFoundException("Part", id);
            }
            var isUsed = await _unitOfWork.ServiceParts.ExistsAsync(sp => sp.PartId == id);
            if (isUsed)
            {
                throw new BadRequestException("Cannot delete part that has been used in service requests");
            }

            await _unitOfWork.Parts.DeleteAsync(part);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<PartDto> RestockAsync(int id, RestockPartDto dto)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(id);
            
            if (part == null)
            {
                throw new NotFoundException("Part", id);
            }

            part.QuantityInStock += dto.Quantity;

            await _unitOfWork.Parts.UpdateAsync(part);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(part);
        }

        public async Task<bool> DeductStockAsync(int partId, int quantity)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(partId);
            
            if (part == null)
            {
                throw new NotFoundException("Part", partId);
            }

            if (part.QuantityInStock < quantity)
            {
                throw new BadRequestException($"Insufficient stock. Available: {part.QuantityInStock}, Requested: {quantity}");
            }

            part.QuantityInStock -= quantity;

            await _unitOfWork.Parts.UpdateAsync(part);
            await _unitOfWork.SaveChangesAsync();
            try
            {
                if (part.QuantityInStock <= part.ReorderLevel)
                {
                    await _notificationTrigger.NotifyLowStockAsync(part);
                }
            }
            catch {  }

            return true;
        }

        public async Task<bool> CheckAvailabilityAsync(int partId, int quantity)
        {
            var part = await _unitOfWork.Parts.GetByIdAsync(partId);
            
            if (part == null)
            {
                throw new NotFoundException("Part", partId);
            }

            return part.QuantityInStock >= quantity;
        }

        private static PartDto MapToDto(Part part)
        {
            return new PartDto
            {
                PartId = part.PartId,
                PartName = part.PartName,
                PartNumber = part.PartNumber,
                Description = part.Description,
                UnitPrice = part.UnitPrice,
                QuantityInStock = part.QuantityInStock,
                ReorderLevel = part.ReorderLevel,
                Supplier = part.Supplier
            };
        }
    }
}
