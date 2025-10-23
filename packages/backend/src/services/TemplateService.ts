import { Template, DynamicRole, ProgramScale, Project, AIProfile, TuningSettings } from '@shared/types';
import { TemplateRepository } from '../database/repositories/TemplateRepository';
import { AIService } from './AIService';
import { auditLog } from '../middleware/logging';

export interface TemplateConfig {
  name: string;
  description: string;
  disciplines: string[];
  programScale: ProgramScale;
  developmentMode: 'full' | 'rapid';
  organizationPreferences?: OrganizationPreferences;
  complianceFrameworks?: string[];
  customRequirements?: string;
}

export interface OrganizationPreferences {
  terminology: Record<string, string>;
  roleHierarchy: 'flat' | 'hierarchical' | 'matrix';
  complianceLevel: 'basic' | 'standard' | 'strict';
  documentationStyle: 'concise' | 'detailed' | 'comprehensive';
}

export interface ProjectWizardData {
  // Existing wizard structure preserved
  name: string;
  requirements: string;
  constraints: string;
  disciplines: string[];
  developmentMode: 'full' | 'rapid';
  
  // Enhanced with new options
  templateId?: string;
  programScale: ProgramScale;
  organizationPreferences?: OrganizationPreferences;
  aiProfileId?: string;
}

/**
 * Template Service for AI-powered template generation and management
 * Enhances existing project wizard with dynamic template capabilities
 */
export class TemplateService {
  private templateRepository: TemplateRepository;
  private aiService: AIService;

  // Preserve existing 20+ engineering disciplines
  private readonly availableDisciplines = [
    'Aerospace Engineering',
    'Automotive Engineering',
    'Biomedical Engineering',
    'Chemical Engineering',
    'Civil Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'Environmental Engineering',
    'Industrial Engineering',
    'Materials Engineering',
    'Mechanical Engineering',
    'Nuclear Engineering',
    'Petroleum Engineering',
    'Software Engineering',
    'Systems Engineering',
    'Robotics Engineering',
    'Marine Engineering',
    'Agricultural Engineering',
    'Mining Engineering',
    'Structural Engineering',
    'Telecommunications Engineering',
    'Optical Engineering',
    'Acoustical Engineering',
    'Fire Protection Engineering',
    'Transportation Engineering',
  ];

  constructor() {
    this.templateRepository = new TemplateRepository();
    this.aiService = new AIService();
  }

  /**
   * Enhanced project creation from wizard (preserving existing functionality)
   */
  async createProjectFromWizard(wizardData: ProjectWizardData, userId: string): Promise<Project> {
    let template: Template | null = null;

    // If template ID provided, use existing template
    if (wizardData.templateId) {
      template = await this.templateRepository.findById(wizardData.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
    } else {
      // Generate new template based on wizard data
      const templateConfig: TemplateConfig = {
        name: `${wizardData.name} Template`,
        description: `Auto-generated template for ${wizardData.disciplines.join(', ')} project`,
        disciplines: wizardData.disciplines,
        programScale: wizardData.programScale,
        developmentMode: wizardData.developmentMode,
        organizationPreferences: wizardData.organizationPreferences,
        customRequirements: wizardData.requirements,
      };

      template = await this.generateTemplate(templateConfig, userId);
    }

    // Create project from template (preserving existing project structure)
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name: wizardData.name,
      requirements: wizardData.requirements,
      constraints: wizardData.constraints,
      disciplines: wizardData.disciplines,
      developmentMode: wizardData.developmentMode,
      currentPhase: 0,
      phases: this.generatePhasesFromTemplate(template),
      
      // Enhanced with new collaborative features
      description: `${wizardData.disciplines.join(', ')} engineering project`,
      templateId: template.id,
      template,
      programScale: wizardData.programScale,
      team: [],
      dynamicRoles: template.dynamicRoles,
      programLeader: userId,
      complianceRequirements: [],
      auditTrail: [],
      integrations: [],
      cadConnections: [],
      simulationConnections: [],
      status: 'active',
      createdBy: userId,
    };

    // This would typically call ProjectService.createProject
    // For now, return the project data structure
    return {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
  }

  /**
   * Get available engineering disciplines (preserving existing functionality)
   */
  async getAvailableDisciplines(): Promise<string[]> {
    return this.availableDisciplines;
  }

  /**
   * AI-powered template generation
   */
  async generateTemplate(config: TemplateConfig, userId: string): Promise<Template> {
    // Generate dynamic roles based on disciplines and scale
    const dynamicRoles = await this.createDynamicRoles(
      config.disciplines,
      config.programScale,
      config.organizationPreferences
    );

    // Generate AI profiles for the template
    const aiProfiles = await this.generateAIProfiles(config);

    // Generate phase templates based on development mode
    const phases = this.generatePhaseTemplates(config.developmentMode, config.disciplines);

    const templateData: Omit<Template, 'id' | 'createdAt'> = {
      name: config.name,
      description: config.description,
      version: '1.0',
      disciplines: config.disciplines,
      developmentMode: config.developmentMode,
      phases,
      dynamicRoles,
      complianceFrameworks: config.complianceFrameworks || [],
      aiProfiles,
      integrationRequirements: this.generateIntegrationRequirements(config.disciplines),
      isBuiltIn: false,
      isCustom: true,
      organizationId: undefined, // Would be set based on user's organization
      usage: {
        timesUsed: 0,
        lastUsed: new Date(),
        averageRating: 0,
        feedback: [],
      },
    };

    const template = await this.templateRepository.create(templateData);

    auditLog('GENERATE_TEMPLATE', 'template', template.id, userId, {
      templateName: config.name,
      disciplines: config.disciplines,
      programScale: config.programScale,
    });

    return template;
  }

  /**
   * Create dynamic roles based on engineering disciplines and project scale
   */
  async createDynamicRoles(
    disciplines: string[],
    scale: ProgramScale,
    orgPrefs?: OrganizationPreferences
  ): Promise<DynamicRole[]> {
    const roles: DynamicRole[] = [];

    // Generate discipline-specific roles
    for (const discipline of disciplines) {
      const disciplineRoles = await this.generateDisciplineRoles(discipline, scale);
      roles.push(...disciplineRoles);
    }

    // Add cross-functional roles based on scale
    const crossFunctionalRoles = this.generateCrossFunctionalRoles(scale, orgPrefs);
    roles.push(...crossFunctionalRoles);

    // Add management roles based on scale and org preferences
    const managementRoles = this.generateManagementRoles(scale, orgPrefs);
    roles.push(...managementRoles);

    return roles;
  }

  /**
   * Customize template for organization
   */
  async customizeForOrganization(
    template: Template,
    orgPrefs: OrganizationPreferences,
    userId: string
  ): Promise<Template> {
    // Apply custom terminology
    const customizedTemplate = { ...template };
    
    if (orgPrefs.terminology) {
      customizedTemplate.name = this.applyTerminology(template.name, orgPrefs.terminology);
      customizedTemplate.description = this.applyTerminology(template.description, orgPrefs.terminology);
      
      // Update role names and descriptions
      customizedTemplate.dynamicRoles = template.dynamicRoles.map(role => ({
        ...role,
        name: this.applyTerminology(role.name, orgPrefs.terminology),
        description: this.applyTerminology(role.description, orgPrefs.terminology),
      }));
    }

    // Adjust role hierarchy
    if (orgPrefs.roleHierarchy) {
      customizedTemplate.dynamicRoles = this.adjustRoleHierarchy(
        customizedTemplate.dynamicRoles,
        orgPrefs.roleHierarchy
      );
    }

    const updatedTemplate = await this.templateRepository.update(template.id, customizedTemplate);
    
    if (updatedTemplate) {
      auditLog('CUSTOMIZE_TEMPLATE', 'template', template.id, userId, {
        organizationPreferences: Object.keys(orgPrefs),
      });
    }

    return updatedTemplate || template;
  }

  /**
   * Validate template structure and content
   */
  async validateTemplate(template: Template): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic structure
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.disciplines || template.disciplines.length === 0) {
      errors.push('At least one discipline is required');
    }

    if (!template.phases || template.phases.length === 0) {
      errors.push('Template must have at least one phase');
    }

    // Validate disciplines are from available list
    const invalidDisciplines = template.disciplines.filter(
      d => !this.availableDisciplines.includes(d)
    );
    if (invalidDisciplines.length > 0) {
      errors.push(`Invalid disciplines: ${invalidDisciplines.join(', ')}`);
    }

    // Validate dynamic roles
    if (template.dynamicRoles.length === 0) {
      errors.push('Template must have at least one dynamic role');
    }

    // Validate AI profiles
    for (const profile of template.aiProfiles) {
      if (!profile.tuningSettings || Object.keys(profile.tuningSettings).length === 0) {
        errors.push(`AI profile '${profile.name}' has no tuning settings`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save custom template from existing project
   */
  async saveCustomTemplate(
    project: Project,
    templateName: string,
    userId: string
  ): Promise<Template> {
    const templateData: Omit<Template, 'id' | 'createdAt'> = {
      name: templateName,
      description: `Custom template based on project: ${project.name}`,
      version: '1.0',
      disciplines: project.disciplines,
      developmentMode: project.developmentMode,
      phases: this.convertPhasesToTemplates(project.phases),
      dynamicRoles: project.dynamicRoles,
      complianceFrameworks: project.complianceRequirements.map(req => req.standard),
      aiProfiles: [], // Would extract from project's AI usage
      integrationRequirements: this.generateIntegrationRequirements(project.disciplines),
      isBuiltIn: false,
      isCustom: true,
      organizationId: project.organizationId,
      usage: {
        timesUsed: 0,
        lastUsed: new Date(),
        averageRating: 0,
        feedback: [],
      },
    };

    const template = await this.templateRepository.create(templateData);

    auditLog('SAVE_CUSTOM_TEMPLATE', 'template', template.id, userId, {
      templateName,
      sourceProjectId: project.id,
      sourceProjectName: project.name,
    });

    return template;
  }

  /**
   * Get template library
   */
  async getTemplateLibrary(userId: string, organizationId?: string): Promise<Template[]> {
    const userTemplates = await this.templateRepository.findByUserId(userId);
    const builtInTemplates = await this.templateRepository.findBuiltInTemplates();
    
    let orgTemplates: Template[] = [];
    if (organizationId) {
      orgTemplates = await this.templateRepository.findByOrganizationId(organizationId);
    }

    // Combine and deduplicate
    const allTemplates = [...userTemplates, ...builtInTemplates, ...orgTemplates];
    return allTemplates.filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );
  }

  // Private helper methods

  private async generateDisciplineRoles(discipline: string, scale: ProgramScale): Promise<DynamicRole[]> {
    const roles: DynamicRole[] = [];
    const baseRoleName = discipline.replace(' Engineering', '');

    // Generate AI-powered role definitions
    const prompt = `Generate role definitions for a ${discipline} project at ${scale} scale. 
    Include responsibilities, deliverables, and required skills. 
    Return as JSON with roles array containing: name, description, responsibilities, deliverables.`;

    try {
      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: 'Template Generation',
          disciplines: [discipline],
          requirements: 'Generate appropriate roles for this discipline',
          constraints: 'Focus on practical, actionable role definitions',
          developmentMode: 'full',
          previousPhaseOutputs: [],
          currentPhase: 'role-generation',
          sprintContext: 'dynamic-roles',
        },
        {},
        'You are an expert in engineering organization design. Generate practical, well-defined roles.'
      );

      // Parse AI response and create role objects
      const roleData = JSON.parse(aiResponse.content);
      
      for (const [index, roleInfo] of (roleData.roles || []).entries()) {
        roles.push({
          id: `role-${discipline.toLowerCase().replace(/\s+/g, '-')}-${index}`,
          name: roleInfo.name || `${baseRoleName} Engineer`,
          description: roleInfo.description || `Responsible for ${discipline.toLowerCase()} aspects of the project`,
          responsibilities: roleInfo.responsibilities || [`Design and develop ${discipline.toLowerCase()} solutions`],
          deliverables: roleInfo.deliverables || [`${discipline} specifications and documentation`],
          approvalAuthorities: [],
          permissions: this.generateDefaultPermissions(),
          accessLevel: 'write',
          discipline,
          projectScale: scale,
          organizationContext: {
            id: 'default',
            name: 'Default Organization',
            industry: 'Engineering',
            size: 'medium',
            complianceRequirements: [],
            customTerminology: {},
          },
          reportsTo: [],
          manages: [],
          collaboratesWith: [],
          generatedBy: 'ai',
          templateSource: 'dynamic-generation',
          aiConfidence: 0.8,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error generating AI roles, using fallback:', error);
      
      // Fallback to predefined role
      roles.push({
        id: `role-${discipline.toLowerCase().replace(/\s+/g, '-')}-0`,
        name: `${baseRoleName} Engineer`,
        description: `Responsible for ${discipline.toLowerCase()} aspects of the project`,
        responsibilities: [`Design and develop ${discipline.toLowerCase()} solutions`],
        deliverables: [`${discipline} specifications and documentation`],
        approvalAuthorities: [],
        permissions: this.generateDefaultPermissions(),
        accessLevel: 'write',
        discipline,
        projectScale: scale,
        organizationContext: {
          id: 'default',
          name: 'Default Organization',
          industry: 'Engineering',
          size: 'medium',
          complianceRequirements: [],
          customTerminology: {},
        },
        reportsTo: [],
        manages: [],
        collaboratesWith: [],
        generatedBy: 'template',
        templateSource: 'fallback',
        aiConfidence: 0.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return roles;
  }

  private generateCrossFunctionalRoles(scale: ProgramScale, orgPrefs?: OrganizationPreferences): DynamicRole[] {
    const roles: DynamicRole[] = [];

    // Always include these cross-functional roles
    const baseRoles = [
      {
        name: 'Project Coordinator',
        description: 'Coordinates project activities and communication between team members',
        responsibilities: ['Coordinate project activities', 'Facilitate communication', 'Track progress'],
        deliverables: ['Project status reports', 'Meeting minutes', 'Communication plans'],
      },
      {
        name: 'Quality Assurance Specialist',
        description: 'Ensures project deliverables meet quality standards',
        responsibilities: ['Review deliverables', 'Conduct quality audits', 'Maintain quality standards'],
        deliverables: ['Quality reports', 'Audit findings', 'Quality improvement plans'],
      },
    ];

    // Add scale-specific roles
    if (scale === 'large' || scale === 'enterprise') {
      baseRoles.push({
        name: 'Technical Writer',
        description: 'Creates and maintains project documentation',
        responsibilities: ['Write technical documentation', 'Maintain document standards', 'Review content'],
        deliverables: ['Technical documentation', 'User guides', 'Process documentation'],
      });
    }

    for (const [index, roleInfo] of baseRoles.entries()) {
      roles.push({
        id: `cross-functional-role-${index}`,
        name: roleInfo.name,
        description: roleInfo.description,
        responsibilities: roleInfo.responsibilities,
        deliverables: roleInfo.deliverables,
        approvalAuthorities: [],
        permissions: this.generateDefaultPermissions(),
        accessLevel: 'write',
        discipline: 'Cross-Functional',
        projectScale: scale,
        organizationContext: {
          id: 'default',
          name: 'Default Organization',
          industry: 'Engineering',
          size: 'medium',
          complianceRequirements: [],
          customTerminology: {},
        },
        reportsTo: [],
        manages: [],
        collaboratesWith: [],
        generatedBy: 'template',
        templateSource: 'cross-functional',
        aiConfidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return roles;
  }

  private generateManagementRoles(scale: ProgramScale, orgPrefs?: OrganizationPreferences): DynamicRole[] {
    const roles: DynamicRole[] = [];

    // Program Leader is always included (universal role)
    roles.push({
      id: 'program-leader-role',
      name: 'Program Leader',
      description: 'Senior oversight role with design review approval authority and strategic guidance',
      responsibilities: [
        'Provide strategic guidance and oversight',
        'Approve design reviews and major decisions',
        'Ensure project alignment with organizational goals',
        'Manage stakeholder relationships',
      ],
      deliverables: [
        'Strategic guidance documents',
        'Design review approvals',
        'Stakeholder communication',
        'Executive reports',
      ],
      approvalAuthorities: [
        {
          id: 'design-review-approval',
          name: 'Design Review Approval',
          scope: 'All design reviews',
          level: 'project',
        },
      ],
      permissions: this.generateAdminPermissions(),
      accessLevel: 'admin',
      discipline: 'Management',
      projectScale: scale,
      organizationContext: {
        id: 'default',
        name: 'Default Organization',
        industry: 'Engineering',
        size: 'medium',
        complianceRequirements: [],
        customTerminology: {},
      },
      reportsTo: [],
      manages: ['all-team-members'],
      collaboratesWith: [],
      generatedBy: 'template',
      templateSource: 'management',
      aiConfidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add additional management roles based on scale
    if (scale === 'large' || scale === 'enterprise') {
      roles.push({
        id: 'project-manager-role',
        name: 'Project Manager',
        description: 'Manages day-to-day project operations and team coordination',
        responsibilities: [
          'Manage project timeline and resources',
          'Coordinate team activities',
          'Track project progress and risks',
          'Facilitate team communication',
        ],
        deliverables: [
          'Project plans and schedules',
          'Progress reports',
          'Risk assessments',
          'Team coordination',
        ],
        approvalAuthorities: [],
        permissions: this.generateManagerPermissions(),
        accessLevel: 'admin',
        discipline: 'Management',
        projectScale: scale,
        organizationContext: {
          id: 'default',
          name: 'Default Organization',
          industry: 'Engineering',
          size: 'medium',
          complianceRequirements: [],
          customTerminology: {},
        },
        reportsTo: ['program-leader-role'],
        manages: ['team-members'],
        collaboratesWith: ['all-roles'],
        generatedBy: 'template',
        templateSource: 'management',
        aiConfidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return roles;
  }

  private generateAIProfiles(config: TemplateConfig): AIProfile[] {
    const profiles: AIProfile[] = [];

    // Generate profiles based on development mode and disciplines
    if (config.developmentMode === 'rapid') {
      profiles.push({
        id: `ai-profile-rapid-${Date.now()}`,
        name: 'Rapid Prototyping Profile',
        description: 'Optimized for quick iteration and concise outputs',
        tuningSettings: {
          clarity: 0.8,
          technicality: 0.6,
          foresight: 0.5,
          riskAversion: 0.4,
          userCentricity: 0.8,
          conciseness: 0.9,
          creativity: 0.8,
          modularity: 0.7,
        },
        modelConfiguration: {
          model: 'gemini-2.0-flash-exp',
          temperature: 1.6,
          maxTokens: 1000,
        },
        userId: 'system',
        isBuiltIn: true,
        isShared: true,
        usage: {
          timesUsed: 0,
          lastUsed: new Date(),
          averageRating: 0,
          feedback: [],
        },
        createdAt: new Date(),
      });
    } else {
      profiles.push({
        id: `ai-profile-detailed-${Date.now()}`,
        name: 'Detailed Technical Profile',
        description: 'Comprehensive analysis with high technical depth',
        tuningSettings: {
          clarity: 0.9,
          technicality: 0.95,
          foresight: 0.8,
          riskAversion: 0.7,
          userCentricity: 0.6,
          conciseness: 0.3,
          technicalDepth: 0.95,
          standardsAdherence: 0.9,
        },
        modelConfiguration: {
          model: 'gemini-2.0-flash-exp',
          temperature: 0.6,
          maxTokens: 4000,
        },
        userId: 'system',
        isBuiltIn: true,
        isShared: true,
        usage: {
          timesUsed: 0,
          lastUsed: new Date(),
          averageRating: 0,
          feedback: [],
        },
        createdAt: new Date(),
      });
    }

    return profiles;
  }

  private generatePhaseTemplates(developmentMode: 'full' | 'rapid', disciplines: string[]): any[] {
    // Preserve existing 7-phase structure
    const basePhases = [
      {
        name: 'Requirements',
        description: 'Define project requirements and scope',
        sprints: [
          { name: 'Project Scope', description: 'Define project boundaries and objectives' },
          { name: 'Statement of Work (SOW)', description: 'Formal work definition and deliverables' },
          { name: 'Technical Requirements Specification', description: 'Detailed technical requirements' },
        ],
      },
      {
        name: 'Preliminary Design',
        description: 'Explore design concepts and alternatives',
        sprints: [
          { name: 'Conceptual Design Options', description: 'Generate multiple design concepts' },
          { name: 'Trade Study Analysis', description: 'Compare and evaluate design alternatives' },
        ],
      },
      {
        name: 'Critical Design',
        description: 'Finalize detailed design specifications',
        sprints: [
          { name: 'Detailed Design Specification', description: 'Complete technical design documentation' },
          { name: 'Design Review Package', description: 'Prepare comprehensive design review materials' },
        ],
      },
      {
        name: 'Testing',
        description: 'Verify and validate the design',
        sprints: [
          { name: 'Verification Plan', description: 'Plan for design verification activities' },
          { name: 'Validation Plan', description: 'Plan for system validation activities' },
        ],
      },
      {
        name: 'Launch',
        description: 'Deploy and launch the solution',
        sprints: [
          { name: 'Implementation Plan', description: 'Plan for solution deployment' },
          { name: 'Launch Readiness Review', description: 'Final readiness assessment' },
        ],
      },
      {
        name: 'Operation',
        description: 'Monitor and maintain operational performance',
        sprints: [
          { name: 'Operations Manual', description: 'Document operational procedures' },
          { name: 'Performance Monitoring Plan', description: 'Plan for ongoing performance tracking' },
        ],
      },
      {
        name: 'Improvement',
        description: 'Identify and implement improvements',
        sprints: [
          { name: 'Lessons Learned', description: 'Capture project insights and learnings' },
          { name: 'Improvement Recommendations', description: 'Recommend future enhancements' },
        ],
      },
    ];

    // Customize phases based on development mode
    if (developmentMode === 'rapid') {
      // Simplify phases for rapid prototyping
      return basePhases.map(phase => ({
        ...phase,
        sprints: phase.sprints.slice(0, Math.max(1, Math.floor(phase.sprints.length / 2))),
        estimatedDuration: Math.ceil(phase.sprints.length * 2), // 2 days per sprint
        requiredRoles: ['engineer', 'coordinator'],
        deliverableTemplates: [],
      }));
    }

    return basePhases.map(phase => ({
      ...phase,
      estimatedDuration: phase.sprints.length * 5, // 5 days per sprint
      requiredRoles: this.getPhaseRequiredRoles(phase.name, disciplines),
      deliverableTemplates: [],
    }));
  }

  private generateIntegrationRequirements(disciplines: string[]): any[] {
    const integrations: any[] = [];

    // Add CAD integration for design-heavy disciplines
    const designDisciplines = ['Mechanical Engineering', 'Civil Engineering', 'Aerospace Engineering'];
    if (disciplines.some(d => designDisciplines.includes(d))) {
      integrations.push({
        type: 'cad',
        provider: 'solidworks',
        required: false,
        configuration: { syncFrequency: 'daily' },
      });
    }

    // Add simulation integration for analysis-heavy disciplines
    const simulationDisciplines = ['Mechanical Engineering', 'Aerospace Engineering', 'Chemical Engineering'];
    if (disciplines.some(d => simulationDisciplines.includes(d))) {
      integrations.push({
        type: 'simulation',
        provider: 'ansys',
        required: false,
        configuration: { autoRun: false },
      });
    }

    return integrations;
  }

  private generatePhasesFromTemplate(template: Template): any[] {
    return template.phases.map((phaseTemplate, index) => ({
      id: `phase-${index}`,
      name: phaseTemplate.name,
      description: phaseTemplate.description,
      status: 'not-started',
      sprints: phaseTemplate.sprints?.map((sprintTemplate, sprintIndex) => ({
        id: `sprint-${index}-${sprintIndex}`,
        name: sprintTemplate.name,
        description: sprintTemplate.description,
        status: 'not-started',
        deliverables: sprintTemplate.deliverables || [],
      })) || [],
      tuningSettings: phaseTemplate.tuningSettings || {},
      isEditable: true,
      designReview: phaseTemplate.designReview,
    }));
  }

  private convertPhasesToTemplates(phases: any[]): any[] {
    return phases.map(phase => ({
      name: phase.name,
      description: phase.description,
      sprints: phase.sprints.map((sprint: any) => ({
        name: sprint.name,
        description: sprint.description,
        deliverables: sprint.deliverables,
      })),
      tuningSettings: phase.tuningSettings,
      designReview: phase.designReview,
      estimatedDuration: phase.sprints.length * 5,
      requiredRoles: [],
      deliverableTemplates: [],
    }));
  }

  private getPhaseRequiredRoles(phaseName: string, disciplines: string[]): string[] {
    const roleMap: Record<string, string[]> = {
      'Requirements': ['systems-engineer', 'business-analyst'],
      'Preliminary Design': ['design-engineer', 'systems-engineer'],
      'Critical Design': ['design-engineer', 'technical-lead'],
      'Testing': ['test-engineer', 'quality-assurance'],
      'Launch': ['project-manager', 'deployment-engineer'],
      'Operation': ['operations-engineer', 'support-engineer'],
      'Improvement': ['process-engineer', 'continuous-improvement-specialist'],
    };

    return roleMap[phaseName] || ['engineer'];
  }

  private generateDefaultPermissions(): any[] {
    return [
      { id: 'read-project', name: 'Read Project', resource: 'project', action: 'read' },
      { id: 'write-documents', name: 'Write Documents', resource: 'document', action: 'write' },
      { id: 'comment', name: 'Comment', resource: 'document', action: 'comment' },
    ];
  }

  private generateManagerPermissions(): any[] {
    return [
      ...this.generateDefaultPermissions(),
      { id: 'assign-tasks', name: 'Assign Tasks', resource: 'task', action: 'assign' },
      { id: 'manage-team', name: 'Manage Team', resource: 'team', action: 'manage' },
    ];
  }

  private generateAdminPermissions(): any[] {
    return [
      ...this.generateManagerPermissions(),
      { id: 'admin-project', name: 'Admin Project', resource: 'project', action: 'admin' },
      { id: 'approve-reviews', name: 'Approve Reviews', resource: 'review', action: 'approve' },
    ];
  }

  private applyTerminology(text: string, terminology: Record<string, string>): string {
    let result = text;
    for (const [original, replacement] of Object.entries(terminology)) {
      result = result.replace(new RegExp(original, 'gi'), replacement);
    }
    return result;
  }

  private adjustRoleHierarchy(roles: DynamicRole[], hierarchy: string): DynamicRole[] {
    // Implement hierarchy adjustments based on organization preferences
    return roles.map(role => ({
      ...role,
      // Adjust reporting relationships based on hierarchy type
      reportsTo: hierarchy === 'flat' ? [] : role.reportsTo,
    }));
  }
}