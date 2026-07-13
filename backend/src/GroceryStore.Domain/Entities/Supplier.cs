namespace GroceryStore.Domain.Entities;

public sealed class Supplier
{
    private Supplier()
    {
        Name = string.Empty;
    }

    public Supplier(string name, string? contactName, string? phoneNumber, string? email, string? address, bool isActive)
    {
        SupplierId = Guid.NewGuid();
        Name = name;
        ContactName = contactName;
        PhoneNumber = phoneNumber;
        Email = email;
        Address = address;
        IsActive = isActive;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid SupplierId { get; private set; }
    public string Name { get; private set; }
    public string? ContactName { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public void Update(string name, string? contactName, string? phoneNumber, string? email, string? address, bool isActive)
    {
        Name = name;
        ContactName = contactName;
        PhoneNumber = phoneNumber;
        Email = email;
        Address = address;
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
