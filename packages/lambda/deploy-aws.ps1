# AWS Deployment Script for Intelligent Engineering Platform
param(
    [string]$Stage = "dev",
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Serverless Deployment" -ForegroundColor Cyan
Write-Host "Stage: $Stage | Region: $Region" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables from .env file
Write-Host "`nLoading environment variables..." -ForegroundColor Yellow
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "  Set $key" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  .env file not found!" -ForegroundColor Red
    exit 1
}

# Copy dependencies
Write-Host "`nCopying dependencies..." -ForegroundColor Yellow
.\copy-deps.ps1
Write-Host "Dependencies copied" -ForegroundColor Green

# Build TypeScript
Write-Host "`nBuilding Lambda functions..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build complete" -ForegroundColor Green

# Deploy to AWS
Write-Host "`nDeploying to AWS..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

npx serverless deploy --stage $Stage --region $Region --verbose

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDeployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Get deployment info
Write-Host "`nGetting deployment information..." -ForegroundColor Yellow
npx serverless info --stage $Stage --region $Region

Write-Host "`nDeployment successful! Check the output above for API endpoints." -ForegroundColor Green
