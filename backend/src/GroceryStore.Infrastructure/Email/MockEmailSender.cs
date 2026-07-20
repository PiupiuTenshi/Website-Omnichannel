using GroceryStore.Application.Abstractions.Email;
using Microsoft.Extensions.Logging;

namespace GroceryStore.Infrastructure.Email;

public sealed class MockEmailSender : IEmailSender
{
    private readonly ILogger<MockEmailSender> logger;

    public MockEmailSender(ILogger<MockEmailSender> logger)
    {
        this.logger = logger;
    }

    public Task SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken)
    {
        logger.LogInformation("Mock email queued for {RecipientEmail} with subject {Subject}\nBody:\n{Body}", recipientEmail, subject, body);
        return Task.CompletedTask;
    }
}
