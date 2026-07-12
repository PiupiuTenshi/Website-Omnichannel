using GroceryStore.Domain.Rules;

namespace GroceryStore.UnitTests;

public sealed class AccountVerificationPolicyTests
{
    [Fact]
    public void IsVerified_ReturnsFalseWhenNeitherContactIsConfirmed()
    {
        Assert.False(AccountVerificationPolicy.IsVerified(false, false));
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public void IsVerified_ReturnsTrueWhenAtLeastOneContactIsConfirmed(bool emailConfirmed, bool phoneConfirmed)
    {
        Assert.True(AccountVerificationPolicy.IsVerified(emailConfirmed, phoneConfirmed));
    }
}
