using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/online-orders")]
public sealed class OnlineOrdersController(OnlineOrderService onlineOrderService) : ControllerBase
{
    [HttpPost("checkout")]
    public async Task<ActionResult<OnlineOrderResponse>> CheckoutAsync(CheckoutOnlineOrderRequest request, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.CheckoutAsync(new CheckoutOnlineOrderCommand(GetGuestSessionId(), User.FindFirstValue(ClaimTypes.NameIdentifier), request.RecipientName, request.RecipientPhoneNumber, request.DeliveryAddress, request.PaymentMethod), cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OnlineOrderResponse>>> GetOrdersAsync(CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.GetOrdersForManagementAsync(cancellationToken));

    [HttpGet("{onlineOrderId:guid}")]
    public async Task<ActionResult<OnlineOrderResponse>> GetAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        bool isManager = User.IsInRole("Admin") || User.IsInRole("Manager");
        return Ok(await onlineOrderService.GetAsync(onlineOrderId, GetGuestSessionId(), User.FindFirstValue(ClaimTypes.NameIdentifier), isManager, cancellationToken));
    }

    [HttpPost("{onlineOrderId:guid}/cancel")]
    public async Task<ActionResult<OnlineOrderResponse>> CancelAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.CancelAsync(onlineOrderId, GetGuestSessionId(), User.FindFirstValue(ClaimTypes.NameIdentifier), cancellationToken));

    [HttpPost("{onlineOrderId:guid}/accept-quote")]
    public async Task<ActionResult<OnlineOrderResponse>> AcceptQuoteAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.AcceptShippingQuoteAsync(onlineOrderId, GetGuestSessionId(), User.FindFirstValue(ClaimTypes.NameIdentifier), cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{onlineOrderId:guid}/shipping-quote")]
    public async Task<ActionResult<OnlineOrderResponse>> SetQuoteAsync(Guid onlineOrderId, SetShippingQuoteRequest request, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.SetShippingQuoteAsync(onlineOrderId, new SetShippingQuoteCommand(request.ShippingFee, request.Message), cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{onlineOrderId:guid}/confirm-cod-payment")]
    public async Task<ActionResult<OnlineOrderResponse>> ConfirmCodAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.ConfirmCodPaymentAsync(onlineOrderId, cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{onlineOrderId:guid}/returned")]
    public async Task<ActionResult<OnlineOrderResponse>> MarkReturnedAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.MarkReturnedAsync(onlineOrderId, cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{onlineOrderId:guid}/delivering")]
    public async Task<ActionResult<OnlineOrderResponse>> MarkDeliveringAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.MarkDeliveringAsync(onlineOrderId, cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{onlineOrderId:guid}/delivered")]
    public async Task<ActionResult<OnlineOrderResponse>> MarkDeliveredAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.MarkDeliveredAsync(onlineOrderId, cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{onlineOrderId:guid}/delivery-failed")]
    public async Task<ActionResult<OnlineOrderResponse>> MarkDeliveryFailedAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        Ok(await onlineOrderService.MarkDeliveryFailedAsync(onlineOrderId, cancellationToken));

    private string GetGuestSessionId() => Request.Headers.TryGetValue("X-Cart-Session", out var value) ? value.ToString() : throw new InvalidOperationException("X-Cart-Session header is required.");
}
