using GroceryStore.Domain.Entities;

namespace GroceryStore.UnitTests;

public sealed class CatalogDomainTests
{
    [Fact]
    public void ProductVariant_RejectsNonPositiveSellingPrice()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new ProductVariant(Guid.NewGuid(), "Standard", "SKU-1", null, 0m, null, true));
    }

    [Fact]
    public void ProductVariant_RejectsCompareAtPriceThatIsNotHigherThanSellingPrice()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new ProductVariant(Guid.NewGuid(), "Standard", "SKU-1", null, 10000m, 10000m, true));
    }

    [Fact]
    public void UnitOfMeasure_RejectsDecimalScaleForIntegerUnit()
    {
        Assert.Throws<ArgumentException>(() => new UnitOfMeasure("PACK", "Pack", false, 1, true));
    }

    [Fact]
    public void Category_RejectsItselfAsParent()
    {
        var category = new Category("Vegetables", "vegetables", null, 1, true);
        Assert.Throws<ArgumentException>(() => category.Update("Vegetables", "vegetables", category.CategoryId, 1, true));
    }
}
