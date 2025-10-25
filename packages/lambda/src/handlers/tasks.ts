import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { db } from '../utils/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export const listByProject = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
      return errorResponse('Project ID required', 400);
    }

    // For now, return empty array - tasks will be implemented later
    return successResponse([]);
  } catch (error: any) {
    console.error('List tasks error:', error);
    return errorResponse(error.message || 'Failed to list tasks');
  }
};

export const assignTask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = JSON.parse(event.body || '{}');
    
    const task = {
      id: uuidv4(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('tasks', task);
    return successResponse(task, 201);
  } catch (error: any) {
    console.error('Assign task error:', error);
    return errorResponse(error.message || 'Failed to assign task');
  }
};

export const updateTask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const taskId = event.pathParameters?.taskId;
    if (!taskId) {
      return errorResponse('Task ID required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const updated = await db.update('tasks', { id: taskId }, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error('Update task error:', error);
    return errorResponse(error.message || 'Failed to update task');
  }
};
