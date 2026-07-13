using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class OnlineOrder
{
    private readonly List<OnlineOrderItem> items = [];

    private OnlineOrder()
    {
        OrderCode = string.Empty;
        GuestSessionId = string.Empty;
        RecipientName = string.Empty;
        RecipientPhoneNumber = string.Empty;
        DeliveryAddress = string.Empty;
    }

    public OnlineOrder(string orderCode, string guestSessionId, string? buyerUserId, string recipientName, string recipientPhoneNumber, string deliveryAddress, decimal subtotal, decimal? shippingFee, decimal? distanceKm, OnlinePaymentMethod paymentMethod, OnlineOrderStatus status, DateTime createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(orderCode) || string.IsNullOrWhiteSpace(guestSessionId) || string.IsNullOrWhiteSpace(recipientName) || string.IsNullOrWhiteSpace(recipientPhoneNumber) || string.IsNullOrWhiteSpace(deliveryAddress) || subtotal <= 0)
        {
            throw new ArgumentException("Online order requires valid customer, address, and subtotal data.");
        }

        OnlineOrderId = Guid.NewGuid();
        OrderCode = orderCode;
        GuestSessionId = guestSessionId;
        BuyerUserId = buyerUserId;
        RecipientName = recipientName;
        RecipientPhoneNumber = recipientPhoneNumber;
        DeliveryAddress = deliveryAddress;
        Subtotal = subtotal;
        ShippingFee = shippingFee;
        Total = subtotal + (shippingFee ?? 0);
        DistanceKm = distanceKm;
        PaymentMethod = paymentMethod;
        PaymentStatus = OnlinePaymentStatus.Pending;
        Status = status;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid OnlineOrderId { get; private set; }
    public string OrderCode { get; private set; }
    public string GuestSessionId { get; private set; }
    public string? BuyerUserId { get; private set; }
    public string RecipientName { get; private set; }
    public string RecipientPhoneNumber { get; private set; }
    public string DeliveryAddress { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal? ShippingFee { get; private set; }
    public decimal Total { get; private set; }
    public decimal? DistanceKm { get; private set; }
    public OnlinePaymentMethod PaymentMethod { get; private set; }
    public OnlinePaymentStatus PaymentStatus { get; private set; }
    public OnlineOrderStatus Status { get; private set; }
    public string? ManagerMessage { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();
    public IReadOnlyCollection<OnlineOrderItem> Items => items.AsReadOnly();

    public void AddItem(Guid productVariantId, decimal quantity, decimal unitPrice)
    {
        items.Add(new OnlineOrderItem(OnlineOrderId, productVariantId, quantity, unitPrice));
    }

    public void SetShippingQuote(decimal shippingFee, string message, DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.AwaitingShippingQuote || shippingFee < 0 || string.IsNullOrWhiteSpace(message))
        {
            throw new InvalidOperationException("A shipping quote can only be set for an order awaiting a quote.");
        }

        ShippingFee = shippingFee;
        Total = Subtotal + shippingFee;
        ManagerMessage = message.Trim();
        UpdatedAtUtc = utcNow;
    }

    public void AcceptShippingQuote(DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.AwaitingShippingQuote || ShippingFee is null)
        {
            throw new InvalidOperationException("The shipping quote is not ready for acceptance.");
        }

        Status = OnlineOrderStatus.QuoteAccepted;
        UpdatedAtUtc = utcNow;
    }

    public void ConfirmCodPayment(DateTime utcNow)
    {
        if (PaymentMethod != OnlinePaymentMethod.Cod || Status != OnlineOrderStatus.Delivered)
        {
            throw new InvalidOperationException("COD can only be marked paid after delivery confirmation.");
        }

        PaymentStatus = OnlinePaymentStatus.Paid;
        UpdatedAtUtc = utcNow;
    }

    public void Cancel(DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.Pending && Status != OnlineOrderStatus.AwaitingShippingQuote)
        {
            throw new InvalidOperationException("Only pending orders can be cancelled by the buyer.");
        }

        Status = OnlineOrderStatus.Cancelled;
        UpdatedAtUtc = utcNow;
    }

    public void MarkDeliveryFailed(DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.Delivering)
        {
            throw new InvalidOperationException("Only delivering orders can fail delivery.");
        }

        Status = OnlineOrderStatus.DeliveryFailed;
        UpdatedAtUtc = utcNow;
    }

    public void MarkDelivering(DateTime utcNow)
    {
        if (Status is not (OnlineOrderStatus.Pending or OnlineOrderStatus.QuoteAccepted or OnlineOrderStatus.Confirmed or OnlineOrderStatus.Preparing))
        {
            throw new InvalidOperationException("Order cannot be sent for delivery in its current state.");
        }

        Status = OnlineOrderStatus.Delivering;
        UpdatedAtUtc = utcNow;
    }

    public void MarkDelivered(DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.Delivering)
        {
            throw new InvalidOperationException("Only delivering orders can be marked delivered.");
        }

        Status = OnlineOrderStatus.Delivered;
        UpdatedAtUtc = utcNow;
    }

    public void MarkReturned(DateTime utcNow)
    {
        if (Status != OnlineOrderStatus.DeliveryFailed)
        {
            throw new InvalidOperationException("Only failed deliveries can be returned for inspection.");
        }

        Status = OnlineOrderStatus.Returned;
        UpdatedAtUtc = utcNow;
    }

    public void MarkExpired(DateTime utcNow)
    {
        if (Status is OnlineOrderStatus.Pending or OnlineOrderStatus.AwaitingShippingQuote)
        {
            Status = OnlineOrderStatus.Expired;
            UpdatedAtUtc = utcNow;
        }
    }
}
