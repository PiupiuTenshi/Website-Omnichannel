using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Features.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public sealed class AccountController(AuthService authService, OnlineOrderService onlineOrderService) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<AccountProfileResponse>> GetProfileAsync(CancellationToken cancellationToken) =>
        Ok(await authService.GetProfileAsync(GetUserId(), cancellationToken));

    [HttpPut("profile")]
    public async Task<ActionResult<AccountProfileResponse>> UpdateProfileAsync(
        UpdateAccountProfileRequest request,
        CancellationToken cancellationToken) =>
        Ok(await authService.UpdateProfileAsync(
            GetUserId(),
            new UpdateAccountProfileCommand(request.DisplayName, request.DefaultDeliveryAddress),
            cancellationToken));

    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ChangePasswordAsync(
            GetUserId(),
            new ChangePasswordCommand(request.CurrentPassword, request.NewPassword),
            cancellationToken);
        return NoContent();
    }

    [HttpPost("contact-changes")]
    public async Task<ActionResult<ContactChangeRequestResponse>> RequestContactChangeAsync(RequestContactChangeRequest request, CancellationToken cancellationToken)
    {
        var response = await authService.RequestContactChangeAsync(
            GetUserId(),
            new RequestContactChangeCommand(ParseChannel(request.Channel), request.NewValue),
            cancellationToken);
        return Accepted(response);
    }

    [HttpPost("contact-changes/confirm")]
    public async Task<ActionResult<AccountProfileResponse>> ConfirmContactChangeAsync(ConfirmContactChangeRequest request, CancellationToken cancellationToken) =>
        Ok(await authService.ConfirmContactChangeAsync(
            GetUserId(),
            new ConfirmContactChangeCommand(ParseChannel(request.Channel), request.Code),
            cancellationToken));

    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<OnlineOrderResponse>>> GetOrdersAsync(CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.GetOrdersForBuyerAsync(GetUserId(), cancellationToken));

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("Authenticated user identifier is missing.");

    private static ContactChangeChannel ParseChannel(string value) =>
        Enum.TryParse<ContactChangeChannel>(value, true, out var channel)
            ? channel
            : throw new ArgumentException("Contact change channel must be Email or Phone.");
}
