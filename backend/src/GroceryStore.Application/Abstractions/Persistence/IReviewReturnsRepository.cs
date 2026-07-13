using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IReviewReturnsRepository
{
    Task<OnlineOrderItem?> GetDeliveredOrderItemAsync(Guid onlineOrderItemId, string buyerUserId, CancellationToken cancellationToken);
    Task<bool> IsPerishableAsync(Guid productVariantId, CancellationToken cancellationToken);
    Task<bool> ReviewExistsAsync(Guid onlineOrderItemId, CancellationToken cancellationToken);
    Task AddReviewAsync(ProductReview review, CancellationToken cancellationToken);
    Task<ProductReview?> GetReviewAsync(Guid productReviewId, CancellationToken cancellationToken);
    Task AddReturnRequestAsync(ReturnRequest returnRequest, CancellationToken cancellationToken);
    Task<ReturnRequest?> GetReturnRequestAsync(Guid returnRequestId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
