namespace GroceryStore.Persistence.Seeding;

public sealed class DemoIdentityOptions
{
    public const string SECTION_NAME = "DemoIdentity";

    public bool Enabled { get; init; }

    public IReadOnlyCollection<DemoIdentityAccountOptions> Accounts { get; init; } = Array.Empty<DemoIdentityAccountOptions>();
}
