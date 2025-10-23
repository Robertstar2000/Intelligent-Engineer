# AWS Deployment Script for Intelligent Engineering Platform
# This script automates the deployment process to AWS

param(
    [Parameter(Mandatory=$false)]
    [string]$Stage = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$BucketName = "intelligent-engineering-platform-frontend"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Deployment Script" -ForegroundColor Cyan
Write-Host "Intelligent Engineering Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "  Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 20.x first." -ForegroundColor Red
    exit 1
}

# Check Serverless Framework
try {
    $slsVersion = serverless --version
    Write-Host "✓ Serverless Framework installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Serverless Framework not found. Installing..." -ForegroundColor Yellow
    npm install -g serverless
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install Lambda dependencies
Write-Host "Installing Lambda dependencies..." -ForegroundColor Yellow
Set-Location packages/lambda
npm install
Set-Location ../..

# Install Frontend dependencies
Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location packages/frontend
npm install
Set-Location ../..

Write-Host "✓ All dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Deploying Lambda Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location packages/lambda

Write-Host "Deploying to AWS Lambda (Stage: $Stage, Region: $Region)..." -ForegroundColor Yellow
serverless deploy --stage $Stage --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Lambda deployment failed" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host "✓ Lambda backend deployed successfully" -ForegroundColor Green

# Get API Gateway URL
$apiUrl = serverless info --stage $Stage --region $Region | Select-String -Pattern "https://.*\.execute-api\.$Region\.amazonaws\.com/$Stage" | ForEach-Object { $_.Matches.Value }

if ($apiUrl) {
    Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Cyan
    
    # Save API URL to file
    $apiUrl | Out-File -FilePath "../../api-url.txt" -Encoding UTF8
} else {
    Write-Host "⚠ Could not extract API Gateway URL" -ForegroundColor Yellow
}

Set-Location ../..
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Building Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location packages/frontend

# Update frontend config with API URL
if ($apiUrl) {
    Write-Host "Updating frontend configuration with API URL..." -ForegroundColor Yellow
    
    $configContent = @"
export const config = {
  apiUrl: '$apiUrl',
};
"@
    
    New-Item -Path "src" -ItemType Directory -Force | Out-Null
    $configContent | Out-File -FilePath "src/config.ts" -Encoding UTF8
}

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Set-Location ../..
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Deploying Frontend to S3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if bucket exists
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating S3 bucket: $BucketName..." -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" --region $Region
    
    # Enable static website hosting
    aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html
    
    Write-Host "✓ S3 bucket created" -ForegroundColor Green
} else {
    Write-Host "S3 bucket already exists: $BucketName" -ForegroundColor Yellow
}

# Upload files to S3
Write-Host "Uploading frontend files to S3..." -ForegroundColor Yellow
aws s3 sync packages/frontend/dist/ "s3://$BucketName" --delete

# Make files public
Write-Host "Setting public read permissions..." -ForegroundColor Yellow
aws s3 sync packages/frontend/dist/ "s3://$BucketName" --acl public-read

Write-Host "✓ Frontend deployed to S3" -ForegroundColor Green

# Get S3 website URL
$s3Url = "http://$BucketName.s3-website-$Region.amazonaws.com"
Write-Host "S3 Website URL: $s3Url" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your application is now deployed:" -ForegroundColor Green
Write-Host "  Backend API: $apiUrl" -ForegroundColor Cyan
Write-Host "  Frontend: $s3Url" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test the API endpoints" -ForegroundColor White
Write-Host "  2. Open the frontend URL in your browser" -ForegroundColor White
Write-Host "  3. Set up CloudFront CDN (optional)" -ForegroundColor White
Write-Host "  4. Configure custom domain (optional)" -ForegroundColor White
Write-Host "  5. Set up monitoring and alerts" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see AWS_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
