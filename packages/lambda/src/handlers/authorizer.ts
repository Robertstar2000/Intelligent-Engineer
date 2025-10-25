import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    console.log('Authorizer invoked');
    console.log('Headers:', JSON.stringify(event.headers));
    
    // Get token from Authorization header (case-insensitive)
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    console.log('Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header provided');
      throw new Error('No token provided');
    }

    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');

    if (!token) {
      console.log('No token in Authorization header');
      throw new Error('No token provided');
    }

    console.log('Token extracted:', token.substring(0, 20) + '...');
    console.log('JWT_SECRET exists:', !!JWT_SECRET);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    console.log('Token verified successfully for user:', decoded.userId);

    // Generate policy
    return generatePolicy(decoded.userId, 'Allow', event.methodArn, {
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch (error: any) {
    console.error('Authorization error:', error.message);
    throw new Error('Unauthorized');
  }
};

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, any>
): APIGatewayAuthorizerResult => {
  // Allow access to all API endpoints by using wildcard
  // Extract the API Gateway ARN base and add wildcard
  // Format: arn:aws:execute-api:region:account-id:api-id/stage/method/resource
  const resourceParts = resource.split('/');
  const apiGatewayArnBase = resourceParts.slice(0, 2).join('/'); // arn:aws:execute-api:region:account-id:api-id/stage
  const wildcardResource = apiGatewayArnBase + '/*/*';
  
  console.log('Original resource:', resource);
  console.log('Wildcard resource:', wildcardResource);
  
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: wildcardResource,
        },
      ],
    },
    context,
  };
  
  console.log('Generated policy:', JSON.stringify(policy));
  return policy;
};
