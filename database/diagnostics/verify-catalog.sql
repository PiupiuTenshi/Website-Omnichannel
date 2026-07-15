SET NOCOUNT ON;

SELECT DB_NAME() AS DatabaseName;
SELECT COUNT(*) AS CategoryCount FROM Categories;
SELECT COUNT(*) AS ProductCount FROM Products;
SELECT COUNT(*) AS ProductVariantCount FROM ProductVariants;
SELECT COUNT(*) AS ProductImageCount FROM ProductImages;

SELECT TOP (1)
    productItem.ProductId,
    productItem.Name,
    categoryItem.Name AS CategoryName,
    unitItem.Code AS UnitCode,
    variantItem.ProductVariantId,
    variantItem.Sku,
    imageItem.ObjectKey
FROM Products productItem
JOIN Categories categoryItem ON categoryItem.CategoryId = productItem.CategoryId
JOIN UnitsOfMeasure unitItem ON unitItem.UnitOfMeasureId = productItem.UnitOfMeasureId
LEFT JOIN ProductVariants variantItem ON variantItem.ProductId = productItem.ProductId
LEFT JOIN ProductImages imageItem ON imageItem.ProductId = productItem.ProductId
WHERE productItem.IsActive = 1
ORDER BY productItem.Name;
