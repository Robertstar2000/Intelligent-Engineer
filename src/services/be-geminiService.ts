import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { Project, Phase, Sprint, TuningSettings, DesignReviewChecklistItem, Risk, Recommendation, AnalyticsMetrics, MetaDocument, Resource } from '../types';
import { withRetry } from '../utils';

// --- CONSTANTS ---
const PRO_MODEL = 'gemini-2.5-pro';
const FLASH_MODEL = 'gemini-2.5-flash';

export const EXTERNAL_TOOLS: { id: string; name: string; category: 'CAD' | 'Electronics'; requirements: { description: string; extension: string; outputType: string; qaPrompt: string; } }[] = [
    {
        id: 'solidworks', name: 'SolidWorks', category: 'CAD',
        requirements: {
            description: 'A VBA script (.swp) to generate a simplified 3D part. The script should define parameters (dimensions, materials) and use SolidWorks API calls like `CreateExtrusion` and `CreateCut` to build the main features described in the asset.',
            extension: 'swp',
            outputType: 'SolidWorks VBA Script',
            qaPrompt: 'Verify the output is a valid VBA script. Check for proper Sub/End Sub blocks, variable declarations (Dim), and calls to what look like SolidWorks API methods (e.g., Part.InsertSketch, FeatureManager.CreateExtrusion). The script should not contain any explanatory text outside of VBA comments (prefixed with \').'
        }
    },
    {
        id: 'fusion360', name: 'Fusion 360', category: 'CAD',
        requirements: {
            description: 'A Python script (.py) using the Fusion 360 API (adsk). The script should define parameters and use API calls to create sketches, extrusions, and other features to model the asset. The script should be self-contained and executable in Fusion 360\'s scripting environment.',
            extension: 'py',
            outputType: 'Fusion 360 Python Script',
            qaPrompt: 'Verify the output is a valid Python script for Fusion 360. Check for imports like `import adsk.core, adsk.fusion, adsk.cam`. Look for a `run(context)` function definition. The code should use objects like `app.activeProduct.design` and methods like `sketches.add` and `features.extrudeFeatures.createInput`. It must be only Python code.'
    
        }
    },
    {
        id: 'generic-3d-print', name: 'Generic 3D Print (.stl)', category: 'CAD',
        requirements: {
            description: 'A 3D model file in the ASCII STL (STereoLithography) format (.stl). The file should start with `solid [name]` and end with `endsolid [name]`. It will contain multiple `facet` blocks, each defining a triangle with a normal vector and three vertices. The AI should generate a simplified geometric representation of the asset described in the project documents.',
            extension: 'stl',
            outputType: 'ASCII STL File',
            qaPrompt: 'Verify the output is a valid ASCII STL file. It must start with `solid [some_name]` and end with `endsolid [some_name]`. The body must contain one or more blocks starting with `facet normal` and ending with `endfacet`. Each facet block must contain an `outer loop` with exactly three `vertex` lines. The output should be only the STL file content.'
        }
    },
    {
        id: 'kicad', name: 'KiCad', category: 'Electronics',
        requirements: {
            description: 'A netlist file (.net) in KiCad\'s Pcbnew legacy format. It requires a list of components with their values and footprints, and a list of nets connecting the component pins. The output must be valid S-expression syntax (Lisp-like, with nested parentheses).',
            extension: 'net',
            outputType: 'KiCad Netlist',
            qaPrompt: 'Verify the output is a valid KiCad netlist file using S-expressions. The file should start with `(export (version D) ...`. Check for balanced parentheses and keywords like `(components`, `(comp`, `(libsource`, `(nets`, and `(net`. It must be only the netlist content, no surrounding text.'
        }
    },
    {
        id: 'altium', name: 'Altium Designer', category: 'Electronics',
        requirements: {
            description: 'A comma-separated value (.csv) file for a Bill of Materials (BOM). The CSV should have columns like "Designator", "Footprint", "LibRef", "Quantity", and "Description". Extract component information from the project documents to populate this BOM.',
            extension: 'csv',
            outputType: 'Altium BOM CSV',
            qaPrompt: 'Verify the output is a valid CSV file with a header row containing at least "Designator", "Footprint", and "Quantity". Subsequent rows should have comma-separated values corresponding to the headers. The output should only be the CSV data.'
        }
    }
];

// --- UTILITIES ---

const toCamelCase = (s: string) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => chr ? chr.toUpperCase() : '');

/**
 * Selects the appropriate AI model based on the context of the task.
 * It prioritizes the more powerful PRO model for critical, foundational documents
 * and visual asset generation, while using the faster FLASH model for other tasks.
 * @param options - The context for the AI task.
 * @returns The name of the model to use ('gemini-2.5-pro' or 'gemini-2.5-flash').
 */
export const selectModel = (options: {
    phase?: Phase;
    taskType?: string;
    tuningSettings?: TuningSettings;
    sprintName?: string;
}): string => {
    const { taskType } = options;

    // Use FLASH for quick, non-critical, or real-time query tasks.
    const flashTasks = [
        'projectSetup', // Fast setup
        'query',        // Fast response for NLP queries
    ];

    if (taskType && flashTasks.includes(taskType)) {
        return FLASH_MODEL;
    }
    
    // Default to the more capable PRO model for all content generation and analysis tasks.
    return PRO_MODEL;
};


const getAi = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is not configured. Please contact the administrator.");
    }
    return new GoogleGenAI({ apiKey });
};

const getBasePromptContext = (project: Project): string => {
    let context = `## Project: ${project.name}
### Development Mode: ${project.developmentMode}
### Disciplines: ${project.disciplines.join(', ')}
### Requirements:\n${project.requirements}
### Constraints:\n${project.constraints}`;

    if (project.customConcept) {
        context += `\n### Custom Guiding Concept:\n${project.customConcept}`;
    }

    return context;
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
    const model = selectModel({ phase, sprintName: sprint.name });
    
    const prompts: { [key: string]: { [key: string]: string } } = {
        'Requirements': {
            'Project Scope': "Generate a professional Project Scope document. The document must begin with an 'Introduction', immediately followed by a 'Project Objectives' section. Base the content on the project's core details, guiding concept, and disciplines.",
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
    const attachmentSummary = sprint.attachments && sprint.attachments.length > 0
        ? `\n\n## Attached File Summaries (Note: you cannot see the file contents, only this summary. Use this as context.):\n${sprint.attachments.map(att => `- ${att.name} (${att.mimeType})`).join('\n')}`
        : '';
    const userPrompt = `${baseContext}\n${projectContext}\n${subPhaseContext}\n\n---\n\n## Task:\nGenerate the **${sprint.name}** document for the **${phase.name}** phase as a highly detailed and verbose technical document based on the prompt below:\n"${specificPrompt}"${userNotes}${attachmentSummary}\n\n## Tuning Parameters:\n${JSON.stringify(phase.tuningSettings)}\n\nUse terminology appropriate for the specified engineering disciplines. Finally, at the very end of the document, add a '## Validation' section containing a single specific goal for this document and a short checklist (3-5 items) to verify the goal has been met.`;

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
        `You are an expert AI engineering assistant with deep expertise in ${project.disciplines.join(', ')}. Your task is to break down the "Critical Design" phase into a preliminary design specification and a series of development sprints. Use terminology appropriate for these disciplines. The sprints must include dedicated sprints for "Design for Manufacturing and Assembly (DFMA)" and "Failure Modes and Effects Analysis (FMEA)". Crucially, you must also determine and define the logical dependencies between these sprints by listing the names of prerequisite sprints in a 'dependencies' array. For example, the FMEA sprint might depend on a detailed component design sprint. The final sprint in the array must ALWAYS be named 'Design Review Checklist' with a suitable description. Provide the output in a structured JSON format. The spec should be a highly detailed and verbose Markdown document. The sprint descriptions should also be detailed and comprehensive.`,
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
    const attachmentSummary = sprint.attachments && sprint.attachments.length > 0
        ? `\n\n## Attached File Summaries (Note: you cannot see the file contents, only this summary. Use this as context.):\n${sprint.attachments.map(att => `- ${att.name} (${att.mimeType})`).join('\n')}`
        : '';
    const userPrompt = `## Context:\n${sprintContext}\n\n---\n\n## Current Sprint: ${sprint.name}\nDescription: ${sprint.description}\n\n## Task:\nGenerate the exceptionally detailed and verbose technical specification and a list of specific deliverables in JSON format. Use terminology appropriate for the specified engineering disciplines.\n\n## Tuning Parameters:\n${JSON.stringify(phase.tuningSettings)}\n${userNotes}${attachmentSummary}\n\nFor the 'technicalSpec' field, ensure that at the very end of the markdown content, you add a '## Validation' section containing a single specific goal for this sprint and a short checklist (3-5 items) to verify the goal has been met.`;

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
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
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

const generateSingleVisualAssetForPhase = async (
    project: Project,
    phase: Phase,
    toolType: 'wireframe' | 'diagram' | 'schematic'
): Promise<MetaDocument> => {
    const ai = getAi();
    const fullContext = getBasePromptContext(project) + `\n\n## Phase Content to Visualize:\n${phase.output}`;

    const model = selectModel({ taskType: 'visualAssetOrchestrator' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to create an expert-level, highly detailed image generation prompt for an AI model (like Imagen) to create a technical engineering asset. The prompt must be descriptive, specifying style, components, connections, and layout. Respond with a JSON object containing a 'prompt' string and a 'docName' string for the generated file.";
    
    const toolDescription = {
        wireframe: 'a clean, to-scale, 3D wireframe model of the main component described. The style should be minimalist, professional, and clear, suitable for technical documentation.',
        diagram: phase.name === 'Preliminary Design'
            ? 'a high-level conceptual block diagram showing the main components and their interactions, focusing on the overall architecture rather than detailed data flow. Use standard block diagram conventions, with clear labels and directional arrows.'
            : 'a one-page functional block diagram illustrating the system architecture and data flow. Use standard block diagram conventions, with clear labels and directional arrows.',
        schematic: 'a simple 2D schematic diagram of the electronic circuit or mechanical assembly. Use standard symbols and a clean layout.'
    };
    const docBaseName = toolType === 'diagram' ? `${phase.name} - System Diagram`
                      : toolType === 'wireframe' ? `${phase.name} - Component Wireframe`
                      : `${phase.name} - System Schematic`;

    const orchestratorUserPrompt = `Project & Phase Context:\n${fullContext}\n\nTask: Create an image generation prompt and a suitable document name for ${toolDescription[toolType]}. The document name should be based on "${docBaseName}".`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: orchestratorUserPrompt,
        config: { systemInstruction: orchestratorSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, docName: {type: Type.STRING} } } }
    }));
    const { prompt: detailedPrompt, docName } = JSON.parse(orchestratorResponse.text);

    // Doer Agent
    const doerResponse = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: detailedPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '16:9' },
    }));

    if (!doerResponse.generatedImages || doerResponse.generatedImages.length === 0) throw new Error("Doer Agent failed to generate the image.");
    
    const base64ImageBytes: string = doerResponse.generatedImages[0].image.imageBytes;
    const content = `data:image/png;base64,${base64ImageBytes}`;

    return {
        id: `meta-asset-${phase.id}-${toolType}-${Date.now()}`,
        name: docName,
        content: content,
        type: toolType as MetaDocument['type'],
        createdAt: new Date(),
    };
};

export const generatePhaseVisualAssets = async (project: Project, phase: Phase): Promise<MetaDocument[]> => {
    if (!phase.output) return [];

    const assetPromises: Promise<MetaDocument | null>[] = [];
    const phaseName = phase.name;
    const disciplines = project.disciplines.map(d => d.toLowerCase());

    if (['Preliminary Design', 'Critical Design', 'Testing', 'Launch', 'Operation'].includes(phaseName)) {
        assetPromises.push(generateSingleVisualAssetForPhase(project, phase, 'diagram'));
    }

    if (['Preliminary Design', 'Critical Design'].includes(phaseName)) {
        const hasMechanical = disciplines.some(d => ['mechanical', 'aerospace', 'automotive', 'civil', 'structural', 'marine', 'robotics'].some(keyword => d.includes(keyword)));
        const hasElectricalOrSoftware = disciplines.some(d => ['electrical', 'electronics', 'software', 'systems'].some(keyword => d.includes(keyword)));
        if (hasMechanical) {
            assetPromises.push(generateSingleVisualAssetForPhase(project, phase, 'wireframe'));
        } else if (hasElectricalOrSoftware) {
            assetPromises.push(generateSingleVisualAssetForPhase(project, phase, 'schematic'));
        }
    }
  
    const newDocs = await Promise.all(assetPromises);
    return newDocs.filter((doc): doc is MetaDocument => !!doc);
};


export const runAutomatedPhaseGeneration = async (project: Project, phase: Phase, onUpdate: (updates: Partial<Phase>) => void, onToast: (message: string, type?: 'success' | 'error' | 'info') => void): Promise<MetaDocument[]> => {
    let finalOutput = '';
    
    if (['Requirements', 'Preliminary Design', 'Testing'].includes(phase.name)) {
        let updatedSprints = [...phase.sprints];
        for (let i = 0; i < updatedSprints.length; i++) {
            const doc = updatedSprints[i];
            try {
                onToast(`Generating document: ${doc.name}...`);
                const output = await generateSubDocument({ ...project, phases: project.phases.map(p => p.id === phase.id ? { ...p, sprints: updatedSprints } : p) }, phase, doc);
                updatedSprints[i] = { ...doc, output, status: 'completed' };
                onUpdate({ sprints: updatedSprints });
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                onToast(`Failed to generate document: ${doc.name}. Skipping.`, 'error');
                console.error(`Automation failed on document ${doc.name}`, error);
                continue;
            }
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
                // This could be due to a circular dependency or a failed sprint that others depend on.
                const remainingSprints = currentSprints.filter(s => s.status !== 'completed').map(s => s.name).join(', ');
                onToast(`Automation stalled. Cannot process remaining sprints: ${remainingSprints}. Check for failed dependencies.`, 'error');
                break; // Exit the loop
            }

            for (const sprint of processableSprints) {
                try {
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
                } catch (error) {
                    onToast(`Failed to generate sprint: ${sprint.name}. Skipping.`, 'error');
                    console.error(`Automation failed on sprint ${sprint.name}`, error);
                    // Do not add to completedSprintIds, so dependency checks will correctly fail for other sprints.
                    // We just continue to the next processable sprint.
                    continue;
                }
            }
        }
        finalOutput = currentOutput;
        onUpdate({ status: 'in-progress' });

    } else { // Standard Phase
        try {
            onToast(`Generating documentation for ${phase.name}...`);
            const output = await generateStandardPhaseOutput(project, phase, phase.tuningSettings);
            finalOutput = output;
            onUpdate({ output, status: 'in-progress' });
        } catch (error: any) {
            onToast(`Failed to generate documentation for ${phase.name}.`, 'error');
            console.error(`Automation error on phase ${phase.name}`, error);
            throw error; // Propagate to stop the whole process as this is a blocking failure.
        }
    }

    let finalPhaseState: Partial<Phase> = { output: finalOutput };

    if (phase.designReview?.required) {
        onToast('Generating design review checklist...');
        if (finalOutput) {
            const checklist = await generateDesignReviewChecklist(finalOutput);
             finalPhaseState = { ...finalPhaseState, status: 'in-review', designReview: { ...phase.designReview, checklist: checklist } };
            onUpdate(finalPhaseState);
            onToast('Design review generated. Auto-completing...');
            finalPhaseState = { ...finalPhaseState, status: 'completed' };
        } else {
             finalPhaseState = { ...finalPhaseState, status: 'completed' };
        }
    } else {
        finalPhaseState = { ...finalPhaseState, status: 'completed' };
    }
    
    onUpdate(finalPhaseState);

    // After phase completion, generate assets
    try {
        onToast(`Generating visual assets for ${phase.name}...`);
        const updatedProjectForAssets = {
            ...project,
            phases: project.phases.map(p => p.id === phase.id ? { ...phase, ...finalPhaseState } : p)
        };
        const newDocs = await generatePhaseVisualAssets(updatedProjectForAssets, { ...phase, ...finalPhaseState });
        if (newDocs.length > 0) {
            onToast(`${newDocs.length} visual assets generated and saved.`, 'success');
            return newDocs;
        }
    } catch (error: any) {
        onToast(`Failed to generate visual assets: ${error.message}`, 'error');
    }
    return [];
};

export const generateDiagram = async (documentContent: string): Promise<string> => {
    const ai = getAi();
    
    // Orchestrator Agent to create a detailed prompt for the image generator
    const model = selectModel({ taskType: 'visualAssetOrchestrator' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to create an expert-level, highly detailed image generation prompt for an AI model (like Imagen) to create a technical engineering diagram. The prompt must be descriptive, specifying style (e.g., 'professional block diagram', 'clean flowchart'), components, connections, and layout based on the provided text.";
    const orchestratorUserPrompt = `Document Content to Summarize:\n---\n${documentContent}\n---\n\nTask: Create an image generation prompt for a technical diagram that visually summarizes the key concepts in the document.`;

    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: orchestratorUserPrompt,
        config: { systemInstruction: orchestratorSystemInstruction }
    }));

    const detailedPrompt = orchestratorResponse.text;

    // Doer Agent (Image Generator)
    const response = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: detailedPrompt,
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

export const generateStandardVisualAsset = async (
    project: Project,
    sprint: Sprint,
    toolType: 'wireframe' | 'diagram' | 'schematic'
): Promise<{ content: string; docName: string }> => {
    const ai = getAi();
    const fullContext = getBasePromptContext(project) + `\n\n## Current Sprint Context: ${sprint.name}\n${sprint.output || sprint.description}`;

    // 1. Orchestrator Agent
    const model = selectModel({ taskType: 'visualAssetOrchestrator' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to create an expert-level, highly detailed image generation prompt for an AI model (like Imagen) to create a technical engineering asset. The prompt must be descriptive, specifying style, components, connections, and layout. Respond with a JSON object containing a 'prompt' string and a 'docName' string for the generated file.";

    const toolDescription = {
        wireframe: 'a clean, to-scale, 3D wireframe model of the main component described in the sprint. The style should be minimalist, professional, and clear, suitable for technical documentation.',
        diagram: 'a one-page functional block diagram illustrating the system architecture and data flow. Use standard block diagram conventions, with clear labels and directional arrows.',
        schematic: 'a simple 2D schematic diagram of the electronic circuit or mechanical assembly. Use standard symbols and a clean layout.'
    };
    
    const orchestratorUserPrompt = `Project & Sprint Context:\n${fullContext}\n\nTask: Create an image generation prompt and a suitable document name for ${toolDescription[toolType]}`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
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

    return { content, docName };
};

export const generateAdvancedAsset = async (
    project: Project,
    sprint: Sprint,
    toolType: 'pwb-layout-svg' | '3d-image-veo' | '2d-image' | '3d-printing-file' | 'software-code' | 'chemical-formula'
): Promise<{ content: string; docName: string; }> => {
    const ai = getAi();
    const fullContext = getBasePromptContext(project) + `\n\n## Current Sprint Context: ${sprint.name}\n${sprint.output || sprint.description}`;
    
    const orchestratorModel = selectModel({ taskType: 'advancedAssetOrchestrator' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to create an expert-level, highly detailed generation prompt for another AI agent (a Doer). The prompt must be descriptive and specific to the requested asset type. Respond with a JSON object containing a 'prompt' string for the Doer and a 'docName' string for the generated file.";
    
    const toolDescriptions: { [key in typeof toolType]: string } = {
        'pwb-layout-svg': 'a PWB (Printed Wiring Board) layout as an SVG file. The prompt should ask for valid SVG XML code representing a simple 2-layer board with components mentioned in the sprint.',
        '3d-image-veo': 'a short, 5-second 3D looping video of the component using VEO. The prompt should be cinematic and descriptive, focusing on materials, lighting, and slow rotation.',
        '2d-image': 'a photorealistic 2D image of the final product in a relevant environment. The prompt should describe the scene, lighting, and materials in detail.',
        '3d-printing-file': 'a 3D printing file in text-based STL format. The prompt should ask for valid STL code for a simplified version of the component, specifying key dimensions and features.',
        'software-code': 'a software code file. The prompt should ask for well-commented code in an appropriate language (e.g., Python, JavaScript) to implement the core logic described in the sprint.',
        'chemical-formula': 'a chemical process or formula diagram as an SVG file. The prompt should ask for valid SVG XML code representing the chemical structures, reactions, or process flow described in the sprint. Use standard chemical drawing conventions.',
    };

    const orchestratorUserPrompt = `Project & Sprint Context:\n${fullContext}\n\nTask: Create a generation prompt and a suitable document name for ${toolDescriptions[toolType]}`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: orchestratorModel,
        contents: orchestratorUserPrompt,
        config: { systemInstruction: orchestratorSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, docName: { type: Type.STRING } } } }
    }));
    const { prompt: detailedPrompt, docName } = JSON.parse(orchestratorResponse.text);

    let content: string;

    if (toolType === '3d-image-veo') {
        // fix: Explicitly type `operation` as `any` to resolve type inference issues with the `withRetry` helper.
        let operation: any = await withRetry(() => ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt: detailedPrompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' } }));
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("VEO generation failed to produce a video URI.");
        content = downloadLink;
    } else if (toolType === '2d-image') {
        const doerResponse = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: detailedPrompt, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '16:9' } }));
        if (!doerResponse.generatedImages || doerResponse.generatedImages.length === 0) throw new Error("Doer Agent failed to generate the image.");
        const base64ImageBytes: string = doerResponse.generatedImages[0].image.imageBytes;
        content = `data:image/png;base64,${base64ImageBytes}`;
    } else {
        const doerModel = selectModel({});
        const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: doerModel, contents: detailedPrompt }));
        content = doerResponse.text;
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

export type RiskWorkflowProgress = {
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error';
    iteration: number;
    logMessage: string;
    newRisk?: Risk;
    error?: string;
};

// @ts-ignore
const serializeProjectDocs = (project: Project): { id: string, name: string, content: string }[] => {
    const docs: { id: string, name: string, content: string }[] = [];
    project.phases.forEach(phase => {
        if (phase.output) {
            docs.push({ id: `phase-${phase.id}`, name: phase.name, content: phase.output });
        }
        phase.sprints.forEach(sprint => {
            if (sprint.output) {
                docs.push({ id: `sprint-${sprint.id}`, name: `${phase.name} / ${sprint.name}`, content: sprint.output });
            }
        });
    });
    (project.metaDocuments || []).forEach(doc => {
        // Exclude binary formats from context to avoid issues
        if (!['3d-image-veo', '2d-image', 'diagram', 'wireframe', 'schematic'].includes(doc.type)) {
            docs.push({ id: doc.id, name: doc.name, content: doc.content });
        }
    });
    return docs;
};

export const runRiskAssessmentWorkflow = async (
    project: Project,
    onProgress: (progress: RiskWorkflowProgress) => void
): Promise<{ finalRisks: Risk[], logDocument: MetaDocument }> => {
    const ai = getAi();
    const model = FLASH_MODEL;
    const maxIterations = 25;
    
    const allDocs = serializeProjectDocs(project).filter(doc => {
        const docExt = doc.name.split('.').pop()?.toLowerCase();
        return docExt !== 'png';
    });
    const projectContext = allDocs.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n');

    let foundRisks: Risk[] = [];
    let riskLogContent = `# AI Risk Assessment Log for ${project.name}\n\n`;

    for (let i = 1; i <= maxIterations; i++) {
        try {
            // --- ORCHESTRATOR ---
            onProgress({ currentAgent: 'Orchestrator', iteration: i, logMessage: 'Identifying next area of concern...' });
            const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your goal is to identify the next most critical potential risk for the project based on the provided documents and the risks already found. Formulate a specific, focused topic for the Doer agent to investigate. Be concise.";
            const orchestratorPrompt = `Project Context:\n${projectContext}\n\nRisks Found So Far:\n${JSON.stringify(foundRisks)}\n\nIdentify the next single, most important area to investigate for a new risk.`;
            
            const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: orchestratorPrompt, config: { systemInstruction: orchestratorSystemInstruction } }));
            const doerTask = orchestratorResponse.text;
            onProgress({ currentAgent: 'Orchestrator', iteration: i, logMessage: `Task for Doer: ${doerTask}` });

            // --- DOER ---
            onProgress({ currentAgent: 'Doer', iteration: i, logMessage: 'Investigating and formulating risk...' });
            const doerSystemInstruction = "You are a Doer Agent, an expert risk analyst. Based on the task from the orchestrator and the project context, your job is to identify and formulate a single, specific risk. You MUST provide a title, category, severity, a detailed description, and a concrete mitigation plan. Respond in a JSON object with these fields.";
            const doerPrompt = `Project Context:\n${projectContext}\n\nTask: ${doerTask}\n\nFormulate the risk as a JSON object.`;
            
            const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model, contents: doerPrompt,
                config: { systemInstruction: doerSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, category: { type: Type.STRING, enum: ['Technical', 'Schedule', 'Budget', 'Resource', 'Operational', 'Other'] }, severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] }, description: { type: Type.STRING }, mitigation: { type: Type.STRING } } } }
            }));
            const newRiskDraft: Omit<Risk, 'id'> = JSON.parse(doerResponse.text);

            // --- QA ---
            onProgress({ currentAgent: 'QA', iteration: i, logMessage: 'Validating formulated risk...' });
            const qaSystemInstruction = "You are a QA Agent. Your job is to validate the proposed risk. Is it realistic? Is the mitigation plan sensible? Based on this risk and the number of iterations, should we stop searching for more risks? A high iteration count or finding a 'Low' severity risk are good reasons to stop. Respond with JSON: `{ \"approved\": boolean, \"feedback\": string, \"shouldStop\": boolean }`.";
            const qaPrompt = `Proposed Risk:\n${JSON.stringify(newRiskDraft)}\n\nTotal Iterations So Far: ${i}/${maxIterations}\n\nValidate the risk and decide if the search should stop.`;
            
            const qaResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model, contents: qaPrompt,
                config: { systemInstruction: qaSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { approved: { type: Type.BOOLEAN }, feedback: { type: Type.STRING }, shouldStop: { type: Type.BOOLEAN } } } }
            }));
            const qaResult = JSON.parse(qaResponse.text);

            if (qaResult.approved) {
                const approvedRisk: Risk = { ...newRiskDraft, id: `risk-${Date.now()}` };
                foundRisks.push(approvedRisk);
                riskLogContent += `\n## ✅ Iteration ${i}: ${approvedRisk.title} (${approvedRisk.severity})\n- **Description**: ${approvedRisk.description}\n- **Mitigation**: ${approvedRisk.mitigation}\n`;
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: `Risk "${approvedRisk.title}" approved.`, newRisk: approvedRisk });
            } else {
                riskLogContent += `\n## ❌ Iteration ${i}: Risk Rejected\n- **Reason**: ${qaResult.feedback}\n`;
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: `Risk rejected: ${qaResult.feedback}` });
            }

            if (qaResult.shouldStop) {
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: 'QA Agent determined workflow should stop.' });
                riskLogContent += "\n--- WORKFLOW COMPLETE (QA Decision) ---";
                break;
            }
        } catch (error: any) {
            const errorMessage = error.message || "An agent failed in its task.";
            onProgress({ currentAgent: 'Error', iteration: i, logMessage: errorMessage, error: errorMessage });
            riskLogContent += `\n## 🛑 Iteration ${i}: Workflow Error\n- **Details**: ${errorMessage}\n`;
            throw new Error(errorMessage);
        }

        if (i === maxIterations) {
            riskLogContent += "\n--- WORKFLOW COMPLETE (Max Iterations Reached) ---";
        }
    }
    
    const logDocument: MetaDocument = {
        id: `meta-risklog-${Date.now()}`,
        name: `${project.name} - Risk Assessment Log`,
        content: riskLogContent,
        type: 'risk-assessment-log',
        createdAt: new Date(),
    };

    onProgress({ currentAgent: 'Done', iteration: maxIterations, logMessage: 'Workflow finished.' });
    return { finalRisks: foundRisks, logDocument };
};

export type ExportWorkflowProgress = {
    status: 'orchestrating' | 'doing' | 'qa' | 'complete' | 'error';
    log: string;
};

export const runIntegrationExportWorkflow = async (
    project: Project,
    asset: MetaDocument,
    targetToolId: string,
    onProgress: (progress: ExportWorkflowProgress) => void
): Promise<{ fileName: string; fileContent: string }> => {
    const ai = getAi();
    const model = FLASH_MODEL; 

    const tool = EXTERNAL_TOOLS.find(t => t.id === targetToolId);
    if (!tool) {
        throw new Error(`Invalid target tool: ${targetToolId}`);
    }

    const projectContext = getFullProjectContext(project);

    // --- ORCHESTRATOR ---
    onProgress({ status: 'orchestrating', log: 'Orchestrator is analyzing export requirements...' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to analyze a specific asset from an engineering project and create a plan to export it for an external tool. Based on the target tool's requirements, determine what specific data points (e.g., dimensions, component names, connections, materials) need to be extracted from the project documentation. Your output should be a concise, step-by-step plan for the Doer agent. You must specify which documents in the project context are most relevant to consult.";
    const orchestratorPrompt = `Project Context Summary:\n${getBasePromptContext(project)}\n\nAsset to Export ("${asset.name}"):\n${asset.type} asset available for export.\n\nTarget Tool: ${tool.name}\nTarget Tool Requirements:\n${tool.requirements.description}\n\nPlan the data extraction and formatting for the Doer Agent.`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: orchestratorPrompt, config: { systemInstruction: orchestratorSystemInstruction } }));
    const plan = orchestratorResponse.text;
    onProgress({ status: 'orchestrating', log: 'Orchestrator created a plan for the Doer.' });

    // --- DOER ---
    onProgress({ status: 'doing', log: 'Doer is generating the export file...' });
    const doerSystemInstruction = `You are a Doer Agent, an expert in generating configuration and script files for various engineering software like ${tool.name}. Your task is to follow the plan from the Orchestrator to generate a file compatible with the target tool. You must read the provided project documents to find the necessary information. Your output must be ONLY the raw file content, exactly as specified in the target format. Do not add any commentary, explanations, or markdown code blocks.`;
    const doerPrompt = `Orchestrator's Plan:\n${plan}\n\nFull Project Documentation:\n${projectContext}\n\nTarget Tool: ${tool.name}\nTarget File Format: ${tool.requirements.outputType}\n\nGenerate the file content now.`;
    
    const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: doerPrompt, config: { systemInstruction: doerSystemInstruction } }));
    let fileContent = doerResponse.text;

    // Clean up markdown code blocks if the AI accidentally adds them
    fileContent = fileContent.replace(/^```[a-zA-Z]*\n/gm, '').replace(/\n```$/gm, '');

    // --- QA ---
    onProgress({ status: 'qa', log: 'QA is validating the generated file...' });
    const qaSystemInstruction = `You are a QA Agent. You must validate a generated file against the target tool's requirements. Respond ONLY with a JSON object: { "approved": boolean, "feedback": string }. Feedback is required if not approved.`;
    const qaPrompt = `Generated File Content:\n${fileContent}\n\nTarget Tool: ${tool.name}\nValidation Criteria: ${tool.requirements.qaPrompt}\n\nDoes the file meet the criteria?`;
    
    const qaResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents: qaPrompt,
        config: { systemInstruction: qaSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { approved: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } } } }
    }));
    const qaResult = JSON.parse(qaResponse.text);

    if (!qaResult.approved) {
        throw new Error(`QA Failed: ${qaResult.feedback}`);
    }
    onProgress({ status: 'qa', log: 'QA has approved the file.' });

    const fileName = `${asset.name.replace(/ /g, '_')}.${tool.requirements.extension}`;
    return { fileName, fileContent };
};

export const runProjectExportWorkflow = async (
    project: Project,
    targetToolId: string,
    onProgress: (progress: ExportWorkflowProgress) => void
): Promise<{ fileName: string; fileContent: string }> => {
    const ai = getAi();
    const model = FLASH_MODEL; 

    const tool = EXTERNAL_TOOLS.find(t => t.id === targetToolId);
    if (!tool) {
        throw new Error(`Invalid target tool: ${targetToolId}`);
    }

    const projectContext = getFullProjectContext(project);

    // --- ORCHESTRATOR ---
    onProgress({ status: 'orchestrating', log: 'Orchestrator is analyzing project-wide export requirements...' });
    const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your task is to analyze an entire engineering project's documentation and create a plan to export it for an external tool. Based on the target tool's requirements, determine what specific data points (e.g., dimensions, component names, connections, materials) need to be extracted from the entire project documentation. Your output should be a concise, step-by-step plan for the Doer agent, specifying which documents seem most relevant for each piece of data.";
    const orchestratorPrompt = `Full Project Documentation:\n${projectContext}\n\nTarget Tool: ${tool.name}\nTarget Tool Requirements:\n${tool.requirements.description}\n\nPlan the data extraction and formatting for the Doer Agent.`;
    
    const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: orchestratorPrompt, config: { systemInstruction: orchestratorSystemInstruction } }));
    const plan = orchestratorResponse.text;
    onProgress({ status: 'orchestrating', log: 'Orchestrator created a plan for the Doer.' });

    // --- DOER ---
    onProgress({ status: 'doing', log: 'Doer is generating the export file from all project documents...' });
    const doerSystemInstruction = `You are a Doer Agent, an expert in generating configuration and script files for various engineering software like ${tool.name}. Your task is to follow the plan from the Orchestrator to generate a file compatible with the target tool. You must read all the provided project documents to find the necessary information. Your output must be ONLY the raw file content, exactly as specified in the target format. Do not add any commentary, explanations, or markdown code blocks.`;
    const doerPrompt = `Orchestrator's Plan:\n${plan}\n\nFull Project Documentation:\n${projectContext}\n\nTarget Tool: ${tool.name}\nTarget File Format: ${tool.requirements.outputType}\n\nGenerate the file content now.`;
    
    const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: doerPrompt, config: { systemInstruction: doerSystemInstruction } }));
    let fileContent = doerResponse.text;

    // Clean up markdown code blocks if the AI accidentally adds them
    fileContent = fileContent.replace(/^```[a-zA-Z]*\n/gm, '').replace(/\n```$/gm, '').trim();

    // --- QA ---
    onProgress({ status: 'qa', log: 'QA is validating the generated file...' });
    const qaSystemInstruction = `You are a QA Agent. You must validate a generated file against the target tool's requirements. Respond ONLY with a JSON object: { "approved": boolean, "feedback": string }. Feedback is required if not approved.`;
    const qaPrompt = `Generated File Content:\n${fileContent}\n\nTarget Tool: ${tool.name}\nValidation Criteria: ${tool.requirements.qaPrompt}\n\nDoes the file meet the criteria?`;
    
    const qaResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents: qaPrompt,
        config: { systemInstruction: qaSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { approved: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } } } }
    }));
    const qaResult = JSON.parse(qaResponse.text);

    if (!qaResult.approved) {
        throw new Error(`QA Failed: ${qaResult.feedback}`);
    }
    onProgress({ status: 'qa', log: 'QA has approved the file.' });

    const fileName = `${project.name.replace(/ /g, '_')}_Export_for_${tool.name}.${tool.requirements.extension}`;
    return { fileName, fileContent };
};

export const queryProjectData = async (project: Project, query: string): Promise<string> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'query' });
    const fullContext = getFullProjectContext(project);
    
    const systemInstruction = `You are an AI assistant with complete knowledge of the provided engineering project. Answer the user's question based *only* on the context provided. If the answer is not in the context, say "I cannot answer that based on the available project documentation."`;

    const userPrompt = `## Project Context:\n${fullContext}\n\n## User Question:\n${query}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
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
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: { systemInstruction }
    }));
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

export type ResourceWorkflowProgress = {
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error';
    iteration: number;
    logMessage: string;
    newResource?: Resource;
    error?: string;
};

export const runResourceAnalysisWorkflow = async (
    project: Project,
    onProgress: (progress: ResourceWorkflowProgress) => void
): Promise<{ finalResources: Resource[], logDocument: MetaDocument }> => {
    const ai = getAi();
    const model = FLASH_MODEL;
    const maxIterations = 25;
    
    const allDocs = serializeProjectDocs(project).filter(doc => !doc.name.toLowerCase().endsWith('.png'));
    const projectContext = allDocs.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n');

    let foundResources: Resource[] = [];
    let logContent = `# AI Resource Analysis Log for ${project.name}\n\n`;

    for (let i = 1; i <= maxIterations; i++) {
        try {
            // --- ORCHESTRATOR ---
            onProgress({ currentAgent: 'Orchestrator', iteration: i, logMessage: 'Identifying next resource to investigate...' });
            const orchestratorSystemInstruction = "You are an Orchestrator Agent. Your goal is to find required resources (software, equipment) and their sources. Based on the project documents and resources already found, identify the next most critical resource category or component to investigate. Be specific and concise.";
            const orchestratorPrompt = `Project Context:\n${projectContext}\n\nResources Found So Far:\n${JSON.stringify(foundResources)}\n\nIdentify the next single, most important resource or category to investigate.`;
            
            const orchestratorResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model, contents: orchestratorPrompt, config: { systemInstruction: orchestratorSystemInstruction } }));
            const doerTask = orchestratorResponse.text;
            onProgress({ currentAgent: 'Orchestrator', iteration: i, logMessage: `Task for Doer: ${doerTask}` });

            // --- DOER ---
            onProgress({ currentAgent: 'Doer', iteration: i, logMessage: 'Searching for resource and source...' });
            const doerSystemInstruction = "You are a Doer Agent, an expert engineering resource planner. Based on the task from the orchestrator and the project context, identify a single, specific resource. You MUST provide its name, a source or vendor, its category ('Software' or 'Equipment'), and a brief justification. Respond in a JSON object.";
            const doerPrompt = `Project Context:\n${projectContext}\n\nTask: ${doerTask}\n\nFormulate the resource as a JSON object.`;
            
            const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model, contents: doerPrompt,
                config: { systemInstruction: doerSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, source: { type: Type.STRING }, category: { type: Type.STRING, enum: ['Software', 'Equipment', 'Other'] }, justification: { type: Type.STRING } } } }
            }));
            const newResourceDraft: Omit<Resource, 'id'> = JSON.parse(doerResponse.text);

            // --- QA ---
            onProgress({ currentAgent: 'QA', iteration: i, logMessage: 'Validating found resource...' });
            const qaSystemInstruction = "You are a QA Agent. Validate the proposed resource. Is it realistic? Is the source appropriate? Is the justification sound? Based on this and the iteration count, should we stop searching? A high iteration count or finding an obvious resource are good reasons to stop. Respond with JSON: `{ \"approved\": boolean, \"feedback\": string, \"shouldStop\": boolean }`.";
            const qaPrompt = `Proposed Resource:\n${JSON.stringify(newResourceDraft)}\n\nTotal Iterations So Far: ${i}/${maxIterations}\n\nValidate the resource and decide if the search should stop.`;
            
            const qaResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model, contents: qaPrompt,
                config: { systemInstruction: qaSystemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { approved: { type: Type.BOOLEAN }, feedback: { type: Type.STRING }, shouldStop: { type: Type.BOOLEAN } } } }
            }));
            const qaResult = JSON.parse(qaResponse.text);

            if (qaResult.approved) {
                const approvedResource: Resource = { ...newResourceDraft, id: `resource-${Date.now()}` };
                foundResources.push(approvedResource);
                logContent += `\n## ✅ Iteration ${i}: ${approvedResource.name} (${approvedResource.category})\n- **Source**: ${approvedResource.source}\n- **Justification**: ${approvedResource.justification}\n`;
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: `Resource "${approvedResource.name}" approved.`, newResource: approvedResource });
            } else {
                logContent += `\n## ❌ Iteration ${i}: Resource Rejected\n- **Reason**: ${qaResult.feedback}\n`;
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: `Resource rejected: ${qaResult.feedback}` });
            }

            if (qaResult.shouldStop) {
                onProgress({ currentAgent: 'QA', iteration: i, logMessage: 'QA Agent determined workflow should stop.' });
                logContent += "\n--- WORKFLOW COMPLETE (QA Decision) ---";
                break;
            }
        } catch (error: any) {
            const errorMessage = error.message || "An agent failed in its task.";
            onProgress({ currentAgent: 'Error', iteration: i, logMessage: errorMessage, error: errorMessage });
            logContent += `\n## 🛑 Iteration ${i}: Workflow Error\n- **Details**: ${errorMessage}\n`;
            throw new Error(errorMessage);
        }

        if (i === maxIterations) {
            logContent += "\n--- WORKFLOW COMPLETE (Max Iterations Reached) ---";
        }
    }
    
    const logDocument: MetaDocument = {
        id: `meta-resourcelog-${Date.now()}`,
        name: `${project.name} - Resource Analysis Log`,
        content: logContent,
        type: 'resource-analysis-log',
        createdAt: new Date(),
    };

    onProgress({ currentAgent: 'Done', iteration: maxIterations, logMessage: 'Workflow finished.' });
    return { finalResources: foundResources, logDocument };
};


export const generatePhaseTasks = async (project: Project, phase: Phase): Promise<{title: string, description: string, priority: 'Low' | 'Medium' | 'High', assigneeRole: string}[]> => {
    const ai = getAi();
    const model = selectModel({ phase, taskType: 'taskGeneration' });
    const fullContext = getFullProjectContext(project);
    const systemInstruction = `You are an expert AI project manager specializing in ${project.disciplines.join(', ')} projects. Your task is to analyze the provided project context and the specific objectives of the "${phase.name}" phase. Generate a list of 3-5 actionable tasks required to complete this phase. For each task, provide a clear title, a detailed description in markdown, a priority level, and a suggested role for the assignee (e.g., "Software Engineer", "Mechanical Engineer", "QA Tester").`;
    const userPrompt = `## Full Project Documentation:\n${fullContext}\n\n## Current Phase: ${phase.name}\n## Phase Description: ${phase.description}\n\n## Task:\nGenerate a list of tasks for the "${phase.name}" phase in the specified JSON format.`;

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
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                        assigneeRole: { type: Type.STRING }
                    }
                }
            }
        }
    }));

    try {
        return JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI returned invalid JSON for task generation.");
    }
};


export const generateTailoredPhaseDescriptions = async (disciplines: string[], phases: {name: string, description: string}[]): Promise<{[key: string]: string}> => {
    const ai = getAi();
    const model = selectModel({ taskType: 'projectSetup' });

    const keyMap = new Map<string, string>();
    const schemaProperties = phases.reduce((acc: Record<string, { type: Type.STRING }>, phase) => {
        const camelCaseKey = toCamelCase(phase.name);
        keyMap.set(camelCaseKey, phase.name);
        acc[camelCaseKey] = { type: Type.STRING };
        return acc;
    }, {});

    const systemInstruction = `You are an expert AI engineering consultant. Your task is to rewrite a series of standard engineering phase descriptions to be more specific and relevant to a project involving the following disciplines: ${disciplines.join(', ')}. The rewritten descriptions should be professional, concise (1-2 sentences), and use terminology appropriate for the given disciplines. Your output must be a single JSON object where keys are the camel-cased phase names provided in the schema.`;
    const userPrompt = `## Engineering Disciplines: ${disciplines.join(', ')}\n\n## Standard Phases to Tailor:\n${JSON.stringify(phases, null, 2)}\n\n## Task:\nRewrite the descriptions for each phase and return the result as a JSON object with camelCased keys as specified in the response schema.`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: schemaProperties,
            }
        }
    }));

    try {
        const parsedResponse = JSON.parse(response.text);
        const tailoredDescriptions: { [key: string]: string } = {};

        // Map the camelCase keys back to the original phase names
        for (const camelCaseKey in parsedResponse) {
            if (keyMap.has(camelCaseKey)) {
                const originalName = keyMap.get(camelCaseKey)!;
                tailoredDescriptions[originalName] = parsedResponse[camelCaseKey];
            }
        }

        // Ensure all phases are present in the final object, falling back to original if AI omits one
        for(const phase of phases) {
            if (!tailoredDescriptions[phase.name]) {
                tailoredDescriptions[phase.name] = phase.description;
            }
        }

        return tailoredDescriptions;
    } catch (e) {
        throw new Error("AI returned invalid JSON for tailored phase descriptions.");
    }
};