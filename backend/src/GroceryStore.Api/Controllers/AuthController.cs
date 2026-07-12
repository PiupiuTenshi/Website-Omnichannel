using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Auth;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService authService;

    public AuthController(AuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(RegistrationResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<RegistrationResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RegisterAsync(
            new RegisterUserCommand(request.Email, request.PhoneNumber, request.Password),
            cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthSessionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthSessionResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        return Ok(await authService.LoginAsync(new LoginCommand(request.Identifier, request.Password), cancellationToken));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthSessionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthSessionResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        return Ok(await authService.RefreshAsync(new RefreshSessionCommand(request.RefreshToken), cancellationToken));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LogoutAsync(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(new RefreshSessionCommand(request.RefreshToken), cancellationToken);
        return NoContent();
    }

    [HttpPost("confirm-email")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken)
    {
        await authService.ConfirmEmailAsync(new ConfirmEmailCommand(request.UserId, request.Token), cancellationToken);
        return NoContent();
    }

    [HttpPost("confirm-phone")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ConfirmPhoneAsync(ConfirmPhoneRequest request, CancellationToken cancellationToken)
    {
        await authService.ConfirmPhoneAsync(new ConfirmPhoneCommand(request.UserId, request.Code), cancellationToken);
        return NoContent();
    }
}
