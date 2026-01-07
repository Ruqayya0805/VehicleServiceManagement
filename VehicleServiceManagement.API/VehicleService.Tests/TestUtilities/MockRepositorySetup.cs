using System.Linq.Expressions;
using Moq;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;

namespace VehicleServiceManagement.Tests.TestUtilities
{
    /// <summary>
    /// Helper class for setting up mock repositories with common configurations
    /// </summary>
    public static class MockRepositorySetup
    {
        /// <summary>
        /// Creates a basic mock IUnitOfWork with empty repositories
        /// </summary>
        public static Mock<IUnitOfWork> CreateMockUnitOfWork()
        {
            var mockUnitOfWork = new Mock<IUnitOfWork>();

            // Setup SaveChangesAsync to return 1 by default
            mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Setup empty repositories
            SetupEmptyRepository<User>(mockUnitOfWork, u => u.Users);
            SetupEmptyRepository<Vehicle>(mockUnitOfWork, u => u.Vehicles);
            SetupEmptyRepository<ServiceCategory>(mockUnitOfWork, u => u.ServiceCategories);
            SetupEmptyRepository<ServiceRequest>(mockUnitOfWork, u => u.ServiceRequests);
            SetupEmptyRepository<ServiceRequestCategory>(mockUnitOfWork, u => u.ServiceRequestCategories);
            SetupEmptyRepository<ServiceTask>(mockUnitOfWork, u => u.ServiceTasks);
            SetupEmptyRepository<ServiceAssignment>(mockUnitOfWork, u => u.ServiceAssignments);
            SetupEmptyRepository<Part>(mockUnitOfWork, u => u.Parts);
            SetupEmptyRepository<ServicePart>(mockUnitOfWork, u => u.ServiceParts);
            SetupEmptyRepository<PartOrder>(mockUnitOfWork, u => u.PartOrders);
            SetupEmptyRepository<Bill>(mockUnitOfWork, u => u.Bills);
            SetupEmptyRepository<Payment>(mockUnitOfWork, u => u.Payments);

            return mockUnitOfWork;
        }

        /// <summary>
        /// Sets up an empty repository for a given type
        /// </summary>
        private static void SetupEmptyRepository<T>(
            Mock<IUnitOfWork> mockUnitOfWork,
            Expression<Func<IUnitOfWork, IRepository<T>>> repositorySelector) where T : class
        {
            var mockRepo = new Mock<IRepository<T>>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<T>());
            mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<T, bool>>>())).ReturnsAsync(new List<T>());
            mockRepo.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<T, bool>>>())).ReturnsAsync(false);
            mockRepo.Setup(r => r.AddAsync(It.IsAny<T>())).ReturnsAsync((T entity) => entity);
            mockRepo.Setup(r => r.UpdateAsync(It.IsAny<T>())).Returns(Task.CompletedTask);
            mockRepo.Setup(r => r.DeleteAsync(It.IsAny<T>())).Returns(Task.CompletedTask);

            mockUnitOfWork.SetupGet(repositorySelector).Returns(mockRepo.Object);
        }

        /// <summary>
        /// Sets up a repository with specific data
        /// </summary>
        public static Mock<IRepository<T>> SetupRepositoryWithData<T>(
            Mock<IUnitOfWork> mockUnitOfWork,
            Expression<Func<IUnitOfWork, IRepository<T>>> repositorySelector,
            List<T> data) where T : class
        {
            var mockRepo = new Mock<IRepository<T>>();

            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(data);
            mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<T, bool>>>()))
                .ReturnsAsync((Expression<Func<T, bool>> predicate) =>
                    data.AsQueryable().Where(predicate).ToList());
            mockRepo.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<T, bool>>>()))
                .ReturnsAsync((Expression<Func<T, bool>> predicate) =>
                    data.AsQueryable().Any(predicate));
            mockRepo.Setup(r => r.AddAsync(It.IsAny<T>())).ReturnsAsync((T entity) => entity);
            mockRepo.Setup(r => r.UpdateAsync(It.IsAny<T>())).Returns(Task.CompletedTask);
            mockRepo.Setup(r => r.DeleteAsync(It.IsAny<T>())).Returns(Task.CompletedTask);

            mockUnitOfWork.SetupGet(repositorySelector).Returns(mockRepo.Object);

            return mockRepo;
        }

        /// <summary>
        /// Sets up GetByIdAsync for a repository
        /// </summary>
        public static void SetupGetById<T>(
            Mock<IRepository<T>> mockRepo,
            T entity) where T : class
        {
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(entity);
        }

        /// <summary>
        /// Sets up GetByIdAsync to return specific entity based on ID
        /// </summary>
        public static void SetupGetByIdWithLookup<T>(
            Mock<IRepository<T>> mockRepo,
            Dictionary<int, T> entities) where T : class
        {
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((int id) => entities.TryGetValue(id, out var entity) ? entity : null);
        }
    }
}
