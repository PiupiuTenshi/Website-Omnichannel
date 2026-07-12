using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class StoreSettingsRepository : IStoreSettingsRepository
{
    private readonly ApplicationDbContext applicationDbContext;

    public StoreSettingsRepository(ApplicationDbContext applicationDbContext)
    {
        this.applicationDbContext = applicationDbContext;
    }

    public Task<StoreSettings?> GetAsync(CancellationToken cancellationToken)
    {
        return applicationDbContext.StoreSettings
            .Include(settings => settings.ContactNumbers)
            .SingleOrDefaultAsync(settings => settings.StoreSettingsId == StoreSettings.DEFAULT_ID, cancellationToken);
    }

    public Task AddAsync(StoreSettings storeSettings, CancellationToken cancellationToken)
    {
        return applicationDbContext.StoreSettings.AddAsync(storeSettings, cancellationToken).AsTask();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return applicationDbContext.SaveChangesAsync(cancellationToken);
    }
}
