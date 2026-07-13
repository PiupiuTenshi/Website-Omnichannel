namespace GroceryStore.Domain.Rules;

public sealed record PosPaymentCalculation(decimal ExactAmount, decimal AmountDue, decimal ChangeAmount);
