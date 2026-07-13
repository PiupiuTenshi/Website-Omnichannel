using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class ReportingRepository(ApplicationDbContext context) : IReportingRepository
{
    private const decimal LOW_STOCK_QUANTITY = 5m;
    public async Task<IReadOnlyList<RevenueReportRow>> GetRevenueAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        var pos = context.Orders.AsNoTracking().Where(order => order.CreatedAtUtc >= fromUtc && order.CreatedAtUtc <= toUtc && order.Status == OrderStatus.Completed).Select(order => new { order.CreatedAtUtc, Revenue = order.AmountDue });
        var online = context.OnlineOrders.AsNoTracking().Where(order => order.CreatedAtUtc >= fromUtc && order.CreatedAtUtc <= toUtc && order.Status == OnlineOrderStatus.Delivered).Select(order => new { order.CreatedAtUtc, Revenue = order.Total });
        var rows = await pos.Concat(online).ToListAsync(cancellationToken);
        return rows.GroupBy(row => DateOnly.FromDateTime(row.CreatedAtUtc)).OrderBy(group => group.Key).Select(group => new RevenueReportRow(group.Key, group.Sum(row => row.Revenue))).ToArray();
    }
    public async Task<IReadOnlyList<ProductSalesReportRow>> GetProductSalesAsync(DateTime fromUtc, DateTime toUtc, bool ascending, CancellationToken cancellationToken)
    {
        var pos = from item in context.OrderItems.AsNoTracking() join order in context.Orders.AsNoTracking() on item.OrderId equals order.OrderId join variant in context.ProductVariants.AsNoTracking() on item.ProductVariantId equals variant.ProductVariantId join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId where order.Status == OrderStatus.Completed && order.CreatedAtUtc >= fromUtc && order.CreatedAtUtc <= toUtc select new { item.ProductVariantId, product.Name, VariantName = variant.Name, item.Quantity, item.LineTotal };
        var online = from item in context.OnlineOrderItems.AsNoTracking() join order in context.OnlineOrders.AsNoTracking() on item.OnlineOrderId equals order.OnlineOrderId join variant in context.ProductVariants.AsNoTracking() on item.ProductVariantId equals variant.ProductVariantId join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId where order.Status == OnlineOrderStatus.Delivered && order.CreatedAtUtc >= fromUtc && order.CreatedAtUtc <= toUtc select new { item.ProductVariantId, product.Name, VariantName = variant.Name, item.Quantity, item.LineTotal };
        var rows = await pos.Concat(online).ToListAsync(cancellationToken);
        var grouped = rows.GroupBy(row => new { row.ProductVariantId, row.Name, row.VariantName }).Select(group => new ProductSalesReportRow(group.Key.ProductVariantId, group.Key.Name, group.Key.VariantName, group.Sum(row => row.Quantity), group.Sum(row => row.LineTotal)));
        return (ascending ? grouped.OrderBy(row => row.QuantitySold) : grouped.OrderByDescending(row => row.QuantitySold)).Take(20).ToArray();
    }
    public async Task<IReadOnlyList<InventoryAlertReportRow>> GetLowStockAsync(CancellationToken cancellationToken)
    {
        var batches = await (from batch in context.InventoryBatches.AsNoTracking()
                             join variant in context.ProductVariants.AsNoTracking() on batch.ProductVariantId equals variant.ProductVariantId
                             join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId
                             where batch.Status == InventoryBatchStatus.Available
                             select new { batch.ProductVariantId, ProductName = product.Name, VariantName = variant.Name, batch.AvailableQuantity, batch.ExpiresAtUtc })
            .ToListAsync(cancellationToken);
        return batches.GroupBy(batch => new { batch.ProductVariantId, batch.ProductName, batch.VariantName })
            .Select(group => new InventoryAlertReportRow(group.Key.ProductVariantId, group.Key.ProductName, group.Key.VariantName, group.Sum(batch => batch.AvailableQuantity), group.Min(batch => batch.ExpiresAtUtc)))
            .Where(row => row.AvailableQuantity < LOW_STOCK_QUANTITY)
            .ToArray();
    }
    public async Task<IReadOnlyList<InventoryAlertReportRow>> GetExpiringSoonAsync(DateTime utcNow, CancellationToken cancellationToken) =>
        await (from batch in context.InventoryBatches.AsNoTracking() join variant in context.ProductVariants.AsNoTracking() on batch.ProductVariantId equals variant.ProductVariantId join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId where batch.Status == InventoryBatchStatus.Available && batch.ExpiresAtUtc != null && batch.ExpiresAtUtc <= utcNow.AddDays(7) select new InventoryAlertReportRow(batch.ProductVariantId, product.Name, variant.Name, batch.AvailableQuantity, batch.ExpiresAtUtc)).ToListAsync(cancellationToken);
}
