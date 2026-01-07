using Microsoft.EntityFrameworkCore.Storage;
using VehicleServiceManagement.API.Data;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction? _transaction;

        public IRepository<User> Users { get; }
        public IRepository<Vehicle> Vehicles { get; }
        public IRepository<ServiceCategory> ServiceCategories { get; }
        public IRepository<ServiceRequest> ServiceRequests { get; }
        public IRepository<ServiceRequestCategory> ServiceRequestCategories { get; }
        public IRepository<ServiceTask> ServiceTasks { get; }
        public IRepository<ServiceAssignment> ServiceAssignments { get; }
        public IRepository<Part> Parts { get; }
        public IRepository<ServicePart> ServiceParts { get; }
        public IRepository<PartOrder> PartOrders { get; }
        public IRepository<Bill> Bills { get; }
        public IRepository<Payment> Payments { get; }

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;

            Users = new Repository<User>(_context);
            Vehicles = new Repository<Vehicle>(_context);
            ServiceCategories = new Repository<ServiceCategory>(_context);
            ServiceRequests = new Repository<ServiceRequest>(_context);
            ServiceRequestCategories = new Repository<ServiceRequestCategory>(_context);
            ServiceTasks = new Repository<ServiceTask>(_context);
            ServiceAssignments = new Repository<ServiceAssignment>(_context);
            Parts = new Repository<Part>(_context);
            ServiceParts = new Repository<ServicePart>(_context);
            PartOrders = new Repository<PartOrder>(_context);
            Bills = new Repository<Bill>(_context);
            Payments = new Repository<Payment>(_context);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
                if (_transaction != null)
                {
                    await _transaction.CommitAsync();
                }
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}