using System.Reflection;
using GroceryStore.Api;
using GroceryStore.Application;
using GroceryStore.Domain;
using GroceryStore.Infrastructure;
using GroceryStore.Persistence;

namespace GroceryStore.ArchitectureTests;

public sealed class ProjectDependencyTests
{
    [Fact]
    public void Domain_DoesNotReferenceAnotherGroceryStoreProject()
    {
        AssertProjectReferences(typeof(DomainAssemblyMarker).Assembly);
    }

    [Fact]
    public void Application_ReferencesOnlyDomain()
    {
        AssertProjectReferences(typeof(ApplicationAssemblyMarker).Assembly, typeof(DomainAssemblyMarker).Assembly);
    }

    [Fact]
    public void Infrastructure_ReferencesOnlyApplicationAndDomain()
    {
        AssertProjectReferences(
            typeof(InfrastructureAssemblyMarker).Assembly,
            typeof(ApplicationAssemblyMarker).Assembly,
            typeof(DomainAssemblyMarker).Assembly);
    }

    [Fact]
    public void Persistence_ReferencesOnlyApplicationAndDomain()
    {
        AssertProjectReferences(
            typeof(PersistenceAssemblyMarker).Assembly,
            typeof(ApplicationAssemblyMarker).Assembly,
            typeof(DomainAssemblyMarker).Assembly);
    }

    [Fact]
    public void Api_ReferencesApplicationInfrastructureAndPersistence()
    {
        AssertProjectReferences(
            typeof(Program).Assembly,
            typeof(ApplicationAssemblyMarker).Assembly,
            typeof(InfrastructureAssemblyMarker).Assembly,
            typeof(PersistenceAssemblyMarker).Assembly);
    }

    private static void AssertProjectReferences(Assembly sourceAssembly, params Assembly[] allowedAssemblies)
    {
        var allowedNames = allowedAssemblies
            .Select(assembly => assembly.GetName().Name)
            .ToHashSet(StringComparer.Ordinal);

        var projectReferences = sourceAssembly
            .GetReferencedAssemblies()
            .Select(assemblyName => assemblyName.Name)
            .Where(name => name is not null && name.StartsWith("GroceryStore.", StringComparison.Ordinal));

        Assert.All(projectReferences, reference => Assert.Contains(reference, allowedNames));
    }
}
