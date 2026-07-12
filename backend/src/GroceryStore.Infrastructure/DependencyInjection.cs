using System.Text;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Abstractions.Email;
using GroceryStore.Application.Abstractions.Sms;
using GroceryStore.Application.Abstractions.Storage;
using GroceryStore.Infrastructure.Authentication;
using GroceryStore.Infrastructure.Email;
using GroceryStore.Infrastructure.Sms;
using GroceryStore.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace GroceryStore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SECTION_NAME).Get<JwtOptions>() ?? new JwtOptions();
        var smtpOptions = configuration.GetSection(SmtpOptions.SECTION_NAME).Get<SmtpOptions>() ?? new SmtpOptions();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SECTION_NAME));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SECTION_NAME));
        services.Configure<ImageStorageOptions>(configuration.GetSection(ImageStorageOptions.SECTION_NAME));
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddScoped<ISmsOtpSender, MockSmsOtpSender>();
        services.AddScoped<IEmailSender>(_ => string.Equals(smtpOptions.Provider, "Smtp", StringComparison.OrdinalIgnoreCase)
            ? new SmtpEmailSender(Microsoft.Extensions.Options.Options.Create(smtpOptions))
            : new MockEmailSender(_.GetRequiredService<Microsoft.Extensions.Logging.ILogger<MockEmailSender>>()));
        services.AddSingleton<ProductImageTransformer>();
        services.AddSingleton<IImageStorage, LocalImageStorage>();
        services.AddSingleton<LocalImageStorage>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = !string.IsNullOrWhiteSpace(jwtOptions.Issuer),
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(jwtOptions.Audience),
                    ValidAudience = jwtOptions.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = !string.IsNullOrWhiteSpace(jwtOptions.Key),
                    IssuerSigningKey = string.IsNullOrWhiteSpace(jwtOptions.Key)
                        ? null
                        : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
                    ClockSkew = TimeSpan.Zero
                };
            });
        services.AddAuthorization();

        return services;
    }
}
