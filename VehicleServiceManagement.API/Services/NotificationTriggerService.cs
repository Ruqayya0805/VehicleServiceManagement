using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    /// <summary>
    /// Helper class for triggering in-app notifications for various events
    /// Can be injected and used by other services/controllers
    /// </summary>
    public class NotificationTriggerService
    {
        private readonly IInAppNotificationService _notificationService;
        private readonly ILogger<NotificationTriggerService> _logger;

        public NotificationTriggerService(
            IInAppNotificationService notificationService,
            ILogger<NotificationTriggerService> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Notify Service Managers when a new service request is created
        /// </summary>
        public async Task NotifyServiceRequestCreatedAsync(
            ServiceRequest request,
            Vehicle vehicle,
            User customer)
        {
            try
            {
                var title = "New Service Request";
                var message = $"{customer.FirstName} {customer.LastName} created a service request for {vehicle.Make} {vehicle.Model} ({vehicle.RegistrationNumber})";
                var actionUrl = $"/app/service-requests?id={request.ServiceRequestId}";
                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.ServiceRequestCreated,
                    customer.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service request created notifications");
            }
        }

        /// <summary>
        /// Notify technician when assigned to a service request
        /// </summary>
        public async Task NotifyTechnicianAssignedAsync(
            ServiceRequest request,
            User technician,
            Vehicle vehicle,
            int? assignedByUserId = null)
        {
            try
            {
                var title = "New Assignment";
                var message = $"You have been assigned to service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model}";
                var actionUrl = $"/app/assignments";

                await _notificationService.CreateForUserAsync(
                    technician.UserId,
                    title,
                    message,
                    InAppNotificationType.TechnicianAssigned,
                    assignedByUserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send technician assignment notification");
            }
        }

        /// <summary>
        /// Notify customer when service is completed
        /// </summary>
        public async Task NotifyServiceCompletedAsync(
            ServiceRequest request,
            User customer,
            int? completedByUserId = null)
        {
            try
            {
                var title = "Service Completed";
                var message = $"Your service request #{request.ServiceRequestId} has been completed. Please review your bill.";
                var actionUrl = $"/app/service-history";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.ServiceRequestCompleted,
                    completedByUserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service completed notification");
            }
        }

        /// <summary>
        /// Notify customer when service status changes
        /// </summary>
        public async Task NotifyServiceStatusChangedAsync(
            ServiceRequest request,
            User customer,
            string newStatus,
            int? changedByUserId = null)
        {
            try
            {
                var title = $"Service Status: {newStatus}";
                var message = $"Your service request #{request.ServiceRequestId} status has been updated to {newStatus}";
                var actionUrl = $"/app/track-service";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.ServiceRequestUpdated,
                    changedByUserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send status change notification");
            }
        }

        /// <summary>
        /// Notify customer when bill is generated
        /// </summary>
        public async Task NotifyBillGeneratedAsync(
            Bill bill,
            User customer,
            int? generatedByUserId = null)
        {
            try
            {
                var title = "Bill Generated";
                var message = $"A bill of {bill.TotalAmount:C} has been generated for your service request #{bill.ServiceRequestId}";
                var actionUrl = $"/app/bills/{bill.BillId}";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.BillGenerated,
                    generatedByUserId,
                    bill.BillId,
                    "Bill",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send bill generated notification");
            }
        }

        /// <summary>
        /// Notify managers when payment is received
        /// </summary>
        public async Task NotifyPaymentReceivedAsync(
            Payment payment,
            Bill bill,
            User customer)
        {
            try
            {
                var title = "Payment Received";
                var message = $"{customer.FirstName} {customer.LastName} made a payment of {payment.AmountPaid:C} for bill #{bill.BillNumber}";
                var actionUrl = $"/app/bills/{bill.BillId}";
                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.PaymentReceived,
                    customer.UserId,
                    payment.PaymentId,
                    "Payment",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send payment received notification");
            }
        }

        /// <summary>
        /// Notify staff when account is approved
        /// </summary>
        public async Task NotifyAccountApprovedAsync(User user, int? approvedByUserId = null)
        {
            try
            {
                var title = "Account Approved";
                var message = "Your account has been approved. You can now log in and start working.";
                var actionUrl = "/login";

                await _notificationService.CreateForUserAsync(
                    user.UserId,
                    title,
                    message,
                    InAppNotificationType.AccountApproved,
                    approvedByUserId,
                    user.UserId,
                    "User",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send account approved notification");
            }
        }

        /// <summary>
        /// Notify managers about low stock
        /// </summary>
        public async Task NotifyLowStockAsync(Part part)
        {
            try
            {
                var title = "Low Stock Alert";
                var message = $"{part.PartName} is running low. Current stock: {part.QuantityInStock}, Reorder Level: {part.ReorderLevel}";
                var actionUrl = $"/app/parts";

                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.LowStockAlert,
                    null,
                    part.PartId,
                    "Part",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send low stock notification");
            }
        }

        #region Customer Notifications

        /// <summary>
        /// Notify customer when a technician has been assigned to their service request
        /// </summary>
        public async Task NotifyCustomerTechnicianAssignedAsync(
            ServiceRequest request,
            User customer,
            User technician,
            Vehicle vehicle)
        {
            try
            {
                var title = "Technician Assigned";
                var message = $"Technician {technician.FirstName} {technician.LastName} has been assigned to your service request for {vehicle.Make} {vehicle.Model}";
                var actionUrl = $"/app/track-service";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.TechnicianAssigned,
                    null,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send customer technician assigned notification");
            }
        }

        /// <summary>
        /// Notify customer when technician starts working on their vehicle
        /// </summary>
        public async Task NotifyCustomerWorkStartedAsync(
            ServiceRequest request,
            User customer,
            int? technicianId = null)
        {
            try
            {
                var title = "Service Started";
                var message = $"Work has begun on your service request #{request.ServiceRequestId}. Your vehicle is now being serviced.";
                var actionUrl = $"/app/track-service";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.AssignmentStarted,
                    technicianId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send customer work started notification");
            }
        }

        /// <summary>
        /// Notify customer and service managers when technician reopens a service
        /// </summary>
        public async Task NotifyServiceReopenedAsync(
            ServiceRequest request,
            User customer,
            User technician,
            Vehicle vehicle)
        {
            try
            {
                var customerTitle = "Service Reopened";
                var customerMessage = $"Your service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model} has been reopened for additional work.";
                var customerActionUrl = $"/app/track-service";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    customerTitle,
                    customerMessage,
                    InAppNotificationType.ServiceReopened,
                    technician.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    customerActionUrl);
                var managerTitle = "Service Reopened by Technician";
                var managerMessage = $"Technician {technician.FirstName} {technician.LastName} reopened service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model}";
                var managerActionUrl = $"/app/service-requests?id={request.ServiceRequestId}";

                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    managerTitle,
                    managerMessage,
                    InAppNotificationType.ServiceReopened,
                    technician.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    managerActionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service reopened notifications");
            }
        }

        /// <summary>
        /// Notify customer when service is closed and payment is required
        /// </summary>
        public async Task NotifyCustomerPaymentRequiredAsync(
            ServiceRequest request,
            User customer,
            Bill bill)
        {
            try
            {
                var title = "Payment Required";
                var message = $"Your service request #{request.ServiceRequestId} has been closed. Total amount due: {bill.TotalAmount:C}. Please complete your payment.";
                var actionUrl = $"/app/bills/{bill.BillId}";

                await _notificationService.CreateForUserAsync(
                    customer.UserId,
                    title,
                    message,
                    InAppNotificationType.PaymentRequired,
                    null,
                    bill.BillId,
                    "Bill",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send customer payment required notification");
            }
        }

        #endregion

        #region Service Manager Notifications

        /// <summary>
        /// Notify service managers when a customer cancels a service request
        /// </summary>
        public async Task NotifyManagerServiceCancelledAsync(
            ServiceRequest request,
            User customer,
            Vehicle vehicle,
            string reason)
        {
            try
            {
                var title = "Service Request Cancelled";
                var message = $"{customer.FirstName} {customer.LastName} cancelled service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model}. Reason: {reason}";
                var actionUrl = $"/app/service-requests?id={request.ServiceRequestId}";

                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.ServiceRequestCancelled,
                    customer.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service cancelled notification to managers");
            }
        }

        /// <summary>
        /// Notify service managers when a customer reschedules a service request
        /// </summary>
        public async Task NotifyManagerServiceRescheduledAsync(
            ServiceRequest request,
            User customer,
            Vehicle vehicle,
            DateTime newDate)
        {
            try
            {
                var title = "Service Rescheduled";
                var message = $"{customer.FirstName} {customer.LastName} rescheduled service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model} to {newDate:MMM dd, yyyy}";
                var actionUrl = $"/app/service-requests?id={request.ServiceRequestId}";

                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.ServiceRequestRescheduled,
                    customer.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service rescheduled notification to managers");
            }
        }

        /// <summary>
        /// Notify service managers when technician completes work
        /// </summary>
        public async Task NotifyManagerWorkCompletedAsync(
            ServiceRequest request,
            User technician,
            Vehicle vehicle)
        {
            try
            {
                var title = "Service Work Completed";
                var message = $"Technician {technician.FirstName} {technician.LastName} completed work on service request #{request.ServiceRequestId} for {vehicle.Make} {vehicle.Model}";
                var actionUrl = $"/app/service-requests?id={request.ServiceRequestId}";

                await _notificationService.CreateForRoleAsync(
                    "ServiceManager",
                    title,
                    message,
                    InAppNotificationType.AssignmentCompleted,
                    technician.UserId,
                    request.ServiceRequestId,
                    "ServiceRequest",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send work completed notification to managers");
            }
        }

        #endregion

        #region Admin Notifications

        /// <summary>
        /// Notify admins when a staff member registers and requires approval
        /// </summary>
        public async Task NotifyAdminStaffApprovalRequiredAsync(User staffMember)
        {
            try
            {
                var title = "Staff Approval Required";
                var message = $"{staffMember.FirstName} {staffMember.LastName} ({staffMember.Email}) has registered as {staffMember.Role} and requires approval.";
                var actionUrl = $"/app/users";

                await _notificationService.CreateForRoleAsync(
                    "Admin",
                    title,
                    message,
                    InAppNotificationType.StaffApprovalRequested,
                    staffMember.UserId,
                    staffMember.UserId,
                    "User",
                    actionUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send staff approval notification to admins");
            }
        }

        #endregion
    }
}
