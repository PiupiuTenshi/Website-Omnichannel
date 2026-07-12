using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IStoreSettingsRepository
{
    Task<StoreSettings?> GetAsync(CancellationToken cancellationToken);

    Task AddAsync(StoreSettings storeSettings, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
