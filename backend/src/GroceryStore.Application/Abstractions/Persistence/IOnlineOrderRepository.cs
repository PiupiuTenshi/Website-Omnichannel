using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IOnlineOrderRepository
{
    Task<bool> IsOnlineOrderingEnabledAsync(CancellationToken cancellationToken);
    Task AddAsync(OnlineOrder order, CancellationToken cancellationToken);
    Task CaptureAllocationsAsync(OnlineOrder order, string guestSessionId, CancellationToken cancellationToken);
    Task<OnlineOrder?> GetAccessibleAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, CancellationToken cancellationToken);
    Task<OnlineOrder?> GetForManagementAsync(Guid onlineOrderId, CancellationToken cancellationToken);
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
