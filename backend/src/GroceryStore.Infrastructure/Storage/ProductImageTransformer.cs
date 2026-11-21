using GroceryStore.Application.Exceptions;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.Options;
using ImageMagick;

namespace GroceryStore.Infrastructure.Storage;

public sealed class ProductImageTransformer
{
    private const uint MAX_FRAMES = 100;
    private const ulong MAX_SOURCE_PIXELS = 40_000_000;

    private static readonly Dictionary<string, MagickFormat> SUPPORTED_CONTENT_TYPES = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = MagickFormat.Jpeg,
        ["image/png"] = MagickFormat.Png,
        ["image/gif"] = MagickFormat.Gif,
        ["image/webp"] = MagickFormat.WebP
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

        if (!SUPPORTED_CONTENT_TYPES.TryGetValue(imageUpload.ContentType, out var format))
        {
            throw new BusinessRuleViolationException("Only JPEG, PNG, GIF, and WebP image files are supported.");
        }

        if (!imageUpload.Content.CanRead)
        {
            throw new BusinessRuleViolationException("Uploaded image content cannot be read.");
        }

        try
        {
            var bytes = new byte[(int)imageUpload.Length];
            await imageUpload.Content.ReadExactlyAsync(bytes, cancellationToken);
            if (!HasExpectedSignature(bytes, format))
            {
                throw new BusinessRuleViolationException("Uploaded content does not match the declared image type.");
            }

            var readSettings = new MagickReadSettings { Format = format, FrameCount = MAX_FRAMES + 1 };

            using var frames = new MagickImageCollection();
            frames.Ping(bytes, readSettings);
            if (frames.Count == 0 || frames.Count > MAX_FRAMES ||
                (ulong)frames.Max(frame => Math.Max(frame.Width, frame.Page.Width)) *
                frames.Max(frame => Math.Max(frame.Height, frame.Page.Height)) > MAX_SOURCE_PIXELS / (uint)frames.Count)
            {
                throw new BusinessRuleViolationException("Image dimensions or frame count exceed the supported limits.");
            }

            cancellationToken.ThrowIfCancellationRequested();
            frames.Read(bytes, readSettings);
            if (frames.Count > 1) frames.Coalesce();
            foreach (var frame in frames)
            {
                cancellationToken.ThrowIfCancellationRequested();
                frame.Resize((uint)options.MaxImageDimension, (uint)options.MaxImageDimension);
                frame.Quality = (uint)options.WebpQuality;
            }

            await using var output = new MemoryStream();
            await frames.WriteAsync(output, MagickFormat.WebP, cancellationToken);
            return new ProcessedProductImage(output.ToArray(), (int)frames[0].Width, (int)frames[0].Height);
        }
        catch (Exception exception) when (exception is MagickException or EndOfStreamException)
        {
            throw new BusinessRuleViolationException("Uploaded image content is invalid.");
        }
    }

    private static bool HasExpectedSignature(ReadOnlySpan<byte> bytes, MagickFormat format) => format switch
    {
        MagickFormat.Jpeg => bytes.StartsWith(new byte[] { 0xff, 0xd8, 0xff }),
        MagickFormat.Png => bytes.StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }),
        MagickFormat.Gif => bytes.StartsWith("GIF87a"u8) || bytes.StartsWith("GIF89a"u8),
        MagickFormat.WebP => bytes.Length >= 12 && bytes.StartsWith("RIFF"u8) && bytes[8..].StartsWith("WEBP"u8),
        _ => false
    };
}
