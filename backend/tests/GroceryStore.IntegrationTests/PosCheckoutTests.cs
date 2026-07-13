using GroceryStore.Application.Features.Inventory;
using GroceryStore.Application.Features.Pos;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class PosCheckoutTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task Checkout_CashRoundingAndOrderStorage_SucceedsAsync()
    {
        // Arrange
        var databaseName = Guid.NewGuid().ToString();
        using var testFactory = CreateInMemoryFactory(databaseName);
        await using var scope = testFactory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var posService = scope.ServiceProvider.GetRequiredService<PosService>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<InventoryService>();

        await context.Database.EnsureCreatedAsync();

        // Seed product
        var category = new Category("Groceries", "groceries", null, 1, true);
        var unit = new UnitOfMeasure("Hop", "Hop", true, 1, true);
        context.Categories.Add(category);
        context.UnitsOfMeasure.Add(unit);
        await context.SaveChangesAsync();

        var product = new Product("Milk", "milk", "Fresh Milk", category.CategoryId, unit.UnitOfMeasureId, true);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var variant = new ProductVariant(product.ProductId, "1L Pack", "SKU-MILK", "8936011970099", 25300m, null, true); // Price ends in 300 -> round cash up to 26000
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        var supplier = new Supplier("Supplier A", null, null, null, null, true);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        // Receive batch
        await inventoryService.ReceiveAsync(
            new ReceiveInventoryCommand(variant.ProductVariantId, supplier.SupplierId, 10m, 20000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(7), "REC-001"),
            CancellationToken.None);

        // Act - POS Checkout with Cash
        var items = new List<PosCartItemDto> { new(variant.ProductVariantId, 1m, 1m) };
        var command = new CheckoutPosOrderCommand(items, PosPaymentMethod.Cash, 30000m, "TestSellerUser");
        var response = await posService.CheckoutAsync(command, CancellationToken.None);

        // Assert
        Assert.Equal(25300m, response.ExactAmount);
        Assert.Equal(26000m, response.AmountDue); // Rounded to nearest 1,000 VND
        Assert.Equal(4000m, response.ChangeAmount); // 30,000 - 26,000

        // Verify database records
        var savedOrder = await context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.OrderId == response.OrderId);
        Assert.NotNull(savedOrder);
        Assert.Equal(OrderStatus.Completed, savedOrder.Status);
        Assert.Equal("TestSellerUser", savedOrder.ProcessedByUserId);
        Assert.Single(savedOrder.OrderItems);
        Assert.Equal(1m, savedOrder.OrderItems.First().Quantity);
        Assert.Equal(25300m, savedOrder.OrderItems.First().UnitPrice);
    }

    [Fact]
    public async Task Checkout_BankTransfer_KeepsExactAmountAsync()
    {
        // Arrange
        var databaseName = Guid.NewGuid().ToString();
        using var testFactory = CreateInMemoryFactory(databaseName);
        await using var scope = testFactory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var posService = scope.ServiceProvider.GetRequiredService<PosService>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<InventoryService>();

        await context.Database.EnsureCreatedAsync();

        // Seed product
        var category = new Category("Groceries", "groceries", null, 1, true);
        var unit = new UnitOfMeasure("Hop", "Hop", true, 1, true);
        context.Categories.Add(category);
        context.UnitsOfMeasure.Add(unit);
        await context.SaveChangesAsync();

        var product = new Product("Milk", "milk", "Fresh Milk", category.CategoryId, unit.UnitOfMeasureId, true);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var variant = new ProductVariant(product.ProductId, "1L Pack", "SKU-MILK", "8936011970099", 25300m, null, true);
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        var supplier = new Supplier("Supplier A", null, null, null, null, true);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        // Receive batch
        await inventoryService.ReceiveAsync(
            new ReceiveInventoryCommand(variant.ProductVariantId, supplier.SupplierId, 10m, 20000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(7), "REC-001"),
            CancellationToken.None);

        // Act - POS Checkout with BankTransfer
        var items = new List<PosCartItemDto> { new(variant.ProductVariantId, 1m, variant.SellingPrice) };
        var command = new CheckoutPosOrderCommand(items, PosPaymentMethod.BankTransfer, null, "TestSellerUser");
        var response = await posService.CheckoutAsync(command, CancellationToken.None);

        // Assert
        Assert.Equal(25300m, response.ExactAmount);
        Assert.Equal(25300m, response.AmountDue); // Keeps exact amount
        Assert.Equal(0m, response.ChangeAmount);
    }

    [Fact]
    public async Task Checkout_InsufficientStock_RollsBackTransactionAsync()
    {
        // Arrange
        var databaseName = Guid.NewGuid().ToString();
        using var testFactory = CreateInMemoryFactory(databaseName);
        await using var scope = testFactory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var posService = scope.ServiceProvider.GetRequiredService<PosService>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<InventoryService>();

        await context.Database.EnsureCreatedAsync();

        // Seed product
        var category = new Category("Groceries", "groceries", null, 1, true);
        var unit = new UnitOfMeasure("Hop", "Hop", true, 1, true);
        context.Categories.Add(category);
        context.UnitsOfMeasure.Add(unit);
        await context.SaveChangesAsync();

        var product = new Product("Milk", "milk", "Fresh Milk", category.CategoryId, unit.UnitOfMeasureId, true);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var variant = new ProductVariant(product.ProductId, "1L Pack", "SKU-MILK", "8936011970099", 25300m, null, true);
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        var supplier = new Supplier("Supplier A", null, null, null, null, true);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        // Receive only 2 units of stock
        await inventoryService.ReceiveAsync(
            new ReceiveInventoryCommand(variant.ProductVariantId, supplier.SupplierId, 2m, 20000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(7), "REC-001"),
            CancellationToken.None);

        // Act & Assert - Attempt to checkout 5 units
        var items = new List<PosCartItemDto> { new(variant.ProductVariantId, 5m, variant.SellingPrice) };
        var command = new CheckoutPosOrderCommand(items, PosPaymentMethod.Cash, 200000m, "TestSellerUser");

        await Assert.ThrowsAsync<InvalidOperationException>(() => posService.CheckoutAsync(command, CancellationToken.None));

        // Verify order was not created (rollback)
        var ordersCount = await context.Orders.CountAsync();
        Assert.Equal(0, ordersCount);

        // Verify batch quantity remains unchanged
        var batch = await context.InventoryBatches.FirstAsync();
        Assert.Equal(2m, batch.AvailableQuantity);
    }

    [Fact]
    public async Task Checkout_ExpiredProducts_PreventsSaleAsync()
    {
        // Arrange
        var databaseName = Guid.NewGuid().ToString();
        using var testFactory = CreateInMemoryFactory(databaseName);
        await using var scope = testFactory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var posService = scope.ServiceProvider.GetRequiredService<PosService>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<InventoryService>();

        await context.Database.EnsureCreatedAsync();

        // Seed product
        var category = new Category("Groceries", "groceries", null, 1, true);
        var unit = new UnitOfMeasure("Hop", "Hop", true, 1, true);
        context.Categories.Add(category);
        context.UnitsOfMeasure.Add(unit);
        await context.SaveChangesAsync();

        var product = new Product("Milk", "milk", "Fresh Milk", category.CategoryId, unit.UnitOfMeasureId, true);
        context.Products.Add(product);
        await context.SaveChangesAsync();

        var variant = new ProductVariant(product.ProductId, "1L Pack", "SKU-MILK", "8936011970099", 25300m, null, true);
        context.ProductVariants.Add(variant);
        await context.SaveChangesAsync();

        var supplier = new Supplier("Supplier A", null, null, null, null, true);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        // Receive batch that is already expired
        await inventoryService.ReceiveAsync(
            new ReceiveInventoryCommand(variant.ProductVariantId, supplier.SupplierId, 10m, 20000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(-1), "REC-001"),
            CancellationToken.None);

        // Act & Assert - Attempt to checkout
        var items = new List<PosCartItemDto> { new(variant.ProductVariantId, 1m, variant.SellingPrice) };
        var command = new CheckoutPosOrderCommand(items, PosPaymentMethod.Cash, 30000m, "TestSellerUser");

        await Assert.ThrowsAsync<InvalidOperationException>(() => posService.CheckoutAsync(command, CancellationToken.None));

        // Verify order was not created
        var ordersCount = await context.Orders.CountAsync();
        Assert.Equal(0, ordersCount);
    }

    private WebApplicationFactory<Program> CreateInMemoryFactory(string databaseName)
    {
        return factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName)
                       .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning)));
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
