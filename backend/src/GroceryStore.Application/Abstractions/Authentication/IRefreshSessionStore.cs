using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Authentication;

public interface IRefreshSessionStore
{
    Task AddAsync(RefreshSession refreshSession, CancellationToken cancellationToken);

    Task<RefreshSession?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
