namespace GroceryStore.Domain.Rules;

public static class LastActiveAdminPolicy
{
    public static bool CanDeactivateOrDelete(int activeAdminCount)
    {
        return activeAdminCount > 1;
    }
}
