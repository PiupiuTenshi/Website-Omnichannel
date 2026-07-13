using GroceryStore.Application.Features.Reporting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Manager")]
[Route("api/admin/reports")]
public sealed class ReportsController(ReportingService reportingService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ReportingDashboardResponse>> GetAsync([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, CancellationToken cancellationToken) => Ok(await reportingService.GetDashboardAsync(fromUtc, toUtc, cancellationToken));
}
