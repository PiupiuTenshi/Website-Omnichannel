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

    public async Task<IReadOnlyList<DetailedInventoryBatch>> GetDetailedBatchesAsync(Guid? productVariantId, CancellationToken cancellationToken)
    {
        var query = applicationDbContext.InventoryBatches.AsNoTracking();
        if (productVariantId is not null)
        {
            query = query.Where(batch => batch.ProductVariantId == productVariantId);
        }

        var resultQuery =
            from batch in query
            join variant in applicationDbContext.ProductVariants.AsNoTracking() on batch.ProductVariantId equals variant.ProductVariantId
            join product in applicationDbContext.Products.AsNoTracking() on variant.ProductId equals product.ProductId
            join unit in applicationDbContext.UnitsOfMeasure.AsNoTracking() on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            join supplier in applicationDbContext.Suppliers.AsNoTracking() on batch.SupplierId equals supplier.SupplierId into suppliers
            from supplier in suppliers.DefaultIfEmpty()
            select new DetailedInventoryBatch(
                batch.InventoryBatchId,
                batch.ProductVariantId,
                batch.SupplierId,
                batch.InitialQuantity,
                batch.AvailableQuantity,
                batch.UnitCost,
                batch.ReceivedAtUtc,
                batch.ManufacturedAtUtc,
                batch.ExpiresAtUtc,
                batch.Status,
                product.Name,
                variant.Name,
                variant.Sku,
                unit.Code,
                supplier == null ? "" : supplier.Name);

        return await resultQuery
            .OrderBy(batch => batch.ExpiresAtUtc == null)
            .ThenBy(batch => batch.ExpiresAtUtc)
            .ThenBy(batch => batch.ReceivedAtUtc)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LowStockInventoryItem>> GetLowStockItemsAsync(decimal minimumAvailableQuantity, CancellationToken cancellationToken)
    {
        var availableQuantities = applicationDbContext.InventoryBatches
            .AsNoTracking()
            .GroupBy(batch => batch.ProductVariantId)
            .Select(group => new { ProductVariantId = group.Key, AvailableQuantity = group.Sum(batch => batch.AvailableQuantity) });

        return await (
            from variant in applicationDbContext.ProductVariants.AsNoTracking()
            join product in applicationDbContext.Products.AsNoTracking() on variant.ProductId equals product.ProductId
            join unit in applicationDbContext.UnitsOfMeasure.AsNoTracking() on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            join quantity in availableQuantities on variant.ProductVariantId equals quantity.ProductVariantId into quantities
            from quantity in quantities.DefaultIfEmpty()
            where variant.IsActive && product.IsActive && (quantity == null || quantity.AvailableQuantity <= minimumAvailableQuantity)
            orderby product.Name, variant.Name
            select new LowStockInventoryItem(
                variant.ProductVariantId,
                product.Name,
                variant.Name,
                variant.Sku,
                unit.Code,
                quantity == null ? 0m : quantity.AvailableQuantity))
            .ToArrayAsync(cancellationToken);
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
