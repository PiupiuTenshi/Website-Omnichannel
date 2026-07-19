using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Features.Inventory;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
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
                supplier == null ? "" : supplier.Name,
                variant.SellingPrice,
                variant.CompareAtPrice);

        var list = await resultQuery.ToListAsync(cancellationToken);

        return list
            .OrderBy(batch => batch.ExpiresAtUtc == null)
            .ThenBy(batch => batch.ExpiresAtUtc)
            .ThenBy(batch => batch.ReceivedAtUtc)
            .ToArray();
    }

    public async Task<IReadOnlyList<LowStockInventoryItem>> GetLowStockItemsAsync(decimal minimumAvailableQuantity, CancellationToken cancellationToken)
    {
        var availableQuantities = await applicationDbContext.InventoryBatches
            .AsNoTracking()
            .GroupBy(batch => batch.ProductVariantId)
            .Select(group => new { ProductVariantId = group.Key, AvailableQuantity = group.Sum(batch => batch.AvailableQuantity) })
            .ToDictionaryAsync(item => item.ProductVariantId, item => item.AvailableQuantity, cancellationToken);

        var variants = await (
            from variant in applicationDbContext.ProductVariants.AsNoTracking()
            join product in applicationDbContext.Products.AsNoTracking() on variant.ProductId equals product.ProductId
            join unit in applicationDbContext.UnitsOfMeasure.AsNoTracking() on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            where variant.IsActive && product.IsActive
            orderby product.Name, variant.Name
            select new
            {
                variant.ProductVariantId,
                variant.ProductId,
                ProductName = product.Name,
                VariantName = variant.Name,
                variant.Sku,
                UnitCode = unit.Code
            })
            .ToListAsync(cancellationToken);

        var items = variants
            .Select(item => new
            {
                item.ProductVariantId,
                item.ProductId,
                item.ProductName,
                item.VariantName,
                item.Sku,
                item.UnitCode,
                AvailableQuantity = availableQuantities.GetValueOrDefault(item.ProductVariantId)
            })
            .Where(item => item.AvailableQuantity <= minimumAvailableQuantity)
            .ToArray();

        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        var variantIds = items.Select(i => i.ProductVariantId).Distinct().ToList();

        var productSuppliers = await (
            from ps in applicationDbContext.ProductSuppliers.AsNoTracking()
            join s in applicationDbContext.Suppliers.AsNoTracking() on ps.SupplierId equals s.SupplierId
            where productIds.Contains(ps.ProductId) && s.IsActive
            select new { ps.ProductId, ps.SupplierId, s.Name, ps.IsPreferred, ps.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        var productSuppliersDict = productSuppliers
            .GroupBy(ps => ps.ProductId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(ps => ps.IsPreferred).ThenByDescending(ps => ps.CreatedAtUtc).First());

        var newestBatches = await (
            from b in applicationDbContext.InventoryBatches.AsNoTracking()
            join s in applicationDbContext.Suppliers.AsNoTracking() on b.SupplierId equals s.SupplierId
            where variantIds.Contains(b.ProductVariantId) && s.IsActive
            select new { b.ProductVariantId, b.SupplierId, s.Name, b.ReceivedAtUtc })
            .ToListAsync(cancellationToken);

        var newestBatchesDict = newestBatches
            .GroupBy(b => b.ProductVariantId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(b => b.ReceivedAtUtc).First());

        return items.Select(item =>
        {
            Guid? resolvedSupplierId = null;
            string? resolvedSupplierName = null;

            if (productSuppliersDict.TryGetValue(item.ProductId, out var preferred))
            {
                resolvedSupplierId = preferred.SupplierId;
                resolvedSupplierName = preferred.Name;
            }
            else if (newestBatchesDict.TryGetValue(item.ProductVariantId, out var lastBatch))
            {
                resolvedSupplierId = lastBatch.SupplierId;
                resolvedSupplierName = lastBatch.Name;
            }

            return new LowStockInventoryItem(
                item.ProductVariantId,
                item.ProductName,
                item.VariantName,
                item.Sku,
                item.UnitCode,
                item.AvailableQuantity,
                0m,
                resolvedSupplierId,
                resolvedSupplierName);
        }).ToArray();
    }

    private async Task<(Guid? SupplierId, string? SupplierName)> ResolveSupplierAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var variant = await applicationDbContext.ProductVariants.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ProductVariantId == productVariantId, cancellationToken);
        if (variant == null) return (null, null);

        var preferredSupplier = await (
            from ps in applicationDbContext.ProductSuppliers.AsNoTracking()
            join s in applicationDbContext.Suppliers.AsNoTracking() on ps.SupplierId equals s.SupplierId
            where ps.ProductId == variant.ProductId && s.IsActive
            orderby ps.IsPreferred descending, ps.CreatedAtUtc descending
            select new { s.SupplierId, s.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (preferredSupplier != null)
        {
            return (preferredSupplier.SupplierId, preferredSupplier.Name);
        }

        var lastBatch = await (
            from b in applicationDbContext.InventoryBatches.AsNoTracking()
            join s in applicationDbContext.Suppliers.AsNoTracking() on b.SupplierId equals s.SupplierId
            where b.ProductVariantId == productVariantId && s.IsActive
            orderby b.ReceivedAtUtc descending
            select new { s.SupplierId, s.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (lastBatch != null)
        {
            return (lastBatch.SupplierId, lastBatch.Name);
        }

        // 3. Fallback to first active supplier in the database
        var fallbackSupplier = await applicationDbContext.Suppliers.AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new { s.SupplierId, s.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (fallbackSupplier != null)
        {
            return (fallbackSupplier.SupplierId, fallbackSupplier.Name);
        }

        return (null, null);
    }

    public Task AddSupplierAsync(Supplier supplier, CancellationToken cancellationToken) =>
        applicationDbContext.Suppliers.AddAsync(supplier, cancellationToken).AsTask();

    public Task AddProductSupplierAsync(ProductSupplier productSupplier, CancellationToken cancellationToken) =>
        applicationDbContext.ProductSuppliers.AddAsync(productSupplier, cancellationToken).AsTask();

    public Task AddBatchAsync(InventoryBatch batch, CancellationToken cancellationToken) =>
        applicationDbContext.InventoryBatches.AddAsync(batch, cancellationToken).AsTask();

    public Task AddTransactionAsync(InventoryTransaction transaction, CancellationToken cancellationToken) =>
        applicationDbContext.InventoryTransactions.AddAsync(transaction, cancellationToken).AsTask();

    public async Task UpdatePreferredSupplierAsync(Guid productVariantId, Guid supplierId, CancellationToken cancellationToken)
    {
        var variant = await applicationDbContext.ProductVariants.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ProductVariantId == productVariantId, cancellationToken);
        if (variant == null) return;

        // Load all existing links for this product parent
        var existingLinks = await applicationDbContext.ProductSuppliers
            .Where(ps => ps.ProductId == variant.ProductId)
            .ToListAsync(cancellationToken);

        // Turn off preferred on all other suppliers links for this product parent
        foreach (var link in existingLinks)
        {
            if (link.SupplierId != supplierId && link.IsPreferred)
            {
                link.SetPreferred(false);
                applicationDbContext.ProductSuppliers.Update(link);
            }
        }

        // Find or create the link for the newly received supplier
        var targetLink = existingLinks.FirstOrDefault(ps => ps.SupplierId == supplierId);
        if (targetLink != null)
        {
            if (!targetLink.IsPreferred)
            {
                targetLink.SetPreferred(true);
                applicationDbContext.ProductSuppliers.Update(targetLink);
            }
        }
        else
        {
            var newLink = new ProductSupplier(
                variant.ProductId,
                supplierId,
                "PROD-" + variant.ProductId.ToString().Substring(0, 8).ToUpper(),
                true
            );
            await applicationDbContext.ProductSuppliers.AddAsync(newLink, cancellationToken);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => applicationDbContext.SaveChangesAsync(cancellationToken);

    public async Task<VariantStatsResponse> GetVariantStatsAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var posSales = await (
            from item in applicationDbContext.OrderItems.AsNoTracking()
            join order in applicationDbContext.Orders.AsNoTracking() on item.OrderId equals order.OrderId
            where order.Status == OrderStatus.Completed && order.CreatedAtUtc >= thirtyDaysAgo && item.ProductVariantId == productVariantId
            select item.LineTotal)
            .SumAsync(cancellationToken);

        var onlineSales = await (
            from item in applicationDbContext.OnlineOrderItems.AsNoTracking()
            join order in applicationDbContext.OnlineOrders.AsNoTracking() on item.OnlineOrderId equals order.OnlineOrderId
            where order.Status == OnlineOrderStatus.Delivered && order.CreatedAtUtc >= thirtyDaysAgo && item.ProductVariantId == productVariantId
            select item.LineTotal)
            .SumAsync(cancellationToken);

        var availableQty = await applicationDbContext.InventoryBatches
            .AsNoTracking()
            .Where(b => b.ProductVariantId == productVariantId && b.Status == InventoryBatchStatus.Available)
            .SumAsync(b => b.AvailableQuantity, cancellationToken);

        var (supplierId, supplierName) = await ResolveSupplierAsync(productVariantId, cancellationToken);

        return new VariantStatsResponse(productVariantId, availableQty, posSales + onlineSales, supplierId, supplierName);
    }
}
