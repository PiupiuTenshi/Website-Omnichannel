using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Features.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/users")]
public sealed class UserAdministrationController : ControllerBase
{
    private readonly AuthService authService;
    private readonly IIdentityAccountService identityAccountService;
    private readonly AuditLogService auditLogService;

    public UserAdministrationController(
        AuthService authService,
        IIdentityAccountService identityAccountService,
        AuditLogService auditLogService)
    {
        this.authService = authService;
        this.identityAccountService = identityAccountService;
        this.auditLogService = auditLogService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllAsync(CancellationToken cancellationToken)
    {
        var users = await authService.GetAllUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        await authService.CreateUserWithRoleAsync(request.Email, request.Password, request.Role, cancellationToken);

        var user = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await auditLogService.LogAsync(user, role, $"Tạo tài khoản mới: {request.Email} (Vai trò: {request.Role})", "Hệ thống", ip, "Success", cancellationToken);

        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var targetUser = await identityAccountService.FindByIdAsync(userId, cancellationToken);
        var targetEmail = targetUser?.Email ?? userId;

        await authService.DeleteUserAsync(userId, cancellationToken);

        var user = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await auditLogService.LogAsync(user, role, $"Vô hiệu hóa (khóa mềm) tài khoản: {targetEmail}", "Hệ thống", ip, "Success", cancellationToken);

        return NoContent();
    }

    [HttpPut("{userId}/activation")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetActivationAsync(
        string userId,
        SetUserActivationRequest request,
        CancellationToken cancellationToken)
    {
        var targetUser = await identityAccountService.FindByIdAsync(userId, cancellationToken);
        var targetEmail = targetUser?.Email ?? userId;

        await authService.SetUserActiveAsync(userId, request.IsActive, cancellationToken);

        var user = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var actionText = request.IsActive ? $"Mở khóa kích hoạt tài khoản: {targetEmail}" : $"Khóa kích hoạt tài khoản: {targetEmail}";
        await auditLogService.LogAsync(user, role, actionText, "Hệ thống", ip, "Success", cancellationToken);

        return NoContent();
    }

    [HttpPut("{userId}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangeRoleAsync(
        string userId,
        ChangeUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        var targetUser = await identityAccountService.FindByIdAsync(userId, cancellationToken);
        var targetEmail = targetUser?.Email ?? userId;

        await authService.ChangeUserRoleAsync(userId, request.Role, cancellationToken);

        var user = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        await auditLogService.LogAsync(user, role, $"Thay đổi vai trò tài khoản {targetEmail} thành {request.Role}", "Hệ thống", ip, "Success", cancellationToken);

        return NoContent();
    }
}
