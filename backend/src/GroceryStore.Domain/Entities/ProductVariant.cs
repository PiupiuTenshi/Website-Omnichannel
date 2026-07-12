namespace GroceryStore.Domain.Entities;

public sealed class ProductVariant
{
    private ProductVariant()
    {
        Name = string.Empty;
        Sku = string.Empty;
    }

    public ProductVariant(
        Guid productId,
        string name,
        string sku,
        string? barcode,
        decimal sellingPrice,
        decimal? compareAtPrice,
        bool isActive)
    {
        ProductVariantId = Guid.NewGuid();
        ProductId = productId;
        Name = name;
        Sku = sku;
        Barcode = barcode;
        SetPrices(sellingPrice, compareAtPrice);
        IsActive = isActive;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid ProductVariantId { get; private set; }

    public Guid ProductId { get; private set; }

    public string Name { get; private set; }

    public string Sku { get; private set; }

    public string? Barcode { get; private set; }

    public decimal SellingPrice { get; private set; }

    public decimal? CompareAtPrice { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public void Update(string name, string sku, string? barcode, decimal sellingPrice, decimal? compareAtPrice, bool isActive)
    {
        Name = name;
        Sku = sku;
        Barcode = barcode;
        SetPrices(sellingPrice, compareAtPrice);
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Archive()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetPrices(decimal sellingPrice, decimal? compareAtPrice)
    {
        if (sellingPrice <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(sellingPrice), "Selling price must be greater than zero.");
        }

        if (compareAtPrice is not null && compareAtPrice <= sellingPrice)
        {
            throw new ArgumentOutOfRangeException(nameof(compareAtPrice), "Compare-at price must be greater than the selling price.");
        }

        SellingPrice = sellingPrice;
        CompareAtPrice = compareAtPrice;
    }
}
