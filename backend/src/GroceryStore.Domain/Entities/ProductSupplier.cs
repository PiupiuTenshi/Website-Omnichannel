namespace GroceryStore.Domain.Entities;

public sealed class ProductSupplier
{
    private ProductSupplier()
    {
    }

    public ProductSupplier(Guid productId, Guid supplierId, string? supplierProductCode, bool isPreferred)
    {
        ProductId = productId;
        SupplierId = supplierId;
        SupplierProductCode = supplierProductCode;
        IsPreferred = isPreferred;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid ProductId { get; private set; }
    public Guid SupplierId { get; private set; }
    public string? SupplierProductCode { get; private set; }
    public bool IsPreferred { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public void SetPreferred(bool isPreferred)
    {
        IsPreferred = isPreferred;
    }
}
