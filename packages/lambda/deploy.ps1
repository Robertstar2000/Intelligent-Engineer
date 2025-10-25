# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "Set $key" -ForegroundColor Green
    }
}

Write-Host "`nDeploying to AWS..." -ForegroundColor Cyan
npx serverless@3.38.0 deploy --stage dev --region us-east-1 --verbose
