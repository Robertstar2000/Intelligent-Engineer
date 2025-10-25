import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

export class IntelligentEngineeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    projectsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const templatesTable = new dynamodb.Table(this, 'TemplatesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const aiCacheTable = new dynamodb.Table(this, 'AICacheTable', {
      partitionKey: { name: 'cacheKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/node_modules')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared dependencies for Lambda functions',
    });

    // Environment variables for Lambda
    const lambdaEnv = {
      DYNAMODB_TABLE_PREFIX: `${this.stackName}`,
      USERS_TABLE: usersTable.tableName,
      PROJECTS_TABLE: projectsTable.tableName,
      TEMPLATES_TABLE: templatesTable.tableName,
      AI_CACHE_TABLE: aiCacheTable.tableName,
      JWT_SECRET: process.env.JWT_SECRET || 'change-me',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@example.com',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    };

    // Lambda Functions
    const authLoginFn = new lambda.Function(this, 'AuthLoginFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/auth.login',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const authRegisterFn = new lambda.Function(this, 'AuthRegisterFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/auth.register',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const projectsCreateFn = new lambda.Function(this, 'ProjectsCreateFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/projects.create',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const projectsListFn = new lambda.Function(this, 'ProjectsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/projects.list',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const aiGeneratePhaseFn = new lambda.Function(this, 'AIGeneratePhaseFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/ai.generatePhase',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(authLoginFn);
    usersTable.grantReadWriteData(authRegisterFn);
    projectsTable.grantReadWriteData(projectsCreateFn);
    projectsTable.grantReadWriteData(projectsListFn);
    projectsTable.grantReadWriteData(aiGeneratePhaseFn);
    aiCacheTable.grantReadWriteData(aiGeneratePhaseFn);

    // Grant Bedrock permissions
    aiGeneratePhaseFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'IntelligentEngineeringAPI', {
      restApiName: 'Intelligent Engineering Platform API',
      description: 'API for Intelligent Engineering Platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Auth endpoints
    const auth = api.root.addResource('auth');
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authLoginFn));
    auth.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authRegisterFn));

    // Projects endpoints
    const projects = api.root.addResource('projects');
    projects.addMethod('POST', new apigateway.LambdaIntegration(projectsCreateFn));
    projects.addMethod('GET', new apigateway.LambdaIntegration(projectsListFn));

    // AI endpoints
    const projectResource = projects.addResource('{projectId}');
    const phases = projectResource.addResource('phases');
    const phase = phases.addResource('{phaseId}');
    phase.addResource('generate').addMethod('POST', new apigateway.LambdaIntegration(aiGeneratePhaseFn));

    // S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users table',
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: projectsTable.tableName,
      description: 'DynamoDB Projects table',
    });
  }
}
