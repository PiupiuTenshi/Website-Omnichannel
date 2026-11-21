using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Features.Orders;

public sealed record SetCartItemCommand(Guid ProductVariantId, decimal Quantity);

public sealed record ShoppingCartItemResponse(
    Guid ProductVariantId,
    string Name,
    string VariantName,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal,
    bool IsWeighed);

public sealed record ShoppingCartResponse(Guid ShoppingCartId, IReadOnlyList<ShoppingCartItemResponse> Items, decimal Subtotal);

public sealed class ShoppingCartService(IShoppingCartRepository shoppingCartRepository)
{
    public async Task<ShoppingCartResponse> GetGuestCartAsync(string sessionId, CancellationToken cancellationToken)
    {
        var cart = await shoppingCartRepository.GetGuestCartAsync(NormalizeSessionId(sessionId), cancellationToken);
        return cart is null
            ? new ShoppingCartResponse(Guid.Empty, [], 0)
            : await ToResponseAsync(cart, cancellationToken);
    }

    public async Task<ShoppingCartResponse> GetUserCartAsync(string userId, CancellationToken cancellationToken)
    {
        var cart = await shoppingCartRepository.GetUserCartAsync(userId, cancellationToken);
        return cart is null
            ? new ShoppingCartResponse(Guid.Empty, [], 0)
            : await ToResponseAsync(cart, cancellationToken);
    }

    public async Task<ShoppingCartResponse> SetItemAsync(string? sessionId, string? userId, SetCartItemCommand command, CancellationToken cancellationToken)
    {
        await ValidateQuantityAsync(command, cancellationToken);
        var utcNow = DateTime.UtcNow;
        ShoppingCart? cart;

        if (userId is not null)
        {
            cart = await shoppingCartRepository.GetUserCartAsync(userId, cancellationToken);
            if (cart is null)
            {
                cart = ShoppingCart.CreateForUser(userId, utcNow);
                await shoppingCartRepository.AddAsync(cart, cancellationToken);
            }
        }
        else
        {
            var normalizedSessionId = NormalizeSessionId(sessionId!);
            cart = await shoppingCartRepository.GetGuestCartAsync(normalizedSessionId, cancellationToken);
            if (cart is null)
            {
                cart = ShoppingCart.CreateGuest(normalizedSessionId, utcNow);
                await shoppingCartRepository.AddAsync(cart, cancellationToken);
            }
        }

        var addedItem = cart.SetItemQuantity(command.ProductVariantId, command.Quantity, utcNow);
        if (addedItem is not null && cart.ShoppingCartId != Guid.Empty)
        {
            await shoppingCartRepository.AddItemAsync(addedItem, cancellationToken);
        }
        await shoppingCartRepository.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(cart, cancellationToken);
    }

    public async Task<ShoppingCartResponse> RemoveItemAsync(string? sessionId, string? userId, Guid productVariantId, CancellationToken cancellationToken)
    {
        ShoppingCart? cart;
        if (userId is not null)
        {
            cart = await shoppingCartRepository.GetUserCartAsync(userId, cancellationToken)
                ?? throw new KeyNotFoundException("User cart was not found.");
        }
        else
        {
            cart = await shoppingCartRepository.GetGuestCartAsync(NormalizeSessionId(sessionId!), cancellationToken)
                ?? throw new KeyNotFoundException("Guest cart was not found.");
        }

        cart.RemoveItem(productVariantId, DateTime.UtcNow);
        await shoppingCartRepository.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(cart, cancellationToken);
    }

    public Task<ShoppingCartResponse> SetGuestItemAsync(string sessionId, SetCartItemCommand command, CancellationToken cancellationToken) =>
        SetItemAsync(sessionId, null, command, cancellationToken);

    public Task<ShoppingCartResponse> RemoveGuestItemAsync(string sessionId, Guid productVariantId, CancellationToken cancellationToken) =>
        RemoveItemAsync(sessionId, null, productVariantId, cancellationToken);

    public Task<ShoppingCartResponse> SetUserItemAsync(string userId, SetCartItemCommand command, CancellationToken cancellationToken) =>
        SetItemAsync(null, userId, command, cancellationToken);

    public Task<ShoppingCartResponse> RemoveUserItemAsync(string userId, Guid productVariantId, CancellationToken cancellationToken) =>
        RemoveItemAsync(null, userId, productVariantId, cancellationToken);

    public async Task<ShoppingCartResponse> MergeGuestCartAsync(string sessionId, string userId, CancellationToken cancellationToken)
    {
        var guestCart = await shoppingCartRepository.GetGuestCartAsync(NormalizeSessionId(sessionId), cancellationToken);
        var utcNow = DateTime.UtcNow;
        var userCart = await shoppingCartRepository.GetUserCartAsync(userId, cancellationToken);
        if (userCart is null)
        {
            userCart = ShoppingCart.CreateForUser(userId, utcNow);
            await shoppingCartRepository.AddAsync(userCart, cancellationToken);
        }

        if (guestCart is not null)
        {
            var addedItems = userCart.MergeFrom(guestCart, utcNow);
            foreach (var addedItem in addedItems)
            {
                await shoppingCartRepository.AddItemAsync(addedItem, cancellationToken);
            }
        }

        await shoppingCartRepository.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(userCart, cancellationToken);
    }

    private async Task ValidateQuantityAsync(SetCartItemCommand command, CancellationToken cancellationToken)
    {
        var product = await shoppingCartRepository.GetActiveProductAsync(command.ProductVariantId, cancellationToken)
            ?? throw new KeyNotFoundException("Active product variant was not found.");
        if (command.Quantity <= 0 ||
            (product.IsWeighed && decimal.Round(command.Quantity, 1) != command.Quantity) ||
            (!product.IsWeighed && command.Quantity != decimal.Truncate(command.Quantity)))
        {
            throw new BusinessRuleViolationException("Quantity does not match the product unit.");
        }
    }

    private async Task<ShoppingCartResponse> ToResponseAsync(ShoppingCart cart, CancellationToken cancellationToken)
    {
        var items = await shoppingCartRepository.GetSnapshotAsync(cart, cancellationToken);
        var responseItems = items.Select(item => new ShoppingCartItemResponse(
            item.ProductVariantId,
            item.Name,
            item.VariantName,
            item.Quantity,
            item.UnitPrice,
            item.Quantity * item.UnitPrice,
            item.IsWeighed)).ToArray();
        return new ShoppingCartResponse(cart.ShoppingCartId, responseItems, responseItems.Sum(item => item.LineTotal));
    }

    private static string NormalizeSessionId(string sessionId)
    {
        var normalized = sessionId?.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 100)
        {
            throw new BusinessRuleViolationException("A valid guest cart session is required.");
        }

        return normalized;
    }
}
