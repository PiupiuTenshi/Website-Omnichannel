using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.UnitTests;

public sealed class OnlineOrderTests
{
    [Fact]
    public void QuoteAcceptance_UpdatesOrderTotalAndStatus()
    {
        var order = CreateOrder(OnlineOrderStatus.AwaitingShippingQuote, null);

        order.SetShippingQuote(25000m, "Giao khu vực xa", DateTime.UtcNow);
        order.AcceptShippingQuote(DateTime.UtcNow);

        Assert.Equal(125000m, order.Total);
        Assert.Equal(OnlineOrderStatus.QuoteAccepted, order.Status);
    }

    [Fact]
    public void Cod_CannotBeMarkedPaidBeforeDelivery()
    {
        var order = CreateOrder(OnlineOrderStatus.Pending, 10000m);

        Assert.Throws<InvalidOperationException>(() => order.ConfirmCodPayment(DateTime.UtcNow));
    }

    [Fact]
    public void Buyer_CanOnlyCancelPendingOrder()
    {
        var order = CreateOrder(OnlineOrderStatus.Delivering, 10000m);

        Assert.Throws<InvalidOperationException>(() => order.Cancel(DateTime.UtcNow));
    }

    [Fact]
    public void Manager_CanProgressOrderFromProcessingToDelivery()
    {
        var order = CreateOrder(OnlineOrderStatus.Pending, 10000m);

        order.MarkPreparing(DateTime.UtcNow);
        order.MarkDelivering(DateTime.UtcNow);
        order.MarkDelivered(DateTime.UtcNow);

        Assert.Equal(OnlineOrderStatus.Delivered, order.Status);
    }

    private static OnlineOrder CreateOrder(OnlineOrderStatus status, decimal? shippingFee) => new(
        "WEB-TEST", "guest-session", null, "Buyer", "0900000000", "Da Lat", 100000m, shippingFee, 2m,
        OnlinePaymentMethod.Cod, status, DateTime.UtcNow);
}
