namespace GroceryStore.Domain.Enums;

public enum OnlineOrderStatus
{
    Pending = 1,
    AwaitingShippingQuote = 2,
    QuoteAccepted = 3,
    Confirmed = 4,
    Preparing = 5,
    Delivering = 6,
    Delivered = 7,
    DeliveryFailed = 8,
    Returned = 9,
    Cancelled = 10,
    Expired = 11
}
