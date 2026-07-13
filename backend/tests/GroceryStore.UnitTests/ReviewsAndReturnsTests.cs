using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.UnitTests;

public sealed class ReviewsAndReturnsTests
{
    [Fact]
    public void Review_RejectsRatingOutsideAllowedRange()
    {
        Assert.Throws<ArgumentException>(() => new ProductReview(Guid.NewGuid(), Guid.NewGuid(), "buyer", 6, "Great", DateTime.UtcNow));
    }

    [Fact]
    public void Manager_CanReplyAndHideWithoutChangingBuyerContent()
    {
        var review = new ProductReview(Guid.NewGuid(), Guid.NewGuid(), "buyer", 5, "Original buyer review", DateTime.UtcNow);
        review.Reply("Thank you", DateTime.UtcNow);
        review.Hide();
        Assert.Equal("Original buyer review", review.Content);
        Assert.True(review.IsHidden);
        Assert.Equal("Thank you", review.ManagerReply);
    }

    [Fact]
    public void ReturnRequest_DoesNotAutomaticallyRestockInventory()
    {
        var request = new ReturnRequest(Guid.NewGuid(), Guid.NewGuid(), "buyer", ReturnReason.Damaged, "Broken package", DateTime.UtcNow);
        request.Resolve(ReturnDisposition.Damaged, "Discard after inspection", DateTime.UtcNow);
        Assert.Equal(ReturnRequestStatus.Resolved, request.Status);
        Assert.Equal(ReturnDisposition.Damaged, request.Disposition);
    }
}
