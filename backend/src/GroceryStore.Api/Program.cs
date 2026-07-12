using GroceryStore.Application;
using GroceryStore.Api.Middlewares;
using GroceryStore.Infrastructure;
using GroceryStore.Persistence;
using GroceryStore.Persistence.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (builder.Configuration.GetValue<bool>("DemoIdentity:Enabled"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var demoIdentitySeeder = scope.ServiceProvider.GetRequiredService<DemoIdentitySeeder>();
    await demoIdentitySeeder.SeedAsync(CancellationToken.None);
}

app.Run();

public partial class Program;
