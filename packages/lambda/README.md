# Intelligent Engineering Platform - AWS Lambda Backend

## Architecture Overview

This is the serverless backend for the Intelligent Engineering Platform, built on AWS Lambda with a dual-AI strategy for maximum reliability and performance.

### Tech Stack

- **Compute**: AWS Lambda (Node.js 20.x)
- **API**: AWS API Gateway (REST API)
- **Database**: Amazon DynamoDB (NoSQL)
- **AI Primary**: AWS Bedrock (Claude 3.5 Sonnet)
- **AI Fallback**: Google Gemini 2.0 Flash
- **Email**: Amazon SES
- **Monitoring**: CloudWatch Logs, X-Ray
- **Deployment**: Serverless Framework

## Dual-AI Strategy

### Primary Engine: AWS Bedrock (Claude 3.5 Sonnet)
- Lightning-fast response times
- Superior reasoning capabilities
- Cost-effective at scale
- Native AWS integration

### Fallback Engine: Google Gemini
- Automatic failover on rate limits
- Service disruption protection
- Ensures 99.9% AI availability
- Seamless switching

### Failover Triggers
- Rate limit errors (ThrottlingException)
- Service unavailable errors
- Timeout errors
- Any Bedrock service disruption

## Project Structure

```
packages/lambda/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── authorizer.ts # JWT authorizer
│   │   ├── projects.ts   # Project CRUD operations
│   │   ├── ai.ts         # AI generation endpoints
│   │   ├── templates.ts  # Template management
│   │   ├── analytics.ts  # Analytics endpoints
│   │   ├── risk.ts       # Risk assessment
│   │   └── export.ts     # Export functionality
│   ├── services/          # Business logic services
│   │   └── ai.ts         # Dual-AI service
│   └── utils/             # Utility functions
│       ├── response.ts   # API response helpers
│       └── dynamodb.ts   # DynamoDB client
├── serverless.yml         # Serverless configuration
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Projects
- `POST /projects` - Create project
- `GET /projects` - List user projects
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### AI Generation
- `POST /projects/{projectId}/phases/{phaseId}/generate` - Generate phase content
- `POST /projects/{projectId}/phases/{phaseId}/sprints/{sprintId}/generate` - Generate sprint content

### Templates
- `GET /templates` - List templates
- `POST /templates/generate` - Generate custom template

### Analytics
- `GET /projects/{projectId}/analytics` - Get project analytics

### Risk Assessment
- `POST /projects/{projectId}/risks/assess` - Run risk assessment

### Export
- `POST /projects/{projectId}/export` - Export project

## DynamoDB Tables

### users
- Primary Key: `id` (String)
- GSI: `EmailIndex` on `email`
- Attributes: name, email, password (hashed), createdAt, updatedAt, lastLogin

### projects
- Primary Key: `id` (String)
- GSI: `UserIdIndex` on `userId` + `createdAt`
- Attributes: userId, name, requirements, constraints, disciplines, phases, team, status, createdAt, updatedAt

### templates
- Primary Key: `id` (String)
- Attributes: name, description, disciplines, phases, dynamicRoles, isBuiltIn, usage, createdAt

### ai-cache
- Primary Key: `cacheKey` (String)
- TTL: `ttl` attribute (24 hours)
- Attributes: content, createdAt

## Environment Variables

Required environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# AI Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration
SES_FROM_EMAIL=noreply@yourdomain.com

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com

# AWS Configuration (auto-configured in Lambda)
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=intelligent-engineering-platform-dev
```

## Deployment

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. Node.js 20.x installed
3. Serverless Framework installed globally

### Install Dependencies
```bash
cd packages/lambda
npm install
```

### Deploy to AWS
```bash
# Deploy to dev environment
npm run deploy

# Deploy to production
npm run deploy -- --stage prod

# Deploy single function
npm run deploy:function -- -f projects-create
```

### Local Development
```bash
# Run locally with serverless-offline
npm run dev

# API will be available at http://localhost:3001
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Monitoring

### CloudWatch Logs
All Lambda functions automatically log to CloudWatch Logs with the following format:
- Log Group: `/aws/lambda/{function-name}`
- Retention: 7 days (configurable)

### X-Ray Tracing
Distributed tracing is enabled for all functions and API Gateway requests.

### Custom Metrics
- AI generation requests (by engine)
- AI failover events
- API response times
- Error rates

## Cost Optimization

### Lambda
- Memory: 512MB (default), 1024MB (AI functions), 2048MB (export)
- Timeout: 30s (default), 60s (AI), 120s (export)
- Cold start optimization with Lambda layers

### DynamoDB
- On-demand billing mode
- Point-in-time recovery enabled
- Auto-scaling for predictable workloads

### AI Costs
- Bedrock (Claude 3.5 Sonnet): ~$0.003/1K input tokens, $0.015/1K output tokens
- Gemini (fallback): ~$0.00015/1K input tokens, $0.0006/1K output tokens
- 24-hour response caching reduces costs by ~70%

## Security

### Authentication
- JWT-based authentication
- 7-day token expiration
- Bcrypt password hashing (10 rounds)

### Authorization
- Custom Lambda authorizer
- Request-level authorization
- User-scoped data access

### Data Protection
- DynamoDB encryption at rest
- HTTPS/TLS for all API calls
- Secrets stored in environment variables

### IAM Permissions
- Least privilege principle
- Function-specific IAM roles
- Resource-level permissions

## Troubleshooting

### Common Issues

**Lambda timeout errors**
- Increase timeout in serverless.yml
- Optimize database queries
- Enable response caching

**DynamoDB throttling**
- Switch to on-demand billing
- Add GSIs for query patterns
- Implement exponential backoff

**AI generation failures**
- Check CloudWatch logs for error details
- Verify API keys are configured
- Monitor failover to Gemini

**Cold start latency**
- Use Lambda layers for dependencies
- Implement provisioned concurrency
- Optimize bundle size

## Support

For issues and questions:
- GitHub Issues: [repository-url]
- Documentation: [docs-url]
- Email: support@yourdomain.com
