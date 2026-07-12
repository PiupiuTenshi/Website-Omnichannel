using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using GroceryStore.Application.Abstractions.Storage;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.Options;

namespace GroceryStore.Infrastructure.Storage;

public sealed class R2ImageStorage : IImageStorage
{
    private readonly IAmazonS3 amazonS3;
    private readonly string bucketName;
    private readonly ProductImageTransformer imageTransformer;

    public R2ImageStorage(ProductImageTransformer imageTransformer, IOptions<R2Options> options)
    {
        this.imageTransformer = imageTransformer;
        var r2Options = options.Value;
        ValidateOptions(r2Options);
        bucketName = r2Options.BucketName;
        var configuration = new AmazonS3Config
        {
            ServiceURL = string.IsNullOrWhiteSpace(r2Options.Endpoint)
                ? $"https://{r2Options.AccountId}.r2.cloudflarestorage.com"
                : r2Options.Endpoint,
            AuthenticationRegion = "auto",
            ForcePathStyle = true
        };
        amazonS3 = new AmazonS3Client(new BasicAWSCredentials(r2Options.AccessKeyId, r2Options.SecretAccessKey), configuration);
    }

    public async Task<StoredProductImage> StoreAsync(ProductImageUpload imageUpload, CancellationToken cancellationToken)
    {
        var processedImage = await imageTransformer.TransformAsync(imageUpload, cancellationToken);
        var objectKey = ProductImageStorageKey.Create(imageUpload.ProductId);
        await using var input = new MemoryStream(processedImage.Content, writable: false);
        await amazonS3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            InputStream = input,
            ContentType = "image/webp",
            AutoCloseStream = false,
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true
        }, cancellationToken);
        return new StoredProductImage(objectKey, "image/webp", processedImage.Content.LongLength, processedImage.Width, processedImage.Height);
    }

    public async Task<StoredProductImageContent?> OpenReadAsync(string objectKey, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await amazonS3.GetObjectAsync(bucketName, objectKey, cancellationToken);
            await using var responseStream = response.ResponseStream;
            var content = new MemoryStream();
            await responseStream.CopyToAsync(content, cancellationToken);
            content.Position = 0;
            return new StoredProductImageContent(content, response.Headers.ContentType ?? "image/webp");
        }
        catch (AmazonS3Exception exception) when (exception.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken)
    {
        return amazonS3.DeleteObjectAsync(bucketName, objectKey, cancellationToken);
    }

    private static void ValidateOptions(R2Options options)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName)
            || string.IsNullOrWhiteSpace(options.AccessKeyId)
            || string.IsNullOrWhiteSpace(options.SecretAccessKey)
            || (string.IsNullOrWhiteSpace(options.AccountId) && string.IsNullOrWhiteSpace(options.Endpoint)))
        {
            throw new InvalidOperationException("R2 configuration requires bucket, credentials, and an account ID or endpoint.");
        }
    }
}
