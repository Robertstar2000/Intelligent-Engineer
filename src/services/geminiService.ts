import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { Project, Phase, Sprint, TuningSettings, DesignReviewChecklistItem, Risk, Recommendation, AnalyticsMetrics, MetaDocument } from '../types';
import { withRetry } from '../utils';

// --- CONSTANTS ---
const PRO_MODEL = 'gemini-2.5-pro';
const FLASH_MODEL = 'gemini-2.5-flash';

// --- UTILITIES ---

/**
 * Selects the appropriate AI model based on the context of the task.
 * It prioritizes the more powerful model for complex phases, specific task types,
 * or when high-quality tuning parameters are set.
 * @param options - The context for the AI task.
 * @returns The name of the model to use ('gemini-2.5-pro' or 'gemini-2.5-flash').
 */
export const selectModel = (options: {
    phase?: Phase;
    taskType?: string;
    tuningSettings?: TuningSettings;
}): string => {
    const { phase, taskType, tuningSettings } = options;

    // Rule 1: High-complexity task types always use the PRO model.
    const proTaskTypes = ['criticalSprints', 'vibePrompt', 'riskAssessment', 'compactContext', 'recommendations'];
    if (taskType && proTaskTypes.includes(taskType)) {
        return PRO_MODEL;
    }

    // Rule 2: High-complexity phases always use the PRO model.
    if (phase && ['Critical Design', 'Testing', 'Preliminary Design'].includes(phase.name)) {
        return PRO_MODEL;
    }
    
    // Rule 3: High tuning settings for technicality or depth use the PRO model.
    const settings = tuningSettings || phase?.tuningSettings;
    if (settings) {
        const technicality = (settings.technicality as number) || 0;
        const technicalDepth = (settings.technicalDepth as number) || 0;
        const failureAnalysis = (settings.failureAnalysis as number) || 0;
        const foresight = (settings.foresight as number) || 0;

        if (technicality > 75 || technicalDepth > 75 || failureAnalysis > 75 || foresight > 75) {
            return PRO_MODEL;
        }
    }

    // Default to the faster FLASH model.
    return FLASH_MODEL;
};


const getAi = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is not configured. Please contact the administrator.");
    }
    return new GoogleGenAI({ apiKey });
};

const getBasePromptContext = (project: Project): string => {
    return `## Project: ${project.name}
### Development Mode: ${project.developmentMode}
### Disciplines: ${project.disciplines.join(', ')}
### Requirements:\n${project.requirements}
### Constraints:\n${project.constraints}`;
};

const getProjectContext = (project: Project, currentPhaseId: string): string => {
    const currentPhaseIndex = project.phases.findIndex(p => p.id === currentPhaseId);
    if (currentPhaseIndex < 1) return '';

    // If we have compacted context, use it as the base. It replaces Phase 1 documents.
    const baseContext = project.compactedContext
        ? `## COMPACTED PROJECT CONTEXT (from Requirements Phase):\n${project.compactedContext}\n\n`
        : '';

    // Start accumulating from Phase 2 if compacted context exists, otherwise from Phase 1.
    const subsequentPhaseStartIndex = project.compactedContext ? 1 : 0;
    
    const subsequentContext = project.phases
        .slice(subsequentPhaseStartIndex, currentPhaseIndex)
        .filter(p => p.output && p.status === 'completed')
        .map(p => `## Context from Previous Phase (${p.name}):\n${p.output}`)
        .join('\n\n---\n\n');

    return baseContext + subsequentContext;
};

const getFullProjectContext = (project: Project): string => {
    let fullContext = getBasePromptContext(project) + '\n\n---\n\n';
    if (project.compactedContext) {
        fullContext += `## COMPACTED PROJECT CONTEXT (from Requirements Phase):\n${project.compactedContext}\n\n---\n\n`;
        project.phases.slice(1).forEach(phase => {
            if (phase.output && phase.status === 'completed') {
                fullContext += `## Phase: ${phase.name}\n\n${phase.output}\n\n---\n\n`;
            }
        });
    } else {
        project.phases.forEach(phase => {
            if (phase.output && phase.status === 'completed') {
                fullContext += `## Phase: ${phase.name}\n\n${phase.output}\n\n---\n\n`;
            }
        });
    }
    return fullContext;
};


const getSystemInstruction = (baseInstruction: string, devMode: 'full' | 'rapid'): string => {
    if (devMode === 'rapid') {
        return `${baseInstruction}\nIMPORTANT: Respond in a brief, accurate, and cryptic manner, using concise technical language. Omit lengthy explanations.`;
    }
    return `${baseInstruction}\nIMPORTANT: Your output must be exceptionally verbose, detailed, and comprehensive. Provide deep specifications and thorough explanations. Do not be concise; err on the side of too much detail.`;
};


// --- SERVICE FUNCTIONS ---

export const generateStandardPhaseOutput = async (project: Project, phase: Phase, tuningSettings: TuningSettings): Promise<string> => {
    const ai = getAi();
    const model = selectModel({ phase, tuningSettings });
    const baseContext = getBasePromptContext(project);
    const projectContext = getProjectContext(project, phase.id);

    const systemInstruction = getSystemInstruction(
        `You are an expert AI engineering assistant with deep expertise in ${project.disciplines.join(', ')}. Your task is to generate a comprehensive, professional engineering document for a specific project phase. The output must be well-structured, detailed, and formatted in Markdown.`,
        project.developmentMode
    );
    
    const userPrompt = `${baseContext}\n${projectContext}\n\n---\n\n## Current Phase to Generate: ${phase.name}\nDescription: ${phase.description}\n\n## Tuning Parameters:\n${JSON.stringify(tuningSettings)}\n\n## Task:\nGenerate the complete, highly detailed, and verbose engineering documentation for this phase, providing deep technical specifications. Adhere to the project details and tuning parameters provided. Use terminology and concepts appropriate for the specified engineering disciplines. At the very end of the document, add a '## Validation' section containing a single specific goal for this phase and a short checklist (3-5 items) to verify the goal has been met.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateSubDocument = async (project: Project, phase: Phase, sprint: Sprint): Promise<string> => {
    const ai = getAi();
    const model = selectModel({ phase });
    
    const prompts: { [key: string]: { [key: string]: string } } = {
        'Requirements': {
            'Project Scope': "Generate a professional Project Scope document...",
            'Statement of Work (SOW)': "Generate a formal Statement of Work (SOW)...",
            'Technical Requirements Specification': "Generate a detailed Technical Requirements Specification document...",
        },
        'Preliminary Design': {
            'Conceptual Design Options': "Generate at least three distinct, high-level conceptual design options...",
            'Trade Study Analysis': "Generate a formal Trade Study Analysis document...",
            'Design Review Checklist': "Based on all previous documents in this phase, generate a tailored Design Review Checklist. The checklist should be comprehensive, formatted in Markdown, and contain specific, verifiable questions to ensure the preliminary design is robust, meets requirements, and is ready to proceed to the critical design phase.",
        },
        'Testing': {
            'Verification Plan': "Generate a formal Verification Plan...",
            'Validation Plan': "Generate a formal Validation Plan...",
        }
    };
    const specificPrompt = prompts[phase.name]?.[sprint.name] || `Generate the document titled "${sprint.name}" with the following objective: ${sprint.description}`;
    if (!specificPrompt) {
        throw new Error(`No prompt configured for document "${sprint.name}" in phase "${phase.name}".`);
    }

    const docIndex = phase.sprints.findIndex(d => d.id === sprint.id);
    const previousDocs = phase.sprints.slice(0, docIndex);
    const subPhaseContext = previousDocs
        .map(pd => pd.output ? `## Context from Previous Document (${pd.name}):\n${pd.output}` : '')
        .filter(Boolean).join('\n\n---\n\n');

    const baseContext = getBasePromptContext(project);
    const projectContext = getProjectContext(project, phase.id);
    const systemInstruction = getSystemInstruction(
        `You are an expert AI engineering assistant with deep expertise in ${project.disciplines.join(', ')}. Your task is to generate the "${sprint.name}" document for the "${phase.name}" phase. Your output must be in professional, well-formatted Markdown.`,
        project.developmentMode
    );

    const userNotes = sprint.notes ? `\n\n## User-Provided Notes for this Document (Incorporate these specific intents):\n${sprint.notes}` : '';
    const userPrompt = `${baseContext}\n${projectContext}\n${subPhaseContext}\n\n---\n\n## Task:\nGenerate the **${sprint.name}** document for the **${phase.name}** phase as a highly detailed and verbose technical document based on the prompt below:\n"${specificPrompt}"${userNotes}\n\n## Tuning Parameters:\n${JSON.stringify(phase.tuningSettings)}\n\nUse terminology appropriate for the specified engineering disciplines. Finally, at the very end of the document, add a '## Validation' section containing a single specific goal for this document and a short checklist (3-5 items) to verify the goal has been met.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generateCriticalDesignSprints = async (project: Project, phase: Phase): Promise<{ preliminarySpec: string, sprints: Sprint[] }> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'criticalSprints' });
    const baseContext = getBasePromptContext(project);
    const projectContext = getProjectContext(project, phase.id);

    const systemInstruction = getSystemInstruction(
        `You are an expert AI engineering assistant with deep expertise in ${project.disciplines.join(', ')}. Your task is to break down the "Critical Design" phase into a preliminary design specification and a series of development sprints. Use terminology appropriate for these disciplines. The sprints must include dedicated sprints for "Design for Manufacturing and Assembly (DFMA)" and "Failure Modes and Effects Analysis (FMEA)". The final sprint in the array must ALWAYS be named 'Design Review Checklist' with a suitable description. Provide the output in a structured JSON format. The spec should be a highly detailed and verbose Markdown document. The sprint descriptions should also be detailed and comprehensive.`,
        project.developmentMode
    );

    const userPrompt = `${baseContext}\n${projectContext}\n\n---\n\n## Task:\nGenerate the preliminary design specification and a list of development sprints based on the project details. Ensure DFMA and FMEA sprints are included, and define logical dependencies between sprints.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    preliminarySpec: { type: Type.STRING },
                    sprints: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                name: { type: Type.STRING }, 
                                description: { type: Type.STRING },
                                dependencies: { type: Type.ARRAY, items: {type: Type.STRING } }
                            } 
                        } 
                    }
                }
            }
        }
    }));
    
    try {
        const parsedResponse = JSON.parse(response.text);
        const sprintData = parsedResponse.sprints;

        const sprintNameMap = new Map<string, string>();
        const sprintsWithIds: Sprint[] = sprintData.map((s: any, index: number) => {
            const sprintId = `${phase.id}-${index + 1}`;
            sprintNameMap.set(s.name, sprintId);
            return {
                id: sprintId,
                name: s.name,
                description: s.description,
                status: 'not-started',
                deliverables: [],
                output: '',
                dependencies: s.dependencies || [] // Temporarily store names
            };
        });

        const sprintsWithMappedDeps = sprintsWithIds.map(sprint => {
            const dependencyIds = (sprint.dependencies as unknown as string[])
                .map(depName => sprintNameMap.get(depName))
                .filter((id): id is string => !!id);
            return { ...sprint, dependencies: dependencyIds };
        });

        return { preliminarySpec: parsedResponse.preliminarySpec, sprints: sprintsWithMappedDeps };

    } catch (e) {
        throw new Error("AI returned invalid JSON for critical design sprints. Please try again.");
    }
};

export const generateSprintSpecification = async (project: Project, phase: Phase, sprint: Sprint): Promise<{ technicalSpec: string, deliverables: string[] }> => {
    const ai = getAi();
    const model = selectModel({ phase });
    const mergedOutput = phase.output || '';
    const previousSprints = phase.sprints.filter(s => s.status === 'completed');
    const sprintContext = mergedOutput + '\n\n' + previousSprints.map(s => `### Completed Sprint: ${s.name}\n\n${s.output}`).join('\n\n---\n\n');

    let baseInstruction: string;
    const disciplines = project.disciplines.join(', ');
    if (sprint.name.toLowerCase().includes('fmea')) {
        baseInstruction = `You are an expert AI reliability engineer with deep expertise in ${disciplines}. Your task is to generate a formal Failure Modes and Effects Analysis (FMEA).`;
    } else if (sprint.name.toLowerCase().includes('dfma')) {
        baseInstruction = `You are an expert AI manufacturing engineer with deep expertise in ${disciplines}. Your task is to generate a formal Design for Manufacturing and Assembly (DFMA) analysis.`;
    } else {
        baseInstruction = `You are an expert AI engineering assistant with deep expertise in ${disciplines}. Your task is to generate a detailed technical specification.`;
    }
    const systemInstruction = getSystemInstruction(baseInstruction, project.developmentMode);

    const userNotes = sprint.notes ? `\n\n## User-Provided Notes for this Sprint (Incorporate these specific intents):\n${sprint.notes}` : '';
    const userPrompt = `## Context:\n${sprintContext}\n\n---\n\n## Current Sprint: ${sprint.name}\nDescription: ${sprint.description}\n\n## Task:\nGenerate the exceptionally detailed and verbose technical specification and a list of specific deliverables in JSON format. Use terminology appropriate for the specified engineering disciplines.\n\n## Tuning Parameters:\n${JSON.stringify(phase.tuningSettings)}\n${userNotes}\n\nFor the 'technicalSpec' field, ensure that at the very end of the markdown content, you add a '## Validation' section containing a single specific goal for this sprint and a short checklist (3-5 items) to verify the goal has been met.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    technicalSpec: { type: Type.STRING },
                    deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        }
    }));

    try {
        return JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI returned invalid JSON for sprint specification. Please try again.");
    }
};

export const generateDesignReviewChecklist = async (documentContent: string): Promise<DesignReviewChecklistItem[]> => {
    const ai = getAi();
    const model = selectModel({});
    const systemInstruction = `You are an AI engineering review assistant. Based on the provided document, generate a concise checklist of 5-7 critical verification items. Provide the output as a JSON array of objects, where each object has an 'id' (a unique string) and a 'text' (the checklist item).`;
    const userPrompt = `## Engineering Document for Review:\n\n${documentContent}\n\n## Task:\nGenerate the design review checklist in the specified JSON format.`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING } } }
            }
        }
    }));
    
    try {
        const parsedChecklist = JSON.parse(response.text);
        return parsedChecklist.map((item: any) => ({ ...item, checked: false }));
    } catch (e) {
        throw new Error("AI returned invalid JSON for the checklist. Please try again.");
    }
};

export const generateVibePrompt = async (project: Project, type: 'code' | 'simulation'): Promise<string> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'vibePrompt' });
    const systemInstruction = "You are an expert AI prompt engineer.";
    let taskDescription = type === 'code' 
        ? "Synthesize the provided engineering documentation into a comprehensive 'vibe coding prompt' for an AI assistant to generate production-ready source code..."
        : "Synthesize the provided engineering documentation into a 'vibe simulation prompt' for an AI assistant to create a functional simulation of the system...";

    const fullContext = getFullProjectContext(project);

    const userPrompt = `${taskDescription}\n\n## Project Documentation Context:\n\n${fullContext}`;
    const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    });
    return response.text;
};

export const generateProjectSummary = async (project: Project): Promise<string> => {
    const ai = getAi();
    const model = selectModel({});
    const systemInstruction = getSystemInstruction(
        `You are an expert AI project manager with a background in ${project.disciplines.join(', ')}. Your task is to write a comprehensive, professional executive summary of an engineering project based on all available documentation. The summary should be well-structured in Markdown and cover: 1. Current Status, 2. Key Accomplishments, and 3. Next Steps.`,
        project.developmentMode
    );
    
    const fullContext = getFullProjectContext(project);

    const userPrompt = `## Full Project Documentation Context:\n\n${fullContext}\n\n## Task:\nGenerate the executive summary.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};


export const runAutomatedPhaseGeneration = async (project: Project, phase: Phase, onUpdate: (updates: Partial<Phase>) => void, onToast: (message: string) => void): Promise<void> => {
    let finalOutput = '';
    
    if (['Requirements', 'Preliminary Design', 'Testing'].includes(phase.name)) {
        let updatedSprints = [...phase.sprints];
        for (let i = 0; i < updatedSprints.length; i++) {
            const doc = updatedSprints[i];
            onToast(`Generating document: ${doc.name}...`);
            const output = await generateSubDocument({ ...project, phases: project.phases.map(p => p.id === phase.id ? { ...p, sprints: updatedSprints } : p) }, phase, doc);
            updatedSprints[i] = { ...doc, output, status: 'completed' };
            onUpdate({ sprints: updatedSprints });
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        finalOutput = updatedSprints.map(d => `## ${d.name}\n\n${d.output || 'Not generated.'}`).join('\n\n---\n\n');
        onUpdate({ sprints: updatedSprints, output: finalOutput, status: 'in-progress' });
    } else if (phase.name === 'Critical Design') {
        onToast('Generating initial design spec & sprints...');
        const { preliminarySpec, sprints: newSprints } = await generateCriticalDesignSprints(project, phase);
        onUpdate({ output: preliminarySpec, sprints: newSprints });

        let currentSprints = [...newSprints];
        let currentOutput = preliminarySpec;
        const completedSprintIds = new Set<string>();

        while (completedSprintIds.size < currentSprints.length) {
            const processableSprints = currentSprints.filter(s => 
                s.status !== 'completed' &&
                (s.dependencies ?? []).every(depId => completedSprintIds.has(depId))
            );

            if (processableSprints.length === 0) {
                throw new Error("Circular dependency or missing dependency detected in sprints. Automation cannot proceed.");
            }

            for (const sprint of processableSprints) {
                onToast(`Generating sprint: ${sprint.name}...`);
                
                const projectSnapshot = {
                    ...project,
                    phases: project.phases.map(p => p.id === phase.id ? { ...p, output: currentOutput, sprints: currentSprints } : p)
                };
                
                const { technicalSpec, deliverables } = await generateSprintSpecification(projectSnapshot, { ...phase, output: currentOutput, sprints: currentSprints }, sprint);
                
                const updatedSprint: Sprint = { ...sprint, output: technicalSpec, deliverables, status: 'completed' };
                currentOutput = `${currentOutput || ''}\n\n---\n\n### Completed Sprint: ${sprint.name}\n\n${technicalSpec}`;
                currentSprints = currentSprints.map(s => s.id === sprint.id ? updatedSprint : s);
                
                onUpdate({ output: currentOutput, sprints: currentSprints });
                completedSprintIds.add(sprint.id);
            }
        }
        finalOutput = currentOutput;
        onUpdate({ status: 'in-progress' });

    } else { // Standard Phase
        onToast(`Generating documentation for ${phase.name}...`);
        const output = await generateStandardPhaseOutput(project, phase, phase.tuningSettings);
        finalOutput = output;
        onUpdate({ output, status: 'in-progress' });
    }

    if (phase.designReview?.required) {
        onToast('Generating design review checklist...');
        if (finalOutput) {
            const checklist = await generateDesignReviewChecklist(finalOutput);
            onUpdate({ status: 'in-review', designReview: { ...phase.designReview, checklist: checklist } });
            onToast('Design review generated. Auto-completing...');
            onUpdate({ status: 'completed' });
        } else {
             onUpdate({ status: 'completed' });
        }
    } else {
        onUpdate({ status: 'completed' });
    }
};

export const generateDiagram = async (documentContent: string): Promise<string> => {
    const ai = getAi();
    const prompt = `Create a professional and clear technical diagram (such as a block diagram, flowchart, or system architecture diagram) that visually summarizes the key concepts, components, and relationships described in the following engineering document. The diagram should be easy to understand for a technical audience and use a clean, modern aesthetic. Avoid excessive text; use labels sparingly.

    Document Content to Summarize:
    ---
    ${documentContent}`;

    // FIX: Add generic type to withRetry to ensure correct type inference for the response.
    const response = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    }));

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("Failed to generate diagram image.");
};

export const generateVisualAsset = async (
    project: Project,
    sprint: Sprint,
    toolType: 'wireframe' | 'diagram' | 'schematic'
): Promise<{ content: string; docName: string }> => {
    const ai = getAi();
    const fullContext = getBasePromptContext(project) + `\n\n## Current Sprint Context: ${sprint.name}\n${sprint.output || sprint.description}`;

    // 1. Orchestrator Agent
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to create an expert-level, highly detailed image generation prompt for an AI model (like Imagen) to create a technical engineering asset. The prompt must be descriptive, specifying style, components, connections, and layout. Respond with a JSON object containing a 'prompt' string and a 'docName' string for the generated file.";

    const toolDescription = {
        wireframe: 'a clean, to-scale, 3D wireframe model of the main component described in the sprint. The style should be minimalist, professional, and clear, suitable for technical documentation.',
        diagram: 'a one-page functional block diagram illustrating the system architecture and data flow. Use standard block diagram conventions, with clear labels and directional arrows.',
        schematic: 'a simple 2D schematic diagram of the electronic circuit or mechanical assembly. Use standard symbols and a clean layout.'
    };
    
    const orchestratorUserPrompt = `Project & Sprint Context:\n${fullContext}\n\nTask: Create an image generation prompt and a suitable document name for ${toolDescription[toolType]}`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: orchestratorUserPrompt,
        config: { systemInstruction: orchestratorSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, docName: {type: Type.STRING} } } }
    }));
    
    const { prompt: detailedPrompt, docName } = JSON.parse(orchestratorResponse.text);

    // 2. Doer Agent (Generator)
    const doerResponse = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: detailedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    }));

    if (!doerResponse.generatedImages || doerResponse.generatedImages.length === 0) {
        throw new Error("Doer Agent failed to generate the image.");
    }
    const base64ImageBytes: string = doerResponse.generatedImages[0].image.imageBytes;
    const content = `data:image/png;base64,${base64ImageBytes}`;

    // 3. QA Agent (Simplified for this implementation)
    const qaResult = { approved: true, feedback: "Asset meets sprint requirements." };
    if (!qaResult.approved) {
        throw new Error(`QA Agent rejected the asset: ${qaResult.feedback}`);
    }

    return { content, docName };
};


export const assessProjectRisks = async (project: Project): Promise<Risk[]> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'riskAssessment' });
    const fullContext = getFullProjectContext(project);

    const systemInstruction = `You are an expert AI risk analyst specializing in ${project.disciplines.join(', ')} projects. Analyze the provided documentation and identify 3-5 key risks. For each risk, provide a title, category, severity, a detailed description, and a comprehensive mitigation strategy. Output a JSON array of risk objects.`;

    const userPrompt = `## Full Project Documentation:\n${fullContext}\n\n## Task:\nIdentify the key risks and provide the analysis in the specified JSON format.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['Technical', 'Schedule', 'Budget', 'Resource', 'Operational', 'Other'] },
                        severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        description: { type: Type.STRING },
                        mitigation: { type: Type.STRING },
                    }
                }
            }
        }
    }));
    
    try {
        const risks = JSON.parse(response.text);
        // Ensure unique IDs
        return risks.map((risk: Omit<Risk, 'id'>, index: number) => ({...risk, id: `risk-${Date.now()}-${index}`}));
    } catch (e) {
        throw new Error("AI returned invalid JSON for risk assessment.");
    }
};

export const queryProjectData = async (project: Project, query: string): Promise<string> => {
    const ai = getAi();
    const model = selectModel({});
    const fullContext = getFullProjectContext(project);
    
    const systemInstruction = `You are an AI assistant with complete knowledge of the provided engineering project. Answer the user's question based *only* on the context provided. If the answer is not in the context, say "I cannot answer that based on the available project documentation."`;

    const userPrompt = `## Project Context:\n${fullContext}\n\n## User Question:\n${query}`;

    const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    });
    return response.text;
}

export const generateProjectRecommendations = async (project: Project, metrics: AnalyticsMetrics): Promise<Recommendation[]> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'recommendations' });
    let fullContext = getFullProjectContext(project);
    fullContext += `## Current Project Metrics:\n${JSON.stringify(metrics, null, 2)}`;
    
    const systemInstruction = `You are an expert AI engineering consultant specializing in ${project.disciplines.join(', ')}. Based on the project documentation and current performance metrics, provide 2-3 actionable recommendations to improve the project's execution. Focus on methodology, process, tools, or risk mitigation. Format the output as a JSON array of recommendation objects.`;

    const userPrompt = `## Project Context & Metrics:\n${fullContext}\n\n## Task:\nGenerate actionable recommendations in the specified JSON format.`;
    
     const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['Methodology', 'Process', 'Tools', 'Risk Mitigation'] },
                        description: { type: Type.STRING },
                        actionableStep: { type: Type.STRING },
                    }
                }
            }
        }
    }));
    
     try {
        const recs = JSON.parse(response.text);
        return recs.map((rec: Omit<Recommendation, 'id'>, index: number) => ({...rec, id: `rec-${Date.now()}-${index}`}));
    } catch (e) {
        throw new Error("AI returned invalid JSON for recommendations.");
    }
}

export const generateTaskDescription = async (project: Project, phase: Phase, sprint: Sprint | undefined, taskTitle: string): Promise<string> => {
    const ai = getAi();
    const model = selectModel({});
    
    let context = getBasePromptContext(project) + `\n\n## Current Phase: ${phase.name}\n${phase.output || phase.description}`;
    if (sprint) {
        context += `\n\n## Current Sprint: ${sprint.name}\n${sprint.output || sprint.description}`;
    }

    const systemInstruction = getSystemInstruction(
        `You are an AI project manager assistant with knowledge of ${project.disciplines.join(', ')}. Based on the provided context, generate a detailed, clear, and actionable description for a given task title. The description should be in Markdown and include a brief 'Acceptance Criteria' list.`,
        project.developmentMode
    );
    const userPrompt = `## Project Context:\n${context}\n\n## Task Title:\n${taskTitle}\n\n## Task:\nGenerate the task description.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    });
    return response.text;
}

export const generateCompactedContext = async (project: Project, requirementsOutput: string): Promise<string> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'compactContext' });
    const systemInstruction = `You are an AI specializing in context compression for large language models. The following is a set of project documents (requirements, specs, etc.). Your task is to condense all of this information into a dense, token-efficient, non-human-readable format. The output should be a single block of text. Retain ALL key technical specifications, constraints, component names, performance metrics, and any specific numbers or values. Use symbols, abbreviations, and a structured format (e.g., a custom key:value syntax or a compact JSON-like structure) to maximize information density. This output will be used as the sole context for other AI models to perform subsequent tasks, so it must be complete and accurate. Do not use conversational language or Markdown formatting.`;
    const userPrompt = `${getBasePromptContext(project)}\n\n## Requirements Phase Documentation:\n\n${requirementsOutput}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
    return response.text;
};

export const generatePreliminaryDesignSprints = async (project: Project, conceptualDesign: string, tradeStudy: string): Promise<{name: string, description: string}[]> => {
    const ai = getAi();
    const model = selectModel({ phase: { name: 'Preliminary Design' } as Phase });
    const systemInstruction = getSystemInstruction(
        `You are an expert AI engineering project manager with expertise in ${project.disciplines.join(', ')}. Your task is to analyze the provided design documents and create a list of subsequent development sprints. Use terminology appropriate for these disciplines. Each sprint should represent approximately two weeks of work for a single engineer. The output must be a JSON array of objects, where each object has 'name' and a detailed, verbose 'description' property.`,
        project.developmentMode
    );

    const userPrompt = `${getBasePromptContext(project)}\n\n## Context from Preliminary Design:\n\n### Conceptual Design Options\n${conceptualDesign}\n\n### Trade Study Analysis\n${tradeStudy}\n\n---\n\n## Task:\nBased on the chosen design concept and trade study, create a list of development sprints for the 'Critical Design' phase.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                    }
                }
            }
        }
    }));
    
    try {
        return JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI returned invalid JSON for preliminary design sprints.");
    }
};

export const suggestTeamRoles = async (project: Project): Promise<string[]> => {
    const ai = getAi();
    const model = selectModel({});
    const fullContext = getFullProjectContext(project);
    const systemInstruction = `You are an expert AI project management consultant for ${project.disciplines.join(', ')} projects. Analyze the provided project documentation and identify a list of key engineering and management roles required for this project's success. Do not include generic roles like 'Project Manager' unless the context strongly implies a need for one. Focus on technical roles. Return a JSON array of strings, where each string is a role title.`;
    const userPrompt = `## Full Project Documentation:\n${fullContext}\n\n## Task:\nIdentify the necessary team roles and provide the analysis in the specified JSON format.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    }));

    try {
        return JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI returned invalid JSON for team roles.");
    }
};

export const suggestResources = async (project: Project): Promise<{ software: string[], equipment: string[] }> => {
    const ai = getAi();
    const model = selectModel({});
    const fullContext = getFullProjectContext(project);
    const systemInstruction = `You are an expert AI engineering consultant specializing in ${project.disciplines.join(', ')} projects. Analyze the provided project documentation to identify all required software tools and physical equipment. For software, list specific applications (e.g., 'SolidWorks', 'MATLAB', 'Altium Designer'). For equipment, list specific hardware (e.g., 'Oscilloscope', '3D Printer', 'CNC Mill'). Return a JSON object with two keys: 'software' and 'equipment', each containing an array of unique strings.`;
    const userPrompt = `## Full Project Documentation:\n${fullContext}\n\n## Task:\nIdentify the required software and equipment and provide the analysis in the specified JSON format.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    software: { type: Type.ARRAY, items: { type: Type.STRING } },
                    equipment: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    }));

    try {
        return JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI returned invalid JSON for project resources.");
    }
};