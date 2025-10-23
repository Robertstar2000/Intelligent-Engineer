import { Project, BestPractice } from '@shared/types';
import { AIService } from './AIService';
import { ProjectService } from './ProjectService';

export interface BestPracticeRecommendation {
  id: string;
  title: string;
  description: string;
  category: BestPracticeCategory;
  applicability: number; // 0-1 score for how applicable this is to the current project
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  implementation: ImplementationGuide;
  caseStudies: CaseStudy[];
  createdAt: Date;
}

export interface Evidence {
  source: string;
  type: 'project-data' | 'industry-standard' | 'research' | 'expert-opinion';
  description: string;
  confidence: number;
}

export interface ImplementationGuide {
  steps: string[];
  timeline: string;
  resources: string[];
  successMetrics: string[];
  commonPitfalls: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  summary: string;
  outcome: string;
  lessonsLearned: string[];
  applicableScenarios: string[];
}

export type BestPracticeCategory = 
  | 'project-management'
  | 'team-collaboration'
  | 'risk-management'
  | 'quality-assurance'
  | 'documentation'
  | 'communication'
  | 'technical-approach'
  | 'process-improvement';

/**
 * Best Practice Engine Service for automated recommendations
 * Learns from successful projects to recommend optimal approaches
 */
export class BestPracticeEngineService {
  private aiService: AIService;
  private projectService: ProjectService;

  constructor() {
    this.aiService = new AIService();
    this.projectService = new ProjectService();
  }

  /**
   * Analyze successful project patterns and recommend best practices
   */
  async recommendBestPractices(
    projectType: string,
    phase: string,
    project: Project,
    userId: string
  ): Promise<BestPracticeRecommendation[]> {
    // Get historical project data for pattern analysis
    const historicalProjects = await this.getHistoricalProjects(userId, project.disciplines);
    
    // Analyze current project context
    const projectContext = this.analyzeProjectContext(project);
    
    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(
      projectType,
      phase,
      project,
      projectContext,
      historicalProjects
    );

    return recommendations;
  }

  /**
   * Identify process improvements based on project analysis
   */
  async identifyProcessImprovements(
    projectId: string,
    userId: string
  ): Promise<BestPracticeRecommendation[]> {
    const project = await this.projectService.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const prompt = `Analyze the following project and identify potential process improvements:

Project: ${project.name}
Disciplines: ${project.disciplines.join(', ')}
Current Phase: ${project.currentPhase} of ${project.phases.length}
Development Mode: ${project.developmentMode}

Project Status:
${project.phases.map(phase => 
  `- ${phase.name}: ${phase.status} (${phase.sprints.length} sprints)`
).join('\n')}

Team Size: ${project.team.length}
Roles: ${project.dynamicRoles.map(role => role.name).join(', ')}

Based on this project structure and progress, identify:
1. Process bottlenecks or inefficiencies
2. Opportunities for automation
3. Communication improvements
4. Quality assurance enhancements
5. Risk mitigation improvements

For each improvement, provide:
- Title and description
- Expected impact and effort
- Implementation steps
- Success metrics

Return as JSON with improvements array.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: project.name,
          disciplines: project.disciplines,
          requirements: project.requirements,
          constraints: project.constraints,
          developmentMode: project.developmentMode,
          previousPhaseOutputs: [],
          currentPhase: 'process-improvement',
          sprintContext: 'optimization-analysis',
        },
        {
          foresight: 0.9,
          userCentricity: 0.8,
          clarity: 0.9,
        },
        'You are an expert process improvement consultant. Focus on practical, actionable recommendations.'
      );

      const improvementData = JSON.parse(aiResponse.content);
      
      return (improvementData.improvements || []).map((improvement: any, index: number) => ({
        id: `improvement-${Date.now()}-${index}`,
        title: improvement.title || 'Process Improvement',
        description: improvement.description || 'Recommended process improvement',
        category: 'process-improvement' as BestPracticeCategory,
        applicability: improvement.applicability || 0.8,
        impact: improvement.impact || 'medium',
        effort: improvement.effort || 'medium',
        evidence: [{
          source: 'AI Analysis',
          type: 'expert-opinion' as const,
          description: 'Generated from project analysis',
          confidence: 0.7,
        }],
        implementation: {
          steps: improvement.steps || [],
          timeline: improvement.timeline || '2-4 weeks',
          resources: improvement.resources || [],
          successMetrics: improvement.successMetrics || [],
          commonPitfalls: improvement.commonPitfalls || [],
        },
        caseStudies: [],
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error identifying process improvements:', error);
      return [];
    }
  }

  /**
   * Track effectiveness of implemented best practices
   */
  async trackBestPracticeEffectiveness(
    practiceId: string,
    projectId: string,
    metrics: Record<string, number>,
    userId: string
  ): Promise<any> {
    // This would track the effectiveness of implemented best practices
    // For now, return a basic effectiveness report
    return {
      practiceId,
      projectId,
      effectiveness: 0.75,
      metricsImprovement: metrics,
      feedback: [],
      lessonsLearned: [],
      recommendContinuation: true,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get best practices for specific project phase
   */
  async getPhaseBestPractices(
    phase: string,
    disciplines: string[],
    projectScale: string = 'medium'
  ): Promise<BestPracticeRecommendation[]> {
    const prompt = `Provide best practices for the ${phase} phase of an engineering project:

Disciplines: ${disciplines.join(', ')}
Project Scale: ${projectScale}

For the ${phase} phase, recommend:
1. Key activities and deliverables
2. Quality gates and checkpoints
3. Team collaboration practices
4. Risk mitigation strategies
5. Documentation standards
6. Communication protocols

For each best practice, provide:
- Title and description
- Implementation guidance
- Success metrics
- Common pitfalls to avoid

Return as JSON with practices array.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: 'Best Practice Analysis',
          disciplines,
          requirements: '',
          constraints: '',
          developmentMode: 'full',
          previousPhaseOutputs: [],
          currentPhase: phase,
          sprintContext: 'best-practices',
        },
        {
          foresight: 0.9,
          standardsAdherence: 0.9,
          clarity: 0.9,
        },
        'You are an expert engineering project management consultant. Provide proven, actionable best practices.'
      );

      const practicesData = JSON.parse(aiResponse.content);
      
      return (practicesData.practices || []).map((practice: any, index: number) => ({
        id: `phase-practice-${phase}-${index}`,
        title: practice.title || 'Best Practice',
        description: practice.description || 'Recommended best practice',
        category: this.categorizePractice(practice.title || ''),
        applicability: 0.9,
        impact: practice.impact || 'medium',
        effort: practice.effort || 'medium',
        evidence: [{
          source: 'Industry Standards',
          type: 'industry-standard' as const,
          description: 'Based on engineering best practices',
          confidence: 0.9,
        }],
        implementation: {
          steps: practice.steps || [],
          timeline: practice.timeline || '1-2 weeks',
          resources: practice.resources || [],
          successMetrics: practice.successMetrics || [],
          commonPitfalls: practice.commonPitfalls || [],
        },
        caseStudies: [],
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error getting phase best practices:', error);
      return this.getDefaultPhasePractices(phase);
    }
  }

  /**
   * Generate case studies from successful projects
   */
  async generateCaseStudies(
    category: BestPracticeCategory,
    disciplines: string[],
    limit: number = 5
  ): Promise<CaseStudy[]> {
    // This would analyze historical project data to generate case studies
    // For now, return placeholder case studies
    return Array.from({ length: Math.min(limit, 3) }, (_, index) => ({
      id: `case-study-${category}-${index}`,
      title: `${category} Success Story ${index + 1}`,
      summary: `Successful implementation of ${category} practices in ${disciplines.join(', ')} project`,
      outcome: 'Improved project efficiency and quality',
      lessonsLearned: [
        'Early planning is crucial',
        'Team communication is key',
        'Regular reviews prevent issues',
      ],
      applicableScenarios: disciplines,
    }));
  }

  // Private helper methods

  private async getHistoricalProjects(userId: string, disciplines: string[]): Promise<Project[]> {
    try {
      const userProjects = await this.projectService.getUserProjects(userId);
      
      // Filter for completed projects in similar disciplines
      return userProjects.filter(project => 
        project.status === 'completed' &&
        project.disciplines.some(d => disciplines.includes(d))
      );
    } catch (error) {
      console.error('Error getting historical projects:', error);
      return [];
    }
  }

  private analyzeProjectContext(project: Project): any {
    return {
      complexity: this.assessProjectComplexity(project),
      teamSize: project.team.length,
      disciplineCount: project.disciplines.length,
      phaseProgress: project.phases.filter(p => p.status === 'completed').length / project.phases.length,
      riskLevel: project.riskAssessment?.riskLevel || 'medium',
      developmentMode: project.developmentMode,
    };
  }

  private assessProjectComplexity(project: Project): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    // Factor in number of disciplines
    complexityScore += project.disciplines.length * 0.2;
    
    // Factor in number of phases
    complexityScore += project.phases.length * 0.1;
    
    // Factor in team size
    complexityScore += project.team.length * 0.1;
    
    // Factor in number of dynamic roles
    complexityScore += project.dynamicRoles.length * 0.1;

    if (complexityScore < 1) return 'low';
    if (complexityScore < 2) return 'medium';
    return 'high';
  }

  private async generateRecommendations(
    projectType: string,
    phase: string,
    project: Project,
    context: any,
    historicalProjects: Project[]
  ): Promise<BestPracticeRecommendation[]> {
    const prompt = `Generate best practice recommendations for this project:

Current Project:
- Type: ${projectType}
- Phase: ${phase}
- Disciplines: ${project.disciplines.join(', ')}
- Team Size: ${project.team.length}
- Complexity: ${context.complexity}
- Development Mode: ${project.developmentMode}

Historical Context:
- Similar completed projects: ${historicalProjects.length}
- Average success rate: ${historicalProjects.length > 0 ? '85%' : 'No data'}

Generate 3-5 specific, actionable best practice recommendations that would improve this project's success probability.

For each recommendation:
- Focus on the current phase and project characteristics
- Provide clear implementation guidance
- Include success metrics
- Estimate impact and effort

Return as JSON with recommendations array.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: project.name,
          disciplines: project.disciplines,
          requirements: project.requirements,
          constraints: project.constraints,
          developmentMode: project.developmentMode,
          previousPhaseOutputs: [],
          currentPhase: phase,
          sprintContext: 'best-practice-recommendations',
        },
        {
          foresight: 0.9,
          userCentricity: 0.8,
          clarity: 0.9,
        },
        'You are an expert project management consultant. Generate practical, evidence-based recommendations.'
      );

      const recommendationData = JSON.parse(aiResponse.content);
      
      return (recommendationData.recommendations || []).map((rec: any, index: number) => ({
        id: `recommendation-${Date.now()}-${index}`,
        title: rec.title || 'Best Practice Recommendation',
        description: rec.description || 'Recommended best practice',
        category: this.categorizePractice(rec.title || ''),
        applicability: rec.applicability || 0.8,
        impact: rec.impact || 'medium',
        effort: rec.effort || 'medium',
        evidence: [{
          source: 'Project Analysis',
          type: 'project-data' as const,
          description: 'Based on current project analysis and historical data',
          confidence: 0.8,
        }],
        implementation: {
          steps: rec.steps || [],
          timeline: rec.timeline || '1-3 weeks',
          resources: rec.resources || [],
          successMetrics: rec.successMetrics || [],
          commonPitfalls: rec.commonPitfalls || [],
        },
        caseStudies: [],
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getDefaultRecommendations(phase);
    }
  }

  private categorizePractice(title: string): BestPracticeCategory {
    const keywords: Record<BestPracticeCategory, string[]> = {
      'project-management': ['schedule', 'timeline', 'milestone', 'planning', 'scope'],
      'team-collaboration': ['team', 'communication', 'collaboration', 'meeting', 'coordination'],
      'risk-management': ['risk', 'mitigation', 'contingency', 'uncertainty', 'threat'],
      'quality-assurance': ['quality', 'testing', 'review', 'validation', 'verification'],
      'documentation': ['document', 'specification', 'record', 'report', 'manual'],
      'communication': ['communication', 'stakeholder', 'reporting', 'update', 'feedback'],
      'technical-approach': ['technical', 'design', 'architecture', 'implementation', 'solution'],
      'process-improvement': ['process', 'improvement', 'efficiency', 'optimization', 'workflow'],
    };

    const lowerTitle = title.toLowerCase();
    
    for (const [category, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(keyword => lowerTitle.includes(keyword))) {
        return category as BestPracticeCategory;
      }
    }

    return 'project-management';
  }

  private getDefaultPhasePractices(phase: string): BestPracticeRecommendation[] {
    const defaultPractices: Record<string, Partial<BestPracticeRecommendation>[]> = {
      'Requirements': [
        {
          title: 'Stakeholder Requirements Review',
          description: 'Conduct thorough stakeholder review of requirements',
          category: 'project-management',
          impact: 'high',
          effort: 'medium',
        },
      ],
      'Preliminary Design': [
        {
          title: 'Design Alternative Analysis',
          description: 'Evaluate multiple design alternatives before selection',
          category: 'technical-approach',
          impact: 'high',
          effort: 'medium',
        },
      ],
      'Testing': [
        {
          title: 'Test-Driven Verification',
          description: 'Implement comprehensive test planning and execution',
          category: 'quality-assurance',
          impact: 'high',
          effort: 'high',
        },
      ],
    };

    const practices = defaultPractices[phase] || [];
    
    return practices.map((practice, index) => ({
      id: `default-${phase}-${index}`,
      title: practice.title || 'Best Practice',
      description: practice.description || 'Recommended practice',
      category: practice.category || 'project-management',
      applicability: 0.8,
      impact: practice.impact || 'medium',
      effort: practice.effort || 'medium',
      evidence: [{
        source: 'Industry Standards',
        type: 'industry-standard' as const,
        description: 'Standard engineering practice',
        confidence: 0.9,
      }],
      implementation: {
        steps: ['Plan implementation', 'Execute practice', 'Monitor results'],
        timeline: '1-2 weeks',
        resources: ['Team time', 'Management support'],
        successMetrics: ['Practice adoption', 'Quality improvement'],
        commonPitfalls: ['Insufficient planning', 'Lack of follow-through'],
      },
      caseStudies: [],
      createdAt: new Date(),
    }));
  }

  private getDefaultRecommendations(phase: string): BestPracticeRecommendation[] {
    return [{
      id: `default-rec-${phase}`,
      title: 'Phase Best Practices',
      description: `Follow established best practices for the ${phase} phase`,
      category: 'project-management',
      applicability: 0.7,
      impact: 'medium',
      effort: 'low',
      evidence: [{
        source: 'Default Recommendations',
        type: 'industry-standard',
        description: 'Standard project management practices',
        confidence: 0.8,
      }],
      implementation: {
        steps: ['Review phase requirements', 'Apply standard practices', 'Monitor progress'],
        timeline: '1 week',
        resources: ['Project team'],
        successMetrics: ['Phase completion', 'Quality deliverables'],
        commonPitfalls: ['Skipping reviews', 'Inadequate documentation'],
      },
      caseStudies: [],
      createdAt: new Date(),
    }];
  }
}