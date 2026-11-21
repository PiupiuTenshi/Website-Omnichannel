using GroceryStore.Application.Abstractions.Storage;
using GroceryStore.Application.Exceptions;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class ProductImageStorageTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task StoreAsync_ProducesReadableWebp()
    {
        var testRoot = Path.Combine(Path.GetTempPath(), "webshop-images-" + Guid.NewGuid());
        using var app = factory.WithWebHostBuilder(builder => builder.UseSetting("ImageStorage:LocalRootPath", testRoot));
        var storage = app.Services.GetRequiredService<IImageStorage>();

        var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC");
        await using var upload = new MemoryStream(png);
        try
        {
            var stored = await storage.StoreAsync(new ProductImageUpload(Guid.NewGuid(), "test.png", "image/png", upload.Length, upload), default);
            Assert.Equal("image/webp", stored.ContentType);

            var result = await storage.OpenReadAsync(stored.ObjectKey, default);
            Assert.NotNull(result);
            await using var content = result.Content;
            var header = new byte[12];
            await content.ReadExactlyAsync(header);
            Assert.Equal("RIFF", System.Text.Encoding.ASCII.GetString(header, 0, 4));
            Assert.Equal("WEBP", System.Text.Encoding.ASCII.GetString(header, 8, 4));
        }
        finally
        {
            if (Directory.Exists(testRoot)) Directory.Delete(testRoot, recursive: true);
        }
    }

    [Fact]
    public async Task StoreAsync_RejectsContentThatDoesNotMatchTheDeclaredImageType()
    {
        var storage = factory.Services.GetRequiredService<IImageStorage>();
        await using var upload = new MemoryStream("not an image"u8.ToArray());

        await Assert.ThrowsAsync<BusinessRuleViolationException>(() =>
            storage.StoreAsync(new ProductImageUpload(Guid.NewGuid(), "test.png", "image/png", upload.Length, upload), default));
    }
}
