# Clean deployment script
Write-Host "Cleaning and preparing for deployment..." -ForegroundColor Cyan

# Ensure all dependencies are installed for build
Write-Host "`nInstalling all dependencies for build..." -ForegroundColor Yellow
npm install

# Build TypeScript
Write-Host "`nBuilding Lambda functions..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Remove node_modules
Write-Host "`nRemoving node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Install only production dependencies
Write-Host "`nInstalling production dependencies only..." -ForegroundColor Yellow
npm install --omit=dev

# Deploy
Write-Host "`nDeploying to AWS..." -ForegroundColor Yellow
npx serverless deploy --stage dev --region us-east-1 --force

Write-Host "`nDeployment complete!" -ForegroundColor Green
