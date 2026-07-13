namespace GroceryStore.Domain.Entities;

public sealed class ProductReview
{
    private ProductReview() { Content = string.Empty; BuyerUserId = string.Empty; }
    public ProductReview(Guid onlineOrderItemId, Guid productVariantId, string buyerUserId, int rating, string content, DateTime createdAtUtc)
    {
        if (rating is < 1 or > 5 || string.IsNullOrWhiteSpace(buyerUserId) || string.IsNullOrWhiteSpace(content)) throw new ArgumentException("A review requires a buyer, rating, and content.");
        ProductReviewId = Guid.NewGuid(); OnlineOrderItemId = onlineOrderItemId; ProductVariantId = productVariantId; BuyerUserId = buyerUserId; Rating = rating; Content = content.Trim(); CreatedAtUtc = createdAtUtc;
    }
    public Guid ProductReviewId { get; private set; }
    public Guid OnlineOrderItemId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public string BuyerUserId { get; private set; }
    public int Rating { get; private set; }
    public string Content { get; private set; }
    public string? ManagerReply { get; private set; }
    public bool IsHidden { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? RepliedAtUtc { get; private set; }
    public void Reply(string reply, DateTime utcNow) { if (string.IsNullOrWhiteSpace(reply)) throw new ArgumentException("Reply is required.", nameof(reply)); ManagerReply = reply.Trim(); RepliedAtUtc = utcNow; }
    public void Hide() { IsHidden = true; }
}
