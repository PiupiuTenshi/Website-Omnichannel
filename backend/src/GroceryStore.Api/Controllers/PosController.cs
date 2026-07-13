using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Features.Pos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Manager,Seller")]
[Route("api/admin/pos")]
public sealed class PosController(PosService posService) : ControllerBase
{
    [HttpGet("products")]
    public async Task<ActionResult<IReadOnlyList<PosProductDto>>> SearchProductsAsync([FromQuery] string query, CancellationToken cancellationToken) =>
        Ok(await posService.SearchProductsAsync(query, cancellationToken));

    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutPosOrderResponse>> CheckoutAsync(CheckoutPosOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "POS-System";
        var command = new CheckoutPosOrderCommand(request.Items, request.PaymentMethod, request.CashReceived, userId);
        var response = await posService.CheckoutAsync(command, cancellationToken);
        return Ok(response);
    }
}
