import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';

// Get project analytics
export const getProjectAnalytics = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const projectId = event.pathParameters?.projectId;
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    const range = event.queryStringParameters?.range || '30d';

    // Mock analytics data as specified in task 4.1
    const mockAnalytics = {
      projectId,
      timeRange: range,
      overview: {
        totalTasks: 15,
        completedTasks: 8,
        inProgressTasks: 4,
        todoTasks: 3,
        overdueTasks: 1,
        completionRate: 53.3,
        averageTaskDuration: 3.2,
        teamProductivity: 78.5
      },
      timeline: [
        { date: '2024-10-01', tasksCompleted: 2, hoursWorked: 16 },
        { date: '2024-10-02', tasksCompleted: 1, hoursWorked: 8 },
        { date: '2024-10-03', tasksCompleted: 3, hoursWorked: 24 },
        { date: '2024-10-04', tasksCompleted: 1, hoursWorked: 6 },
        { date: '2024-10-05', tasksCompleted: 2, hoursWorked: 14 }
      ],
      phaseProgress: [
        { phase: 'Planning', progress: 100, status: 'completed' },
        { phase: 'Design', progress: 75, status: 'in-progress' },
        { phase: 'Development', progress: 25, status: 'in-progress' },
        { phase: 'Testing', progress: 0, status: 'not-started' },
        { phase: 'Deployment', progress: 0, status: 'not-started' }
      ],
      teamPerformance: [
        { memberId: userId, name: 'Current User', tasksCompleted: 8, efficiency: 85.2 }
      ],
      riskFactors: [
        { factor: 'Schedule Risk', level: 'medium', impact: 'Potential 2-week delay' },
        { factor: 'Resource Risk', level: 'low', impact: 'Team capacity sufficient' },
        { factor: 'Technical Risk', level: 'low', impact: 'No major technical blockers' }
      ]
    };

    return successResponse(mockAnalytics);
  } catch (error) {
    console.error('Error getting project analytics:', error);
    return errorResponse('Internal server error', 500);
  }
};

// Get comparative analytics
export const getComparative = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    // Mock comparative analytics as specified in task 4.1
    const mockComparative = {
      industryBenchmarks: {
        averageProjectDuration: 120, // days
        averageTeamSize: 5,
        successRate: 68.5,
        budgetVariance: 15.2
      },
      userProjects: {
        averageProjectDuration: 95,
        averageTeamSize: 3,
        successRate: 85.0,
        budgetVariance: 8.5
      },
      recommendations: [
        'Your projects complete 20% faster than industry average',
        'Consider expanding team size for larger projects',
        'Excellent budget control - 7% better than benchmark'
      ]
    };

    return successResponse(mockComparative);
  } catch (error) {
    console.error('Error getting comparative analytics:', error);
    return errorResponse('Internal server error', 500);
  }
};

// Generate report
export const generateReport = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const reportType = event.pathParameters?.reportType;
    const projectId = event.pathParameters?.projectId;

    if (!reportType || !projectId) {
      return errorResponse('Report type and project ID are required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { format, includeCharts, dateRange } = body;

    // Mock report generation as specified in task 4.2
    const report = {
      id: `report_${Date.now()}`,
      type: reportType,
      projectId,
      format: format || 'pdf',
      includeCharts: includeCharts !== false,
      dateRange: dateRange || '30d',
      status: 'generating',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      downloadUrl: null, // Will be populated when generation completes
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
    };

    return successResponse(report, 202); // 202 Accepted for async processing
  } catch (error) {
    console.error('Error generating report:', error);
    return errorResponse('Internal server error', 500);
  }
};
