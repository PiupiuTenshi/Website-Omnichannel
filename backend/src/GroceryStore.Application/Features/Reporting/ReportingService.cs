using GroceryStore.Application.Abstractions.Persistence;

namespace GroceryStore.Application.Features.Reporting;

public sealed record ReportingDashboardResponse(IReadOnlyList<RevenueReportRow> Revenue, IReadOnlyList<ProductSalesReportRow> BestSellers, IReadOnlyList<ProductSalesReportRow> SlowSellers, IReadOnlyList<InventoryAlertReportRow> LowStock, IReadOnlyList<InventoryAlertReportRow> ExpiringSoon);
public sealed class ReportingService(IReportingRepository repository)
{
    public async Task<ReportingDashboardResponse> GetDashboardAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken)
    {
        var to = toUtc ?? DateTime.UtcNow;
        var from = fromUtc ?? to.AddDays(-30);
        if (from > to) throw new ArgumentException("Report start date cannot be after end date.");
        return new ReportingDashboardResponse(await repository.GetRevenueAsync(from, to, cancellationToken), await repository.GetProductSalesAsync(from, to, false, cancellationToken), await repository.GetProductSalesAsync(from, to, true, cancellationToken), await repository.GetLowStockAsync(cancellationToken), await repository.GetExpiringSoonAsync(DateTime.UtcNow, cancellationToken));
    }
}
