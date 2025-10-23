import { Project, Risk, RiskAssessment, MitigationPlan, RiskPrediction } from '@shared/types';
import { AIService } from './AIService';
import { ProjectService } from './ProjectService';

export interface RiskAnalysisConfig {
  includeHistoricalData: boolean;
  riskThreshold: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  timeHorizon: number; // days
}

export interface RiskMetrics {
  scheduleRisk: number;
  budgetRisk: number;
  technicalRisk: number;
  resourceRisk: number;
  complianceRisk: number;
  overallRisk: number;
}

/**
 * Risk Engine Service for AI-powered project risk analysis
 * Provides basic project risk assessment and mitigation strategies
 */
export class RiskEngineService {
  private aiService: AIService;
  private projectService: ProjectService;

  constructor() {
    this.aiService = new AIService();
    this.projectService = new ProjectService();
  }

  /**
   * Analyze project risks using AI
   */
  async analyzeProjectRisks(
    projectId: string,
    userId: string,
    config: RiskAnalysisConfig = {
      includeHistoricalData: false,
      riskThreshold: 0.5,
      analysisDepth: 'basic',
      timeHorizon: 90,
    }
  ): Promise<RiskAssessment> {
    const project = await this.projectService.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Use the existing AI service risk analysis
    const basicRiskAnalysis = await this.aiService.analyzeRisk(project);

    // Enhance with additional risk metrics
    const riskMetrics = this.calculateRiskMetrics(project, basicRiskAnalysis.risks);
    
    // Generate mitigation plans
    const mitigationPlans = await this.generateMitigationPlans(
      basicRiskAnalysis.risks,
      project,
      config
    );

    // Predict future risks
    const futureRisks = await this.predictFutureRisks(project, config.timeHorizon);

    const riskAssessment: RiskAssessment = {
      projectId,
      overallRiskScore: basicRiskAnalysis.overallScore,
      riskLevel: this.categorizeRiskLevel(basicRiskAnalysis.overallScore),
      risks: basicRiskAnalysis.risks,
      mitigationPlans,
      futureRisks,
      trendAnalysis: [],
      recommendations: this.generateRiskRecommendations(basicRiskAnalysis.risks),
      bestPractices: [],
      assessmentDate: new Date(),
      confidence: basicRiskAnalysis.confidenceLevel,
      modelVersion: '1.0',
      dataQuality: {
        completeness: 0.8,
        accuracy: 0.75,
        timeliness: 0.9,
      },
    };

    return riskAssessment;
  }

  /**
   * Generate mitigation strategies for identified risks
   */
  async generateMitigationPlans(
    risks: Risk[],
    project: Project,
    config: RiskAnalysisConfig
  ): Promise<MitigationPlan[]> {
    const mitigationPlans: MitigationPlan[] = [];

    for (const risk of risks) {
      const prompt = `Generate a detailed mitigation plan for the following project risk:

Risk Type: ${risk.type}
Risk Description: ${risk.description}
Probability: ${risk.probability}
Impact: ${risk.impact}

Project Context:
- Name: ${project.name}
- Disciplines: ${project.disciplines.join(', ')}
- Development Mode: ${project.developmentMode}
- Current Phase: ${project.currentPhase}

Generate a mitigation plan with:
1. Primary mitigation strategy
2. Alternative approaches
3. Required resources
4. Timeline for implementation
5. Success metrics
6. Contingency plans

Return as JSON with: strategy, alternatives, resources, timeline, metrics, contingency.`;

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
            currentPhase: 'risk-mitigation',
            sprintContext: 'mitigation-planning',
          },
          {},
          'You are an expert project risk management consultant. Generate practical, actionable mitigation plans.'
        );

        const mitigationData = JSON.parse(aiResponse.content);
        
        mitigationPlans.push({
          id: `mitigation-${risk.id}`,
          riskId: risk.id,
          primaryStrategy: mitigationData.strategy || 'Monitor and assess regularly',
          alternativeStrategies: mitigationData.alternatives || [],
          requiredResources: mitigationData.resources || [],
          timeline: mitigationData.timeline || '2-4 weeks',
          successMetrics: mitigationData.metrics || [],
          contingencyPlan: mitigationData.contingency || 'Escalate to project leadership',
          estimatedCost: 0, // Would be calculated based on resources
          priority: this.calculateMitigationPriority(risk),
          status: 'planned',
          assignedTo: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Error generating mitigation plan:', error);
        
        // Fallback mitigation plan
        mitigationPlans.push({
          id: `mitigation-${risk.id}`,
          riskId: risk.id,
          primaryStrategy: this.getDefaultMitigationStrategy(risk.type),
          alternativeStrategies: [],
          requiredResources: ['Project team time', 'Management attention'],
          timeline: '1-2 weeks',
          successMetrics: ['Risk probability reduced', 'Impact minimized'],
          contingencyPlan: 'Escalate to project leadership for additional resources',
          estimatedCost: 0,
          priority: this.calculateMitigationPriority(risk),
          status: 'planned',
          assignedTo: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return mitigationPlans;
  }

  /**
   * Predict future risks based on project trajectory
   */
  async predictFutureRisks(project: Project, timeHorizon: number): Promise<RiskPrediction[]> {
    const prompt = `Analyze the following project and predict potential future risks over the next ${timeHorizon} days:

Project: ${project.name}
Disciplines: ${project.disciplines.join(', ')}
Current Phase: ${project.currentPhase} of ${project.phases.length}
Development Mode: ${project.developmentMode}

Requirements: ${project.requirements}
Constraints: ${project.constraints}

Based on the project's current state and trajectory, identify potential risks that may emerge in the coming ${timeHorizon} days.
Consider:
- Phase transitions and their typical challenges
- Resource allocation changes
- Technical complexity increases
- External dependencies
- Market or regulatory changes

Return as JSON with predictions array containing: riskType, description, probability, timeframe, triggers, earlyWarnings.`;

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
          currentPhase: 'risk-prediction',
          sprintContext: 'future-risk-analysis',
        },
        {},
        'You are an expert project risk analyst with predictive capabilities. Focus on realistic, actionable risk predictions.'
      );

      const predictionData = JSON.parse(aiResponse.content);
      
      return (predictionData.predictions || []).map((pred: any, index: number) => ({
        id: `prediction-${Date.now()}-${index}`,
        riskType: pred.riskType || 'technical',
        description: pred.description || 'Potential future risk',
        probability: pred.probability || 0.3,
        timeframe: pred.timeframe || `${timeHorizon} days`,
        triggers: pred.triggers || [],
        earlyWarnings: pred.earlyWarnings || [],
        confidence: 0.6,
        modelVersion: '1.0',
        predictedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error predicting future risks:', error);
      return [];
    }
  }

  /**
   * Track mitigation effectiveness over time
   */
  async trackMitigationEffectiveness(
    planId: string,
    projectId: string,
    userId: string
  ): Promise<any> {
    // This would track the effectiveness of mitigation plans over time
    // For now, return a basic structure
    return {
      planId,
      effectiveness: 0.7,
      metricsAchieved: [],
      lessonsLearned: [],
      recommendations: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Get risk trends for a project over time
   */
  async getRiskTrends(projectId: string, userId: string, days: number = 30): Promise<any[]> {
    // This would analyze risk trends over time
    // For now, return empty array as this requires historical data
    return [];
  }

  // Private helper methods

  private calculateRiskMetrics(project: Project, risks: Risk[]): RiskMetrics {
    const risksByType = risks.reduce((acc, risk) => {
      acc[risk.type] = acc[risk.type] || [];
      acc[risk.type].push(risk);
      return acc;
    }, {} as Record<string, Risk[]>);

    const calculateTypeRisk = (type: string) => {
      const typeRisks = risksByType[type] || [];
      if (typeRisks.length === 0) return 0;
      
      return typeRisks.reduce((sum, risk) => sum + (risk.probability * risk.impact), 0) / typeRisks.length;
    };

    const scheduleRisk = calculateTypeRisk('schedule');
    const budgetRisk = calculateTypeRisk('budget');
    const technicalRisk = calculateTypeRisk('technical');
    const resourceRisk = calculateTypeRisk('resource');
    const complianceRisk = calculateTypeRisk('compliance');

    const overallRisk = (scheduleRisk + budgetRisk + technicalRisk + resourceRisk + complianceRisk) / 5;

    return {
      scheduleRisk,
      budgetRisk,
      technicalRisk,
      resourceRisk,
      complianceRisk,
      overallRisk,
    };
  }

  private categorizeRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 0.25) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.75) return 'high';
    return 'critical';
  }

  private generateRiskRecommendations(risks: Risk[]): any[] {
    const recommendations = [];

    // High-impact risks
    const highImpactRisks = risks.filter(risk => risk.impact > 0.7);
    if (highImpactRisks.length > 0) {
      recommendations.push({
        id: 'high-impact-focus',
        title: 'Focus on High-Impact Risks',
        description: 'Prioritize mitigation efforts on risks with high potential impact',
        priority: 'high',
        actionItems: [
          'Review high-impact risks weekly',
          'Assign dedicated resources to mitigation',
          'Develop contingency plans',
        ],
      });
    }

    // Technical risks
    const technicalRisks = risks.filter(risk => risk.type === 'technical');
    if (technicalRisks.length > 2) {
      recommendations.push({
        id: 'technical-review',
        title: 'Technical Risk Review',
        description: 'Multiple technical risks identified - consider technical review',
        priority: 'medium',
        actionItems: [
          'Conduct technical architecture review',
          'Engage subject matter experts',
          'Consider proof-of-concept development',
        ],
      });
    }

    return recommendations;
  }

  private calculateMitigationPriority(risk: Risk): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = risk.probability * risk.impact;
    return this.categorizeRiskLevel(riskScore);
  }

  private getDefaultMitigationStrategy(riskType: string): string {
    const strategies: Record<string, string> = {
      schedule: 'Implement buffer time and parallel work streams where possible',
      budget: 'Establish cost monitoring and approval processes for changes',
      technical: 'Conduct technical reviews and proof-of-concept development',
      resource: 'Cross-train team members and identify backup resources',
      compliance: 'Engage compliance experts and conduct regular audits',
    };

    return strategies[riskType] || 'Monitor closely and escalate when thresholds are exceeded';
  }
}