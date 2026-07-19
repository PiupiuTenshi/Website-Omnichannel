using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Manager")]
[Route("api/admin/catalog")]
public sealed class CatalogAdministrationController : ControllerBase
{
    private readonly CatalogService catalogService;
    private readonly ProductImageService productImageService;

    public CatalogAdministrationController(CatalogService catalogService, ProductImageService productImageService)
    {
        this.catalogService = catalogService;
        this.productImageService = productImageService;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetCategoriesForAdministrationAsync(cancellationToken));
    }

    [HttpPost("categories")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<CategoryResponse>> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var response = await catalogService.CreateCategoryAsync(
            new CreateCategoryCommand(request.Name, request.Slug, request.ParentCategoryId, request.SortOrder, request.IsActive),
            cancellationToken);
        return Created($"/api/admin/catalog/categories/{response.CategoryId}", response);
    }

    [HttpPut("categories/{categoryId:guid}")]
    public async Task<ActionResult<CategoryResponse>> UpdateCategoryAsync(
        Guid categoryId,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await catalogService.UpdateCategoryAsync(
            categoryId,
            new UpdateCategoryCommand(request.Name, request.Slug, request.ParentCategoryId, request.SortOrder, request.IsActive),
            cancellationToken));
    }

    [HttpDelete("categories/{categoryId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        await catalogService.DeleteCategoryAsync(categoryId, cancellationToken);
        return NoContent();
    }

    [HttpGet("units-of-measure")]
    public async Task<ActionResult<IReadOnlyList<UnitOfMeasureResponse>>> GetUnitsOfMeasureAsync(CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetUnitsOfMeasureForAdministrationAsync(cancellationToken));
    }

    [HttpPost("units-of-measure")]
    [ProducesResponseType(typeof(UnitOfMeasureResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<UnitOfMeasureResponse>> CreateUnitOfMeasureAsync(
        CreateUnitOfMeasureRequest request,
        CancellationToken cancellationToken)
    {
        var response = await catalogService.CreateUnitOfMeasureAsync(
            new CreateUnitOfMeasureCommand(request.Code, request.Name, request.AllowsDecimal, request.DecimalScale, request.IsActive),
            cancellationToken);
        return Created($"/api/admin/catalog/units-of-measure/{response.UnitOfMeasureId}", response);
    }

    [HttpPut("units-of-measure/{unitOfMeasureId:guid}")]
    public async Task<ActionResult<UnitOfMeasureResponse>> UpdateUnitOfMeasureAsync(
        Guid unitOfMeasureId,
        UpdateUnitOfMeasureRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await catalogService.UpdateUnitOfMeasureAsync(
            unitOfMeasureId,
            new UpdateUnitOfMeasureCommand(request.Code, request.Name, request.AllowsDecimal, request.DecimalScale, request.IsActive),
            cancellationToken));
    }

    [HttpDelete("units-of-measure/{unitOfMeasureId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteUnitOfMeasureAsync(Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        await catalogService.DeleteUnitOfMeasureAsync(unitOfMeasureId, cancellationToken);
        return NoContent();
    }

    [HttpGet("products")]
    public async Task<ActionResult<PagedResponse<ProductListItemResponse>>> SearchProductsAsync(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return Ok(await catalogService.SearchProductsForAdministrationAsync(search, categoryId, page, pageSize, cancellationToken));
    }

    [HttpGet("products/{productId:guid}")]
    public async Task<ActionResult<ProductDetailResponse>> GetProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        return Ok(await catalogService.GetProductForAdministrationAsync(productId, cancellationToken));
    }

    [HttpPost("products")]
    [ProducesResponseType(typeof(ProductDetailResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProductDetailResponse>> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken)
    {
        var response = await catalogService.CreateProductAsync(
            new CreateProductCommand(
                request.Name,
                request.Slug,
                request.Description,
                request.CategoryId,
                request.UnitOfMeasureId,
                request.IsActive,
                request.Variants.Select(variant => new CreateProductVariantCommand(
                    variant.Name,
                    variant.Sku,
                    variant.Barcode,
                    variant.SellingPrice,
                    variant.CompareAtPrice,
                    variant.IsActive)).ToArray()),
            cancellationToken);
        return Created($"/api/admin/catalog/products/{response.ProductId}", response);
    }

    [HttpPut("products/{productId:guid}")]
    public async Task<ActionResult<ProductDetailResponse>> UpdateProductAsync(
        Guid productId,
        UpdateProductRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await catalogService.UpdateProductAsync(
            productId,
            new UpdateProductCommand(
                request.Name,
                request.Slug,
                request.Description,
                request.CategoryId,
                request.UnitOfMeasureId,
                request.IsActive),
            cancellationToken));
    }

    [HttpDelete("products/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ArchiveProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        await catalogService.ArchiveProductAsync(productId, cancellationToken);
        return NoContent();
    }

    [HttpPost("products/{productId:guid}/variants")]
    [ProducesResponseType(typeof(ProductVariantResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProductVariantResponse>> AddProductVariantAsync(
        Guid productId,
        CreateProductVariantRequest request,
        CancellationToken cancellationToken)
    {
        var response = await catalogService.AddProductVariantAsync(
            productId,
            new CreateProductVariantCommand(
                request.Name,
                request.Sku,
                request.Barcode,
                request.SellingPrice,
                request.CompareAtPrice,
                request.IsActive),
            cancellationToken);
        return Created($"/api/admin/catalog/products/{productId}/variants/{response.ProductVariantId}", response);
    }

    [HttpPut("products/{productId:guid}/variants/{productVariantId:guid}")]
    public async Task<ActionResult<ProductVariantResponse>> UpdateProductVariantAsync(
        Guid productId,
        Guid productVariantId,
        UpdateProductVariantRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await catalogService.UpdateProductVariantAsync(
            productId,
            productVariantId,
            new UpdateProductVariantCommand(
                request.Name,
                request.Sku,
                request.Barcode,
                request.SellingPrice,
                request.CompareAtPrice,
                request.IsActive,
                request.PromotionStartAtUtc,
                request.PromotionEndAtUtc),
            cancellationToken));
    }

    [HttpDelete("products/{productId:guid}/variants/{productVariantId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ArchiveProductVariantAsync(
        Guid productId,
        Guid productVariantId,
        CancellationToken cancellationToken)
    {
        await catalogService.ArchiveProductVariantAsync(productId, productVariantId, cancellationToken);
        return NoContent();
    }

    [HttpPost("products/{productId:guid}/images")]
    [ProducesResponseType(typeof(ProductImageUploadResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProductImageUploadResponse>> UploadProductImageAsync(
        Guid productId,
        [FromForm] IFormFile? file,
        [FromForm] int sortOrder,
        [FromForm] bool isPrimary,
        CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return BadRequest("An image file is required.");
        }

        await using var content = file.OpenReadStream();
        var response = await productImageService.UploadAsync(
            productId,
            new ProductImageUpload(productId, file.FileName, file.ContentType, file.Length, content),
            sortOrder,
            isPrimary,
            cancellationToken);
        return Created(response.Url, response);
    }

    [HttpDelete("products/{productId:guid}/images/{productImageId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteProductImageAsync(Guid productId, Guid productImageId, CancellationToken cancellationToken)
    {
        await productImageService.DeleteAsync(productId, productImageId, cancellationToken);
        return NoContent();
    }
}
