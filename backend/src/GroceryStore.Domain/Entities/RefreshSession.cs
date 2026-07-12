namespace GroceryStore.Domain.Entities;

public sealed class RefreshSession
{
    private RefreshSession()
    {
        UserId = string.Empty;
        TokenHash = string.Empty;
    }

    public RefreshSession(string userId, string tokenHash, DateTime expiresAtUtc)
    {
        RefreshSessionId = Guid.NewGuid();
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid RefreshSessionId { get; private set; }

    public string UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public DateTime? RevokedAtUtc { get; private set; }

    public bool IsActive(DateTime utcNow)
    {
        return RevokedAtUtc is null && ExpiresAtUtc > utcNow;
    }

    public void Revoke(DateTime utcNow)
    {
        RevokedAtUtc = utcNow;
    }
}
