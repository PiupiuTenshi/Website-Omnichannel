using GroceryStore.Application;
using GroceryStore.Api.Configuration;
using GroceryStore.Api.Middlewares;
using GroceryStore.Infrastructure;
using GroceryStore.Persistence;
using GroceryStore.Persistence.Seeding;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    EnvironmentFileConfiguration.AddLocalEnvironmentFile(builder.Configuration, builder.Environment.ContentRootPath);
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
if (builder.Environment.IsProduction() && (allowedOrigins.Length == 0 || allowedOrigins.Any(origin => origin.StartsWith("http://", StringComparison.OrdinalIgnoreCase))))
{
    throw new InvalidOperationException("Production CORS origins must be configured with HTTPS URLs.");
}
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        $"{context.Connection.RemoteIpAddress}:{context.Request.Path}",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "GroceryStore API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Enter JWT Bearer token."
    });

    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseCors("Frontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "GroceryStore API v1");
    });
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapHealthChecks("/health");

var isDemoIdentitySeedCommand = args.Contains("--seed-demo-identities", StringComparer.Ordinal);
if (builder.Configuration.GetValue<bool>("DemoIdentity:Enabled") || isDemoIdentitySeedCommand)
{
    try
    {
        await using var scope = app.Services.CreateAsyncScope();
        var demoIdentitySeeder = scope.ServiceProvider.GetRequiredService<DemoIdentitySeeder>();
        await demoIdentitySeeder.SeedAsync(CancellationToken.None);
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding demo identities.");
        if (isDemoIdentitySeedCommand)
        {
            throw;
        }
    }
}

if (isDemoIdentitySeedCommand)
{
    return;
}

app.Run();

public partial class Program;
