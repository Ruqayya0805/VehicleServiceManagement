using VehicleServiceManagement.API.DTOs.Auth;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<StaffRegistrationResponseDto> RegisterStaffAsync(RegisterStaffDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<OtpVerificationResponseDto> VerifyOtpAsync(VerifyOtpDto dto);
        Task<AuthOperationResponseDto> ResendOtpAsync(ResendOtpDto dto);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<AuthOperationResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<AuthOperationResponseDto> ResetPasswordWithTokenAsync(ResetPasswordWithTokenDto dto);
        Task<bool> ResetPasswordAsync(string email, string newPassword);
        Task<bool> ValidateTokenAsync(string token);
        Task<User?> GetUserByIdAsync(int userId);
        Task UpdateUserAsync(User user);
    }
}

