namespace GroceryStore.Application.Abstractions.Email;

public interface IEmailSender
{
    Task SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken);
}
