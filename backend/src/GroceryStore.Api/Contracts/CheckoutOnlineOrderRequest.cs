using GroceryStore.Domain.Enums;
namespace GroceryStore.Api.Contracts;

public sealed record CheckoutOnlineOrderRequest(string RecipientName, string RecipientPhoneNumber, string DeliveryAddress, OnlinePaymentMethod PaymentMethod);
