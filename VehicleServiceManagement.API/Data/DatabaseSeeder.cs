using Microsoft.EntityFrameworkCore;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Data
{
    public static class DatabaseSeeder
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            SeedUsers(modelBuilder);
            SeedServiceCategories(modelBuilder);
            SeedParts(modelBuilder);
        }

        private static void SeedUsers(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    FirstName = "Admin",
                    LastName = "User",
                    Email = "admin@vehicleservice.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    PhoneNumber = "1234567890",
                    Role = "Admin",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new User
                {
                    UserId = 2,
                    FirstName = "Sarah",
                    LastName = "Manager",
                    Email = "manager@vehicleservice.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                    PhoneNumber = "1234567891",
                    Role = "ServiceManager",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new User
                {
                    UserId = 3,
                    FirstName = "Mike",
                    LastName = "Tech",
                    Email = "mike.tech@vehicleservice.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tech@123"),
                    PhoneNumber = "1234567892",
                    Role = "Technician",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new User
                {
                    UserId = 4,
                    FirstName = "David",
                    LastName = "Mechanic",
                    Email = "david.mechanic@vehicleservice.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tech@123"),
                    PhoneNumber = "1234567893",
                    Role = "Technician",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new User
                {
                    UserId = 5,
                    FirstName = "John",
                    LastName = "Customer",
                    Email = "john.customer@email.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    PhoneNumber = "1234567894",
                    Role = "Customer",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                }
            );
        }

        private static void SeedServiceCategories(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ServiceCategory>().HasData(
                new ServiceCategory
                {
                    CategoryId = 1,
                    CategoryName = "Oil Change",
                    Description = "Regular oil and filter change service",
                    BasePrice = 400.00m,
                    EstimatedDurationMinutes = 30,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 2,
                    CategoryName = "Brake Service",
                    Description = "Complete brake pad replacement and inspection",
                    BasePrice = 1200.00m,
                    EstimatedDurationMinutes = 90,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 3,
                    CategoryName = "Tire Rotation",
                    Description = "Rotate and balance all four tires",
                    BasePrice = 320.00m,
                    EstimatedDurationMinutes = 45,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 4,
                    CategoryName = "Engine Diagnostics",
                    Description = "Complete engine diagnostic scan and report",
                    BasePrice = 800.00m,
                    EstimatedDurationMinutes = 60,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 5,
                    CategoryName = "AC Service",
                    Description = "Air conditioning system service and repair",
                    BasePrice = 960.00m,
                    EstimatedDurationMinutes = 75,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 6,
                    CategoryName = "Transmission Service",
                    Description = "Transmission fluid change and inspection",
                    BasePrice = 1440.00m,
                    EstimatedDurationMinutes = 120,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 7,
                    CategoryName = "Battery Replacement",
                    Description = "Battery testing and replacement",
                    BasePrice = 640.00m,
                    EstimatedDurationMinutes = 30,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 8,
                    CategoryName = "Wheel Alignment",
                    Description = "Four-wheel alignment service",
                    BasePrice = 720.00m,
                    EstimatedDurationMinutes = 60,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 9,
                    CategoryName = "General Inspection",
                    Description = "Comprehensive vehicle inspection",
                    BasePrice = 480.00m,
                    EstimatedDurationMinutes = 45,
                    IsActive = true
                },
                new ServiceCategory
                {
                    CategoryId = 10,
                    CategoryName = "Coolant Flush",
                    Description = "Engine coolant system flush and refill",
                    BasePrice = 560.00m,
                    EstimatedDurationMinutes = 45,
                    IsActive = true
                }
            );
        }

        private static void SeedParts(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Part>().HasData(
                new Part
                {
                    PartId = 1,
                    PartName = "Engine Oil 5W-30",
                    PartNumber = "OIL-5W30-001",
                    Description = "Synthetic engine oil 5W-30, 5 quarts",
                    UnitPrice = 25.00m,
                    QuantityInStock = 50,
                    ReorderLevel = 10,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 2,
                    PartName = "Oil Filter",
                    PartNumber = "FILTER-OIL-002",
                    Description = "Premium oil filter",
                    UnitPrice = 8.00m,
                    QuantityInStock = 100,
                    ReorderLevel = 20,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 3,
                    PartName = "Air Filter",
                    PartNumber = "FILTER-AIR-003",
                    Description = "Engine air filter",
                    UnitPrice = 15.00m,
                    QuantityInStock = 75,
                    ReorderLevel = 15,
                    Supplier = "FilterPro"
                },
                new Part
                {
                    PartId = 4,
                    PartName = "Brake Pads (Front)",
                    PartNumber = "BRAKE-PAD-F-004",
                    Description = "Ceramic brake pads for front wheels",
                    UnitPrice = 45.00m,
                    QuantityInStock = 40,
                    ReorderLevel = 10,
                    Supplier = "BrakeMaster"
                },
                new Part
                {
                    PartId = 5,
                    PartName = "Brake Pads (Rear)",
                    PartNumber = "BRAKE-PAD-R-005",
                    Description = "Ceramic brake pads for rear wheels",
                    UnitPrice = 40.00m,
                    QuantityInStock = 40,
                    ReorderLevel = 10,
                    Supplier = "BrakeMaster"
                },
                new Part
                {
                    PartId = 6,
                    PartName = "Brake Rotor",
                    PartNumber = "BRAKE-ROTOR-006",
                    Description = "Front brake rotor",
                    UnitPrice = 60.00m,
                    QuantityInStock = 30,
                    ReorderLevel = 8,
                    Supplier = "BrakeMaster"
                },
                new Part
                {
                    PartId = 7,
                    PartName = "Car Battery 12V",
                    PartNumber = "BATTERY-12V-007",
                    Description = "12V automotive battery, 600 CCA",
                    UnitPrice = 120.00m,
                    QuantityInStock = 25,
                    ReorderLevel = 5,
                    Supplier = "PowerCell"
                },
                new Part
                {
                    PartId = 8,
                    PartName = "Coolant/Antifreeze",
                    PartNumber = "COOLANT-008",
                    Description = "Engine coolant, 1 gallon",
                    UnitPrice = 18.00m,
                    QuantityInStock = 60,
                    ReorderLevel = 15,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 9,
                    PartName = "Transmission Fluid",
                    PartNumber = "TRANS-FLUID-009",
                    Description = "Automatic transmission fluid, 1 quart",
                    UnitPrice = 12.00m,
                    QuantityInStock = 80,
                    ReorderLevel = 20,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 10,
                    PartName = "Transmission Filter",
                    PartNumber = "TRANS-FILTER-010",
                    Description = "Transmission filter kit",
                    UnitPrice = 30.00m,
                    QuantityInStock = 35,
                    ReorderLevel = 10,
                    Supplier = "FilterPro"
                },
                new Part
                {
                    PartId = 11,
                    PartName = "AC Refrigerant",
                    PartNumber = "AC-REF-011",
                    Description = "R-134a refrigerant, 12 oz",
                    UnitPrice = 22.00m,
                    QuantityInStock = 50,
                    ReorderLevel = 15,
                    Supplier = "ClimateControl"
                },
                new Part
                {
                    PartId = 12,
                    PartName = "Cabin Air Filter",
                    PartNumber = "FILTER-CABIN-012",
                    Description = "HEPA cabin air filter",
                    UnitPrice = 20.00m,
                    QuantityInStock = 60,
                    ReorderLevel = 12,
                    Supplier = "FilterPro"
                },
                new Part
                {
                    PartId = 13,
                    PartName = "Spark Plugs (Set of 4)",
                    PartNumber = "SPARK-PLUG-013",
                    Description = "Iridium spark plugs",
                    UnitPrice = 35.00m,
                    QuantityInStock = 45,
                    ReorderLevel = 10,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 14,
                    PartName = "Serpentine Belt",
                    PartNumber = "BELT-SERP-014",
                    Description = "Engine serpentine belt",
                    UnitPrice = 28.00m,
                    QuantityInStock = 40,
                    ReorderLevel = 10,
                    Supplier = "AutoParts Inc."
                },
                new Part
                {
                    PartId = 15,
                    PartName = "Timing Belt",
                    PartNumber = "BELT-TIME-015",
                    Description = "Engine timing belt",
                    UnitPrice = 55.00m,
                    QuantityInStock = 20,
                    ReorderLevel = 5,
                    Supplier = "AutoParts Inc."
                }
            );
        }
    }
}
