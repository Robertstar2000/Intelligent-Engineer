import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';

// List templates
export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Mock templates data as specified in task 2.3
    const mockTemplates = [
      {
        id: 'template_web_app',
        name: 'Web Application',
        description: 'Full-stack web application template with React frontend and Node.js backend',
        category: 'Software',
        phases: [
          { id: 'planning', name: 'Planning & Requirements', duration: 7 },
          { id: 'design', name: 'UI/UX Design', duration: 10 },
          { id: 'development', name: 'Development', duration: 21 },
          { id: 'testing', name: 'Testing & QA', duration: 7 },
          { id: 'deployment', name: 'Deployment', duration: 3 }
        ],
        disciplines: ['Software Engineering', 'UI/UX Design', 'DevOps'],
        createdAt: new Date().toISOString(),
        isPublic: true,
        isBuiltIn: true
      },
      {
        id: 'template_mobile_app',
        name: 'Mobile Application',
        description: 'Cross-platform mobile app template using React Native',
        category: 'Software',
        phases: [
          { id: 'planning', name: 'Planning & Requirements', duration: 7 },
          { id: 'design', name: 'Mobile UI Design', duration: 14 },
          { id: 'development', name: 'App Development', duration: 28 },
          { id: 'testing', name: 'Testing & QA', duration: 10 },
          { id: 'deployment', name: 'App Store Deployment', duration: 5 }
        ],
        disciplines: ['Mobile Development', 'UI/UX Design'],
        createdAt: new Date().toISOString(),
        isPublic: true,
        isBuiltIn: true
      },
      {
        id: 'template_iot_system',
        name: 'IoT System',
        description: 'Internet of Things system with sensors, gateway, and cloud platform',
        category: 'Hardware',
        phases: [
          { id: 'planning', name: 'System Planning', duration: 10 },
          { id: 'hardware', name: 'Hardware Design', duration: 21 },
          { id: 'firmware', name: 'Firmware Development', duration: 14 },
          { id: 'cloud', name: 'Cloud Platform', duration: 14 },
          { id: 'integration', name: 'System Integration', duration: 7 },
          { id: 'testing', name: 'Testing & Validation', duration: 10 }
        ],
        disciplines: ['Hardware Engineering', 'Embedded Systems', 'Cloud Engineering'],
        createdAt: new Date().toISOString(),
        isPublic: true,
        isBuiltIn: true
      }
    ];

    return successResponse(mockTemplates);
  } catch (error) {
    console.error('Error listing templates:', error);
    return errorResponse('Internal server error', 500);
  }
};

// Generate project from template
export const generate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = JSON.parse(event.body || '{}');
    const { templateId, projectName, customizations } = body;

    if (!templateId || !projectName) {
      return errorResponse('Template ID and project name are required', 400);
    }

    // Mock template generation as specified in task 2.3
    const generatedProject = {
      id: `proj_${Date.now()}`,
      name: projectName,
      templateId,
      description: `Generated project from ${templateId} template`,
      requirements: customizations?.requirements || 'Generated requirements based on template',
      constraints: customizations?.constraints || 'Standard template constraints',
      disciplines: customizations?.disciplines || ['Software Engineering'],
      developmentMode: customizations?.developmentMode || 'rapid',
      phases: [
        {
          id: 'planning',
          name: 'Planning & Requirements',
          status: 'not-started',
          progress: 0,
          estimatedDuration: 7,
          tasks: []
        },
        {
          id: 'design',
          name: 'Design Phase',
          status: 'not-started',
          progress: 0,
          estimatedDuration: 10,
          tasks: []
        },
        {
          id: 'development',
          name: 'Development Phase',
          status: 'not-started',
          progress: 0,
          estimatedDuration: 21,
          tasks: []
        }
      ],
      createdAt: new Date().toISOString(),
      createdBy: userId,
      fromTemplate: true
    };

    return successResponse(generatedProject, 201);
  } catch (error) {
    console.error('Error generating template:', error);
    return errorResponse('Internal server error', 500);
  }
};
