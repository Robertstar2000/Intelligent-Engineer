import React, { useState, useEffect } from 'react';
// FIX: Import GenerateContentResponse to correctly type API call results.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Remarkable } from 'remarkable';
import { Sliders, Edit3, Save, Play, Check, Combine, RefreshCw, FileText } from 'lucide-react';

import { ApiKeyWarning } from './ApiKeyWarning';
import { GenerationError } from './GenerationError';
import { PhaseHeader } from './PhaseHeader';
import { TuningControls } from './TuningControls';
import { PhaseOutput } from './PhaseOutput';
import { PhaseActions } from './PhaseActions';
import { Button, Card, Badge } from './ui';
import { Project, Phase, Sprint } from '../types';

declare const Prism: any;

// --- HELPER FUNCTION ---
// FIX: Added generic types and type for catch block error to resolve TypeScript errors.
const withRetry = async <T,>(fn: () => Promise<T>, retries = 1): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn('API call failed, retrying...', error);
      await new Promise(res => setTimeout(res, 1000)); // Add a 1s delay for transient issues
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};

const md = new Remarkable({
    html: true, typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try { return Prism.highlight(str, Prism.languages[lang], lang); } catch (e) { console.error(e); }
        }
        return '';
    },
});

// FIX: Added onPhaseComplete to WorkflowProps to allow navigation after state updates.
interface WorkflowProps {
    phase: Phase;
    project: Project;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onPhaseComplete: () => void;
    apiKey: string | null;
    disciplines: string[];
}

const DesignReviewWorkflow = ({ phase, onUpdatePhase, onPhaseComplete }: WorkflowProps) => {
    const handleChecklistChange = (itemId: string) => {
        if (!phase.designReview) return;
        const newChecklist = phase.designReview.checklist.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        onUpdatePhase(phase.id, { designReview: { ...phase.designReview, checklist: newChecklist } });
    };

    const handleFinalizeReview = () => {
        const updates: Partial<Phase> = { status: 'completed' };
        if (phase.sprints?.length > 0) {
            updates.sprints = phase.sprints.map(s => ({ ...s, status: 'completed' }));
        }
        onUpdatePhase(phase.id, updates);
        onPhaseComplete();
    };
    
    const allChecked = phase.designReview?.checklist.every(item => item.checked);

    return (
        <>
            <Card title="Phase Output for Review" description="This is the generated document pending approval.">
                 <div className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(phase.output || '') }}
                />
            </Card>
            <Card title="Design Review" description="Verify all success factors are met before proceeding. The project cannot advance until this review is complete.">
                <div className="space-y-3">
                    {phase.designReview?.checklist.map((item) => (
                        <label key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleChecklistChange(item.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-gray-800 dark:text-gray-300 flex-1">{item.text}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleFinalizeReview} disabled={!allChecked}>
                        <Check className="mr-2 w-4 h-4" />Finalize Review & Complete Phase
                    </Button>
                </div>
            </Card>
        </>
    );
};

const MultiDocPhaseWorkflow = ({ phase, project, onUpdatePhase, onPhaseComplete, apiKey, disciplines }: WorkflowProps) => {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState('');
    const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
    const [editedSprintOutput, setEditedSprintOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase, editingSprintId]);


    const handleSaveSprint = () => {
        const updatedSprints = phase.sprints.map(s =>
            s.id === editingSprintId ? { ...s, output: editedSprintOutput } : s
        );
        onUpdatePhase(phase.id, { sprints: updatedSprints });
        setEditingSprintId(null);
        setEditedSprintOutput('');
    };

    const generateSubDocument = async (docId: string) => {
        setLoadingDocId(docId);
        setGenerationError('');
        const doc = phase.sprints.find(d => d.id === docId);
        if (!doc) return;

        try {
            if (!apiKey) { throw new Error("API Key is not provided"); }
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

            const specificPrompt = prompts[phase.name]?.[doc.name];
             if (!specificPrompt) {
                 setGenerationError(`No prompt configured for document "${doc.name}" in phase "${phase.name}".`);
                 setLoadingDocId(null);
                 return;
            }

            const docIndex = phase.sprints.findIndex(d => d.id === docId);
            let subPhaseContext = '';
            // FIX: Gather context from ALL previous documents in the phase for better continuity.
            if (docIndex > 0) {
                const previousDocs = phase.sprints.slice(0, docIndex);
                const contextParts = previousDocs
                    .map(prevDoc => {
                        if (prevDoc.output) {
                            return `## Context from Previous Document (${prevDoc.name}):\n\`\`\`markdown\n${prevDoc.output}\n\`\`\``;
                        }
                        return '';
                    })
                    .filter(part => part); // remove empty strings

                if (contextParts.length > 0) {
                    subPhaseContext = `\n\n---\n\n${contextParts.join('\n\n---\n\n')}`;
                }
            }
            
            let systemInstruction = `You are an expert AI engineering assistant specializing in project documentation. Your task is to generate a single, comprehensive engineering document based on the specified type. The document must be well-structured in Markdown, tailored to the project's details, and ready for professional use.`;
            
            if (project.developmentMode === 'rapid') {
                systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
            }

            const userPrompt = `## Project: ${project.name}
### Disciplines: ${disciplines.join(', ')}

### High-Level Requirements:
\`\`\`text
${project.requirements}
\`\`\`

### High-Level Constraints:
\`\`\`text
${project.constraints}
\`\`\`
${subPhaseContext}
---
## Task:
Generate the **${doc.name}** document based on the prompt below:
"${specificPrompt}"`;
            
            // FIX: Add prompt size validation to provide better user feedback on potential errors.
            const MAX_PROMPT_CHARACTERS = 50000;
            if (userPrompt.length > MAX_PROMPT_CHARACTERS) {
                throw new Error(`The generated prompt is too long (${userPrompt.length} characters), exceeding the ${MAX_PROMPT_CHARACTERS} character limit. Please shorten project requirements, constraints, or previous document outputs.`);
            }

            const ai = new GoogleGenAI({ apiKey });
            // FIX: Separated systemInstruction into the config object to align with best practices and fix API errors.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction,
                }
            }));
            const text = response.text;

            const updatedSprints = phase.sprints.map((d): Sprint =>
                d.id === docId ? { ...d, output: text, status: 'completed' } : d
            );
            onUpdatePhase(phase.id, { sprints: updatedSprints, status: 'in-progress' });

        } catch (error: any) {
            console.error(`Failed to generate ${doc.name}:`, error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setLoadingDocId(null);
        }
    };
    
    const generateDesignReviewChecklist = async (documentForReview: string) => {
        if (!apiKey) { throw new Error("API Key is not provided"); }
        let systemInstruction = `You are a Principal Systems Engineer AI specializing in formal design gate reviews. Your task is to generate a rigorous checklist based on the provided design document. The checklist must verify that the design thoroughly addresses all project requirements, constraints, and adheres to best-in-class engineering principles.

- For a 'Preliminary Design' phase, focus on: concept feasibility, analysis of alternatives (trade studies), risk assessment, and clear alignment with top-level requirements.
- For a 'Critical Design' phase, focus on: detailed component specifications, manufacturability (DFMA), failure mode analysis (FMEA), verification & validation plan, and compliance with all relevant standards.

Generate 5-7 critical, actionable checklist items that a review board would use to grant a go/no-go decision. Output must be a JSON object with a 'checklist' key containing an array of strings.`;

        if (project.developmentMode === 'rapid') {
            systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
        }

        const userPrompt = `## Project: ${project.name}

### Requirements:
\`\`\`text
${project.requirements}
\`\`\`

### Constraints:
\`\`\`text
${project.constraints}
\`\`\`
---
## Design Document for Review (Phase: ${phase.name}):
\`\`\`markdown
${documentForReview}
\`\`\`
---
## Task:
Generate the JSON checklist for the ${phase.name} review.`;

        const ai = new GoogleGenAI({ apiKey });
        // FIX: Separated systemInstruction into the config object to align with best practices and fix API errors.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        checklist: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["checklist"]
                }
            }
        }));
        const resultJson = JSON.parse(response.text);
        return resultJson.checklist;
    };
    
    const handleCommitPhaseOutput = async () => {
        const finalOutput = phase.sprints.map(doc => `## ${doc.name}\n\n${doc.output || 'Not generated.'}`).join('\n\n---\n\n');

        if (phase.designReview?.required) {
            setIsLoading(true);
            setGenerationError('');
            try {
                const checklistText = await generateDesignReviewChecklist(finalOutput || '');
                const newChecklist = checklistText.map((text: string, index: number) => ({
                    id: `${phase.id}-review-${index}`,
                    text,
                    checked: false,
                }));
                onUpdatePhase(phase.id, {
                    output: finalOutput,
                    status: 'in-review',
                    designReview: { ...phase.designReview, checklist: newChecklist },
                });
                onPhaseComplete();
            } catch (error: any) {
                console.error('Failed to generate design review:', error);
                setGenerationError(error.message || 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        } else {
            const updates: Partial<Phase> = {
                status: 'completed',
                output: finalOutput,
                sprints: phase.sprints.map(s => ({ ...s, status: 'completed' }))
            };
            onUpdatePhase(phase.id, updates);
            onPhaseComplete();
        }
    };
    
    const downloadPhaseOutput = () => {
        const content = phase.output || phase.sprints.map(doc => `## ${doc.name}\n\n${doc.output || 'Not generated.'}`).join('\n\n---\n\n');
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name.replace(/\s+/g, '_')}_${phase.name.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const allDocsDone = phase.sprints.every(d => d.status === 'completed');

    return (
        <>
            {!apiKey && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}
            
            <Card title="Required Documents" description="Generate and edit each foundational document to complete this phase.">
                <div className="space-y-6">
                    {phase.sprints.map(doc => (
                        <div key={doc.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
                                    </div>
                                </div>
                                <Badge variant={doc.status === 'completed' ? 'success' : 'default'}>{doc.status.replace('-', ' ')}</Badge>
                            </div>
                            <div className="mt-4">
                                {!doc.output ? (
                                    <Button size="sm" onClick={() => generateSubDocument(doc.id)} disabled={!apiKey || loadingDocId === doc.id}>
                                        {loadingDocId === doc.id ? (<><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Generating...</>) : (<><Play className="mr-2 w-4 h-4" />Generate Document</>)}
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        {editingSprintId === doc.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editedSprintOutput}
                                                    onChange={(e) => setEditedSprintOutput(e.target.value)}
                                                    className="w-full h-72 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                                                />
                                                <div className="flex space-x-2">
                                                    <Button size="sm" onClick={handleSaveSprint}>
                                                        <Save className="mr-2 w-4 h-4" />Save
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setEditingSprintId(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-72 overflow-y-auto prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(doc.output) }} />
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => { setEditingSprintId(doc.id); setEditedSprintOutput(doc.output!); }}>
                                                        <Edit3 className="mr-2 w-4 h-4"/>Edit
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => generateSubDocument(doc.id)} disabled={loadingDocId === doc.id}>
                                                        {loadingDocId === doc.id ? (<><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Regenerating...</>) : (<><RefreshCw className="mr-2 w-4 h-4"/>Regenerate</>)}
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <PhaseActions
                phase={phase}
                onMarkComplete={handleCommitPhaseOutput}
                onDownload={downloadPhaseOutput}
                isCompletable={allDocsDone}
                reviewRequired={phase.designReview?.required}
                isDownloadDisabled={!allDocsDone}
            />
        </>
    );
};

const CriticalDesignPhaseWorkflow = ({ phase, project, onUpdatePhase, onPhaseComplete, apiKey, disciplines }: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSprint, setLoadingSprint] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState('');
    const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
    const [editedSprintOutput, setEditedSprintOutput] = useState('');
    const [editedSprintDeliverablesText, setEditedSprintDeliverablesText] = useState('');

    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase, editingSprintId]);


    const generateCriticalDesignInitialOutput = async () => {
        setIsLoading(true);
        setGenerationError('');
        try {
            if (!apiKey) { throw new Error("API Key is not provided"); }
            const disciplineText = disciplines.length > 0 ? disciplines.join(', ') : 'General Engineering';
            let systemInstruction = `You are an expert AI engineering assistant. Your task is to break down the "Critical Design" phase into a preliminary design specification and a series of development sprints.
1. Create a comprehensive preliminary design specification in Markdown format.
2. Define a list of 3-5 distinct development sprints required to implement the design. Two of these sprints MUST be named 'Design for Manufacturing and Assembly (DFMA)' and 'Failure Modes and Effects Analysis (FMEA)'. The DFMA sprint should focus on optimizing the design for production. The FMEA sprint should focus on systematically identifying and mitigating potential failures. Each sprint should have a clear name and a concise description of its goal.
3. Provide the output in a structured JSON format.`;
            
            if (project.developmentMode === 'rapid') {
                systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
            }

            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplineText}

### Project Requirements:
\`\`\`text
${project?.requirements || 'Not specified'}
\`\`\`

### Project Constraints:
\`\`\`text
${project?.constraints || 'Not specified'}
\`\`\`

## Current Phase: Critical Design
### Description: ${phase.description}

## Task:
Generate the preliminary design specification and a list of development sprints based on the project details.`;

            const ai = new GoogleGenAI({ apiKey });
            // FIX: Separated systemInstruction into the config object to align with best practices and fix API errors.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            preliminarySpec: {
                                type: Type.STRING,
                                description: "The preliminary design specification in Markdown format.",
                            },
                            sprints: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                    },
                                    required: ["name", "description"],
                                },
                            },
                        },
                        required: ["preliminarySpec", "sprints"]
                    },
                },
            }));

            const resultJson = JSON.parse(response.text);
            const newSprints: Sprint[] = resultJson.sprints.map((s: any, index: number) => ({
                id: `${phase.id}-${index + 1}`,
                name: s.name,
                description: s.description,
                status: 'not-started',
                deliverables: [],
                output: '',
            }));

            onUpdatePhase(phase.id, {
                output: resultJson.preliminarySpec,
                sprints: newSprints,
                status: 'in-progress',
            });
        } catch (error: any) {
            console.error('Failed to generate output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateSprintOutput = async (sprintId: string) => {
        setLoadingSprint(sprintId);
        setGenerationError('');
        try {
            if (!apiKey) { throw new Error("API Key is not provided"); }
            const sprint = phase.sprints.find(s => s.id === sprintId);
            if (!sprint) return;
            
            let systemInstruction = `You are an expert AI engineering assistant. Your task is to generate a detailed technical specification and a list of key deliverables for a specific development sprint.
1. Use the main preliminary design specification as context.
2. Focus only on the technical details required to complete the sprint objective.
3. The technical specification should be in Markdown format, including code blocks, diagrams, or tables where appropriate.
4. The deliverables should be a concise list of tangible outcomes or artifacts (e.g., "Updated API documentation for the user authentication endpoint", "A set of unit tests covering the new caching logic", "A schematic diagram for the power regulation circuit") that will be produced by the end of the sprint.
5. Provide the output in a structured JSON format according to the provided schema.`;

            if (sprint.name === 'Failure Modes and Effects Analysis (FMEA)') {
                systemInstruction = `You are an expert AI reliability engineer. Your task is to generate a comprehensive Failure Modes and Effects Analysis (FMEA) document for a specific development sprint.
1.  Use the main preliminary design specification as the primary context for identifying potential failure modes.
2.  The technical specification must be a detailed FMEA table in Markdown format.
3.  The FMEA table must include the following columns:
    *   **Item/Function**: The component or process being analyzed.
    *   **Potential Failure Mode**: How the item could fail to meet its intended function.
    *   **Potential Effects of Failure**: The consequences of the failure.
    *   **Severity (S)**: A rating of the seriousness of the effect (1-10).
    *   **Potential Cause(s)**: The root cause of the failure.
    *   **Occurrence (O)**: A rating of the likelihood that the failure will occur (1-10).
    *   **Current Design Controls**: Existing methods to prevent or detect the failure.
    *   **Detection (D)**: A rating of the likelihood that the failure will be detected before it reaches the end-user (1-10).
    *   **Risk Priority Number (RPN)**: Calculated as S × O × D.
    *   **Recommended Actions/Mitigation Strategies**: Specific actions to reduce the RPN, targeting high-risk items first.
4.  Below the table, provide a brief explanation of the 1-10 rating scales used for Severity, Occurrence, and Detection.
5.  The 'deliverables' should be a concise list of outcomes, such as "Completed FMEA document for review", "List of high-risk items requiring immediate action", and "Proposed design changes based on mitigation strategies".
6.  Provide the output in a structured JSON format according to the provided schema.`;
            }

            if (project.developmentMode === 'rapid') {
                systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
            }

            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplines.join(', ')}

### Project Requirements:
\`\`\`text
${project?.requirements || 'Not specified'}
\`\`\`

### Project Constraints:
\`\`\`text
${project?.constraints || 'Not specified'}
\`\`\`

---

## Preliminary Design Specification (Context):
\`\`\`markdown
${phase.output}
\`\`\`

---

## Current Sprint to Generate: ${sprint.name}
### Sprint Goal: ${sprint.description}

## Task:
Generate the detailed technical specification and a list of key deliverables in JSON format for this sprint.`;
            
            const MAX_PROMPT_CHARACTERS = 50000;
            if (userPrompt.length > MAX_PROMPT_CHARACTERS) {
                throw new Error(`The generated prompt is too long (${userPrompt.length} characters), exceeding the ${MAX_PROMPT_CHARACTERS} character limit. The preliminary design specification may be too large.`);
            }

            const ai = new GoogleGenAI({ apiKey });
            // FIX: Separated systemInstruction into the config object to align with best practices and fix API errors.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: { 
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            technicalSpec: {
                                type: Type.STRING,
                                description: "The detailed technical specification in Markdown format.",
                            },
                            deliverables: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING,
                                },
                                description: "A concise list of tangible deliverables for the sprint, derived from the technical specification.",
                            },
                        },
                        required: ["technicalSpec", "deliverables"]
                    },
                }
            }));
            
            const resultJson = JSON.parse(response.text);

            const updatedSprints = phase.sprints.map((s): Sprint => 
                s.id === sprintId ? { ...s, output: resultJson.technicalSpec, deliverables: resultJson.deliverables, status: 'in-progress' } : s
            );
            onUpdatePhase(phase.id, { sprints: updatedSprints });

        } catch (error: any) {
            console.error('Failed to generate sprint output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setLoadingSprint(null);
        }
    };
    
    const handleMergeSprint = (sprintId: string) => {
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint || !sprint.output) return;

        const mergedOutput = `${phase.output}\n\n---\n\n### Completed Sprint: ${sprint.name}\n\n**Technical Specification:**\n\n${sprint.output}`;
        const updatedSprints = phase.sprints.map((s): Sprint => 
            s.id === sprintId ? { ...s, status: 'completed' } : s
        );

        onUpdatePhase(phase.id, { output: mergedOutput, sprints: updatedSprints });
        if(editingSprintId === sprintId) {
            setEditingSprintId(null);
            setEditedSprintOutput('');
        }
    };

    const handleSaveSprint = () => {
        const updatedDeliverables = editedSprintDeliverablesText.split('\n').filter(d => d.trim() !== '');
        const updatedSprints = phase.sprints.map(s =>
            s.id === editingSprintId ? { ...s, output: editedSprintOutput, deliverables: updatedDeliverables } : s
        );
        onUpdatePhase(phase.id, { sprints: updatedSprints });
        setEditingSprintId(null);
        setEditedSprintOutput('');
        setEditedSprintDeliverablesText('');
    };

    const allSprintsDone = phase.sprints?.length > 0 && phase.sprints.every(s => s.status === 'completed');

    return (
        <>
            {!apiKey && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}

            <TuningControls settings={phase.tuningSettings} onChange={(key, value) => onUpdatePhase(phase.id, { tuningSettings: { ...phase.tuningSettings, [key]: value } })} />
            
            <Card title={allSprintsDone ? "Final Design Specification" : "Preliminary Design Specification"} description={!phase.output ? "Generate a spec and sprints to begin." : "This document will be updated as you complete sprints."}>
                {!phase.output ? (
                     <div className="text-center py-8">
                         <Button onClick={generateCriticalDesignInitialOutput} disabled={!apiKey || isLoading}>
                             {isLoading ? ( <><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Generating...</> ) : 
                             ( <><Sliders className="mr-2 w-4 h-4" />Generate Spec & Sprints</> )}
                         </Button>
                     </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(phase.output) }} />
                )}
            </Card>

            {phase.sprints?.length > 0 && (
                <Card title="Development Sprints" description="Generate, edit, and merge technical specs for each sprint.">
                    <div className="space-y-6">
                        {phase.sprints.map(sprint => (
                            <div key={sprint.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{sprint.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sprint.description}</p>
                                    </div>
                                    <Badge variant={sprint.status === 'completed' ? 'success' : sprint.status === 'in-progress' ? 'warning' : 'default'}>{sprint.status.replace('-', ' ')}</Badge>
                                </div>
                                <div className="mt-4">
                                    {!sprint.output ? (
                                        <Button size="sm" onClick={() => generateSprintOutput(sprint.id)} disabled={!apiKey || loadingSprint === sprint.id}>
                                            {loadingSprint === sprint.id ? (<><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Generating...</>) : (<><Play className="mr-2 w-4 h-4" />Generate Spec & Deliverables</>)}
                                        </Button>
                                    ) : (
                                        <div className="space-y-4">
                                            {editingSprintId === sprint.id ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">Deliverables:</h5>
                                                        <textarea
                                                            value={editedSprintDeliverablesText}
                                                            onChange={(e) => setEditedSprintDeliverablesText(e.target.value)}
                                                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                                                            placeholder="One deliverable per line"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">Technical Specification:</h5>
                                                        <textarea 
                                                            value={editedSprintOutput} 
                                                            onChange={(e) => setEditedSprintOutput(e.target.value)} 
                                                            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" 
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button size="sm" onClick={handleSaveSprint}><Save className="mr-2 w-4 h-4" />Save Changes</Button>
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setEditingSprintId(null);
                                                            setEditedSprintOutput('');
                                                            setEditedSprintDeliverablesText('');
                                                        }}>Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {sprint.deliverables && sprint.deliverables.length > 0 && (
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Deliverables:</h5>
                                                            <ul className="list-disc list-inside mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                                {sprint.deliverables.map((deliverable, index) => (
                                                                    <li key={index}>{deliverable}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mt-3 mb-2">Technical Specification:</h5>
                                                        <div className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-72 overflow-y-auto prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(sprint.output) }} />
                                                    </div>
                                                </>
                                            )}

                                            {sprint.status !== 'completed' && editingSprintId !== sprint.id && (
                                                <div className="flex space-x-2 mt-4">
                                                    <Button size="sm" variant="outline" onClick={() => { 
                                                        setEditingSprintId(sprint.id); 
                                                        setEditedSprintOutput(sprint.output!); 
                                                        setEditedSprintDeliverablesText((sprint.deliverables || []).join('\n'));
                                                    }}><Edit3 className="mr-2 w-4 h-4"/>Edit</Button>
                                                    <Button size="sm" variant="outline" onClick={() => generateSprintOutput(sprint.id)} disabled={loadingSprint === sprint.id}><RefreshCw className="mr-2 w-4 h-4"/>Regenerate</Button>
                                                    <Button size="sm" onClick={() => handleMergeSprint(sprint.id)}><Combine className="mr-2 w-4 h-4" />Accept & Merge</Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <PhaseActions
                phase={phase}
                onMarkComplete={() => { onUpdatePhase(phase.id, { status: 'in-review' }); onPhaseComplete(); }}
                onDownload={() => {}}
                isCompletable={allSprintsDone}
                reviewRequired={phase.designReview?.required}
                isDownloadDisabled={!phase.output}
            />
        </>
    );
};

const StandardPhaseWorkflow = ({ phase, project, onUpdatePhase, onPhaseComplete, apiKey, disciplines }: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const handleUpdateTuning = (key: string, value: string | number) => {
        const newSettings = { ...phase.tuningSettings, [key]: value };
        onUpdatePhase(phase.id, { tuningSettings: newSettings });
    };

    const handleSaveOutput = (newOutput: string) => {
        onUpdatePhase(phase.id, { output: newOutput });
    };

    const generateOutput = async () => {
        if (!apiKey) {
            setGenerationError('API key is required. Please set the API_KEY environment variable.');
            return;
        }
        setIsLoading(true);
        setGenerationError('');
        try {
            const disciplineText = disciplines.length > 0 ? disciplines.join(', ') : 'General Engineering';
            const previousPhases = project?.phases?.filter(p => p.output && p.id < phase.id) || [];
            
            const mostRecentPhase = previousPhases.length > 0 ? previousPhases[previousPhases.length - 1] : null;
            const contextSection = mostRecentPhase 
                ? `\n\n---\n\n## Context from Previous Phase (${mostRecentPhase.name}):\n\`\`\`markdown\n${mostRecentPhase.output}\n\`\`\`` 
                : '';

            const tuningSection = Object.entries(phase.tuningSettings).map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}${typeof value === 'number' ? '%' : ''}`).join('\n');

            let systemInstruction = `You are an expert AI engineering assistant. Your task is to generate a comprehensive, professional engineering document for a specific project phase. The output must be:
1. Tailored to the selected engineering disciplines.
2. Based on the project requirements, constraints, and context from previous phases.
3. Adhere to the provided tuning settings to guide the tone, focus, and detail of the output.
4. Include specific, actionable technical deliverables appropriate for the phase.
5. Provide clear rationale for all significant decisions.
6. Be well-structured, formatted in Markdown for clarity, and ready for professional use.
7. Address the current phase directly and comprehensively.`;
            
            if (project.developmentMode === 'rapid') {
                systemInstruction += "\n\nIMPORTANT: Respond in a brief, accurate, and cryptic manner. Use bullet lists and concise language suitable for rapid prototyping. Avoid verbose explanations.";
            }

            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplineText}

### Project Requirements:
\`\`\`text
${project?.requirements || 'Not specified'}
\`\`\`

### Project Constraints:
\`\`\`text
${project?.constraints || 'Not specified'}
\`\`\`
${contextSection}

---

## Current Phase to Generate: ${phase.name}
### Description: ${phase.description}

### Tuning Settings:
${tuningSection}

---

## Task:
Generate the complete engineering documentation in Markdown format for the **${phase.name}** phase now.`;

            const MAX_PROMPT_CHARACTERS = 50000;
            if (userPrompt.length > MAX_PROMPT_CHARACTERS) {
                throw new Error(`The generated prompt is too long (${userPrompt.length} characters), exceeding the ${MAX_PROMPT_CHARACTERS} character limit. Please try to shorten project requirements, constraints, or the output from the previous phase.`);
            }
            
            const ai = new GoogleGenAI({ apiKey });
            // FIX: Separated systemInstruction into the config object to align with best practices and fix API errors.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction,
                }
            }));

            const text = response.text;
            onUpdatePhase(phase.id, { output: text, status: 'in-progress' });
        } catch (error: any) {
            console.error('Failed to generate output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCommitPhaseOutput = () => {
        onUpdatePhase(phase.id, { status: 'completed' });
        onPhaseComplete();
    };

    const downloadPhaseOutput = () => {
        const content = phase.output || '';
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name.replace(/\s+/g, '_')}_${phase.name.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {!apiKey && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}

            <TuningControls settings={phase.tuningSettings} onChange={handleUpdateTuning} />

            <PhaseOutput
                phase={phase}
                onGenerate={generateOutput}
                onSave={handleSaveOutput}
                isLoading={isLoading}
                isEditable={phase.isEditable}
                apiKey={apiKey}
            />

            <PhaseActions
                phase={phase}
                onMarkComplete={handleCommitPhaseOutput}
                onDownload={downloadPhaseOutput}
                reviewRequired={phase.designReview?.required}
                isDownloadDisabled={!phase.output}
            />
        </>
    );
};

// FIX: Added props type for PhaseView
interface PhaseViewProps {
    phase: Phase;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onPhaseComplete: () => void;
    disciplines: string[];
    project: Project;
    apiKey: string | null;
}

// FIX: Exported PhaseView component to make it available for import in other files.
export const PhaseView = (props: PhaseViewProps) => {
    const { phase, project, disciplines } = props;

    let content;
    const multiDocPhases = ['Requirements', 'Preliminary Design', 'Testing'];

    if (phase.status === 'in-review') {
        content = <DesignReviewWorkflow {...props} />;
    } else if (multiDocPhases.includes(phase.name)) {
        content = <MultiDocPhaseWorkflow {...props} />;
    } else if (phase.name === 'Critical Design') {
        content = <CriticalDesignPhaseWorkflow {...props} />;
    } else {
        content = <StandardPhaseWorkflow {...props} />;
    }
    
    return (
        <div className="space-y-6">
            <PhaseHeader phase={phase} disciplines={disciplines} />
            {content}
        </div>
    );
};