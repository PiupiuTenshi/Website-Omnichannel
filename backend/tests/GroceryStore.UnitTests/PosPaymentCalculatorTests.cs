using GroceryStore.Domain.Enums;
using GroceryStore.Domain.Rules;

namespace GroceryStore.UnitTests;

public sealed class PosPaymentCalculatorTests
{
    [Theory]
    [InlineData(1, 1000)]
    [InlineData(999, 1000)]
    [InlineData(1000, 1000)]
    [InlineData(1001, 2000)]
    public void Calculate_CashRoundsUpToThousand(decimal exactAmount, decimal expectedDue)
    {
        var result = PosPaymentCalculator.Calculate(exactAmount, PosPaymentMethod.Cash);
        Assert.Equal(expectedDue, result.AmountDue);
    }

    [Fact]
    public void Calculate_BankTransferKeepsExactAmount()
    {
        var result = PosPaymentCalculator.Calculate(1001m, PosPaymentMethod.BankTransfer);
        Assert.Equal(1001m, result.AmountDue);
    }
}
