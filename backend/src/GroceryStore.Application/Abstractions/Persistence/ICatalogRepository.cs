using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface ICatalogRepository
{
    Task<IReadOnlyList<Category>> GetCategoriesAsync(bool includeInactive, CancellationToken cancellationToken);

    Task<Category?> GetCategoryAsync(Guid categoryId, CancellationToken cancellationToken);

    Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedCategoryId, CancellationToken cancellationToken);

    Task<bool> CategoryHasChildrenAsync(Guid categoryId, CancellationToken cancellationToken);

    Task<bool> CategoryHasProductsAsync(Guid categoryId, CancellationToken cancellationToken);

    Task<bool> IsCategoryDescendantAsync(Guid categoryId, Guid possibleDescendantId, CancellationToken cancellationToken);

    Task AddCategoryAsync(Category category, CancellationToken cancellationToken);

    void RemoveCategory(Category category);

    Task<IReadOnlyList<UnitOfMeasure>> GetUnitsOfMeasureAsync(bool includeInactive, CancellationToken cancellationToken);

    Task<UnitOfMeasure?> GetUnitOfMeasureAsync(Guid unitOfMeasureId, CancellationToken cancellationToken);

    Task<bool> UnitCodeExistsAsync(string code, Guid? excludedUnitOfMeasureId, CancellationToken cancellationToken);

    Task<bool> UnitHasProductsAsync(Guid unitOfMeasureId, CancellationToken cancellationToken);

    Task AddUnitOfMeasureAsync(UnitOfMeasure unitOfMeasure, CancellationToken cancellationToken);

    void RemoveUnitOfMeasure(UnitOfMeasure unitOfMeasure);

    Task<CatalogProductSearchResult> SearchProductsAsync(CatalogProductSearch search, CancellationToken cancellationToken);

    Task<Product?> GetProductAsync(Guid productId, bool includeInactive, CancellationToken cancellationToken);

    Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken);

    Task<Product?> GetProductByImageIdAsync(Guid productImageId, bool includeInactive, CancellationToken cancellationToken);

    Task<bool> ProductSlugExistsAsync(string slug, Guid? excludedProductId, CancellationToken cancellationToken);

    Task<bool> SkuExistsAsync(string sku, Guid? excludedProductVariantId, CancellationToken cancellationToken);

    Task<bool> BarcodeExistsAsync(string barcode, Guid? excludedProductVariantId, CancellationToken cancellationToken);

    Task AddProductAsync(Product product, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
