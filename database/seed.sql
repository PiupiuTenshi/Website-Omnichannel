/* Pre-release catalog seed. Run only after EF Core migrations. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @now datetime2 = SYSUTCDATETIME();

DECLARE @Units TABLE (Code nvarchar(20), Name nvarchar(100), AllowsDecimal bit, DecimalScale int);
INSERT INTO @Units VALUES
    ('KG', N'Kilogram', 1, 1), ('PACK', N'Gói', 0, 0), ('BOTTLE', N'Chai', 0, 0),
    ('CAN', N'Lon', 0, 0), ('BOX', N'Hộp', 0, 0);
INSERT INTO UnitsOfMeasure (UnitOfMeasureId, Code, Name, AllowsDecimal, DecimalScale, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), Code, Name, AllowsDecimal, DecimalScale, 1, @now, @now
FROM @Units source WHERE NOT EXISTS (SELECT 1 FROM UnitsOfMeasure target WHERE target.Code = source.Code);

DECLARE @Categories TABLE (Slug nvarchar(160), Name nvarchar(150), SortOrder int);
INSERT INTO @Categories VALUES
    ('rau-cu', N'Rau củ', 1), ('trai-cay', N'Trái cây', 2), ('thuc-pham-kho', N'Thực phẩm khô', 3),
    ('do-uong', N'Đồ uống', 4), ('gia-vi', N'Gia vị', 5), ('nhu-yeu-pham', N'Nhu yếu phẩm', 6);
INSERT INTO Categories (CategoryId, Name, Slug, ParentCategoryId, SortOrder, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), Name, Slug, NULL, SortOrder, 1, @now, @now
FROM @Categories source WHERE NOT EXISTS (SELECT 1 FROM Categories target WHERE target.Slug = source.Slug);

DECLARE @Products TABLE (Slug nvarchar(260), Name nvarchar(250), CategorySlug nvarchar(160), UnitCode nvarchar(20), SellingPrice decimal(18,2), CompareAtPrice decimal(18,2), Barcode nvarchar(64));
INSERT INTO @Products VALUES
    ('ca-chua-da-lat', N'Cà chua Đà Lạt', 'rau-cu', 'KG', 28000, 32000, '893000000001'),
    ('ca-rot-da-lat', N'Cà rốt Đà Lạt', 'rau-cu', 'KG', 24000, 28000, '893000000002'),
    ('bap-cai', N'Bắp cải', 'rau-cu', 'KG', 22000, 26000, '893000000003'),
    ('rau-cai-xanh', N'Rau cải xanh', 'rau-cu', 'KG', 18000, 22000, '893000000004'),
    ('khoai-tay', N'Khoai tây', 'rau-cu', 'KG', 30000, 35000, '893000000005'),
    ('hanh-tay', N'Hành tây', 'rau-cu', 'KG', 26000, 30000, '893000000006'),
    ('chuoi', N'Chuối', 'trai-cay', 'KG', 35000, 40000, '893000000007'),
    ('tao', N'Táo', 'trai-cay', 'KG', 55000, 65000, '893000000008'),
    ('cam', N'Cam', 'trai-cay', 'KG', 45000, 50000, '893000000009'),
    ('dua-hau', N'Dưa hấu', 'trai-cay', 'KG', 18000, 22000, '893000000010'),
    ('mi-goi-hao-hao', N'Mì gói Hảo Hảo', 'thuc-pham-kho', 'PACK', 4500, 5500, '893000000011'),
    ('mi-ly', N'Mì ly', 'thuc-pham-kho', 'BOX', 12000, 14000, '893000000012'),
    ('gao-5kg', N'Gạo 5kg', 'thuc-pham-kho', 'PACK', 120000, 135000, '893000000013'),
    ('nuoc-suoi-500ml', N'Nước suối 500ml', 'do-uong', 'BOTTLE', 6000, 7000, '893000000014'),
    ('coca-cola-330ml', N'Coca-Cola 330ml', 'do-uong', 'CAN', 11000, 13000, '893000000015'),
    ('sua-tuoi-1l', N'Sữa tươi 1L', 'do-uong', 'BOTTLE', 38000, 42000, '893000000016'),
    ('nuoc-mam', N'Nước mắm', 'gia-vi', 'BOTTLE', 42000, 48000, '893000000017'),
    ('dau-an-1l', N'Dầu ăn 1L', 'gia-vi', 'BOTTLE', 55000, 62000, '893000000018'),
    ('giay-ve-sinh-10-cuon', N'Giấy vệ sinh 10 cuộn', 'nhu-yeu-pham', 'PACK', 62000, 70000, '893000000019'),
    ('nuoc-giat-2kg', N'Nước giặt 2kg', 'nhu-yeu-pham', 'PACK', 95000, 110000, '893000000020');

INSERT INTO Products (ProductId, Name, Slug, Description, CategoryId, UnitOfMeasureId, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), source.Name, source.Slug, NULL, categoryItem.CategoryId, unitItem.UnitOfMeasureId, 1, @now, @now
FROM @Products source
JOIN Categories categoryItem ON categoryItem.Slug = source.CategorySlug
JOIN UnitsOfMeasure unitItem ON unitItem.Code = source.UnitCode
WHERE NOT EXISTS (SELECT 1 FROM Products target WHERE target.Slug = source.Slug);

INSERT INTO ProductVariants (ProductVariantId, ProductId, Name, Sku, Barcode, SellingPrice, CompareAtPrice, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), productItem.ProductId, N'Tiêu chuẩn', CONCAT('P02-', UPPER(source.Slug)), source.Barcode, source.SellingPrice, source.CompareAtPrice, 1, @now, @now
FROM @Products source
JOIN Products productItem ON productItem.Slug = source.Slug
WHERE NOT EXISTS (SELECT 1 FROM ProductVariants target WHERE target.Sku = CONCAT('P02-', UPPER(source.Slug)));

COMMIT TRANSACTION;
