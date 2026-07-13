using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.Application.Features.Returns;

public sealed record CreateReturnRequestCommand(Guid OnlineOrderItemId, ReturnReason Reason, string Description);
public sealed record ResolveReturnRequestCommand(ReturnDisposition Disposition, string ManagerNote);
public sealed record ReturnRequestResponse(Guid ReturnRequestId, Guid OnlineOrderItemId, ReturnReason Reason, ReturnRequestStatus Status, ReturnDisposition? Disposition, string? ManagerNote);

public sealed class ReturnService(IReviewReturnsRepository repository)
{
    public async Task<ReturnRequestResponse> CreateAsync(CreateReturnRequestCommand command, string buyerUserId, CancellationToken cancellationToken)
    {
        var item = await repository.GetDeliveredOrderItemAsync(command.OnlineOrderItemId, buyerUserId, cancellationToken)
            ?? throw new BusinessRuleViolationException("Only buyers with a delivered order item can request a return.");
        if (command.Reason == ReturnReason.ChangedMind && await repository.IsPerishableAsync(item.ProductVariantId, cancellationToken)) throw new BusinessRuleViolationException("Perishable goods cannot be returned because of a change of mind.");
        var request = new ReturnRequest(item.OnlineOrderItemId, item.ProductVariantId, buyerUserId, command.Reason, command.Description, DateTime.UtcNow);
        await repository.AddReturnRequestAsync(request, cancellationToken); await repository.SaveChangesAsync(cancellationToken); return ToResponse(request);
    }
    public async Task<ReturnRequestResponse> ResolveAsync(Guid returnRequestId, ResolveReturnRequestCommand command, CancellationToken cancellationToken)
    {
        var request = await repository.GetReturnRequestAsync(returnRequestId, cancellationToken) ?? throw new KeyNotFoundException("Return request was not found.");
        request.Resolve(command.Disposition, command.ManagerNote, DateTime.UtcNow); await repository.SaveChangesAsync(cancellationToken); return ToResponse(request);
    }
    private static ReturnRequestResponse ToResponse(ReturnRequest request) => new(request.ReturnRequestId, request.OnlineOrderItemId, request.Reason, request.Status, request.Disposition, request.ManagerNote);
}
