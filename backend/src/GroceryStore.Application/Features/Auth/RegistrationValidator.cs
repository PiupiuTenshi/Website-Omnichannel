using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.ValueObjects;

namespace GroceryStore.Application.Features.Auth;

public static class RegistrationValidator
{
    private const int MINIMUM_PASSWORD_LENGTH = 8;

    public static RegistrationContacts Validate(RegisterUserCommand command)
    {
        if (!EmailAddress.TryNormalize(command.Email, out var normalizedEmail))
        {
            throw new BusinessRuleViolationException("Email is invalid.");
        }

        if (!PhoneNumber.TryNormalize(command.PhoneNumber, out var normalizedPhoneNumber))
        {
            throw new BusinessRuleViolationException("Phone number is invalid.");
        }

        if (normalizedEmail is null && normalizedPhoneNumber is null)
        {
            throw new BusinessRuleViolationException("Provide an email address or phone number.");
        }

        if (string.IsNullOrWhiteSpace(command.Password) || command.Password.Length < MINIMUM_PASSWORD_LENGTH)
        {
            throw new BusinessRuleViolationException("Password must contain at least eight characters.");
        }

        return new RegistrationContacts(normalizedEmail, normalizedPhoneNumber);
    }
}
