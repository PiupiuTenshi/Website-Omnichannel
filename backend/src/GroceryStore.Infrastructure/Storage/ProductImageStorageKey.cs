namespace GroceryStore.Infrastructure.Storage;

internal static class ProductImageStorageKey
{
    public static string Create(Guid productId)
    {
        return $"products/{productId:N}/{Guid.NewGuid():N}.webp";
    }
}
