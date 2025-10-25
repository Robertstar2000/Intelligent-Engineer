# Manual AWS Deployment Script
# Deploys Lambda functions, DynamoDB tables, and API Gateway using AWS CLI

param(
    [string]$Stage = "dev",
    [string]$Region = "us-east-1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual AWS Deployment" -ForegroundColor Cyan
Write-Host "Stage: $Stage | Region: $Region" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables
Write-Host "`nLoading environment variables..." -ForegroundColor Yellow
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$ProjectName = "intelligent-engineering-platform"
$StackName = "$ProjectName-$Stage"

# Step 1: Build TypeScript
Write-Host "`n[1/6] Building TypeScript..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build complete" -ForegroundColor Green

# Step 2: Create DynamoDB Tables
Write-Host "`n[2/6] Creating DynamoDB Tables..." -ForegroundColor Cyan

$tables = @(
    @{
        Name = "$StackName-users"
        KeySchema = @(
            @{AttributeName="id"; KeyType="HASH"}
        )
        AttributeDefinitions = @(
            @{AttributeName="id"; AttributeType="S"},
            @{AttributeName="email"; AttributeType="S"}
        )
        GlobalSecondaryIndexes = @(
            @{
                IndexName = "EmailIndex"
                KeySchema = @(@{AttributeName="email"; KeyType="HASH"})
                Projection = @{ProjectionType="ALL"}
            }
        )
    },
    @{
        Name = "$StackName-projects"
        KeySchema = @(
            @{AttributeName="id"; KeyType="HASH"}
        )
        AttributeDefinitions = @(
            @{AttributeName="id"; AttributeType="S"},
            @{AttributeName="userId"; AttributeType="S"},
            @{AttributeName="createdAt"; AttributeType="S"}
        )
        GlobalSecondaryIndexes = @(
            @{
                IndexName = "UserIdIndex"
                KeySchema = @(
                    @{AttributeName="userId"; KeyType="HASH"},
                    @{AttributeName="createdAt"; KeyType="RANGE"}
                )
                Projection = @{ProjectionType="ALL"}
            }
        )
    },
    @{
        Name = "$StackName-templates"
        KeySchema = @(
            @{AttributeName="id"; KeyType="HASH"}
        )
        AttributeDefinitions = @(
            @{AttributeName="id"; AttributeType="S"}
        )
        GlobalSecondaryIndexes = @()
    },
    @{
        Name = "$StackName-ai-cache"
        KeySchema = @(
            @{AttributeName="cacheKey"; KeyType="HASH"}
        )
        AttributeDefinitions = @(
            @{AttributeName="cacheKey"; AttributeType="S"}
        )
        GlobalSecondaryIndexes = @()
    }
)

foreach ($table in $tables) {
    Write-Host "Creating table: $($table.Name)..." -ForegroundColor Yellow
    
    # Check if table exists
    $tableExists = aws dynamodb describe-table --table-name $table.Name --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Table already exists, skipping..." -ForegroundColor Gray
        continue
    }
    
    # Build create-table command
    $keySchema = ($table.KeySchema | ConvertTo-Json -Compress).Replace('"', '\"')
    $attrDefs = ($table.AttributeDefinitions | ConvertTo-Json -Compress).Replace('"', '\"')
    
    $cmd = "aws dynamodb create-table --table-name $($table.Name) --attribute-definitions $attrDefs --key-schema $keySchema --billing-mode PAY_PER_REQUEST --region $Region"
    
    if ($table.GlobalSecondaryIndexes.Count -gt 0) {
        $gsi = ($table.GlobalSecondaryIndexes | ConvertTo-Json -Compress).Replace('"', '\"')
        $cmd += " --global-secondary-indexes $gsi"
    }
    
    Invoke-Expression $cmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Table created" -ForegroundColor Green
        
        # Enable point-in-time recovery
        aws dynamodb update-continuous-backups --table-name $table.Name --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true --region $Region | Out-Null
        
        # Enable TTL for cache table
        if ($table.Name -like "*ai-cache") {
            aws dynamodb update-time-to-live --table-name $table.Name --time-to-live-specification "Enabled=true,AttributeName=ttl" --region $Region | Out-Null
        }
    } else {
        Write-Host "  ✗ Failed to create table" -ForegroundColor Red
    }
}

# Step 3: Create IAM Role for Lambda
Write-Host "`n[3/6] Creating IAM Role..." -ForegroundColor Cyan

$roleName = "$StackName-lambda-role"
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

# Check if role exists
$roleExists = aws iam get-role --role-name $roleName 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating IAM role..." -ForegroundColor Yellow
    $trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8
    aws iam create-role --role-name $roleName --assume-role-policy-document file://trust-policy.json --region $Region
    Remove-Item "trust-policy.json"
    
    # Attach policies
    aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" --region $Region
    aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" --region $Region
    aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonSESFullAccess" --region $Region
    
    # Create custom policy for Bedrock
    $bedrockPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
"@
    $bedrockPolicy | Out-File -FilePath "bedrock-policy.json" -Encoding UTF8
    aws iam put-role-policy --role-name $roleName --policy-name "BedrockAccess" --policy-document file://bedrock-policy.json --region $Region
    Remove-Item "bedrock-policy.json"
    
    Write-Host "✓ IAM role created" -ForegroundColor Green
    Write-Host "Waiting 10 seconds for IAM role to propagate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} else {
    Write-Host "IAM role already exists" -ForegroundColor Gray
}

# Get role ARN
$roleArn = (aws iam get-role --role-name $roleName --query 'Role.Arn' --output text)
Write-Host "Role ARN: $roleArn" -ForegroundColor Cyan

# Step 4: Package Lambda Functions
Write-Host "`n[4/6] Packaging Lambda Functions..." -ForegroundColor Cyan

# Create deployment package
if (Test-Path "lambda-package.zip") {
    Remove-Item "lambda-package.zip"
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path dist/*,node_modules/* -DestinationPath lambda-package.zip -Force
Write-Host "✓ Package created: lambda-package.zip" -ForegroundColor Green

# Step 5: Deploy Lambda Functions
Write-Host "`n[5/6] Deploying Lambda Functions..." -ForegroundColor Cyan

$functions = @(
    @{Name="auth-login"; Handler="dist/handlers/auth.login"; Timeout=30; Memory=512},
    @{Name="auth-register"; Handler="dist/handlers/auth.register"; Timeout=30; Memory=512},
    @{Name="auth-me"; Handler="dist/handlers/auth.me"; Timeout=30; Memory=512},
    @{Name="authorizer"; Handler="dist/handlers/authorizer.handler"; Timeout=30; Memory=256},
    @{Name="projects-create"; Handler="dist/handlers/projects.create"; Timeout=30; Memory=512},
    @{Name="projects-list"; Handler="dist/handlers/projects.list"; Timeout=30; Memory=512},
    @{Name="projects-get"; Handler="dist/handlers/projects.get"; Timeout=30; Memory=512},
    @{Name="projects-update"; Handler="dist/handlers/projects.update"; Timeout=30; Memory=512},
    @{Name="projects-delete"; Handler="dist/handlers/projects.deleteProject"; Timeout=30; Memory=512},
    @{Name="ai-generate-phase"; Handler="dist/handlers/ai.generatePhase"; Timeout=60; Memory=1024},
    @{Name="ai-generate-sprint"; Handler="dist/handlers/ai.generateSprint"; Timeout=60; Memory=1024}
)

$envVars = "Variables={" +
    "STAGE=$Stage," +
    "DYNAMODB_TABLE_PREFIX=$StackName," +
    "JWT_SECRET=$env:JWT_SECRET," +
    "BEDROCK_MODEL_ID=$env:BEDROCK_MODEL_ID," +
    "GEMINI_API_KEY=$env:GEMINI_API_KEY," +
    "SES_FROM_EMAIL=$env:SES_FROM_EMAIL," +
    "FROM_EMAIL=$env:FROM_EMAIL," +
    "FRONTEND_URL=$env:FRONTEND_URL," +
    "AWS_BEARER_TOKEN_BEDROCK=$env:AWS_BEARER_TOKEN_BEDROCK," +
    "DEFAULT_PROJECT_LIMIT=$env:DEFAULT_PROJECT_LIMIT," +
    "BACKDOOR_USER_EMAIL=$env:BACKDOOR_USER_EMAIL" +
    "}"

foreach ($func in $functions) {
    $functionName = "$StackName-$($func.Name)"
    Write-Host "Deploying $functionName..." -ForegroundColor Yellow
    
    # Check if function exists
    $funcExists = aws lambda get-function --function-name $functionName --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Update existing function
        aws lambda update-function-code --function-name $functionName --zip-file fileb://lambda-package.zip --region $Region | Out-Null
        aws lambda update-function-configuration --function-name $functionName --handler $($func.Handler) --timeout $($func.Timeout) --memory-size $($func.Memory) --environment $envVars --region $Region | Out-Null
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        # Create new function
        aws lambda create-function --function-name $functionName --runtime nodejs20.x --role $roleArn --handler $($func.Handler) --zip-file fileb://lambda-package.zip --timeout $($func.Timeout) --memory-size $($func.Memory) --environment $envVars --region $Region | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Created" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed" -ForegroundColor Red
        }
    }
}

# Step 6: Create API Gateway
Write-Host "`n[6/6] Creating API Gateway..." -ForegroundColor Cyan
Write-Host "API Gateway creation requires manual setup in AWS Console" -ForegroundColor Yellow
Write-Host "Or use the AWS Console to create REST API and link Lambda functions" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Go to AWS Console → API Gateway" -ForegroundColor White
Write-Host "2. Create a new REST API" -ForegroundColor White
Write-Host "3. Link the Lambda functions to API endpoints" -ForegroundColor White
Write-Host "4. Deploy the API to a stage" -ForegroundColor White
Write-Host "5. Note the API Gateway URL for frontend configuration" -ForegroundColor White
Write-Host "`nLambda Functions Deployed:" -ForegroundColor Cyan
foreach ($func in $functions) {
    Write-Host "  - $StackName-$($func.Name)" -ForegroundColor Gray
}
