using System.Net;
using System.Net.Mail;
using GroceryStore.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace GroceryStore.Infrastructure.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions options;

    public SmtpEmailSender(IOptions<SmtpOptions> options)
    {
        this.options = options.Value;
    }

    public async Task SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.Host) || string.IsNullOrWhiteSpace(options.FromEmail))
        {
            throw new InvalidOperationException("SMTP host and sender email must be configured.");
        }

        using var message = new MailMessage(new MailAddress(options.FromEmail, options.FromName), new MailAddress(recipientEmail))
        {
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        using var smtpClient = new SmtpClient(options.Host, options.Port)
        {
            EnableSsl = true,
            Credentials = string.IsNullOrWhiteSpace(options.UserName)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(options.UserName, options.Password)
        };

        await smtpClient.SendMailAsync(message, cancellationToken);
    }
}
