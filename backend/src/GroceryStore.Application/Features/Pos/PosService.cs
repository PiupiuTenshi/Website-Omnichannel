using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Domain.Rules;

namespace GroceryStore.Application.Features.Pos;

public sealed record CheckoutPosOrderCommand(
    List<PosCartItemDto> Items,
    PosPaymentMethod PaymentMethod,
    decimal? CashReceived,
    string ProcessedByUserId);

public sealed record PosCartItemDto(
    Guid ProductVariantId,
    decimal Quantity,
    decimal UnitPrice);

public sealed record CheckoutPosOrderResponse(
    Guid OrderId,
    string OrderCode,
    decimal ExactAmount,
    decimal AmountDue,
    decimal ChangeAmount);

public sealed class PosService(IPosRepository posRepository, IInventoryRepository inventoryRepository)
{
    public async Task<IReadOnlyList<PosProductDto>> SearchProductsAsync(string query, CancellationToken cancellationToken)
    {
        return await posRepository.SearchProductsAsync(query, cancellationToken);
    }

    public async Task<CheckoutPosOrderResponse> CheckoutAsync(CheckoutPosOrderCommand command, CancellationToken cancellationToken)
    {
        if (command.Items == null || command.Items.Count == 0)
        {
            throw new InvalidOperationException("Cart cannot be empty.");
        }

        var checkoutItems = new List<(Guid ProductVariantId, decimal Quantity, decimal UnitPrice)>();
        foreach (var item in command.Items)
        {
            var product = await posRepository.GetCheckoutProductAsync(item.ProductVariantId, cancellationToken)
                ?? throw new KeyNotFoundException("Active product variant was not found.");
            if (item.Quantity <= 0 || (product.IsWeighed && decimal.Round(item.Quantity, 1) != item.Quantity) || (!product.IsWeighed && item.Quantity != decimal.Truncate(item.Quantity)))
            {
                throw new InvalidOperationException("Quantity does not match the product unit.");
            }

            checkoutItems.Add((item.ProductVariantId, item.Quantity, product.UnitPrice));
        }

        var exactAmount = checkoutItems.Sum(item => item.Quantity * item.UnitPrice);
        var paymentCalc = PosPaymentCalculator.Calculate(exactAmount, command.PaymentMethod, command.CashReceived);

        var orderCode = $"POS-{DateTime.UtcNow:yyMMddHHmmss}-{Random.Shared.Next(100, 999)}";
        var order = new Order(
            orderCode,
            paymentCalc.ExactAmount,
            paymentCalc.AmountDue,
            command.PaymentMethod == PosPaymentMethod.Cash ? command.CashReceived ?? paymentCalc.AmountDue : null,
            paymentCalc.ChangeAmount,
            command.PaymentMethod,
            command.ProcessedByUserId,
            OrderStatus.Completed,
            DateTime.UtcNow
        );

        await posRepository.ExecuteInTransactionAsync(async () =>
        {
            foreach (var item in checkoutItems)
            {
                order.AddItem(item.ProductVariantId, item.Quantity, item.UnitPrice);

                // FEFO batch allocation
                var batches = await posRepository.GetActiveBatchesAsync(item.ProductVariantId, cancellationToken);
                var allocations = FefoAllocationService.Allocate(batches, item.Quantity, DateTime.UtcNow);

                foreach (var allocation in allocations)
                {
                    var transaction = new InventoryTransaction(
                        allocation.InventoryBatchId,
                        item.ProductVariantId,
                        InventoryTransactionType.Allocation,
                        -allocation.Quantity,
                        $"POS checkout for order {orderCode}",
                        DateTime.UtcNow
                    );
                    await inventoryRepository.AddTransactionAsync(transaction, cancellationToken);
                }
            }

            await posRepository.AddOrderAsync(order, cancellationToken);
            await posRepository.SaveChangesAsync(cancellationToken);
        }, cancellationToken);

        return new CheckoutPosOrderResponse(
            order.OrderId,
            order.OrderCode,
            order.ExactAmount,
            order.AmountDue,
            order.ChangeAmount
        );
    }
}
