using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Abstractions.Storage;
using GroceryStore.Application.Exceptions;

namespace GroceryStore.Application.Features.Catalog;

public sealed class ProductImageService
{
    private readonly ICatalogRepository catalogRepository;
    private readonly IImageStorage imageStorage;

    public ProductImageService(ICatalogRepository catalogRepository, IImageStorage imageStorage)
    {
        this.catalogRepository = catalogRepository;
        this.imageStorage = imageStorage;
    }

    public async Task<ProductImageUploadResponse> UploadAsync(
        Guid productId,
        ProductImageUpload imageUpload,
        int sortOrder,
        bool isPrimary,
        CancellationToken cancellationToken)
    {
        if (imageUpload.ProductId != productId)
        {
            throw new BusinessRuleViolationException("Uploaded image does not match the product.");
        }

        var product = await catalogRepository.GetProductAsync(productId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Product was not found.");
        var storedImage = await imageStorage.StoreAsync(imageUpload, cancellationToken);

        try
        {
            var image = product.AddImage(
                storedImage.ObjectKey,
                storedImage.ContentType,
                storedImage.ByteSize,
                storedImage.Width,
                storedImage.Height,
                sortOrder,
                isPrimary || product.Images.Count == 0);
            await catalogRepository.SaveChangesAsync(cancellationToken);
            return new ProductImageUploadResponse(
                image.ProductImageId,
                $"/api/product-images/{image.ProductImageId}",
                image.ContentType,
                image.ByteSize,
                image.Width,
                image.Height,
                image.SortOrder,
                image.IsPrimary);
        }
        catch
        {
            await imageStorage.DeleteAsync(storedImage.ObjectKey, cancellationToken);
            throw;
        }
    }

    public async Task<StoredProductImageContent> OpenReadAsync(Guid productImageId, CancellationToken cancellationToken)
    {
        var product = await catalogRepository.GetProductByImageIdAsync(productImageId, false, cancellationToken)
            ?? throw new KeyNotFoundException("Product image was not found.");
        var image = product.Images.Single(candidate => candidate.ProductImageId == productImageId);
        return await imageStorage.OpenReadAsync(image.ObjectKey, cancellationToken)
            ?? throw new KeyNotFoundException("Product image object was not found.");
    }

    public async Task DeleteAsync(Guid productId, Guid productImageId, CancellationToken cancellationToken)
    {
        var product = await catalogRepository.GetProductAsync(productId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Product was not found.");
        var image = product.RemoveImage(productImageId);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        await imageStorage.DeleteAsync(image.ObjectKey, cancellationToken);
    }
}
