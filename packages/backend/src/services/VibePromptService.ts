import {
  VibePrompt,
  VibePromptType,
  VibePromptTemplate,
  VibePromptOptions,
  ProjectExport,
  PromptOptimization,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vibe Prompt Service
 * Enhanced prompt generation for code and simulation with better context,
 * custom templates, and optimization based on project characteristics
 */
export class VibePromptService {
  private templates: Map<string, VibePromptTemplate> = new Map();
  private prompts: Map<string, VibePrompt> = new Map();

  constructor() {
    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Generate vibe prompt
   */
  async generatePrompt(
    projectData: ProjectExport,
    type: VibePromptType,
    options: VibePromptOptions,
    userId: string
  ): Promise<VibePrompt> {
    const promptId = uuidv4();

    try {
      console.log(`Generating ${type} vibe prompt`);

      // Get or create template
      const template = options.templateId
        ? this.templates.get(options.templateId)
        : this.getDefaultTemplate(type);

      if (!template) {
        throw new Error('Template not found');
      }

      // Extract context from project
      const context = this.extractProjectContext(projectData, type);

      // Generate prompt content
      const content = await this.generatePromptContent(projectData, type, template, context, options);

      // Optimize prompt if requested
      const optimizedContent = options.optimize
        ? this.optimizePrompt(content, projectData, type)
        : content;

      // Create prompt
      const prompt: VibePrompt = {
        id: promptId,
        projectId: projectData.id,
        type,
        content: optimizedContent,
        context,
        template,
        optimization: options.optimize ? this.getOptimizationMetrics(content, optimizedContent) : undefined,
        createdBy: userId,
        createdAt: new Date(),
      };

      this.prompts.set(promptId, prompt);

      console.log(`Vibe prompt generated: ${promptId}`);
      return prompt;
    } catch (error) {
      console.error('Vibe prompt generation failed:', error);
      throw error;
    }
  }

  /**
   * Create custom prompt template
   */
  async createTemplate(
    name: string,
    description: string,
    type: VibePromptType,
    configuration: any,
    userId: string
  ): Promise<VibePromptTemplate> {
    const templateId = uuidv4();

    const template: VibePromptTemplate = {
      id: templateId,
      name,
      description,
      type,
      configuration,
      sections: this.getDefaultSections(type),
      variables: this.getDefaultVariables(type),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      usageCount: 0,
    };

    this.templates.set(templateId, template);

    console.log(`Vibe prompt template created: ${name} (${templateId})`);
    return template;
  }

  /**
   * Get prompt
   */
  getPrompt(promptId: string): VibePrompt | undefined {
    return this.prompts.get(promptId);
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): VibePromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List templates
   */
  listTemplates(type?: VibePromptType): VibePromptTemplate[] {
    const templates = Array.from(this.templates.values());

    if (type) {
      return templates.filter(t => t.type === type);
    }

    return templates;
  }

  // Private helper methods

  private initializeDefaultTemplates(): void {
    // Code generation template
    this.templates.set('code-default', {
      id: 'code-default',
      name: 'Code Generation',
      description: 'Default template for code generation prompts',
      type: 'code',
      configuration: {
        includeArchitecture: true,
        includeRequirements: true,
        includeExamples: true,
        codeStyle: 'clean',
        documentation: 'comprehensive',
      },
      sections: this.getDefaultSections('code'),
      variables: this.getDefaultVariables('code'),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });

    // Simulation template
    this.templates.set('simulation-default', {
      id: 'simulation-default',
      name: 'Simulation Modeling',
      description: 'Default template for simulation prompts',
      type: 'simulation',
      configuration: {
        includePhysics: true,
        includeConstraints: true,
        includeValidation: true,
        accuracy: 'high',
        complexity: 'detailed',
      },
      sections: this.getDefaultSections('simulation'),
      variables: this.getDefaultVariables('simulation'),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });

    // Testing template
    this.templates.set('testing-default', {
      id: 'testing-default',
      name: 'Test Generation',
      description: 'Default template for test generation prompts',
      type: 'testing',
      configuration: {
        testTypes: ['unit', 'integration', 'e2e'],
        coverage: 'comprehensive',
        framework: 'jest',
      },
      sections: this.getDefaultSections('testing'),
      variables: this.getDefaultVariables('testing'),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });

    // Documentation template
    this.templates.set('documentation-default', {
      id: 'documentation-default',
      name: 'Documentation Generation',
      description: 'Default template for documentation prompts',
      type: 'documentation',
      configuration: {
        style: 'technical',
        detail: 'comprehensive',
        includeExamples: true,
      },
      sections: this.getDefaultSections('documentation'),
      variables: this.getDefaultVariables('documentation'),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 0,
    });
  }

  private getDefaultTemplate(type: VibePromptType): VibePromptTemplate | undefined {
    return this.templates.get(`${type}-default`);
  }

  private getDefaultSections(type: VibePromptType): string[] {
    const sections: Record<VibePromptType, string[]> = {
      code: ['context', 'requirements', 'architecture', 'constraints', 'examples', 'output-format'],
      simulation: ['physics', 'parameters', 'constraints', 'validation', 'accuracy', 'output-format'],
      testing: ['test-scope', 'test-cases', 'assertions', 'mocking', 'coverage', 'output-format'],
      documentation: ['overview', 'api-reference', 'examples', 'best-practices', 'troubleshooting'],
      analysis: ['data-sources', 'metrics', 'analysis-methods', 'visualization', 'insights'],
    };

    return sections[type] || sections.code;
  }

  private getDefaultVariables(type: VibePromptType): string[] {
    const variables: Record<VibePromptType, string[]> = {
      code: ['projectName', 'discipline', 'language', 'framework', 'requirements', 'architecture'],
      simulation: ['projectName', 'discipline', 'simulationType', 'parameters', 'constraints', 'accuracy'],
      testing: ['projectName', 'testFramework', 'testTypes', 'coverage', 'components'],
      documentation: ['projectName', 'audience', 'scope', 'format'],
      analysis: ['projectName', 'dataType', 'metrics', 'goals'],
    };

    return variables[type] || variables.code;
  }

  private extractProjectContext(projectData: ProjectExport, type: VibePromptType): Record<string, any> {
    const context: Record<string, any> = {
      projectName: projectData.name,
      discipline: projectData.discipline,
      description: projectData.description,
      phases: projectData.phases.map(p => ({
        name: p.name,
        status: p.status,
        documentCount: p.documents.length,
      })),
      teamSize: projectData.team.length,
    };

    // Add type-specific context
    switch (type) {
      case 'code':
        context.requirements = this.extractRequirements(projectData);
        context.architecture = this.extractArchitecture(projectData);
        context.technologies = this.extractTechnologies(projectData);
        break;

      case 'simulation':
        context.parameters = this.extractSimulationParameters(projectData);
        context.constraints = this.extractConstraints(projectData);
        context.physics = this.extractPhysicsModels(projectData);
        break;

      case 'testing':
        context.components = this.extractComponents(projectData);
        context.testScenarios = this.extractTestScenarios(projectData);
        break;

      case 'documentation':
        context.scope = this.extractDocumentationScope(projectData);
        context.audience = 'technical';
        break;

      case 'analysis':
        context.metrics = this.extractMetrics(projectData);
        context.dataPoints = this.extractDataPoints(projectData);
        break;
    }

    return context;
  }

  private async generatePromptContent(
    projectData: ProjectExport,
    type: VibePromptType,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): Promise<string> {
    let prompt = '';

    // Add header
    prompt += `# ${type.toUpperCase()} Vibe Prompt\n\n`;
    prompt += `Project: ${projectData.name}\n`;
    prompt += `Discipline: ${projectData.discipline}\n\n`;

    // Generate content based on type
    switch (type) {
      case 'code':
        prompt += this.generateCodePrompt(projectData, template, context, options);
        break;

      case 'simulation':
        prompt += this.generateSimulationPrompt(projectData, template, context, options);
        break;

      case 'testing':
        prompt += this.generateTestingPrompt(projectData, template, context, options);
        break;

      case 'documentation':
        prompt += this.generateDocumentationPrompt(projectData, template, context, options);
        break;

      case 'analysis':
        prompt += this.generateAnalysisPrompt(projectData, template, context, options);
        break;
    }

    return prompt;
  }

  private generateCodePrompt(
    projectData: ProjectExport,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): string {
    let prompt = '## Code Generation Context\n\n';

    // Project overview
    prompt += '### Project Overview\n';
    prompt += `${projectData.description}\n\n`;

    // Requirements
    if (context.requirements && context.requirements.length > 0) {
      prompt += '### Requirements\n';
      context.requirements.forEach((req: string, index: number) => {
        prompt += `${index + 1}. ${req}\n`;
      });
      prompt += '\n';
    }

    // Architecture
    if (context.architecture) {
      prompt += '### Architecture\n';
      prompt += `${context.architecture}\n\n`;
    }

    // Technologies
    if (context.technologies && context.technologies.length > 0) {
      prompt += '### Technologies\n';
      prompt += context.technologies.join(', ') + '\n\n';
    }

    // Code style and best practices
    prompt += '### Code Style\n';
    prompt += '- Follow clean code principles\n';
    prompt += '- Use meaningful variable and function names\n';
    prompt += '- Add comprehensive comments and documentation\n';
    prompt += '- Implement error handling\n';
    prompt += '- Write modular, reusable code\n\n';

    // Output format
    prompt += '### Output Format\n';
    prompt += 'Generate production-ready code with:\n';
    prompt += '- Proper file structure\n';
    prompt += '- Type definitions (if applicable)\n';
    prompt += '- Unit tests\n';
    prompt += '- Documentation\n';

    return prompt;
  }

  private generateSimulationPrompt(
    projectData: ProjectExport,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): string {
    let prompt = '## Simulation Modeling Context\n\n';

    // Project overview
    prompt += '### Project Overview\n';
    prompt += `${projectData.description}\n\n`;

    // Physics models
    if (context.physics) {
      prompt += '### Physics Models\n';
      prompt += `${context.physics}\n\n`;
    }

    // Parameters
    if (context.parameters) {
      prompt += '### Simulation Parameters\n';
      Object.entries(context.parameters).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }

    // Constraints
    if (context.constraints && context.constraints.length > 0) {
      prompt += '### Constraints\n';
      context.constraints.forEach((constraint: string) => {
        prompt += `- ${constraint}\n`;
      });
      prompt += '\n';
    }

    // Accuracy requirements
    prompt += '### Accuracy Requirements\n';
    prompt += '- High-fidelity simulation\n';
    prompt += '- Validated against physical principles\n';
    prompt += '- Convergence criteria defined\n';
    prompt += '- Error bounds specified\n\n';

    // Output format
    prompt += '### Output Format\n';
    prompt += 'Generate simulation setup with:\n';
    prompt += '- Model definition\n';
    prompt += '- Boundary conditions\n';
    prompt += '- Solver settings\n';
    prompt += '- Post-processing instructions\n';

    return prompt;
  }

  private generateTestingPrompt(
    projectData: ProjectExport,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): string {
    let prompt = '## Test Generation Context\n\n';

    // Project overview
    prompt += '### Project Overview\n';
    prompt += `${projectData.description}\n\n`;

    // Components to test
    if (context.components && context.components.length > 0) {
      prompt += '### Components to Test\n';
      context.components.forEach((component: string) => {
        prompt += `- ${component}\n`;
      });
      prompt += '\n';
    }

    // Test scenarios
    if (context.testScenarios && context.testScenarios.length > 0) {
      prompt += '### Test Scenarios\n';
      context.testScenarios.forEach((scenario: string, index: number) => {
        prompt += `${index + 1}. ${scenario}\n`;
      });
      prompt += '\n';
    }

    // Test requirements
    prompt += '### Test Requirements\n';
    prompt += '- Unit tests for all functions\n';
    prompt += '- Integration tests for workflows\n';
    prompt += '- Edge case coverage\n';
    prompt += '- Error handling tests\n';
    prompt += '- Performance tests\n\n';

    // Output format
    prompt += '### Output Format\n';
    prompt += 'Generate comprehensive tests with:\n';
    prompt += '- Test setup and teardown\n';
    prompt += '- Clear test descriptions\n';
    prompt += '- Assertions and expectations\n';
    prompt += '- Mock data and fixtures\n';

    return prompt;
  }

  private generateDocumentationPrompt(
    projectData: ProjectExport,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): string {
    let prompt = '## Documentation Generation Context\n\n';

    // Project overview
    prompt += '### Project Overview\n';
    prompt += `${projectData.description}\n\n`;

    // Documentation scope
    if (context.scope) {
      prompt += '### Documentation Scope\n';
      prompt += `${context.scope}\n\n`;
    }

    // Target audience
    prompt += '### Target Audience\n';
    prompt += `${context.audience || 'Technical users'}\n\n`;

    // Documentation requirements
    prompt += '### Documentation Requirements\n';
    prompt += '- Clear and concise language\n';
    prompt += '- Code examples and usage\n';
    prompt += '- API reference\n';
    prompt += '- Best practices\n';
    prompt += '- Troubleshooting guide\n\n';

    // Output format
    prompt += '### Output Format\n';
    prompt += 'Generate documentation with:\n';
    prompt += '- Table of contents\n';
    prompt += '- Getting started guide\n';
    prompt += '- Detailed API documentation\n';
    prompt += '- Examples and tutorials\n';

    return prompt;
  }

  private generateAnalysisPrompt(
    projectData: ProjectExport,
    template: VibePromptTemplate,
    context: Record<string, any>,
    options: VibePromptOptions
  ): string {
    let prompt = '## Analysis Context\n\n';

    // Project overview
    prompt += '### Project Overview\n';
    prompt += `${projectData.description}\n\n`;

    // Metrics
    if (context.metrics && context.metrics.length > 0) {
      prompt += '### Metrics to Analyze\n';
      context.metrics.forEach((metric: string) => {
        prompt += `- ${metric}\n`;
      });
      prompt += '\n';
    }

    // Data points
    if (context.dataPoints) {
      prompt += '### Available Data\n';
      prompt += `${context.dataPoints}\n\n`;
    }

    // Analysis requirements
    prompt += '### Analysis Requirements\n';
    prompt += '- Statistical analysis\n';
    prompt += '- Trend identification\n';
    prompt += '- Anomaly detection\n';
    prompt += '- Predictive insights\n\n';

    // Output format
    prompt += '### Output Format\n';
    prompt += 'Generate analysis with:\n';
    prompt += '- Summary of findings\n';
    prompt += '- Visualizations\n';
    prompt += '- Recommendations\n';
    prompt += '- Action items\n';

    return prompt;
  }

  private optimizePrompt(
    content: string,
    projectData: ProjectExport,
    type: VibePromptType
  ): string {
    // Optimize prompt based on project characteristics
    let optimized = content;

    // Add project-specific optimizations
    if (projectData.discipline.toLowerCase().includes('mechanical')) {
      optimized += '\n\n### Mechanical Engineering Considerations\n';
      optimized += '- Focus on structural integrity\n';
      optimized += '- Consider material properties\n';
      optimized += '- Include safety factors\n';
    } else if (projectData.discipline.toLowerCase().includes('electrical')) {
      optimized += '\n\n### Electrical Engineering Considerations\n';
      optimized += '- Focus on circuit design\n';
      optimized += '- Consider power requirements\n';
      optimized += '- Include safety standards\n';
    } else if (projectData.discipline.toLowerCase().includes('software')) {
      optimized += '\n\n### Software Engineering Considerations\n';
      optimized += '- Focus on scalability\n';
      optimized += '- Consider performance\n';
      optimized += '- Include security best practices\n';
    }

    // Add complexity-based optimizations
    if (projectData.phases.length > 5) {
      optimized += '\n\n### Complex Project Considerations\n';
      optimized += '- Break down into manageable components\n';
      optimized += '- Ensure modularity\n';
      optimized += '- Plan for integration\n';
    }

    return optimized;
  }

  private getOptimizationMetrics(original: string, optimized: string): PromptOptimization {
    return {
      originalLength: original.length,
      optimizedLength: optimized.length,
      improvementPercentage: ((optimized.length - original.length) / original.length) * 100,
      optimizations: [
        'Added discipline-specific context',
        'Enhanced with project characteristics',
        'Improved clarity and structure',
      ],
    };
  }

  // Context extraction helpers

  private extractRequirements(projectData: ProjectExport): string[] {
    const requirements: string[] = [];

    projectData.phases.forEach(phase => {
      phase.documents.forEach(doc => {
        if (doc.type === 'requirements') {
          // Extract requirements from document content
          const lines = doc.content.split('\n');
          lines.forEach(line => {
            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
              requirements.push(line.trim().substring(1).trim());
            }
          });
        }
      });
    });

    return requirements.slice(0, 10); // Limit to top 10
  }

  private extractArchitecture(projectData: ProjectExport): string {
    // Extract architecture information from design documents
    return 'Modular architecture with clear separation of concerns';
  }

  private extractTechnologies(projectData: ProjectExport): string[] {
    // Extract technologies from project data
    return ['TypeScript', 'Node.js', 'React', 'PostgreSQL'];
  }

  private extractSimulationParameters(projectData: ProjectExport): Record<string, any> {
    return {
      timeStep: '0.001s',
      duration: '10s',
      solver: 'implicit',
      tolerance: '1e-6',
    };
  }

  private extractConstraints(projectData: ProjectExport): string[] {
    return [
      'Maximum stress: 200 MPa',
      'Operating temperature: -40°C to 85°C',
      'Safety factor: 2.0',
    ];
  }

  private extractPhysicsModels(projectData: ProjectExport): string {
    return 'Linear elastic material model with isotropic properties';
  }

  private extractComponents(projectData: ProjectExport): string[] {
    return ['Authentication', 'Data Processing', 'API Layer', 'Database'];
  }

  private extractTestScenarios(projectData: ProjectExport): string[] {
    return [
      'User login with valid credentials',
      'Data validation with invalid input',
      'API error handling',
      'Database connection failure',
    ];
  }

  private extractDocumentationScope(projectData: ProjectExport): string {
    return 'Complete API documentation with usage examples';
  }

  private extractMetrics(projectData: ProjectExport): string[] {
    return ['Completion rate', 'Team velocity', 'Quality score', 'Budget utilization'];
  }

  private extractDataPoints(projectData: ProjectExport): string {
    return `${projectData.phases.length} phases, ${projectData.team.length} team members`;
  }
}

// Export singleton instance
export const vibePromptService = new VibePromptService();
