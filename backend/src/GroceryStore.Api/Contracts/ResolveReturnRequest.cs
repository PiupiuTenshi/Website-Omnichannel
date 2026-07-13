using GroceryStore.Domain.Enums;
namespace GroceryStore.Api.Contracts;

public sealed record ResolveReturnRequest(ReturnDisposition Disposition, string ManagerNote);
