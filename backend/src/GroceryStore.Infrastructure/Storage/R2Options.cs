namespace GroceryStore.Infrastructure.Storage;

public sealed class R2Options
{
    public const string SECTION_NAME = "R2";

    public string AccountId { get; init; } = string.Empty;

    public string BucketName { get; init; } = string.Empty;

    public string AccessKeyId { get; init; } = string.Empty;

    public string SecretAccessKey { get; init; } = string.Empty;

    public string? Endpoint { get; init; }
}
