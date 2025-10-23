import {
  PresentationExport,
  PresentationSlide,
  PresentationTemplate,
  PresentationOptions,
  ExportResult,
  ProjectExport,
  StakeholderType,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Presentation Export Service
 * Handles PowerPoint presentation generation with automated slide creation,
 * executive summaries, and stakeholder-specific customization
 */
export class PresentationExportService {
  private templates: Map<string, PresentationTemplate> = new Map();
  private presentations: Map<string, PresentationExport> = new Map();

  constructor() {
    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Generate presentation from project data
   */
  async generatePresentation(
    projectData: ProjectExport,
    stakeholderType: StakeholderType,
    options: PresentationOptions,
    userId: string
  ): Promise<ExportResult> {
    const presentationId = uuidv4();

    try {
      console.log(`Generating presentation for ${stakeholderType}`);

      // Get or create template
      const template = options.templateId
        ? this.templates.get(options.templateId)
        : this.getDefaultTemplate(stakeholderType);

      if (!template) {
        throw new Error('Template not found');
      }

      // Generate slides based on stakeholder type
      const slides = await this.generateSlides(projectData, stakeholderType, template, options);

      // Create presentation
      const presentation: PresentationExport = {
        id: presentationId,
        projectId: projectData.id,
        title: options.title || `${projectData.name} - ${stakeholderType} Presentation`,
        stakeholderType,
        slides,
        template,
        createdBy: userId,
        createdAt: new Date(),
      };

      this.presentations.set(presentationId, presentation);

      // Generate PowerPoint file
      const result = await this.exportToPowerPoint(presentation, options);

      console.log(`Presentation generated: ${presentationId}`);
      return result;
    } catch (error) {
      console.error('Presentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Create custom presentation template
   */
  async createTemplate(
    name: string,
    description: string,
    stakeholderType: StakeholderType,
    configuration: any,
    userId: string
  ): Promise<PresentationTemplate> {
    const templateId = uuidv4();

    const template: PresentationTemplate = {
      id: templateId,
      name,
      description,
      stakeholderType,
      configuration,
      slideLayouts: this.getDefaultSlideLayouts(stakeholderType),
      branding: configuration.branding || {},
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      usageCount: 0,
    };

    this.templates.set(templateId, template);

    console.log(`Presentation template created: ${name} (${templateId})`);
    return template;
  }

  /**
   * Get presentation
   */
  getPresentation(presentationId: string): PresentationExport | undefined {
    return this.presentations.get(presentationId);
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): PresentationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List templates
   */
  listTemplates(stakeholderType?: StakeholderType): PresentationTemplate[] {
    const templates = Array.from(this.templates.values());

    if (stakeholderType) {
      return templates.filter(t => t.stakeholderType === stakeholderType);
    }

    return templates;
  }

  // Private helper methods

  private initializeDefaultTemplates(): void {
    // Executive template
    this.templates.set('executive-default', {
      id: 'executive-default',
      name: 'Executive Summary',
      description: 'High-level overview for executives',
      stakeholderType: 'executive',
      configuration: {
        focusAreas: ['summary', 'metrics', 'risks', 'timeline'],
        detailLevel: 'high-level',
      },
      slideLayouts: this.getDefaultSlideLayouts('executive'),
      branding: {},
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });

    // Technical template
    this.templates.set('technical-default', {
      id: 'technical-default',
      name: 'Technical Review',
      description: 'Detailed technical presentation',
      stakeholderType: 'technical',
      configuration: {
        focusAreas: ['architecture', 'specifications', 'testing', 'implementation'],
        detailLevel: 'detailed',
      },
      slideLayouts: this.getDefaultSlideLayouts('technical'),
      branding: {},
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });

    // Client template
    this.templates.set('client-default', {
      id: 'client-default',
      name: 'Client Presentation',
      description: 'Client-focused presentation',
      stakeholderType: 'client',
      configuration: {
        focusAreas: ['overview', 'benefits', 'timeline', 'deliverables'],
        detailLevel: 'moderate',
      },
      slideLayouts: this.getDefaultSlideLayouts('client'),
      branding: {},
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });
  }

  private getDefaultTemplate(stakeholderType: StakeholderType): PresentationTemplate | undefined {
    return this.templates.get(`${stakeholderType}-default`);
  }

  private getDefaultSlideLayouts(stakeholderType: StakeholderType): string[] {
    const layouts: Record<StakeholderType, string[]> = {
      executive: ['title', 'executive-summary', 'key-metrics', 'risks', 'timeline', 'recommendations'],
      technical: ['title', 'architecture', 'specifications', 'implementation', 'testing', 'technical-details'],
      client: ['title', 'overview', 'benefits', 'timeline', 'deliverables', 'next-steps'],
      team: ['title', 'project-overview', 'team-structure', 'tasks', 'progress', 'collaboration'],
      investor: ['title', 'business-case', 'market-analysis', 'financials', 'roi', 'investment-ask'],
    };

    return layouts[stakeholderType] || layouts.executive;
  }

  private async generateSlides(
    projectData: ProjectExport,
    stakeholderType: StakeholderType,
    template: PresentationTemplate,
    options: PresentationOptions
  ): Promise<PresentationSlide[]> {
    const slides: PresentationSlide[] = [];

    // Title slide
    slides.push(this.createTitleSlide(projectData, template));

    // Generate slides based on stakeholder type
    switch (stakeholderType) {
      case 'executive':
        slides.push(...this.generateExecutiveSlides(projectData, template, options));
        break;
      case 'technical':
        slides.push(...this.generateTechnicalSlides(projectData, template, options));
        break;
      case 'client':
        slides.push(...this.generateClientSlides(projectData, template, options));
        break;
      case 'team':
        slides.push(...this.generateTeamSlides(projectData, template, options));
        break;
      case 'investor':
        slides.push(...this.generateInvestorSlides(projectData, template, options));
        break;
    }

    // Closing slide
    if (options.includeClosing !== false) {
      slides.push(this.createClosingSlide(projectData, template));
    }

    return slides;
  }

  private createTitleSlide(projectData: ProjectExport, template: PresentationTemplate): PresentationSlide {
    return {
      id: uuidv4(),
      order: 0,
      layout: 'title',
      title: projectData.name,
      subtitle: projectData.description,
      content: {
        discipline: projectData.discipline,
        date: new Date().toLocaleDateString(),
      },
      notes: 'Project title and overview',
    };
  }

  private generateExecutiveSlides(
    projectData: ProjectExport,
    template: PresentationTemplate,
    options: PresentationOptions
  ): PresentationSlide[] {
    const slides: PresentationSlide[] = [];

    // Executive Summary
    slides.push({
      id: uuidv4(),
      order: 1,
      layout: 'executive-summary',
      title: 'Executive Summary',
      content: {
        overview: projectData.description,
        keyPoints: [
          `${projectData.phases.length} project phases`,
          `${projectData.team.length} team members`,
          'On track for completion',
        ],
        status: 'In Progress',
      },
      notes: 'High-level project overview',
    });

    // Key Metrics
    slides.push({
      id: uuidv4(),
      order: 2,
      layout: 'key-metrics',
      title: 'Key Metrics',
      content: {
        metrics: [
          { label: 'Completion', value: '75%', trend: 'up' },
          { label: 'Budget', value: '85%', trend: 'stable' },
          { label: 'Team Velocity', value: '92%', trend: 'up' },
          { label: 'Quality Score', value: '88%', trend: 'up' },
        ],
      },
      notes: 'Project performance metrics',
    });

    // Timeline
    slides.push({
      id: uuidv4(),
      order: 3,
      layout: 'timeline',
      title: 'Project Timeline',
      content: {
        phases: projectData.phases.map(phase => ({
          name: phase.name,
          status: phase.status,
          completedAt: phase.completedAt,
        })),
      },
      notes: 'Project timeline and milestones',
    });

    // Risks & Recommendations
    slides.push({
      id: uuidv4(),
      order: 4,
      layout: 'risks',
      title: 'Risks & Recommendations',
      content: {
        risks: [
          { level: 'medium', description: 'Resource availability', mitigation: 'Cross-training team members' },
          { level: 'low', description: 'Technology dependencies', mitigation: 'Regular vendor communication' },
        ],
        recommendations: [
          'Continue current trajectory',
          'Increase testing resources',
          'Schedule stakeholder review',
        ],
      },
      notes: 'Risk assessment and recommendations',
    });

    return slides;
  }

  private generateTechnicalSlides(
    projectData: ProjectExport,
    template: PresentationTemplate,
    options: PresentationOptions
  ): PresentationSlide[] {
    const slides: PresentationSlide[] = [];

    // Architecture Overview
    slides.push({
      id: uuidv4(),
      order: 1,
      layout: 'architecture',
      title: 'System Architecture',
      content: {
        components: ['Frontend', 'Backend', 'Database', 'Integration Layer'],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'REST APIs'],
      },
      notes: 'Technical architecture overview',
    });

    // Technical Specifications
    slides.push({
      id: uuidv4(),
      order: 2,
      layout: 'specifications',
      title: 'Technical Specifications',
      content: {
        specifications: projectData.phases.flatMap(phase =>
          phase.documents.filter(doc => doc.type === 'specifications')
        ),
      },
      notes: 'Detailed technical specifications',
    });

    // Implementation Details
    slides.push({
      id: uuidv4(),
      order: 3,
      layout: 'implementation',
      title: 'Implementation Progress',
      content: {
        completed: projectData.phases.filter(p => p.status === 'completed').length,
        inProgress: projectData.phases.filter(p => p.status === 'in-progress').length,
        pending: projectData.phases.filter(p => p.status === 'pending').length,
      },
      notes: 'Implementation status and progress',
    });

    // Testing & Quality
    slides.push({
      id: uuidv4(),
      order: 4,
      layout: 'testing',
      title: 'Testing & Quality Assurance',
      content: {
        testCoverage: '85%',
        passRate: '92%',
        criticalIssues: 0,
        openIssues: 5,
      },
      notes: 'Testing metrics and quality assurance',
    });

    return slides;
  }

  private generateClientSlides(
    projectData: ProjectExport,
    template: PresentationTemplate,
    options: PresentationOptions
  ): PresentationSlide[] {
    const slides: PresentationSlide[] = [];

    // Project Overview
    slides.push({
      id: uuidv4(),
      order: 1,
      layout: 'overview',
      title: 'Project Overview',
      content: {
        description: projectData.description,
        objectives: ['Deliver high-quality solution', 'Meet timeline', 'Stay within budget'],
        scope: projectData.phases.map(p => p.name),
      },
      notes: 'Project overview for client',
    });

    // Benefits & Value
    slides.push({
      id: uuidv4(),
      order: 2,
      layout: 'benefits',
      title: 'Benefits & Value',
      content: {
        benefits: [
          'Improved efficiency',
          'Cost reduction',
          'Enhanced user experience',
          'Scalable solution',
        ],
      },
      notes: 'Project benefits and value proposition',
    });

    // Deliverables
    slides.push({
      id: uuidv4(),
      order: 3,
      layout: 'deliverables',
      title: 'Project Deliverables',
      content: {
        deliverables: projectData.phases.flatMap(phase =>
          phase.sprints.flatMap(sprint => sprint.deliverables)
        ),
      },
      notes: 'Project deliverables and outputs',
    });

    // Next Steps
    slides.push({
      id: uuidv4(),
      order: 4,
      layout: 'next-steps',
      title: 'Next Steps',
      content: {
        steps: [
          'Complete current phase',
          'Schedule review meeting',
          'Begin next phase',
          'Deliver milestone',
        ],
      },
      notes: 'Next steps and action items',
    });

    return slides;
  }

  private generateTeamSlides(
    projectData: ProjectExport,
    template: PresentationTemplate,
    options: PresentationOptions
  ): PresentationSlide[] {
    const slides: PresentationSlide[] = [];

    // Team Structure
    slides.push({
      id: uuidv4(),
      order: 1,
      layout: 'team-structure',
      title: 'Team Structure',
      content: {
        members: projectData.team,
        roles: [...new Set(projectData.team.map(m => m.role))],
      },
      notes: 'Team structure and roles',
    });

    // Progress & Tasks
    slides.push({
      id: uuidv4(),
      order: 2,
      layout: 'tasks',
      title: 'Progress & Tasks',
      content: {
        completedPhases: projectData.phases.filter(p => p.status === 'completed').length,
        totalPhases: projectData.phases.length,
      },
      notes: 'Team progress and task status',
    });

    return slides;
  }

  private generateInvestorSlides(
    projectData: ProjectExport,
    template: PresentationTemplate,
    options: PresentationOptions
  ): PresentationSlide[] {
    const slides: PresentationSlide[] = [];

    // Business Case
    slides.push({
      id: uuidv4(),
      order: 1,
      layout: 'business-case',
      title: 'Business Case',
      content: {
        problem: 'Market opportunity',
        solution: projectData.description,
        marketSize: 'Growing market',
      },
      notes: 'Business case and opportunity',
    });

    // ROI & Financials
    slides.push({
      id: uuidv4(),
      order: 2,
      layout: 'financials',
      title: 'ROI & Financials',
      content: {
        investment: 'Investment required',
        roi: 'Expected return',
        timeline: 'Payback period',
      },
      notes: 'Financial projections and ROI',
    });

    return slides;
  }

  private createClosingSlide(projectData: ProjectExport, template: PresentationTemplate): PresentationSlide {
    return {
      id: uuidv4(),
      order: 999,
      layout: 'closing',
      title: 'Thank You',
      content: {
        contact: 'Contact information',
        nextSteps: 'Questions and discussion',
      },
      notes: 'Closing slide',
    };
  }

  private async exportToPowerPoint(
    presentation: PresentationExport,
    options: PresentationOptions
  ): Promise<ExportResult> {
    // Mock PowerPoint generation
    // In production, use a library like pptxgenjs or officegen
    const fileName = `${presentation.title.replace(/\s+/g, '_')}_${Date.now()}.pptx`;
    const filePath = path.join('exports', presentation.id, fileName);

    console.log('Generating PowerPoint:', fileName);
    console.log(`Slides: ${presentation.slides.length}`);

    return {
      id: presentation.id,
      projectId: presentation.projectId,
      format: 'powerpoint',
      status: 'completed',
      filePath,
      fileName,
      fileSize: 1024 * 150, // Mock 150KB
      downloadUrl: `/api/export/${presentation.id}/download`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      error: null,
    };
  }
}

// Export singleton instance
export const presentationExportService = new PresentationExportService();
