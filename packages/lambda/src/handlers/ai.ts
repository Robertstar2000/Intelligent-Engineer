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

    let generatedContent: string;
    let engine = 'mock';
    let cached = false;
    let tokensUsed = 0;
    let cost = 0;

    try {
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

      generatedContent = aiResponse.content;
      engine = aiResponse.engine;
      cached = aiResponse.cached;
      tokensUsed = aiResponse.tokensUsed || 0;
      cost = aiResponse.cost || 0;
    } catch (aiError: any) {
      console.error('AI generation failed, using fallback:', aiError);
      // Fallback to template-based content
      generatedContent = generateFallbackPhaseContent(project, phase);
    }

    // Update phase with generated content
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        return {
          ...p,
          output: generatedContent,
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
      content: generatedContent,
      output: generatedContent,
      engine,
      cached,
      tokensUsed,
      cost,
    });
  } catch (error: any) {
    console.error('Generate phase error:', error);
    return errorResponse(error.message || 'Failed to generate phase content', 500);
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

    let generatedContent: string;
    let engine = 'mock';
    let cached = false;
    let tokensUsed = 0;
    let cost = 0;

    try {
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

      generatedContent = aiResponse.content;
      engine = aiResponse.engine;
      cached = aiResponse.cached;
      tokensUsed = aiResponse.tokensUsed || 0;
      cost = aiResponse.cost || 0;
    } catch (aiError: any) {
      console.error('AI generation failed, using fallback:', aiError);
      // Fallback to template-based content
      generatedContent = generateFallbackSprintContent(project, phase, sprint);
    }

    // Update sprint with generated content
    const updatedPhases = project.phases.map((p: any) => {
      if (p.id === phaseId) {
        const updatedSprints = p.sprints.map((s: any) => {
          if (s.id === sprintId) {
            return {
              ...s,
              output: generatedContent,
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
      content: generatedContent,
      output: generatedContent,
      engine,
      cached,
      tokensUsed,
      cost,
    });
  } catch (error: any) {
    console.error('Generate sprint error:', error);
    return errorResponse(error.message || 'Failed to generate sprint content', 500);
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

function generateFallbackPhaseContent(project: any, phase: any): string {
  return `# ${phase.name}

## Overview
This phase focuses on ${phase.description.toLowerCase()}.

## Objectives
1. Complete all deliverables for the ${phase.name} phase
2. Ensure quality standards are met
3. Document all decisions and outcomes
4. Prepare for the next phase

## Key Activities

### Planning
- Review project requirements: ${project.requirements}
- Identify key stakeholders
- Define success criteria
- Allocate resources

### Execution
- Follow the ${project.developmentMode} development approach
- Implement best practices for ${project.disciplines.join(', ')}
- Regular team check-ins and progress reviews
- Quality assurance throughout

### Documentation
- Maintain comprehensive documentation
- Track decisions and rationale
- Update project artifacts
- Prepare phase completion report

## Deliverables
${phase.deliverables ? phase.deliverables.map((d: string) => `- ${d}`).join('\n') : '- Phase completion documentation\n- Quality assurance reports\n- Updated project artifacts'}

## Success Criteria
- All planned activities completed
- Quality standards met
- Stakeholder approval obtained
- Documentation up to date

## Risks and Mitigation

### Potential Risks
1. **Schedule Delays**: Regular monitoring and early intervention
2. **Resource Constraints**: Flexible resource allocation and prioritization
3. **Technical Challenges**: Expert consultation and knowledge sharing
4. **Quality Issues**: Continuous testing and review processes

### Mitigation Strategies
- Daily stand-ups for early issue detection
- Clear communication channels
- Regular stakeholder updates
- Contingency planning

## Next Steps
1. Review and approve this phase plan
2. Assign tasks to team members
3. Set up tracking and monitoring
4. Begin execution

---
*Note: This content was generated using a template. For AI-powered content generation, please ensure AI services are properly configured.*
`;
}

function generateFallbackSprintContent(project: any, phase: any, sprint: any): string {
  return `# ${sprint.name}

## Sprint Overview
${sprint.description}

## Sprint Goals
Complete the following deliverables:
${sprint.deliverables.map((d: string) => `- ${d}`).join('\n')}

## Tasks Breakdown

### Week 1
- Initial setup and planning
- Environment configuration
- Team alignment

### Week 2
- Core implementation
- Progress reviews
- Quality checks

### Week 3 (if applicable)
- Finalization
- Testing and validation
- Documentation

## Technical Approach
1. Follow ${project.developmentMode} development methodology
2. Apply ${project.disciplines.join(' and ')} best practices
3. Maintain code quality and documentation standards
4. Regular code reviews and testing

## Resources Needed
- Development team
- Testing environment
- Documentation tools
- Collaboration platforms

## Quality Checkpoints
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Stakeholder review

## Timeline
- Start: As scheduled
- Mid-sprint review: Week 2
- Completion: End of sprint period

---
*Note: This content was generated using a template. For AI-powered content generation, please ensure AI services are properly configured.*
`;
}


// Get AI profiles
export const getProfiles = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Mock AI profiles
    const profiles = [
      {
        id: 'claude-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Advanced AI for complex reasoning and analysis',
        capabilities: ['code-generation', 'analysis', 'documentation'],
        isActive: true
      },
      {
        id: 'claude-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast AI for quick tasks and responses',
        capabilities: ['quick-responses', 'summaries'],
        isActive: true
      }
    ];

    return successResponse(profiles);
  } catch (error) {
    console.error('Error getting AI profiles:', error);
    return errorResponse('Internal server error', 500);
  }
};

// Query project with AI
export const queryProject = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    const { query, context } = body;

    if (!query) {
      return errorResponse('Query is required', 400);
    }

    // Mock AI query response
    const response = {
      query,
      projectId,
      response: `Based on your project analysis, here are my insights about "${query}": This appears to be related to your project requirements and current progress. I recommend focusing on the key deliverables and ensuring proper documentation throughout the development process.`,
      confidence: 0.85,
      sources: ['project-requirements', 'phase-documentation'],
      timestamp: new Date().toISOString()
    };

    return successResponse(response);
  } catch (error) {
    console.error('Error querying project:', error);
    return errorResponse('Internal server error', 500);
  }
};
