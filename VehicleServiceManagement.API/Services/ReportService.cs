using VehicleServiceManagement.API.DTOs.Reports;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;
using System.Globalization;

namespace VehicleServiceManagement.API.Services
{
    public class ReportService : IReportService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReportService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardReportDto> GetDashboardReportAsync()
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();

            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var statusSummary = new ServiceStatusSummaryDto
            {
                Pending = serviceRequests.Count(sr => sr.Status == ServiceStatus.Requested || sr.Status == ServiceStatus.Assigned),
                InProgress = serviceRequests.Count(sr => sr.Status == ServiceStatus.InProgress),
                Completed = serviceRequests.Count(sr => sr.Status == ServiceStatus.Completed || sr.Status == ServiceStatus.Closed),
                Cancelled = serviceRequests.Count(sr => sr.Status == ServiceStatus.Cancelled),
                TotalActive = serviceRequests.Count(sr => 
                    sr.Status != ServiceStatus.Completed && 
                    sr.Status != ServiceStatus.Closed && 
                    sr.Status != ServiceStatus.Cancelled)
            };
            var totalServices = serviceRequests.Count();
            var servicesByStatus = serviceRequests
                .GroupBy(sr => sr.Status)
                .Select(g => new ServiceByStatusDto
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Percentage = totalServices > 0 ? Math.Round((decimal)g.Count() / totalServices * 100, 2) : 0
                })
                .OrderByDescending(s => s.Count)
                .ToList();
            var todayScheduled = serviceRequests
                .Where(sr => sr.ScheduledDate.HasValue && sr.ScheduledDate.Value.Date == today)
                .Select(sr =>
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == sr.VehicleId);
                    var customer = users.FirstOrDefault(u => u.UserId == sr.CustomerId);
                    var category = categories.FirstOrDefault(c => c.CategoryId == sr.CategoryId);
                    var assignment = assignments.FirstOrDefault(a => a.ServiceRequestId == sr.ServiceRequestId);
                    var technician = assignment != null ? users.FirstOrDefault(u => u.UserId == assignment.TechnicianId) : null;

                    return new TodayScheduledServiceDto
                    {
                        ServiceRequestId = sr.ServiceRequestId,
                        VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model}" : "Unknown",
                        CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                        CategoryName = category?.CategoryName ?? "Unknown",
                        TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : "Unassigned",
                        ScheduledDate = sr.ScheduledDate,
                        Status = sr.Status,
                        Priority = sr.Priority
                    };
                })
                .OrderBy(s => s.ScheduledDate)
                .ToList();
            var totalRevenue = payments.Where(p => p.PaymentStatus == PaymentStatus.Paid).Sum(p => p.AmountPaid);
            var todayRevenue = payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid && p.PaymentDate.Date == today)
                .Sum(p => p.AmountPaid);
            var monthRevenue = payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid && p.PaymentDate >= startOfMonth)
                .Sum(p => p.AmountPaid);
            var pendingPayments = bills.Sum(b => b.TotalAmount) - payments.Sum(p => p.AmountPaid);

            return new DashboardReportDto
            {
                ServiceStatusSummary = statusSummary,
                ServicesByStatus = servicesByStatus,
                TodayScheduledServices = todayScheduled,
                RevenueOverview = new RevenueOverviewDto
                {
                    TotalRevenue = totalRevenue,
                    TodayRevenue = todayRevenue,
                    ThisMonthRevenue = monthRevenue,
                    PendingPayments = Math.Max(0, pendingPayments)
                },
                TotalCustomers = users.Count(u => u.Role == UserRole.Customer),
                TotalVehicles = vehicles.Count(),
                TotalTechnicians = users.Count(u => u.Role == UserRole.Technician && u.IsActive),
                LowStockPartsCount = parts.Count(p => p.QuantityInStock <= p.ReorderLevel)
            };
        }

        public async Task<TechnicianWorkloadReportDto> GetTechnicianWorkloadReportAsync()
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();

            var technicians = users.Where(u => u.Role == UserRole.Technician && u.IsActive);
            var workloads = technicians.Select(t =>
            {
                var techAssignments = assignments.Where(a => a.TechnicianId == t.UserId).ToList();
                var completedAssignments = techAssignments.Where(a => a.Status == "Completed").ToList();
                var completionTimes = completedAssignments
                    .Where(a => a.StartedDate.HasValue && a.CompletedDate.HasValue)
                    .Select(a => (a.CompletedDate!.Value - a.StartedDate!.Value).TotalHours)
                    .ToList();
                
                var avgCompletionTime = completionTimes.Any() ? completionTimes.Average() : 0;
                var techServiceRequestIds = techAssignments.Select(a => a.ServiceRequestId).ToList();
                var techBills = bills.Where(b => techServiceRequestIds.Contains(b.ServiceRequestId)).ToList();
                var techBillIds = techBills.Select(b => b.BillId).ToList();
                var revenueGenerated = payments
                    .Where(p => techBillIds.Contains(p.BillId) && p.PaymentStatus == PaymentStatus.Paid)
                    .Sum(p => p.AmountPaid);

                return new TechnicianWorkloadDto
                {
                    TechnicianId = t.UserId,
                    TechnicianName = $"{t.FirstName} {t.LastName}",
                    Email = t.Email,
                    TotalAssignments = techAssignments.Count,
                    CompletedAssignments = completedAssignments.Count,
                    PendingAssignments = techAssignments.Count(a => a.Status == "Assigned"),
                    InProgressAssignments = techAssignments.Count(a => a.Status == "InProgress"),
                    AverageCompletionTimeHours = Math.Round(avgCompletionTime, 2),
                    TotalRevenueGenerated = revenueGenerated,
                    CompletionRate = techAssignments.Any() 
                        ? Math.Round((double)completedAssignments.Count / techAssignments.Count * 100, 2) 
                        : 0
                };
            })
            .OrderByDescending(w => w.CompletedAssignments)
            .ToList();
            var allCompletionTimes = assignments
                .Where(a => a.Status == "Completed" && a.StartedDate.HasValue && a.CompletedDate.HasValue)
                .Select(a => (a.CompletedDate!.Value - a.StartedDate!.Value).TotalHours)
                .ToList();

            return new TechnicianWorkloadReportDto
            {
                Workloads = workloads,
                TotalAssignments = assignments.Count(),
                TotalCompleted = assignments.Count(a => a.Status == "Completed"),
                AverageCompletionTimeHours = allCompletionTimes.Any() ? Math.Round(allCompletionTimes.Average(), 2) : 0
            };
        }

        public async Task<MonthlyRevenueReportDto> GetMonthlyRevenueReportAsync(int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var monthlyRevenues = payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid && p.PaymentDate.Year == targetYear)
                .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
                .Select(g =>
                {
                    var serviceIds = bills
                        .Where(b => payments.Any(p => p.BillId == b.BillId && 
                            p.PaymentDate.Year == g.Key.Year && 
                            p.PaymentDate.Month == g.Key.Month))
                        .Select(b => b.ServiceRequestId)
                        .Distinct()
                        .Count();

                    return new MonthlyRevenueDto
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Revenue = g.Sum(p => p.AmountPaid),
                        ServiceCount = serviceIds,
                        GrowthPercentage = 0
                    };
                })
                .OrderBy(m => m.Month)
                .ToList();
            for (int i = 1; i < monthlyRevenues.Count; i++)
            {
                if (monthlyRevenues[i - 1].Revenue > 0)
                {
                    monthlyRevenues[i].GrowthPercentage = Math.Round(
                        (monthlyRevenues[i].Revenue - monthlyRevenues[i - 1].Revenue) / 
                        monthlyRevenues[i - 1].Revenue * 100, 2);
                }
            }
            var totalPaidPayments = payments.Where(p => p.PaymentStatus == PaymentStatus.Paid);
            var paidBillIds = totalPaidPayments.Select(p => p.BillId).Distinct();
            var paidBills = bills.Where(b => paidBillIds.Contains(b.BillId));
            var totalRevenueAmount = totalPaidPayments.Sum(p => p.AmountPaid);

            var revenueByCategory = serviceRequests
                .Where(sr => paidBills.Any(b => b.ServiceRequestId == sr.ServiceRequestId))
                .GroupBy(sr => sr.CategoryId)
                .Select(g =>
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == g.Key);
                    var categoryBills = paidBills.Where(b => 
                        g.Any(sr => sr.ServiceRequestId == b.ServiceRequestId));
                    var categoryRevenue = categoryBills.Sum(b => b.TotalAmount);

                    return new RevenueByCategoryDto
                    {
                        CategoryId = g.Key,
                        CategoryName = category?.CategoryName ?? "Unknown",
                        Revenue = categoryRevenue,
                        ServiceCount = g.Count(),
                        Percentage = totalRevenueAmount > 0 
                            ? Math.Round(categoryRevenue / totalRevenueAmount * 100, 2) 
                            : 0
                    };
                })
                .OrderByDescending(r => r.Revenue)
                .ToList();
            var totalBilled = bills.Sum(b => b.TotalAmount);
            var totalPaid = payments.Where(p => p.PaymentStatus == PaymentStatus.Paid).Sum(p => p.AmountPaid);

            return new MonthlyRevenueReportDto
            {
                MonthlyRevenues = monthlyRevenues,
                RevenueByCategory = revenueByCategory,
                PaymentStatusSummary = new PaymentStatusSummaryDto
                {
                    TotalBilled = totalBilled,
                    TotalPaid = totalPaid,
                    TotalPending = Math.Max(0, totalBilled - totalPaid),
                    TotalOverdue = 0,
                    PaidCount = payments.Count(p => p.PaymentStatus == PaymentStatus.Paid),
                    PendingCount = bills.Count() - payments.Select(p => p.BillId).Distinct().Count(),
                    OverdueCount = 0
                },
                TotalRevenue = totalPaid,
                AverageMonthlyRevenue = monthlyRevenues.Any() ? monthlyRevenues.Average(m => m.Revenue) : 0
            };
        }

        public async Task<VehicleServiceHistoryDto> GetVehicleServiceHistoryAsync(int vehicleId)
        {
            var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(vehicleId);
            if (vehicle == null)
            {
                throw new NotFoundException("Vehicle", vehicleId);
            }

            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.FindAsync(sr => sr.VehicleId == vehicleId);
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var serviceParts = await _unitOfWork.ServiceParts.GetAllAsync();
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();

            var customer = users.FirstOrDefault(u => u.UserId == vehicle.CustomerId);
            var serviceHistory = serviceRequests
                .OrderByDescending(sr => sr.RequestedDate)
                .Select(sr =>
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == sr.CategoryId);
                    var assignment = assignments.FirstOrDefault(a => a.ServiceRequestId == sr.ServiceRequestId);
                    var technician = assignment != null 
                        ? users.FirstOrDefault(u => u.UserId == assignment.TechnicianId) 
                        : null;
                    var bill = bills.FirstOrDefault(b => b.ServiceRequestId == sr.ServiceRequestId);

                    return new ServiceHistoryItemDto
                    {
                        ServiceRequestId = sr.ServiceRequestId,
                        CategoryName = category?.CategoryName ?? "Unknown",
                        IssueDescription = sr.IssueDescription,
                        RequestedDate = sr.RequestedDate,
                        CompletedDate = sr.CompletedDate,
                        Status = sr.Status,
                        Cost = bill?.TotalAmount ?? sr.ActualCost,
                        TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : null
                    };
                })
                .ToList();
            var vehicleServiceRequestIds = serviceRequests.Select(sr => sr.ServiceRequestId).ToList();
            var partReplacements = serviceParts
                .Where(sp => vehicleServiceRequestIds.Contains(sp.ServiceRequestId))
                .Select(sp =>
                {
                    var serviceRequest = serviceRequests.FirstOrDefault(sr => sr.ServiceRequestId == sp.ServiceRequestId);
                    var part = parts.FirstOrDefault(p => p.PartId == sp.PartId);

                    return new PartReplacementHistoryDto
                    {
                        ServiceRequestId = sp.ServiceRequestId,
                        ServiceDate = serviceRequest?.RequestedDate ?? DateTime.MinValue,
                        PartName = part?.PartName ?? "Unknown",
                        PartNumber = part?.PartNumber ?? "Unknown",
                        Quantity = sp.QuantityUsed,
                        TotalCost = sp.TotalPrice
                    };
                })
                .OrderByDescending(p => p.ServiceDate)
                .ToList();
            var vehicleBills = bills.Where(b => vehicleServiceRequestIds.Contains(b.ServiceRequestId));
            var totalAmountSpent = vehicleBills.Sum(b => b.TotalAmount);

            return new VehicleServiceHistoryDto
            {
                VehicleId = vehicle.VehicleId,
                RegistrationNumber = vehicle.RegistrationNumber,
                Make = vehicle.Make,
                Model = vehicle.Model,
                Year = vehicle.Year,
                CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                TotalAmountSpent = totalAmountSpent,
                TotalServices = serviceRequests.Count(),
                ServiceHistory = serviceHistory,
                PartReplacements = partReplacements
            };
        }

        public async Task<ServiceStatisticsDto> GetServiceStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var filteredRequests = serviceRequests.AsEnumerable();
            if (fromDate.HasValue)
                filteredRequests = filteredRequests.Where(sr => sr.RequestedDate >= fromDate.Value);
            if (toDate.HasValue)
                filteredRequests = filteredRequests.Where(sr => sr.RequestedDate <= toDate.Value);

            var requestList = filteredRequests.ToList();
            var totalRequests = requestList.Count;
            var servicesByPriority = requestList
                .GroupBy(sr => sr.Priority)
                .Select(g =>
                {
                    var priorityBills = bills.Where(b => g.Any(sr => sr.ServiceRequestId == b.ServiceRequestId));
                    var avgCost = priorityBills.Any() ? priorityBills.Average(b => b.TotalAmount) : 0;

                    return new ServicesByPriorityDto
                    {
                        Priority = g.Key,
                        Count = g.Count(),
                        Percentage = totalRequests > 0 ? Math.Round((decimal)g.Count() / totalRequests * 100, 2) : 0,
                        AverageCost = Math.Round(avgCost, 2)
                    };
                })
                .OrderByDescending(s => s.Count)
                .ToList();
            var topCategories = requestList
                .GroupBy(sr => sr.CategoryId)
                .Select(g =>
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == g.Key);
                    var categoryBills = bills.Where(b => g.Any(sr => sr.ServiceRequestId == b.ServiceRequestId));

                    return new TopCategoryDto
                    {
                        CategoryId = g.Key,
                        CategoryName = category?.CategoryName ?? "Unknown",
                        ServiceCount = g.Count(),
                        TotalRevenue = categoryBills.Sum(b => b.TotalAmount),
                        AverageCost = categoryBills.Any() ? Math.Round(categoryBills.Average(b => b.TotalAmount), 2) : 0
                    };
                })
                .OrderByDescending(c => c.ServiceCount)
                .Take(10)
                .ToList();
            var commonIssues = requestList
                .GroupBy(sr => sr.CategoryId)
                .SelectMany(g =>
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == g.Key);
                    return g.Select(sr => new { Issue = sr.IssueDescription.Split(' ').FirstOrDefault() ?? "Other", Category = category?.CategoryName ?? "Unknown" });
                })
                .GroupBy(x => new { x.Issue, x.Category })
                .Select(g => new CommonIssueDto
                {
                    Issue = g.Key.Issue,
                    CategoryName = g.Key.Category,
                    Count = g.Count()
                })
                .OrderByDescending(i => i.Count)
                .Take(10)
                .ToList();
            var servicesByVehicleType = requestList
                .GroupBy(sr => vehicles.FirstOrDefault(v => v.VehicleId == sr.VehicleId)?.VehicleType ?? "Unknown")
                .Select(g =>
                {
                    var typeBills = bills.Where(b => g.Any(sr => sr.ServiceRequestId == b.ServiceRequestId));

                    return new ServicesByVehicleTypeDto
                    {
                        VehicleType = g.Key,
                        ServiceCount = g.Count(),
                        TotalRevenue = typeBills.Sum(b => b.TotalAmount),
                        AverageCost = typeBills.Any() ? Math.Round(typeBills.Average(b => b.TotalAmount), 2) : 0
                    };
                })
                .OrderByDescending(v => v.ServiceCount)
                .ToList();
            var completedRequests = requestList.Where(sr => sr.CompletedDate.HasValue);
            var completionTimes = completedRequests
                .Select(sr => (sr.CompletedDate!.Value - sr.RequestedDate).TotalHours)
                .ToList();
            var serviceBills = bills.Where(b => requestList.Any(sr => sr.ServiceRequestId == b.ServiceRequestId));
            var avgServiceCost = serviceBills.Any() ? serviceBills.Average(b => b.TotalAmount) : 0;

            return new ServiceStatisticsDto
            {
                ServicesByPriority = servicesByPriority,
                AverageServiceCost = Math.Round(avgServiceCost, 2),
                TopCategories = topCategories,
                CommonIssues = commonIssues,
                ServicesByVehicleType = servicesByVehicleType,
                TotalServicesCompleted = completedRequests.Count(),
                AverageCompletionTimeHours = completionTimes.Any() ? Math.Round(completionTimes.Average(), 2) : 0
            };
        }
    }
}
