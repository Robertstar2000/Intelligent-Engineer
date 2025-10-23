import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';
import { db } from '../utils/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  requirements: z.string(),
  constraints: z.string(),
  disciplines: z.array(z.string()).min(1),
  developmentMode: z.enum(['full', 'rapid']),
  description: z.string().optional(),
});

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors);
    }

    const data = validation.data;

    // Create project
    const project = {
      id: uuidv4(),
      userId,
      name: data.name,
      requirements: data.requirements,
      constraints: data.constraints,
      disciplines: data.disciplines,
      developmentMode: data.developmentMode,
      description: data.description || '',
      currentPhase: 0,
      status: 'draft',
      phases: generateInitialPhases(data.developmentMode),
      team: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put('projects', project);

    return successResponse(project, 201);
  } catch (error: any) {
    console.error('Create project error:', error);
    return errorResponse(error.message || 'Failed to create project');
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Query projects by userId
    const projects = await db.query('projects', 'UserIdIndex', 'userId = :userId', {
      ':userId': userId,
    });

    return successResponse(projects);
  } catch (error: any) {
    console.error('List projects error:', error);
    return errorResponse(error.message || 'Failed to list projects');
  }
};

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    const project = await db.get('projects', { id: projectId });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    // Check if user has access to this project
    if (project.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    return successResponse(project);
  } catch (error: any) {
    console.error('Get project error:', error);
    return errorResponse(error.message || 'Failed to get project');
  }
};

export const update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');

    // Get existing project
    const project = await db.get('projects', { id: projectId });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    if (project.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Update project
    const updates = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject = await db.update('projects', { id: projectId }, updates);

    return successResponse(updatedProject);
  } catch (error: any) {
    console.error('Update project error:', error);
    return errorResponse(error.message || 'Failed to update project');
  }
};

export const deleteProject = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.id;
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    // Get existing project
    const project = await db.get('projects', { id: projectId });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    if (project.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Delete project
    await db.delete('projects', { id: projectId });

    return successResponse({ message: 'Project deleted successfully' }, 204);
  } catch (error: any) {
    console.error('Delete project error:', error);
    return errorResponse(error.message || 'Failed to delete project');
  }
};

// Helper function to generate initial phases
function generateInitialPhases(developmentMode: 'full' | 'rapid') {
  const basePhases = [
    {
      id: uuidv4(),
      name: 'Requirements Analysis',
      description: 'Analyze and document project requirements',
      status: 'not-started',
      sprints: [],
      tuningSettings: {},
      output: '',
      isEditable: true,
    },
    {
      id: uuidv4(),
      name: 'Design',
      description: 'Create system design and architecture',
      status: 'not-started',
      sprints: [],
      tuningSettings: {},
      output: '',
      isEditable: true,
    },
    {
      id: uuidv4(),
      name: 'Implementation',
      description: 'Implement the system',
      status: 'not-started',
      sprints: [],
      tuningSettings: {},
      output: '',
      isEditable: true,
    },
  ];

  if (developmentMode === 'full') {
    basePhases.push(
      {
        id: uuidv4(),
        name: 'Testing',
        description: 'Test and validate the system',
        status: 'not-started',
        sprints: [],
        tuningSettings: {},
        output: '',
        isEditable: true,
      },
      {
        id: uuidv4(),
        name: 'Deployment',
        description: 'Deploy to production',
        status: 'not-started',
        sprints: [],
        tuningSettings: {},
        output: '',
        isEditable: true,
      }
    );
  }

  return basePhases;
}
