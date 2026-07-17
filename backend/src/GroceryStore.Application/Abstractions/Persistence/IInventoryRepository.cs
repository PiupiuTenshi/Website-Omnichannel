using GroceryStore.Domain.Entities;
using GroceryStore.Application.Features.Inventory;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IInventoryRepository
{
    Task<Supplier?> GetSupplierAsync(Guid supplierId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Supplier>> GetSuppliersAsync(CancellationToken cancellationToken);

    Task<bool> ProductExistsAsync(Guid productId, CancellationToken cancellationToken);

    Task<bool> ProductVariantExistsAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task<InventoryBatch?> GetBatchAsync(Guid inventoryBatchId, CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryBatch>> GetBatchesAsync(Guid? productVariantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<DetailedInventoryBatch>> GetDetailedBatchesAsync(Guid? productVariantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<LowStockInventoryItem>> GetLowStockItemsAsync(decimal minimumAvailableQuantity, CancellationToken cancellationToken);

    Task<VariantStatsResponse> GetVariantStatsAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task AddSupplierAsync(Supplier supplier, CancellationToken cancellationToken);

    Task AddProductSupplierAsync(ProductSupplier productSupplier, CancellationToken cancellationToken);

    Task AddBatchAsync(InventoryBatch batch, CancellationToken cancellationToken);

    Task AddTransactionAsync(InventoryTransaction transaction, CancellationToken cancellationToken);

    Task UpdatePreferredSupplierAsync(Guid productVariantId, Guid supplierId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
