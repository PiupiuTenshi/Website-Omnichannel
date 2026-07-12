namespace GroceryStore.Domain.Entities;

public sealed class StoreContactNumber
{
    private StoreContactNumber()
    {
        PhoneNumber = string.Empty;
    }

    public StoreContactNumber(Guid storeSettingsId, string phoneNumber)
    {
        StoreSettingsId = storeSettingsId;
        PhoneNumber = phoneNumber;
    }

    public int StoreContactNumberId { get; private set; }

    public Guid StoreSettingsId { get; private set; }

    public string PhoneNumber { get; private set; }
}
