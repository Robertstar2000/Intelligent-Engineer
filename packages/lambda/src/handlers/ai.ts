import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { db } from '../utils/dynamodb';
import { aiService } from '../services/ai';

export const generatePhase = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.projectId;
    const phaseId = event.pathParameters?.phaseId;

    if (!projectId || !phaseId) {
      return errorResponse('Project ID and Phase ID are required', 400);
    }

    // Get project
    const project = await db.get('projects', { id: projectId });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    if (project.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Find phase
    const phase = project.phases.find((p: any) => p.id === phaseId);

    if (!phase) {
      return errorResponse('Phase not found', 404);
    }

    // Build prompt
    const prompt = buildPhasePrompt(project, phase);

    // Generate content using dual-AI service
    const aiResponse = await aiService.generateContent({
      prompt,
      context: {
        projectId,
        phaseId,
        phaseName: phase.name,
      },
      maxTokens: 4096,
      temperature: 0.7,
      useCache: true,
    });

    // Update phase with generated content
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        return {
          ...p,
          output: aiResponse.content,
          status: 'in-progress',
        };
      }
      return p;
    });

    await db.update('projects', { id: projectId }, {
      phases: updatedPhases,
      updatedAt: new Date().toISOString(),
    });

    return successResponse({
      output: aiResponse.content,
      engine: aiResponse.engine,
      cached: aiResponse.cached,
      tokensUsed: aiResponse.tokensUsed,
      cost: aiResponse.cost,
    });
  } catch (error: any) {
    console.error('Generate phase error:', error);
    return errorResponse(error.message || 'Failed to generate phase content');
  }
};

export const generateSprint = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.projectId;
    const phaseId = event.pathParameters?.phaseId;
    const sprintId = event.pathParameters?.sprintId;

    if (!projectId || !phaseId || !sprintId) {
      return errorResponse('Project ID, Phase ID, and Sprint ID are required', 400);
    }

    // Get project
    const project = await db.get('projects', { id: projectId });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    if (project.userId !== userId) {
      return errorResponse('Forbidden', 403);
    }

    // Find phase and sprint
    const phase = project.phases.find((p: any) => p.id === phaseId);

    if (!phase) {
      return errorResponse('Phase not found', 404);
    }

    const sprint = phase.sprints.find((s: any) => s.id === sprintId);

    if (!sprint) {
      return errorResponse('Sprint not found', 404);
    }

    // Build prompt
    const prompt = buildSprintPrompt(project, phase, sprint);

    // Generate content using dual-AI service
    const aiResponse = await aiService.generateContent({
      prompt,
      context: {
        projectId,
        phaseId,
        sprintId,
        sprintName: sprint.name,
      },
      maxTokens: 2048,
      temperature: 0.7,
      useCache: true,
    });

    // Update sprint with generated content
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        const updatedSprints = p.sprints.map((s: any) => {
          if (s.id === sprintId) {
            return {
              ...s,
              output: aiResponse.content,
              status: 'in-progress',
            };
          }
          return s;
        });
        return { ...p, sprints: updatedSprints };
      }
      return p;
    });

    await db.update('projects', { id: projectId }, {
      phases: updatedPhases,
      updatedAt: new Date().toISOString(),
    });

    return successResponse({
      output: aiResponse.content,
      engine: aiResponse.engine,
      cached: aiResponse.cached,
      tokensUsed: aiResponse.tokensUsed,
      cost: aiResponse.cost,
    });
  } catch (error: any) {
    console.error('Generate sprint error:', error);
    return errorResponse(error.message || 'Failed to generate sprint content');
  }
};

function buildPhasePrompt(project: any, phase: any): string {
  return `
You are an expert engineering assistant helping with project planning and execution.

Project: ${project.name}
Disciplines: ${project.disciplines.join(', ')}
Development Mode: ${project.developmentMode}

Requirements:
${project.requirements}

Constraints:
${project.constraints}

Current Phase: ${phase.name}
Phase Description: ${phase.description}

Please generate detailed content for this phase including:
1. Objectives and goals
2. Key activities and tasks
3. Deliverables
4. Success criteria
5. Potential risks and mitigation strategies

Provide comprehensive, actionable guidance that the engineering team can follow.
`.trim();
}

function buildSprintPrompt(project: any, phase: any, sprint: any): string {
  return `
You are an expert engineering assistant helping with sprint planning.

Project: ${project.name}
Phase: ${phase.name}
Sprint: ${sprint.name}

Sprint Description: ${sprint.description}
Deliverables: ${sprint.deliverables.join(', ')}

Please generate detailed content for this sprint including:
1. Specific tasks to complete
2. Technical approach
3. Timeline and milestones
4. Resources needed
5. Quality checkpoints

Provide practical, detailed guidance for completing this sprint successfully.
`.trim();
}
