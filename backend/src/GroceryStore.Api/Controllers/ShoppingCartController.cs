using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/cart")]
public sealed class ShoppingCartController(ShoppingCartService shoppingCartService, InventoryReservationService inventoryReservationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ShoppingCartResponse>> GetAsync(CancellationToken cancellationToken) =>
        Ok(await GetCartAsync(cancellationToken));

    [HttpPut("items")]
    public async Task<ActionResult<ShoppingCartResponse>> SetItemAsync(SetCartItemRequest request, CancellationToken cancellationToken)
    {
        var response = await SetCartItemAsync(new SetCartItemCommand(request.ProductVariantId, request.Quantity), cancellationToken);
        return Ok(response);
    }

    [HttpDelete("items/{productVariantId:guid}")]
    public async Task<ActionResult<ShoppingCartResponse>> RemoveItemAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        var response = await RemoveCartItemAsync(productVariantId, cancellationToken);
        return Ok(response);
    }

    [Authorize]
    [HttpPost("merge")]
    public async Task<ActionResult<ShoppingCartResponse>> MergeAsync(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();
        var response = await shoppingCartService.MergeGuestCartAsync(GetGuestSessionId(), userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("reservations")]
    public async Task<ActionResult<CartReservationResponse>> ReserveAsync(CancellationToken cancellationToken)
    {
        var response = await inventoryReservationService.ReserveCartAsync(GetGuestSessionId(), User.FindFirstValue(ClaimTypes.NameIdentifier), cancellationToken);
        return Ok(response);
    }

    private Task<ShoppingCartResponse> GetCartAsync(CancellationToken cancellationToken) =>
        GetUserId() is { } userId
            ? shoppingCartService.GetUserCartAsync(userId, cancellationToken)
            : shoppingCartService.GetGuestCartAsync(GetGuestSessionId(), cancellationToken);

    private Task<ShoppingCartResponse> SetCartItemAsync(SetCartItemCommand command, CancellationToken cancellationToken) =>
        GetUserId() is { } userId
            ? shoppingCartService.SetUserItemAsync(userId, command, cancellationToken)
            : shoppingCartService.SetGuestItemAsync(GetGuestSessionId(), command, cancellationToken);

    private Task<ShoppingCartResponse> RemoveCartItemAsync(Guid productVariantId, CancellationToken cancellationToken) =>
        GetUserId() is { } userId
            ? shoppingCartService.RemoveUserItemAsync(userId, productVariantId, cancellationToken)
            : shoppingCartService.RemoveGuestItemAsync(GetGuestSessionId(), productVariantId, cancellationToken);

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private string GetGuestSessionId()
    {
        if (Request.Headers.TryGetValue("X-Guest-Cart-Token", out var guestCartToken))
        {
            return guestCartToken.ToString();
        }

        if (!Request.Headers.TryGetValue("X-Cart-Session", out var sessionId))
        {
            throw new InvalidOperationException("X-Guest-Cart-Token header is required.");
        }

        return sessionId.ToString();
    }
}
