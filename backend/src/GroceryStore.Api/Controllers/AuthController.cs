using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GroceryStore.Api.Controllers;

[ApiController]
[EnableRateLimiting("auth")]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService authService;

    private readonly IConfiguration configuration;

    public AuthController(AuthService authService, IConfiguration configuration)
    {
        this.authService = authService;
        this.configuration = configuration;
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

    [HttpPost("password-resets")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> RequestPasswordResetAsync(RequestPasswordResetRequest request, CancellationToken cancellationToken)
    {
        var allowedOrigins = configuration.GetSection("Auth:PasswordResetAllowedOrigins").Get<string[]>() ?? [];
        var frontendOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
        if (!Uri.TryCreate(request.ResetUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && !(uri.IsLoopback && uri.Scheme == Uri.UriSchemeHttp)) ||
            uri.AbsolutePath != "/reset-password" || uri.UserInfo.Length != 0 || uri.Query.Length != 0 || uri.Fragment.Length != 0 ||
            !allowedOrigins.Concat(frontendOrigins).Contains(uri.GetLeftPart(UriPartial.Authority), StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid password reset URL." });
        }

        await authService.RequestPasswordResetAsync(new RequestPasswordResetCommand(request.Identifier, uri.AbsoluteUri), cancellationToken);
        return Accepted();
    }

    [HttpPost("password-resets/confirm")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await authService.ResetPasswordAsync(new ResetPasswordCommand(request.UserId, request.Token, request.NewPassword), cancellationToken);
        return NoContent();
    }
}
