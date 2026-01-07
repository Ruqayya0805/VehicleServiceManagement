using VehicleServiceManagement.API.DTOs.Bill;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.DTOs.ServiceTask;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class BillService : IBillService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IServicePartService _servicePartService;
        private readonly NotificationTriggerService _notificationTrigger;

        public BillService(IUnitOfWork unitOfWork, IServicePartService servicePartService, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _servicePartService = servicePartService;
            _notificationTrigger = notificationTrigger;
        }

        public async Task<IEnumerable<BillDto>> GetAllAsync()
        {
            var bills = await _unitOfWork.Bills.GetAllAsync();
            return await MapToDtos(bills);
        }

        public async Task<BillDto?> GetByIdAsync(int id)
        {
            var bill = await _unitOfWork.Bills.GetByIdAsync(id);
            if (bill == null) return null;

            return (await MapToDtos(new[] { bill })).FirstOrDefault();
        }

        public async Task<BillDto?> GetByServiceRequestIdAsync(int serviceRequestId)
        {
            var bills = await _unitOfWork.Bills.FindAsync(b => b.ServiceRequestId == serviceRequestId);
            var bill = bills.FirstOrDefault();
            if (bill == null) return null;

            return (await MapToDtos(new[] { bill })).FirstOrDefault();
        }

        public async Task<IEnumerable<BillSummaryDto>> GetByCustomerIdAsync(int customerId)
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.FindAsync(sr => sr.CustomerId == customerId);
            var serviceRequestIds = serviceRequests.Select(sr => sr.ServiceRequestId).ToList();
            
            var bills = await _unitOfWork.Bills.FindAsync(b => serviceRequestIds.Contains(b.ServiceRequestId));
            return await MapToSummaryDtos(bills);
        }

        public async Task<IEnumerable<BillSummaryDto>> GetUnpaidAsync()
        {
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var unpaidBills = bills.Where(b =>
            {
                var billPayments = payments.Where(p => p.BillId == b.BillId).ToList();
                var totalPaid = billPayments.Sum(p => p.AmountPaid);
                return totalPaid < b.TotalAmount;
            }).ToList();

            return await MapToSummaryDtos(unpaidBills);
        }

        public async Task<IEnumerable<BillSummaryDto>> GetOverdueAsync()
        {
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var overdueBills = bills.Where(b =>
            {
                if (!b.GeneratedDate.AddDays(30).Equals(b.GeneratedDate))
                {
                    var dueDate = b.GeneratedDate.AddDays(30);
                    var billPayments = payments.Where(p => p.BillId == b.BillId).ToList();
                    var totalPaid = billPayments.Sum(p => p.AmountPaid);
                    return totalPaid < b.TotalAmount && DateTime.UtcNow > dueDate;
                }
                return false;
            }).ToList();

            return await MapToSummaryDtos(overdueBills);
        }

        /// <summary>
        /// Get bills with optional filtering by serviceRequestId, customerId, paymentStatus, date range, etc.
        /// </summary>
        public async Task<IEnumerable<BillSummaryDto>> GetFilteredAsync(BillFilterDto filter)
        {
            var allBills = await _unitOfWork.Bills.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var query = allBills.AsQueryable();
            if (filter.ServiceRequestId.HasValue)
                query = query.Where(b => b.ServiceRequestId == filter.ServiceRequestId.Value);

            if (filter.CustomerId.HasValue)
            {
                var customerServiceRequestIds = serviceRequests
                    .Where(sr => sr.CustomerId == filter.CustomerId.Value)
                    .Select(sr => sr.ServiceRequestId)
                    .ToList();
                query = query.Where(b => customerServiceRequestIds.Contains(b.ServiceRequestId));
            }

            if (filter.FromDate.HasValue)
                query = query.Where(b => b.GeneratedDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(b => b.GeneratedDate <= filter.ToDate.Value);

            var filteredBills = query.ToList();
            if (!string.IsNullOrEmpty(filter.PaymentStatus) || filter.IsOverdue.HasValue)
            {
                filteredBills = filteredBills.Where(b =>
                {
                    var billPayments = payments.Where(p => p.BillId == b.BillId).ToList();
                    var amountPaid = billPayments.Sum(p => p.AmountPaid);
                    var balanceDue = b.TotalAmount - amountPaid;
                    var dueDate = b.GeneratedDate.AddDays(30);
                    var isOverdue = DateTime.UtcNow > dueDate && balanceDue > 0;

                    string paymentStatus;
                    if (balanceDue <= 0) paymentStatus = PaymentStatus.Paid;
                    else if (amountPaid > 0) paymentStatus = PaymentStatus.PartiallyPaid;
                    else paymentStatus = PaymentStatus.Pending;

                    bool statusMatch = string.IsNullOrEmpty(filter.PaymentStatus) || 
                        paymentStatus.Equals(filter.PaymentStatus, StringComparison.OrdinalIgnoreCase);
                    bool overdueMatch = !filter.IsOverdue.HasValue || filter.IsOverdue.Value == isOverdue;

                    return statusMatch && overdueMatch;
                }).ToList();
            }

            return await MapToSummaryDtos(filteredBills.OrderByDescending(b => b.GeneratedDate));
        }

        public async Task<BillDto> GenerateAsync(GenerateBillDto dto)
        {
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(dto.ServiceRequestId);
            if (serviceRequest == null)
            {
                throw new NotFoundException("ServiceRequest", dto.ServiceRequestId);
            }
            if (await _unitOfWork.Bills.ExistsAsync(b => b.ServiceRequestId == dto.ServiceRequestId))
            {
                throw new ConflictException("A bill has already been generated for this service request");
            }
            decimal serviceCharge = 0;
            var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.FindAsync(
                src => src.ServiceRequestId == dto.ServiceRequestId);
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();

            if (serviceRequestCategories.Any())
            {
                foreach (var src in serviceRequestCategories)
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == src.CategoryId);
                    serviceCharge += src.AdjustedPrice ?? category?.BasePrice ?? 0;
                }
            }
            else
            {
                var primaryCategory = categories.FirstOrDefault(c => c.CategoryId == serviceRequest.CategoryId);
                serviceCharge = primaryCategory?.BasePrice ?? 0;
            }
            var serviceTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == dto.ServiceRequestId);
            decimal taskCharge = serviceTasks.Sum(t => t.Price ?? 0);
            serviceCharge += taskCharge;
            decimal extraServicesCharge = 0;
            if (dto.ExtraServices != null && dto.ExtraServices.Any())
            {
                foreach (var extraService in dto.ExtraServices)
                {
                    var extraTask = new ServiceTask
                    {
                        ServiceRequestId = dto.ServiceRequestId,
                        Description = $"[Extra] {extraService.Description}",
                        Price = extraService.Price,
                        IsCompleted = true,
                        CompletedDate = DateTime.UtcNow,
                        OrderIndex = serviceTasks.Count() + 1,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.ServiceTasks.AddAsync(extraTask);
                    extraServicesCharge += extraService.Price;
                }
            }
            serviceCharge += extraServicesCharge;
            if (serviceCharge == 0)
            {
                serviceCharge = serviceRequest.ActualCost > 0 
                    ? serviceRequest.ActualCost 
                    : serviceRequest.EstimatedCost;
            }
            decimal partsCharge = await _servicePartService.GetTotalPartsChargeAsync(dto.ServiceRequestId);
            decimal subtotal = serviceCharge + partsCharge;
            const decimal TAX_RATE = 10m;
            decimal tax = subtotal * (TAX_RATE / 100);
            decimal totalAmount = subtotal + tax - dto.Discount;

            var bill = new Bill
            {
                ServiceRequestId = dto.ServiceRequestId,
                BillNumber = GenerateBillNumber(),
                ServiceCharge = serviceCharge,
                PartsCharge = partsCharge,
                Tax = tax,
                Discount = dto.Discount,
                TotalAmount = totalAmount,
                GeneratedDate = DateTime.UtcNow
            };

            await _unitOfWork.Bills.AddAsync(bill);
            await _unitOfWork.SaveChangesAsync();
            // Note: Notifications are sent when bill is finalized (FinalizeBill = true in UpdateAsync)
            // Not when bill is first generated, allowing staff to review/edit before notifying customer

            return (await MapToDtos(new[] { bill })).First();
        }

        public async Task<BillDto> UpdateAsync(int id, UpdateBillDto dto)
        {
            var bill = await _unitOfWork.Bills.GetByIdAsync(id);
            
            if (bill == null)
            {
                throw new NotFoundException("Bill", id);
            }
            if (dto.ServiceItemPrices != null && dto.ServiceItemPrices.Any())
            {
                var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.FindAsync(
                    src => src.ServiceRequestId == bill.ServiceRequestId);
                
                decimal totalServiceCharge = 0;
                foreach (var src in serviceRequestCategories)
                {
                    if (dto.ServiceItemPrices.TryGetValue(src.CategoryId, out var adjustedPrice))
                    {
                        src.AdjustedPrice = adjustedPrice;
                        await _unitOfWork.ServiceRequestCategories.UpdateAsync(src);
                        totalServiceCharge += adjustedPrice;
                    }
                    else
                    {
                        var category = await _unitOfWork.ServiceCategories.GetByIdAsync(src.CategoryId);
                        totalServiceCharge += src.AdjustedPrice ?? category?.BasePrice ?? 0;
                    }
                }
                var serviceTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == bill.ServiceRequestId);
                totalServiceCharge += serviceTasks.Sum(t => t.Price ?? 0);
                
                bill.ServiceCharge = totalServiceCharge;
            }
            else if (dto.ServiceCharge.HasValue)
            {
                bill.ServiceCharge = dto.ServiceCharge.Value;
            }
            else
            {
                var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.FindAsync(
                    src => src.ServiceRequestId == bill.ServiceRequestId);
                var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
                
                decimal totalServiceCharge = 0;
                foreach (var src in serviceRequestCategories)
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == src.CategoryId);
                    totalServiceCharge += src.AdjustedPrice ?? category?.BasePrice ?? 0;
                }
                var serviceTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == bill.ServiceRequestId);
                totalServiceCharge += serviceTasks.Sum(t => t.Price ?? 0);
                
                bill.ServiceCharge = totalServiceCharge;
            }

            decimal subtotal = bill.ServiceCharge + bill.PartsCharge;
            if (dto.DiscountPercentage.HasValue && dto.DiscountPercentage.Value > 0)
            {
                bill.Discount = subtotal * (dto.DiscountPercentage.Value / 100);
            }
            else if (dto.Discount.HasValue)
            {
                bill.Discount = dto.Discount.Value;
            }
            
            const decimal TAX_RATE = 10m;
            bill.Tax = subtotal * (TAX_RATE / 100);

            bill.TotalAmount = subtotal + bill.Tax - bill.Discount;

            await _unitOfWork.Bills.UpdateAsync(bill);
            if (dto.FinalizeBill)
            {
                var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(bill.ServiceRequestId);
                if (serviceRequest != null)
                {
                    serviceRequest.Status = ServiceStatus.Closed;
                    serviceRequest.ActualCost = bill.TotalAmount;
                    await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
                    try
                    {
                        var customer = await _unitOfWork.Users.GetByIdAsync(serviceRequest.CustomerId);
                        if (customer != null)
                        {
                            await _notificationTrigger.NotifyBillGeneratedAsync(bill, customer, null);
                            await _notificationTrigger.NotifyCustomerPaymentRequiredAsync(serviceRequest, customer, bill);
                        }
                    }
                    catch {  }
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { bill })).First();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var bill = await _unitOfWork.Bills.GetByIdAsync(id);
            
            if (bill == null)
            {
                throw new NotFoundException("Bill", id);
            }
            var hasPayments = await _unitOfWork.Payments.ExistsAsync(p => p.BillId == id);
            if (hasPayments)
            {
                throw new BadRequestException("Cannot delete bill with existing payments");
            }

            await _unitOfWork.Bills.DeleteAsync(bill);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<BillDto> RecalculateAsync(int id)
        {
            var bill = await _unitOfWork.Bills.GetByIdAsync(id);
            
            if (bill == null)
            {
                throw new NotFoundException("Bill", id);
            }
            bill.PartsCharge = await _servicePartService.GetTotalPartsChargeAsync(bill.ServiceRequestId);
            var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.FindAsync(
                src => src.ServiceRequestId == bill.ServiceRequestId);
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            
            decimal serviceCharge = 0;
            foreach (var src in serviceRequestCategories)
            {
                var category = categories.FirstOrDefault(c => c.CategoryId == src.CategoryId);
                serviceCharge += src.AdjustedPrice ?? category?.BasePrice ?? 0;
            }
            var serviceTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == bill.ServiceRequestId);
            serviceCharge += serviceTasks.Sum(t => t.Price ?? 0);
            
            bill.ServiceCharge = serviceCharge;
            decimal subtotal = bill.ServiceCharge + bill.PartsCharge;
            bill.TotalAmount = subtotal + bill.Tax - bill.Discount;

            await _unitOfWork.Bills.UpdateAsync(bill);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { bill })).First();
        }

        private string GenerateBillNumber()
        {
            return $"BILL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        private async Task<IEnumerable<BillDto>> MapToDtos(IEnumerable<Bill> bills)
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.GetAllAsync();
            var serviceParts = await _unitOfWork.ServiceParts.GetAllAsync();
            var parts = await _unitOfWork.Parts.GetAllAsync();
            var serviceTasks = await _unitOfWork.ServiceTasks.GetAllAsync();

            return bills.Select(b =>
            {
                var serviceRequest = serviceRequests.FirstOrDefault(sr => sr.ServiceRequestId == b.ServiceRequestId);
                var customer = serviceRequest != null 
                    ? users.FirstOrDefault(u => u.UserId == serviceRequest.CustomerId) 
                    : null;
                var vehicle = serviceRequest != null 
                    ? vehicles.FirstOrDefault(v => v.VehicleId == serviceRequest.VehicleId) 
                    : null;
                var billPayments = payments.Where(p => p.BillId == b.BillId).ToList();
                var amountPaid = billPayments.Sum(p => p.AmountPaid);
                var balanceDue = b.TotalAmount - amountPaid;

                string paymentStatus;
                if (balanceDue <= 0) paymentStatus = PaymentStatus.Paid;
                else if (amountPaid > 0) paymentStatus = PaymentStatus.PartiallyPaid;
                else paymentStatus = PaymentStatus.Pending;
                var requestCategories = serviceRequestCategories
                    .Where(src => src.ServiceRequestId == b.ServiceRequestId)
                    .ToList();
                var serviceItems = requestCategories.Select(src =>
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == src.CategoryId);
                    var basePrice = category?.BasePrice ?? 0;
                    return new BillServiceItemDto
                    {
                        CategoryId = src.CategoryId,
                        CategoryName = category?.CategoryName ?? "Unknown",
                        OriginalPrice = basePrice,
                        AdjustedPrice = src.AdjustedPrice ?? basePrice
                    };
                }).ToList();
                if (!serviceItems.Any() && serviceRequest != null)
                {
                    var category = categories.FirstOrDefault(c => c.CategoryId == serviceRequest.CategoryId);
                    if (category != null)
                    {
                        serviceItems.Add(new BillServiceItemDto
                        {
                            CategoryId = category.CategoryId,
                            CategoryName = category.CategoryName,
                            OriginalPrice = category.BasePrice,
                            AdjustedPrice = category.BasePrice
                        });
                    }
                }
                var requestParts = serviceParts.Where(sp => sp.ServiceRequestId == b.ServiceRequestId).ToList();
                var partItems = requestParts.Select(sp =>
                {
                    var part = parts.FirstOrDefault(p => p.PartId == sp.PartId);
                    return new BillPartItemDto
                    {
                        ServicePartId = sp.ServicePartId,
                        PartId = sp.PartId,
                        PartName = part?.PartName ?? "Unknown",
                        PartNumber = part?.PartNumber ?? "",
                        Quantity = sp.QuantityUsed,
                        UnitPrice = sp.UnitPrice,
                        TotalPrice = sp.TotalPrice
                    };
                }).ToList();

                decimal subtotal = b.ServiceCharge + b.PartsCharge;
                decimal discountPercentage = subtotal > 0 ? (b.Discount / subtotal) * 100 : 0;
                const decimal taxPercentage = 10m;

                return new BillDto
                {
                    BillId = b.BillId,
                    BillNumber = b.BillNumber,
                    ServiceRequestId = b.ServiceRequestId,
                    ServiceDescription = serviceRequest?.IssueDescription ?? "Unknown",
                    VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model} ({vehicle.RegistrationNumber})" : "Unknown",
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                    CustomerEmail = customer?.Email ?? "",
                    CustomerPhone = customer?.PhoneNumber ?? "",
                    CustomerId = customer?.UserId ?? 0,
                    ServiceCharge = b.ServiceCharge,
                    PartsCharge = b.PartsCharge,
                    SubTotal = subtotal,
                    Tax = b.Tax,
                    TaxPercentage = Math.Round(taxPercentage, 2),
                    Discount = b.Discount,
                    DiscountPercentage = Math.Round(discountPercentage, 2),
                    TotalAmount = b.TotalAmount,
                    AmountPaid = amountPaid,
                    BalanceDue = balanceDue,
                    GeneratedDate = b.GeneratedDate,
                    DueDate = b.GeneratedDate.AddDays(30),
                    PaymentStatus = paymentStatus,
                    IsClosed = serviceRequest?.Status == ServiceStatus.Closed,
                    ServiceItems = serviceItems,
                    PartItems = partItems,
                    Payments = billPayments.Select(p => new BillPaymentDto
                    {
                        PaymentId = p.PaymentId,
                        AmountPaid = p.AmountPaid,
                        PaymentDate = p.PaymentDate,
                        PaymentMethod = p.PaymentMethod,
                        TransactionId = p.TransactionId
                    }).ToList(),
                    Tasks = serviceTasks
                        .Where(t => t.ServiceRequestId == b.ServiceRequestId)
                        .OrderBy(t => t.OrderIndex)
                        .Select(t => new ServiceTaskDto
                        {
                            ServiceTaskId = t.ServiceTaskId,
                            ServiceRequestId = t.ServiceRequestId,
                            Description = t.Description,
                            IsCompleted = t.IsCompleted,
                            CompletedDate = t.CompletedDate,
                            CompletedByUserId = t.CompletedByUserId,
                            CompletedByName = t.CompletedByUserId.HasValue 
                                ? users.FirstOrDefault(u => u.UserId == t.CompletedByUserId)?.FirstName + " " + 
                                  users.FirstOrDefault(u => u.UserId == t.CompletedByUserId)?.LastName 
                                : null,
                            Price = t.Price,
                            OrderIndex = t.OrderIndex
                        }).ToList()
                };
            });
        }

        private async Task<IEnumerable<BillSummaryDto>> MapToSummaryDtos(IEnumerable<Bill> bills)
        {
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var payments = await _unitOfWork.Payments.GetAllAsync();

            return bills.Select(b =>
            {
                var serviceRequest = serviceRequests.FirstOrDefault(sr => sr.ServiceRequestId == b.ServiceRequestId);
                var customer = serviceRequest != null 
                    ? users.FirstOrDefault(u => u.UserId == serviceRequest.CustomerId) 
                    : null;
                var vehicle = serviceRequest != null 
                    ? vehicles.FirstOrDefault(v => v.VehicleId == serviceRequest.VehicleId) 
                    : null;
                var billPayments = payments.Where(p => p.BillId == b.BillId).ToList();
                var amountPaid = billPayments.Sum(p => p.AmountPaid);
                var balanceDue = b.TotalAmount - amountPaid;

                string paymentStatus;
                if (balanceDue <= 0) paymentStatus = PaymentStatus.Paid;
                else if (amountPaid > 0) paymentStatus = PaymentStatus.PartiallyPaid;
                else paymentStatus = PaymentStatus.Pending;

                return new BillSummaryDto
                {
                    BillId = b.BillId,
                    BillNumber = b.BillNumber,
                    ServiceRequestId = b.ServiceRequestId,
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                    VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model} ({vehicle.RegistrationNumber})" : "Unknown",
                    TotalAmount = b.TotalAmount,
                    AmountPaid = amountPaid,
                    BalanceDue = balanceDue,
                    GeneratedDate = b.GeneratedDate,
                    DueDate = b.GeneratedDate.AddDays(30),
                    PaymentStatus = paymentStatus,
                    IsClosed = serviceRequest?.Status == ServiceStatus.Closed
                };
            });
        }
    }
}
