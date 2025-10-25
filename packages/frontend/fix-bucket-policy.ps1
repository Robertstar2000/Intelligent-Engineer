# Fix S3 Bucket Policy
$BucketName = "intelligent-engineering-platform-frontend"

Write-Host "Fixing S3 bucket policy..." -ForegroundColor Yellow

# Create proper JSON policy file
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$BucketName/*"
        }
    )
} | ConvertTo-Json -Depth 10

$policy | Out-File -FilePath policy.json -Encoding utf8 -NoNewline

# Apply policy
aws s3api put-bucket-policy --bucket $BucketName --policy file://policy.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "Bucket policy applied successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to apply bucket policy" -ForegroundColor Red
}

# Clean up
Remove-Item policy.json -ErrorAction SilentlyContinue

# Disable block public access
Write-Host "Disabling block public access..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

Write-Host "`nBucket is now publicly accessible!" -ForegroundColor Green
Write-Host "URL: http://$BucketName.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan
