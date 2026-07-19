using Microsoft.AspNetCore.Identity;

namespace GroceryStore.Persistence.Authentication;

public sealed class ApplicationUser : IdentityUser
{
    public string? NormalizedPhoneNumber { get; set; }

    public string? DisplayName { get; set; }

    public string? DefaultDeliveryAddress { get; set; }

    public bool IsActive { get; set; } = true;

    public bool RequiresInitialActivation { get; set; }
}
