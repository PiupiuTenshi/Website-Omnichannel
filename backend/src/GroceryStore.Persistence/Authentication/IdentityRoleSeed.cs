using GroceryStore.Domain.Enums;

namespace GroceryStore.Persistence.Authentication;

public static class IdentityRoleSeed
{
    public static string GetId(UserRole role)
    {
        return role switch
        {
            UserRole.Admin => "2aa418df-60b6-47cc-a2fb-ef5a91d362a5",
            UserRole.Manager => "3b64a70c-41c2-46d8-a3d0-42809f2cc69a",
            UserRole.Seller => "4c622d06-a5bf-41b5-9adf-930fce5b4e93",
            UserRole.Buyer => "5deee5ed-96aa-425e-a58f-e97b232df35b",
            _ => throw new ArgumentOutOfRangeException(nameof(role), role, "Unsupported role.")
        };
    }

    public static string GetConcurrencyStamp(UserRole role)
    {
        return role switch
        {
            UserRole.Admin => "c0592c00-31a0-426f-b792-3ac1e91934db",
            UserRole.Manager => "9d1ed7bb-ced4-4c22-a8b0-9b6bf515be82",
            UserRole.Seller => "426d97db-6e4e-4ae2-a463-6016f376ce35",
            UserRole.Buyer => "e2a0b459-b8df-427d-b8c6-8165a49b7f48",
            _ => throw new ArgumentOutOfRangeException(nameof(role), role, "Unsupported role.")
        };
    }
}
