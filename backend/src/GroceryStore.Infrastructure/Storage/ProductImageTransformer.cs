using GroceryStore.Application.Exceptions;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace GroceryStore.Infrastructure.Storage;

public sealed class ProductImageTransformer
{
    private static readonly HashSet<string> SUPPORTED_CONTENT_TYPES = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    private readonly ImageStorageOptions options;

    public ProductImageTransformer(IOptions<ImageStorageOptions> options)
    {
        this.options = options.Value;
    }

    internal async Task<ProcessedProductImage> TransformAsync(ProductImageUpload imageUpload, CancellationToken cancellationToken)
    {
        if (imageUpload.Length <= 0 || imageUpload.Length > options.MaxUploadBytes)
        {
            throw new BusinessRuleViolationException($"Image size must be between 1 byte and {options.MaxUploadBytes} bytes.");
        }

        if (!SUPPORTED_CONTENT_TYPES.Contains(imageUpload.ContentType))
        {
            throw new BusinessRuleViolationException("Only JPEG, PNG, GIF, and WebP image files are supported.");
        }

        if (!imageUpload.Content.CanRead)
        {
            throw new BusinessRuleViolationException("Uploaded image content cannot be read.");
        }

        try
        {
            using var image = await Image.LoadAsync(imageUpload.Content, cancellationToken);
            image.Mutate(context => context.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(options.MaxImageDimension, options.MaxImageDimension)
            }));

            await using var output = new MemoryStream();
            await image.SaveAsync(output, new WebpEncoder { Quality = options.WebpQuality }, cancellationToken);
            return new ProcessedProductImage(output.ToArray(), image.Width, image.Height);
        }
        catch (UnknownImageFormatException)
        {
            throw new BusinessRuleViolationException("Uploaded content is not a valid image signature.");
        }
        catch (InvalidImageContentException)
        {
            throw new BusinessRuleViolationException("Uploaded image content is invalid.");
        }
    }
}
