import React, { useState } from 'react';
import { Home, Download, FileText, Package, BrainCircuit, Bot } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { Project, Phase, ToastMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

declare const JSZip: any;

interface DocumentsPageProps {
  onBack: () => void;
  setToast: (toast: ToastMessage | null) => void;
}

const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onBack, setToast }) => {
    const { project } = useProject();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    if (!project) return null;
    
    const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9_.]/gi, '_').toLowerCase();

    const handleDownloadAll = async () => {
        if (!project) return;
        setIsLoading('zip');
        try {
            const zip = new JSZip();
            const projectFolder = zip.folder(sanitizeFilename(project.name));

            const summaryContent = `# Project Summary: ${project.name}\n\n## Requirements\n${project.requirements}\n\n## Constraints\n${project.constraints}\n\n## Disciplines\n${project.disciplines.join(', ')}`;
            projectFolder.file('00_Project_Summary.md', summaryContent);
            
            project.phases.forEach((phase, index) => {
                if (phase.output || (phase.sprints && phase.sprints.some(s => s.output))) {
                    const phaseIndex = String(index + 1).padStart(2, '0');
                    const phaseName = sanitizeFilename(phase.name);
                    const phaseFolder = projectFolder.folder(`${phaseIndex}_${phaseName}`);
                    
                    if (phase.output) {
                        phaseFolder.file('main_document.md', phase.output);
                    }
                    
                    phase.sprints.forEach((sprint, sprintIndex) => {
                        if (sprint.output) {
                            const sprintName = sanitizeFilename(sprint.name);
                            phaseFolder.file(`${sprintIndex + 1}_${sprintName}.md`, sprint.output);
                        }
                    });
                }
            });

            const zipContent = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipContent);
            a.download = `${sanitizeFilename(project.name)}_project_archive.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setToast({ message: 'Project archive downloaded successfully.', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to create project archive.', type: 'error' });
        } finally {
            setIsLoading(null);
        }
    };
    
    const generateVibePrompt = async (type: 'code' | 'simulation') => {
        if (!process.env.API_KEY) {
            setToast({ message: 'API key is not configured.', type: 'error' });
            return;
        }
        setIsLoading(type);
        try {
            let systemInstruction = '';
            if (type === 'code') {
                systemInstruction = "You are an expert AI prompt engineer. Your task is to synthesize the provided engineering project documentation into a single, comprehensive 'vibe coding prompt'. This prompt should be given to an AI coding assistant to generate the full, production-ready source code. The prompt must be self-contained and instruct the assistant on architecture, core logic, data models, APIs, testing, and deployment strategies based on the design.";
            } else {
                systemInstruction = "You are an expert AI prompt engineer. Your task is to synthesize the provided engineering project documentation into a 'vibe simulation prompt'. This prompt should be given to an AI coding assistant to create a functional simulation of the designed system. The prompt must instruct the assistant on modeling system behavior, identifying key variables, designing a simple control UI, and specifying data logging for performance analysis.";
            }
            
            let fullContext = `# Project: ${project.name}\n\n## Requirements\n${project.requirements}\n\n## Constraints\n${project.constraints}\n\n---\n\n`;
            project.phases.forEach(phase => {
                if (phase.output) {
                    fullContext += `## Phase: ${phase.name}\n\n${phase.output}\n\n---\n\n`;
                }
            });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${systemInstruction}\n\n## Project Documentation Context:\n\n${fullContext}`,
            });

            const promptText = response.text;
            downloadFile(`${sanitizeFilename(project.name)}_${type}_vibe_prompt.md`, promptText, 'text/markdown');
            setToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} vibe prompt generated.`, type: 'success' });

        } catch (error) {
            console.error(error);
            setToast({ message: `Failed to generate ${type} vibe prompt.`, type: 'error' });
        } finally {
            setIsLoading(null);
        }
    };


    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Documents</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{project.name}</p>
                </div>
                <Button variant="outline" onClick={onBack}>
                    <Home className="mr-2 w-4 h-4" />Back to Dashboard
                </Button>
            </div>
            
             <Card title="Project Exports" description="Generate comprehensive project handoffs for other tools and team members." className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Button onClick={handleDownloadAll} disabled={isLoading === 'zip'} className="flex-col h-auto py-4">
                        <Package className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Download All as .zip</span>
                        <span className="text-xs font-normal mt-1">A complete, structured archive of all documents.</span>
                    </Button>
                    <Button onClick={() => generateVibePrompt('code')} disabled={!!isLoading} variant="outline" className="flex-col h-auto py-4">
                        <BrainCircuit className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Generate Code Vibe Prompt</span>
                        <span className="text-xs font-normal mt-1">Create a master prompt for an AI coding assistant.</span>
                    </Button>
                    <Button onClick={() => generateVibePrompt('simulation')} disabled={!!isLoading} variant="outline" className="flex-col h-auto py-4">
                        <Bot className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Generate Simulation Prompt</span>
                        <span className="text-xs font-normal mt-1">Create a prompt for simulating the system's logic.</span>
                    </Button>
                </div>
            </Card>

            <Card title="Individual Documents" description="Download markdown files for each completed phase.">
                <div className="space-y-3">
                    {project.phases.filter(p => p.output).map(phase => (
                        <div key={phase.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{phase.name}</p>
                                    <Badge variant={phase.status === 'completed' ? 'success' : 'default'}>{phase.status}</Badge>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => downloadFile(`${sanitizeFilename(project.name)}_${sanitizeFilename(phase.name)}.md`, phase.output || '', 'text/markdown')}>
                                <Download className="mr-2 w-4 h-4" />Download .md
                            </Button>
                        </div>
                    ))}
                    {project.phases.filter(p => p.output).length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No documents have been generated yet.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};
