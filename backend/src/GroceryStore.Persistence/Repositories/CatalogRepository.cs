using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class CatalogRepository : ICatalogRepository
{
    private readonly ApplicationDbContext applicationDbContext;

    public CatalogRepository(ApplicationDbContext applicationDbContext)
    {
        this.applicationDbContext = applicationDbContext;
    }

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = applicationDbContext.Categories.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(category => category.IsActive);
        }

        return await query.OrderBy(category => category.SortOrder).ThenBy(category => category.Name).ToArrayAsync(cancellationToken);
    }

    public Task<Category?> GetCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Categories.SingleOrDefaultAsync(category => category.CategoryId == categoryId, cancellationToken);
    }

    public Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedCategoryId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Categories.AnyAsync(
            category => category.Slug == slug && (excludedCategoryId == null || category.CategoryId != excludedCategoryId),
            cancellationToken);
    }

    public Task<bool> CategoryHasChildrenAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Categories.AnyAsync(category => category.ParentCategoryId == categoryId, cancellationToken);
    }

    public Task<bool> CategoryHasProductsAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Products.AnyAsync(product => product.CategoryId == categoryId, cancellationToken);
    }

    public async Task<bool> IsCategoryDescendantAsync(Guid categoryId, Guid possibleDescendantId, CancellationToken cancellationToken)
    {
        var currentCategoryId = possibleDescendantId;
        while (true)
        {
            var parentCategoryId = await applicationDbContext.Categories
                .AsNoTracking()
                .Where(category => category.CategoryId == currentCategoryId)
                .Select(category => category.ParentCategoryId)
                .SingleOrDefaultAsync(cancellationToken);
            if (parentCategoryId is null)
            {
                return false;
            }

            if (parentCategoryId == categoryId)
            {
                return true;
            }

            currentCategoryId = parentCategoryId.Value;
        }
    }

    public Task AddCategoryAsync(Category category, CancellationToken cancellationToken)
    {
        return applicationDbContext.Categories.AddAsync(category, cancellationToken).AsTask();
    }

    public void RemoveCategory(Category category)
    {
        applicationDbContext.Categories.Remove(category);
    }

    public async Task<IReadOnlyList<UnitOfMeasure>> GetUnitsOfMeasureAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var query = applicationDbContext.UnitsOfMeasure.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(unitOfMeasure => unitOfMeasure.IsActive);
        }

        return await query.OrderBy(unitOfMeasure => unitOfMeasure.Code).ToArrayAsync(cancellationToken);
    }

    public Task<UnitOfMeasure?> GetUnitOfMeasureAsync(Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        return applicationDbContext.UnitsOfMeasure.SingleOrDefaultAsync(
            unitOfMeasure => unitOfMeasure.UnitOfMeasureId == unitOfMeasureId,
            cancellationToken);
    }

    public Task<bool> UnitCodeExistsAsync(string code, Guid? excludedUnitOfMeasureId, CancellationToken cancellationToken)
    {
        return applicationDbContext.UnitsOfMeasure.AnyAsync(
            unitOfMeasure => unitOfMeasure.Code == code && (excludedUnitOfMeasureId == null || unitOfMeasure.UnitOfMeasureId != excludedUnitOfMeasureId),
            cancellationToken);
    }

    public Task<bool> UnitHasProductsAsync(Guid unitOfMeasureId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Products.AnyAsync(product => product.UnitOfMeasureId == unitOfMeasureId, cancellationToken);
    }

    public Task AddUnitOfMeasureAsync(UnitOfMeasure unitOfMeasure, CancellationToken cancellationToken)
    {
        return applicationDbContext.UnitsOfMeasure.AddAsync(unitOfMeasure, cancellationToken).AsTask();
    }

    public void RemoveUnitOfMeasure(UnitOfMeasure unitOfMeasure)
    {
        applicationDbContext.UnitsOfMeasure.Remove(unitOfMeasure);
    }

    public async Task<CatalogProductSearchResult> SearchProductsAsync(CatalogProductSearch search, CancellationToken cancellationToken)
    {
        var query = BuildProductQuery(search.IncludeInactive);
        if (search.CategoryId is not null)
        {
            query = query.Where(product => product.CategoryId == search.CategoryId);
        }

        if (!string.IsNullOrWhiteSpace(search.SearchTerm))
        {
            var searchPattern = CreateContainsLikePattern(search.SearchTerm);
            query = query.Where(product =>
                EF.Functions.Like(product.Name, searchPattern) ||
                EF.Functions.Like(product.Slug, searchPattern) ||
                product.Variants.Any(variant =>
                    EF.Functions.Like(variant.Sku, searchPattern) ||
                    (variant.Barcode != null && EF.Functions.Like(variant.Barcode, searchPattern)) ||
                    (variant.Name != null && EF.Functions.Like(variant.Name, searchPattern))));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var products = await query
            .OrderBy(product => product.Name)
            .Skip((search.Page - 1) * search.PageSize)
            .Take(search.PageSize)
            .ToArrayAsync(cancellationToken);
        return new CatalogProductSearchResult(products, totalCount);
    }

    public Task<Product?> GetProductAsync(Guid productId, bool includeInactive, CancellationToken cancellationToken)
    {
        return BuildProductQuery(includeInactive).SingleOrDefaultAsync(product => product.ProductId == productId, cancellationToken);
    }

    public Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        return BuildProductQuery(false).SingleOrDefaultAsync(product => product.Slug == slug, cancellationToken);
    }

    public Task<Product?> GetProductByImageIdAsync(Guid productImageId, bool includeInactive, CancellationToken cancellationToken)
    {
        return BuildProductQuery(includeInactive).SingleOrDefaultAsync(
            product => product.Images.Any(image => image.ProductImageId == productImageId),
            cancellationToken);
    }

    public Task<bool> ProductSlugExistsAsync(string slug, Guid? excludedProductId, CancellationToken cancellationToken)
    {
        return applicationDbContext.Products.AnyAsync(
            product => product.Slug == slug && (excludedProductId == null || product.ProductId != excludedProductId),
            cancellationToken);
    }

    public Task<bool> SkuExistsAsync(string sku, Guid? excludedProductVariantId, CancellationToken cancellationToken)
    {
        return applicationDbContext.ProductVariants.AnyAsync(
            variant => variant.Sku == sku && (excludedProductVariantId == null || variant.ProductVariantId != excludedProductVariantId),
            cancellationToken);
    }

    public Task<bool> BarcodeExistsAsync(string barcode, Guid? excludedProductVariantId, CancellationToken cancellationToken)
    {
        return applicationDbContext.ProductVariants.AnyAsync(
            variant => variant.Barcode == barcode && (excludedProductVariantId == null || variant.ProductVariantId != excludedProductVariantId),
            cancellationToken);
    }

    public Task AddProductAsync(Product product, CancellationToken cancellationToken)
    {
        return applicationDbContext.Products.AddAsync(product, cancellationToken).AsTask();
    }

    public Task AddProductImageAsync(ProductImage productImage, CancellationToken cancellationToken)
    {
        return applicationDbContext.ProductImages.AddAsync(productImage, cancellationToken).AsTask();
    }

    public void RemoveProductImage(ProductImage productImage)
    {
        applicationDbContext.ProductImages.Remove(productImage);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return applicationDbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Product> BuildProductQuery(bool includeInactive)
    {
        var query = applicationDbContext.Products
            .Include(product => product.Category)
            .Include(product => product.UnitOfMeasure)
            .Include(product => product.Variants)
            .Include(product => product.Images)
            .AsQueryable();
        return includeInactive ? query : query.Where(product => product.IsActive);
    }

    private static string CreateContainsLikePattern(string searchTerm)
    {
        var escapedSearchTerm = searchTerm.Trim()
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal)
            .Replace("[", "\\[", StringComparison.Ordinal);
        return $"%{escapedSearchTerm}%";
    }
}
