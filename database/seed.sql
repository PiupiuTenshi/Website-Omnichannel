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
    ('rau-cu', N'Rau củ', 1),
    ('trai-cay', N'Trái cây', 2),
    ('thit-ca', N'Thịt cá', 3),
    ('sua-trung', N'Sữa & Trứng', 4),
    ('do-uong', N'Nước uống', 5),
    ('an-vat', N'Ăn vặt', 6),
    ('gia-vi', N'Gia vị & Dầu ăn', 7),
    ('dong-lanh', N'Đông lạnh', 8),
    ('mi-an-lien', N'Mì & Cháo ăn liền', 9),
    ('nhu-yeu-pham', N'Nhu yếu phẩm', 10);

INSERT INTO Categories (CategoryId, Name, Slug, ParentCategoryId, SortOrder, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), Name, Slug, NULL, SortOrder, 1, @now, @now
FROM @Categories source WHERE NOT EXISTS (SELECT 1 FROM Categories target WHERE target.Slug = source.Slug);

DECLARE @Products TABLE (
    Slug nvarchar(260), 
    Name nvarchar(250), 
    CategorySlug nvarchar(160), 
    UnitCode nvarchar(20), 
    SellingPrice decimal(18,2), 
    CompareAtPrice decimal(18,2), 
    Barcode nvarchar(64),
    ImageUrl nvarchar(500)
);

INSERT INTO @Products VALUES
    /* Category 1: Rau củ (rau-cu) */
    ('ca-chua-da-lat', N'Cà chua Đà Lạt', 'rau-cu', 'KG', 28000, 32000, '8936011970012', 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400'),
    ('ca-rot-da-lat', N'Cà rốt Đà Lạt', 'rau-cu', 'KG', 24000, 28000, '8936011970029', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'),
    ('bap-cai', N'Bắp cải', 'rau-cu', 'KG', 22000, 26000, '8936011970036', 'https://images.unsplash.com/photo-1581074817932-847c457d40cd?w=400'),
    ('rau-cai-xanh', N'Rau cải xanh', 'rau-cu', 'KG', 18000, 22000, '8936011970043', 'https://images.unsplash.com/photo-1628773822203-086d98482ddf?w=400'),
    ('khoai-tay', N'Khoai tây', 'rau-cu', 'KG', 30000, 35000, '8936011970050', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'),
    ('hanh-tay', N'Hành tây', 'rau-cu', 'KG', 26000, 30000, '8936011970067', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400'),
    ('nam-dui-ga', N'Nấm đùi gà', 'rau-cu', 'KG', 45000, 52000, '8936011970074', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('bong-cai-xanh', N'Bông cải xanh', 'rau-cu', 'KG', 38000, 42000, '8936011970081', 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400'),
    ('bi-do', N'Bí đỏ', 'rau-cu', 'KG', 25000, 30000, '8936011970098', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400'),
    ('toi-ly-son', N'Tỏi Lý Sơn', 'rau-cu', 'KG', 90000, 100000, '8936011970104', 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400'),

    /* Category 2: Trái cây (trai-cay) */
    ('chuoi-laba', N'Chuối Laba', 'trai-cay', 'KG', 35000, 40000, '8936011970111', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'),
    ('tao-fuji', N'Táo Fuji', 'trai-cay', 'KG', 55000, 65000, '8936011970128', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400'),
    ('cam-sanh', N'Cam sành', 'trai-cay', 'KG', 45000, 50000, '8936011970135', 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400'),
    ('dua-hau-khong-hat', N'Dưa hấu không hạt', 'trai-cay', 'KG', 18000, 22000, '8936011970142', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'),
    ('xoai-cat-hoa-loc', N'Xoài cát Hòa Lộc', 'trai-cay', 'KG', 65000, 75000, '8936011970159', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'),
    ('bo-sap-dak-lak', N'Bơ sáp Đắk Lắk', 'trai-cay', 'KG', 50000, 60000, '8936011970166', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400'),
    ('thanh-long-ruot-do', N'Thanh long ruột đỏ', 'trai-cay', 'KG', 30000, 35000, '8936011970173', 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=400'),
    ('buoi-da-xanh', N'Bưởi da xanh', 'trai-cay', 'KG', 60000, 70000, '8936011970180', 'https://images.unsplash.com/photo-1597854710119-a5a84362a909?w=400'),
    ('nho-mau-don', N'Nho mẫu đơn', 'trai-cay', 'KG', 150000, 180000, '8936011970197', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'),
    ('chom-chom-nhan', N'Chôm chôm nhãn', 'trai-cay', 'KG', 40000, 48000, '8936011970203', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'),

    /* Category 3: Thịt cá (thit-ca) */
    ('ba-roi-heo-cp', N'Ba rọi heo CP', 'thit-ca', 'KG', 160000, 180000, '8936011970210', 'https://images.unsplash.com/photo-1602472787305-66776b618c88?w=400'),
    ('than-bo-uc', N'Thăn bò Úc', 'thit-ca', 'KG', 280000, 320000, '8936011970227', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'),
    ('uc-ga-phi-le', N'Ức gà phi lê', 'thit-ca', 'KG', 85000, 95000, '8936011970234', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400'),
    ('ca-hoi-phi-le', N'Cá hồi phi lê', 'thit-ca', 'KG', 420000, 480000, '8936011970241', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400'),
    ('tom-the-chan-trang', N'Tôm thẻ chân trắng', 'thit-ca', 'KG', 180000, 210000, '8936011970258', 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400'),
    ('suon-non-heo', N'Sườn non heo', 'thit-ca', 'KG', 190000, 220000, '8936011970265', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400'),
    ('dui-toi-ga', N'Đùi tỏi gà', 'thit-ca', 'KG', 65000, 75000, '8936011970272', 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=400'),
    ('muc-ong-tuoi', N'Mực ống tươi', 'thit-ca', 'KG', 220000, 250000, '8936011970289', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('ca-loc-lam-sach', N'Cá lóc làm sạch', 'thit-ca', 'KG', 95000, 110000, '8936011970296', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400'),
    ('ngheu-lua', N'Nghêu lụa', 'thit-ca', 'KG', 50000, 60000, '8936011970302', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400'),

    /* Category 4: Sữa & Trứng (sua-trung) */
    ('trung-ga-vinamilk', N'Trứng gà Vinamilk', 'sua-trung', 'BOX', 32000, 36000, '8936011970319', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400'),
    ('sua-vinamilk-it-duong', N'Sữa tươi Vinamilk ít đường', 'sua-trung', 'BOX', 32000, 36000, '8936011970326', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
    ('trung-vit-lon', N'Trứng vịt lộn', 'sua-trung', 'BOX', 40000, 45000, '8936011970333', 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400'),
    ('sua-chua-vinamilk', N'Sữa chua Vinamilk', 'sua-trung', 'BOX', 28000, 32000, '8936011970340', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400'),
    ('bo-lat-anchor', N'Bơ lạt Anchor 250g', 'sua-trung', 'PACK', 75000, 85000, '8936011970357', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400'),
    ('pho-mai-con-bo-cuoi', N'Phô mai Con Bò Cười', 'sua-trung', 'BOX', 39000, 44000, '8936011970364', 'https://images.unsplash.com/photo-1528279027-68f0d7f1996f?w=400'),
    ('sua-dac-ong-tho', N'Sữa đặc Ông Thọ lon', 'sua-trung', 'CAN', 22000, 25000, '8936011970371', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
    ('sua-th-true-milk', N'Sữa tươi TH True Milk 1L', 'sua-trung', 'BOX', 34000, 38000, '8936011970388', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'),
    ('sua-chua-uong-proby', N'Sữa chua uống Proby', 'sua-trung', 'PACK', 25000, 29000, '8936011970395', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400'),
    ('trung-cut-vi', N'Trứng cút vỉ', 'sua-trung', 'BOX', 18000, 22000, '8936011970401', 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400'),

    /* Category 5: Nước uống (do-uong) */
    ('nuoc-aquafina-500ml', N'Nước Aquafina 500ml', 'do-uong', 'BOTTLE', 5500, 6500, '8936011970418', 'https://images.unsplash.com/photo-1616118132261-26c71049c666?w=400'),
    ('coca-cola-320ml', N'Coca-Cola lon 320ml', 'do-uong', 'CAN', 10500, 12000, '8936011970425', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'),
    ('pepsi-320ml', N'Pepsi lon 320ml', 'do-uong', 'CAN', 10000, 11500, '8936011970432', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400'),
    ('bia-tiger-330ml', N'Bia Tiger lon 330ml', 'do-uong', 'CAN', 18500, 21000, '8936011970449', 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=400'),
    ('tra-xanh-khong-do', N'Trà xanh Không Độ', 'do-uong', 'BOTTLE', 9000, 10500, '8936011970456', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400'),
    ('nuoc-redbull', N'Nước tăng lực Redbull', 'do-uong', 'CAN', 13000, 15000, '8936011970463', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'),
    ('sua-dau-nanh-fami', N'Sữa đậu nành Fami', 'do-uong', 'PACK', 5000, 6000, '8936011970470', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'),
    ('nuoc-yen-ngan-nhi', N'Nước yến ngân nhĩ', 'do-uong', 'CAN', 12000, 14500, '8936011970487', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400'),
    ('tra-sua-kirin', N'Trà sữa Kirin Tea Break', 'do-uong', 'BOTTLE', 11000, 13000, '8936011970494', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400'),
    ('nuoc-cam-twister', N'Nước cam ép Twister', 'do-uong', 'BOTTLE', 9500, 11000, '8936011970500', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400'),

    /* Category 6: Ăn vặt (an-vat) */
    ('snack-lays-tu-nhien', N'Snack khoai tây Lays', 'an-vat', 'PACK', 12000, 14000, '8936011970517', 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=400'),
    ('snack-oishi-tom', N'Snack Oishi tôm cay', 'an-vat', 'PACK', 6000, 7000, '8936011970524', 'https://images.unsplash.com/photo-1599490659223-e1b69494db53?w=400'),
    ('keo-deo-haribo', N'Kẹo dẻo Haribo Goldbears', 'an-vat', 'PACK', 22000, 26000, '8936011970531', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400'),
    ('banh-cosy-marie', N'Bánh quy Cosy Marie', 'an-vat', 'PACK', 16000, 19000, '8936011970548', 'https://images.unsplash.com/photo-1558961309-dbdf71771f82?w=400'),
    ('banh-chocopie-6p', N'Bánh Chocopie 6 cái', 'an-vat', 'BOX', 32000, 36000, '8936011970555', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400'),
    ('hat-dieu-rang-muoi', N'Hạt điều rang muối 250g', 'an-vat', 'BOX', 85000, 95000, '8936011970562', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('kho-bo-xe-soi', N'Khô bò xé sợi 100g', 'an-vat', 'PACK', 65000, 75000, '8936011970579', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('banh-pocky-dau', N'Bánh que Pocky dâu', 'an-vat', 'BOX', 18000, 21000, '8936011970586', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400'),
    ('rong-bien-taokaenoi', N'Rong biển ăn liền Tao Kae Noi', 'an-vat', 'PACK', 25000, 29000, '8936011970593', 'https://images.unsplash.com/photo-1599490659223-e1b69494db53?w=400'),
    ('keo-cool-air-hu', N'Kẹo cao su Cool Air hũ', 'an-vat', 'BOX', 24000, 28000, '8936011970609', 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400'),

    /* Category 7: Gia vị & Dầu ăn (gia-vi) */
    ('nuoc-mam-nam-ngu', N'Nước mắm Nam Ngư', 'gia-vi', 'BOTTLE', 42000, 48000, '8936011970616', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'),
    ('dau-an-simply-1l', N'Dầu ăn Simply đậu nành 1L', 'gia-vi', 'BOTTLE', 58000, 65000, '8936011970623', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
    ('muoi-say-iot', N'Muối sấy i-ốt Hải Tĩnh 500g', 'gia-vi', 'PACK', 6000, 8000, '8936011970630', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('duong-bien-hoa-1kg', N'Đường tinh luyện Biên Hòa 1kg', 'gia-vi', 'PACK', 26000, 30000, '8936011970647', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('hat-nem-knorr', N'Hạt nêm Knorr 400g', 'gia-vi', 'PACK', 38000, 43000, '8936011970654', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('tuong-ot-chinsu', N'Tương ớt Chinsu 250g', 'gia-vi', 'BOTTLE', 14000, 16000, '8936011970661', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'),
    ('bot-ngot-ajinomoto', N'Bột ngọt Ajinomoto 454g', 'gia-vi', 'PACK', 34000, 38000, '8936011970678', 'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=400'),
    ('tieu-phu-quoc', N'Tiêu chín Phú Quốc xay hũ', 'gia-vi', 'BOX', 28000, 32000, '8936011970685', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400'),
    ('dau-hao-maggi', N'Dầu hào Maggi chai 350g', 'gia-vi', 'BOTTLE', 22000, 26000, '8936011970692', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'),
    ('giam-gao-lisa', N'Giấm gạo Lisa chai 250ml', 'gia-vi', 'BOTTLE', 12000, 15000, '8936011970708', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'),

    /* Category 8: Đông lạnh (dong-lanh) */
    ('ca-vien-chien', N'Cá viên chiên ngon 500g', 'dong-lanh', 'PACK', 45000, 52000, '8936011970715', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('khoai-tay-chien-dong-lanh', N'Khoai tây chiên sợi 1kg', 'dong-lanh', 'PACK', 55000, 65000, '8936011970722', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400'),
    ('ha-cao-cau-tre', N'Há cảo mini Cầu Tre 400g', 'dong-lanh', 'PACK', 48000, 56000, '8936011970739', 'https://images.unsplash.com/photo-1496116211217-41af8963457b?w=400'),
    ('nem-chua-ran-dong-lanh', N'Nem chua rán 20 cái', 'dong-lanh', 'BOX', 60000, 70000, '8936011970746', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('cha-gio-cau-tre', N'Chả giò đặc biệt Cầu Tre', 'dong-lanh', 'PACK', 52000, 62000, '8936011970753', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('dau-hu-hai-san-pho-mai', N'Đậu hũ hải sản phô mai', 'dong-lanh', 'PACK', 65000, 75000, '8936011970760', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('xuc-xich-duc-xong-khoi', N'Xúc xích Đức xông khói', 'dong-lanh', 'PACK', 78000, 90000, '8936011970777', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),
    ('lau-dau-ca-hoi', N'Lẩu đầu cá hồi đông lạnh', 'dong-lanh', 'PACK', 45000, 55000, '8936011970784', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400'),
    ('kem-celano-dau', N'Kem Celano dâu ly', 'dong-lanh', 'BOX', 16000, 19000, '8936011970791', 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400'),
    ('banh-bao-nhan-thit', N'Bánh bao nhân thịt trứng cút', 'dong-lanh', 'BOX', 30000, 35000, '8936011970807', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400'),

    /* Category 9: Mì & Cháo ăn liền (mi-an-lien) */
    ('mi-hao-hao-tom-cay', N'Mì gói Hảo Hảo Tôm Cay', 'mi-an-lien', 'PACK', 4500, 5500, '8936011970814', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('mi-ly-modern', N'Mì ly Modern lẩu thái', 'mi-an-lien', 'BOX', 12000, 14000, '8936011970821', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('mi-koreno-bo-cay', N'Mì Koreno vị bò cay', 'mi-an-lien', 'PACK', 11000, 13000, '8936011970838', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('pho-bo-vifon', N'Phở bò ăn liền Vifon', 'mi-an-lien', 'PACK', 8500, 10000, '8936011970845', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('mi-cay-samyang', N'Mì cay Samyang đỏ', 'mi-an-lien', 'PACK', 32000, 36000, '8936011970852', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('chao-sen-bat-bao', N'Cháo sen bát bảo ăn liền', 'mi-an-lien', 'CAN', 18000, 21000, '8936011970869', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('hu-tieu-cung-dinh', N'Hộp hủ tiếu Nam Vang Cung Đình', 'mi-an-lien', 'BOX', 15000, 18000, '8936011970876', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('mi-omachi-spaghetti', N'Mì trộn Omachi Spaghetti', 'mi-an-lien', 'PACK', 9500, 11000, '8936011970883', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('chao-gau-do', N'Cháo ăn liền Gấu Đỏ', 'mi-an-lien', 'PACK', 4000, 5000, '8936011970890', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),
    ('mien-phu-huong', N'Miến gà Phú Hương', 'mi-an-lien', 'PACK', 9000, 10500, '8936011970906', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'),

    /* Category 10: Nhu yếu phẩm (nhu-yeu-pham) */
    ('giay-ve-sinh-silkwell', N'Giấy vệ sinh Silkwell 10 cuộn', 'nhu-yeu-pham', 'PACK', 62000, 70000, '8936011970913', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'),
    ('nuoc-giat-ariel', N'Nước giặt Ariel túi 2.15kg', 'nhu-yeu-pham', 'PACK', 145000, 165000, '8936011970920', 'https://images.unsplash.com/photo-1610557892470-76d74cd1228d?w=400'),
    ('nuoc-rua-chen-sunlight', N'Nước rửa chén Sunlight Chanh', 'nhu-yeu-pham', 'BOTTLE', 28000, 32000, '8936011970937', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'),
    ('dau-goi-clear', N'Dầu gội Clear bạc hà 630ml', 'nhu-yeu-pham', 'BOTTLE', 145000, 165000, '8936011970944', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400'),
    ('kem-colgate', N'Kem đánh răng Colgate', 'nhu-yeu-pham', 'BOX', 24000, 28000, '8936011970951', 'https://images.unsplash.com/photo-1559599101-3097cd6687d9?w=400'),
    ('xa-bong-lifebuoy', N'Xà bông cục Lifebuoy', 'nhu-yeu-pham', 'BOX', 15000, 18000, '8936011970968', 'https://images.unsplash.com/photo-1607006342446-e577c220ec8b?w=400'),
    ('nuoc-xa-comfort', N'Nước xả vải Comfort túi 1.8L', 'nhu-yeu-pham', 'PACK', 118000, 135000, '8936011970975', 'https://images.unsplash.com/photo-1610557892470-76d74cd1228d?w=400'),
    ('sua-tam-lifebuoy', N'Sữa tắm Lifebuoy 850g', 'nhu-yeu-pham', 'BOTTLE', 155000, 175000, '8936011970982', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400'),
    ('khan-uot-bobby', N'Khăn ướt Bobby 100 miếng', 'nhu-yeu-pham', 'PACK', 35000, 40000, '8936011970999', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'),
    ('nuoc-lau-san-sunlight', N'Nước lau sàn Sunlight túi 1kg', 'nhu-yeu-pham', 'PACK', 25000, 29000, '8936011971002', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400');

INSERT INTO Products (ProductId, Name, Slug, Description, CategoryId, UnitOfMeasureId, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), source.Name, source.Slug, NULL, categoryItem.CategoryId, unitItem.UnitOfMeasureId, 1, @now, @now
FROM @Products source
JOIN Categories categoryItem ON categoryItem.Slug = source.CategorySlug
JOIN UnitsOfMeasure unitItem ON unitItem.Code = source.UnitCode
WHERE NOT EXISTS (SELECT 1 FROM Products target WHERE target.Slug = source.Slug);

INSERT INTO ProductVariants (ProductVariantId, ProductId, Name, Sku, Barcode, SellingPrice, CompareAtPrice, IsActive, CreatedAtUtc, UpdatedAtUtc)
SELECT NEWID(), productItem.ProductId, N'Tiêu chuẩn', CONCAT('P03-', UPPER(source.Slug)), source.Barcode, source.SellingPrice, source.CompareAtPrice, 1, @now, @now
FROM @Products source
JOIN Products productItem ON productItem.Slug = source.Slug
WHERE NOT EXISTS (SELECT 1 FROM ProductVariants target WHERE target.Sku = CONCAT('P03-', UPPER(source.Slug)));

INSERT INTO ProductImages (ProductImageId, ProductId, ObjectKey, ContentType, ByteSize, Width, Height, SortOrder, IsPrimary, CreatedAtUtc)
SELECT NEWID(), productItem.ProductId, source.ImageUrl, 'image/jpeg', 45000, 400, 400, 1, 1, @now
FROM @Products source
JOIN Products productItem ON productItem.Slug = source.Slug
WHERE NOT EXISTS (SELECT 1 FROM ProductImages target WHERE target.ProductId = productItem.ProductId);

COMMIT TRANSACTION;
