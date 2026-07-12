using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.ValueObjects;
using StoreSettingsEntity = GroceryStore.Domain.Entities.StoreSettings;

namespace GroceryStore.Application.Features.StoreSettings;

public sealed class StoreSettingsService
{
    private readonly IStoreSettingsRepository storeSettingsRepository;

    public StoreSettingsService(IStoreSettingsRepository storeSettingsRepository)
    {
        this.storeSettingsRepository = storeSettingsRepository;
    }

    public async Task<StoreSettingsResponse> GetAsync(CancellationToken cancellationToken)
    {
        var settings = await storeSettingsRepository.GetAsync(cancellationToken)
            ?? throw new BusinessRuleViolationException("Store settings have not been initialized.");

        return ToResponse(settings);
    }

    public async Task<StoreSettingsResponse> UpdateAsync(UpdateStoreSettingsCommand command, CancellationToken cancellationToken)
    {
        Validate(command);

        var settings = await storeSettingsRepository.GetAsync(cancellationToken);
        if (settings is null)
        {
            settings = new StoreSettingsEntity(command.Name.Trim(), command.Email?.Trim(), command.Address.Trim(), command.IsOnlineOrderingEnabled);
            await storeSettingsRepository.AddAsync(settings, cancellationToken);
        }
        else if (string.IsNullOrWhiteSpace(command.RowVersion) || !settings.RowVersion.SequenceEqual(Convert.FromBase64String(command.RowVersion)))
        {
            throw new BusinessRuleViolationException("Store settings were updated by another user. Reload and try again.");
        }

        settings.Update(
            command.Name.Trim(),
            command.Email?.Trim(),
            command.Address.Trim(),
            command.IsOnlineOrderingEnabled,
            command.ContactNumbers.Select(number => PhoneNumber.TryNormalize(number, out var normalizedNumber) ? normalizedNumber! : string.Empty));

        await storeSettingsRepository.SaveChangesAsync(cancellationToken);
        return ToResponse(settings);
    }

    private static StoreSettingsResponse ToResponse(StoreSettingsEntity settings)
    {
        return new StoreSettingsResponse(
            settings.Name,
            settings.Email,
            settings.Address,
            settings.IsOnlineOrderingEnabled,
            settings.ContactNumbers.Select(number => number.PhoneNumber).ToArray(),
            Convert.ToBase64String(settings.RowVersion));
    }

    private static void Validate(UpdateStoreSettingsCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name) || string.IsNullOrWhiteSpace(command.Address))
        {
            throw new BusinessRuleViolationException("Store name and address are required.");
        }

        if (!EmailAddress.TryNormalize(command.Email, out _))
        {
            throw new BusinessRuleViolationException("Store email is invalid.");
        }

        if (command.ContactNumbers.Count == 0)
        {
            throw new BusinessRuleViolationException("At least one hotline is required.");
        }

        if (command.ContactNumbers.Any(number => !PhoneNumber.TryNormalize(number, out _)))
        {
            throw new BusinessRuleViolationException("A hotline is invalid.");
        }
    }
}
