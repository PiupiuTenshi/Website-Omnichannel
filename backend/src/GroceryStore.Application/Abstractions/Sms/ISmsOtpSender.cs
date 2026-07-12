namespace GroceryStore.Application.Abstractions.Sms;

public interface ISmsOtpSender
{
    Task SendAsync(string phoneNumber, string code, CancellationToken cancellationToken);
}
