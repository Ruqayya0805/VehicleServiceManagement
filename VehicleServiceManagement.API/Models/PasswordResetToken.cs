namespace VehicleServiceManagement.API.Models
{
    /// <summary>
    /// Stores password reset tokens for forgot password flow
    /// </summary>
    public class PasswordResetToken
    {
        public int Id { get; set; }
        
        /// <summary>
        /// User ID this token belongs to
        /// </summary>
        public int UserId { get; set; }
        
        /// <summary>
        /// Hashed token (never store plain token)
        /// </summary>
        public string TokenHash { get; set; } = string.Empty;
        
        /// <summary>
        /// When this token expires (typically 15-30 minutes)
        /// </summary>
        public DateTime ExpiresAt { get; set; }
        
        /// <summary>
        /// Whether this token has been used
        /// </summary>
        public bool IsUsed { get; set; } = false;
        
        /// <summary>
        /// When this token was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Navigation property
        /// </summary>
        public User User { get; set; } = null!;
    }
}
