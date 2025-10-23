import { APIGatewayProxyResult } from 'aws-lambda';

export const successResponse = (data: any, statusCode: number = 200): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(data),
});

export const errorResponse = (message: string, statusCode: number = 500): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ error: message }),
});

export const validationErrorResponse = (errors: any): APIGatewayProxyResult => ({
  statusCode: 400,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ error: 'Validation failed', details: errors }),
});
