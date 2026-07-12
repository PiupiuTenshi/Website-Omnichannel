namespace GroceryStore.Domain.ValueObjects;

public static class PhoneNumber
{
    private const int MINIMUM_LENGTH = 9;
    private const int MAXIMUM_LENGTH = 15;

    public static bool TryNormalize(string? value, out string? normalizedPhoneNumber)
    {
        normalizedPhoneNumber = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var digits = new string(value.Where(char.IsDigit).ToArray());

        if (digits.Length < MINIMUM_LENGTH || digits.Length > MAXIMUM_LENGTH)
        {
            return false;
        }

        normalizedPhoneNumber = digits;
        return true;
    }
}
