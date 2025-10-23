# AWS Deployment Guide - Intelligent Engineering Platform

## Prerequisites

Before deploying to AWS, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 20.x** installed
4. **Serverless Framework** installed globally
5. **Git** repository access

## Step 1: Install AWS CLI

### Windows
```powershell
# Download and install from: https://aws.amazon.com/cli/
# Or use chocolatey:
choco install awscli
```

### Verify Installation
```bash
aws --version
# Should show: aws-cli/2.x.x or higher
```

## Step 2: Configure AWS Credentials

### Option A: Using AWS CLI Configure
```bash
aws configure
```

Enter your credentials:
- AWS Access Key ID: `[Your Access Key]`
- AWS Secret Access Key: `[Your Secret Key]`
- Default region: `us-east-1` (or your preferred region)
- Default output format: `json`

### Option B: Using Environment Variables
```bash
# Windows PowerShell
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_REGION="us-east-1"
```

## Step 3: Set Up Required AWS Services

### Enable AWS Bedrock Access

1. Go to AWS Console → Bedrock
2. Navigate to "Model access"
3. Request access to **Claude 3.5 Sonnet**
4. Wait for approval (usually instant for most accounts)

### Configure Amazon SES

1. Go to AWS Console → SES
2. Verify your sender email address
3. If in sandbox mode, verify recipient emails
4. Request production access if needed

```bash
# Verify an email address
aws ses verify-email-identity --email-address noreply@yourdomain.com
```

## Step 4: Install Serverless Framework

```bash
npm install -g serverless
```

Verify installation:
```bash
serverless --version
# Should show: Framework Core: 3.x.x or higher
```

## Step 5: Set Up Environment Variables

Create a `.env` file in `packages/lambda/`:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Configuration
GEMINI_API_KEY=your-google-gemini-api-key

# Email Configuration
SES_FROM_EMAIL=noreply@yourdomain.com

# Frontend Configuration (will be updated after deployment)
FRONTEND_URL=https://yourdomain.com
```

### Get Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env` file

## Step 6: Install Dependencies

```bash
# Install root dependencies
npm install

# Install Lambda dependencies
cd packages/lambda
npm install

# Install Frontend dependencies
cd ../frontend
npm install

# Install Shared dependencies
cd ../shared
npm install
```

## Step 7: Deploy Lambda Backend to AWS

```bash
cd packages/lambda

# Deploy to development environment
serverless deploy --stage dev

# Or deploy to production
serverless deploy --stage prod
```

### Expected Output:
```
✔ Service deployed to stack intelligent-engineering-platform-dev

endpoints:
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/register
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/login
  GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/me
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/projects
  GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/projects
  ... (more endpoints)

functions:
  auth-login: intelligent-engineering-platform-dev-auth-login
  auth-register: intelligent-engineering-platform-dev-auth-register
  ... (more functions)
```

**IMPORTANT**: Save the API Gateway URL (e.g., `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev`)

## Step 8: Build and Deploy Frontend to S3

### Create S3 Bucket

```bash
# Create bucket (replace with your unique bucket name)
aws s3 mb s3://intelligent-engineering-platform-frontend

# Enable static website hosting
aws s3 website s3://intelligent-engineering-platform-frontend --index-document index.html --error-document index.html
```

### Update Frontend Configuration

Edit `packages/frontend/src/config.ts` (create if doesn't exist):

```typescript
export const config = {
  apiUrl: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev',
};
```

### Build and Deploy Frontend

```bash
cd packages/frontend

# Build production bundle
npm run build

# Deploy to S3
aws s3 sync dist/ s3://intelligent-engineering-platform-frontend --delete

# Make files public
aws s3 sync dist/ s3://intelligent-engineering-platform-frontend --acl public-read
```

## Step 9: Set Up CloudFront CDN

### Create CloudFront Distribution

```bash
# Create distribution (this takes 15-20 minutes)
aws cloudfront create-distribution \
  --origin-domain-name intelligent-engineering-platform-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

Or use AWS Console:
1. Go to CloudFront → Create Distribution
2. Origin Domain: Select your S3 bucket
3. Origin Access: Public
4. Default Root Object: `index.html`
5. Create Distribution

**Note**: Save the CloudFront domain name (e.g., `d1234567890.cloudfront.net`)

## Step 10: Configure Custom Domain (Optional)

### Using Route 53

1. Register or transfer domain to Route 53
2. Create hosted zone
3. Request SSL certificate in ACM (us-east-1 region for CloudFront)
4. Add CNAME record pointing to CloudFront distribution
5. Update CloudFront distribution with custom domain

## Step 11: Test the Deployment

### Test Backend API

```bash
# Test health endpoint
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/login

# Register a test user
curl -X POST https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Test Frontend

Open your browser and navigate to:
- S3 URL: `http://intelligent-engineering-platform-frontend.s3-website-us-east-1.amazonaws.com`
- CloudFront URL: `https://d1234567890.cloudfront.net`
- Custom Domain: `https://yourdomain.com` (if configured)

## Step 12: Monitor and Verify

### Check CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/intelligent-engineering

# Tail logs for a specific function
serverless logs -f auth-login --tail
```

### Check DynamoDB Tables

```bash
# List tables
aws dynamodb list-tables

# Scan users table
aws dynamodb scan --table-name intelligent-engineering-platform-dev-users
```

### Check X-Ray Traces

1. Go to AWS Console → X-Ray
2. View Service Map
3. Check Traces for request flow

## Deployment Costs Estimate

### Monthly Costs (Low Traffic - 1000 users, 10K requests/month)

- **Lambda**: ~$5-10/month (1M requests free tier)
- **DynamoDB**: ~$2-5/month (25GB free tier)
- **API Gateway**: ~$3.50/month (1M requests free tier)
- **S3**: ~$0.50/month (5GB free tier)
- **CloudFront**: ~$1-2/month (1TB free tier first year)
- **AWS Bedrock**: ~$10-50/month (depends on usage)
- **SES**: ~$0.10/month (62K emails free tier)

**Total Estimated**: $20-70/month (with free tier benefits)

### Cost Optimization Tips

1. **Enable AI Response Caching** (already implemented - 70% cost reduction)
2. **Use DynamoDB On-Demand** for unpredictable traffic
3. **Set CloudWatch Log Retention** to 7 days
4. **Enable S3 Lifecycle Policies** for old files
5. **Use Lambda Reserved Concurrency** for predictable workloads

## Troubleshooting

### Issue: Lambda Timeout Errors

```bash
# Increase timeout in serverless.yml
functions:
  your-function:
    timeout: 60  # Increase from 30 to 60 seconds
```

### Issue: DynamoDB Throttling

```bash
# Switch to on-demand billing
aws dynamodb update-table \
  --table-name your-table-name \
  --billing-mode PAY_PER_REQUEST
```

### Issue: Bedrock Access Denied

1. Check model access in Bedrock console
2. Verify IAM permissions include `bedrock:InvokeModel`
3. Confirm model ID is correct in environment variables

### Issue: CORS Errors

Update `serverless.yml`:
```yaml
functions:
  your-function:
    events:
      - http:
          cors:
            origin: '*'
            headers:
              - Content-Type
              - Authorization
```

## Rollback Procedure

### Rollback Lambda Deployment

```bash
# List deployments
serverless deploy list

# Rollback to previous version
serverless rollback --timestamp TIMESTAMP
```

### Rollback Frontend

```bash
# Restore from S3 versioning
aws s3api list-object-versions --bucket intelligent-engineering-platform-frontend

# Restore specific version
aws s3api copy-object \
  --copy-source intelligent-engineering-platform-frontend/index.html?versionId=VERSION_ID \
  --bucket intelligent-engineering-platform-frontend \
  --key index.html
```

## Production Checklist

- [ ] Enable AWS WAF on API Gateway
- [ ] Set up CloudWatch Alarms for errors
- [ ] Configure DynamoDB backups
- [ ] Enable CloudTrail for audit logging
- [ ] Set up SNS notifications for alerts
- [ ] Configure Route 53 health checks
- [ ] Enable S3 versioning
- [ ] Set up CloudFront custom error pages
- [ ] Configure Lambda reserved concurrency
- [ ] Enable X-Ray tracing
- [ ] Set up cost alerts in AWS Budgets
- [ ] Document disaster recovery procedures

## Support and Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Serverless Framework**: https://www.serverless.com/framework/docs
- **AWS Bedrock**: https://docs.aws.amazon.com/bedrock/
- **Project Repository**: https://github.com/Robertstar2000/Intelligent-Engineer

## Next Steps

After successful deployment:

1. **Set up monitoring dashboards** (Task 14.6)
2. **Configure backup policies** (Task 14.7)
3. **Build infrastructure management UI** (Task 14.8)
4. **Set up CI/CD pipeline** (Task 14.9)
5. **Update documentation** (Task 14.10)

---

**Deployment Complete!** 🎉

Your Intelligent Engineering Platform is now running on AWS with:
- ✅ Serverless Lambda backend
- ✅ Dual-AI strategy (Bedrock + Gemini)
- ✅ DynamoDB data persistence
- ✅ S3 + CloudFront hosting
- ✅ CloudWatch monitoring
- ✅ Production-ready infrastructure
