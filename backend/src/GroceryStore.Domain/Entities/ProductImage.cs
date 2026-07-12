namespace GroceryStore.Domain.Entities;

public sealed class ProductImage
{
    private ProductImage()
    {
        ObjectKey = string.Empty;
        ContentType = string.Empty;
    }

    public ProductImage(
        Guid productId,
        string objectKey,
        string contentType,
        long byteSize,
        int width,
        int height,
        int sortOrder,
        bool isPrimary)
    {
        ProductImageId = Guid.NewGuid();
        ProductId = productId;
        ObjectKey = objectKey;
        ContentType = contentType;
        ByteSize = byteSize;
        Width = width;
        Height = height;
        SortOrder = sortOrder;
        IsPrimary = isPrimary;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid ProductImageId { get; private set; }

    public Guid ProductId { get; private set; }

    public string ObjectKey { get; private set; }

    public string ContentType { get; private set; }

    public long ByteSize { get; private set; }

    public int Width { get; private set; }

    public int Height { get; private set; }

    public int SortOrder { get; private set; }

    public bool IsPrimary { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public void SetPrimary(bool isPrimary)
    {
        IsPrimary = isPrimary;
    }
}
