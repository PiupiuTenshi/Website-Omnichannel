namespace GroceryStore.Domain.Entities;

public sealed class Product
{
    private Product()
    {
        Name = string.Empty;
        Slug = string.Empty;
    }

    public Product(
        string name,
        string slug,
        string? description,
        Guid categoryId,
        Guid unitOfMeasureId,
        bool isActive)
    {
        ProductId = Guid.NewGuid();
        Name = name;
        Slug = slug;
        Description = description;
        CategoryId = categoryId;
        UnitOfMeasureId = unitOfMeasureId;
        IsActive = isActive;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid ProductId { get; private set; }

    public string Name { get; private set; }

    public string Slug { get; private set; }

    public string? Description { get; private set; }

    public Guid CategoryId { get; private set; }

    public Guid UnitOfMeasureId { get; private set; }

    public Category? Category { get; private set; }

    public UnitOfMeasure? UnitOfMeasure { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public ICollection<ProductVariant> Variants { get; private set; } = new List<ProductVariant>();

    public ICollection<ProductImage> Images { get; private set; } = new List<ProductImage>();

    public void Update(
        string name,
        string slug,
        string? description,
        Guid categoryId,
        Guid unitOfMeasureId,
        bool isActive)
    {
        Name = name;
        Slug = slug;
        Description = description;
        CategoryId = categoryId;
        UnitOfMeasureId = unitOfMeasureId;
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public ProductVariant AddVariant(string name, string sku, string? barcode, decimal sellingPrice, decimal? compareAtPrice, bool isActive)
    {
        var variant = new ProductVariant(ProductId, name, sku, barcode, sellingPrice, compareAtPrice, isActive);
        Variants.Add(variant);
        UpdatedAtUtc = DateTime.UtcNow;
        return variant;
    }

    public ProductImage AddImage(
        string objectKey,
        string contentType,
        long byteSize,
        int width,
        int height,
        int sortOrder,
        bool isPrimary)
    {
        if (isPrimary)
        {
            foreach (var existingImage in Images)
            {
                existingImage.SetPrimary(false);
            }
        }

        var image = new ProductImage(ProductId, objectKey, contentType, byteSize, width, height, sortOrder, isPrimary);
        Images.Add(image);
        UpdatedAtUtc = DateTime.UtcNow;
        return image;
    }

    public ProductImage RemoveImage(Guid productImageId)
    {
        var image = Images.SingleOrDefault(candidate => candidate.ProductImageId == productImageId)
            ?? throw new ArgumentException("Product image was not found.", nameof(productImageId));
        Images.Remove(image);

        if (image.IsPrimary && Images.Count > 0)
        {
            Images.OrderBy(candidate => candidate.SortOrder).First().SetPrimary(true);
        }

        UpdatedAtUtc = DateTime.UtcNow;
        return image;
    }

    public void Archive()
    {
        IsActive = false;
        foreach (var variant in Variants)
        {
            variant.Archive();
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }
}
