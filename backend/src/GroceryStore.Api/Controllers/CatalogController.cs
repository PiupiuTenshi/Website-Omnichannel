using GroceryStore.Application.Features.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class CatalogController : ControllerBase
{
    private readonly CatalogService catalogService;

    public CatalogController(CatalogService catalogService)
    {
        this.catalogService = catalogService;
    }

    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetCategoriesAsync(cancellationToken));
    }

    [HttpGet("units-of-measure")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitOfMeasureResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UnitOfMeasureResponse>>> GetUnitsOfMeasureAsync(CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetUnitsOfMeasureAsync(cancellationToken));
    }

    [HttpGet("products")]
    [ProducesResponseType(typeof(PagedResponse<ProductListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<ProductListItemResponse>>> SearchProductsAsync(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return Ok(await catalogService.SearchProductsAsync(search, categoryId, page, pageSize, cancellationToken));
    }

    [HttpGet("products/by-slug/{slug}")]
    [ProducesResponseType(typeof(ProductDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductDetailResponse>> GetProductBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetProductBySlugAsync(slug, cancellationToken));
    }

    [HttpGet("products/{productId:guid}")]
    [ProducesResponseType(typeof(ProductDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProductDetailResponse>> GetProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetProductAsync(productId, cancellationToken));
    }
}
