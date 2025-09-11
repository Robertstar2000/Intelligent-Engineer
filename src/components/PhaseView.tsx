import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Remarkable } from 'remarkable';
import { Sliders, Edit3, Save, Play, Check, Combine, RefreshCw } from 'lucide-react';

import { ApiKeyWarning } from './ApiKeyWarning';
import { GenerationError } from './GenerationError';
import { PhaseHeader } from './PhaseHeader';
import { TuningControls } from './TuningControls';
import { PhaseOutput } from './PhaseOutput';
import { PhaseActions } from './PhaseActions';
import { Button, Card, Badge } from './ui';

declare const Prism: any;

const md = new Remarkable({
    html: true, linkify: true, typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try { return Prism.highlight(str, Prism.languages[lang], lang); } catch (e) { console.error(e); }
        }
        return '';
    },
});

export const PhaseView = ({ phase, onUpdatePhase, disciplines = [], project }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSprint, setLoadingSprint] = useState(null);
    const [generationError, setGenerationError] = useState('');
    const [editingSprintId, setEditingSprintId] = useState(null);
    const [editedSprintOutput, setEditedSprintOutput] = useState('');

    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase, editingSprintId]);


    const handleUpdateTuning = (key, value) => {
        const newSettings = { ...phase.tuningSettings, [key]: value };
        onUpdatePhase(phase.id, { tuningSettings: newSettings });
    };

    const handleSaveOutput = (newOutput) => {
        onUpdatePhase(phase.id, { output: newOutput });
    };

    const generateCriticalDesignInitialOutput = async () => {
        setIsLoading(true);
        setGenerationError('');
        try {
            const disciplineText = disciplines.length > 0 ? disciplines.join(', ') : 'General Engineering';
            const systemInstruction = `You are an expert AI engineering assistant. Your task is to break down the "Critical Design" phase into a preliminary design specification and a series of development sprints.
1. Create a comprehensive preliminary design specification in Markdown format.
2. Define a list of 2-4 distinct development sprints required to implement the design. Each sprint should have a clear name and a concise description of its goal.
3. Provide the output in a structured JSON format.`;
            
            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplineText}
### Project Requirements:
${project?.requirements || 'Not specified'}
### Project Constraints:
${project?.constraints || 'Not specified'}

## Current Phase: Critical Design
### Description: ${phase.description}

## Task:
Generate the preliminary design specification and a list of development sprints based on the project details.`;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
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
                                },
                            },
                        },
                    },
                },
            });

            const resultJson = JSON.parse(response.text);
            const newSprints = resultJson.sprints.map((s, index) => ({
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
        } catch (error) {
            console.error('Failed to generate output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateSprintOutput = async (sprintId) => {
        setLoadingSprint(sprintId);
        setGenerationError('');
        try {
            const sprint = phase.sprints.find(s => s.id === sprintId);
            if (!sprint) return;
            
            const systemInstruction = `You are an expert AI engineering assistant. Your task is to generate a detailed technical-only specification for a specific development sprint.
1. Use the main preliminary design specification as context.
2. Focus only on the technical details required to complete the sprint objective.
3. Format the output in Markdown, including code blocks, diagrams, or tables where appropriate.`;

            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplines.join(', ')}
### Project Requirements:
${project?.requirements || 'Not specified'}
### Project Constraints:
${project?.constraints || 'Not specified'}

---

## Preliminary Design Specification (Context):
${phase.output}

---

## Current Sprint to Generate: ${sprint.name}
### Sprint Goal: ${sprint.description}

## Task:
Generate the detailed technical specification in Markdown for this sprint.`;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: { systemInstruction }
            });

            const updatedSprints = phase.sprints.map(s => 
                s.id === sprintId ? { ...s, output: response.text, status: 'in-progress' } : s
            );
            onUpdatePhase(phase.id, { sprints: updatedSprints });

        } catch (error) {
            console.error('Failed to generate sprint output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setLoadingSprint(null);
        }
    };

    const handleMergeSprint = (sprintId) => {
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint || !sprint.output) return;

        const mergedOutput = `${phase.output}\n\n---\n\n### Completed Sprint: ${sprint.name}\n\n**Technical Specification:**\n\n${sprint.output}`;
        const updatedSprints = phase.sprints.map(s => 
            s.id === sprintId ? { ...s, status: 'completed' } : s
        );

        onUpdatePhase(phase.id, { output: mergedOutput, sprints: updatedSprints });
        if(editingSprintId === sprintId) {
            setEditingSprintId(null);
            setEditedSprintOutput('');
        }
    };

    const handleSaveSprint = () => {
        const updatedSprints = phase.sprints.map(s => 
            s.id === editingSprintId ? { ...s, output: editedSprintOutput } : s
        );
        onUpdatePhase(phase.id, { sprints: updatedSprints });
        setEditingSprintId(null);
        setEditedSprintOutput('');
    };


    const generateOutput = async () => {
        if (phase.name === 'Critical Design') {
            await generateCriticalDesignInitialOutput();
            return;
        }

        if (!process.env.API_KEY) {
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
                ? `\n\n---\n\n## Context from Previous Phase (${mostRecentPhase.name}):\n${mostRecentPhase.output}` 
                : '';

            const tuningSection = Object.entries(phase.tuningSettings).map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}${typeof value === 'number' ? '%' : ''}`).join('\n');

            const systemInstruction = `You are an expert AI engineering assistant. Your task is to generate a comprehensive, professional engineering document for a specific project phase. The output must be:
1. Tailored to the selected engineering disciplines.
2. Based on the project requirements, constraints, and context from previous phases.
3. Adhere to the provided tuning settings to guide the tone, focus, and detail of the output.
4. Include specific, actionable technical deliverables appropriate for the phase.
5. Provide clear rationale for all significant decisions.
6. Be well-structured, formatted in Markdown for clarity, and ready for professional use.
7. Address the current phase directly and comprehensively.`;

            const userPrompt = `## Project: ${project?.name || 'Unnamed Project'}
### Engineering Disciplines: ${disciplineText}

### Project Requirements:
${project?.requirements || 'Not specified'}

### Project Constraints:
${project?.constraints || 'Not specified'}
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

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: { systemInstruction: systemInstruction }
            });

            const text = response.text;
            onUpdatePhase(phase.id, { output: text, status: 'in-progress' });
        } catch (error) {
            console.error('Failed to generate output:', error);
            setGenerationError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadDocumentation = () => {
        const blob = new Blob([phase.output || ''], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name.replace(/\s+/g, '_')}_${phase.name.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const markPhaseComplete = () => {
        onUpdatePhase(phase.id, { status: 'completed' });
    };


    if (phase.name === 'Critical Design') {
        const allSprintsDone = phase.sprints?.length > 0 && phase.sprints.every(s => s.status === 'completed');
        return (
            <div className="space-y-6">
                <PhaseHeader phase={phase} disciplines={disciplines} />
                {!process.env.API_KEY && <ApiKeyWarning />}
                {generationError && <GenerationError message={generationError} />}

                <TuningControls settings={phase.tuningSettings} onChange={handleUpdateTuning} />
                
                <Card title={allSprintsDone ? "Final Design Specification" : "Preliminary Design Specification"} description={!phase.output ? "Generate a spec and sprints to begin." : "This document will be updated as you complete sprints."}>
                    {!phase.output ? (
                         <div className="text-center py-8">
                             <Button onClick={generateOutput} disabled={!process.env.API_KEY || isLoading}>
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
                                        {!sprint.output && (
                                            <Button size="sm" onClick={() => generateSprintOutput(sprint.id)} disabled={!process.env.API_KEY || loadingSprint === sprint.id}>
                                                {loadingSprint === sprint.id ? (<><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Generating...</>) : (<><Play className="mr-2 w-4 h-4" />Generate Spec</>)}
                                            </Button>
                                        )}
                                        {sprint.output && editingSprintId === sprint.id ? (
                                             <div className="space-y-3">
                                                 <textarea value={editedSprintOutput} onChange={(e) => setEditedSprintOutput(e.target.value)} className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
                                                 <div className="flex space-x-2">
                                                     <Button size="sm" onClick={handleSaveSprint}><Save className="mr-2 w-4 h-4" />Save</Button>
                                                     <Button variant="outline" size="sm" onClick={() => setEditingSprintId(null)}>Cancel</Button>
                                                 </div>
                                             </div>
                                        ) : sprint.output && (
                                            <div className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-72 overflow-y-auto prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(sprint.output) }} />
                                        )}
                                        {sprint.output && sprint.status !== 'completed' && editingSprintId !== sprint.id && (
                                            <div className="flex space-x-2 mt-3">
                                                <Button size="sm" variant="outline" onClick={() => { setEditingSprintId(sprint.id); setEditedSprintOutput(sprint.output); }}><Edit3 className="mr-2 w-4 h-4"/>Edit</Button>
                                                <Button size="sm" variant="outline" onClick={() => generateSprintOutput(sprint.id)} disabled={loadingSprint === sprint.id}><RefreshCw className="mr-2 w-4 h-4"/>Regenerate</Button>
                                                <Button size="sm" onClick={() => handleMergeSprint(sprint.id)}><Combine className="mr-2 w-4 h-4" />Accept & Merge</Button>
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
                    onMarkComplete={markPhaseComplete}
                    onDownload={downloadDocumentation}
                    isCompletable={allSprintsDone}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PhaseHeader phase={phase} disciplines={disciplines} />

            {!process.env.API_KEY && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}

            <TuningControls settings={phase.tuningSettings} onChange={handleUpdateTuning} />

            <PhaseOutput
                phase={phase}
                onGenerate={generateOutput}
                onSave={handleSaveOutput}
                isLoading={isLoading}
            />

            <PhaseActions
                phase={phase}
                onMarkComplete={markPhaseComplete}
                onDownload={downloadDocumentation}
            />
        </div>
    );
};