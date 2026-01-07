using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VehicleServiceManagement.API.Data;
using VehicleServiceManagement.API.DTOs.Auth;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _dbContext;
        private readonly NotificationTriggerService _notificationTrigger;

        private const int OTP_LENGTH = 6;
        private const int OTP_EXPIRY_MINUTES = 10;
        private const int MAX_OTP_ATTEMPTS = 5;
        private const int PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 30;

        public AuthService(IUnitOfWork unitOfWork, IConfiguration config, ApplicationDbContext dbContext, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _config = config;
            _dbContext = dbContext;
            _notificationTrigger = notificationTrigger;
        }

        #region Registration

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await _unitOfWork.Users.ExistsAsync(u => u.Email == dto.Email))
            {
                throw new ConflictException($"User with email '{dto.Email}' already exists");
            }

            var validRoles = new[] { "Admin", "ServiceManager", "Technician", "Customer" };
            if (!validRoles.Contains(dto.Role))
            {
                throw new BadRequestException($"Invalid role. Valid roles are: {string.Join(", ", validRoles)}");
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
                IsActive = true,
                IsEmailVerified = false
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();
            await GenerateAndSendOtpAsync(user);

            return GenerateToken(user);
        }

        public async Task<StaffRegistrationResponseDto> RegisterStaffAsync(RegisterStaffDto dto)
        {
            if (await _unitOfWork.Users.ExistsAsync(u => u.Email == dto.Email))
            {
                throw new ConflictException($"User with email '{dto.Email}' already exists");
            }

            var validRoles = new[] { "ServiceManager", "Technician" };
            if (!validRoles.Contains(dto.Role))
            {
                throw new BadRequestException($"Invalid role for staff registration. Valid roles are: {string.Join(", ", validRoles)}");
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
                IsActive = true,
                IsPendingApproval = true,
                IsEmailVerified = false
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            await GenerateAndSendOtpAsync(user);

            try
            {
                await _notificationTrigger.NotifyAdminStaffApprovalRequiredAsync(user);
            }
            catch { }

            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Staff Registration Received",
                    Body = $@"
                        <h2>Registration Received</h2>
                        <p>Dear {user.FirstName},</p>
                        <p>Your registration as {user.Role} has been received.</p>
                        <p>Please verify your email first, then wait for an administrator to approve your account.</p>
                        <p>You cannot log in until both email verification and admin approval are complete.</p>
                    ",
                    NotificationType = NotificationType.StaffApproval,
                    TriggeredByUserId = user.UserId
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch { }

            return new StaffRegistrationResponseDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Role = user.Role,
                Message = "Registration submitted successfully. Please verify your email with the OTP sent to your inbox."
            };
        }

        #endregion

        #region Login

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = (await _unitOfWork.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();

            if (user == null)
            {
                throw new UnauthorizedException("Invalid email or password");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedException("Your account has been deactivated. Please contact support.");
            }

            if (!user.IsEmailVerified)
            {
                throw new UnauthorizedException("Please verify your email before logging in. Check your inbox for the OTP.");
            }

            if (user.IsPendingApproval)
            {
                throw new UnauthorizedException("Your staff registration is pending admin approval. Please wait for approval.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new UnauthorizedException("Invalid email or password");
            }

            return GenerateToken(user);
        }

        #endregion

        #region Email Verification (OTP)

        public async Task<OtpVerificationResponseDto> VerifyOtpAsync(VerifyOtpDto dto)
        {
            var user = (await _unitOfWork.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();

            if (user == null)
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = false,
                    Message = "Invalid OTP or OTP has expired"
                };
            }

            if (user.IsEmailVerified)
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = true,
                    Message = "Email is already verified"
                };
            }

            var latestOtp = await _dbContext.EmailVerificationOtps
                .Where(o => o.UserId == user.UserId && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (latestOtp == null)
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = false,
                    Message = "No OTP found. Please request a new OTP."
                };
            }

            if (latestOtp.AttemptCount >= MAX_OTP_ATTEMPTS)
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = false,
                    Message = "Maximum verification attempts exceeded. Please request a new OTP.",
                    RemainingAttempts = 0
                };
            }

            latestOtp.AttemptCount++;
            await _dbContext.SaveChangesAsync();

            if (latestOtp.ExpiresAt < DateTime.UtcNow)
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = false,
                    Message = "OTP has expired. Please request a new OTP.",
                    RemainingAttempts = MAX_OTP_ATTEMPTS - latestOtp.AttemptCount
                };
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Otp, latestOtp.OtpHash))
            {
                return new OtpVerificationResponseDto
                {
                    IsVerified = false,
                    Message = "Invalid OTP",
                    RemainingAttempts = MAX_OTP_ATTEMPTS - latestOtp.AttemptCount
                };
            }

            latestOtp.IsUsed = true;
            
            user.IsEmailVerified = true;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            await SendWelcomeEmailAsync(user);

            return new OtpVerificationResponseDto
            {
                IsVerified = true,
                Message = "Email verified successfully!"
            };
        }

        public async Task<AuthOperationResponseDto> ResendOtpAsync(ResendOtpDto dto)
        {
            var user = (await _unitOfWork.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();

            if (user == null)
            {
                return new AuthOperationResponseDto
                {
                    Success = true,
                    Message = "If the email exists, a new OTP has been sent."
                };
            }

            if (user.IsEmailVerified)
            {
                return new AuthOperationResponseDto
                {
                    Success = true,
                    Message = "Email is already verified."
                };
            }

            var recentOtp = await _dbContext.EmailVerificationOtps
                .Where(o => o.UserId == user.UserId && o.CreatedAt > DateTime.UtcNow.AddMinutes(-1))
                .FirstOrDefaultAsync();

            if (recentOtp != null)
            {
                return new AuthOperationResponseDto
                {
                    Success = false,
                    Message = "Please wait at least 1 minute before requesting a new OTP."
                };
            }

            await GenerateAndSendOtpAsync(user);

            return new AuthOperationResponseDto
            {
                Success = true,
                Message = "A new OTP has been sent to your email."
            };
        }

        #endregion

        #region Password Management

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                throw new BadRequestException("Current password is incorrect");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<AuthOperationResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = (await _unitOfWork.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();

            if (user == null || !user.IsActive)
            {
                return new AuthOperationResponseDto
                {
                    Success = true,
                    Message = "If the email exists, a password reset link has been sent."
                };
            }

            var recentToken = await _dbContext.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && t.CreatedAt > DateTime.UtcNow.AddMinutes(-2))
                .FirstOrDefaultAsync();

            if (recentToken != null)
            {
                return new AuthOperationResponseDto
                {
                    Success = true,
                    Message = "If the email exists, a password reset link has been sent."
                };
            }

            var token = GenerateSecureToken();
            var tokenHash = BCrypt.Net.BCrypt.HashPassword(token);

            var passwordResetToken = new PasswordResetToken
            {
                UserId = user.UserId,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(PASSWORD_RESET_TOKEN_EXPIRY_MINUTES),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.PasswordResetTokens.AddAsync(passwordResetToken);
            await _dbContext.SaveChangesAsync();

            var frontendUrl = _config["AppSettings:FrontendUrl"] ?? "http://localhost:4200";
            var resetLink = $"{frontendUrl}/reset-password?token={token}&email={Uri.EscapeDataString(user.Email)}";

            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Password Reset Request - CVMS",
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #333;'>Password Reset Request</h2>
                            <p>Dear {user.FirstName},</p>
                            <p>You have requested to reset your password. Click the button below to reset it:</p>
                            <p style='margin: 30px 0;'>
                                <a href='{resetLink}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;'>
                                    Reset Password
                                </a>
                            </p>
                            <p>Or copy and paste this link in your browser:</p>
                            <p style='word-break: break-all; color: #666;'>{resetLink}</p>
                            <p><strong>This link will expire in {PASSWORD_RESET_TOKEN_EXPIRY_MINUTES} minutes.</strong></p>
                            <p>If you didn't request this, please ignore this email.</p>
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                            <p style='color: #999; font-size: 12px;'>CVMS - Vehicle Service Management System</p>
                        </div>
                    ",
                    NotificationType = NotificationType.PasswordReset,
                    TriggeredByUserId = user.UserId
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch { }

            return new AuthOperationResponseDto
            {
                Success = true,
                Message = "If the email exists, a password reset link has been sent."
            };
        }

        public async Task<AuthOperationResponseDto> ResetPasswordWithTokenAsync(ResetPasswordWithTokenDto dto)
        {
            var email = dto.Token.Contains("@") ? null : ExtractEmailFromResetRequest(dto);
            
            var allTokens = await _dbContext.PasswordResetTokens
                .Include(t => t.User)
                .Where(t => !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            PasswordResetToken? validToken = null;
            
            foreach (var tokenRecord in allTokens)
            {
                try
                {
                    if (BCrypt.Net.BCrypt.Verify(dto.Token, tokenRecord.TokenHash))
                    {
                        validToken = tokenRecord;
                        break;
                    }
                }
                catch { continue; }
            }

            if (validToken == null)
            {
                return new AuthOperationResponseDto
                {
                    Success = false,
                    Message = "Invalid or expired reset link. Please request a new password reset."
                };
            }

            var user = validToken.User;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            
            validToken.IsUsed = true;

            var otherTokens = await _dbContext.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && !t.IsUsed)
                .ToListAsync();
            
            foreach (var t in otherTokens)
            {
                t.IsUsed = true;
            }

            await _unitOfWork.Users.UpdateAsync(user);
            await _dbContext.SaveChangesAsync();

            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Password Changed Successfully - CVMS",
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #333;'>Password Changed Successfully</h2>
                            <p>Dear {user.FirstName},</p>
                            <p>Your password has been changed successfully.</p>
                            <p>If you didn't make this change, please contact support immediately.</p>
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                            <p style='color: #999; font-size: 12px;'>CVMS - Vehicle Service Management System</p>
                        </div>
                    ",
                    NotificationType = NotificationType.PasswordReset,
                    TriggeredByUserId = user.UserId
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch { }

            return new AuthOperationResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully. You can now login with your new password."
            };
        }

        public async Task<bool> ResetPasswordAsync(string email, string newPassword)
        {
            var user = (await _unitOfWork.Users.FindAsync(u => u.Email == email)).FirstOrDefault();
            
            if (user == null)
            {
                throw new NotFoundException($"User with email '{email}' not found");
            }

            if (!user.IsActive)
            {
                throw new BadRequestException("Your account has been deactivated. Please contact support.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        #endregion

        #region Token Validation

        public Task<bool> ValidateTokenAsync(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["JwtSettings:Secret"]!);

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _config["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _config["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                return Task.FromResult(true);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _unitOfWork.Users.GetByIdAsync(userId);
        }

        public async Task UpdateUserAsync(User user)
        {
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
        }

        #endregion

        #region Private Helper Methods

        private async Task GenerateAndSendOtpAsync(User user)
        {
            var otp = GenerateSecureOtp();
            var otpHash = BCrypt.Net.BCrypt.HashPassword(otp);

            var emailVerificationOtp = new EmailVerificationOtp
            {
                UserId = user.UserId,
                OtpHash = otpHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES),
                IsUsed = false,
                AttemptCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _dbContext.EmailVerificationOtps.AddAsync(emailVerificationOtp);
            await _dbContext.SaveChangesAsync();

            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Email Verification OTP - CVMS",
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #333;'>Email Verification</h2>
                            <p>Dear {user.FirstName},</p>
                            <p>Your OTP for email verification is:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f0f0f0; padding: 15px 30px; border-radius: 8px;'>{otp}</span>
                            </div>
                            <p><strong>This OTP will expire in {OTP_EXPIRY_MINUTES} minutes.</strong></p>
                            <p>If you didn't register for CVMS, please ignore this email.</p>
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                            <p style='color: #999; font-size: 12px;'>CVMS - Vehicle Service Management System</p>
                        </div>
                    ",
                    NotificationType = NotificationType.EmailVerification,
                    TriggeredByUserId = user.UserId
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch { }
        }

        private async Task SendWelcomeEmailAsync(User user)
        {
            try
            {
                var emailEvent = new EmailNotificationEvent
                {
                    ToEmail = user.Email,
                    Subject = "Welcome to CVMS - Email Verified!",
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #4CAF50;'>🎉 Email Verified Successfully!</h2>
                            <p>Dear {user.FirstName},</p>
                            <p>Your email has been verified successfully. Welcome to CVMS!</p>
                            {(user.IsPendingApproval ? 
                                "<p><strong>Note:</strong> Your staff account is pending admin approval. You will be notified once approved.</p>" : 
                                "<p>You can now login to your account and start using our services.</p>")}
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                            <p style='color: #999; font-size: 12px;'>CVMS - Vehicle Service Management System</p>
                        </div>
                    ",
                    NotificationType = NotificationType.EmailVerification,
                    TriggeredByUserId = user.UserId
                };
                await EmailNotificationQueue.Channel.Writer.WriteAsync(emailEvent);
            }
            catch { }
        }

        private static string GenerateSecureOtp()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var number = BitConverter.ToUInt32(bytes, 0) % 1000000;
            return number.ToString("D6");
        }

        private static string GenerateSecureToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        private static string? ExtractEmailFromResetRequest(ResetPasswordWithTokenDto dto)
        {
            return null;
        }

        private AuthResponseDto GenerateToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("email_verified", user.IsEmailVerified.ToString().ToLower())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Secret"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["JwtSettings:ExpiryInMinutes"]!)),
                signingCredentials: credentials
            );

            return new AuthResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role,
                Token = new JwtSecurityTokenHandler().WriteToken(token)
            };
        }

        #endregion
    }
}
