using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Inventory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Manager")]
[Route("api/admin/inventory")]
public sealed class InventoryAdministrationController : ControllerBase
{
    private readonly InventoryService inventoryService;

    public InventoryAdministrationController(InventoryService inventoryService)
    {
        this.inventoryService = inventoryService;
    }

    [HttpGet("suppliers")]
    public async Task<ActionResult<IReadOnlyList<SupplierResponse>>> GetSuppliersAsync(CancellationToken cancellationToken) =>
        Ok(await inventoryService.GetSuppliersAsync(cancellationToken));

    [HttpPost("suppliers")]
    public async Task<ActionResult<SupplierResponse>> CreateSupplierAsync(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        var response = await inventoryService.CreateSupplierAsync(new CreateSupplierCommand(request.Name, request.ContactName, request.PhoneNumber, request.Email, request.Address), cancellationToken);
        return Created($"/api/admin/inventory/suppliers/{response.SupplierId}", response);
    }

    [HttpPost("product-suppliers")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LinkProductSupplierAsync(LinkProductSupplierRequest request, CancellationToken cancellationToken)
    {
        await inventoryService.LinkProductSupplierAsync(new LinkProductSupplierCommand(request.ProductId, request.SupplierId, request.SupplierProductCode, request.IsPreferred), cancellationToken);
        return NoContent();
    }

    [HttpGet("batches")]
    public async Task<ActionResult<IReadOnlyList<InventoryBatchResponse>>> GetBatchesAsync([FromQuery] Guid? productVariantId, CancellationToken cancellationToken) =>
        Ok(await inventoryService.GetBatchesAsync(productVariantId, cancellationToken));

    [HttpGet("low-stock")]
    public async Task<ActionResult<IReadOnlyList<LowStockItemResponse>>> GetLowStockAsync(
        [FromQuery] decimal minimumAvailableQuantity = 5m,
        CancellationToken cancellationToken = default) =>
        Ok(await inventoryService.GetLowStockItemsAsync(minimumAvailableQuantity, cancellationToken));

    [HttpGet("purchase-list.csv")]
    public async Task<IActionResult> ExportPurchaseListAsync(
        [FromQuery] decimal minimumAvailableQuantity = 5m,
        CancellationToken cancellationToken = default)
    {
        var items = await inventoryService.GetLowStockItemsAsync(minimumAvailableQuantity, cancellationToken);
        return File(PurchaseListCsvExporter.Export(items), "text/csv; charset=utf-8", "purchase-list.csv");
    }

    [HttpPost("receipts")]
    public async Task<ActionResult<InventoryBatchResponse>> ReceiveAsync(ReceiveInventoryRequest request, CancellationToken cancellationToken)
    {
        var response = await inventoryService.ReceiveAsync(new ReceiveInventoryCommand(request.ProductVariantId, request.SupplierId, request.Quantity, request.UnitCost, request.ReceivedAtUtc, request.ManufacturedAtUtc, request.ExpiresAtUtc, request.Reference), cancellationToken);
        return Created($"/api/admin/inventory/batches/{response.InventoryBatchId}", response);
    }

    [HttpPost("batches/{inventoryBatchId:guid}/adjustments")]
    public async Task<ActionResult<InventoryBatchResponse>> AdjustAsync(Guid inventoryBatchId, AdjustInventoryRequest request, CancellationToken cancellationToken) =>
        Ok(await inventoryService.AdjustAsync(inventoryBatchId, new AdjustInventoryCommand(request.QuantityDelta, request.Reason), cancellationToken));
}
