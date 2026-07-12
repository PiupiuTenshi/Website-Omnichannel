using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class InventoryRepository : IInventoryRepository
{
    private readonly ApplicationDbContext applicationDbContext;

    public InventoryRepository(ApplicationDbContext applicationDbContext)
    {
        this.applicationDbContext = applicationDbContext;
    }

    public Task<Supplier?> GetSupplierAsync(Guid supplierId, CancellationToken cancellationToken) =>
        applicationDbContext.Suppliers.SingleOrDefaultAsync(supplier => supplier.SupplierId == supplierId, cancellationToken);

    public async Task<IReadOnlyList<Supplier>> GetSuppliersAsync(CancellationToken cancellationToken) =>
        await applicationDbContext.Suppliers.AsNoTracking().OrderBy(supplier => supplier.Name).ToArrayAsync(cancellationToken);

    public Task<bool> ProductExistsAsync(Guid productId, CancellationToken cancellationToken) =>
        applicationDbContext.Products.AnyAsync(product => product.ProductId == productId, cancellationToken);

    public Task<bool> ProductVariantExistsAsync(Guid productVariantId, CancellationToken cancellationToken) =>
        applicationDbContext.ProductVariants.AnyAsync(variant => variant.ProductVariantId == productVariantId && variant.IsActive, cancellationToken);

    public Task<InventoryBatch?> GetBatchAsync(Guid inventoryBatchId, CancellationToken cancellationToken) =>
        applicationDbContext.InventoryBatches.SingleOrDefaultAsync(batch => batch.InventoryBatchId == inventoryBatchId, cancellationToken);

    public async Task<IReadOnlyList<InventoryBatch>> GetBatchesAsync(Guid? productVariantId, CancellationToken cancellationToken)
    {
        var query = applicationDbContext.InventoryBatches.AsNoTracking();
        if (productVariantId is not null)
        {
            query = query.Where(batch => batch.ProductVariantId == productVariantId);
        }

        return await query.OrderBy(batch => batch.ExpiresAtUtc == null).ThenBy(batch => batch.ExpiresAtUtc).ThenBy(batch => batch.ReceivedAtUtc).ToArrayAsync(cancellationToken);
    }

    public Task AddSupplierAsync(Supplier supplier, CancellationToken cancellationToken) =>
        applicationDbContext.Suppliers.AddAsync(supplier, cancellationToken).AsTask();

    public Task AddProductSupplierAsync(ProductSupplier productSupplier, CancellationToken cancellationToken) =>
        applicationDbContext.ProductSuppliers.AddAsync(productSupplier, cancellationToken).AsTask();

    public Task AddBatchAsync(InventoryBatch batch, CancellationToken cancellationToken) =>
        applicationDbContext.InventoryBatches.AddAsync(batch, cancellationToken).AsTask();

    public Task AddTransactionAsync(InventoryTransaction transaction, CancellationToken cancellationToken) =>
        applicationDbContext.InventoryTransactions.AddAsync(transaction, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken) => applicationDbContext.SaveChangesAsync(cancellationToken);
}
