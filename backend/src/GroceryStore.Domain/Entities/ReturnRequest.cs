using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class ReturnRequest
{
    private ReturnRequest() { BuyerUserId = string.Empty; Description = string.Empty; }
    public ReturnRequest(Guid onlineOrderItemId, Guid productVariantId, string buyerUserId, ReturnReason reason, string description, DateTime createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(buyerUserId) || string.IsNullOrWhiteSpace(description)) throw new ArgumentException("A return request requires a buyer and description.");
        ReturnRequestId = Guid.NewGuid(); OnlineOrderItemId = onlineOrderItemId; ProductVariantId = productVariantId; BuyerUserId = buyerUserId; Reason = reason; Description = description.Trim(); Status = ReturnRequestStatus.Requested; CreatedAtUtc = createdAtUtc;
    }
    public Guid ReturnRequestId { get; private set; }
    public Guid OnlineOrderItemId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public string BuyerUserId { get; private set; }
    public ReturnReason Reason { get; private set; }
    public string Description { get; private set; }
    public ReturnRequestStatus Status { get; private set; }
    public ReturnDisposition? Disposition { get; private set; }
    public string? ManagerNote { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? ResolvedAtUtc { get; private set; }
    public void Resolve(ReturnDisposition disposition, string note, DateTime utcNow) { if (Status is ReturnRequestStatus.Resolved or ReturnRequestStatus.Rejected) throw new InvalidOperationException("Return request has already been resolved."); if (string.IsNullOrWhiteSpace(note)) throw new ArgumentException("Manager note is required.", nameof(note)); Disposition = disposition; ManagerNote = note.Trim(); Status = ReturnRequestStatus.Resolved; ResolvedAtUtc = utcNow; }
}
