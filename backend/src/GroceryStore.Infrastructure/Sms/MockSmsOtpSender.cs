using GroceryStore.Application.Abstractions.Sms;
using Microsoft.Extensions.Logging;

namespace GroceryStore.Infrastructure.Sms;

public sealed class MockSmsOtpSender : ISmsOtpSender
{
    private readonly ILogger<MockSmsOtpSender> logger;

    public MockSmsOtpSender(ILogger<MockSmsOtpSender> logger)
    {
        this.logger = logger;
    }

    public Task SendAsync(string phoneNumber, string code, CancellationToken cancellationToken)
    {
        logger.LogInformation("Mock SMS OTP requested for {PhoneNumber}. Code: {Code}", phoneNumber, code);
        return Task.CompletedTask;
    }
}
