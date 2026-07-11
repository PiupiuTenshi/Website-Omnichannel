using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        return services;
    }
}
