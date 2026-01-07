using VehicleServiceManagement.API.DTOs.Dashboard;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;
using System.Globalization;

namespace VehicleServiceManagement.API.Services
{
    /// <summary>
    /// Dashboard Service - Demonstrates strong LINQ usage
    /// This service implements filtering, grouping, and aggregation queries
    /// All queries use LINQ-to-Objects (no raw SQL)
    /// </summary>
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashboardService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        #region Service Request Filtering (LINQ)

        /// <summary>
        /// LINQ Query: Dynamic Filtering
        /// Purpose: Filter service requests based on Status, Priority, and Date Range
        /// Uses conditional Where clauses to build dynamic query
        /// </summary>
        public async Task<(List<FilteredServiceRequestDto> Items, int TotalCount)> GetFilteredServiceRequestsAsync(ServiceRequestFilterDto filter)
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var query = serviceRequests.AsEnumerable();
            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(sr => sr.Status.Equals(filter.Status, StringComparison.OrdinalIgnoreCase));
            }
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query = query.Where(sr => sr.Priority.Equals(filter.Priority, StringComparison.OrdinalIgnoreCase));
            }
            if (filter.FromDate.HasValue)
            {
                query = query.Where(sr => sr.RequestedDate.Date >= filter.FromDate.Value.Date);
            }
            if (filter.ToDate.HasValue)
            {
                query = query.Where(sr => sr.RequestedDate.Date <= filter.ToDate.Value.Date);
            }
            if (filter.CustomerId.HasValue)
            {
                query = query.Where(sr => sr.CustomerId == filter.CustomerId.Value);
            }
            if (filter.CategoryId.HasValue)
            {
                query = query.Where(sr => sr.CategoryId == filter.CategoryId.Value);
            }
            if (filter.VehicleId.HasValue)
            {
                query = query.Where(sr => sr.VehicleId == filter.VehicleId.Value);
            }
            if (filter.TechnicianId.HasValue)
            {
                var technicianRequestIds = assignments
                    .Where(a => a.TechnicianId == filter.TechnicianId.Value)
                    .Select(a => a.ServiceRequestId)
                    .ToHashSet();
                query = query.Where(sr => technicianRequestIds.Contains(sr.ServiceRequestId));
            }
            var totalCount = query.Count();
            var pagedResults = query
                .OrderByDescending(sr => sr.RequestedDate)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();
            var items = pagedResults.Select(sr =>
            {
                var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == sr.VehicleId);
                var customer = users.FirstOrDefault(u => u.UserId == sr.CustomerId);
                var category = categories.FirstOrDefault(c => c.CategoryId == sr.CategoryId);
                var assignment = assignments.FirstOrDefault(a => a.ServiceRequestId == sr.ServiceRequestId);
                var technician = assignment != null
                    ? users.FirstOrDefault(u => u.UserId == assignment.TechnicianId)
                    : null;

                return new FilteredServiceRequestDto
                {
                    ServiceRequestId = sr.ServiceRequestId,
                    VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model} ({vehicle.Year})" : "Unknown",
                    RegistrationNumber = vehicle?.RegistrationNumber ?? "Unknown",
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                    CategoryName = category?.CategoryName,
                    IssueDescription = sr.IssueDescription,
                    Priority = sr.Priority,
                    Status = sr.Status,
                    RequestedDate = sr.RequestedDate,
                    ScheduledDate = sr.ScheduledDate,
                    CompletedDate = sr.CompletedDate,
                    EstimatedCost = sr.EstimatedCost,
                    ActualCost = sr.ActualCost,
                    TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : null
                };
            }).ToList();

            return (items, totalCount);
        }

        #endregion

        #region Technician Workload (LINQ Grouping)

        /// <summary>
        /// LINQ Query: Services Grouped by Technician
        /// Purpose: Calculate technician workload and performance metrics
        /// Uses GroupBy to aggregate assignments per technician
        /// </summary>
        public async Task<TechnicianWorkloadResponseDto> GetTechnicianWorkloadAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var technicians = users
                .Where(u => u.Role == UserRole.Technician && u.IsActive)
                .ToList();
            var workloads = technicians.Select(tech =>
            {
                var techAssignments = assignments
                    .Where(a => a.TechnicianId == tech.UserId)
                    .ToList();
                var completedCount = techAssignments.Count(a => a.Status == "Completed");
                var inProgressCount = techAssignments.Count(a => a.Status == "InProgress");
                var pendingCount = techAssignments.Count(a => a.Status == "Assigned");
                var completionTimes = techAssignments
                    .Where(a => a.Status == "Completed" && a.StartedDate.HasValue && a.CompletedDate.HasValue)
                    .Select(a => (a.CompletedDate!.Value - a.StartedDate!.Value).TotalHours)
                    .ToList();
                var avgCompletionTime = completionTimes.Any() ? completionTimes.Average() : 0;
                var techServiceRequestIds = techAssignments
                    .Select(a => a.ServiceRequestId)
                    .ToHashSet();
                var techBillIds = bills
                    .Where(b => techServiceRequestIds.Contains(b.ServiceRequestId))
                    .Select(b => b.BillId)
                    .ToHashSet();
                var revenueGenerated = payments
                    .Where(p => techBillIds.Contains(p.BillId) && p.PaymentStatus == PaymentStatus.Paid)
                    .Sum(p => p.AmountPaid);
                var completionRate = techAssignments.Any()
                    ? (double)completedCount / techAssignments.Count * 100
                    : 0;
                var totalActive = inProgressCount + pendingCount;
                var workloadStatus = totalActive <= 2 ? "Low" : totalActive <= 5 ? "Moderate" : "Heavy";

                return new TechnicianWorkloadItemDto
                {
                    TechnicianId = tech.UserId,
                    TechnicianName = $"{tech.FirstName} {tech.LastName}",
                    Email = tech.Email,
                    TotalAssignments = techAssignments.Count,
                    CompletedAssignments = completedCount,
                    InProgressAssignments = inProgressCount,
                    PendingAssignments = pendingCount,
                    CompletionRate = Math.Round(completionRate, 2),
                    AverageCompletionTimeHours = Math.Round(avgCompletionTime, 2),
                    TotalRevenueGenerated = revenueGenerated,
                    WorkloadStatus = workloadStatus
                };
            })
            .OrderByDescending(w => w.TotalAssignments)
            .ToList();
            var totalAssignments = assignments.Count();
            var totalCompleted = assignments.Count(a => a.Status == "Completed");

            return new TechnicianWorkloadResponseDto
            {
                Workloads = workloads,
                TotalTechnicians = technicians.Count,
                TotalAssignments = totalAssignments,
                TotalCompleted = totalCompleted,
                OverallCompletionRate = totalAssignments > 0
                    ? Math.Round((double)totalCompleted / totalAssignments * 100, 2)
                    : 0,
                AverageWorkloadPerTechnician = technicians.Count > 0
                    ? Math.Round((double)totalAssignments / technicians.Count, 2)
                    : 0
            };
        }

        #endregion

        #region Services by Vehicle Type (LINQ Grouping)

        /// <summary>
        /// LINQ Query: Services Grouped by Vehicle Type
        /// Purpose: Analyze service distribution across vehicle types
        /// Uses GroupBy with navigation to Vehicle entity
        /// </summary>
        public async Task<ServicesByVehicleTypeResponseDto> GetServicesByVehicleTypeAsync()
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var vehicleLookup = vehicles.ToDictionary(v => v.VehicleId);
            var groupedByVehicleType = serviceRequests
                .GroupBy(sr =>
                {
                    if (vehicleLookup.TryGetValue(sr.VehicleId, out var vehicle))
                    {
                        return vehicle.VehicleType;
                    }
                    return "Unknown";
                })
                .Select(group =>
                {
                    var requestIds = group.Select(sr => sr.ServiceRequestId).ToHashSet();
                    var groupBills = bills.Where(b => requestIds.Contains(b.ServiceRequestId));
                    var totalRevenue = groupBills.Sum(b => b.TotalAmount);
                    var avgCost = groupBills.Any() ? groupBills.Average(b => b.TotalAmount) : 0;

                    return new VehicleTypeServiceItemDto
                    {
                        VehicleType = group.Key,
                        ServiceCount = group.Count(),
                        TotalRevenue = totalRevenue,
                        AverageServiceCost = Math.Round(avgCost, 2)
                    };
                })
                .OrderByDescending(v => v.ServiceCount)
                .ToList();

            var totalServices = serviceRequests.Count();
            var totalRevenue = bills.Sum(b => b.TotalAmount);
            foreach (var item in groupedByVehicleType)
            {
                item.Percentage = totalServices > 0
                    ? Math.Round((decimal)item.ServiceCount / totalServices * 100, 2)
                    : 0;
            }

            return new ServicesByVehicleTypeResponseDto
            {
                VehicleTypes = groupedByVehicleType,
                TotalServices = totalServices,
                MostServicedVehicleType = groupedByVehicleType.FirstOrDefault()?.VehicleType ?? "N/A",
                TotalRevenue = totalRevenue
            };
        }

        #endregion

        #region Services by Category (LINQ Grouping)

        /// <summary>
        /// LINQ Query: Services Grouped by Service Category
        /// Purpose: Analyze service distribution across categories
        /// Uses GroupBy with join to ServiceCategory
        /// </summary>
        public async Task<ServicesByCategoryResponseDto> GetServicesByCategoryAsync()
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var categoryLookup = categories.ToDictionary(c => c.CategoryId);
            var groupedByCategory = serviceRequests
                .GroupBy(sr => sr.CategoryId)
                .Select(group =>
                {
                    var category = group.Key.HasValue && categoryLookup.TryGetValue(group.Key.Value, out var cat)
                        ? cat
                        : null;

                    var requestIds = group.Select(sr => sr.ServiceRequestId).ToHashSet();
                    var groupBills = bills.Where(b => requestIds.Contains(b.ServiceRequestId));
                    var totalRevenue = groupBills.Sum(b => b.TotalAmount);

                    return new CategoryServiceItemDto
                    {
                        CategoryId = group.Key,
                        CategoryName = category?.CategoryName ?? "Custom/Other",
                        ServiceCount = group.Count(),
                        TotalRevenue = totalRevenue,
                        BasePrice = category?.BasePrice ?? 0,
                        EstimatedDurationMinutes = category?.EstimatedDurationMinutes ?? 0
                    };
                })
                .OrderByDescending(c => c.ServiceCount)
                .ToList();

            var totalServices = serviceRequests.Count();
            var totalRevenue = bills.Sum(b => b.TotalAmount);
            foreach (var item in groupedByCategory)
            {
                item.Percentage = totalServices > 0
                    ? Math.Round((decimal)item.ServiceCount / totalServices * 100, 2)
                    : 0;
            }

            return new ServicesByCategoryResponseDto
            {
                Categories = groupedByCategory,
                TotalServices = totalServices,
                MostPopularCategory = groupedByCategory.FirstOrDefault()?.CategoryName ?? "N/A",
                TotalRevenue = totalRevenue
            };
        }

        #endregion

        #region Monthly Services (LINQ Aggregation)

        /// <summary>
        /// LINQ Query: Total Services Per Month (Year + Month grouping)
        /// Purpose: Generate monthly service report with growth tracking
        /// Uses GroupBy with composite key (Year, Month)
        /// </summary>
        public async Task<MonthlyServicesResponseDto> GetMonthlyServicesAsync(int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var monthlyData = serviceRequests
                .Where(sr => sr.RequestedDate.Year == targetYear)
                .GroupBy(sr => new { sr.RequestedDate.Year, sr.RequestedDate.Month })
                .Select(group =>
                {
                    var requestIds = group.Select(sr => sr.ServiceRequestId).ToHashSet();
                    var monthBills = bills.Where(b => requestIds.Contains(b.ServiceRequestId));
                    var monthBillIds = monthBills.Select(b => b.BillId).ToHashSet();
                    var monthRevenue = payments
                        .Where(p => monthBillIds.Contains(p.BillId) && p.PaymentStatus == PaymentStatus.Paid)
                        .Sum(p => p.AmountPaid);

                    return new MonthlyServiceItemDto
                    {
                        Year = group.Key.Year,
                        Month = group.Key.Month,
                        MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(group.Key.Month),
                        TotalServices = group.Count(),
                        CompletedServices = group.Count(sr =>
                            sr.Status == ServiceStatus.Completed || sr.Status == ServiceStatus.Closed),
                        CancelledServices = group.Count(sr => sr.Status == ServiceStatus.Cancelled),
                        TotalRevenue = monthRevenue,
                        GrowthPercentage = 0
                    };
                })
                .OrderBy(m => m.Month)
                .ToList();
            for (int i = 1; i < monthlyData.Count; i++)
            {
                if (monthlyData[i - 1].TotalServices > 0)
                {
                    monthlyData[i].GrowthPercentage = Math.Round(
                        (double)(monthlyData[i].TotalServices - monthlyData[i - 1].TotalServices) /
                        monthlyData[i - 1].TotalServices * 100, 2);
                }
            }
            var busiestMonth = monthlyData.OrderByDescending(m => m.TotalServices).FirstOrDefault();
            var slowestMonth = monthlyData.OrderBy(m => m.TotalServices).FirstOrDefault();

            return new MonthlyServicesResponseDto
            {
                MonthlyData = monthlyData,
                TotalServicesThisYear = monthlyData.Sum(m => m.TotalServices),
                AverageServicesPerMonth = monthlyData.Any()
                    ? Math.Round(monthlyData.Average(m => m.TotalServices), 2)
                    : 0,
                BusiestMonth = busiestMonth?.MonthName ?? "N/A",
                SlowMonth = slowestMonth?.MonthName ?? "N/A",
                Year = targetYear
            };
        }

        #endregion

        #region Revenue by Category (LINQ Aggregation)

        /// <summary>
        /// LINQ Query: Revenue Per Service Category
        /// Purpose: Calculate total revenue and average cost per category
        /// Uses GroupBy with Sum aggregation
        /// </summary>
        public async Task<RevenueByCategoryResponseDto> GetRevenueByCategoryAsync()
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var paidBillIds = payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
                .Select(p => p.BillId)
                .ToHashSet();
            var paidBills = bills.Where(b => paidBillIds.Contains(b.BillId)).ToList();
            var categoryLookup = categories.ToDictionary(c => c.CategoryId);
            var revenueByCategory = serviceRequests
                .Where(sr => paidBills.Any(b => b.ServiceRequestId == sr.ServiceRequestId))
                .GroupBy(sr => sr.CategoryId)
                .Select(group =>
                {
                    var category = group.Key.HasValue && categoryLookup.TryGetValue(group.Key.Value, out var cat)
                        ? cat
                        : null;

                    var requestIds = group.Select(sr => sr.ServiceRequestId).ToHashSet();
                    var groupBills = paidBills.Where(b => requestIds.Contains(b.ServiceRequestId));
                    var totalRevenue = groupBills.Sum(b => b.TotalAmount);
                    var avgCost = groupBills.Any() ? groupBills.Average(b => b.TotalAmount) : 0;

                    return new CategoryRevenueItemDto
                    {
                        CategoryId = group.Key,
                        CategoryName = category?.CategoryName ?? "Custom/Other",
                        Revenue = totalRevenue,
                        ServiceCount = group.Count(),
                        AverageServiceCost = Math.Round(avgCost, 2)
                    };
                })
                .OrderByDescending(c => c.Revenue)
                .ToList();

            var totalRevenue = revenueByCategory.Sum(c => c.Revenue);
            var totalServiceCount = revenueByCategory.Sum(c => c.ServiceCount);
            foreach (var item in revenueByCategory)
            {
                item.Percentage = totalRevenue > 0
                    ? Math.Round(item.Revenue / totalRevenue * 100, 2)
                    : 0;
            }

            return new RevenueByCategoryResponseDto
            {
                Categories = revenueByCategory,
                TotalRevenue = totalRevenue,
                TopCategory = revenueByCategory.FirstOrDefault()?.CategoryName ?? "N/A",
                TotalServiceCount = totalServiceCount,
                AverageRevenuePerCategory = revenueByCategory.Any()
                    ? Math.Round(totalRevenue / revenueByCategory.Count, 2)
                    : 0
            };
        }

        #endregion

        #region Dashboard Summary (Combined LINQ Queries)

        /// <summary>
        /// LINQ Query: Comprehensive Dashboard Summary
        /// Purpose: Provide a complete overview of the system
        /// Combines multiple LINQ queries for filtering, grouping, and aggregation
        /// </summary>
        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();

            var today = DateTime.UtcNow.Date;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var statusCounts = serviceRequests
                .GroupBy(sr => sr.Status)
                .ToDictionary(g => g.Key, g => g.Count());
            var paidPayments = payments.Where(p => p.PaymentStatus == PaymentStatus.Paid);
            var totalRevenue = paidPayments.Sum(p => p.AmountPaid);
            var todayRevenue = paidPayments
                .Where(p => p.PaymentDate.Date == today)
                .Sum(p => p.AmountPaid);
            var weekRevenue = paidPayments
                .Where(p => p.PaymentDate.Date >= startOfWeek)
                .Sum(p => p.AmountPaid);
            var monthRevenue = paidPayments
                .Where(p => p.PaymentDate.Date >= startOfMonth)
                .Sum(p => p.AmountPaid);
            var pendingPayments = bills.Sum(b => b.TotalAmount) - payments.Sum(p => p.AmountPaid);
            var totalCustomers = users.Count(u => u.Role == UserRole.Customer && u.IsActive);
            var totalVehicles = vehicles.Count();
            var totalTechnicians = users.Count(u => u.Role == UserRole.Technician && u.IsActive);
            var totalCategories = categories.Count(c => c.IsActive);
            var lowStockParts = parts.Count(p => p.QuantityInStock <= p.ReorderLevel);
            var recentServices = serviceRequests
                .OrderByDescending(sr => sr.RequestedDate)
                .Take(10)
                .Select(sr =>
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == sr.VehicleId);
                    var customer = users.FirstOrDefault(u => u.UserId == sr.CustomerId);
                    return new RecentServiceDto
                    {
                        ServiceRequestId = sr.ServiceRequestId,
                        VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model}" : "Unknown",
                        CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                        Status = sr.Status,
                        RequestedDate = sr.RequestedDate,
                        Priority = sr.Priority
                    };
                })
                .ToList();
            var todayScheduled = serviceRequests
                .Where(sr => sr.ScheduledDate.HasValue && sr.ScheduledDate.Value.Date == today)
                .Select(sr =>
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == sr.VehicleId);
                    var customer = users.FirstOrDefault(u => u.UserId == sr.CustomerId);
                    var category = categories.FirstOrDefault(c => c.CategoryId == sr.CategoryId);
                    var assignment = assignments.FirstOrDefault(a => a.ServiceRequestId == sr.ServiceRequestId);
                    var technician = assignment != null
                        ? users.FirstOrDefault(u => u.UserId == assignment.TechnicianId)
                        : null;

                    return new DashboardTodayScheduledServiceDto
                    {
                        ServiceRequestId = sr.ServiceRequestId,
                        VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model}" : "Unknown",
                        CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                        CategoryName = category?.CategoryName,
                        TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : null,
                        ScheduledDate = sr.ScheduledDate,
                        Status = sr.Status,
                        Priority = sr.Priority
                    };
                })
                .OrderBy(s => s.ScheduledDate)
                .ToList();
            var completedRequests = serviceRequests
                .Where(sr => sr.CompletedDate.HasValue && sr.Status == ServiceStatus.Completed);
            var completionTimes = completedRequests
                .Select(sr => (sr.CompletedDate!.Value - sr.RequestedDate).TotalHours)
                .ToList();
            var avgCompletionTime = completionTimes.Any() ? completionTimes.Average() : 0;

            var urgentCount = serviceRequests.Count(sr =>
                sr.Priority == ServicePriority.Urgent &&
                sr.Status != ServiceStatus.Completed &&
                sr.Status != ServiceStatus.Closed &&
                sr.Status != ServiceStatus.Cancelled);

            return new DashboardSummaryDto
            {
                RequestedCount = statusCounts.GetValueOrDefault(ServiceStatus.Requested, 0),
                AssignedCount = statusCounts.GetValueOrDefault(ServiceStatus.Assigned, 0),
                InProgressCount = statusCounts.GetValueOrDefault(ServiceStatus.InProgress, 0),
                CompletedCount = statusCounts.GetValueOrDefault(ServiceStatus.Completed, 0),
                ClosedCount = statusCounts.GetValueOrDefault(ServiceStatus.Closed, 0),
                CancelledCount = statusCounts.GetValueOrDefault(ServiceStatus.Cancelled, 0),
                TotalActiveServices = serviceRequests.Count(sr =>
                    sr.Status != ServiceStatus.Completed &&
                    sr.Status != ServiceStatus.Closed &&
                    sr.Status != ServiceStatus.Cancelled),
                TotalRevenue = totalRevenue,
                TodayRevenue = todayRevenue,
                ThisWeekRevenue = weekRevenue,
                ThisMonthRevenue = monthRevenue,
                PendingPayments = Math.Max(0, pendingPayments),
                TotalCustomers = totalCustomers,
                TotalVehicles = totalVehicles,
                TotalTechnicians = totalTechnicians,
                TotalServiceCategories = totalCategories,
                LowStockPartsCount = lowStockParts,
                RecentServices = recentServices,
                TodayScheduled = todayScheduled,
                AverageCompletionTimeHours = Math.Round(avgCompletionTime, 2),
                CustomerSatisfactionRate = 0,
                UrgentServicesCount = urgentCount
            };
        }

        #endregion

        #region Admin Dashboard

        public async Task<AdminDashboardDto> GetAdminDashboardAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var serviceParts = await _unitOfWork.ServiceParts.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();

            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var newUsers = users
                .Where(u => u.CreatedAt >= sevenDaysAgo)
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new NewUserDto
                {
                    UserId = u.UserId,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email,
                    Role = u.Role,
                    CreatedDate = u.CreatedAt
                }).ToList();

            var pendingApprovals = users
                .Where(u => u.IsPendingApproval && (u.Role == "ServiceManager" || u.Role == "Technician"))
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new PendingApprovalUserDto
                {
                    UserId = u.UserId,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email,
                    Role = u.Role,
                    CreatedDate = u.CreatedAt
                }).ToList();

            var topCategories = serviceRequestCategories
                .GroupBy(src => src.CategoryId)
                .Select(g => {
                    var category = categories.FirstOrDefault(c => c.CategoryId == g.Key);
                    var categoryRevenue = g.Sum(src => src.AdjustedPrice ?? category?.BasePrice ?? 0);
                    return new TopCategoryDto
                    {
                        CategoryId = g.Key,
                        CategoryName = category?.CategoryName ?? "Unknown",
                        ServiceCount = g.Count(),
                        Revenue = categoryRevenue
                    };
                })
                .OrderByDescending(c => c.ServiceCount)
                .Take(5)
                .ToList();

            var topParts = serviceParts
                .GroupBy(sp => sp.PartId)
                .Select(g => {
                    var part = parts.FirstOrDefault(p => p.PartId == g.Key);
                    return new TopPartDto
                    {
                        PartId = g.Key,
                        PartName = part?.PartName ?? "Unknown",
                        PartNumber = part?.PartNumber ?? "",
                        TotalUsed = g.Sum(sp => sp.QuantityUsed),
                        Revenue = g.Sum(sp => sp.TotalPrice)
                    };
                })
                .OrderByDescending(p => p.TotalUsed)
                .Take(5)
                .ToList();

            var lowStockParts = parts
                .Where(p => p.QuantityInStock <= p.ReorderLevel)
                .OrderBy(p => p.QuantityInStock)
                .Take(5)
                .Select(p => new LowStockPartDto
                {
                    PartId = p.PartId,
                    PartName = p.PartName,
                    PartNumber = p.PartNumber,
                    CurrentStock = p.QuantityInStock,
                    MinimumStock = p.ReorderLevel
                }).ToList();

            return new AdminDashboardDto
            {
                NewUsers = newUsers,
                PendingApprovals = pendingApprovals,
                TopCategories = topCategories,
                TopParts = topParts,
                LowStockParts = lowStockParts
            };
        }

        #endregion
    }
}
