using GroceryStore.Application.Features.Catalog;

namespace GroceryStore.Application.Abstractions.Storage;

public interface IImageStorage
{
    Task<StoredProductImage> StoreAsync(ProductImageUpload imageUpload, CancellationToken cancellationToken);

    Task<StoredProductImageContent?> OpenReadAsync(string objectKey, CancellationToken cancellationToken);

    Task DeleteAsync(string objectKey, CancellationToken cancellationToken);
}
