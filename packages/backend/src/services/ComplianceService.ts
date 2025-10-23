import { query } from '../database/connection';
import { ComplianceRequirement } from '@shared/types';

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  applicableSections: ComplianceSection[];
  requirements: string[];
}

export interface ComplianceSection {
  id: string;
  sectionNumber: string;
  title: string;
  description: string;
  requirements: string[];
  checklistItems: string[];
}

export interface ComplianceGap {
  id: string;
  projectId: string;
  standard: string;
  section: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  dueDate?: Date;
}

export interface ComplianceReport {
  id: string;
  projectId: string;
  reportType: 'status' | 'gap-analysis' | 'audit-ready' | 'submission';
  generatedAt: Date;
  overallStatus: 'compliant' | 'non-compliant' | 'in-progress';
  complianceScore: number;
  frameworks: ComplianceFrameworkStatus[];
  gaps: ComplianceGap[];
  recommendations: string[];
}

export interface ComplianceFrameworkStatus {
  framework: string;
  version: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
  completionPercentage: number;
  compliantSections: number;
  totalSections: number;
  lastAssessed: Date;
}

export class ComplianceService {
  // Get available compliance frameworks
  async getAvailableFrameworks(): Promise<ComplianceFramework[]> {
    // Predefined compliance frameworks
    return [
      {
        id: 'iso-9001',
        name: 'ISO 9001',
        version: '2015',
        description: 'Quality Management Systems',
        applicableSections: [
          {
            id: 'iso-9001-4',
            sectionNumber: '4',
            title: 'Context of the Organization',
            description: 'Understanding organizational context and stakeholder needs',
            requirements: [
              'Determine external and internal issues',
              'Understand needs and expectations of interested parties',
              'Determine scope of QMS',
            ],
            checklistItems: [
              'Document organizational context',
              'Identify stakeholders',
              'Define QMS scope',
            ],
          },
          {
            id: 'iso-9001-5',
            sectionNumber: '5',
            title: 'Leadership',
            description: 'Leadership and commitment to quality management',
            requirements: [
              'Demonstrate leadership and commitment',
              'Establish quality policy',
              'Define organizational roles and responsibilities',
            ],
            checklistItems: [
              'Quality policy documented',
              'Roles and responsibilities assigned',
              'Management commitment demonstrated',
            ],
          },
        ],
        requirements: [
          'Quality Management System documentation',
          'Process approach implementation',
          'Risk-based thinking',
          'Continuous improvement',
        ],
      },
      {
        id: 'fda-21-cfr-820',
        name: 'FDA 21 CFR Part 820',
        version: '2023',
        description: 'Quality System Regulation for Medical Devices',
        applicableSections: [
          {
            id: 'fda-820-30',
            sectionNumber: '820.30',
            title: 'Design Controls',
            description: 'Design and development planning and controls',
            requirements: [
              'Design and development planning',
              'Design input requirements',
              'Design output documentation',
              'Design review procedures',
              'Design verification and validation',
            ],
            checklistItems: [
              'Design plan documented',
              'Design inputs defined',
              'Design outputs verified',
              'Design reviews conducted',
              'Validation completed',
            ],
          },
        ],
        requirements: [
          'Design controls',
          'Document controls',
          'Corrective and preventive actions',
          'Production and process controls',
        ],
      },
    ];
  }

  // Track compliance for a project
  async trackProjectCompliance(
    projectId: string,
    frameworkId: string,
    version: string
  ): Promise<ComplianceRequirement> {
    try {
      const requirementId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await query(`
        INSERT INTO compliance_requirements (
          id, project_id, standard, version, applicable_sections,
          status, last_assessed
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        requirementId,
        projectId,
        frameworkId,
        version,
        JSON.stringify([]),
        'pending',
      ]);

      return {
        id: requirementId,
        standard: frameworkId,
        version,
        applicableSections: [],
        status: 'pending',
        lastAssessed: new Date(),
      };
    } catch (error) {
      console.error('Error tracking compliance:', error);
      throw error;
    }
  }

  // Perform compliance gap analysis
  async performGapAnalysis(projectId: string): Promise<ComplianceGap[]> {
    try {
      // Get project compliance requirements
      const complianceResult = await query(
        'SELECT * FROM compliance_requirements WHERE project_id = $1',
        [projectId]
      );

      if (complianceResult.rows.length === 0) {
        return [];
      }

      const gaps: ComplianceGap[] = [];

      // Get project data
      const projectResult = await query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return [];
      }

      const project = projectResult.rows[0];
      const phases = JSON.parse(project.phases || '[]');

      // Check for documentation gaps
      const hasRequirements = project.requirements && project.requirements.length > 0;
      if (!hasRequirements) {
        gaps.push({
          id: `gap_${Date.now()}_1`,
          projectId,
          standard: 'ISO 9001',
          section: '4.4',
          description: 'Missing project requirements documentation',
          severity: 'high',
          recommendation: 'Document comprehensive project requirements including functional and non-functional requirements.',
        });
      }

      // Check for design review gaps
      const hasDesignReviews = phases.some((p: any) => p.designReview?.required);
      if (!hasDesignReviews) {
        gaps.push({
          id: `gap_${Date.now()}_2`,
          projectId,
          standard: 'FDA 21 CFR 820.30',
          section: '820.30(e)',
          description: 'Design review process not implemented',
          severity: 'critical',
          recommendation: 'Implement formal design review checkpoints at critical project phases.',
        });
      }

      // Check for audit trail
      const auditResult = await query(
        'SELECT COUNT(*) as count FROM audit_events WHERE resource_id = $1',
        [projectId]
      );

      const auditCount = parseInt(auditResult.rows[0]?.count || '0');
      if (auditCount === 0) {
        gaps.push({
          id: `gap_${Date.now()}_3`,
          projectId,
          standard: 'ISO 9001',
          section: '7.5',
          description: 'Insufficient documented information and audit trail',
          severity: 'medium',
          recommendation: 'Enable comprehensive audit logging for all project activities.',
        });
      }

      // Check for team roles and responsibilities
      const teamResult = await query(
        'SELECT COUNT(*) as count FROM project_team_members WHERE project_id = $1',
        [projectId]
      );

      const teamCount = parseInt(teamResult.rows[0]?.count || '0');
      if (teamCount === 0) {
        gaps.push({
          id: `gap_${Date.now()}_4`,
          projectId,
          standard: 'ISO 9001',
          section: '5.3',
          description: 'Organizational roles and responsibilities not defined',
          severity: 'high',
          recommendation: 'Assign team members with clearly defined roles and responsibilities.',
        });
      }

      return gaps;
    } catch (error) {
      console.error('Error performing gap analysis:', error);
      throw error;
    }
  }

  // Generate compliance report
  async generateComplianceReport(
    projectId: string,
    reportType: 'status' | 'gap-analysis' | 'audit-ready' | 'submission'
  ): Promise<ComplianceReport> {
    try {
      // Get compliance requirements
      const complianceResult = await query(
        'SELECT * FROM compliance_requirements WHERE project_id = $1',
        [projectId]
      );

      const frameworks: ComplianceFrameworkStatus[] = complianceResult.rows.map((row: any) => ({
        framework: row.standard,
        version: row.version,
        status: row.status,
        completionPercentage: this.calculateCompletionPercentage(row),
        compliantSections: JSON.parse(row.applicable_sections || '[]').filter((s: any) => s.compliant).length,
        totalSections: JSON.parse(row.applicable_sections || '[]').length,
        lastAssessed: row.last_assessed,
      }));

      // Perform gap analysis
      const gaps = await this.performGapAnalysis(projectId);

      // Calculate overall compliance score
      const totalSections = frameworks.reduce((sum, f) => sum + f.totalSections, 0);
      const compliantSections = frameworks.reduce((sum, f) => sum + f.compliantSections, 0);
      const complianceScore = totalSections > 0 ? (compliantSections / totalSections) * 100 : 0;

      // Determine overall status
      let overallStatus: 'compliant' | 'non-compliant' | 'in-progress' = 'in-progress';
      if (complianceScore >= 95) {
        overallStatus = 'compliant';
      } else if (gaps.some(g => g.severity === 'critical')) {
        overallStatus = 'non-compliant';
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(gaps, frameworks);

      const report: ComplianceReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        reportType,
        generatedAt: new Date(),
        overallStatus,
        complianceScore,
        frameworks,
        gaps,
        recommendations,
      };

      // Save report
      await this.saveComplianceReport(report);

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Update compliance status
  async updateComplianceStatus(
    projectId: string,
    standard: string,
    section: string,
    status: 'compliant' | 'non-compliant' | 'in-progress'
  ): Promise<void> {
    try {
      await query(`
        UPDATE compliance_requirements
        SET status = $1, last_assessed = NOW()
        WHERE project_id = $2 AND standard = $3
      `, [status, projectId, standard]);
    } catch (error) {
      console.error('Error updating compliance status:', error);
      throw error;
    }
  }

  // Monitor compliance changes
  async monitorComplianceChanges(projectId: string): Promise<void> {
    try {
      // Check for regulatory updates (mock implementation)
      // In production, this would integrate with regulatory databases
      
      // Get current compliance requirements
      const result = await query(
        'SELECT * FROM compliance_requirements WHERE project_id = $1',
        [projectId]
      );

      for (const requirement of result.rows) {
        // Check if framework has updates
        const hasUpdates = await this.checkFrameworkUpdates(requirement.standard, requirement.version);
        
        if (hasUpdates) {
          // Notify project team
          await this.notifyComplianceUpdate(projectId, requirement.standard);
        }
      }
    } catch (error) {
      console.error('Error monitoring compliance changes:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateCompletionPercentage(complianceRow: any): number {
    const sections = JSON.parse(complianceRow.applicable_sections || '[]');
    if (sections.length === 0) return 0;
    
    const compliantSections = sections.filter((s: any) => s.compliant).length;
    return (compliantSections / sections.length) * 100;
  }

  private generateRecommendations(gaps: ComplianceGap[], frameworks: ComplianceFrameworkStatus[]): string[] {
    const recommendations: string[] = [];

    // Critical gaps
    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push(`Address ${criticalGaps.length} critical compliance gaps immediately to avoid regulatory issues.`);
    }

    // High severity gaps
    const highGaps = gaps.filter(g => g.severity === 'high');
    if (highGaps.length > 0) {
      recommendations.push(`Prioritize resolution of ${highGaps.length} high-severity compliance gaps.`);
    }

    // Framework-specific recommendations
    frameworks.forEach(framework => {
      if (framework.completionPercentage < 50) {
        recommendations.push(`${framework.framework}: Compliance is below 50%. Conduct comprehensive review and remediation.`);
      } else if (framework.completionPercentage < 80) {
        recommendations.push(`${framework.framework}: Focus on completing remaining ${framework.totalSections - framework.compliantSections} sections.`);
      }
    });

    // General recommendations
    if (gaps.length > 0) {
      recommendations.push('Implement regular compliance reviews to maintain ongoing adherence to standards.');
      recommendations.push('Consider engaging compliance consultants for complex regulatory requirements.');
    }

    return recommendations;
  }

  private async saveComplianceReport(report: ComplianceReport): Promise<void> {
    try {
      await query(`
        INSERT INTO compliance_reports (
          id, project_id, report_type, generated_at, overall_status,
          compliance_score, frameworks, gaps, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        report.id,
        report.projectId,
        report.reportType,
        report.generatedAt,
        report.overallStatus,
        report.complianceScore,
        JSON.stringify(report.frameworks),
        JSON.stringify(report.gaps),
        JSON.stringify(report.recommendations),
      ]);
    } catch (error) {
      console.error('Error saving compliance report:', error);
      // Don't throw - report generation succeeded
    }
  }

  private async checkFrameworkUpdates(standard: string, currentVersion: string): Promise<boolean> {
    // Mock implementation - in production, integrate with regulatory databases
    return false;
  }

  private async notifyComplianceUpdate(projectId: string, standard: string): Promise<void> {
    // Notify project team about compliance updates
    // Implementation would use NotificationService
    console.log(`Compliance update notification for project ${projectId}, standard ${standard}`);
  }

  // Get compliance dashboard data
  async getComplianceDashboard(projectId: string): Promise<any> {
    try {
      const [requirements, gaps, recentReports] = await Promise.all([
        query('SELECT * FROM compliance_requirements WHERE project_id = $1', [projectId]),
        this.performGapAnalysis(projectId),
        query(
          'SELECT * FROM compliance_reports WHERE project_id = $1 ORDER BY generated_at DESC LIMIT 5',
          [projectId]
        ),
      ]);

      return {
        requirements: requirements.rows,
        gaps,
        gapCount: gaps.length,
        criticalGaps: gaps.filter(g => g.severity === 'critical').length,
        highGaps: gaps.filter(g => g.severity === 'high').length,
        recentReports: recentReports.rows,
      };
    } catch (error) {
      console.error('Error getting compliance dashboard:', error);
      throw error;
    }
  }
}
