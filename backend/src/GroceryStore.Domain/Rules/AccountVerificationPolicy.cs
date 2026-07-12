namespace GroceryStore.Domain.Rules;

public static class AccountVerificationPolicy
{
    public static bool IsVerified(bool emailConfirmed, bool phoneNumberConfirmed)
    {
        return emailConfirmed || phoneNumberConfirmed;
    }
}
