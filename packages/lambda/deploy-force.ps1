# Force deployment with existing build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Deployment to AWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if dist exists
if (-not (Test-Path "dist")) {
    Write-Host "Error: dist folder not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Ensure production dependencies are installed
Write-Host "`nInstalling production dependencies..." -ForegroundColor Yellow
npm install --omit=dev

# Force deploy
Write-Host "`nForce deploying to AWS..." -ForegroundColor Yellow
npx serverless deploy --stage dev --region us-east-1 --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDeployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Get deployment info
npx serverless info --stage dev --region us-east-1
