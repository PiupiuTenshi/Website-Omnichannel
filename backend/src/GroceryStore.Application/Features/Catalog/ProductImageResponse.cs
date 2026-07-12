namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductImageResponse(
    Guid ProductImageId,
    string Url,
    string ContentType,
    long ByteSize,
    int Width,
    int Height,
    int SortOrder,
    bool IsPrimary);
