using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class ReviewReturnsRepository(ApplicationDbContext context) : IReviewReturnsRepository
{
    public Task<OnlineOrderItem?> GetDeliveredOrderItemAsync(Guid onlineOrderItemId, string buyerUserId, CancellationToken cancellationToken) =>
        (from item in context.OnlineOrderItems
         join order in context.OnlineOrders on item.OnlineOrderId equals order.OnlineOrderId
         where item.OnlineOrderItemId == onlineOrderItemId && order.BuyerUserId == buyerUserId && order.Status == OnlineOrderStatus.Delivered
         select item).SingleOrDefaultAsync(cancellationToken);

    public Task<bool> IsPerishableAsync(Guid productVariantId, CancellationToken cancellationToken) =>
        context.ExpiryPolicies.AnyAsync(policy => policy.ProductVariantId == productVariantId, cancellationToken);

    public Task<bool> HasOrderItemAllocationAsync(Guid onlineOrderItemId, CancellationToken cancellationToken) =>
        context.OnlineOrderAllocations.AnyAsync(allocation => allocation.OnlineOrderItemId == onlineOrderItemId, cancellationToken);

    public Task<bool> ReviewExistsAsync(Guid onlineOrderItemId, CancellationToken cancellationToken) =>
        context.ProductReviews.AnyAsync(review => review.OnlineOrderItemId == onlineOrderItemId, cancellationToken);

    public Task AddReviewAsync(ProductReview review, CancellationToken cancellationToken) => context.ProductReviews.AddAsync(review, cancellationToken).AsTask();
    public Task<ProductReview?> GetReviewAsync(Guid productReviewId, CancellationToken cancellationToken) => context.ProductReviews.SingleOrDefaultAsync(review => review.ProductReviewId == productReviewId, cancellationToken);
    public Task AddReturnRequestAsync(ReturnRequest returnRequest, CancellationToken cancellationToken) => context.ReturnRequests.AddAsync(returnRequest, cancellationToken).AsTask();
    public Task<ReturnRequest?> GetReturnRequestAsync(Guid returnRequestId, CancellationToken cancellationToken) => context.ReturnRequests.SingleOrDefaultAsync(request => request.ReturnRequestId == returnRequestId, cancellationToken);
    public Task SaveChangesAsync(CancellationToken cancellationToken) => context.SaveChangesAsync(cancellationToken);
}
