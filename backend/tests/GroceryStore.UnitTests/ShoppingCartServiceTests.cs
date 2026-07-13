using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Application.Features.Orders;
using GroceryStore.Domain.Entities;

namespace GroceryStore.UnitTests;

public sealed class ShoppingCartServiceTests
{
    [Fact]
    public async Task GuestCarts_AreIsolatedAndUseServerPriceAsync()
    {
        var productVariantId = Guid.NewGuid();
        var repository = new InMemoryShoppingCartRepository(productVariantId, new CartProduct("Rice", "5 kg bag", 125000m, false));
        var service = new ShoppingCartService(repository);

        var firstCart = await service.SetGuestItemAsync("guest-a", new SetCartItemCommand(productVariantId, 1m), CancellationToken.None);
        var secondCart = await service.SetGuestItemAsync("guest-b", new SetCartItemCommand(productVariantId, 2m), CancellationToken.None);

        Assert.Single(firstCart.Items);
        Assert.Equal(125000m, firstCart.Subtotal);
        Assert.Equal(250000m, secondCart.Subtotal);
        Assert.NotEqual(firstCart.ShoppingCartId, secondCart.ShoppingCartId);
    }

    [Fact]
    public async Task MergeGuestCart_CombinesItemsIntoAuthenticatedCartAsync()
    {
        var firstVariantId = Guid.NewGuid();
        var secondVariantId = Guid.NewGuid();
        var repository = new InMemoryShoppingCartRepository(
            firstVariantId,
            new CartProduct("Rice", "5 kg bag", 125000m, false),
            secondVariantId,
            new CartProduct("Milk", "1 L", 32000m, false));
        var service = new ShoppingCartService(repository);

        await service.SetGuestItemAsync("guest-a", new SetCartItemCommand(firstVariantId, 1m), CancellationToken.None);
        var mergedCart = await service.MergeGuestCartAsync("guest-a", "buyer-1", CancellationToken.None);

        Assert.Single(mergedCart.Items);
        Assert.Equal(firstVariantId, mergedCart.Items[0].ProductVariantId);
        Assert.Equal(125000m, mergedCart.Subtotal);
        Assert.Null(await repository.GetGuestCartAsync("guest-a", CancellationToken.None));
    }

    [Fact]
    public async Task SetGuestItem_RejectsInvalidWeighedQuantityAsync()
    {
        var productVariantId = Guid.NewGuid();
        var repository = new InMemoryShoppingCartRepository(productVariantId, new CartProduct("Vegetables", "Loose", 30000m, true));
        var service = new ShoppingCartService(repository);

        await Assert.ThrowsAsync<BusinessRuleViolationException>(() =>
            service.SetGuestItemAsync("guest-a", new SetCartItemCommand(productVariantId, 0.15m), CancellationToken.None));
    }

    private sealed class InMemoryShoppingCartRepository : IShoppingCartRepository
    {
        private readonly Dictionary<string, ShoppingCart> guestCarts = [];
        private readonly Dictionary<string, ShoppingCart> userCarts = [];
        private readonly Dictionary<Guid, CartProduct> products = [];

        public InMemoryShoppingCartRepository(Guid productVariantId, CartProduct product)
        {
            products.Add(productVariantId, product);
        }

        public InMemoryShoppingCartRepository(Guid firstVariantId, CartProduct firstProduct, Guid secondVariantId, CartProduct secondProduct)
            : this(firstVariantId, firstProduct)
        {
            products.Add(secondVariantId, secondProduct);
        }

        public Task<ShoppingCart?> GetGuestCartAsync(string sessionId, CancellationToken cancellationToken)
        {
            return Task.FromResult(guestCarts.TryGetValue(sessionId, out var cart) && !cart.IsMerged ? cart : null);
        }

        public Task<ShoppingCart?> GetUserCartAsync(string userId, CancellationToken cancellationToken)
        {
            return Task.FromResult(userCarts.TryGetValue(userId, out var cart) && !cart.IsMerged ? cart : null);
        }

        public Task<CartProduct?> GetActiveProductAsync(Guid productVariantId, CancellationToken cancellationToken)
        {
            return Task.FromResult(products.TryGetValue(productVariantId, out var product) ? product : null);
        }

        public Task<IReadOnlyList<CartItemSnapshot>> GetSnapshotAsync(ShoppingCart cart, CancellationToken cancellationToken)
        {
            IReadOnlyList<CartItemSnapshot> snapshot = cart.Items
                .Select(item =>
                {
                    var product = products[item.ProductVariantId];
                    return new CartItemSnapshot(item.ProductVariantId, product.Name, product.VariantName, item.Quantity, product.UnitPrice, product.IsWeighed);
                })
                .ToArray();
            return Task.FromResult(snapshot);
        }

        public Task AddAsync(ShoppingCart cart, CancellationToken cancellationToken)
        {
            if (cart.SessionId is not null)
            {
                guestCarts.Add(cart.SessionId, cart);
            }
            else if (cart.UserId is not null)
            {
                userCarts.Add(cart.UserId, cart);
            }

            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
