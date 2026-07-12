using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace GroceryStore.Persistence.Seeding;

public sealed class DemoIdentitySeeder
{
    private readonly UserManager<ApplicationUser> userManager;
    private readonly IOptions<DemoIdentityOptions> options;

    public DemoIdentitySeeder(
        UserManager<ApplicationUser> userManager,
        IOptions<DemoIdentityOptions> options)
    {
        this.userManager = userManager;
        this.options = options;
    }

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var account in options.Value.Accounts)
        {
            if (!Enum.TryParse<UserRole>(account.Role, true, out var role) ||
                string.IsNullOrWhiteSpace(account.Email) ||
                string.IsNullOrWhiteSpace(account.Password))
            {
                throw new InvalidOperationException("Each demo identity account requires a supported role, email, and password.");
            }

            var user = await userManager.FindByEmailAsync(account.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = account.Email.Trim(),
                    Email = account.Email.Trim(),
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(user, account.Password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(string.Join(" ", createResult.Errors.Select(error => error.Description)));
                }
            }

            if (!await userManager.IsInRoleAsync(user, role.ToString()))
            {
                var roleResult = await userManager.AddToRoleAsync(user, role.ToString());
                if (!roleResult.Succeeded)
                {
                    throw new InvalidOperationException(string.Join(" ", roleResult.Errors.Select(error => error.Description)));
                }
            }
        }
    }
}
