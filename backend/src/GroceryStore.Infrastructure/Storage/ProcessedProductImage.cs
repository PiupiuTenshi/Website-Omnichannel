namespace GroceryStore.Infrastructure.Storage;

internal sealed record ProcessedProductImage(byte[] Content, int Width, int Height);
