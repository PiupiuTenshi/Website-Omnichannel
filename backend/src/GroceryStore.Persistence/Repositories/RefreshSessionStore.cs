using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class RefreshSessionStore : IRefreshSessionStore
{
    private readonly ApplicationDbContext applicationDbContext;

    public RefreshSessionStore(ApplicationDbContext applicationDbContext)
    {
        this.applicationDbContext = applicationDbContext;
    }

    public Task AddAsync(RefreshSession refreshSession, CancellationToken cancellationToken)
    {
        return applicationDbContext.RefreshSessions.AddAsync(refreshSession, cancellationToken).AsTask();
    }

    public Task<RefreshSession?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
    {
        return applicationDbContext.RefreshSessions.SingleOrDefaultAsync(session => session.TokenHash == tokenHash, cancellationToken);
    }

    public async Task<int> RevokeActiveForUserAsync(string userId, DateTime revokedAtUtc, CancellationToken cancellationToken)
    {
        var sessions = await applicationDbContext.RefreshSessions
            .Where(session => session.UserId == userId && session.RevokedAtUtc == null && session.ExpiresAtUtc > revokedAtUtc)
            .ToArrayAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.Revoke(revokedAtUtc);
        }

        return sessions.Length;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return applicationDbContext.SaveChangesAsync(cancellationToken);
    }
}
