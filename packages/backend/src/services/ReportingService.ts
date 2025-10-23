import { query } from '../database/connection';
import { AnalyticsService } from './AnalyticsService';
import { AIService } from './AIService';
import { NotificationService } from './NotificationService';
import { ProjectAnalytics } from '@shared/types';

export interface ReportConfig {
  projectId: string;
  reportType: 'executive' | 'technical' | 'performance' | 'risk';
  recipients: string[];
  schedule?: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  includeRiskAnalysis?: boolean;
  includeRecommendations?: boolean;
}

export interface GeneratedReport {
  id: string;
  projectId: string;
  reportType: string;
  title: string;
  summary: string;
  sections: ReportSection[];
  insights: string[];
  recommendations: string[];
  riskAlerts: RiskAlert[];
  generatedAt: Date;
  generatedBy: 'ai' | 'manual';
}

export interface ReportSection {
  title: string;
  content: string;
  data?: any;
  visualizations?: any[];
}

export interface RiskAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

export class ReportingService {
  private analyticsService: AnalyticsService;
  private aiService: AIService;
  private notificationService: NotificationService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.aiService = new AIService();
    this.notificationService = new NotificationService();
  }

  // Generate AI-powered report
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    try {
      // Get project analytics
      const analytics = await this.analyticsService.getProjectAnalytics(config.projectId);
      
      // Get project details
      const projectResult = await query(
        'SELECT * FROM projects WHERE id = $1',
        [config.projectId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];

      // Generate report based on type
      let report: GeneratedReport;

      switch (config.reportType) {
        case 'executive':
          report = await this.generateExecutiveReport(project, analytics);
          break;
        case 'technical':
          report = await this.generateTechnicalReport(project, analytics);
          break;
        case 'performance':
          report = await this.generatePerformanceReport(project, analytics);
          break;
        case 'risk':
          report = await this.generateRiskReport(project, analytics);
          break;
        default:
          throw new Error(`Unknown report type: ${config.reportType}`);
      }

      // Add AI insights if requested
      if (config.includeRecommendations) {
        report.insights = await this.generateAIInsights(project, analytics);
        report.recommendations = await this.generateRecommendations(project, analytics);
      }

      // Add risk analysis if requested
      if (config.includeRiskAnalysis) {
        report.riskAlerts = await this.generateRiskAlerts(project, analytics);
      }

      // Save report to database
      await this.saveReport(report);

      // Send to recipients if specified
      if (config.recipients && config.recipients.length > 0) {
        await this.distributeReport(report, config.recipients);
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Generate executive summary report
  private async generateExecutiveReport(project: any, analytics: ProjectAnalytics): Promise<GeneratedReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const summary = `Project "${project.name}" is ${analytics.metrics.completionPercentage.toFixed(1)}% complete with an estimated completion date of ${analytics.metrics.estimatedCompletionDate.toLocaleDateString()}. The team of ${analytics.teamPerformance.teamSize} members has completed ${analytics.metrics.completedTasks} of ${analytics.metrics.totalTasks} tasks.`;

    const sections: ReportSection[] = [
      {
        title: 'Project Overview',
        content: `The project has been active for ${analytics.metrics.daysElapsed} days and is progressing at a velocity of ${analytics.metrics.velocity.toFixed(2)} sprints per day. Current status shows ${analytics.metrics.completedPhases} of ${analytics.metrics.totalPhases} phases completed.`,
        data: {
          completionPercentage: analytics.metrics.completionPercentage,
          estimatedCompletion: analytics.metrics.estimatedCompletionDate,
          daysElapsed: analytics.metrics.daysElapsed,
          daysRemaining: analytics.metrics.estimatedDaysRemaining,
        },
      },
      {
        title: 'Team Performance',
        content: `The team has achieved a ${analytics.teamPerformance.teamCompletionRate.toFixed(1)}% task completion rate, with ${analytics.teamPerformance.totalHoursWorked.toFixed(0)} hours logged. Top performers are contributing significantly to project progress.`,
        data: {
          teamSize: analytics.teamPerformance.teamSize,
          completionRate: analytics.teamPerformance.teamCompletionRate,
          totalHours: analytics.teamPerformance.totalHoursWorked,
          topPerformers: analytics.teamPerformance.topPerformers,
        },
      },
      {
        title: 'Key Metrics',
        content: `Efficiency ratio stands at ${analytics.metrics.efficiencyRatio.toFixed(1)}%, indicating ${analytics.metrics.efficiencyRatio > 100 ? 'tasks are taking longer than estimated' : 'tasks are being completed efficiently'}.`,
        data: {
          velocity: analytics.metrics.velocity,
          efficiencyRatio: analytics.metrics.efficiencyRatio,
          blockedTasks: analytics.metrics.blockedTasks,
        },
      },
    ];

    return {
      id: reportId,
      projectId: project.id,
      reportType: 'executive',
      title: `Executive Summary - ${project.name}`,
      summary,
      sections,
      insights: [],
      recommendations: [],
      riskAlerts: [],
      generatedAt: new Date(),
      generatedBy: 'ai',
    };
  }

  // Generate technical progress report
  private async generateTechnicalReport(project: any, analytics: ProjectAnalytics): Promise<GeneratedReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const phases = JSON.parse(project.phases || '[]');
    
    const summary = `Technical progress report for "${project.name}" covering ${analytics.metrics.totalPhases} phases and ${analytics.metrics.totalSprints} sprints. Current development velocity is ${analytics.metrics.velocity.toFixed(3)} sprints/day.`;

    const sections: ReportSection[] = [
      {
        title: 'Phase Breakdown',
        content: `Detailed analysis of all ${phases.length} project phases with completion status and deliverables.`,
        data: {
          phases: phases.map((phase: any) => ({
            name: phase.name,
            status: phase.status,
            sprints: phase.sprints?.length || 0,
            completedSprints: phase.sprints?.filter((s: any) => s.status === 'completed').length || 0,
          })),
        },
      },
      {
        title: 'Sprint Analysis',
        content: `Total of ${analytics.metrics.totalSprints} sprints with ${analytics.metrics.completedSprints} completed (${analytics.metrics.sprintCompletionPercentage.toFixed(1)}%).`,
        data: {
          totalSprints: analytics.metrics.totalSprints,
          completedSprints: analytics.metrics.completedSprints,
          completionPercentage: analytics.metrics.sprintCompletionPercentage,
        },
      },
      {
        title: 'Time Tracking',
        content: `Comprehensive time analysis showing ${analytics.timeTracking.totalHoursTracked.toFixed(0)} hours tracked across all phases.`,
        data: {
          phaseBreakdown: analytics.timeTracking.phaseTimeBreakdown,
          totalHours: analytics.timeTracking.totalHoursTracked,
        },
      },
      {
        title: 'Team Contributions',
        content: `Individual team member contributions and task completion rates.`,
        data: {
          contributions: analytics.teamPerformance.memberContributions,
        },
      },
    ];

    return {
      id: reportId,
      projectId: project.id,
      reportType: 'technical',
      title: `Technical Progress Report - ${project.name}`,
      summary,
      sections,
      insights: [],
      recommendations: [],
      riskAlerts: [],
      generatedAt: new Date(),
      generatedBy: 'ai',
    };
  }

  // Generate performance report
  private async generatePerformanceReport(project: any, analytics: ProjectAnalytics): Promise<GeneratedReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const summary = `Performance analysis for "${project.name}" showing team efficiency of ${analytics.metrics.efficiencyRatio.toFixed(1)}% and completion rate of ${analytics.teamPerformance.teamCompletionRate.toFixed(1)}%.`;

    const sections: ReportSection[] = [
      {
        title: 'Efficiency Analysis',
        content: `The team is ${analytics.metrics.efficiencyRatio > 100 ? 'exceeding' : 'within'} estimated time allocations with an efficiency ratio of ${analytics.metrics.efficiencyRatio.toFixed(1)}%.`,
        data: {
          estimatedHours: analytics.metrics.totalEstimatedHours,
          actualHours: analytics.metrics.totalActualHours,
          efficiencyRatio: analytics.metrics.efficiencyRatio,
        },
      },
      {
        title: 'Velocity Trends',
        content: `Project velocity analysis showing current sprint completion rate and historical trends.`,
        data: {
          currentVelocity: analytics.metrics.velocity,
          progressTrends: analytics.progressTrends,
        },
      },
      {
        title: 'Team Performance Metrics',
        content: `Individual and team-wide performance indicators including task completion rates and hour utilization.`,
        data: {
          teamMetrics: analytics.teamPerformance,
        },
      },
      {
        title: 'Bottlenecks and Blockers',
        content: `Analysis of blocked tasks and potential performance impediments.`,
        data: {
          blockedTasks: analytics.metrics.blockedTasks,
          inProgressTasks: analytics.metrics.inProgressTasks,
        },
      },
    ];

    return {
      id: reportId,
      projectId: project.id,
      reportType: 'performance',
      title: `Performance Analysis - ${project.name}`,
      summary,
      sections,
      insights: [],
      recommendations: [],
      riskAlerts: [],
      generatedAt: new Date(),
      generatedBy: 'ai',
    };
  }

  // Generate risk report
  private async generateRiskReport(project: any, analytics: ProjectAnalytics): Promise<GeneratedReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Analyze risks
    const risks: RiskAlert[] = [];

    // Check for schedule risks
    if (analytics.metrics.velocity < 0.1) {
      risks.push({
        severity: 'high',
        title: 'Low Project Velocity',
        description: `Current velocity of ${analytics.metrics.velocity.toFixed(3)} sprints/day is significantly below optimal levels.`,
        recommendation: 'Review team capacity, remove blockers, and consider resource reallocation.',
      });
    }

    // Check for efficiency risks
    if (analytics.metrics.efficiencyRatio > 150) {
      risks.push({
        severity: 'medium',
        title: 'Efficiency Concerns',
        description: `Tasks are taking ${analytics.metrics.efficiencyRatio.toFixed(0)}% of estimated time, indicating potential estimation or execution issues.`,
        recommendation: 'Review estimation process and identify causes of delays.',
      });
    }

    // Check for blocked tasks
    if (analytics.metrics.blockedTasks > 0) {
      risks.push({
        severity: analytics.metrics.blockedTasks > 5 ? 'high' : 'medium',
        title: 'Blocked Tasks',
        description: `${analytics.metrics.blockedTasks} tasks are currently blocked, impacting project progress.`,
        recommendation: 'Prioritize unblocking tasks and address dependencies.',
      });
    }

    // Check for team performance risks
    const lowPerformers = analytics.teamPerformance.memberContributions.filter(m => m.completionRate < 50);
    if (lowPerformers.length > 0) {
      risks.push({
        severity: 'medium',
        title: 'Team Performance Variance',
        description: `${lowPerformers.length} team members have completion rates below 50%.`,
        recommendation: 'Provide additional support, training, or task reassignment as needed.',
      });
    }

    const summary = `Risk assessment for "${project.name}" identified ${risks.length} potential concerns requiring attention.`;

    const sections: ReportSection[] = [
      {
        title: 'Risk Overview',
        content: `Comprehensive risk analysis covering schedule, efficiency, and team performance factors.`,
        data: {
          totalRisks: risks.length,
          criticalRisks: risks.filter(r => r.severity === 'critical').length,
          highRisks: risks.filter(r => r.severity === 'high').length,
          mediumRisks: risks.filter(r => r.severity === 'medium').length,
        },
      },
      {
        title: 'Identified Risks',
        content: `Detailed breakdown of all identified risks with severity levels and recommendations.`,
        data: { risks },
      },
    ];

    return {
      id: reportId,
      projectId: project.id,
      reportType: 'risk',
      title: `Risk Assessment - ${project.name}`,
      summary,
      sections,
      insights: [],
      recommendations: [],
      riskAlerts: risks,
      generatedAt: new Date(),
      generatedBy: 'ai',
    };
  }

  // Generate AI insights
  private async generateAIInsights(project: any, analytics: ProjectAnalytics): Promise<string[]> {
    const insights: string[] = [];

    // Velocity insights
    if (analytics.metrics.velocity > 0.5) {
      insights.push('Project is maintaining strong velocity with consistent sprint completion.');
    } else if (analytics.metrics.velocity < 0.1) {
      insights.push('Project velocity is below optimal levels, suggesting potential resource or planning issues.');
    }

    // Efficiency insights
    if (analytics.metrics.efficiencyRatio < 90) {
      insights.push('Team is completing tasks faster than estimated, indicating strong performance or conservative estimates.');
    } else if (analytics.metrics.efficiencyRatio > 120) {
      insights.push('Tasks are taking longer than estimated, suggesting need for better estimation or additional resources.');
    }

    // Team insights
    if (analytics.teamPerformance.teamCompletionRate > 80) {
      insights.push('Team demonstrates high task completion rate, indicating effective collaboration and execution.');
    }

    // Trend insights
    if (analytics.progressTrends.length > 7) {
      const recentTrends = analytics.progressTrends.slice(-7);
      const avgRecentActivity = recentTrends.reduce((sum, t) => sum + t.teamActivity, 0) / recentTrends.length;
      
      if (avgRecentActivity > 10) {
        insights.push('Recent activity levels show strong team engagement and progress momentum.');
      }
    }

    return insights;
  }

  // Generate recommendations
  private async generateRecommendations(project: any, analytics: ProjectAnalytics): Promise<string[]> {
    const recommendations: string[] = [];

    // Velocity recommendations
    if (analytics.metrics.velocity < 0.1) {
      recommendations.push('Consider breaking down sprints into smaller, more manageable tasks to improve velocity.');
      recommendations.push('Review and remove any blockers preventing task completion.');
    }

    // Efficiency recommendations
    if (analytics.metrics.efficiencyRatio > 150) {
      recommendations.push('Improve estimation accuracy by reviewing historical data and team capacity.');
      recommendations.push('Identify and address recurring causes of task delays.');
    }

    // Team recommendations
    if (analytics.teamPerformance.teamSize > 0) {
      const avgHoursPerMember = analytics.teamPerformance.averageHoursPerMember;
      if (avgHoursPerMember < 10) {
        recommendations.push('Increase team engagement through better task distribution and clearer objectives.');
      }
    }

    // Blocked tasks recommendations
    if (analytics.metrics.blockedTasks > 0) {
      recommendations.push('Prioritize unblocking tasks to maintain project momentum.');
      recommendations.push('Implement daily standups to identify and resolve blockers quickly.');
    }

    return recommendations;
  }

  // Generate risk alerts
  private async generateRiskAlerts(project: any, analytics: ProjectAnalytics): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    // Schedule risk
    if (analytics.metrics.estimatedDaysRemaining > analytics.metrics.daysElapsed * 2) {
      alerts.push({
        severity: 'high',
        title: 'Schedule Risk',
        description: 'Estimated completion time significantly exceeds time already spent.',
        recommendation: 'Review project scope and consider additional resources or timeline adjustment.',
      });
    }

    // Resource risk
    if (analytics.teamPerformance.teamSize < 3 && analytics.metrics.totalTasks > 50) {
      alerts.push({
        severity: 'medium',
        title: 'Resource Constraint',
        description: 'Small team size relative to total task count may impact delivery timeline.',
        recommendation: 'Consider expanding team or reducing scope to match available resources.',
      });
    }

    return alerts;
  }

  // Save report to database
  private async saveReport(report: GeneratedReport): Promise<void> {
    try {
      await query(`
        INSERT INTO generated_reports (
          id, project_id, report_type, title, summary, 
          sections, insights, recommendations, risk_alerts,
          generated_at, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        report.id,
        report.projectId,
        report.reportType,
        report.title,
        report.summary,
        JSON.stringify(report.sections),
        JSON.stringify(report.insights),
        JSON.stringify(report.recommendations),
        JSON.stringify(report.riskAlerts),
        report.generatedAt,
        report.generatedBy,
      ]);
    } catch (error) {
      console.error('Error saving report:', error);
      // Don't throw - report generation succeeded even if save failed
    }
  }

  // Distribute report to recipients
  private async distributeReport(report: GeneratedReport, recipients: string[]): Promise<void> {
    try {
      for (const email of recipients) {
        await this.notificationService.sendEmail({
          to: email,
          subject: report.title,
          template: 'report-notification',
          data: {
            reportTitle: report.title,
            reportSummary: report.summary,
            reportType: report.reportType,
            generatedAt: report.generatedAt.toLocaleString(),
            reportUrl: `${process.env.APP_URL}/reports/${report.id}`,
          },
        });
      }
    } catch (error) {
      console.error('Error distributing report:', error);
      // Don't throw - report was generated successfully
    }
  }

  // Schedule automated reports
  async scheduleReport(config: ReportConfig): Promise<string> {
    try {
      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await query(`
        INSERT INTO report_schedules (
          id, project_id, report_type, recipients, schedule, 
          include_risk_analysis, include_recommendations, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `, [
        scheduleId,
        config.projectId,
        config.reportType,
        JSON.stringify(config.recipients),
        config.schedule,
        config.includeRiskAnalysis || false,
        config.includeRecommendations || false,
      ]);

      return scheduleId;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  // Get report by ID
  async getReport(reportId: string): Promise<GeneratedReport | null> {
    try {
      const result = await query(
        'SELECT * FROM generated_reports WHERE id = $1',
        [reportId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        reportType: row.report_type,
        title: row.title,
        summary: row.summary,
        sections: JSON.parse(row.sections),
        insights: JSON.parse(row.insights),
        recommendations: JSON.parse(row.recommendations),
        riskAlerts: JSON.parse(row.risk_alerts),
        generatedAt: row.generated_at,
        generatedBy: row.generated_by,
      };
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  // Get reports for a project
  async getProjectReports(projectId: string, limit: number = 10): Promise<GeneratedReport[]> {
    try {
      const result = await query(
        'SELECT * FROM generated_reports WHERE project_id = $1 ORDER BY generated_at DESC LIMIT $2',
        [projectId, limit]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        reportType: row.report_type,
        title: row.title,
        summary: row.summary,
        sections: JSON.parse(row.sections),
        insights: JSON.parse(row.insights),
        recommendations: JSON.parse(row.recommendations),
        riskAlerts: JSON.parse(row.risk_alerts),
        generatedAt: row.generated_at,
        generatedBy: row.generated_by,
      }));
    } catch (error) {
      console.error('Error getting project reports:', error);
      throw error;
    }
  }
}
