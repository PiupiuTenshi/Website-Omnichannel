using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Rules;

public static class PosPaymentCalculator
{
    private const decimal CASH_ROUNDING_INCREMENT = 1000m;

    public static PosPaymentCalculation Calculate(decimal exactAmount, PosPaymentMethod paymentMethod, decimal? cashReceived = null)
    {
        if (exactAmount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(exactAmount), "Order total must be greater than zero.");
        }

        var amountDue = paymentMethod == PosPaymentMethod.Cash
            ? decimal.Ceiling(exactAmount / CASH_ROUNDING_INCREMENT) * CASH_ROUNDING_INCREMENT
            : exactAmount;
        var received = cashReceived ?? amountDue;
        if (paymentMethod == PosPaymentMethod.Cash && received < amountDue)
        {
            throw new InvalidOperationException("Cash received is less than the amount due.");
        }

        return new PosPaymentCalculation(exactAmount, amountDue, paymentMethod == PosPaymentMethod.Cash ? received - amountDue : 0m);
    }
}
