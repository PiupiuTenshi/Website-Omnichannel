using GroceryStore.Domain.Enums;
namespace GroceryStore.Domain.Entities;
public sealed class PosOrder
{
    private PosOrder() { OrderCode = string.Empty; ProcessedByUserId = string.Empty; }
    public PosOrder(string orderCode, string processedByUserId, decimal subtotal, decimal total, PosPaymentMethod paymentMethod)
    { if (subtotal <= 0 || total <= 0) throw new ArgumentOutOfRangeException(nameof(total)); PosOrderId=Guid.NewGuid(); OrderCode=orderCode; ProcessedByUserId=processedByUserId; Subtotal=subtotal; Total=total; PaymentMethod=paymentMethod; Status=PosOrderStatus.Completed; CompletedAtUtc=DateTime.UtcNow; }
    public Guid PosOrderId { get; private set; }
    public string OrderCode { get; private set; }
    public string ProcessedByUserId { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal Total { get; private set; }
    public PosPaymentMethod PaymentMethod { get; private set; }
    public PosOrderStatus Status { get; private set; }
    public DateTime CompletedAtUtc { get; private set; }
    public ICollection<PosOrderItem> Items { get; private set; } = new List<PosOrderItem>();
}
