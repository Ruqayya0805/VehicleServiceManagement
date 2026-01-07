using Microsoft.EntityFrameworkCore;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<ServiceRequest> ServiceRequests { get; set; }
        public DbSet<ServiceRequestCategory> ServiceRequestCategories { get; set; }
        public DbSet<ServiceTask> ServiceTasks { get; set; }
        public DbSet<ServiceAssignment> ServiceAssignments { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<ServicePart> ServiceParts { get; set; }
        public DbSet<PartOrder> PartOrders { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ServiceChangeHistory> ServiceChangeHistories { get; set; }
        public DbSet<EmailVerificationOtp> EmailVerificationOtps { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<InAppNotification> InAppNotifications { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureEntities(modelBuilder);

            DatabaseSeeder.Seed(modelBuilder);
        }

        private void ConfigureEntities(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.Property(e => e.PasswordHash).IsRequired();
            });

            modelBuilder.Entity<EmailVerificationOtp>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OtpHash).IsRequired().HasMaxLength(255);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.EmailVerificationOtps)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.UserId);
            });

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(255);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.PasswordResetTokens)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.UserId);
            });

            modelBuilder.Entity<InAppNotification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.TargetRole).HasMaxLength(50);
                entity.Property(e => e.RelatedEntityType).HasMaxLength(50);
                entity.Property(e => e.ActionUrl).HasMaxLength(500);
                
                entity.HasOne(e => e.TargetUser)
                    .WithMany()
                    .HasForeignKey(e => e.TargetUserId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasIndex(e => e.TargetUserId);
                entity.HasIndex(e => e.TargetRole);
                entity.HasIndex(e => e.IsRead);
                entity.HasIndex(e => e.CreatedAt);
            });

            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.HasKey(e => e.VehicleId);
                entity.Property(e => e.RegistrationNumber).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.RegistrationNumber).IsUnique();
                entity.Property(e => e.Make).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Model).IsRequired().HasMaxLength(50);
                entity.Property(e => e.VehicleType).HasMaxLength(30);
                entity.Property(e => e.Color).HasMaxLength(30);

                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.Vehicles)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ServiceCategory>(entity =>
            {
                entity.HasKey(e => e.CategoryId);
                entity.Property(e => e.CategoryName).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.CategoryName).IsUnique();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.BasePrice).HasPrecision(10, 2);
            });

            modelBuilder.Entity<ServiceRequest>(entity =>
            {
                entity.HasKey(e => e.ServiceRequestId);
                entity.Property(e => e.IssueDescription).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Priority).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerRemarks).HasMaxLength(500);
                entity.Property(e => e.TechnicianRemarks).HasMaxLength(500);
                entity.Property(e => e.EstimatedCost).HasPrecision(10, 2);
                entity.Property(e => e.ActualCost).HasPrecision(10, 2);

                entity.HasOne(e => e.Vehicle)
                    .WithMany(v => v.ServiceRequests)
                    .HasForeignKey(e => e.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Customer)
                    .WithMany(u => u.ServiceRequests)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.ServiceRequests)
                    .HasForeignKey(e => e.CategoryId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ServiceRequestCategory>(entity =>
            {
                entity.HasKey(sc => new { sc.ServiceRequestId, sc.CategoryId });

                entity.HasOne(sc => sc.ServiceRequest)
                    .WithMany(sr => sr.ServiceRequestCategories)
                    .HasForeignKey(sc => sc.ServiceRequestId);

                entity.HasOne(sc => sc.ServiceCategory)
                    .WithMany()
                    .HasForeignKey(sc => sc.CategoryId);
            });

            modelBuilder.Entity<ServiceTask>(entity =>
            {
                entity.HasKey(e => e.ServiceTaskId);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Price).HasPrecision(10, 2);

                entity.HasOne(e => e.ServiceRequest)
                    .WithMany(sr => sr.ServiceTasks)
                    .HasForeignKey(e => e.ServiceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CompletedBy)
                    .WithMany()
                    .HasForeignKey(e => e.CompletedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ServiceAssignment>(entity =>
            {
                entity.HasKey(e => e.AssignmentId);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.HasOne(e => e.ServiceRequest)
                    .WithOne(sr => sr.ServiceAssignment)
                    .HasForeignKey<ServiceAssignment>(e => e.ServiceRequestId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Technician)
                    .WithMany(u => u.ServiceAssignments)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Part>(entity =>
            {
                entity.HasKey(e => e.PartId);
                entity.Property(e => e.PartName).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.PartName).IsUnique();
                entity.Property(e => e.PartNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
                entity.Property(e => e.Supplier).HasMaxLength(100);
            });

            modelBuilder.Entity<ServicePart>(entity =>
            {
                entity.HasKey(e => e.ServicePartId);
                entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
                entity.Property(e => e.TotalPrice).HasPrecision(10, 2);

                entity.HasOne(e => e.ServiceRequest)
                    .WithMany(sr => sr.ServiceParts)
                    .HasForeignKey(e => e.ServiceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Part)
                    .WithMany(p => p.ServiceParts)
                    .HasForeignKey(e => e.PartId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Bill>(entity =>
            {
                entity.HasKey(e => e.BillId);
                entity.Property(e => e.BillNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.BillNumber).IsUnique();
                entity.Property(e => e.ServiceCharge).HasPrecision(10, 2);
                entity.Property(e => e.PartsCharge).HasPrecision(10, 2);
                entity.Property(e => e.Tax).HasPrecision(10, 2);
                entity.Property(e => e.Discount).HasPrecision(10, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(10, 2);

                entity.HasOne(e => e.ServiceRequest)
                    .WithOne(sr => sr.Bill)
                    .HasForeignKey<Bill>(e => e.ServiceRequestId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.AmountPaid).HasPrecision(10, 2);
                entity.Property(e => e.PaymentMethod).HasMaxLength(50);
                entity.Property(e => e.TransactionId).HasMaxLength(100);
                entity.Property(e => e.PaymentStatus).HasMaxLength(20);

                entity.HasOne(e => e.Bill)
                    .WithMany(b => b.Payments)
                    .HasForeignKey(e => e.BillId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PartOrder>(entity =>
            {
                entity.HasKey(e => e.PartOrderId);
                entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.OrderNumber).IsUnique();
                entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(10, 2);
                entity.Property(e => e.Supplier).HasMaxLength(100);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.HasOne(e => e.Part)
                    .WithMany()
                    .HasForeignKey(e => e.PartId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.OrderedBy)
                    .WithMany()
                    .HasForeignKey(e => e.OrderedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
