using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class ShoppingCartRepository(ApplicationDbContext context) : IShoppingCartRepository
{
    public Task<ShoppingCart?> GetGuestCartAsync(string sessionId, CancellationToken cancellationToken) =>
        context.ShoppingCarts
            .Include(cart => cart.Items)
            .SingleOrDefaultAsync(cart => cart.SessionId == sessionId && !cart.IsMerged, cancellationToken);

    public Task<ShoppingCart?> GetUserCartAsync(string userId, CancellationToken cancellationToken) =>
        context.ShoppingCarts
            .Include(cart => cart.Items)
            .SingleOrDefaultAsync(cart => cart.UserId == userId && !cart.IsMerged, cancellationToken);

    public Task<CartProduct?> GetActiveProductAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        return (
            from variant in context.ProductVariants.AsNoTracking()
            join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId
            join unit in context.UnitsOfMeasure.AsNoTracking() on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            where variant.ProductVariantId == productVariantId && variant.IsActive && product.IsActive && unit.IsActive
            select new CartProduct(
                product.Name,
                variant.Name,
                variant.SellingPrice,
                unit.Code == "KG")
        ).SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CartItemSnapshot>> GetSnapshotAsync(ShoppingCart cart, CancellationToken cancellationToken)
    {
        var itemQuantities = cart.Items.ToDictionary(item => item.ProductVariantId, item => item.Quantity);
        if (itemQuantities.Count == 0)
        {
            return [];
        }

        var products = await (
            from variant in context.ProductVariants.AsNoTracking()
            join product in context.Products.AsNoTracking() on variant.ProductId equals product.ProductId
            join unit in context.UnitsOfMeasure.AsNoTracking() on product.UnitOfMeasureId equals unit.UnitOfMeasureId
            where itemQuantities.Keys.Contains(variant.ProductVariantId) && variant.IsActive && product.IsActive && unit.IsActive
            select new
            {
                variant.ProductVariantId,
                ProductName = product.Name,
                VariantName = variant.Name,
                UnitPrice = variant.SellingPrice,
                unit.Code
            }
        ).ToListAsync(cancellationToken);

        return products
            .OrderBy(product => product.ProductName)
            .Select(product => new CartItemSnapshot(
                product.ProductVariantId,
                product.ProductName,
                product.VariantName,
                itemQuantities[product.ProductVariantId],
                product.UnitPrice,
                product.Code == "KG"))
            .ToArray();
    }

    public Task AddAsync(ShoppingCart cart, CancellationToken cancellationToken) => context.ShoppingCarts.AddAsync(cart, cancellationToken).AsTask();

    public Task AddItemAsync(ShoppingCartItem item, CancellationToken cancellationToken) => context.ShoppingCartItems.AddAsync(item, cancellationToken).AsTask();

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            foreach (var entry in ex.Entries)
            {
                if (entry.Entity is ShoppingCart or ShoppingCartItem)
                {
                    var databaseValues = await entry.GetDatabaseValuesAsync(cancellationToken);
                    if (databaseValues == null)
                    {
                        entry.State = EntityState.Detached;
                    }
                    else
                    {
                        entry.OriginalValues.SetValues(databaseValues);
                    }
                }
                else
                {
                    throw;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
