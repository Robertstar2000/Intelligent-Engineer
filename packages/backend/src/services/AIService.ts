// Fallback type definitions for Google Generative AI
interface GenerateContentResponse {
  response: {
    text(): string;
  };
}

interface GoogleGenerativeAI {
  getGenerativeModel(config: any): any;
}

// Try to import, fallback to mock if not available
let GoogleGenerativeAI: any;
try {
  const module = await import('@google/generative-ai');
  GoogleGenerativeAI = module.GoogleGenerativeAI;
} catch (error) {
  console.warn('Google Generative AI not available, using mock');
  GoogleGenerativeAI = class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: {
            text: () => JSON.stringify({ error: 'AI service not configured' })
          }
        })
      };
    }
  };
}
import { TuningSettings, Project, Phase, Sprint, AIProfile } from '@shared/types';
import { config } from '../config';

// Enhanced AI Context interface building on existing patterns
export interface AIContext {
  // Existing context structure preserved
  projectName: string;
  disciplines: string[];
  requirements: string;
  constraints: string;
  developmentMode: 'full' | 'rapid';
  
  // Enhanced context from previous phases
  previousPhaseOutputs: PhaseOutput[];
  currentPhase: string;
  sprintContext: string;
  
  // New collaborative context
  teamContext?: TeamContext;
  organizationContext?: OrganizationContext;
}

export interface PhaseOutput {
  phaseName: string;
  phaseId: string;
  output: string;
  sprints: SprintOutput[];
}

export interface SprintOutput {
  sprintName: string;
  sprintId: string;
  output: string;
}

export interface TeamContext {
  teamSize: number;
  roles: string[];
  collaborationLevel: 'individual' | 'team' | 'enterprise';
}

export interface OrganizationContext {
  industry: string;
  complianceRequirements: string[];
  customTerminology: Record<string, string>;
}

export interface AIResponse {
  content: string;
  confidence: number;
  model: string;
  tokensUsed: number;
  generatedAt: Date;
}

export interface RiskAnalysis {
  risks: Risk[];
  overallScore: number;
  mitigationStrategies: MitigationStrategy[];
  confidenceLevel: number;
}

export interface Risk {
  id: string;
  type: 'schedule' | 'budget' | 'technical' | 'resource' | 'compliance';
  probability: number;
  impact: number;
  description: string;
  affectedAreas: string[];
  detectedAt: Date;
}

export interface MitigationStrategy {
  id: string;
  riskId: string;
  strategy: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  effectiveness: number;
}

/**
 * Enhanced AI Service that preserves existing Google Gemini integration
 * while adding new collaborative and advanced AI capabilities
 */
export class AIService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor() {
    if (!config.ai.geminiApiKey) {
      throw new Error('Google Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    this.defaultModel = 'gemini-2.0-flash-exp';
  }

  /**
   * Enhanced content generation preserving existing patterns
   * Maintains backward compatibility with existing PhaseView component
   */
  async generateContent(
    prompt: string,
    context: AIContext,
    tuningSettings: TuningSettings = {},
    systemInstruction?: string
  ): Promise<AIResponse> {
    try {
      // Validate prompt size (preserving existing validation)
      const MAX_PROMPT_CHARACTERS = 50000;
      if (prompt.length > MAX_PROMPT_CHARACTERS) {
        throw new Error(
          `The generated prompt is too long (${prompt.length} characters), ` +
          `exceeding the ${MAX_PROMPT_CHARACTERS} character limit. ` +
          `Please shorten project requirements, constraints, or previous document outputs.`
        );
      }

      const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
      
      // Apply tuning settings to generation config
      const generationConfig = this.buildGenerationConfig(tuningSettings);
      
      // Build enhanced system instruction
      const enhancedSystemInstruction = this.buildSystemInstruction(
        systemInstruction,
        context,
        tuningSettings
      );

      const response: GenerateContentResponse = await this.withRetry(() =>
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: enhancedSystemInstruction,
          generationConfig,
        })
      );

      const content = response.response.text();
      
      return {
        content,
        confidence: 0.85, // Default confidence, can be enhanced with model feedback
        model: this.defaultModel,
        tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('AI content generation failed:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Enhanced phase document generation preserving existing patterns
   * Maintains compatibility with existing PhaseView workflow
   */
  async generatePhaseDocument(
    phaseType: string,
    sprintType: string,
    projectContext: Project,
    tuningSettings: TuningSettings = {}
  ): Promise<string> {
    // Build context from existing project structure
    const context: AIContext = {
      projectName: projectContext.name,
      disciplines: projectContext.disciplines,
      requirements: projectContext.requirements,
      constraints: projectContext.constraints,
      developmentMode: projectContext.developmentMode,
      previousPhaseOutputs: this.extractPreviousPhaseOutputs(projectContext),
      currentPhase: phaseType,
      sprintContext: sprintType,
    };

    // Get phase-specific prompt (preserving existing prompt structure)
    const prompt = this.buildPhasePrompt(phaseType, sprintType, projectContext, context);
    
    // Get system instruction (preserving existing patterns)
    const systemInstruction = this.buildPhaseSystemInstruction(
      phaseType,
      projectContext.developmentMode
    );

    const response = await this.generateContent(
      prompt,
      context,
      tuningSettings,
      systemInstruction
    );

    return response.content;
  }

  /**
   * Enhanced design review checklist generation preserving existing patterns
   */
  async generateDesignReviewChecklist(
    documentContent: string,
    phaseType: string,
    projectContext: Project
  ): Promise<string[]> {
    const context: AIContext = {
      projectName: projectContext.name,
      disciplines: projectContext.disciplines,
      requirements: projectContext.requirements,
      constraints: projectContext.constraints,
      developmentMode: projectContext.developmentMode,
      previousPhaseOutputs: [],
      currentPhase: phaseType,
      sprintContext: 'design-review',
    };

    let systemInstruction = `You are a Principal Systems Engineer AI specializing in formal design gate reviews. Your task is to generate a rigorous checklist based on the provided design document. The checklist must verify that the design thoroughly addresses all project requirements, constraints, and adheres to best-in-class engineering principles.

- For a 'Preliminary Design' phase, focus on: concept feasibility, analysis of alternatives (trade studies), risk assessment, and clear alignment with top-level requirements.
- For a 'Critical Design' phase, focus on: detailed component specifications, manufacturability (DFMA), failure mode analysis (FMEA), verification & validation plan, and compliance with all relevant standards.

Generate 5-7 critical, actionable checklist items that a review board would use to grant a go/no-go decision. Output must be a JSON object with a 'checklist' key containing an array of strings.`;

    if (projectContext.developmentMode === 'rapid') {
      systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
    }

    const userPrompt = `## Project: ${projectContext.name}

### Requirements:
\`\`\`text
${projectContext.requirements}
\`\`\`

### Constraints:
\`\`\`text
${projectContext.constraints}
\`\`\`
---
## Design Document for Review (Phase: ${phaseType}):
\`\`\`markdown
${documentContent}
\`\`\`
---
## Task:
Generate the JSON checklist for the ${phaseType} review.`;

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.defaultModel,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const response = await this.withRetry(() =>
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction,
        })
      );

      const resultJson = JSON.parse((response as GenerateContentResponse).response.text());
      return resultJson.checklist || [];
    } catch (error: any) {
      console.error('Design review checklist generation failed:', error);
      throw new Error(`Checklist generation failed: ${error.message}`);
    }
  }

  /**
   * Basic risk analysis implementation (foundation for advanced features)
   */
  async analyzeRisk(projectData: Project): Promise<RiskAnalysis> {
    const context: AIContext = {
      projectName: projectData.name,
      disciplines: projectData.disciplines,
      requirements: projectData.requirements,
      constraints: projectData.constraints,
      developmentMode: projectData.developmentMode,
      previousPhaseOutputs: this.extractPreviousPhaseOutputs(projectData),
      currentPhase: 'risk-analysis',
      sprintContext: 'project-risk-assessment',
    };

    const prompt = `Analyze the following project for potential risks:

Project: ${projectData.name}
Disciplines: ${projectData.disciplines.join(', ')}
Development Mode: ${projectData.developmentMode}
Current Phase: ${projectData.currentPhase}

Requirements:
${projectData.requirements}

Constraints:
${projectData.constraints}

Identify potential schedule, budget, technical, resource, and compliance risks. 
For each risk, provide probability (0-1), impact (0-1), and mitigation strategies.
Return as JSON with risks array containing: type, probability, impact, description, mitigationStrategies.`;

    const systemInstruction = `You are an expert project risk analyst. Analyze engineering projects for potential risks and provide actionable mitigation strategies. Focus on realistic, data-driven assessments.`;

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.defaultModel,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const response = await this.withRetry(() =>
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction,
        })
      );

      const riskData = JSON.parse((response as GenerateContentResponse).response.text());
      
      // Transform AI response to structured risk analysis
      const risks: Risk[] = (riskData.risks || []).map((risk: any, index: number) => ({
        id: `risk-${Date.now()}-${index}`,
        type: risk.type || 'technical',
        probability: risk.probability || 0.5,
        impact: risk.impact || 0.5,
        description: risk.description || 'Unknown risk',
        affectedAreas: risk.affectedAreas || [],
        detectedAt: new Date(),
      }));

      const mitigationStrategies: MitigationStrategy[] = risks.flatMap((risk, riskIndex) => 
        (riskData.risks[riskIndex]?.mitigationStrategies || []).map((strategy: any, stratIndex: number) => ({
          id: `mitigation-${Date.now()}-${riskIndex}-${stratIndex}`,
          riskId: risk.id,
          strategy: strategy.strategy || strategy,
          effort: strategy.effort || 'medium',
          timeline: strategy.timeline || '1-2 weeks',
          effectiveness: strategy.effectiveness || 0.7,
        }))
      );

      const overallScore = risks.reduce((sum, risk) => sum + (risk.probability * risk.impact), 0) / Math.max(risks.length, 1);

      return {
        risks,
        overallScore,
        mitigationStrategies,
        confidenceLevel: 0.75,
      };
    } catch (error: any) {
      console.error('Risk analysis failed:', error);
      throw new Error(`Risk analysis failed: ${error.message}`);
    }
  }

  // Private helper methods

  private buildGenerationConfig(tuningSettings: TuningSettings): any {
    const config: any = {};
    
    // Map tuning settings to generation config
    if (tuningSettings.creativity !== undefined) {
      config.temperature = Math.max(0.1, Math.min(2.0, tuningSettings.creativity / 100));
    }
    
    if (tuningSettings.conciseness !== undefined) {
      config.maxOutputTokens = tuningSettings.conciseness > 0.7 ? 1000 : 2000;
    }

    return config;
  }

  private buildSystemInstruction(
    baseInstruction: string | undefined,
    context: AIContext,
    tuningSettings: TuningSettings
  ): string {
    let instruction = baseInstruction || 'You are an expert AI engineering assistant.';
    
    // Add development mode adaptation (preserving existing pattern)
    if (context.developmentMode === 'rapid') {
      instruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
    }

    // Add discipline-specific context
    if (context.disciplines.length > 0) {
      instruction += `\n\nYou are working on a ${context.disciplines.join(', ')} engineering project.`;
    }

    return instruction;
  }

  private buildPhasePrompt(
    phaseType: string,
    sprintType: string,
    project: Project,
    context: AIContext
  ): string {
    // Preserve existing prompt structure from PhaseView
    const prompts: { [key: string]: { [key: string]: string } } = {
      'Requirements': {
        'Project Scope': "Generate a professional Project Scope document. It must include: an introduction/executive summary, clear business and project objectives, a list of key deliverables, project stakeholders, and a specific section for out-of-scope items. The tone should be formal and suitable for project sponsors.",
        'Statement of Work (SOW)': "Generate a formal Statement of Work (SOW). It must include: the period of performance, a detailed scope of work section, a breakdown of specific tasks, a list of major milestones, all tangible deliverables, and the criteria for acceptance. The language should be precise and contractual.",
        'Technical Requirements Specification': "Generate a detailed Technical Requirements Specification document. It must be structured with sections for: functional requirements (what the system must do), non-functional requirements (e.g., performance, reliability, security, scalability), data requirements, and any applicable industry standards or regulatory compliance.",
      },
      'Preliminary Design': {
        'Conceptual Design Options': "Generate at least three distinct, high-level conceptual design options to solve the core engineering problem outlined in the project requirements. For each concept, provide a brief description, a list of potential pros and cons, and a discussion of the key technologies involved. The goal is to explore the design space widely.",
        'Trade Study Analysis': "Generate a formal Trade Study Analysis document in Markdown. The document must: 1. Define clear evaluation criteria (e.g., cost, performance, manufacturability, risk, schedule). 2. Assign a weight to each criterion. 3. Create a comparison table scoring each 'Conceptual Design Option' from the previous step against the criteria. 4. Provide a summary and a final recommendation for the preferred design concept, justifying the choice based on the weighted scores. IMPORTANT: This trade study should reference the content from the 'Conceptual Design Options' document.",
      },
      'Testing': {
        'Verification Plan': "Generate a formal Verification Plan. The document must define how you will confirm the system is built correctly according to its design specifications ('Are we building the product right?'). Include: 1. A list of all requirements to be verified. 2. For each requirement, the verification method (e.g., Inspection, Analysis, Demonstration, Test). 3. A description of the test environment and required equipment. 4. Specific success/fail criteria for each test.",
        'Validation Plan': "Generate a formal Validation Plan. The document must define how you will confirm the system meets the user's needs and intended use ('Are we building the right product?'). Include: 1. A description of validation activities (e.g., user acceptance testing, operational scenarios, beta testing). 2. A list of stakeholders involved in validation. 3. The methodology for collecting feedback. 4. Criteria for determining if the overall system is valid for its intended purpose.",
      }
    };

    const specificPrompt = prompts[phaseType]?.[sprintType];
    if (!specificPrompt) {
      throw new Error(`No prompt configured for document "${sprintType}" in phase "${phaseType}".`);
    }

    // Build context from previous phases (preserving existing pattern)
    let previousContext = '';
    if (context.previousPhaseOutputs.length > 0) {
      const contextParts = context.previousPhaseOutputs.map(phaseOutput => 
        `## Context from Previous Phase (${phaseOutput.phaseName}):\n\`\`\`markdown\n${phaseOutput.output}\n\`\`\``
      );
      previousContext = `\n\n---\n\n${contextParts.join('\n\n---\n\n')}`;
    }

    return `## Project: ${context.projectName}
### Disciplines: ${context.disciplines.join(', ')}

### High-Level Requirements:
\`\`\`text
${context.requirements}
\`\`\`

### High-Level Constraints:
\`\`\`text
${context.constraints}
\`\`\`
${previousContext}
---
## Task:
Generate the **${sprintType}** document based on the prompt below:
"${specificPrompt}"`;
  }

  private buildPhaseSystemInstruction(phaseType: string, developmentMode: 'full' | 'rapid'): string {
    let instruction = `You are an expert AI engineering assistant specializing in project documentation. Your task is to generate a single, comprehensive engineering document based on the specified type. The document must be well-structured in Markdown, tailored to the project's details, and ready for professional use.`;
    
    if (developmentMode === 'rapid') {
      instruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
    }

    return instruction;
  }

  private extractPreviousPhaseOutputs(project: Project): PhaseOutput[] {
    return project.phases
      .filter(phase => phase.status === 'completed' && phase.output)
      .map(phase => ({
        phaseName: phase.name,
        phaseId: phase.id,
        output: phase.output || '',
        sprints: phase.sprints
          .filter(sprint => sprint.output)
          .map(sprint => ({
            sprintName: sprint.name,
            sprintId: sprint.id,
            output: sprint.output || '',
          })),
      }));
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0) {
        console.warn('AI API call failed, retrying...', error);
        await new Promise(res => setTimeout(res, 1000));
        return this.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }
}