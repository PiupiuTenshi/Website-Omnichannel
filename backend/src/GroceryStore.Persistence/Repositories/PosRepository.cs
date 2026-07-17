using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class PosRepository(ApplicationDbContext context) : IPosRepository
{
    public async Task<IReadOnlyList<PosProductDto>> SearchProductsAsync(string query, CancellationToken cancellationToken)
    {
        var trimmedQuery = query?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedQuery))
        {
            return Array.Empty<PosProductDto>();
        }

        var now = DateTime.UtcNow;
        var variants = await (
            from v in context.ProductVariants
            join p in context.Products on v.ProductId equals p.ProductId
            join u in context.UnitsOfMeasure on p.UnitOfMeasureId equals u.UnitOfMeasureId
            where p.IsActive
                && v.IsActive
                && (v.Barcode == trimmedQuery
                    || v.Sku == trimmedQuery
                    || p.Name.Contains(trimmedQuery)
                    || (v.Name != null && v.Name.Contains(trimmedQuery)))
            select new
            {
                v.ProductVariantId,
                ProductName = p.Name,
                VariantName = v.Name,
                v.Sku,
                Barcode = v.Barcode ?? string.Empty,
                UnitCode = u.Code,
                Price = (v.CompareAtPrice != null && v.CompareAtPrice > v.SellingPrice &&
                         (v.PromotionStartAtUtc == null || now >= v.PromotionStartAtUtc) &&
                         (v.PromotionEndAtUtc == null || now <= v.PromotionEndAtUtc))
                            ? v.SellingPrice
                            : (v.CompareAtPrice ?? v.SellingPrice),
                AvailableQuantity = context.InventoryBatches
                    .Where(b => b.ProductVariantId == v.ProductVariantId
                        && b.Status == InventoryBatchStatus.Available
                        && (b.ExpiresAtUtc == null || b.ExpiresAtUtc > now))
                    .Sum(b => b.AvailableQuantity)
            })
            .Take(30)
            .ToListAsync(cancellationToken);

        return variants.Select(v => new PosProductDto(
            v.ProductVariantId,
            v.ProductName,
            v.VariantName ?? string.Empty,
            v.Sku,
            v.Barcode,
            v.UnitCode,
            v.Price,
            v.AvailableQuantity,
            v.UnitCode.Equals("KG", StringComparison.OrdinalIgnoreCase)
        )).ToList();
    }

    public async Task<IReadOnlyList<InventoryBatch>> GetActiveBatchesAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        return await context.InventoryBatches
            .Where(b => b.ProductVariantId == productVariantId
                && b.Status == InventoryBatchStatus.Available)
            .ToListAsync(cancellationToken);
    }

    public Task<PosCheckoutProduct?> GetCheckoutProductAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return (
            from variant in context.ProductVariants
            join product in context.Products on variant.ProductId equals product.ProductId
            join unit in context.UnitsOfMeasure on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            where variant.ProductVariantId == productVariantId && variant.IsActive && product.IsActive
            select new PosCheckoutProduct(
                (variant.CompareAtPrice != null && variant.CompareAtPrice > variant.SellingPrice &&
                 (variant.PromotionStartAtUtc == null || now >= variant.PromotionStartAtUtc) &&
                 (variant.PromotionEndAtUtc == null || now <= variant.PromotionEndAtUtc))
                    ? variant.SellingPrice
                    : (variant.CompareAtPrice ?? variant.SellingPrice),
                unit.Code == "KG"))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task AddOrderAsync(Order order, CancellationToken cancellationToken)
    {
        await context.Orders.AddAsync(order, cancellationToken);
        foreach (var item in order.OrderItems)
        {
            await context.OrderItems.AddAsync(item, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action();
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
