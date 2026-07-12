namespace GroceryStore.Domain.ValueObjects;

public static class EmailAddress
{
    public static bool TryNormalize(string? value, out string? normalizedEmail)
    {
        normalizedEmail = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var trimmedEmail = value.Trim();
        var atIndex = trimmedEmail.LastIndexOf('@');

        if (atIndex <= 0 || atIndex == trimmedEmail.Length - 1 || trimmedEmail.Contains(' '))
        {
            return false;
        }

        normalizedEmail = trimmedEmail.ToUpperInvariant();
        return true;
    }
}
