import React, { useState } from 'react';
import { Bot, Check, FileText, LoaderCircle, Sparkles, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { Project, Phase, Sprint, ToastMessage } from '../types';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { withRetry } from '../utils';

type AgentStatus = 'idle' | 'orchestrating' | 'doing' | 'qa' | 'complete' | 'error';
type DocumentStatus = 'pending' | 'editing' | 'validating' | 'complete' | 'failed';

interface ImpactedDoc {
    id: string;
    name: string;
    status: DocumentStatus;
    originalContent: string;
    newContent?: string;
    qaFeedback?: string;
}

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

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
    return docs;
};

export const ChangeManagementPanel = ({ setToast }: { setToast: (toast: ToastMessage | null) => void }) => {
    const { project, updateProject } = useProject();
    const [changeRequest, setChangeRequest] = useState('');
    const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
    const [impactedDocs, setImpactedDocs] = useState<ImpactedDoc[]>([]);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!project || !changeRequest) return;
        setAgentStatus('orchestrating');
        setError('');
        setImpactedDocs([]);
        try {
            const ai = getAi();
            const allDocs = serializeProjectDocs(project);
            const context = allDocs.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n');
            const systemInstruction = "You are an Orchestrator Agent. Your task is to analyze a change request and identify which documents are impacted. Return a JSON array of the document names that need editing.";
            const userPrompt = `Project Context:\n${context}\n\nChange Request: "${changeRequest}"\n\nIdentify the impacted documents.`;
            
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: { systemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }));
            
            const impactedNames = JSON.parse(response.text);
            const docsToUpdate = allDocs
                .filter(d => impactedNames.includes(d.name))
                .map(d => ({ id: d.id, name: d.name, status: 'pending' as DocumentStatus, originalContent: d.content }));
            setImpactedDocs(docsToUpdate);
            setAgentStatus('doing');
            handleApplyChanges(docsToUpdate, allDocs);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze impact.');
            setAgentStatus('error');
        }
    };

    const handleApplyChanges = async (docsToUpdate: ImpactedDoc[], allDocs: {id: string, name: string, content: string}[]) => {
        const fullContext = allDocs.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n');
        const ai = getAi();
        let finalDocs = [...docsToUpdate];

        for (let i = 0; i < finalDocs.length; i++) {
            const doc = finalDocs[i];
            setImpactedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'editing' } : d));

            // DOER AGENT
            try {
                const doerSystemInstruction = "You are a Doer Agent. You are an expert technical writer. Your task is to edit a document based on a change request, using the full project context. Return only the complete, updated document text. Do not add any commentary.";
                const doerUserPrompt = `Full Project Context:\n${fullContext}\n\nDocument to Edit: "${doc.name}"\n---BEGIN DOCUMENT---\n${doc.originalContent}\n---END DOCUMENT---\n\nChange Request: "${changeRequest}"\n\nRewrite the document to incorporate the change.`;
                const doerResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: doerUserPrompt, config: { systemInstruction: doerSystemInstruction } }));
                const newContent = doerResponse.text;
                finalDocs[i] = { ...doc, newContent: newContent };
                setImpactedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, newContent, status: 'validating' } : d));

                // QA AGENT
                const qaSystemInstruction = "You are a QA Agent. You verify edits. Compare the original and new document versions against the change request. Respond in JSON with `approved: boolean` and `feedback: string`. Feedback is required if not approved.";
                const qaUserPrompt = `Change Request: "${changeRequest}"\n\nOriginal Document:\n${doc.originalContent}\n\nNew Document:\n${newContent}\n\nVerify the change.`;
                const qaResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: qaUserPrompt, config: { systemInstruction: qaSystemInstruction, responseMimeType: "application/json", responseSchema: {type: Type.OBJECT, properties: {approved: {type: Type.BOOLEAN}, feedback: {type: Type.STRING}}} } }));
                const qaResult = JSON.parse(qaResponse.text);

                if (qaResult.approved) {
                    finalDocs[i] = { ...finalDocs[i], status: 'complete' };
                    setImpactedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'complete' } : d));
                } else {
                    throw new Error(qaResult.feedback || 'QA rejected the change.');
                }

            } catch (err: any) {
                finalDocs[i] = { ...finalDocs[i], status: 'failed', qaFeedback: err.message };
                setImpactedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'failed', qaFeedback: err.message } : d));
                setError(`Failed on document: ${doc.name}. ` + err.message);
                setAgentStatus('error');
                return;
            }
            
            // Add a delay before processing the next document to avoid rate limiting.
            if (i < finalDocs.length - 1) {
                setToast({ message: `Processing complete for ${finalDocs[i].name}. Cooling down before next document...`, type: 'info' });
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }
        }
        
        // Persist changes to project state
        if (project) {
            let updatedProject = { ...project };
            finalDocs.forEach(doc => {
                 const [type, ...rest] = doc.id.split('-');
                 const id = rest.join('-');
                 updatedProject.phases = updatedProject.phases.map(phase => {
                    if (type === 'phase' && phase.id === id) {
                        return { ...phase, output: doc.newContent };
                    }
                    const sprintIndex = phase.sprints.findIndex(s => s.id === id);
                    if (sprintIndex > -1 && type === 'sprint') {
                        const updatedSprints = [...phase.sprints];
                        updatedSprints[sprintIndex].output = doc.newContent;
                        return { ...phase, sprints: updatedSprints };
                    }
                    return phase;
                 });
            });
            updateProject(updatedProject);
        }

        setAgentStatus('complete');
        setToast({ message: 'Change request successfully applied!', type: 'success'});
    };

    const reset = () => {
        setAgentStatus('idle');
        setChangeRequest('');
        setImpactedDocs([]);
        setError('');
    };

    const getStatusIcon = (status: DocumentStatus) => {
        switch(status) {
            case 'pending': return <LoaderCircle className="w-4 h-4 text-gray-400" />;
            case 'editing': return <LoaderCircle className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'validating': return <LoaderCircle className="w-4 h-4 text-yellow-500 animate-spin" />;
            case 'complete': return <Check className="w-4 h-4 text-green-500" />;
            case 'failed': return <X className="w-4 h-4 text-red-500" />;
        }
    }

    return (
        <Card title="Agentic Change Management" description="Describe a change, and an AI agent team will analyze the impact and edit all relevant documents.">
            {agentStatus === 'idle' ? (
                <div className="space-y-3">
                    <textarea value={changeRequest} onChange={e => setChangeRequest(e.target.value)} rows={3} placeholder="e.g., Change the primary power supply from 5V to 12V and update all related specifications." className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary text-sm" />
                    <Button onClick={handleAnalyze} disabled={!changeRequest.trim()} className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" /> Initiate Change Request
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="p-3 bg-gray-100 dark:bg-charcoal-900/50 rounded-lg">
                        <p className="text-sm font-semibold">Change Request:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{changeRequest}</p>
                    </div>
                    {agentStatus === 'orchestrating' && <div className="flex items-center text-sm"><LoaderCircle className="w-4 h-4 animate-spin mr-2"/>Orchestrator is analyzing impact...</div>}
                    {impactedDocs.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Impacted Documents:</h4>
                            {impactedDocs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-charcoal-800/50 rounded">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(doc.status)}
                                        <span className="text-sm">{doc.name}</span>
                                    </div>
                                    <Badge variant={doc.status === 'complete' ? 'success' : 'default'}>{doc.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                    {error && <div className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">{error}</div>}
                    {(agentStatus === 'complete' || agentStatus === 'error') && <Button onClick={reset} variant="outline" className="w-full">Start New Change Request</Button>}
                </div>
            )}
        </Card>
    );
};