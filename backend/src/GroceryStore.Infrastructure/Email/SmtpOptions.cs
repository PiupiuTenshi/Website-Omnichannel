namespace GroceryStore.Infrastructure.Email;

public sealed class SmtpOptions
{
    public const string SECTION_NAME = "Smtp";

    public string Provider { get; init; } = "Mock";

    public string Host { get; init; } = string.Empty;

    public int Port { get; init; } = 587;

    public string UserName { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string FromEmail { get; init; } = string.Empty;

    public string FromName { get; init; } = string.Empty;
}
