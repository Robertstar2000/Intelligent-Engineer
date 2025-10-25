import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';

// Export project
export const exportProject = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { format } = body;

    if (!format) {
      return errorResponse('Export format is required', 400);
    }

    // Validate format
    const validFormats = ['pdf', 'word', 'powerpoint', 'markdown', 'html'];
    if (!validFormats.includes(format)) {
      return errorResponse(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400);
    }

    // Mock export as specified in task 9.1 and 9.2
    const exportResult = {
      id: `export_${Date.now()}`,
      projectId,
      format,
      status: 'processing',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      downloadUrl: `https://example.com/exports/${projectId}_${Date.now()}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      fileSize: null, // Will be populated when processing completes
      estimatedCompletion: new Date(Date.now() + 30 * 1000).toISOString() // 30 seconds
    };

    // Note: Actual document generation would happen here
    // For now, we return a mock response as specified in the tasks

    return successResponse(exportResult, 202); // 202 Accepted for async processing
  } catch (error) {
    console.error('Error exporting project:', error);
    return errorResponse('Internal server error', 500);
  }
};
