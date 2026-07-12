using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/users")]
public sealed class UserAdministrationController : ControllerBase
{
    private readonly AuthService authService;

    public UserAdministrationController(AuthService authService)
    {
        this.authService = authService;
    }

    [HttpPut("{userId}/activation")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetActivationAsync(
        string userId,
        SetUserActivationRequest request,
        CancellationToken cancellationToken)
    {
        await authService.SetUserActiveAsync(userId, request.IsActive, cancellationToken);
        return NoContent();
    }
}
