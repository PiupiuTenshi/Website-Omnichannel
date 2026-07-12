namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductImageUpload(Guid ProductId, string FileName, string ContentType, long Length, Stream Content);
