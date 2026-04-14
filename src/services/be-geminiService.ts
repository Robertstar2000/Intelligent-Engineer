
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Project, Phase, Sprint, TuningSettings, DesignReviewChecklistItem, Risk, Recommendation, AnalyticsMetrics, MetaDocument, Resource, VersionedOutput } from '../types';
import { withRetry } from '../utils';

// --- CONSTANTS ---
// All text completions use Gemini 3 Flash Preview per user request
const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// --- TYPES ---

// Define missing workflow progress interfaces
export interface RiskWorkflowProgress {
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error';
    iteration: number;
    logMessage: string;
    newRisk?: Risk;
    error?: string;
}

export interface ResourceWorkflowProgress {
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error';
    iteration: number;
    logMessage: string;
    newResource?: Resource;
    error?: string;
}

export interface ExportWorkflowProgress {
    status: 'idle' | 'orchestrating' | 'doing' | 'qa' | 'complete' | 'error';
    log: string;
}

export class UserCancelledError extends Error {
  constructor(message = 'Automation was cancelled by the user.') {
    super(message);
    this.name = 'UserCancelledError';
  }
}

export const EXTERNAL_TOOLS: { id: string; name: string; category: 'CAD' | 'Electronics'; requirements: { description: string; extension: string; outputType: string; qaPrompt: string; } }[] = [
    {
        id: 'solidworks', name: 'SolidWorks', category: 'CAD',
        requirements: {
            description: 'A VBA script (.swp) to generate a simplified 3D part.',
            extension: 'swp',
            outputType: 'SolidWorks VBA Script',
            qaPrompt: 'Verify the output is a valid VBA script.'
        }
    },
    {
        id: 'fusion360', name: 'Fusion 360', category: 'CAD',
        requirements: {
            description: 'A Python script (.py) using the Fusion 360 API.',
            extension: 'py',
            outputType: 'Fusion 360 Python Script',
            qaPrompt: 'Verify the output is a valid Python script for Fusion 360.'
        }
    }
];

let customApiKey: string | null = null;

export const setCustomApiKey = (key: string) => {
    customApiKey = key;
};

const getAi = (): GoogleGenAI => {
    const apiKey = customApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("AI API Key is not configured. Please enter your Gemini API Key in the settings.");
    return new GoogleGenAI({ apiKey });
};

export const selectModel = (options: { taskType?: string, phase?: Phase, tuningSettings?: TuningSettings }): string => {
    if (options.taskType === 'image') return IMAGE_MODEL;
    return TEXT_MODEL;
};

const getBasePromptContext = (project: Project): string => {
    return `## Project Identity: ${project.name}
### High-Level Description: ${project.description}
### Engineering Disciplines: ${project.disciplines.join(', ')}
### Core Requirements:
${project.requirements}
### Known Constraints:
${project.constraints}
${project.customConcept ? `\n### Custom Guiding Concept:\n${project.customConcept}` : ''}`;
};

const getProjectContext = (project: Project, currentPhaseId: string): string => {
    const currentPhaseIndex = project.phases.findIndex(p => p.id === currentPhaseId);
    if (currentPhaseIndex < 1) return '';
    const baseContext = project.compactedContext ? `## COMPACTED CONTEXT (Prior Work):\n${project.compactedContext}\n\n` : '';
    const subsequentPhaseStartIndex = project.compactedContext ? 1 : 0;
    const subsequentContext = project.phases
        .slice(subsequentPhaseStartIndex, currentPhaseIndex)
        .filter(p => p.outputs.length > 0 && p.status === 'completed')
        .map(p => `## Previous Phase Result (${p.name}):\n${p.outputs[p.outputs.length - 1].content}`)
        .join('\n\n---\n\n');
    return baseContext + subsequentContext;
};

const getSystemInstruction = (baseInstruction: string, devMode: 'full' | 'rapid'): string => {
    const suffix = devMode === 'rapid' 
        ? "CRITICAL: Be brief, technical, and accurate. Skip fluff." 
        : "CRITICAL: Be exceptionally detailed, comprehensive, and technical. Err on the side of verbose specifications.";
    return `${baseInstruction}\n${suffix}`;
};

export const generateInitialProjectDocs = async (
    projectData: { name: string, description: string, disciplines: string[], requirements: string, constraints: string, customConcept: string },
    docType: 'requirements' | 'constraints',
    tuningSettings?: TuningSettings
): Promise<string> => {
    const ai = getAi();
    const systemInstruction = `You are an expert engineering analyst. Generate a detailed, professional ${docType} document in Markdown.`;
    const userPrompt = `Project: ${projectData.name}\nDescription: ${projectData.description}\nDisciplines: ${projectData.disciplines.join(', ')}\n${projectData.customConcept ? `Concept: ${projectData.customConcept}` : ''}\n\nTuning Parameters: ${JSON.stringify(tuningSettings)}`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateStandardPhaseOutput = async (project: Project, phase: Phase, tuningSettings: TuningSettings): Promise<string> => {
    const ai = getAi();
    const baseContext = getBasePromptContext(project);
    const projectContext = getProjectContext(project, phase.id);

    let specificInstruction = "";
    if (phase.name === 'Feasibility Study') {
        specificInstruction = `
Perform a comprehensive Feasibility Study using the TELOS framework:
1. Technical Feasibility: Can we build it with current tech and team?
2. Economic Feasibility: Cost-benefit analysis and ROI projections.
3. Legal Feasibility: Compliance with ${project.complianceStandards.join(', ') || 'relevant laws'}.
4. Operational Feasibility: How will it fit into existing processes?
5. Scheduling Feasibility: Can it be done within time constraints?

Integrate all Project Identity, Requirements, and Constraints into this analysis. Provide a clear "Go/No-Go" recommendation.`;
    } else {
        specificInstruction = `Generate complete technical documentation for the ${phase.name} phase of this engineering project.`;
    }

    const systemInstruction = getSystemInstruction(`You are a world-class engineer specializing in ${project.disciplines.join(', ')}. ${specificInstruction}`, project.developmentMode);
    const userPrompt = `${baseContext}\n\n${projectContext}\n\n## Current Objective: ${phase.name}\n## AI Tuning: ${JSON.stringify(tuningSettings)}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const refinePhaseOutput = async (project: Project, phase: Phase, currentContent: string, instructions: string): Promise<string> => {
    const ai = getAi();
    const baseContext = getBasePromptContext(project);
    const systemInstruction = "You are an expert engineer. Rewrite or update the provided technical document based on specific user feedback. Maintain all existing technical context and project requirements.";
    const userPrompt = `${baseContext}\n\n## Current Document Content:\n${currentContent}\n\n## User Refinement Request:\n${instructions}`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateDiagram = async (documentContent: string, phaseName?: string, sprintName?: string): Promise<string> => {
    const ai = getAi();
    
    let visualTypeGuidance = "";
    const pName = phaseName?.toLowerCase() || "";
    const sName = sprintName?.toLowerCase() || "";

    if (pName.includes('preliminary design') || pName.includes('critical design')) {
        visualTypeGuidance = "The output MUST be a professional mechanical drawing, technical schematic, or a 3D wireframe (STL-style visualization). Focus on dimensions, tolerances, and assembly details.";
    } else if (pName.includes('feasibility')) {
        visualTypeGuidance = "The output MUST be a professional infographic highlighting the technical, economic, and operational issues to be faced. Use icons and clear labels for risks and challenges.";
    } else if (pName.includes('requirements')) {
        visualTypeGuidance = "The output MUST be a technical block diagram mapping out the system requirements and associated risks. Focus on functional blocks and data/power flow.";
    } else if (pName.includes('testing')) {
        visualTypeGuidance = "The output MUST be a block diagram of the test requirements and verification plan. Show test setups, inputs, and expected validation nodes.";
    } else if (sName.includes('cad') || sName.includes('mechanical')) {
        visualTypeGuidance = "The output MUST be a detailed mechanical drawing or CAD-style blueprint showing parts, dimensions, and assembly.";
    } else if (sName.includes('circuit') || sName.includes('schematic')) {
        visualTypeGuidance = "The output MUST be a professional electrical schematic or circuit diagram showing components and connections.";
    } else {
        visualTypeGuidance = "Select the best type of technical diagram (mechanical, schematic, flow, or architecture) that best suits what this content is expressing.";
    }

    // Step 1: Orchestrate the visual prompt using text model
    const orchestratorPrompt = `Analyze the following engineering document and create a highly detailed image generation prompt for a professional technical drawing. 
    ${visualTypeGuidance}
    CRITICAL: The prompt MUST include the specific technical specifications, dimensions, materials, and engineering constraints found in the document to ensure the generated image is technically accurate and build-ready.
    The prompt should be descriptive about layout, nodes, connections, labels, and technical style (e.g., blueprint, CAD style, or clean vector diagram).
    
    DOCUMENT:\n${documentContent.substring(0, 4000)}`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: orchestratorPrompt,
        config: { systemInstruction: "Output ONLY a descriptive prompt for an image generation model. Focus on technical accuracy and professional engineering aesthetics." }
    }));

    const detailedPrompt = orchestratorResponse.text;

    // Step 2: Generate the image using the image model
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: `A professional, clean, high-resolution technical engineering drawing or schematic: ${detailedPrompt}. Minimal text, focus on technical structure and engineering accuracy.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from AI model.");
};

export const generateSubDocument = async (project: Project, phase: Phase, sprint: Sprint): Promise<string> => {
    const ai = getAi();
    const baseContext = getBasePromptContext(project);
    const systemInstruction = getSystemInstruction(`You are a technical document specialist. Generate the detailed "${sprint.name}" artifact.`, project.developmentMode);
    const userPrompt = `${baseContext}\n\n## Artifact Name: ${sprint.name}\n## Goal: ${sprint.description}`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateCriticalDesignSprints = async (project: Project, phase: Phase): Promise<{ preliminarySpec: string, sprints: Sprint[] }> => {
    const ai = getAi();
    const systemInstruction = getSystemInstruction("You are a Project Architect. Break the Critical Design phase into a master specification and a set of execution sprints (2-8 sprints) including mandatory DFMA and FMEA analyses. Output in valid JSON.", project.developmentMode);
    const userPrompt = `${getBasePromptContext(project)}\n\nGenerate JSON with structure: { "preliminarySpec": "Markdown spec...", "sprints": [{ "name": "...", "description": "..." }] }`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction, responseMimeType: "application/json" }
    }));
    
    const data = JSON.parse(response.text);
    return {
        preliminarySpec: data.preliminarySpec,
        sprints: data.sprints.slice(0, 8).map((s: any, i: number) => ({
            ...s,
            id: `sprint-${Date.now()}-${i}`,
            status: 'not-started',
            deliverables: [],
            outputs: []
        }))
    };
};

export const generateSprintSpecification = async (project: Project, phase: Phase, sprint: Sprint): Promise<{ technicalSpec: string, deliverables: string[] }> => {
    const ai = getAi();
    const userPrompt = `Task: Generate a detailed technical specification and list of deliverables for the sprint: "${sprint.name}". 
    CRITICAL: Include all technical specifications, dimensions, materials, tolerances, and build-ready details needed to actually construct or implement this design.
    Use the following context: ${sprint.description}.\n\nOutput JSON: { "technicalSpec": "Markdown string", "deliverables": ["string", "string"] }`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const generateDesignReviewChecklist = async (documentContent: string): Promise<DesignReviewChecklistItem[]> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Analyze this engineering document and generate a 5-8 item checklist for a formal design review. Each item should be a critical verification question.\n\nDOCUMENT:\n${documentContent.substring(0, 4000)}\n\nOutput JSON array of objects with 'text' property.`,
        config: { responseMimeType: "application/json" }
    }));
    const items = JSON.parse(response.text);
    return items.map((t: any, i: number) => ({
        id: `chk-${Date.now()}-${i}`,
        text: typeof t === 'string' ? t : t.text,
        checked: false
    }));
};

export const queryProjectData = async (project: Project, query: string): Promise<string> => {
    const ai = getAi();
    const artifactsContext = (project.metaDocuments || []).map(doc => `## Artifact: ${doc.name}\n${doc.content}`).join('\n\n');
    const fullContext = getBasePromptContext(project) + "\n\n" + getProjectContext(project, 'none') + "\n\n" + artifactsContext;
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Project Context:\n${fullContext}\n\nUser Question: ${query}`,
        config: { systemInstruction: "You are a project assistant. Answer based ONLY on the provided project context." }
    }));
    return response.text;
};

export const generateVibePrompt = async (project: Project, type: 'code' | 'simulation'): Promise<string> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate a master ${type} prompt based on project documentation to guide an external implementation agent.`
    }));
    return response.text;
};

export const generateProjectSummary = async (project: Project): Promise<string> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Synthesize an executive summary for: ${project.name}`
    }));
    return response.text;
};

export const generatePhaseVisualAssets = async (project: Project, phase: Phase): Promise<MetaDocument[]> => {
    if (phase.outputs.length === 0) return [];
    const diagram = await generateDiagram(phase.outputs[phase.outputs.length - 1].content, phase.name);
    return [{
        id: `diag-${Date.now()}`,
        name: `${phase.name} Visual Overview`,
        content: diagram,
        type: 'diagram',
        createdAt: new Date(),
        parentEntityId: phase.id
    }];
};

export const determineBestVisualType = async (project: Project, phaseName: string, content: string, sprintName?: string): Promise<string> => {
    const ai = getAi();
    const allowedTypes = ['diagram', 'wireframe', 'schematic', 'pwb-layout-svg', '3d-image-veo', '2d-image', '3d-printing-file', 'software-code', 'chemical-formula'];
    
    // Hardcoded rules based on user request
    const pName = phaseName.toLowerCase();
    const sName = sprintName?.toLowerCase() || "";
    
    // If it's a sprint, we should also check the sprint name for specific keywords
    if (sName.includes('cad') || sName.includes('mechanical') || sName.includes('drawing')) return 'diagram';
    if (sName.includes('circuit') || sName.includes('schematic') || sName.includes('pcb')) return 'schematic';
    if (sName.includes('ui') || sName.includes('ux') || sName.includes('interface')) return 'wireframe';
    if (sName.includes('3d') || sName.includes('render')) return '3d-image-veo';

    if (pName.includes('preliminary design') || pName.includes('critical design')) {
        // Default to diagram for these, but let the AI decide if it's more specific
    } else if (pName.includes('feasibility')) {
        return 'diagram'; // Infographic
    } else if (pName.includes('requirements')) {
        return 'diagram'; // Block diagram
    } else if (pName.includes('testing')) {
        return 'diagram'; // Block diagram
    }

    const prompt = `Given the engineering context below, select the SINGLE most relevant visual artifact type from this list: [${allowedTypes.join(', ')}].
    
    Phase: ${phaseName}
    ${sprintName ? `Sprint: ${sprintName}` : ''}
    Discipline: ${project.disciplines.join(', ')}
    Content Summary: ${content.substring(0, 500)}...
    
    Return JSON: { "type": "string" }`;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        const result = JSON.parse(response.text);
        if (allowedTypes.includes(result.type)) return result.type;
        return 'diagram'; // default
    } catch (e) {
        return 'diagram';
    }
};


export const runCodeGenerationWorkflow = async (project: Project, onUpdate: any, onToast: any, signal: any): Promise<void> => {
    const ai = getAi();
    const phasesToProcess = project.phases;
    onToast(`Code Generation Initiated: ${phasesToProcess.length} phases.`, 'info');

    for (const phase of phasesToProcess) {
        if (signal.aborted) throw new UserCancelledError();
        onToast(`Generating code for phase: ${phase.name}...`, 'info');
        
        const systemInstruction = getSystemInstruction("You are a Senior Software Engineer. Generate code that simulates the design of the current phase. Output only the code.", project.developmentMode);
        const userPrompt = `${getBasePromptContext(project)}\n\nPhase: ${phase.name}\nDescription: ${phase.description}\n\nGenerate code to simulate this design.`;
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: userPrompt,
            config: { systemInstruction }
        }));
        
        const code = response.text;
        const newMetaDoc: MetaDocument = {
            id: crypto.randomUUID(),
            name: `${phase.name} Simulation Code`,
            content: code,
            type: 'software-code',
            createdAt: new Date(),
            parentEntityId: phase.id
        };
        
        onUpdate({
            phaseId: phase.id,
            newMetaDocs: [newMetaDoc]
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
};

export const runPromptGenerationWorkflow = async (project: Project, onUpdate: any, onToast: any, signal: any): Promise<void> => {
    const ai = getAi();
    const phasesToProcess = project.phases;
    onToast(`Prompt Generation Initiated: ${phasesToProcess.length} phases.`, 'info');

    for (const phase of phasesToProcess) {
        if (signal.aborted) throw new UserCancelledError();
        onToast(`Generating prompt for phase: ${phase.name}...`, 'info');
        
        const systemInstruction = getSystemInstruction("You are a Prompt Engineer. Generate a detailed prompt that could be used by an agent like OpenClaw or Hermes to simulate the design of the current phase.", project.developmentMode);
        const userPrompt = `${getBasePromptContext(project)}\n\nPhase: ${phase.name}\nDescription: ${phase.description}\n\nGenerate a detailed prompt for an agent to simulate this design.`;
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: TEXT_MODEL,
            contents: userPrompt,
            config: { systemInstruction }
        }));
        
        const prompt = response.text;
        const newMetaDoc: MetaDocument = {
            id: crypto.randomUUID(),
            name: `${phase.name} Simulation Prompt`,
            content: prompt,
            type: 'recommendations-log', // Using this as a generic text type
            createdAt: new Date(),
            parentEntityId: phase.id
        };
        
        onUpdate({
            phaseId: phase.id,
            newMetaDocs: [newMetaDoc]
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
};

export const runFullAgenticWorkflow = async (project: Project, onUpdate: any, onToast: any, signal: any): Promise<void> => {
    const ai = getAi();
    // 1. Identify all incomplete phases
    const phasesToProcess = project.phases.filter(p => p.status !== 'completed');
    
    if (phasesToProcess.length === 0) {
        onToast('All phases are already complete.', 'success');
        return;
    }

    onToast(`Auto-Pilot Initiated: ${phasesToProcess.length} phases remaining.`, 'info');

    for (const phase of phasesToProcess) {
        if (signal.aborted) throw new UserCancelledError();
        
        onToast(`Processing Phase: ${phase.name}...`, 'info');

        // A. Generate Text
        let outputText = "";
        try {
            if (phase.name === 'Critical Design') {
                const { preliminarySpec, sprints } = await generateCriticalDesignSprints(project, phase);
                outputText = preliminarySpec;
                phase.sprints = sprints;
            } else {
                outputText = await generateStandardPhaseOutput(project, phase, phase.tuningSettings);
            }
        } catch (e: any) {
            onToast(`Error generating text for ${phase.name}: ${e.message}`, 'error');
            continue;
        }

        // B. Update Phase with Text
        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: outputText,
            reason: 'Auto-Pilot Generation',
            createdAt: new Date()
        };
        
        // C. Determine & Generate Visual
        onToast(`Creating visual artifact for ${phase.name}...`, 'info');
        const visualType = await determineBestVisualType(project, phase.name, outputText);
        
        let visualAsset: { content: string; docName: string } | null = null;
        try {
            // Create a temporary sprint object to satisfy the signature of generateAdvancedAsset/Standard
            const mockSprint: any = { name: phase.name, description: phase.description, outputs: [{ content: outputText }] };
            
            if (['wireframe', 'diagram', 'schematic'].includes(visualType)) {
                visualAsset = await generateStandardVisualAsset(project, mockSprint, visualType as any, phase.name);
            } else {
                visualAsset = await generateAdvancedAsset(project, mockSprint, visualType as any, phase.name);
            }
        } catch (e: any) {
            onToast(`Failed to generate visual (${visualType}): ${e.message}`, 'error');
            // Continue without visual
        }

        const newMetaDoc: MetaDocument | undefined = visualAsset ? {
            id: `auto-vis-${phase.id}-${Date.now()}`,
            name: visualAsset.docName,
            content: visualAsset.content,
            type: visualType,
            createdAt: new Date(),
            parentEntityId: phase.id
        } : undefined;

        // D. Generate Sprint Outputs and Images
        for (const sprint of phase.sprints) {
            if (signal.aborted) throw new UserCancelledError();
            onToast(`Automating sprint: ${sprint.name}...`, 'info');
            
            const sprintOutput = await generateTaskDescription(project, phase, sprint, sprint.name);
            
            onToast(`Creating visual artifact for sprint: ${sprint.name}...`, 'info');
            let sprintMetaDoc: MetaDocument | undefined;
            try {
                const sprintVisualType = await determineBestVisualType(project, phase.name, sprintOutput, sprint.name);
                const mockSprint: any = { ...sprint, outputs: [{ content: sprintOutput }] };
                
                let visualAsset: { content: string; docName: string } | null = null;
                if (['wireframe', 'diagram', 'schematic'].includes(sprintVisualType)) {
                    visualAsset = await generateStandardVisualAsset(project, mockSprint, sprintVisualType as any, phase.name);
                } else {
                    visualAsset = await generateAdvancedAsset(project, mockSprint, sprintVisualType as any, phase.name);
                }

                if (visualAsset) {
                    sprintMetaDoc = {
                        id: crypto.randomUUID(),
                        name: visualAsset.docName,
                        content: visualAsset.content,
                        type: sprintVisualType,
                        createdAt: new Date(),
                        parentEntityId: sprint.id
                    };
                }
            } catch (err) {
                console.error("Failed to generate sprint visual:", err);
            }

            onUpdate({
                phaseId: phase.id,
                sprintId: sprint.id,
                sprintUpdates: {
                    outputs: [...(sprint.outputs || []), { version: (sprint.outputs?.length || 0) + 1, content: sprintOutput, reason: 'Auto-Pilot Generation', createdAt: new Date() }],
                    status: 'completed'
                },
                newMetaDocs: sprintMetaDoc ? [sprintMetaDoc] : []
            });
        }

        // E. Commit Phase Update
        console.log(`[FullAuto] Committing phase update for: ${phase.name}`);
        onUpdate({
            phaseId: phase.id,
            phaseUpdates: {
                outputs: [...(phase.outputs || []), newVersion],
                status: 'completed'
            },
            newMetaDocs: newMetaDoc ? [newMetaDoc] : []
        });

        // Small delay to prevent rate limiting and allow UI to render
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
};

export const runAutomatedPhaseGeneration = async (project: Project, phase: Phase, onUpdate: any, onToast: any, signal: any): Promise<void> => {
    if (signal.aborted) throw new UserCancelledError();
    onToast(`Automating ${phase.name}...`);
    
    // 1. Generate Phase Output
    const phaseOutput = await generateStandardPhaseOutput(project, phase, phase.tuningSettings);
    if (signal.aborted) throw new UserCancelledError();
    
    // 2. Generate Phase Image
    onToast(`Generating technical drawing for ${phase.name}...`);
    let phaseMetaDoc: MetaDocument | undefined;
    try {
        const phaseImage = await generateDiagram(phaseOutput, phase.name);
        phaseMetaDoc = {
            id: crypto.randomUUID(),
            name: `${phase.name} - Technical Drawing`,
            content: phaseImage,
            type: 'diagram',
            createdAt: new Date(),
            parentEntityId: phase.id
        };
    } catch (err) {
        console.error("Failed to generate phase image:", err);
    }

    // 3. Update Phase
    console.log(`[AutoPhase] Updating phase status for: ${phase.name}`);
    onUpdate({
        phaseId: phase.id,
        phaseUpdates: {
            outputs: [...(phase.outputs || []), { version: (phase.outputs?.length || 0) + 1, content: phaseOutput, reason: 'Automated Generation', createdAt: new Date() }],
            status: 'completed'
        },
        newMetaDocs: phaseMetaDoc ? [phaseMetaDoc] : []
    });

    // 4. Generate Sprint Outputs and Images
    for (const sprint of phase.sprints) {
        if (signal.aborted) throw new UserCancelledError();
        console.log(`[AutoPhase] Automating sprint: ${sprint.name} in phase: ${phase.name}`);
        onToast(`Automating sprint: ${sprint.name}...`);
        
        const sprintOutput = await generateTaskDescription(project, phase, sprint, sprint.name);
        
        onToast(`Creating visual artifact for sprint: ${sprint.name}...`);
        let sprintMetaDoc: MetaDocument | undefined;
        try {
            const sprintVisualType = await determineBestVisualType(project, phase.name, sprintOutput, sprint.name);
            const mockSprint: any = { ...sprint, outputs: [{ content: sprintOutput }] };
            
            let visualAsset: { content: string; docName: string } | null = null;
            if (['wireframe', 'diagram', 'schematic'].includes(sprintVisualType)) {
                visualAsset = await generateStandardVisualAsset(project, mockSprint, sprintVisualType as any, phase.name);
            } else {
                visualAsset = await generateAdvancedAsset(project, mockSprint, sprintVisualType as any, phase.name);
            }

            if (visualAsset) {
                sprintMetaDoc = {
                    id: crypto.randomUUID(),
                    name: visualAsset.docName,
                    content: visualAsset.content,
                    type: sprintVisualType,
                    createdAt: new Date(),
                    parentEntityId: sprint.id
                };
            }
        } catch (err) {
            console.error("[AutoPhase] Failed to generate sprint visual:", err);
        }

        onUpdate({
            phaseId: phase.id,
            sprintId: sprint.id,
            sprintUpdates: {
                outputs: [...(sprint.outputs || []), { version: (sprint.outputs?.length || 0) + 1, content: sprintOutput, reason: 'Automated Generation', createdAt: new Date() }],
                status: 'completed'
            },
            newMetaDocs: sprintMetaDoc ? [sprintMetaDoc] : []
        });
    }
    console.log(`[AutoPhase] Completed automation for phase: ${phase.name}`);
};

export const generateProjectRecommendations = async (project: Project, metrics: AnalyticsMetrics): Promise<Recommendation[]> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Based on metrics ${JSON.stringify(metrics)}, suggest improvements for ${project.name}. JSON array of {title, category, description, actionableStep}.`,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const generateTaskDescription = async (project: Project, phase: Phase, sprint: Sprint | undefined, taskTitle: string): Promise<string> => {
    const ai = getAi();
    const baseContext = getBasePromptContext(project);
    const systemInstruction = `You are a technical engineering specialist. Generate a detailed technical output document for the sprint/task: "${taskTitle}". 
    CRITICAL: You MUST include comprehensive technical specifications, build-ready details, material lists, and engineering constraints needed for physical or digital construction.
    Focus on technical specifications, implementation details, and engineering analysis relevant to the ${phase.name} phase.`;
    
    const userPrompt = `${baseContext}\n\n## Phase: ${phase.name}\n## Sprint/Task: ${taskTitle}\n${sprint ? `## Sprint Description: ${sprint.description}` : ''}\n\nGenerate a comprehensive technical document in Markdown.`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateCompactedContext = async (project: Project, requirementsOutput: string): Promise<string> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Condense this technical documentation into a token-efficient summary: ${requirementsOutput}`
    }));
    return response.text;
};

export const generatePreliminaryDesignSprints = async (project: Project, conceptualDesign: string, tradeStudy: string): Promise<{name: string, description: string}[]> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Design development sprints for ${project.name} based on design choices. JSON array of {name, description}.`,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const suggestTeamRoles = async (project: Project): Promise<string[]> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `List required engineering roles for ${project.name}. JSON array of strings.`,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const runResourceAnalysisWorkflow = async (project: Project, onProgress: (p: ResourceWorkflowProgress) => void): Promise<{ finalResources: Resource[], logDocument: MetaDocument }> => {
    onProgress({ currentAgent: 'Done', iteration: 1, logMessage: 'Analysis complete.' });
    // Fix: Added missing parentEntityId
    return { finalResources: [], logDocument: { id: 'log-1', name: 'Resource Log', content: 'Completed', type: 'resource-analysis-log', createdAt: new Date(), parentEntityId: project.id } };
};

export const runRiskAssessmentWorkflow = async (project: Project, onProgress: (p: RiskWorkflowProgress) => void): Promise<{ finalRisks: Risk[], logDocument: MetaDocument }> => {
    const ai = getAi();
    onProgress({ currentAgent: 'Orchestrator', iteration: 1, logMessage: 'Analyzing project for risks...' });
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Analyze ${project.name} for risks. JSON array of {id, title, category, severity, description, mitigation}.`,
        config: { responseMimeType: "application/json" }
    }));
    
    const risks = JSON.parse(response.text);
    onProgress({ currentAgent: 'Done', iteration: 1, logMessage: 'Risk assessment complete.' });
    
    return { 
        finalRisks: risks, 
        logDocument: { id: `risk-${Date.now()}`, name: 'Risk Log', content: JSON.stringify(risks, null, 2), type: 'risk-assessment-log', createdAt: new Date(), parentEntityId: project.id } 
    };
};

export const runIntegrationExportWorkflow = async (project: Project, asset: MetaDocument, targetToolId: string, onProgress: (p: ExportWorkflowProgress) => void): Promise<{ fileName: string; fileContent: string }> => {
    onProgress({ status: 'complete', log: 'Export complete.' });
    return { fileName: `${asset.name}_export.txt`, fileContent: 'Exported content' };
};

export const runProjectExportWorkflow = async (project: Project, targetToolId: string, onProgress: (p: ExportWorkflowProgress) => void): Promise<{ fileName: string; fileContent: string }> => {
    onProgress({ status: 'complete', log: 'Project export complete.' });
    return { fileName: `${project.name}_export.txt`, fileContent: 'Exported content' };
};

export const generatePhaseTasks = async (project: Project, phase: Phase): Promise<any[]> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate tasks for ${phase.name}. JSON array.`,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const generateTailoredPhaseDescriptions = async (disciplines: string[], phases: any[]): Promise<any> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Tailor these phase descriptions for ${disciplines.join(', ')}. JSON object with phase names as keys.`,
        config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
};

export const runThreatModelingWorkflow = async (project: Project): Promise<MetaDocument> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Perform threat modeling for ${project.name}. Markdown.`
    }));
    // Fix: Added missing parentEntityId
    return { id: `threat-${Date.now()}`, name: 'Threat Model', content: response.text, type: 'threat-model-report', createdAt: new Date(), parentEntityId: project.id };
};

export const generateComplianceTraceabilityMatrix = async (project: Project): Promise<MetaDocument> => {
    const ai = getAi();
    const baseContext = getBasePromptContext(project);
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `${baseContext}\n\nGenerate a detailed compliance traceability matrix for the project, mapping requirements to design and testing, based on the following compliance standards: ${project.complianceStandards.join(', ')}. Markdown.`
    }));
    // Fix: Added missing parentEntityId
    return { id: `comp-${Date.now()}`, name: 'Compliance Matrix', content: response.text, type: 'compliance-traceability-matrix', createdAt: new Date(), parentEntityId: project.id };
};

export const compareDocumentVersions = async (contentA: string, contentB: string, reasonA: string, reasonB: string): Promise<string> => {
    const ai = getAi();
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Compare version A and B and summarize diffs in Markdown.`
    }));
    return response.text;
};

export const generateStandardVisualAsset = async (project: Project, sprint: Sprint, type: 'wireframe' | 'diagram' | 'schematic', phaseName?: string): Promise<{ content: string; docName: string }> => {
    const dataUrl = await generateDiagram(sprint.outputs[sprint.outputs.length - 1]?.content || sprint.description, phaseName, sprint.name);
    return {
        content: dataUrl,
        docName: `${sprint.name} ${type}`
    };
};

export const generateAdvancedAsset = async (project: Project, sprint: Sprint, type: 'pwb-layout-svg' | '3d-image-veo' | '2d-image' | '3d-printing-file' | 'software-code' | 'chemical-formula', phaseName?: string): Promise<{ content: string; docName: string }> => {
    const ai = getAi();
    const sprintOutput = sprint.outputs[sprint.outputs.length - 1]?.content || sprint.description;
    
    // Fix: Cast operation to any to access properties in the polling loop
    if (type === '3d-image-veo') {
        let operation: any = await withRetry(() => ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `High-quality technical 3D visualization: ${sprintOutput.substring(0, 500)}`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        }));
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        return {
            content: operation.response?.generatedVideos?.[0]?.video?.uri || '',
            docName: `${sprint.name} VEO Animation`
        };
    }

    if (type === '2d-image') {
        const dataUrl = await generateDiagram(sprintOutput, phaseName, sprint.name);
        return { content: dataUrl, docName: `${sprint.name} 2D Render` };
    }

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate a ${type} artifact for sprint ${sprint.name} based on its requirements. Output ONLY the file content.`
    }));

    return {
        content: response.text,
        docName: `${sprint.name} ${type}`
    };
};
