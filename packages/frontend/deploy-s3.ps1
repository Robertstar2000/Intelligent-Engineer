# Deploy Frontend to S3 and CloudFront
param(
    [string]$BucketName = "intelligent-engineering-platform-frontend",
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend S3 + CloudFront Deployment" -ForegroundColor Cyan
Write-Host "Bucket: $BucketName | Region: $Region" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Build frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build complete" -ForegroundColor Green

# Create S3 bucket if it doesn't exist
Write-Host "`nCreating S3 bucket..." -ForegroundColor Yellow
aws s3 mb s3://$BucketName --region $Region 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Bucket created" -ForegroundColor Green
} else {
    Write-Host "Bucket already exists or error occurred" -ForegroundColor Yellow
}

# Configure bucket for static website hosting
Write-Host "`nConfiguring static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BucketName --index-document index.html --error-document index.html

# Set bucket policy for public read access
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$policy | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json
Remove-Item bucket-policy.json
Write-Host "Bucket policy configured" -ForegroundColor Green

# Upload files to S3
Write-Host "`nUploading files to S3..." -ForegroundColor Yellow
# Upload JS/CSS with long cache but unique filenames (Vite handles this)
aws s3 sync dist/ s3://$BucketName --delete --cache-control "max-age=31536000,public,immutable" --exclude "index.html"
# Upload index.html with no cache to always get latest version
aws s3 cp dist/index.html s3://$BucketName/index.html --cache-control "max-age=0,no-cache,no-store,must-revalidate" --metadata-directive REPLACE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "Upload complete" -ForegroundColor Green

# Get website URL
$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nWebsite URL: $websiteUrl" -ForegroundColor Cyan
Write-Host "`nNote: For HTTPS and custom domain, configure CloudFront distribution" -ForegroundColor Yellow
