using Microsoft.Extensions.Configuration;

namespace GroceryStore.Api.Configuration;

public static class EnvironmentFileConfiguration
{
    private const string LOCAL_ENVIRONMENT_FILE_NAME = ".env.local";
    private const string FALLBACK_ENVIRONMENT_FILE_NAME = ".env";

    public static void AddLocalEnvironmentFile(ConfigurationManager configuration, string contentRootPath)
    {
        var environmentFilePath = FindEnvironmentFile(contentRootPath);
        if (environmentFilePath is null)
        {
            return;
        }

        configuration.AddInMemoryCollection(ReadValues(environmentFilePath));
        configuration.AddEnvironmentVariables();
    }

    private static string? FindEnvironmentFile(string contentRootPath)
    {
        for (DirectoryInfo? directory = new DirectoryInfo(contentRootPath); directory is not null; directory = directory.Parent)
        {
            var localEnvironmentFilePath = Path.Combine(directory.FullName, LOCAL_ENVIRONMENT_FILE_NAME);
            if (File.Exists(localEnvironmentFilePath))
            {
                return localEnvironmentFilePath;
            }

            var fallbackEnvironmentFilePath = Path.Combine(directory.FullName, FALLBACK_ENVIRONMENT_FILE_NAME);
            if (File.Exists(fallbackEnvironmentFilePath))
            {
                return fallbackEnvironmentFilePath;
            }
        }

        return null;
    }

    private static IEnumerable<KeyValuePair<string, string?>> ReadValues(string environmentFilePath)
    {
        foreach (var line in File.ReadLines(environmentFilePath))
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine) || trimmedLine.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = trimmedLine.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = trimmedLine[..separatorIndex].Trim();
            var value = trimmedLine[(separatorIndex + 1)..].Trim();
            if (key.StartsWith("export ", StringComparison.Ordinal))
            {
                key = key["export ".Length..].Trim();
            }

            if (value.Length >= 2 && value[0] == value[^1] && (value[0] == '\"' || value[0] == '\''))
            {
                value = value[1..^1];
            }

            yield return new KeyValuePair<string, string?>(key.Replace("__", ":", StringComparison.Ordinal), value);
        }
    }
}
