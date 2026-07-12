using GroceryStore.Api.Contracts;
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

    public StoreSettingsController(StoreSettingsService storeSettingsService)
    {
        this.storeSettingsService = storeSettingsService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(StoreSettingsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StoreSettingsResponse>> GetAsync(CancellationToken cancellationToken)
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
        return Ok(response);
    }
}
