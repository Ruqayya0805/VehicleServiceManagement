using VehicleServiceManagement.API.DTOs.ServicePart;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class ServicePartService : IServicePartService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPartService _partService;

        public ServicePartService(IUnitOfWork unitOfWork, IPartService partService)
        {
            _unitOfWork = unitOfWork;
            _partService = partService;
        }

        public async Task<IEnumerable<ServicePartDto>> GetAllAsync()
        {
            var serviceParts = await _unitOfWork.ServiceParts.GetAllAsync();
            return await MapToDtos(serviceParts);
        }

        public async Task<ServicePartDto?> GetByIdAsync(int id)
        {
            var servicePart = await _unitOfWork.ServiceParts.GetByIdAsync(id);
            if (servicePart == null) return null;

            return (await MapToDtos(new[] { servicePart })).FirstOrDefault();
        }

        public async Task<IEnumerable<ServicePartDto>> GetByServiceRequestIdAsync(int serviceRequestId)
        {
            var serviceParts = await _unitOfWork.ServiceParts.FindAsync(sp => sp.ServiceRequestId == serviceRequestId);
            return await MapToDtos(serviceParts);
        }

        public async Task<ServicePartDto> AddPartToServiceAsync(CreateServicePartDto dto)
        {
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(dto.ServiceRequestId);
            if (serviceRequest == null)
            {
                throw new NotFoundException("ServiceRequest", dto.ServiceRequestId);
            }
            var part = await _unitOfWork.Parts.GetByIdAsync(dto.PartId);
            if (part == null)
            {
                throw new NotFoundException("Part", dto.PartId);
            }
            if (!await _partService.CheckAvailabilityAsync(dto.PartId, dto.QuantityUsed))
            {
                throw new BadRequestException($"Insufficient stock for part '{part.PartName}'. Available: {part.QuantityInStock}");
            }
            var existingServicePart = (await _unitOfWork.ServiceParts.FindAsync(sp => 
                sp.ServiceRequestId == dto.ServiceRequestId && sp.PartId == dto.PartId)).FirstOrDefault();

            if (existingServicePart != null)
            {
                var additionalQuantity = dto.QuantityUsed;
                existingServicePart.QuantityUsed += additionalQuantity;
                existingServicePart.TotalPrice = existingServicePart.QuantityUsed * existingServicePart.UnitPrice;

                await _unitOfWork.ServiceParts.UpdateAsync(existingServicePart);
                await _partService.DeductStockAsync(dto.PartId, additionalQuantity);
                
                await _unitOfWork.SaveChangesAsync();

                return (await MapToDtos(new[] { existingServicePart })).First();
            }

            var servicePart = new ServicePart
            {
                ServiceRequestId = dto.ServiceRequestId,
                PartId = dto.PartId,
                QuantityUsed = dto.QuantityUsed,
                UnitPrice = part.UnitPrice,
                TotalPrice = part.UnitPrice * dto.QuantityUsed
            };

            await _unitOfWork.ServiceParts.AddAsync(servicePart);
            await _partService.DeductStockAsync(dto.PartId, dto.QuantityUsed);
            
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { servicePart })).First();
        }

        public async Task<ServicePartDto> UpdateAsync(int id, UpdateServicePartDto dto)
        {
            var servicePart = await _unitOfWork.ServiceParts.GetByIdAsync(id);
            
            if (servicePart == null)
            {
                throw new NotFoundException("ServicePart", id);
            }

            if (dto.QuantityUsed.HasValue)
            {
                var part = await _unitOfWork.Parts.GetByIdAsync(servicePart.PartId);
                if (part == null)
                {
                    throw new NotFoundException("Part", servicePart.PartId);
                }

                var quantityDifference = dto.QuantityUsed.Value - servicePart.QuantityUsed;
                
                if (quantityDifference > 0)
                {
                    if (!await _partService.CheckAvailabilityAsync(servicePart.PartId, quantityDifference))
                    {
                        throw new BadRequestException($"Insufficient stock. Available: {part.QuantityInStock}");
                    }
                    await _partService.DeductStockAsync(servicePart.PartId, quantityDifference);
                }
                else if (quantityDifference < 0)
                {
                    part.QuantityInStock += Math.Abs(quantityDifference);
                    await _unitOfWork.Parts.UpdateAsync(part);
                }

                servicePart.QuantityUsed = dto.QuantityUsed.Value;
                servicePart.TotalPrice = servicePart.UnitPrice * servicePart.QuantityUsed;
            }

            await _unitOfWork.ServiceParts.UpdateAsync(servicePart);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { servicePart })).First();
        }

        public async Task<bool> RemoveAsync(int id)
        {
            var servicePart = await _unitOfWork.ServiceParts.GetByIdAsync(id);
            
            if (servicePart == null)
            {
                throw new NotFoundException("ServicePart", id);
            }
            var part = await _unitOfWork.Parts.GetByIdAsync(servicePart.PartId);
            if (part != null)
            {
                part.QuantityInStock += servicePart.QuantityUsed;
                await _unitOfWork.Parts.UpdateAsync(part);
            }

            await _unitOfWork.ServiceParts.DeleteAsync(servicePart);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<decimal> GetTotalPartsChargeAsync(int serviceRequestId)
        {
            var serviceParts = await _unitOfWork.ServiceParts.FindAsync(sp => sp.ServiceRequestId == serviceRequestId);
            return serviceParts.Sum(sp => sp.TotalPrice);
        }

        private async Task<IEnumerable<ServicePartDto>> MapToDtos(IEnumerable<ServicePart> serviceParts)
        {
            var parts = await _unitOfWork.Parts.GetAllAsync();

            return serviceParts.Select(sp =>
            {
                var part = parts.FirstOrDefault(p => p.PartId == sp.PartId);

                return new ServicePartDto
                {
                    ServicePartId = sp.ServicePartId,
                    ServiceRequestId = sp.ServiceRequestId,
                    PartId = sp.PartId,
                    PartName = part?.PartName ?? "Unknown",
                    PartNumber = part?.PartNumber ?? "Unknown",
                    QuantityUsed = sp.QuantityUsed,
                    UnitPrice = sp.UnitPrice,
                    TotalPrice = sp.TotalPrice
                };
            });
        }
    }
}
