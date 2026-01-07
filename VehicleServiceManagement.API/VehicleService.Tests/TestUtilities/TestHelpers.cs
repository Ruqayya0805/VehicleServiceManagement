using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.Tests.TestUtilities
{
    /// <summary>
    /// Helper class for creating mock authenticated users with various roles
    /// </summary>
    public static class TestHelpers
    {
        /// <summary>
        /// Creates a mock ClaimsPrincipal with the specified user ID and role
        /// </summary>
        public static ClaimsPrincipal CreateMockUser(int userId, string role)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Email, $"user{userId}@test.com")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            return new ClaimsPrincipal(identity);
        }

        /// <summary>
        /// Creates a mock Admin user
        /// </summary>
        public static ClaimsPrincipal CreateAdminUser(int userId = 1)
        {
            return CreateMockUser(userId, UserRole.Admin);
        }

        /// <summary>
        /// Creates a mock ServiceManager user
        /// </summary>
        public static ClaimsPrincipal CreateServiceManagerUser(int userId = 2)
        {
            return CreateMockUser(userId, UserRole.ServiceManager);
        }

        /// <summary>
        /// Creates a mock Technician user
        /// </summary>
        public static ClaimsPrincipal CreateTechnicianUser(int userId = 3)
        {
            return CreateMockUser(userId, UserRole.Technician);
        }

        /// <summary>
        /// Creates a mock Customer user
        /// </summary>
        public static ClaimsPrincipal CreateCustomerUser(int userId = 4)
        {
            return CreateMockUser(userId, UserRole.Customer);
        }

        /// <summary>
        /// Creates a mock unauthenticated user (no claims)
        /// </summary>
        public static ClaimsPrincipal CreateUnauthenticatedUser()
        {
            return new ClaimsPrincipal(new ClaimsIdentity());
        }

        /// <summary>
        /// Sets up controller context with the specified user
        /// </summary>
        public static void SetupControllerContext(ControllerBase controller, ClaimsPrincipal user)
        {
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        /// <summary>
        /// Creates a test User entity
        /// </summary>
        public static User CreateTestUser(int id, string role, bool isActive = true)
        {
            return new User
            {
                UserId = id,
                FirstName = $"Test{role}",
                LastName = "User",
                Email = $"test{role.ToLower()}{id}@test.com",
                PhoneNumber = "1234567890",
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPassword123!"),
                IsActive = isActive,
                IsPendingApproval = false,
                CreatedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Creates a test Vehicle entity
        /// </summary>
        public static Vehicle CreateTestVehicle(int id, int customerId)
        {
            return new Vehicle
            {
                VehicleId = id,
                CustomerId = customerId,
                Make = "Toyota",
                Model = "Camry",
                Year = 2022,
                RegistrationNumber = $"ABC-{id:D4}",
                RcNumber = $"RC{id:D10}",
                VehicleType = "Sedan",
                FuelType = "Petrol",
                Color = "White"
            };
        }

        /// <summary>
        /// Creates a test ServiceRequest entity
        /// </summary>
        public static ServiceRequest CreateTestServiceRequest(int id, int customerId, int vehicleId, string status = "Requested")
        {
            return new ServiceRequest
            {
                ServiceRequestId = id,
                CustomerId = customerId,
                VehicleId = vehicleId,
                IssueDescription = "Test issue description",
                Priority = "Normal",
                Status = status,
                RequestedDate = DateTime.UtcNow,
                EstimatedCost = 100.00m
            };
        }

        /// <summary>
        /// Creates a test ServiceCategory entity
        /// </summary>
        public static ServiceCategory CreateTestServiceCategory(int id, string name, decimal basePrice, bool isActive = true)
        {
            return new ServiceCategory
            {
                CategoryId = id,
                CategoryName = name,
                Description = $"Test category: {name}",
                BasePrice = basePrice,
                IsActive = isActive
            };
        }

        /// <summary>
        /// Creates a test ServiceAssignment entity
        /// </summary>
        public static ServiceAssignment CreateTestAssignment(int id, int serviceRequestId, int technicianId, string status = "Assigned")
        {
            return new ServiceAssignment
            {
                AssignmentId = id,
                ServiceRequestId = serviceRequestId,
                TechnicianId = technicianId,
                AssignedDate = DateTime.UtcNow,
                Status = status
            };
        }

        /// <summary>
        /// Creates a test Bill entity
        /// </summary>
        public static Bill CreateTestBill(int id, int serviceRequestId, decimal totalAmount, decimal serviceCharge = 0, decimal partsCharge = 0)
        {
            return new Bill
            {
                BillId = id,
                ServiceRequestId = serviceRequestId,
                BillNumber = $"BILL-TEST-{id:D6}",
                ServiceCharge = serviceCharge > 0 ? serviceCharge : totalAmount * 0.7m,
                PartsCharge = partsCharge > 0 ? partsCharge : totalAmount * 0.2m,
                Tax = totalAmount * 0.1m,
                Discount = 0,
                TotalAmount = totalAmount,
                GeneratedDate = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Creates a test Payment entity
        /// </summary>
        public static Payment CreateTestPayment(int id, int billId, decimal amountPaid, string paymentMethod = "Cash")
        {
            return new Payment
            {
                PaymentId = id,
                BillId = billId,
                AmountPaid = amountPaid,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = paymentMethod,
                TransactionId = $"TXN-{id:D8}"
            };
        }
    }
}
