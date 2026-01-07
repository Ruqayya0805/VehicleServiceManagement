namespace VehicleServiceManagement.API.Enums
{
    /// <summary>
    /// Types of in-app notifications
    /// </summary>
    public enum InAppNotificationType
    {
        ServiceRequestCreated,
        ServiceRequestUpdated,
        ServiceRequestCancelled,
        ServiceRequestCompleted,
        ServiceRequestRescheduled,
        ServiceRequestClosed,
        TechnicianAssigned,
        AssignmentStarted,
        AssignmentCompleted,
        ServiceReopened,
        BillGenerated,
        PaymentReceived,
        PaymentOverdue,
        PaymentRequired,
        PartOrderCreated,
        PartOrderReceived,
        LowStockAlert,
        AccountApproved,
        AccountRejected,
        PasswordChanged,
        StaffApprovalRequested,
        SystemAlert,
        Reminder
    }
}
