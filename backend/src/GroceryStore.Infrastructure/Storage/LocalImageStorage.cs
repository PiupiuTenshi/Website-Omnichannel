using GroceryStore.Application.Abstractions.Storage;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace GroceryStore.Infrastructure.Storage;

public sealed class LocalImageStorage : IImageStorage
{
    private readonly ProductImageTransformer imageTransformer;
    private readonly string rootPath;

    public LocalImageStorage(
        ProductImageTransformer imageTransformer,
        IHostEnvironment hostEnvironment,
        IOptions<ImageStorageOptions> options)
    {
        this.imageTransformer = imageTransformer;
        rootPath = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, options.Value.LocalRootPath));
    }

    public async Task<StoredProductImage> StoreAsync(ProductImageUpload imageUpload, CancellationToken cancellationToken)
    {
        var processedImage = await imageTransformer.TransformAsync(imageUpload, cancellationToken);
        var objectKey = ProductImageStorageKey.Create(imageUpload.ProductId);
        var fullPath = GetFullPath(objectKey);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, processedImage.Content, cancellationToken);
        return new StoredProductImage(objectKey, "image/webp", processedImage.Content.LongLength, processedImage.Width, processedImage.Height);
    }

    public Task<StoredProductImageContent?> OpenReadAsync(string objectKey, CancellationToken cancellationToken)
    {
        var fullPath = GetFullPath(objectKey);
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<StoredProductImageContent?>(null);
        }

        Stream content = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 65536, useAsync: true);
        return Task.FromResult<StoredProductImageContent?>(new StoredProductImageContent(content, "image/webp"));
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken)
    {
        var fullPath = GetFullPath(objectKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string GetFullPath(string objectKey)
    {
        if (string.IsNullOrWhiteSpace(objectKey) || objectKey.Contains("..", StringComparison.Ordinal) || Path.IsPathRooted(objectKey))
        {
            throw new InvalidOperationException("Image object key is invalid.");
        }

        var normalizedKey = objectKey.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, normalizedKey));
        if (!fullPath.StartsWith(rootPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Image object key escapes the local storage root.");
        }

        return fullPath;
    }
}
