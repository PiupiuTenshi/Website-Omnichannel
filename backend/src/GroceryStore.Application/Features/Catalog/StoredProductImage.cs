namespace GroceryStore.Application.Features.Catalog;

public sealed record StoredProductImage(string ObjectKey, string ContentType, long ByteSize, int Width, int Height);
