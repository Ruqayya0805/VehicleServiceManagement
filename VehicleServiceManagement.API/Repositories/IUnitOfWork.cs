using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<User> Users { get; }
        IRepository<Vehicle> Vehicles { get; }
        IRepository<ServiceCategory> ServiceCategories { get; }
        IRepository<ServiceRequest> ServiceRequests { get; }
        IRepository<ServiceRequestCategory> ServiceRequestCategories { get; }
        IRepository<ServiceTask> ServiceTasks { get; }
        IRepository<ServiceAssignment> ServiceAssignments { get; }
        IRepository<Part> Parts { get; }
        IRepository<ServicePart> ServiceParts { get; }
        IRepository<PartOrder> PartOrders { get; }
        IRepository<Bill> Bills { get; }
        IRepository<Payment> Payments { get; }

        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}