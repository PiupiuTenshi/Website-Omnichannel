using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.Application.Features.Inventory;

public sealed class InventoryService
{
    private readonly IInventoryRepository inventoryRepository;

    public InventoryService(IInventoryRepository inventoryRepository)
    {
        this.inventoryRepository = inventoryRepository;
    }

    public async Task<IReadOnlyList<SupplierResponse>> GetSuppliersAsync(CancellationToken cancellationToken)
    {
        var suppliers = await inventoryRepository.GetSuppliersAsync(cancellationToken);
        return suppliers.Select(ToResponse).ToArray();
    }

    public async Task<SupplierResponse> CreateSupplierAsync(CreateSupplierCommand command, CancellationToken cancellationToken)
    {
        var supplier = new Supplier(Required(command.Name, "Supplier name"), Optional(command.ContactName), Optional(command.PhoneNumber), Optional(command.Email), Optional(command.Address), true);
        await inventoryRepository.AddSupplierAsync(supplier, cancellationToken);
        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(supplier);
    }

    public async Task LinkProductSupplierAsync(LinkProductSupplierCommand command, CancellationToken cancellationToken)
    {
        if (!await inventoryRepository.ProductExistsAsync(command.ProductId, cancellationToken))
        {
            throw new KeyNotFoundException("Product was not found.");
        }

        if (await inventoryRepository.GetSupplierAsync(command.SupplierId, cancellationToken) is null)
        {
            throw new KeyNotFoundException("Supplier was not found.");
        }

        await inventoryRepository.AddProductSupplierAsync(new ProductSupplier(command.ProductId, command.SupplierId, Optional(command.SupplierProductCode), command.IsPreferred), cancellationToken);
        await inventoryRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<InventoryBatchResponse> ReceiveAsync(ReceiveInventoryCommand command, CancellationToken cancellationToken)
    {
        if (!await inventoryRepository.ProductVariantExistsAsync(command.ProductVariantId, cancellationToken))
        {
            throw new KeyNotFoundException("Active product variant was not found.");
        }

        if (command.SupplierId is not null && await inventoryRepository.GetSupplierAsync(command.SupplierId.Value, cancellationToken) is null)
        {
            throw new KeyNotFoundException("Supplier was not found.");
        }

        var batch = new InventoryBatch(command.ProductVariantId, command.SupplierId, command.Quantity, command.UnitCost, command.ReceivedAtUtc, command.ManufacturedAtUtc, command.ExpiresAtUtc);
        var receipt = new InventoryTransaction(batch.InventoryBatchId, batch.ProductVariantId, InventoryTransactionType.Receipt, command.Quantity, Optional(command.Reference) ?? "Inventory receipt", command.ReceivedAtUtc);
        await inventoryRepository.AddBatchAsync(batch, cancellationToken);
        await inventoryRepository.AddTransactionAsync(receipt, cancellationToken);

        if (command.SupplierId.HasValue)
        {
            await inventoryRepository.UpdatePreferredSupplierAsync(command.ProductVariantId, command.SupplierId.Value, cancellationToken);
        }

        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(batch);
    }

    public async Task<InventoryBatchResponse> AdjustAsync(Guid inventoryBatchId, AdjustInventoryCommand command, CancellationToken cancellationToken)
    {
        if (command.QuantityDelta == 0)
        {
            throw new BusinessRuleViolationException("Inventory adjustment must not be zero.");
        }

        var batch = await inventoryRepository.GetBatchAsync(inventoryBatchId, cancellationToken)
            ?? throw new KeyNotFoundException("Inventory batch was not found.");
        batch.Adjust(command.QuantityDelta);
        var transactionType = command.QuantityDelta > 0 ? InventoryTransactionType.AdjustmentIncrease : InventoryTransactionType.AdjustmentDecrease;
        await inventoryRepository.AddTransactionAsync(new InventoryTransaction(batch.InventoryBatchId, batch.ProductVariantId, transactionType, command.QuantityDelta, Required(command.Reason, "Adjustment reason"), DateTime.UtcNow), cancellationToken);
        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(batch);
    }

    public async Task<IReadOnlyList<InventoryBatchResponse>> GetBatchesAsync(Guid? productVariantId, CancellationToken cancellationToken)
    {
        var batches = await inventoryRepository.GetDetailedBatchesAsync(productVariantId, cancellationToken);
        return batches.Select(batch => new InventoryBatchResponse(
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
            batch.ProductName,
            batch.VariantName,
            batch.Sku,
            batch.UnitCode,
            batch.SupplierName,
            batch.SellingPrice,
            batch.CompareAtPrice)).ToArray();
    }

    public async Task<IReadOnlyList<LowStockItemResponse>> GetLowStockItemsAsync(decimal minimumAvailableQuantity, CancellationToken cancellationToken)
    {
        if (minimumAvailableQuantity < 0)
        {
            throw new BusinessRuleViolationException("Minimum available quantity cannot be negative.");
        }

        var items = await inventoryRepository.GetLowStockItemsAsync(minimumAvailableQuantity, cancellationToken);
        return items.Select(item => new LowStockItemResponse(
            item.ProductVariantId,
            item.ProductName,
            item.VariantName,
            item.Sku,
            item.UnitCode,
            item.AvailableQuantity,
            minimumAvailableQuantity - item.AvailableQuantity,
            item.Revenue,
            item.SupplierId,
            item.SupplierName)).ToArray();
    }

    public Task<VariantStatsResponse> GetVariantStatsAsync(Guid productVariantId, CancellationToken cancellationToken) =>
        inventoryRepository.GetVariantStatsAsync(productVariantId, cancellationToken);

    public async Task<SupplierResponse> UpdateSupplierAsync(Guid supplierId, UpdateSupplierCommand command, CancellationToken cancellationToken)
    {
        var supplier = await inventoryRepository.GetSupplierAsync(supplierId, cancellationToken)
            ?? throw new KeyNotFoundException("Supplier was not found.");

        supplier.Update(
            Required(command.Name, "Supplier name"),
            Optional(command.ContactName),
            Optional(command.PhoneNumber),
            Optional(command.Email),
            Optional(command.Address),
            command.IsActive);

        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(supplier);
    }

    public async Task DeleteSupplierAsync(Guid supplierId, CancellationToken cancellationToken)
    {
        var supplier = await inventoryRepository.GetSupplierAsync(supplierId, cancellationToken)
            ?? throw new KeyNotFoundException("Supplier was not found.");

        supplier.Update(
            supplier.Name,
            supplier.ContactName,
            supplier.PhoneNumber,
            supplier.Email,
            supplier.Address,
            false);

        await inventoryRepository.SaveChangesAsync(cancellationToken);
    }

    private static SupplierResponse ToResponse(Supplier supplier) => new(supplier.SupplierId, supplier.Name, supplier.ContactName, supplier.PhoneNumber, supplier.Email, supplier.Address, supplier.IsActive);

    private static InventoryBatchResponse ToResponse(InventoryBatch batch) => new(batch.InventoryBatchId, batch.ProductVariantId, batch.SupplierId, batch.InitialQuantity, batch.AvailableQuantity, batch.UnitCost, batch.ReceivedAtUtc, batch.ManufacturedAtUtc, batch.ExpiresAtUtc, batch.Status);

    private static string Required(string? value, string fieldName)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? throw new BusinessRuleViolationException($"{fieldName} is required.") : normalized;
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
