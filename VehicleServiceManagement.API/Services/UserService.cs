using VehicleServiceManagement.API.DTOs.User;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;
using VehicleServiceManagement.API.Enums;

namespace VehicleServiceManagement.API.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IInAppNotificationService _notificationService;

        public UserService(IUnitOfWork unitOfWork, IInAppNotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            return users.Select(MapToDto);
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            if (await _unitOfWork.Users.ExistsAsync(u => u.Email == dto.Email))
            {
                throw new ConflictException($"User with email '{dto.Email}' already exists");
            }

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Role = dto.Role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            if (dto.FirstName != null) user.FirstName = dto.FirstName;
            if (dto.LastName != null) user.LastName = dto.LastName;
            if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;
            if (dto.Role != null && dto.Role != user.Role)
            {
                try
                {
                    await _notificationService.DeleteAllForUserAsync(user.UserId);
                }
                catch {  }
                user.Role = dto.Role;
            }
            
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;

            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            await _unitOfWork.Users.DeleteAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeactivateAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            user.IsActive = false;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ActivateAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            user.IsActive = true;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<UserDto>> GetByRoleAsync(string role)
        {
            var users = await _unitOfWork.Users.FindAsync(u => u.Role == role);
            return users.Select(MapToDto);
        }

        public async Task<IEnumerable<TechnicianDto>> GetTechniciansAsync()
        {
            var technicians = await _unitOfWork.Users.FindAsync(u => u.Role == UserRole.Technician && u.IsActive);
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            
            return technicians.Select(t => new TechnicianDto
            {
                UserId = t.UserId,
                FullName = $"{t.FirstName} {t.LastName}",
                Email = t.Email,
                PhoneNumber = t.PhoneNumber,
                ActiveAssignments = assignments.Count(a => a.TechnicianId == t.UserId && 
                    (a.Status == "Assigned" || a.Status == "InProgress")),
                CompletedAssignments = assignments.Count(a => a.TechnicianId == t.UserId && 
                    a.Status == "Completed")
            });
        }

        public async Task<IEnumerable<UserDto>> GetCustomersAsync()
        {
            var customers = await _unitOfWork.Users.FindAsync(u => u.Role == UserRole.Customer);
            return customers.Select(MapToDto);
        }

        public async Task<IEnumerable<UserDto>> GetPendingApprovalsAsync()
        {
            var pendingUsers = await _unitOfWork.Users.FindAsync(u => u.IsPendingApproval);
            return pendingUsers.Select(MapToDto);
        }

        public async Task<UserDto> ApproveStaffAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            if (!user.IsPendingApproval)
            {
                throw new BadRequestException("This user is not pending approval");
            }

            user.IsPendingApproval = false;
            user.IsActive = true;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Staff Account Approved",
                    Body = $@"
                        <h2>Account Approved</h2>
                        <p>Dear {user.FirstName},</p>
                        <p>Your account has been approved by an administrator.</p>
                        <p>You can now log in to the Vehicle Service Management system.</p>
                    ",
                    NotificationType = NotificationType.StaffApproval,
                    TriggeredByUserId = null
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch {  }

            return MapToDto(user);
        }

        public async Task<bool> RejectStaffAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            
            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            if (!user.IsPendingApproval)
            {
                throw new BadRequestException("This user is not pending approval");
            }

            await _unitOfWork.Users.DeleteAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        private static UserDto MapToDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
                IsPendingApproval = user.IsPendingApproval
            };
        }
    }
}
