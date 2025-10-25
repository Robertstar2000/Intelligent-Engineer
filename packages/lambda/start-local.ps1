# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "Set $key" -ForegroundColor Green
    }
}

Write-Host "`nStarting Serverless Offline..." -ForegroundColor Cyan
npx serverless offline
