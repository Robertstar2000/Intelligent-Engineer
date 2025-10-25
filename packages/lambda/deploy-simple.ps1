# Simple AWS Deployment Script
param(
    [string]$Stage = "dev",
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Lambda Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$StackName = "intelligent-engineering-platform-$Stage"

# Step 1: Build
Write-Host "`n[1/5] Building..." -ForegroundColor Cyan
npm run build
Write-Host "✓ Build complete" -ForegroundColor Green

# Step 2: Create DynamoDB Tables
Write-Host "`n[2/5] Creating DynamoDB Tables..." -ForegroundColor Cyan

$tableNames = @(
    "$StackName-users",
    "$StackName-projects", 
    "$StackName-templates",
    "$StackName-ai-cache"
)

foreach ($tableName in $tableNames) {
    Write-Host "Checking table: $tableName..." -ForegroundColor Yellow
    aws dynamodb describe-table --table-name $tableName --region $Region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Creating table..." -ForegroundColor Yellow
        
        if ($tableName -like "*users") {
            aws dynamodb create-table --table-name $tableName --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --global-secondary-indexes "IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST --region $Region
        }
        elseif ($tableName -like "*projects") {
            aws dynamodb create-table --table-name $tableName --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S AttributeName=createdAt,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --global-secondary-indexes "IndexName=UserIdIndex,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL}" --billing-mode PAY_PER_REQUEST --region $Region
        }
        else {
            aws dynamodb create-table --table-name $tableName --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $Region
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Created" -ForegroundColor Green
        }
    } else {
        Write-Host "  Already exists" -ForegroundColor Gray
    }
}

# Step 3: Create IAM Role
Write-Host "`n[3/5] Creating IAM Role..." -ForegroundColor Cyan
$roleName = "$StackName-lambda-role"

aws iam get-role --role-name $roleName 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating role..." -ForegroundColor Yellow
    
    $trust = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    $trust | Out-File -FilePath "trust.json" -Encoding UTF8 -NoNewline
    
    aws iam create-role --role-name $roleName --assume-role-policy-document file://trust.json
    aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
    
    Remove-Item "trust.json"
    Write-Host "✓ Role created" -ForegroundColor Green
    Write-Host "Waiting for IAM propagation..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} else {
    Write-Host "Role already exists" -ForegroundColor Gray
}

$roleArn = aws iam get-role --role-name $roleName --query 'Role.Arn' --output text
Write-Host "Role ARN: $roleArn" -ForegroundColor Cyan

# Step 4: Package
Write-Host "`n[4/5] Packaging..." -ForegroundColor Cyan
if (Test-Path "lambda-package.zip") { Remove-Item "lambda-package.zip" }
Compress-Archive -Path dist\*,node_modules\* -DestinationPath lambda-package.zip -Force
Write-Host "✓ Package created" -ForegroundColor Green

# Step 5: Deploy Lambda Functions
Write-Host "`n[5/5] Deploying Lambda Functions..." -ForegroundColor Cyan

$envVars = "Variables={STAGE=$Stage,DYNAMODB_TABLE_PREFIX=$StackName,JWT_SECRET=$env:JWT_SECRET,BEDROCK_MODEL_ID=$env:BEDROCK_MODEL_ID,GEMINI_API_KEY=$env:GEMINI_API_KEY,SES_FROM_EMAIL=$env:SES_FROM_EMAIL,FRONTEND_URL=$env:FRONTEND_URL}"

$functions = @(
    @{Name="auth-login"; Handler="handlers/auth.login"},
    @{Name="auth-register"; Handler="handlers/auth.register"},
    @{Name="projects-create"; Handler="handlers/projects.create"},
    @{Name="projects-list"; Handler="handlers/projects.list"},
    @{Name="projects-get"; Handler="handlers/projects.get"}
)

foreach ($func in $functions) {
    $functionName = "$StackName-$($func.Name)"
    Write-Host "Deploying $functionName..." -ForegroundColor Yellow
    
    aws lambda get-function --function-name $functionName --region $Region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        aws lambda update-function-code --function-name $functionName --zip-file fileb://lambda-package.zip --region $Region | Out-Null
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        aws lambda create-function --function-name $functionName --runtime nodejs20.x --role $roleArn --handler $($func.Handler) --zip-file fileb://lambda-package.zip --timeout 30 --memory-size 512 --environment $envVars --region $Region | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Created" -ForegroundColor Green
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nLambda functions deployed successfully!" -ForegroundColor Green
Write-Host "Next: Create API Gateway in AWS Console to expose these functions" -ForegroundColor Yellow
