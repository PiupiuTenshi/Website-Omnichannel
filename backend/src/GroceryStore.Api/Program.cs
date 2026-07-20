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
    // Avoid the Windows Event Log provider aborting local development when it is
    // unavailable for the current user account. Console logging still records errors.
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.AddDebug();
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
var isDemoCatalogSeedCommand = args.Contains("--seed-demo-catalog", StringComparer.Ordinal);
var isDemoCatalogVerifyCommand = args.Contains("--verify-demo-catalog", StringComparer.Ordinal);
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

// This maintenance seed mutates data and must be explicitly enabled for a demo environment.
if (builder.Configuration.GetValue("StartupTasks:SeedProductSuppliers", true))
{
try
{
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<GroceryStore.Persistence.Context.ApplicationDbContext>();
    var supplier = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(context.Suppliers, s => s.IsActive);
    if (supplier == null)
    {
        supplier = new GroceryStore.Domain.Entities.Supplier("Nhà cung cấp Tổng hợp", "Nguyễn Văn A", "0909090909", "ncc@demo.local", "204 Tô Hiến Thành, Đà Lạt", true);
        await context.Suppliers.AddAsync(supplier);
        await context.SaveChangesAsync();
    }

    var productIds = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
        System.Linq.Queryable.Select(context.Products, p => p.ProductId)
    );

    var linkedProductIds = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
        System.Linq.Queryable.Select(context.ProductSuppliers, ps => ps.ProductId)
    );

    var unlinkedProductIds = productIds.Except(linkedProductIds).ToList();

    if (unlinkedProductIds.Count > 0)
    {
        foreach (var productId in unlinkedProductIds)
        {
            await context.ProductSuppliers.AddAsync(
                new GroceryStore.Domain.Entities.ProductSupplier(productId, supplier.SupplierId, "PROD-" + productId.ToString().Substring(0, 8).ToUpper(), true)
            );
        }
        await context.SaveChangesAsync();
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred while seeding product suppliers.");
}
}

if (isDemoCatalogSeedCommand || isDemoCatalogVerifyCommand)
{
    await using var scope = app.Services.CreateAsyncScope();
    var demoCatalogSeeder = scope.ServiceProvider.GetRequiredService<DemoCatalogSeeder>();
    if (isDemoCatalogSeedCommand)
    {
        await demoCatalogSeeder.SeedAsync(CancellationToken.None);
    }

    if (isDemoCatalogVerifyCommand)
    {
        var summary = await demoCatalogSeeder.GetSummaryAsync(CancellationToken.None);
        Console.WriteLine($"Demo catalog summary: categories={summary.Categories}, units={summary.Units}, suppliers={summary.Suppliers}, products={summary.Products}, variants={summary.Variants}, inventoryBatches={summary.InventoryBatches}, users={summary.Users}");
    }
}

if (isDemoIdentitySeedCommand || isDemoCatalogSeedCommand || isDemoCatalogVerifyCommand)
{
    return;
}

app.Run();

public partial class Program;
