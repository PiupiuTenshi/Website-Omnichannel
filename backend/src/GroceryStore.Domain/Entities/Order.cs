using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class Order
{
    private readonly List<OrderItem> orderItems = [];

    private Order()
    {
        OrderCode = string.Empty;
        ProcessedByUserId = string.Empty;
    }

    public Order(string orderCode, decimal exactAmount, decimal amountDue, decimal? cashReceived, decimal changeAmount, PosPaymentMethod paymentMethod, string processedByUserId, OrderStatus status, DateTime createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
        {
            throw new ArgumentException("Order code cannot be empty.", nameof(orderCode));
        }

        if (exactAmount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(exactAmount), "Order exact amount must be positive.");
        }

        if (amountDue <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amountDue), "Order amount due must be positive.");
        }

        if (paymentMethod == PosPaymentMethod.Cash && (cashReceived ?? 0) < amountDue)
        {
            throw new InvalidOperationException("Cash received cannot be less than amount due.");
        }

        OrderId = Guid.NewGuid();
        OrderCode = orderCode;
        ExactAmount = exactAmount;
        AmountDue = amountDue;
        CashReceived = cashReceived;
        ChangeAmount = changeAmount;
        PaymentMethod = paymentMethod;
        ProcessedByUserId = processedByUserId;
        Status = status;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid OrderId { get; private set; }
    public string OrderCode { get; private set; }
    public decimal ExactAmount { get; private set; }
    public decimal AmountDue { get; private set; }
    public decimal? CashReceived { get; private set; }
    public decimal ChangeAmount { get; private set; }
    public PosPaymentMethod PaymentMethod { get; private set; }
    public string ProcessedByUserId { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public IReadOnlyCollection<OrderItem> OrderItems => orderItems.AsReadOnly();

    public void AddItem(Guid productVariantId, decimal quantity, decimal unitPrice)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be positive.");
        }

        if (unitPrice < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price cannot be negative.");
        }

        orderItems.Add(new OrderItem(OrderId, productVariantId, quantity, unitPrice));
    }
}
