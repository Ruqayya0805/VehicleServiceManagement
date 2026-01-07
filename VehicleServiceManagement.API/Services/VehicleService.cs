using VehicleServiceManagement.API.DTOs.Vehicle;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class VehicleService : IVehicleService
    {
        private readonly IUnitOfWork _unitOfWork;

        public VehicleService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<VehicleDto>> GetAllAsync()
        {
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return vehicles.Select(v => MapToDto(v, users, serviceRequests));
        }

        public async Task<VehicleDto?> GetByIdAsync(int id)
        {
            var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(id);
            if (vehicle == null) return null;

            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return MapToDto(vehicle, users, serviceRequests);
        }

        public async Task<IEnumerable<VehicleDto>> GetByCustomerIdAsync(int customerId)
        {
            var vehicles = await _unitOfWork.Vehicles.FindAsync(v => v.CustomerId == customerId);
            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return vehicles.Select(v => MapToDto(v, users, serviceRequests));
        }

        public async Task<VehicleDto> CreateAsync(int customerId, CreateVehicleDto dto)
        {
            var customer = await _unitOfWork.Users.GetByIdAsync(customerId);
            if (customer == null)
            {
                throw new NotFoundException("Customer", customerId);
            }
            if (await _unitOfWork.Vehicles.ExistsAsync(v => v.RegistrationNumber == dto.RegistrationNumber))
            {
                throw new ConflictException($"Vehicle with registration number '{dto.RegistrationNumber}' already exists");
            }

            var vehicle = new Vehicle
            {
                CustomerId = customerId,
                RegistrationNumber = dto.RegistrationNumber.ToUpper(),
                Make = dto.Make,
                Model = dto.Model,
                Year = dto.Year,
                VehicleType = dto.VehicleType,
                FuelType = dto.FuelType,
                Color = dto.Color,
                RcNumber = dto.RcNumber,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Vehicles.AddAsync(vehicle);
            await _unitOfWork.SaveChangesAsync();

            var users = await _unitOfWork.Users.GetAllAsync();
            return MapToDto(vehicle, users, new List<ServiceRequest>());
        }

        public async Task<VehicleDto> UpdateAsync(int id, UpdateVehicleDto dto)
        {
            var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(id);
            
            if (vehicle == null)
            {
                throw new NotFoundException("Vehicle", id);
            }

            if (dto.Make != null) vehicle.Make = dto.Make;
            if (dto.Model != null) vehicle.Model = dto.Model;
            if (dto.Year.HasValue) vehicle.Year = dto.Year.Value;
            if (dto.VehicleType != null) vehicle.VehicleType = dto.VehicleType;
            if (dto.FuelType != null) vehicle.FuelType = dto.FuelType;
            if (dto.Color != null) vehicle.Color = dto.Color;
            if (dto.RcNumber != null) vehicle.RcNumber = dto.RcNumber;

            await _unitOfWork.Vehicles.UpdateAsync(vehicle);
            await _unitOfWork.SaveChangesAsync();

            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return MapToDto(vehicle, users, serviceRequests);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(id);
            
            if (vehicle == null)
            {
                throw new NotFoundException("Vehicle", id);
            }
            var hasRequests = await _unitOfWork.ServiceRequests.ExistsAsync(sr => sr.VehicleId == id);
            if (hasRequests)
            {
                throw new BadRequestException("Cannot delete vehicle with existing service requests");
            }

            await _unitOfWork.Vehicles.DeleteAsync(vehicle);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<VehicleDto?> GetByRegistrationNumberAsync(string registrationNumber)
        {
            var vehicles = await _unitOfWork.Vehicles.FindAsync(v => 
                v.RegistrationNumber.ToUpper() == registrationNumber.ToUpper());
            var vehicle = vehicles.FirstOrDefault();
            
            if (vehicle == null) return null;

            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            
            return MapToDto(vehicle, users, serviceRequests);
        }

        private static VehicleDto MapToDto(Vehicle vehicle, IEnumerable<User> users, IEnumerable<ServiceRequest> serviceRequests)
        {
            var customer = users.FirstOrDefault(u => u.UserId == vehicle.CustomerId);
            
            return new VehicleDto
            {
                VehicleId = vehicle.VehicleId,
                CustomerId = vehicle.CustomerId,
                CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                RegistrationNumber = vehicle.RegistrationNumber,
                Make = vehicle.Make,
                Model = vehicle.Model,
                Year = vehicle.Year,
                VehicleType = vehicle.VehicleType,
                FuelType = vehicle.FuelType,
                Color = vehicle.Color,
                RcNumber = vehicle.RcNumber,
                CreatedAt = vehicle.CreatedAt,
                TotalServiceRequests = serviceRequests.Count(sr => sr.VehicleId == vehicle.VehicleId)
            };
        }
    }
}
