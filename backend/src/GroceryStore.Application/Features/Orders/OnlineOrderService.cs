using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Abstractions.Shipping;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.Application.Features.Orders;

public sealed record CheckoutOnlineOrderCommand(string GuestSessionId, string? BuyerUserId, string RecipientName, string RecipientPhoneNumber, string DeliveryAddress, OnlinePaymentMethod PaymentMethod);
public sealed record SetShippingQuoteCommand(decimal ShippingFee, string Message);
public sealed record OnlineOrderResponse(Guid OnlineOrderId, string OrderCode, OnlineOrderStatus Status, OnlinePaymentStatus PaymentStatus, decimal Subtotal, decimal? ShippingFee, decimal Total, decimal? DistanceKm, string? ManagerMessage, DateTime CreatedAtUtc);

public sealed class OnlineOrderService(
    IShoppingCartRepository shoppingCartRepository,
    IOnlineOrderRepository onlineOrderRepository,
    InventoryReservationService inventoryReservationService,
    IShippingDistanceService shippingDistanceService,
    IShippingQuotePolicy shippingQuotePolicy)
{
    public async Task<OnlineOrderResponse> CheckoutAsync(CheckoutOnlineOrderCommand command, CancellationToken cancellationToken)
    {
        if (!await onlineOrderRepository.IsOnlineOrderingEnabledAsync(cancellationToken))
        {
            throw new BusinessRuleViolationException("Online ordering is temporarily unavailable.");
        }

        ValidateCheckout(command);
        var cart = command.BuyerUserId is null
            ? await shoppingCartRepository.GetGuestCartAsync(command.GuestSessionId, cancellationToken)
            : await shoppingCartRepository.GetUserCartAsync(command.BuyerUserId, cancellationToken) ?? await shoppingCartRepository.GetGuestCartAsync(command.GuestSessionId, cancellationToken);
        if (cart is null)
        {
            throw new BusinessRuleViolationException("Cart cannot be empty.");
        }
        var snapshot = await shoppingCartRepository.GetSnapshotAsync(cart, cancellationToken);
        if (snapshot.Count == 0 || snapshot.Count != cart.Items.Count)
        {
            throw new BusinessRuleViolationException("Cart contains unavailable products.");
        }

        var distance = await shippingDistanceService.GetDistanceAsync(command.DeliveryAddress, cancellationToken);
        var quote = shippingQuotePolicy.Decide(distance.DistanceKm);
        var utcNow = DateTime.UtcNow;
        var order = new OnlineOrder(
            $"WEB-{utcNow:yyMMddHHmmss}-{Random.Shared.Next(100, 999)}",
            command.GuestSessionId,
            command.BuyerUserId,
            command.RecipientName.Trim(),
            command.RecipientPhoneNumber.Trim(),
            command.DeliveryAddress.Trim(),
            snapshot.Sum(item => item.Quantity * item.UnitPrice),
            quote.ShippingFee,
            distance.DistanceKm,
            command.PaymentMethod,
            quote.RequiresManagerQuote ? OnlineOrderStatus.AwaitingShippingQuote : OnlineOrderStatus.Pending,
            utcNow);
        foreach (var item in snapshot)
        {
            order.AddItem(item.ProductVariantId, item.Quantity, item.UnitPrice);
        }

        await onlineOrderRepository.ExecuteInTransactionAsync(async () =>
        {
            await inventoryReservationService.ReserveCartAsync(command.GuestSessionId, command.BuyerUserId, cancellationToken, false);
            await onlineOrderRepository.AddAsync(order, cancellationToken);
            await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        }, cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> GetAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, bool isManager, CancellationToken cancellationToken)
    {
        var order = isManager
            ? await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            : await onlineOrderRepository.GetAccessibleAsync(onlineOrderId, guestSessionId, buyerUserId, cancellationToken);

        if (order is null)
        {
            throw new KeyNotFoundException("Online order was not found.");
        }
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> CancelAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetAccessibleAsync(onlineOrderId, guestSessionId, buyerUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.Cancel(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> SetShippingQuoteAsync(Guid onlineOrderId, SetShippingQuoteCommand command, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.SetShippingQuote(command.ShippingFee, command.Message, DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> AcceptShippingQuoteAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetAccessibleAsync(onlineOrderId, guestSessionId, buyerUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.AcceptShippingQuote(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> ConfirmCodPaymentAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.ConfirmCodPayment(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> MarkReturnedAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.MarkReturned(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> MarkDeliveringAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.MarkDelivering(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> MarkDeliveredAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.MarkDelivered(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    public async Task<OnlineOrderResponse> MarkDeliveryFailedAsync(Guid onlineOrderId, CancellationToken cancellationToken)
    {
        var order = await onlineOrderRepository.GetForManagementAsync(onlineOrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Online order was not found.");
        order.MarkDeliveryFailed(DateTime.UtcNow);
        await onlineOrderRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(order);
    }

    private static void ValidateCheckout(CheckoutOnlineOrderCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.GuestSessionId) || string.IsNullOrWhiteSpace(command.RecipientName) || string.IsNullOrWhiteSpace(command.RecipientPhoneNumber) || string.IsNullOrWhiteSpace(command.DeliveryAddress))
        {
            throw new BusinessRuleViolationException("Recipient name, phone number, and delivery address are required.");
        }
    }

    private static OnlineOrderResponse ToResponse(OnlineOrder order) => new(order.OnlineOrderId, order.OrderCode, order.Status, order.PaymentStatus, order.Subtotal, order.ShippingFee, order.Total, order.DistanceKm, order.ManagerMessage, order.CreatedAtUtc);
}
