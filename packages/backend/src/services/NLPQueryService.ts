import { Project } from '@shared/types';
import { AIService } from './AIService';
import { ProjectService } from './ProjectService';

export interface QueryContext {
  projectId?: string;
  userId: string;
  organizationId?: string;
  scope: 'project' | 'organization' | 'global';
  includeHistorical: boolean;
}

export interface QueryResponse {
  answer: string;
  data: any[];
  visualizations: Visualization[];
  confidence: number;
  sources: DataSource[];
  suggestedFollowUps: string[];
  queryType: QueryType;
  executionTime: number;
}

export interface Visualization {
  id: string;
  type: 'chart' | 'table' | 'graph' | 'timeline' | 'dashboard';
  title: string;
  description: string;
  data: any;
  config: any;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'project' | 'phase' | 'sprint' | 'analytics' | 'external';
  lastUpdated: Date;
  reliability: number;
}

export type QueryType = 
  | 'status' 
  | 'progress' 
  | 'team' 
  | 'timeline' 
  | 'risk' 
  | 'analytics' 
  | 'comparison' 
  | 'prediction' 
  | 'general';

/**
 * NLP Query Service for natural language project data queries
 * Allows users to ask questions about project data in plain English
 */
export class NLPQueryService {
  private aiService: AIService;
  private projectService: ProjectService;

  constructor() {
    this.aiService = new AIService();
    this.projectService = new ProjectService();
  }

  /**
   * Process natural language query and return structured response
   */
  async processQuery(
    query: string,
    context: QueryContext
  ): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      // Classify the query type
      const queryType = await this.classifyQuery(query);
      
      // Get relevant data based on context
      const projectData = await this.gatherRelevantData(context);
      
      // Generate response using AI
      const aiResponse = await this.generateQueryResponse(query, queryType, projectData, context);
      
      // Parse and structure the response
      const structuredResponse = await this.structureResponse(aiResponse, queryType, projectData);
      
      // Generate visualizations if applicable
      const visualizations = await this.generateVisualizations(structuredResponse, queryType);
      
      // Generate follow-up suggestions
      const followUps = await this.generateFollowUpSuggestions(query, queryType, structuredResponse);

      const executionTime = Date.now() - startTime;

      return {
        answer: structuredResponse.answer,
        data: structuredResponse.data,
        visualizations,
        confidence: structuredResponse.confidence,
        sources: structuredResponse.sources,
        suggestedFollowUps: followUps,
        queryType,
        executionTime,
      };
    } catch (error) {
      console.error('Error processing NLP query:', error);
      
      return {
        answer: 'I apologize, but I encountered an error processing your query. Please try rephrasing your question or contact support if the issue persists.',
        data: [],
        visualizations: [],
        confidence: 0,
        sources: [],
        suggestedFollowUps: [
          'Can you show me the project status?',
          'What is the current progress?',
          'Who are the team members?',
        ],
        queryType: 'general',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate visualization for query results
   */
  async generateVisualization(queryResult: any): Promise<Visualization[]> {
    return this.generateVisualizations(queryResult, queryResult.queryType || 'general');
  }

  /**
   * Suggest related queries based on current query
   */
  async suggestRelatedQueries(query: string, context: QueryContext): Promise<string[]> {
    const prompt = `Based on the user query: "${query}"

Suggest 3-5 related questions they might want to ask about their engineering project.
Focus on practical, actionable questions that would provide valuable insights.

Return as JSON array of strings.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: 'Query Suggestions',
          disciplines: [],
          requirements: '',
          constraints: '',
          developmentMode: 'full',
          previousPhaseOutputs: [],
          currentPhase: 'query-suggestions',
          sprintContext: 'related-queries',
        },
        {},
        'You are a helpful assistant that suggests relevant project management questions.'
      );

      const suggestions = JSON.parse(aiResponse.content);
      return Array.isArray(suggestions) ? suggestions : suggestions.suggestions || [];
    } catch (error) {
      console.error('Error generating query suggestions:', error);
      return [
        'What is the current project status?',
        'How is the team performing?',
        'What are the upcoming milestones?',
        'Are there any risks I should know about?',
      ];
    }
  }

  /**
   * Learn from user interactions to improve responses
   */
  async learnFromInteraction(
    query: string,
    response: QueryResponse,
    feedback: { helpful: boolean; rating?: number; comment?: string }
  ): Promise<void> {
    // This would store interaction data for model improvement
    // For now, just log the feedback
    console.log('Query feedback received:', {
      query,
      queryType: response.queryType,
      confidence: response.confidence,
      feedback,
      timestamp: new Date(),
    });
  }

  // Private helper methods

  private async classifyQuery(query: string): Promise<QueryType> {
    const prompt = `Classify the following user query into one of these categories:
- status: Questions about current project status
- progress: Questions about progress, completion, timelines
- team: Questions about team members, roles, assignments
- timeline: Questions about schedules, deadlines, milestones
- risk: Questions about risks, issues, problems
- analytics: Questions about metrics, performance, trends
- comparison: Questions comparing different aspects
- prediction: Questions about future outcomes
- general: General questions or unclear intent

Query: "${query}"

Return only the category name.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: 'Query Classification',
          disciplines: [],
          requirements: '',
          constraints: '',
          developmentMode: 'full',
          previousPhaseOutputs: [],
          currentPhase: 'query-classification',
          sprintContext: 'intent-recognition',
        },
        { conciseness: 0.9 },
        'You are a query classification system. Return only the category name.'
      );

      const classification = aiResponse.content.trim().toLowerCase();
      const validTypes: QueryType[] = ['status', 'progress', 'team', 'timeline', 'risk', 'analytics', 'comparison', 'prediction', 'general'];
      
      return validTypes.includes(classification as QueryType) ? classification as QueryType : 'general';
    } catch (error) {
      console.error('Error classifying query:', error);
      return 'general';
    }
  }

  private async gatherRelevantData(context: QueryContext): Promise<any> {
    const data: any = {
      projects: [],
      analytics: {},
      team: [],
      timeline: [],
    };

    try {
      if (context.projectId) {
        const project = await this.projectService.getProject(context.projectId, context.userId);
        if (project) {
          data.projects = [project];
          data.team = project.team || [];
          data.timeline = project.phases || [];
        }
      } else if (context.scope === 'organization' && context.organizationId) {
        // Would get organization-wide data
        data.projects = await this.projectService.getUserProjects(context.userId);
      } else {
        // Get user's projects
        data.projects = await this.projectService.getUserProjects(context.userId);
      }

      // Add analytics data (placeholder)
      data.analytics = {
        totalProjects: data.projects.length,
        activeProjects: data.projects.filter((p: Project) => p.status === 'active').length,
        completedPhases: data.projects.reduce((sum: number, p: Project) => 
          sum + p.phases.filter(phase => phase.status === 'completed').length, 0
        ),
      };
    } catch (error) {
      console.error('Error gathering relevant data:', error);
    }

    return data;
  }

  private async generateQueryResponse(
    query: string,
    queryType: QueryType,
    projectData: any,
    context: QueryContext
  ): Promise<any> {
    const prompt = `Answer the following user question based on the provided project data:

User Question: "${query}"
Query Type: ${queryType}

Project Data:
${JSON.stringify(projectData, null, 2)}

Provide a helpful, accurate answer based on the available data. If the data is insufficient, explain what information is missing.

Include:
1. Direct answer to the question
2. Supporting data points
3. Relevant insights or observations
4. Data sources used

Return as JSON with: answer, data, confidence, sources, insights.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: 'Query Response',
          disciplines: [],
          requirements: '',
          constraints: '',
          developmentMode: 'full',
          previousPhaseOutputs: [],
          currentPhase: 'query-response',
          sprintContext: 'data-analysis',
        },
        {
          clarity: 0.9,
          userCentricity: 0.9,
          conciseness: 0.7,
        },
        'You are a helpful project management assistant. Provide clear, accurate answers based on available data.'
      );

      return JSON.parse(aiResponse.content);
    } catch (error) {
      console.error('Error generating query response:', error);
      return {
        answer: 'I was unable to process your query with the available data.',
        data: [],
        confidence: 0.1,
        sources: [],
        insights: [],
      };
    }
  }

  private async structureResponse(aiResponse: any, queryType: QueryType, projectData: any): Promise<any> {
    return {
      answer: aiResponse.answer || 'No answer available',
      data: aiResponse.data || [],
      confidence: aiResponse.confidence || 0.5,
      sources: this.extractDataSources(projectData),
      insights: aiResponse.insights || [],
    };
  }

  private async generateVisualizations(response: any, queryType: QueryType): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];

    // Generate visualizations based on query type
    switch (queryType) {
      case 'progress':
        if (response.data.length > 0) {
          visualizations.push({
            id: `viz-progress-${Date.now()}`,
            type: 'chart',
            title: 'Project Progress',
            description: 'Current progress across project phases',
            data: response.data,
            config: { type: 'bar', xAxis: 'phase', yAxis: 'completion' },
          });
        }
        break;

      case 'team':
        visualizations.push({
          id: `viz-team-${Date.now()}`,
          type: 'table',
          title: 'Team Overview',
          description: 'Team members and their roles',
          data: response.data,
          config: { columns: ['name', 'role', 'status'] },
        });
        break;

      case 'timeline':
        visualizations.push({
          id: `viz-timeline-${Date.now()}`,
          type: 'timeline',
          title: 'Project Timeline',
          description: 'Project phases and milestones',
          data: response.data,
          config: { timeField: 'date', labelField: 'milestone' },
        });
        break;

      case 'analytics':
        visualizations.push({
          id: `viz-analytics-${Date.now()}`,
          type: 'dashboard',
          title: 'Project Analytics',
          description: 'Key project metrics and KPIs',
          data: response.data,
          config: { widgets: ['progress', 'team', 'timeline', 'risks'] },
        });
        break;
    }

    return visualizations;
  }

  private async generateFollowUpSuggestions(
    originalQuery: string,
    queryType: QueryType,
    response: any
  ): Promise<string[]> {
    const suggestions: Record<QueryType, string[]> = {
      status: [
        'What are the next milestones?',
        'Are there any blockers?',
        'How is the team performing?',
      ],
      progress: [
        'What is causing any delays?',
        'When will the project be completed?',
        'Which phases are at risk?',
      ],
      team: [
        'Who is working on what tasks?',
        'Are there any resource conflicts?',
        'How is team productivity?',
      ],
      timeline: [
        'What are the critical path items?',
        'Can we accelerate the schedule?',
        'What dependencies exist?',
      ],
      risk: [
        'What mitigation strategies are in place?',
        'How can we reduce project risks?',
        'What are the biggest threats?',
      ],
      analytics: [
        'How does this compare to other projects?',
        'What trends should I be aware of?',
        'What metrics need attention?',
      ],
      comparison: [
        'What are the key differences?',
        'Which option is recommended?',
        'What are the trade-offs?',
      ],
      prediction: [
        'What factors could change this outcome?',
        'How confident are these predictions?',
        'What scenarios should we plan for?',
      ],
      general: [
        'Can you show me the project dashboard?',
        'What should I focus on today?',
        'Are there any urgent items?',
      ],
    };

    return suggestions[queryType] || suggestions.general;
  }

  private extractDataSources(projectData: any): DataSource[] {
    const sources: DataSource[] = [];

    if (projectData.projects && projectData.projects.length > 0) {
      sources.push({
        id: 'projects',
        name: 'Project Data',
        type: 'project',
        lastUpdated: new Date(),
        reliability: 0.9,
      });
    }

    if (projectData.analytics) {
      sources.push({
        id: 'analytics',
        name: 'Analytics Data',
        type: 'analytics',
        lastUpdated: new Date(),
        reliability: 0.8,
      });
    }

    return sources;
  }
}