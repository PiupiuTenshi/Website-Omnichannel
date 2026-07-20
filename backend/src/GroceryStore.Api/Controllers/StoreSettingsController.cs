using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.AuditLogs;
using GroceryStore.Application.Features.StoreSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Manager")]
[Route("api/store-settings")]
public sealed class StoreSettingsController : ControllerBase
{
    private readonly StoreSettingsService storeSettingsService;
    private readonly AuditLogService auditLogService;

    public StoreSettingsController(StoreSettingsService storeSettingsService, AuditLogService auditLogService)
    {
        this.storeSettingsService = storeSettingsService;
        this.auditLogService = auditLogService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(StoreSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StoreSettingsResponse>> GetAsync(CancellationToken cancellationToken)
    {
        return Ok(await storeSettingsService.GetAsync(cancellationToken));
    }

    [HttpGet("public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StoreSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StoreSettingsResponse>> GetPublicAsync(CancellationToken cancellationToken)
    {
        return Ok(await storeSettingsService.GetAsync(cancellationToken));
    }

    [HttpPut]
    [ProducesResponseType(typeof(StoreSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StoreSettingsResponse>> UpdateAsync(
        UpdateStoreSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var response = await storeSettingsService.UpdateAsync(
            new UpdateStoreSettingsCommand(
                request.Name,
                request.Email,
                request.Address,
                request.IsOnlineOrderingEnabled,
                request.ContactNumbers,
                request.RowVersion),
            cancellationToken);

        var user = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await auditLogService.LogAsync(user, role, $"Cập nhật cấu hình cửa hàng: {request.Name}", "Cài đặt", ip, "Success", cancellationToken);

        return Ok(response);
    }
}
