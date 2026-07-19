using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Persistence.Authentication;
using GroceryStore.Persistence.Context;
using GroceryStore.Persistence.Repositories;
using GroceryStore.Persistence.Seeding;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = BuildConnectionString(configuration.GetConnectionString("DefaultConnection"));

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString, sqlServerOptions => sqlServerOptions.EnableRetryOnFailure());
            }
        });

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = false;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<IIdentityAccountService, IdentityAccountService>();
        services.AddScoped<IRefreshSessionStore, RefreshSessionStore>();
        services.AddScoped<IStoreSettingsRepository, StoreSettingsRepository>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IPosRepository, PosRepository>();
        services.AddScoped<IShoppingCartRepository, ShoppingCartRepository>();
        services.AddScoped<IInventoryReservationRepository, InventoryReservationRepository>();
        services.AddScoped<IOnlineOrderRepository, OnlineOrderRepository>();
        services.AddScoped<IReviewReturnsRepository, ReviewReturnsRepository>();
        services.AddScoped<IReportingRepository, ReportingRepository>();
        services.Configure<DemoIdentityOptions>(configuration.GetSection(DemoIdentityOptions.SECTION_NAME));
        services.AddScoped<DemoIdentitySeeder>();

        return services;
    }

    private static string? BuildConnectionString(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var builder = new SqlConnectionStringBuilder(connectionString);
        if (builder.DataSource.StartsWith("localhost", StringComparison.OrdinalIgnoreCase) ||
            builder.DataSource.StartsWith("127.0.0.1", StringComparison.OrdinalIgnoreCase))
        {
            builder.TrustServerCertificate = true;
        }

        return builder.ConnectionString;
    }
}
