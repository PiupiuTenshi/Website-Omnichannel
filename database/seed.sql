/*
  PRE-RELEASE DEMO SEED
  - Idempotent.
  - Run after EF Core migrations.
  - Does not seed ASP.NET Identity passwords.
  - Align table/column names with final migrations before execution.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

-- Units
IF NOT EXISTS (SELECT 1 FROM UnitsOfMeasure WHERE Code = 'KG')
    INSERT INTO UnitsOfMeasure (Code, Name, AllowsDecimal, DecimalScale, IsActive)
    VALUES ('KG', N'Kilogram', 1, 1, 1);
IF NOT EXISTS (SELECT 1 FROM UnitsOfMeasure WHERE Code = 'PACK')
    INSERT INTO UnitsOfMeasure (Code, Name, AllowsDecimal, DecimalScale, IsActive)
    VALUES ('PACK', N'Gói', 0, 0, 1);
IF NOT EXISTS (SELECT 1 FROM UnitsOfMeasure WHERE Code = 'BOTTLE')
    INSERT INTO UnitsOfMeasure (Code, Name, AllowsDecimal, DecimalScale, IsActive)
    VALUES ('BOTTLE', N'Chai', 0, 0, 1);
IF NOT EXISTS (SELECT 1 FROM UnitsOfMeasure WHERE Code = 'CAN')
    INSERT INTO UnitsOfMeasure (Code, Name, AllowsDecimal, DecimalScale, IsActive)
    VALUES ('CAN', N'Lon', 0, 0, 1);
IF NOT EXISTS (SELECT 1 FROM UnitsOfMeasure WHERE Code = 'BOX')
    INSERT INTO UnitsOfMeasure (Code, Name, AllowsDecimal, DecimalScale, IsActive)
    VALUES ('BOX', N'Hộp', 0, 0, 1);

-- Categories
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'rau-cu')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Rau củ', 'rau-cu', 1, 1, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'trai-cay')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Trái cây', 'trai-cay', 2, 1, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mi-thuc-pham-kho')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Mì và thực phẩm khô', 'mi-thuc-pham-kho', 3, 1, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'do-uong')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Đồ uống', 'do-uong', 4, 1, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'gia-vi')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Gia vị', 'gia-vi', 5, 1, SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nhu-yeu-pham')
    INSERT INTO Categories (Name, Slug, SortOrder, IsActive, CreatedAt)
    VALUES (N'Nhu yếu phẩm', 'nhu-yeu-pham', 6, 1, SYSUTCDATETIME());

/*
  Product/variant seeds should be inserted after the final Product schema is generated.
  Suggested demo products (20):
  01 Ca chua Da Lat       11 Mi goi hao hao
  02 Ca rot Da Lat        12 Mi ly
  03 Bap cai              13 Gao 5kg
  04 Rau cai xanh         14 Nuoc suoi 500ml
  05 Khoai tay            15 Coca-Cola 330ml
  06 Hanh tay             16 Sua tuoi 1L
  07 Chuoi                17 Nuoc mam
  08 Tao                  18 Dau an 1L
  09 Cam                  19 Giay ve sinh 10 cuon
  10 Dua hau              20 Nuoc giat 2kg
*/

COMMIT TRANSACTION;
