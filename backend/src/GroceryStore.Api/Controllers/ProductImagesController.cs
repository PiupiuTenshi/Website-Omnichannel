using GroceryStore.Application.Features.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/product-images")]
public sealed class ProductImagesController : ControllerBase
{
    private readonly ProductImageService productImageService;

    public ProductImagesController(ProductImageService productImageService)
    {
        this.productImageService = productImageService;
    }

    [HttpGet("{productImageId:guid}")]
    public async Task<IActionResult> OpenReadAsync(Guid productImageId, CancellationToken cancellationToken)
    {
        var image = await productImageService.OpenReadAsync(productImageId, cancellationToken);
        return File(image.Content, image.ContentType, enableRangeProcessing: true);
    }
}
