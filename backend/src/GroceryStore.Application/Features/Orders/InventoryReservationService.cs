using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Domain.Rules;

namespace GroceryStore.Application.Features.Orders;

public sealed record CartReservationResponse(DateTime ExpiresAtUtc, decimal ReservedItemCount);

public sealed class InventoryReservationService(
    IShoppingCartRepository shoppingCartRepository,
    IInventoryReservationRepository inventoryReservationRepository)
{
    private static readonly TimeSpan RESERVATION_DURATION = TimeSpan.FromMinutes(10);

    public async Task<CartReservationResponse> ReserveCartAsync(string sessionId, string? userId, CancellationToken cancellationToken, bool useTransaction = true)
    {
        var cart = userId is null
            ? await shoppingCartRepository.GetGuestCartAsync(sessionId, cancellationToken)
            : await shoppingCartRepository.GetUserCartAsync(userId, cancellationToken) ?? await shoppingCartRepository.GetGuestCartAsync(sessionId, cancellationToken);
        if (cart is null)
        {
            throw new KeyNotFoundException("Cart was not found.");
        }
        if (cart.Items.Count == 0)
        {
            throw new BusinessRuleViolationException("Cart cannot be empty.");
        }

        var utcNow = DateTime.UtcNow;
        var expiresAtUtc = utcNow.Add(RESERVATION_DURATION);
        Func<Task> reserveAction = async () =>
        {
            var activeReservations = await inventoryReservationRepository.GetActiveReservationsAsync(sessionId, cancellationToken);
            foreach (var reservation in activeReservations)
            {
                await ReleaseAsync(reservation, utcNow, cancellationToken);
            }

            foreach (var item in cart.Items)
            {
                var product = await shoppingCartRepository.GetActiveProductAsync(item.ProductVariantId, cancellationToken)
                    ?? throw new BusinessRuleViolationException("A cart item is no longer available.");
                ValidateQuantity(item.Quantity, product.IsWeighed);
                var batches = await inventoryReservationRepository.GetActiveBatchesAsync(item.ProductVariantId, cancellationToken);
                var allocations = FefoAllocationService.Allocate(batches, item.Quantity, utcNow);
                foreach (var allocation in allocations)
                {
                    var reservation = new InventoryReservation(
                        allocation.InventoryBatchId,
                        item.ProductVariantId,
                        sessionId,
                        allocation.Quantity,
                        expiresAtUtc,
                        utcNow);
                    await inventoryReservationRepository.AddReservationAsync(reservation, cancellationToken);
                    await inventoryReservationRepository.AddTransactionAsync(new InventoryTransaction(
                        allocation.InventoryBatchId,
                        item.ProductVariantId,
                        InventoryTransactionType.ReservationHold,
                        -allocation.Quantity,
                        "Online checkout inventory reservation",
                        utcNow), cancellationToken);
                }
            }

            await inventoryReservationRepository.SaveChangesAsync(cancellationToken);
        };
        if (useTransaction)
        {
            await inventoryReservationRepository.ExecuteInTransactionAsync(reserveAction, cancellationToken);
        }
        else
        {
            await reserveAction();
        }

        return new CartReservationResponse(expiresAtUtc, cart.Items.Sum(item => item.Quantity));
    }

    public async Task<int> ReleaseExpiredReservationsAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var expiredReservations = await inventoryReservationRepository.GetExpiredReservationsAsync(utcNow, cancellationToken);
        if (expiredReservations.Count == 0)
        {
            return 0;
        }

        await inventoryReservationRepository.ExecuteInTransactionAsync(async () =>
        {
            foreach (var reservation in expiredReservations)
            {
                await ReleaseAsync(reservation, utcNow, cancellationToken);
            }

            await inventoryReservationRepository.SaveChangesAsync(cancellationToken);
        }, cancellationToken);
        return expiredReservations.Count;
    }

    private async Task ReleaseAsync(InventoryReservation reservation, DateTime utcNow, CancellationToken cancellationToken)
    {
        var batch = await inventoryReservationRepository.GetBatchAsync(reservation.InventoryBatchId, cancellationToken)
            ?? throw new InvalidOperationException("Reserved inventory batch was not found.");
        batch.Adjust(reservation.Quantity);
        reservation.Release(utcNow);
        await inventoryReservationRepository.AddTransactionAsync(new InventoryTransaction(
            reservation.InventoryBatchId,
            reservation.ProductVariantId,
            InventoryTransactionType.ReservationRelease,
            reservation.Quantity,
            "Expired online checkout reservation released",
            utcNow), cancellationToken);
    }

    private static void ValidateQuantity(decimal quantity, bool isWeighed)
    {
        if (quantity <= 0 ||
            (isWeighed && decimal.Round(quantity, 1) != quantity) ||
            (!isWeighed && quantity != decimal.Truncate(quantity)))
        {
            throw new BusinessRuleViolationException("Quantity does not match the product unit.");
        }
    }
}
