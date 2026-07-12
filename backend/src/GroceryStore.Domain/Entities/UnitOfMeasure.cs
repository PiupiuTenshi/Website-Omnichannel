namespace GroceryStore.Domain.Entities;

public sealed class UnitOfMeasure
{
    private UnitOfMeasure()
    {
        Code = string.Empty;
        Name = string.Empty;
    }

    public UnitOfMeasure(string code, string name, bool allowsDecimal, int decimalScale, bool isActive)
    {
        UnitOfMeasureId = Guid.NewGuid();
        Code = code;
        Name = name;
        SetPrecision(allowsDecimal, decimalScale);
        IsActive = isActive;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid UnitOfMeasureId { get; private set; }

    public string Code { get; private set; }

    public string Name { get; private set; }

    public bool AllowsDecimal { get; private set; }

    public int DecimalScale { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void Update(string code, string name, bool allowsDecimal, int decimalScale, bool isActive)
    {
        Code = code;
        Name = name;
        SetPrecision(allowsDecimal, decimalScale);
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private void SetPrecision(bool allowsDecimal, int decimalScale)
    {
        if (decimalScale is < 0 or > 3 || (!allowsDecimal && decimalScale != 0) || (allowsDecimal && decimalScale == 0))
        {
            throw new ArgumentException("Decimal scale must match the unit measurement type.", nameof(decimalScale));
        }

        AllowsDecimal = allowsDecimal;
        DecimalScale = decimalScale;
    }
}
