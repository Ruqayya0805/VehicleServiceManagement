using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Auth
{
    /// <summary>
    /// DTO for verifying email OTP
    /// </summary>
    public class VerifyOtpDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be exactly 6 digits")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be 6 numeric digits")]
        public string Otp { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for resending OTP
    /// </summary>
    public class ResendOtpDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for forgot password request
    /// </summary>
    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for resetting password with token
    /// </summary>
    public class ResetPasswordWithTokenDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO for OTP verification
    /// </summary>
    public class OtpVerificationResponseDto
    {
        public bool IsVerified { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? RemainingAttempts { get; set; }
    }

    /// <summary>
    /// Response DTO for generic auth operations
    /// </summary>
    public class AuthOperationResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
