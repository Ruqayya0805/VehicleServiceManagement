using VehicleServiceManagement.API.DTOs.ServiceCategory;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class ServiceCategoryService : IServiceCategoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ServiceCategoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<ServiceCategoryDto>> GetAllAsync()
        {
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return categories.Select(c => MapToDto(c, serviceRequests));
        }

        public async Task<IEnumerable<ServiceCategoryDto>> GetActiveAsync()
        {
            var categories = await _unitOfWork.ServiceCategories.FindAsync(c => c.IsActive);
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return categories.Select(c => MapToDto(c, serviceRequests));
        }

        public async Task<ServiceCategoryDto?> GetByIdAsync(int id)
        {
            var category = await _unitOfWork.ServiceCategories.GetByIdAsync(id);
            if (category == null) return null;

            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            return MapToDto(category, serviceRequests);
        }

        public async Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryDto dto)
        {
            if (await _unitOfWork.ServiceCategories.ExistsAsync(c => c.CategoryName == dto.CategoryName))
            {
                throw new ConflictException($"Service category '{dto.CategoryName}' already exists");
            }

            var category = new ServiceCategory
            {
                CategoryName = dto.CategoryName,
                Description = dto.Description,
                BasePrice = dto.BasePrice,
                EstimatedDurationMinutes = dto.EstimatedDurationMinutes,
                IsActive = dto.IsActive
            };

            await _unitOfWork.ServiceCategories.AddAsync(category);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(category, new List<ServiceRequest>());
        }

        public async Task<ServiceCategoryDto> UpdateAsync(int id, UpdateServiceCategoryDto dto)
        {
            var category = await _unitOfWork.ServiceCategories.GetByIdAsync(id);
            
            if (category == null)
            {
                throw new NotFoundException("ServiceCategory", id);
            }
            if (dto.CategoryName != null && dto.CategoryName != category.CategoryName)
            {
                if (await _unitOfWork.ServiceCategories.ExistsAsync(c => c.CategoryName == dto.CategoryName))
                {
                    throw new ConflictException($"Service category '{dto.CategoryName}' already exists");
                }
                category.CategoryName = dto.CategoryName;
            }

            if (dto.Description != null) category.Description = dto.Description;
            if (dto.BasePrice.HasValue) category.BasePrice = dto.BasePrice.Value;
            if (dto.EstimatedDurationMinutes.HasValue) category.EstimatedDurationMinutes = dto.EstimatedDurationMinutes.Value;
            if (dto.IsActive.HasValue) category.IsActive = dto.IsActive.Value;

            await _unitOfWork.ServiceCategories.UpdateAsync(category);
            await _unitOfWork.SaveChangesAsync();

            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            return MapToDto(category, serviceRequests);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _unitOfWork.ServiceCategories.GetByIdAsync(id);
            
            if (category == null)
            {
                throw new NotFoundException("ServiceCategory", id);
            }
            var hasRequests = await _unitOfWork.ServiceRequests.ExistsAsync(sr => sr.CategoryId == id);
            if (hasRequests)
            {
                throw new BadRequestException("Cannot delete category with existing service requests. Consider deactivating instead.");
            }

            await _unitOfWork.ServiceCategories.DeleteAsync(category);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ToggleActiveAsync(int id)
        {
            var category = await _unitOfWork.ServiceCategories.GetByIdAsync(id);
            
            if (category == null)
            {
                throw new NotFoundException("ServiceCategory", id);
            }

            category.IsActive = !category.IsActive;
            await _unitOfWork.ServiceCategories.UpdateAsync(category);
            await _unitOfWork.SaveChangesAsync();

            return category.IsActive;
        }

        private static ServiceCategoryDto MapToDto(ServiceCategory category, IEnumerable<ServiceRequest> serviceRequests)
        {
            return new ServiceCategoryDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName,
                Description = category.Description,
                BasePrice = category.BasePrice,
                EstimatedDurationMinutes = category.EstimatedDurationMinutes,
                IsActive = category.IsActive,
                TotalServiceRequests = serviceRequests.Count(sr => sr.CategoryId == category.CategoryId)
            };
        }
    }
}
