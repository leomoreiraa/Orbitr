# Run local backend with environment variables from .env (PowerShell)
# Copy .env.example -> .env and fill the values before running this script.

$envFile = Join-Path $PSScriptRoot '.env'
if (-Not (Test-Path $envFile)) {
    Write-Host ".env not found. Copy .env.example to .env and edit before running." -ForegroundColor Yellow
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -and -not $_.StartsWith('#')) {
        $parts = $_ -split '=', 2
        if ($parts.Length -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            # Remove surrounding single or double quotes if present
            if ($value.Length -ge 2) {
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
            }
            if ($value -ne '') {
                Write-Host "Setting env var $name"
                Set-Item -Path Env:$name -Value $value
            }
        }
    }
}

Write-Host "Environment loaded. Starting Spring Boot..."
mvn spring-boot:run
