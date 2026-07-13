using GroceryStore.Application.Features.Pos;
using GroceryStore.Domain.Enums;

namespace GroceryStore.Api.Contracts;

public sealed record CheckoutPosOrderRequest(
    List<PosCartItemDto> Items,
    PosPaymentMethod PaymentMethod,
    decimal? CashReceived);
