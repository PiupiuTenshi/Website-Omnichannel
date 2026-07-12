using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Exceptions;

namespace GroceryStore.UnitTests;

public sealed class RegistrationValidatorTests
{
    [Fact]
    public void Validate_RejectsMissingEmailAndPhoneNumber()
    {
        var command = new RegisterUserCommand(null, null, "password1");

        Assert.Throws<BusinessRuleViolationException>(() => RegistrationValidator.Validate(command));
    }

    [Fact]
    public void Validate_AcceptsEmailOnlyRegistration()
    {
        var contacts = RegistrationValidator.Validate(new RegisterUserCommand("buyer@example.com", null, "password1"));

        Assert.Equal("BUYER@EXAMPLE.COM", contacts.NormalizedEmail);
        Assert.Null(contacts.NormalizedPhoneNumber);
    }

    [Fact]
    public void Validate_AcceptsPhoneOnlyRegistration()
    {
        var contacts = RegistrationValidator.Validate(new RegisterUserCommand(null, "0898 087 507", "password1"));

        Assert.Null(contacts.NormalizedEmail);
        Assert.Equal("0898087507", contacts.NormalizedPhoneNumber);
    }
}
