using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Features.Reviews;

public sealed record CreateReviewCommand(Guid OnlineOrderItemId, int Rating, string Content);
public sealed record ReviewResponse(Guid ProductReviewId, Guid OnlineOrderItemId, int Rating, string Content, string? ManagerReply, bool IsHidden);

public sealed class ReviewService(IReviewReturnsRepository repository)
{
    public async Task<ReviewResponse> CreateAsync(CreateReviewCommand command, string buyerUserId, CancellationToken cancellationToken)
    {
        var item = await repository.GetDeliveredOrderItemAsync(command.OnlineOrderItemId, buyerUserId, cancellationToken)
            ?? throw new BusinessRuleViolationException("Only buyers with a delivered order item can submit a review.");
        if (await repository.ReviewExistsAsync(command.OnlineOrderItemId, cancellationToken)) throw new BusinessRuleViolationException("An order item can only be reviewed once.");
        var review = new ProductReview(item.OnlineOrderItemId, item.ProductVariantId, buyerUserId, command.Rating, command.Content, DateTime.UtcNow);
        await repository.AddReviewAsync(review, cancellationToken); await repository.SaveChangesAsync(cancellationToken); return ToResponse(review);
    }
    public async Task<ReviewResponse> ReplyAsync(Guid reviewId, string reply, CancellationToken cancellationToken)
    {
        var review = await repository.GetReviewAsync(reviewId, cancellationToken) ?? throw new KeyNotFoundException("Review was not found.");
        review.Reply(reply, DateTime.UtcNow); await repository.SaveChangesAsync(cancellationToken); return ToResponse(review);
    }
    public async Task<ReviewResponse> HideAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        var review = await repository.GetReviewAsync(reviewId, cancellationToken) ?? throw new KeyNotFoundException("Review was not found.");
        review.Hide(); await repository.SaveChangesAsync(cancellationToken); return ToResponse(review);
    }
    private static ReviewResponse ToResponse(ProductReview review) => new(review.ProductReviewId, review.OnlineOrderItemId, review.Rating, review.Content, review.ManagerReply, review.IsHidden);
}
