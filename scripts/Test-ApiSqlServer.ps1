param(
    [string]$ConnectionString = $env:ConnectionStrings__DefaultConnection,
    [ValidateRange(1024, 65535)][int]$Port = 5262
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    throw 'Set ConnectionStrings__DefaultConnection to the local OmnichannelApiSmoke database.'
}

$connection = [System.Data.Common.DbConnectionStringBuilder]::new()
$connection.set_ConnectionString($ConnectionString)
$serverKeys = @('Server', 'Data Source', 'Address', 'Addr', 'Network Address' | Where-Object { $connection.ContainsKey($_) })
$databaseKeys = @('Database', 'Initial Catalog' | Where-Object { $connection.ContainsKey($_) })
if ($serverKeys.Count -ne 1 -or $databaseKeys.Count -ne 1 -or
    $connection[$serverKeys[0]] -notmatch '^(tcp:)?(127\.0\.0\.1|localhost|\.)(,\d+|\\[\w-]+)?$' -or
    $connection[$databaseKeys[0]] -ne 'OmnichannelApiSmoke' -or
    $connection.ContainsKey('Failover Partner') -or $connection.ContainsKey('AttachDbFilename')) {
    throw 'This smoke test seeds data and only accepts a loopback SQL Server and the OmnichannelApiSmoke database.'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try {
    $listener.Start()
} finally {
    $listener.Stop()
}

function Invoke-Dotnet {
    & dotnet @args
    if ($LASTEXITCODE -ne 0) { throw "dotnet failed with exit code $LASTEXITCODE." }
}

$apiProject = 'backend/src/GroceryStore.Api'
$persistenceProject = 'backend/src/GroceryStore.Persistence'
$apiAssembly = "$apiProject/bin/Release/net10.0/GroceryStore.Api.dll"
$baseUrl = "http://127.0.0.1:$Port"
$settings = @{
    ConnectionStrings__DefaultConnection = $ConnectionString
    ASPNETCORE_ENVIRONMENT = 'Development'
    ASPNETCORE_URLS = $baseUrl
    DOTNET_ENVIRONMENT = 'Development'
    Jwt__Key = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
    DemoIdentity__Enabled = 'false'
    StartupTasks__SeedProductSuppliers = 'false'
    Smtp__Provider = 'Mock'
    'Logging__LogLevel__Microsoft.EntityFrameworkCore' = 'Warning'
}
$previous = @{}
$api = $null
$logs = Join-Path ([System.IO.Path]::GetTempPath()) ('omnichannel-api-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $logs

Push-Location (Join-Path $PSScriptRoot '..')
try {
    foreach ($key in $settings.Keys) {
        $previous[$key] = [Environment]::GetEnvironmentVariable($key)
        [Environment]::SetEnvironmentVariable($key, $settings[$key])
    }

    Invoke-Dotnet tool restore
    Invoke-Dotnet build $apiProject --configuration Release
    Invoke-Dotnet tool run dotnet-ef database update --configuration Release --no-build --project $persistenceProject --startup-project $apiProject
    Invoke-Dotnet $apiAssembly --seed-demo-catalog

    $startOptions = @{
        FilePath = (Get-Command dotnet).Source
        ArgumentList = @($apiAssembly)
        PassThru = $true
        RedirectStandardOutput = (Join-Path $logs 'stdout.log')
        RedirectStandardError = (Join-Path $logs 'stderr.log')
    }
    if ($env:OS -eq 'Windows_NT') { $startOptions.WindowStyle = 'Hidden' }
    $api = Start-Process @startOptions

    $ready = $null
    for ($attempt = 0; $attempt -lt 30 -and !$api.HasExited; $attempt++) {
        try {
            $ready = Invoke-WebRequest "$baseUrl/health/ready" -UseBasicParsing -TimeoutSec 5
            if ($ready.StatusCode -eq 200) { break }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    if ($api.HasExited -or $null -eq $ready -or $ready.StatusCode -ne 200 -or $ready.Content -ne 'Healthy') {
        throw "API readiness did not return HTTP 200 Healthy. API logs: $logs"
    }

    $categories = Invoke-WebRequest "$baseUrl/api/categories" -UseBasicParsing -TimeoutSec 10
    $catalog = Invoke-WebRequest "$baseUrl/api/products?page=1&pageSize=3" -UseBasicParsing -TimeoutSec 10
    $detail = Invoke-WebRequest "$baseUrl/api/products/by-slug/banh-oreo-vani-133g" -UseBasicParsing -TimeoutSec 10
    $categoryRows = ConvertFrom-Json -InputObject $categories.Content
    $catalogPage = $catalog.Content | ConvertFrom-Json
    $product = $detail.Content | ConvertFrom-Json
    if ('banh-keo' -notin $categoryRows.slug -or $catalogPage.totalCount -lt 3 -or
        $catalogPage.items.Count -ne 3 -or $product.slug -ne 'banh-oreo-vani-133g') {
        throw 'The API did not return the expected seeded SQL Server data.'
    }

    Write-Output "PASS GET /health/ready HTTP $($ready.StatusCode) $($ready.Content)"
    Write-Output "PASS GET /api/categories HTTP $($categories.StatusCode) categories=$($categoryRows.Count)"
    Write-Output "PASS GET /api/products?page=1&pageSize=3 HTTP $($catalog.StatusCode) totalCount=$($catalogPage.totalCount) pageItems=$($catalogPage.items.Count)"
    Write-Output "PASS GET /api/products/by-slug/banh-oreo-vani-133g HTTP $($detail.StatusCode) slug=$($product.slug)"
} finally {
    if ($null -ne $api -and !$api.HasExited) { Stop-Process -Id $api.Id }
    foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key]) }
    Pop-Location
}
