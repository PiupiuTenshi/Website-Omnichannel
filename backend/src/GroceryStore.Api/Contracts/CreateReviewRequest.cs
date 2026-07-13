namespace GroceryStore.Api.Contracts;

public sealed record CreateReviewRequest(Guid OnlineOrderItemId, int Rating, string Content);
