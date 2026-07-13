using GroceryStore.Application.Features.Inventory;
using GroceryStore.Application.Features.Orders;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class InventoryReservationTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task ReserveGuestCart_AllocatesFefoAndReplacesExistingReservationAsync()
    {
        using var testFactory = CreateInMemoryFactory(Guid.NewGuid().ToString());
        await using var scope = testFactory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var cartService = scope.ServiceProvider.GetRequiredService<ShoppingCartService>();
        var reservationService = scope.ServiceProvider.GetRequiredService<InventoryReservationService>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<InventoryService>();
        await context.Database.EnsureCreatedAsync();

        var category = new Category("Groceries", "groceries", null, 1, true);
        var unit = new UnitOfMeasure("UNIT", "Unit", false, 0, true);
        context.Categories.Add(category);
        context.UnitsOfMeasure.Add(unit);
        await context.SaveChangesAsync();
        var product = new Product("Rice", "rice", null, category.CategoryId, unit.UnitOfMeasureId, true);
        context.Products.Add(product);
        await context.SaveChangesAsync();
        var variant = new ProductVariant(product.ProductId, "5 kg bag", "RICE-5KG", null, 125000m, null, true);
        context.ProductVariants.Add(variant);
        var supplier = new Supplier("Supplier", null, null, null, null, true);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();
        await inventoryService.ReceiveAsync(new ReceiveInventoryCommand(
            variant.ProductVariantId, supplier.SupplierId, 5m, 100000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(1), "REC-RESERVE"), CancellationToken.None);

        await cartService.SetGuestItemAsync("reservation-session", new SetCartItemCommand(variant.ProductVariantId, 2m), CancellationToken.None);
        var reservation = await reservationService.ReserveCartAsync("reservation-session", null, CancellationToken.None);
        var replacementReservation = await reservationService.ReserveCartAsync("reservation-session", null, CancellationToken.None);

        Assert.True(reservation.ExpiresAtUtc > DateTime.UtcNow);
        Assert.Equal(2m, replacementReservation.ReservedItemCount);
        var batch = await context.InventoryBatches.SingleAsync();
        Assert.Equal(3m, batch.AvailableQuantity);
        Assert.Equal(1, await context.InventoryReservations.CountAsync(item => item.Status == InventoryReservationStatus.Active));
        Assert.Equal(1, await context.InventoryReservations.CountAsync(item => item.Status == InventoryReservationStatus.Released));
        Assert.Equal(2, await context.InventoryTransactions.CountAsync(item => item.Type == InventoryTransactionType.ReservationHold));
        Assert.Equal(1, await context.InventoryTransactions.CountAsync(item => item.Type == InventoryTransactionType.ReservationRelease));
    }

    private WebApplicationFactory<Program> CreateInMemoryFactory(string databaseName)
    {
        return factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            var descriptor = services.SingleOrDefault(service => service.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor is not null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName)
                    .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning)));
            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationHandler.SCHEME_NAME;
                    options.DefaultChallengeScheme = TestAuthenticationHandler.SCHEME_NAME;
                    options.DefaultForbidScheme = TestAuthenticationHandler.SCHEME_NAME;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SCHEME_NAME, _ => { });
        }));
    }
}
