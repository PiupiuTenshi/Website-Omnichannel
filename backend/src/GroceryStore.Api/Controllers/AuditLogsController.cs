using System.Threading;
using System.Threading.Tasks;
using GroceryStore.Application.Features.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/audit-logs")]
public sealed class AuditLogsController : ControllerBase
{
    private readonly AuditLogService auditLogService;

    public AuditLogsController(AuditLogService auditLogService)
    {
        this.auditLogService = auditLogService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        var logs = await auditLogService.GetLogsAsync(cancellationToken);
        return Ok(logs);
    }
}
