using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Seeding;

public sealed record DemoCatalogSummary(int Categories, int Units, int Suppliers, int Products, int Variants, int InventoryBatches, int Users);

public sealed class DemoCatalogSeeder(ApplicationDbContext context)
{
    private sealed record ProductSeed(string Name, string Slug, string CategorySlug, string UnitCode, string Sku, string Barcode, decimal Price, decimal? CompareAtPrice, decimal Cost, decimal Quantity);

    private static readonly ProductSeed[] PRODUCTS =
    [
        new("Gạo ST25 thơm lúa tôm", "gao-st25-thom-lua-tom", "gao-mi", "kg", "GAO-ST25-1KG", "8938501230001", 39000m, 45000m, 32000m, 80m),
        new("Mì Hảo Hảo tôm chua cay", "mi-hao-hao-tom-chua-cay", "gao-mi", "goi", "MI-HAOHAO-075", "8934563138163", 4500m, null, 3500m, 180m),
        new("Dầu ăn Simply chai 1L", "dau-an-simply-1l", "gia-vi", "chai", "DAU-SIMPLY-1L", "8934563310446", 62000m, 68000m, 53000m, 36m),
        new("Nước mắm Nam Ngư 500ml", "nuoc-mam-nam-ngu-500ml", "gia-vi", "chai", "NAMNGU-500", "8934563137173", 29000m, null, 24000m, 48m),
        new("Đường Biên Hòa 1kg", "duong-bien-hoa-1kg", "gia-vi", "goi", "DUONG-BH-1KG", "8934683002002", 27000m, null, 22000m, 60m),
        new("Sữa tươi TH true MILK 1L", "sua-tuoi-th-1l", "do-uong", "hop", "SUA-TH-1L", "8935217401446", 39000m, null, 33000m, 30m),
        new("Coca-Cola lon 330ml", "coca-cola-lon-330ml", "do-uong", "lon", "COCA-330", "8935049501003", 10000m, null, 7800m, 96m),
        new("Nước khoáng Lavie 500ml", "nuoc-khoang-lavie-500ml", "do-uong", "chai", "LAVIE-500", "8935049501690", 6500m, null, 4500m, 120m),
        new("Bánh Chocopie 6 cái", "banh-chocopie-6-cai", "banh-keo", "hop", "CHOCO-6", "8936036020018", 32000m, 36000m, 26000m, 45m),
        new("Bánh que Pocky sô-cô-la", "banh-que-pocky-socola", "banh-keo", "hop", "POCKY-CHOC", "8851019010410", 18000m, 21000m, 14000m, 50m),
        new("Kẹo Alpenliebe sữa túi 160g", "keo-alpenliebe-sua-160g", "banh-keo", "goi", "ALPEN-160", "8934588011253", 22000m, null, 17000m, 40m),
        new("Nước giặt OMO cửa trên 2.7kg", "nuoc-giat-omo-27kg", "cham-soc-nha", "tui", "OMO-27KG", "8934868102015", 165000m, 179000m, 142000m, 20m),
        new("Gạo nàng thơm Chợ Đào 5kg", "gao-nang-thom-cho-dao-5kg", "gao-mi", "tui", "GAO-NANGTHOM-5KG", "8938501230002", 145000m, null, 124000m, 25m),
        new("Phở bò Vifon gói 65g", "pho-bo-vifon-65g", "gao-mi", "goi", "PHO-VIFON-65", "8934563101044", 8000m, null, 6200m, 90m),
        new("Cháo thịt bằm Bích Chi 50g", "chao-thit-bam-bich-chi-50g", "gao-mi", "goi", "CHAO-BC-50", "8934868170052", 7500m, null, 5400m, 75m),
        new("Bột ngọt Ajinomoto 400g", "bot-ngot-ajinomoto-400g", "gia-vi", "goi", "AJI-400", "8934563114044", 42000m, null, 35500m, 35m),
        new("Hạt nêm Knorr thịt thăn xương 400g", "hat-nem-knorr-400g", "gia-vi", "goi", "KNORR-400", "8934563137043", 53000m, 59000m, 44500m, 30m),
        new("Tương ớt Chinsu 250g", "tuong-ot-chinsu-250g", "gia-vi", "chai", "CHINSU-OT-250", "8934563112101", 18000m, null, 14000m, 55m),
        new("Nước tương Maggi 700ml", "nuoc-tuong-maggi-700ml", "gia-vi", "chai", "MAGGI-700", "8934804047905", 32000m, null, 26500m, 32m),
        new("Trà xanh không độ chai 455ml", "tra-xanh-khong-do-455ml", "do-uong", "chai", "KHD-455", "8934588012137", 11000m, null, 8300m, 90m),
        new("Pepsi lon 330ml", "pepsi-lon-330ml", "do-uong", "lon", "PEPSI-330", "8934588010188", 10000m, null, 7800m, 96m),
        new("Bia Heineken lon 330ml", "bia-heineken-lon-330ml", "do-uong", "lon", "HEINEKEN-330", "8936048510012", 22000m, null, 18600m, 72m),
        new("Sữa đặc Ngôi Sao Phương Nam 380g", "sua-dac-ngoi-sao-phuong-nam-380g", "do-uong", "hop", "SUA-DAC-380", "8934673101036", 29000m, null, 24000m, 36m),
        new("Bánh Oreo vị vani 133g", "banh-oreo-vani-133g", "banh-keo", "goi", "OREO-VANI-133", "8934804034295", 21000m, null, 16500m, 48m),
        new("Snack khoai tây O'Star tảo biển 45g", "snack-ostar-tao-bien-45g", "banh-keo", "goi", "OSTAR-45", "8934588017842", 12000m, null, 9000m, 65m),
        new("Khăn giấy rút Bless You 180 tờ", "khan-giay-bless-you-180-to", "cham-soc-nha", "hop", "BLESS-180", "8936036022258", 25000m, null, 19500m, 40m),
        new("Nước rửa chén Sunlight chanh 750g", "nuoc-rua-chen-sunlight-750g", "cham-soc-nha", "chai", "SUNLIGHT-750", "8934868117088", 39000m, 44000m, 32000m, 28m),
        new("Kem đánh răng P/S bảo vệ 180g", "kem-danh-rang-ps-180g", "cham-soc-nha", "hop", "PS-180", "8934868110010", 31000m, null, 25000m, 38m),
        new("Xà phòng Lifebuoy bảo vệ 90g", "xa-phong-lifebuoy-90g", "cham-soc-nha", "hop", "LIFEBUOY-90", "8934868109106", 15000m, null, 11000m, 60m)
    ];

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        var units = new[]
        {
            new UnitOfMeasure("kg", "Kilogram", true, 3, true), new UnitOfMeasure("goi", "Gói", false, 0, true),
            new UnitOfMeasure("chai", "Chai", false, 0, true), new UnitOfMeasure("hop", "Hộp", false, 0, true),
            new UnitOfMeasure("lon", "Lon", false, 0, true), new UnitOfMeasure("tui", "Túi", false, 0, true)
        };
        foreach (var unit in units.Where(unit => !context.UnitsOfMeasure.Any(existing => existing.Code == unit.Code))) context.UnitsOfMeasure.Add(unit);

        var categories = new[]
        {
            new Category("Gạo, mì & thực phẩm khô", "gao-mi", null, 1, true), new Category("Gia vị & đồ nấu ăn", "gia-vi", null, 2, true),
            new Category("Đồ uống", "do-uong", null, 3, true), new Category("Bánh kẹo", "banh-keo", null, 4, true),
            new Category("Chăm sóc nhà cửa", "cham-soc-nha", null, 5, true)
        };
        foreach (var category in categories.Where(category => !context.Categories.Any(existing => existing.Slug == category.Slug))) context.Categories.Add(category);
        await context.SaveChangesAsync(cancellationToken);

        var supplier = await context.Suppliers.FirstOrDefaultAsync(item => item.Name == "Nhà cung cấp Tổng hợp", cancellationToken);
        if (supplier is null)
        {
            supplier = new Supplier("Nhà cung cấp Tổng hợp", "Bộ phận bán hàng", "0909090909", "ncc@demo.local", "Đà Lạt, Lâm Đồng", true);
            context.Suppliers.Add(supplier);
            await context.SaveChangesAsync(cancellationToken);
        }

        var unitMap = (await context.UnitsOfMeasure.ToDictionaryAsync(unit => unit.Code, unit => unit.UnitOfMeasureId, cancellationToken))
            .ToDictionary(item => item.Key, item => item.Value, StringComparer.OrdinalIgnoreCase);
        var categoryMap = (await context.Categories.ToDictionaryAsync(category => category.Slug, category => category.CategoryId, cancellationToken))
            .ToDictionary(item => item.Key, item => item.Value, StringComparer.OrdinalIgnoreCase);
        foreach (var seed in PRODUCTS)
        {
            if (await context.Products.AnyAsync(product => product.Slug == seed.Slug, cancellationToken)) continue;
            var product = new Product(seed.Name, seed.Slug, $"Sản phẩm test: {seed.Name}", categoryMap[seed.CategorySlug], unitMap[seed.UnitCode], true);
            var variant = product.AddVariant("Tiêu chuẩn", seed.Sku, seed.Barcode, seed.Price, seed.CompareAtPrice, true);
            if (seed.CompareAtPrice is not null)
            {
                variant.Update("Tiêu chuẩn", seed.Sku, seed.Barcode, seed.Price, seed.CompareAtPrice, true, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(30));
            }
            context.Products.Add(product);
            context.ProductSuppliers.Add(new ProductSupplier(product.ProductId, supplier.SupplierId, seed.Sku, true));
            context.InventoryBatches.Add(new InventoryBatch(variant.ProductVariantId, supplier.SupplierId, seed.Quantity, seed.Cost, DateTime.UtcNow, null, DateTime.UtcNow.AddMonths(9)));
        }
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<DemoCatalogSummary> GetSummaryAsync(CancellationToken cancellationToken) => new(
        await context.Categories.CountAsync(cancellationToken),
        await context.UnitsOfMeasure.CountAsync(cancellationToken),
        await context.Suppliers.CountAsync(cancellationToken),
        await context.Products.CountAsync(cancellationToken),
        await context.ProductVariants.CountAsync(cancellationToken),
        await context.InventoryBatches.CountAsync(cancellationToken),
        await context.Users.CountAsync(cancellationToken));
}
