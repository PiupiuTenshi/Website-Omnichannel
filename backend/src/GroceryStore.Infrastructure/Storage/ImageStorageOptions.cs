namespace GroceryStore.Infrastructure.Storage;

public sealed class ImageStorageOptions
{
    public const string SECTION_NAME = "ImageStorage";
    public const int DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
    public const int DEFAULT_MAX_IMAGE_DIMENSION = 1600;
    public const int DEFAULT_WEBP_QUALITY = 82;

    public string Provider { get; init; } = "Local";

    public string LocalRootPath { get; init; } = "App_Data/product-images";

    public int MaxUploadBytes { get; init; } = DEFAULT_MAX_UPLOAD_BYTES;

    public int MaxImageDimension { get; init; } = DEFAULT_MAX_IMAGE_DIMENSION;

    public int WebpQuality { get; init; } = DEFAULT_WEBP_QUALITY;
}
