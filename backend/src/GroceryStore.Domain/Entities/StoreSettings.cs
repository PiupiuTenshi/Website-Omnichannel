namespace GroceryStore.Domain.Entities;

public sealed class StoreSettings
{
    public static readonly Guid DEFAULT_ID = Guid.Parse("2a3f783e-81a8-4ce4-9c9e-02176094c248");

    private StoreSettings()
    {
        Name = string.Empty;
        Address = string.Empty;
    }

    public StoreSettings(string name, string? email, string address, bool isOnlineOrderingEnabled = true)
    {
        StoreSettingsId = DEFAULT_ID;
        Name = name;
        Email = email;
        Address = address;
        IsOnlineOrderingEnabled = isOnlineOrderingEnabled;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid StoreSettingsId { get; private set; }

    public string Name { get; private set; }

    public string? Email { get; private set; }

    public string Address { get; private set; }

    public bool IsOnlineOrderingEnabled { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public ICollection<StoreContactNumber> ContactNumbers { get; private set; } = new List<StoreContactNumber>();

    public void Update(string name, string? email, string address, bool isOnlineOrderingEnabled, IEnumerable<string> contactNumbers)
    {
        Name = name;
        Email = email;
        Address = address;
        IsOnlineOrderingEnabled = isOnlineOrderingEnabled;
        UpdatedAtUtc = DateTime.UtcNow;

        ContactNumbers.Clear();

        foreach (var contactNumber in contactNumbers.Distinct(StringComparer.Ordinal))
        {
            ContactNumbers.Add(new StoreContactNumber(StoreSettingsId, contactNumber));
        }
    }
}
