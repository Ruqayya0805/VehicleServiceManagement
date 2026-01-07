using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Auth;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.User;
using VehicleServiceManagement.API.Services.Interfaces;
using System.Security.Claims;

namespace VehicleServiceManagement.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        #region Registration

        /// <summary>
        /// Register a new user (customer)
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Message = "Registration successful. Please verify your email with the OTP sent to your inbox.",
                Data = result
            });
        }

        /// <summary>
        /// Register as staff (Service Manager or Technician) - requires admin approval
        /// </summary>
        [HttpPost("register-staff")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<StaffRegistrationResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> RegisterStaff([FromBody] RegisterStaffDto dto)
        {
            var result = await _authService.RegisterStaffAsync(dto);
            return Ok(new ApiResponse<StaffRegistrationResponseDto>
            {
                Success = true,
                Message = result.Message,
                Data = result
            });
        }

        #endregion

        #region Email Verification (OTP)

        /// <summary>
        /// Verify email with OTP
        /// </summary>
        [HttpPost("verify-otp")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<OtpVerificationResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var result = await _authService.VerifyOtpAsync(dto);
            return Ok(new ApiResponse<OtpVerificationResponseDto>
            {
                Success = result.IsVerified,
                Message = result.Message,
                Data = result
            });
        }

        /// <summary>
        /// Resend OTP for email verification
        /// </summary>
        [HttpPost("resend-otp")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthOperationResponseDto>), 200)]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto)
        {
            var result = await _authService.ResendOtpAsync(dto);
            return Ok(new ApiResponse<AuthOperationResponseDto>
            {
                Success = result.Success,
                Message = result.Message,
                Data = result
            });
        }

        #endregion

        #region Login

        /// <summary>
        /// Login with email and password
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 401)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Message = "Login successful",
                Data = result
            });
        }

        #endregion

        #region Password Management

        /// <summary>
        /// Change password for authenticated user
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _authService.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);
            
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Password changed successfully",
                Data = result
            });
        }

        /// <summary>
        /// Request password reset link (forgot password)
        /// </summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthOperationResponseDto>), 200)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.ForgotPasswordAsync(dto);
            return Ok(new ApiResponse<AuthOperationResponseDto>
            {
                Success = result.Success,
                Message = result.Message,
                Data = result
            });
        }

        /// <summary>
        /// Reset password using token from email link
        /// </summary>
        [HttpPost("reset-password-with-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthOperationResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> ResetPasswordWithToken([FromBody] ResetPasswordWithTokenDto dto)
        {
            var result = await _authService.ResetPasswordWithTokenAsync(dto);
            return Ok(new ApiResponse<AuthOperationResponseDto>
            {
                Success = result.Success,
                Message = result.Message,
                Data = result
            });
        }

        #endregion

        #region User Profile

        /// <summary>
        /// Get current user profile
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid user token"
                });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Current user retrieved",
                Data = new
                {
                    UserId = user.UserId,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    IsEmailVerified = user.IsEmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }

        /// <summary>
        /// Update current user's profile
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid user token"
                });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                user.FirstName = dto.FirstName;
            if (!string.IsNullOrWhiteSpace(dto.LastName))
                user.LastName = dto.LastName;
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                user.PhoneNumber = dto.PhoneNumber;

            await _authService.UpdateUserAsync(user);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Profile updated successfully",
                Data = new
                {
                    UserId = user.UserId,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    IsEmailVerified = user.IsEmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }

        #endregion
    }
}
