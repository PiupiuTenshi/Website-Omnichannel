using System.Text.RegularExpressions;
using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Features.Catalog;

public sealed class CatalogService
{
    private const int MAX_PAGE_SIZE = 100;
    private static readonly Regex SLUG_PATTERN = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex UNIT_CODE_PATTERN = new("^[A-Z0-9]{2,20}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ICatalogRepository catalogRepository;

    public CatalogService(ICatalogRepository catalogRepository)
    {
        this.catalogRepository = catalogRepository;
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = await catalogRepository.GetCategoriesAsync(false, cancellationToken);
        return categories.Select(ToResponse).ToArray();
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetCategoriesForAdministrationAsync(CancellationToken cancellationToken)
    {
        var categories = await catalogRepository.GetCategoriesAsync(true, cancellationToken);
        return categories.Select(ToResponse).ToArray();
    }

    public async Task<CategoryResponse> CreateCategoryAsync(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var name = NormalizeRequired(command.Name, "Category name");
        var slug = NormalizeSlug(command.Slug);
        await ValidateCategoryParentAsync(command.ParentCategoryId, null, cancellationToken);

        if (await catalogRepository.CategorySlugExistsAsync(slug, null, cancellationToken))
        {
            throw new BusinessRuleViolationException("Category slug is already in use.");
        }

        var category = new Category(name, slug, command.ParentCategoryId, command.SortOrder, command.IsActive);
        await catalogRepository.AddCategoryAsync(category, cancellationToken);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(category);
    }

    public async Task<CategoryResponse> UpdateCategoryAsync(Guid categoryId, UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await GetCategoryOrThrowAsync(categoryId, cancellationToken);
        var name = NormalizeRequired(command.Name, "Category name");
        var slug = NormalizeSlug(command.Slug);
        await ValidateCategoryParentAsync(command.ParentCategoryId, categoryId, cancellationToken);

        if (await catalogRepository.CategorySlugExistsAsync(slug, categoryId, cancellationToken))
        {
            throw new BusinessRuleViolationException("Category slug is already in use.");
        }

        category.Update(name, slug, command.ParentCategoryId, command.SortOrder, command.IsActive);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(category);
    }

    public async Task DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await GetCategoryOrThrowAsync(categoryId, cancellationToken);
        if (await catalogRepository.CategoryHasChildrenAsync(categoryId, cancellationToken))
        {
            throw new BusinessRuleViolationException("A category with child categories cannot be deleted.");
        }

        if (await catalogRepository.CategoryHasProductsAsync(categoryId, cancellationToken))
        {
            throw new BusinessRuleViolationException("A category referenced by products cannot be deleted.");
        }

        catalogRepository.RemoveCategory(category);
        await catalogRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UnitOfMeasureResponse>> GetUnitsOfMeasureAsync(CancellationToken cancellationToken)
    {
        var units = await catalogRepository.GetUnitsOfMeasureAsync(false, cancellationToken);
        return units.Select(ToResponse).ToArray();
    }

    public async Task<IReadOnlyList<UnitOfMeasureResponse>> GetUnitsOfMeasureForAdministrationAsync(CancellationToken cancellationToken)
    {
        var units = await catalogRepository.GetUnitsOfMeasureAsync(true, cancellationToken);
        return units.Select(ToResponse).ToArray();
    }

    public async Task<UnitOfMeasureResponse> CreateUnitOfMeasureAsync(CreateUnitOfMeasureCommand command, CancellationToken cancellationToken)
    {
        var code = NormalizeUnitCode(command.Code);
        var name = NormalizeRequired(command.Name, "Unit name");
        ValidateUnitPrecision(command.AllowsDecimal, command.DecimalScale);

        if (await catalogRepository.UnitCodeExistsAsync(code, null, cancellationToken))
        {
            throw new BusinessRuleViolationException("Unit code is already in use.");
        }

        var unitOfMeasure = new UnitOfMeasure(code, name, command.AllowsDecimal, command.DecimalScale, command.IsActive);
        await catalogRepository.AddUnitOfMeasureAsync(unitOfMeasure, cancellationToken);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(unitOfMeasure);
    }

    public async Task<UnitOfMeasureResponse> UpdateUnitOfMeasureAsync(Guid unitOfMeasureId, UpdateUnitOfMeasureCommand command, CancellationToken cancellationToken)
    {
        var unitOfMeasure = await GetUnitOfMeasureOrThrowAsync(unitOfMeasureId, cancellationToken);
        var code = NormalizeUnitCode(command.Code);
        var name = NormalizeRequired(command.Name, "Unit name");
        ValidateUnitPrecision(command.AllowsDecimal, command.DecimalScale);

        if (await catalogRepository.UnitCodeExistsAsync(code, unitOfMeasureId, cancellationToken))
        {
            throw new BusinessRuleViolationException("Unit code is already in use.");
        }

        unitOfMeasure.Update(code, name, command.AllowsDecimal, command.DecimalScale, command.IsActive);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(unitOfMeasure);
    }

    public async Task DeleteUnitOfMeasureAsync(Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        var unitOfMeasure = await GetUnitOfMeasureOrThrowAsync(unitOfMeasureId, cancellationToken);
        if (await catalogRepository.UnitHasProductsAsync(unitOfMeasureId, cancellationToken))
        {
            throw new BusinessRuleViolationException("A unit referenced by products cannot be deleted.");
        }

        catalogRepository.RemoveUnitOfMeasure(unitOfMeasure);
        await catalogRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResponse<ProductListItemResponse>> SearchProductsAsync(
        string? searchTerm,
        Guid? categoryId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ValidatePagination(page, pageSize);
        var result = await catalogRepository.SearchProductsAsync(
            new CatalogProductSearch(searchTerm?.Trim(), categoryId, page, pageSize, false),
            cancellationToken);
        return new PagedResponse<ProductListItemResponse>(result.Products.Select(ToListItemResponse).ToArray(), page, pageSize, result.TotalCount);
    }

    public async Task<PagedResponse<ProductListItemResponse>> SearchProductsForAdministrationAsync(
        string? searchTerm,
        Guid? categoryId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ValidatePagination(page, pageSize);
        var result = await catalogRepository.SearchProductsAsync(
            new CatalogProductSearch(searchTerm?.Trim(), categoryId, page, pageSize, true),
            cancellationToken);
        return new PagedResponse<ProductListItemResponse>(result.Products.Select(ToListItemResponse).ToArray(), page, pageSize, result.TotalCount);
    }

    public async Task<ProductDetailResponse> GetProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await catalogRepository.GetProductAsync(productId, false, cancellationToken)
            ?? throw new KeyNotFoundException("Product was not found.");
        return ToDetailResponse(product);
    }

    public async Task<ProductDetailResponse> GetProductBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var product = await catalogRepository.GetProductBySlugAsync(NormalizeSlug(slug), cancellationToken)
            ?? throw new KeyNotFoundException("Product was not found.");
        return ToDetailResponse(product);
    }

    public async Task<ProductDetailResponse> GetProductForAdministrationAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        return ToDetailResponse(product);
    }

    public async Task<ProductDetailResponse> CreateProductAsync(CreateProductCommand command, CancellationToken cancellationToken)
    {
        if (command.Variants.Count == 0)
        {
            throw new BusinessRuleViolationException("A product must have at least one variant.");
        }

        var name = NormalizeRequired(command.Name, "Product name");
        var slug = NormalizeSlug(command.Slug);
        await ValidateProductReferencesAsync(command.CategoryId, command.UnitOfMeasureId, cancellationToken);

        if (await catalogRepository.ProductSlugExistsAsync(slug, null, cancellationToken))
        {
            throw new BusinessRuleViolationException("Product slug is already in use.");
        }

        await ValidateNewVariantsAsync(command.Variants, cancellationToken);
        var product = new Product(name, slug, NormalizeOptional(command.Description), command.CategoryId, command.UnitOfMeasureId, command.IsActive);
        foreach (var variant in command.Variants)
        {
            product.AddVariant(
                NormalizeRequired(variant.Name, "Variant name"),
                NormalizeSku(variant.Sku),
                NormalizeBarcode(variant.Barcode),
                variant.SellingPrice,
                variant.CompareAtPrice,
                variant.IsActive);
        }

        await catalogRepository.AddProductAsync(product, cancellationToken);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToDetailResponse(product);
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(Guid productId, UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        var name = NormalizeRequired(command.Name, "Product name");
        var slug = NormalizeSlug(command.Slug);
        await ValidateProductReferencesAsync(command.CategoryId, command.UnitOfMeasureId, cancellationToken);

        if (await catalogRepository.ProductSlugExistsAsync(slug, productId, cancellationToken))
        {
            throw new BusinessRuleViolationException("Product slug is already in use.");
        }

        product.Update(name, slug, NormalizeOptional(command.Description), command.CategoryId, command.UnitOfMeasureId, command.IsActive);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToDetailResponse(product);
    }

    public async Task ArchiveProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        product.Archive();
        await catalogRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProductVariantResponse> AddProductVariantAsync(
        Guid productId,
        CreateProductVariantCommand command,
        CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        await ValidateVariantAsync(command.Name, command.Sku, command.Barcode, command.SellingPrice, command.CompareAtPrice, null, cancellationToken);
        var variant = product.AddVariant(
            NormalizeRequired(command.Name, "Variant name"),
            NormalizeSku(command.Sku),
            NormalizeBarcode(command.Barcode),
            command.SellingPrice,
            command.CompareAtPrice,
            command.IsActive);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(variant);
    }

    public async Task<ProductVariantResponse> UpdateProductVariantAsync(
        Guid productId,
        Guid productVariantId,
        UpdateProductVariantCommand command,
        CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        var variant = product.Variants.SingleOrDefault(candidate => candidate.ProductVariantId == productVariantId)
            ?? throw new KeyNotFoundException("Product variant was not found.");
        await ValidateVariantAsync(command.Name, command.Sku, command.Barcode, command.SellingPrice, command.CompareAtPrice, productVariantId, cancellationToken);
        variant.Update(
            NormalizeRequired(command.Name, "Variant name"),
            NormalizeSku(command.Sku),
            NormalizeBarcode(command.Barcode),
            command.SellingPrice,
            command.CompareAtPrice,
            command.IsActive);
        await catalogRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(variant);
    }

    public async Task ArchiveProductVariantAsync(Guid productId, Guid productVariantId, CancellationToken cancellationToken)
    {
        var product = await GetProductOrThrowAsync(productId, cancellationToken);
        var variant = product.Variants.SingleOrDefault(candidate => candidate.ProductVariantId == productVariantId)
            ?? throw new KeyNotFoundException("Product variant was not found.");
        variant.Archive();
        await catalogRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateCategoryParentAsync(Guid? parentCategoryId, Guid? categoryId, CancellationToken cancellationToken)
    {
        if (parentCategoryId is null)
        {
            return;
        }

        if (parentCategoryId == categoryId)
        {
            throw new BusinessRuleViolationException("A category cannot be its own parent.");
        }

        if (await catalogRepository.GetCategoryAsync(parentCategoryId.Value, cancellationToken) is null)
        {
            throw new BusinessRuleViolationException("Parent category was not found.");
        }

        if (categoryId is not null && await catalogRepository.IsCategoryDescendantAsync(categoryId.Value, parentCategoryId.Value, cancellationToken))
        {
            throw new BusinessRuleViolationException("A category cannot be moved below one of its descendants.");
        }
    }

    private async Task ValidateProductReferencesAsync(Guid categoryId, Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        var category = await catalogRepository.GetCategoryAsync(categoryId, cancellationToken);
        if (category is null || !category.IsActive)
        {
            throw new BusinessRuleViolationException("An active category is required.");
        }

        var unitOfMeasure = await catalogRepository.GetUnitOfMeasureAsync(unitOfMeasureId, cancellationToken);
        if (unitOfMeasure is null || !unitOfMeasure.IsActive)
        {
            throw new BusinessRuleViolationException("An active unit of measure is required.");
        }
    }

    private async Task ValidateNewVariantsAsync(IReadOnlyList<CreateProductVariantCommand> variants, CancellationToken cancellationToken)
    {
        var skus = new HashSet<string>(StringComparer.Ordinal);
        var barcodes = new HashSet<string>(StringComparer.Ordinal);
        foreach (var variant in variants)
        {
            var sku = NormalizeSku(variant.Sku);
            var barcode = NormalizeBarcode(variant.Barcode);
            if (!skus.Add(sku) || (barcode is not null && !barcodes.Add(barcode)))
            {
                throw new BusinessRuleViolationException("Each product variant must have a distinct SKU and barcode.");
            }

            await ValidateVariantAsync(variant.Name, sku, barcode, variant.SellingPrice, variant.CompareAtPrice, null, cancellationToken);
        }
    }

    private async Task ValidateVariantAsync(
        string name,
        string sku,
        string? barcode,
        decimal sellingPrice,
        decimal? compareAtPrice,
        Guid? excludedProductVariantId,
        CancellationToken cancellationToken)
    {
        _ = NormalizeRequired(name, "Variant name");
        var normalizedSku = NormalizeSku(sku);
        var normalizedBarcode = NormalizeBarcode(barcode);

        if (sellingPrice <= 0)
        {
            throw new BusinessRuleViolationException("Selling price must be greater than zero.");
        }

        if (compareAtPrice is not null && compareAtPrice <= sellingPrice)
        {
            throw new BusinessRuleViolationException("Compare-at price must be greater than the selling price.");
        }

        if (await catalogRepository.SkuExistsAsync(normalizedSku, excludedProductVariantId, cancellationToken))
        {
            throw new BusinessRuleViolationException("SKU is already in use.");
        }

        if (normalizedBarcode is not null && await catalogRepository.BarcodeExistsAsync(normalizedBarcode, excludedProductVariantId, cancellationToken))
        {
            throw new BusinessRuleViolationException("Barcode is already in use.");
        }
    }

    private async Task<Category> GetCategoryOrThrowAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        return await catalogRepository.GetCategoryAsync(categoryId, cancellationToken)
            ?? throw new KeyNotFoundException("Category was not found.");
    }

    private async Task<UnitOfMeasure> GetUnitOfMeasureOrThrowAsync(Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        return await catalogRepository.GetUnitOfMeasureAsync(unitOfMeasureId, cancellationToken)
            ?? throw new KeyNotFoundException("Unit of measure was not found.");
    }

    private async Task<Product> GetProductOrThrowAsync(Guid productId, CancellationToken cancellationToken)
    {
        return await catalogRepository.GetProductAsync(productId, true, cancellationToken)
            ?? throw new KeyNotFoundException("Product was not found.");
    }

    private static CategoryResponse ToResponse(Category category)
    {
        return new CategoryResponse(category.CategoryId, category.Name, category.Slug, category.ParentCategoryId, category.SortOrder, category.IsActive);
    }

    private static UnitOfMeasureResponse ToResponse(UnitOfMeasure unitOfMeasure)
    {
        return new UnitOfMeasureResponse(
            unitOfMeasure.UnitOfMeasureId,
            unitOfMeasure.Code,
            unitOfMeasure.Name,
            unitOfMeasure.AllowsDecimal,
            unitOfMeasure.DecimalScale,
            unitOfMeasure.IsActive);
    }

    private static ProductVariantResponse ToResponse(ProductVariant variant)
    {
        return new ProductVariantResponse(
            variant.ProductVariantId,
            variant.Name,
            variant.Sku,
            variant.Barcode,
            variant.SellingPrice,
            variant.CompareAtPrice,
            variant.IsActive,
            Convert.ToBase64String(variant.RowVersion));
    }

    private static ProductListItemResponse ToListItemResponse(Product product)
    {
        var variant = product.Variants.Where(candidate => candidate.IsActive).OrderBy(candidate => candidate.SellingPrice).FirstOrDefault()
            ?? product.Variants.OrderBy(candidate => candidate.SellingPrice).FirstOrDefault()
            ?? throw new BusinessRuleViolationException("Product has no variants.");
        var primaryImage = product.Images.OrderByDescending(image => image.IsPrimary).ThenBy(image => image.SortOrder).FirstOrDefault();
        return new ProductListItemResponse(
            product.ProductId,
            product.Name,
            product.Slug,
            product.Category?.Name ?? string.Empty,
            product.UnitOfMeasure?.Name ?? string.Empty,
            variant.SellingPrice,
            variant.CompareAtPrice,
            primaryImage is null ? null : GetImageUrl(primaryImage.ProductImageId));
    }

    private static ProductDetailResponse ToDetailResponse(Product product)
    {
        var category = product.Category ?? throw new BusinessRuleViolationException("Product category is unavailable.");
        var unitOfMeasure = product.UnitOfMeasure ?? throw new BusinessRuleViolationException("Product unit of measure is unavailable.");
        return new ProductDetailResponse(
            product.ProductId,
            product.Name,
            product.Slug,
            product.Description,
            product.CategoryId,
            category.Name,
            product.UnitOfMeasureId,
            unitOfMeasure.Name,
            unitOfMeasure.AllowsDecimal,
            unitOfMeasure.DecimalScale,
            product.IsActive,
            product.Variants.OrderBy(variant => variant.Name).Select(ToResponse).ToArray(),
            product.Images.OrderByDescending(image => image.IsPrimary).ThenBy(image => image.SortOrder).Select(ToResponse).ToArray());
    }

    private static ProductImageResponse ToResponse(ProductImage image)
    {
        return new ProductImageResponse(
            image.ProductImageId,
            GetImageUrl(image.ProductImageId),
            image.ContentType,
            image.ByteSize,
            image.Width,
            image.Height,
            image.SortOrder,
            image.IsPrimary);
    }

    private static string GetImageUrl(Guid productImageId)
    {
        return $"/api/product-images/{productImageId}";
    }

    private static string NormalizeRequired(string value, string fieldName)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessRuleViolationException($"{fieldName} is required.");
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string NormalizeSlug(string value)
    {
        var slug = NormalizeRequired(value, "Slug").ToLowerInvariant();
        if (!SLUG_PATTERN.IsMatch(slug))
        {
            throw new BusinessRuleViolationException("Slug must use lowercase letters, numbers, and single hyphens only.");
        }

        return slug;
    }

    private static string NormalizeUnitCode(string value)
    {
        var code = NormalizeRequired(value, "Unit code").ToUpperInvariant();
        if (!UNIT_CODE_PATTERN.IsMatch(code))
        {
            throw new BusinessRuleViolationException("Unit code must contain 2 to 20 uppercase letters or digits.");
        }

        return code;
    }

    private static string NormalizeSku(string value)
    {
        var sku = NormalizeRequired(value, "SKU").ToUpperInvariant();
        if (sku.Length > 64)
        {
            throw new BusinessRuleViolationException("SKU must not exceed 64 characters.");
        }

        return sku;
    }

    private static string? NormalizeBarcode(string? value)
    {
        var barcode = NormalizeOptional(value);
        if (barcode?.Length > 64)
        {
            throw new BusinessRuleViolationException("Barcode must not exceed 64 characters.");
        }

        return barcode;
    }

    private static void ValidateUnitPrecision(bool allowsDecimal, int decimalScale)
    {
        if (decimalScale is < 0 or > 3 || (!allowsDecimal && decimalScale != 0) || (allowsDecimal && decimalScale == 0))
        {
            throw new BusinessRuleViolationException("Decimal scale must match the unit measurement type.");
        }
    }

    private static void ValidatePagination(int page, int pageSize)
    {
        if (page < 1 || pageSize < 1 || pageSize > MAX_PAGE_SIZE)
        {
            throw new BusinessRuleViolationException($"Page must be positive and page size cannot exceed {MAX_PAGE_SIZE}.");
        }
    }
}
