using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.DTOs.Payment;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly NotificationTriggerService _notificationTrigger;

        public PaymentService(IUnitOfWork unitOfWork, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _notificationTrigger = notificationTrigger;
        }

        public async Task<IEnumerable<PaymentDto>> GetAllAsync()
        {
            var payments = await _unitOfWork.Payments.GetAllAsync();
            return await MapToDtos(payments);
        }

        public async Task<PaymentDto?> GetByIdAsync(int id)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(id);
            if (payment == null) return null;

            return (await MapToDtos(new[] { payment })).FirstOrDefault();
        }

        public async Task<IEnumerable<PaymentDto>> GetByBillIdAsync(int billId)
        {
            var payments = await _unitOfWork.Payments.FindAsync(p => p.BillId == billId);
            return await MapToDtos(payments.OrderByDescending(p => p.PaymentDate));
        }

        public async Task<PaymentDto> ProcessPaymentAsync(int billId, ProcessPaymentDto dto)
        {
            var bill = await _unitOfWork.Bills.GetByIdAsync(billId);
            if (bill == null)
            {
                throw new NotFoundException("Bill", billId);
            }
            var existingPayments = await _unitOfWork.Payments.FindAsync(p => p.BillId == billId);
            var totalPaid = existingPayments.Sum(p => p.AmountPaid);
            var remainingBalance = bill.TotalAmount - totalPaid;

            if (dto.Amount > remainingBalance)
            {
                throw new BadRequestException($"Payment amount ({dto.Amount:C}) exceeds remaining balance ({remainingBalance:C})");
            }

            var payment = new Payment
            {
                BillId = billId,
                AmountPaid = dto.Amount,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = dto.PaymentMethod,
                TransactionId = dto.TransactionId ?? GenerateTransactionId(),
                PaymentStatus = PaymentStatus.Paid
            };

            await _unitOfWork.Payments.AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(bill.ServiceRequestId);
            var customer = serviceRequest != null ? await _unitOfWork.Users.GetByIdAsync(serviceRequest.CustomerId) : null;
            try
            {
                if (customer != null)
                {
                    await _notificationTrigger.NotifyPaymentReceivedAsync(payment, bill, customer);
                }
            }
            catch {  }

            return (await MapToDtos(new[] { payment })).First();
        }

        public async Task<PaymentDto> UpdateAsync(int id, UpdatePaymentDto dto)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(id);
            
            if (payment == null)
            {
                throw new NotFoundException("Payment", id);
            }

            if (dto.AmountPaid.HasValue)
            {
                var bill = await _unitOfWork.Bills.GetByIdAsync(payment.BillId);
                if (bill != null)
                {
                    var otherPayments = await _unitOfWork.Payments.FindAsync(p => 
                        p.BillId == payment.BillId && p.PaymentId != id);
                    var otherPaymentsTotal = otherPayments.Sum(p => p.AmountPaid);
                    
                    if (dto.AmountPaid.Value + otherPaymentsTotal > bill.TotalAmount)
                    {
                        throw new BadRequestException("Payment amount would exceed bill total");
                    }
                }
                
                payment.AmountPaid = dto.AmountPaid.Value;
            }

            if (dto.PaymentMethod != null) payment.PaymentMethod = dto.PaymentMethod;
            if (dto.TransactionId != null) payment.TransactionId = dto.TransactionId;
            if (dto.PaymentStatus != null) payment.PaymentStatus = dto.PaymentStatus;

            await _unitOfWork.Payments.UpdateAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { payment })).First();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(id);
            
            if (payment == null)
            {
                throw new NotFoundException("Payment", id);
            }

            await _unitOfWork.Payments.DeleteAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RefundAsync(int id)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(id);
            
            if (payment == null)
            {
                throw new NotFoundException("Payment", id);
            }

            if (payment.PaymentStatus == PaymentStatus.Refunded)
            {
                throw new BadRequestException("Payment has already been refunded");
            }

            payment.PaymentStatus = PaymentStatus.Refunded;
            await _unitOfWork.Payments.UpdateAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        private string GenerateTransactionId()
        {
            return $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
        }

        private async Task<IEnumerable<PaymentDto>> MapToDtos(IEnumerable<Payment> payments)
        {
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var users = await _unitOfWork.Users.GetAllAsync();

            return payments.Select(p =>
            {
                var bill = bills.FirstOrDefault(b => b.BillId == p.BillId);
                var serviceRequest = bill != null 
                    ? serviceRequests.FirstOrDefault(sr => sr.ServiceRequestId == bill.ServiceRequestId) 
                    : null;
                var customer = serviceRequest != null 
                    ? users.FirstOrDefault(u => u.UserId == serviceRequest.CustomerId) 
                    : null;

                return new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    BillId = p.BillId,
                    BillNumber = bill?.BillNumber ?? "Unknown",
                    AmountPaid = p.AmountPaid,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    TransactionId = p.TransactionId,
                    PaymentStatus = p.PaymentStatus,
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown"
                };
            });
        }
    }
}
