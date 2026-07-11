using GroceryStore.Domain;

namespace GroceryStore.UnitTests;

public sealed class DomainAssemblyTests
{
    [Fact]
    public void DomainAssembly_HasExpectedName()
    {
        Assert.Equal("GroceryStore.Domain", typeof(DomainAssemblyMarker).Assembly.GetName().Name);
    }
}
