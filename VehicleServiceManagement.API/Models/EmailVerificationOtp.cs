namespace VehicleServiceManagement.API.Models
{
    /// <summary>
    /// Stores email verification OTP tokens for user registration
    /// </summary>
    public class EmailVerificationOtp
    {
        public int Id { get; set; }
        
        /// <summary>
        /// User ID this OTP belongs to
        /// </summary>
        public int UserId { get; set; }
        
        /// <summary>
        /// Hashed OTP (never store plain OTP)
        /// </summary>
        public string OtpHash { get; set; } = string.Empty;
        
        /// <summary>
        /// When this OTP expires
        /// </summary>
        public DateTime ExpiresAt { get; set; }
        
        /// <summary>
        /// Whether this OTP has been used
        /// </summary>
        public bool IsUsed { get; set; } = false;
        
        /// <summary>
        /// Number of verification attempts (for rate limiting)
        /// </summary>
        public int AttemptCount { get; set; } = 0;
        
        /// <summary>
        /// When this OTP was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Navigation property
        /// </summary>
        public User User { get; set; } = null!;
    }
}
