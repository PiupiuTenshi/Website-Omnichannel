using System.Diagnostics;
using System.Text.Json;
using GroceryStore.Api.Contracts;

namespace GroceryStore.Api.Middlewares;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JSON_OPTIONS = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate next;
    private readonly ILogger<ExceptionHandlingMiddleware> logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        this.next = next;
        this.logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for {RequestPath}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
            var response = new ErrorResponse("An unexpected error occurred.", context.Response.StatusCode, traceId);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JSON_OPTIONS));
        }
    }
}
