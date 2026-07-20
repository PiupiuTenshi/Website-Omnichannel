using Microsoft.AspNetCore.Http;

namespace GroceryStore.Api.Contracts;

public sealed class UploadProductImageFormRequest
{
    public IFormFile? File { get; init; }
    public int SortOrder { get; init; }
    public bool IsPrimary { get; init; }
}
