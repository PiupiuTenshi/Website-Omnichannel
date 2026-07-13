using GroceryStore.Domain.Enums;
namespace GroceryStore.Api.Contracts;

public sealed record CreateReturnRequest(Guid OnlineOrderItemId, ReturnReason Reason, string Description);
