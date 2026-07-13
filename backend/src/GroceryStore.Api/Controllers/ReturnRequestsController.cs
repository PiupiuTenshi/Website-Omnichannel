using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Returns;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/return-requests")]
public sealed class ReturnRequestsController(ReturnService returnService) : ControllerBase
{
    [Authorize(Roles = "Buyer")]
    [HttpPost]
    public async Task<ActionResult<ReturnRequestResponse>> CreateAsync(CreateReturnRequest request, CancellationToken cancellationToken) =>
        Ok(await returnService.CreateAsync(new CreateReturnRequestCommand(request.OnlineOrderItemId, request.Reason, request.Description), User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException(), cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{returnRequestId:guid}/resolve")]
    public async Task<ActionResult<ReturnRequestResponse>> ResolveAsync(Guid returnRequestId, ResolveReturnRequest request, CancellationToken cancellationToken) =>
        Ok(await returnService.ResolveAsync(returnRequestId, new ResolveReturnRequestCommand(request.Disposition, request.ManagerNote), cancellationToken));
}
