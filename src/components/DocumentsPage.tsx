import React, { useState, useEffect } from 'react';
import { Home, Download, FileText, Package, BrainCircuit, Bot, FileSignature, LoaderCircle, ChevronDown, Eye, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { Project, Phase, ToastMessage, MetaDocument, Message } from '../types';
import { generateVibePrompt as generateVibePromptFromService, generateProjectSummary } from '../services/geminiService';
import { Remarkable } from 'remarkable';

declare const JSZip: any;
declare const Prism: any;

const md = new Remarkable({ html: true });

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9_.]/gi, '_').toLowerCase();

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

const DocumentViewerModal = ({ isOpen, onClose, document }) => {
    useEffect(() => {
        if (isOpen && document?.content) {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isOpen, document]);
    
    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <Card 
                className="w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                noPadding
                flexBody
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{document.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div 
                    className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(document.content || '') }}
                />
            </Card>
        </div>
    );
};


const DownloadDropdown = ({ documentName, documentContent }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleDownload = (format: 'md' | 'txt' | 'doc' | 'pdf') => {
        const filename = `${sanitizeFilename(documentName)}.${format}`;
        
        if (format === 'md') {
            downloadFile(filename, documentContent, 'text/markdown');
        } else if (format === 'txt') {
            const textContent = documentContent
                .replace(/#+\s/g, '')
                .replace(/(\*\*|__)(.*?)\1/g, '$2')
                .replace(/(\*|_)(.*?)\1/g, '$2')
                .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
                .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                .replace(/!\[(.*?)\]\(.*?\)/g, '');
            downloadFile(filename, textContent, 'text/plain');
        } else if (format === 'doc') {
            const htmlContent = md.render(documentContent);
            const docContent = `
              <!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentName}</title></head>
              <body>${htmlContent}</body></html>`;
            downloadFile(filename, docContent, 'application/msword');
        } else if (format === 'pdf') {
            const htmlContent = md.render(documentContent);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html><head><title>Print - ${documentName}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; }
                    pre, code { white-space: pre-wrap; background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
                    .prose { max-width: 800px; margin: 0 auto; }
                </style>
                </head><body><div class="prose">${htmlContent}</div></body></html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <Button size="sm" variant="outline" onClick={() => setIsOpen(!isOpen)}>
                    <Download className="mr-2 w-4 h-4" />
                    Download
                    <ChevronDown className="ml-2 -mr-1 h-4 w-4" />
                </Button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-charcoal-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={() => handleDownload('md')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Markdown (.md)</button>
                        <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Plain Text (.txt)</button>
                        <button onClick={() => handleDownload('doc')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Word (.doc)</button>
                        <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">PDF (.pdf)</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const formatChatLog = (log: Message[]): string => {
    return log.map(msg => {
        let header = '';
        if (msg.sender === 'system') {
            header = `> **SYSTEM** (${msg.timestamp})`;
        } else {
            header = `**${msg.userName || 'Unknown'}** (${msg.timestamp})`;
        }

        let content = '';
        if (msg.text) {
            content = msg.text;
        } else if (msg.attachment) {
            content = `*Attachment: ${msg.attachment.name}*`;
        }

        return `${header}\n> ${content.replace(/\n/g, '\n> ')}\n`;
    }).join('\n---\n');
};

interface DocumentsPageProps {
  onBack: () => void;
  setToast: (toast: ToastMessage | null) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onBack, setToast }) => {
    const { project, updateProject } = useProject();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [viewingDocument, setViewingDocument] = useState<{ name: string; content: string; } | null>(null);

    if (!project) return null;

    const hasCodeVibePrompt = project.metaDocuments?.some(doc => doc.type === 'code-vibe-prompt');
    const hasSimulationVibePrompt = project.metaDocuments?.some(doc => doc.type === 'simulation-vibe-prompt');
    const hasExecutiveSummary = project.metaDocuments?.some(doc => doc.type === 'executive-summary');
    
    const handleDownloadAll = async () => {
        if (!project) return;
        setIsLoading('zip');
        try {
            const zip = new JSZip();
            const projectFolder = zip.folder(sanitizeFilename(project.name));

            const summaryContent = `# Project Summary: ${project.name}\n\n## Requirements\n${project.requirements}\n\n## Constraints\n${project.constraints}\n\n## Disciplines\n${project.disciplines.join(', ')}`;
            projectFolder.file('00_Project_Summary.md', summaryContent);
            
            project.phases.forEach((phase, index) => {
                if (phase.output || (phase.sprints && phase.sprints.some(s => s.output)) || phase.chatLog) {
                    const phaseIndex = String(index + 1).padStart(2, '0');
                    const phaseName = sanitizeFilename(phase.name);
                    const phaseFolder = projectFolder.folder(`${phaseIndex}_${phaseName}`);
                    
                    if (phase.output) {
                        phaseFolder.file('main_document.md', phase.output);
                    }

                    if (phase.chatLog && phase.chatLog.length > 0) {
                        phaseFolder.file('chat_log.md', formatChatLog(phase.chatLog));
                    }
                    
                    phase.sprints.forEach((sprint, sprintIndex) => {
                        const sprintName = sanitizeFilename(sprint.name);
                        const sprintFolder = phaseFolder.folder(`${sprintIndex + 1}_${sprintName}`);
                        if (sprint.output) {
                            sprintFolder.file('sprint_document.md', sprint.output);
                        }
                        if (sprint.chatLog && sprint.chatLog.length > 0) {
                            sprintFolder.file('chat_log.md', formatChatLog(sprint.chatLog));
                        }
                    });
                }
            });
            
            (project.metaDocuments || []).forEach(doc => {
                projectFolder.file(sanitizeFilename(doc.name) + '.md', doc.content);
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
            setToast({ message: 'Failed to create project archive.', type: 'error' });
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleVibePrompt = async (type: 'code' | 'simulation') => {
        if (!process.env.API_KEY) {
            setToast({ message: 'API key is not configured.', type: 'error' });
            return;
        }
        if (!project) return;

        const type_map = {
            'code': 'Code Vibe Prompt',
            'simulation': 'Simulation Vibe Prompt'
        }
        setIsLoading(type);
        try {
            const promptText = await generateVibePromptFromService(project, type);
            const newDoc: MetaDocument = {
                id: `meta-${Date.now()}`,
                name: `${project.name} - ${type_map[type]}`,
                content: promptText,
                type: `${type}-vibe-prompt`,
                createdAt: new Date(),
            };
            const updatedMetaDocs = [...(project.metaDocuments || []), newDoc];
            updateProject({...project, metaDocuments: updatedMetaDocs});
            downloadFile(`${sanitizeFilename(newDoc.name)}.md`, newDoc.content, 'text/markdown');
            setToast({ message: `${type_map[type]} generated and saved.`, type: 'success' });
        } catch (error: any) {
            setToast({ message: `Failed to generate ${type_map[type]}.`, type: 'error' });
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleGenerateSummary = async () => {
        if (!process.env.API_KEY || !project) return;
        setIsLoading('summary');
        try {
            const summaryText = await generateProjectSummary(project);
            const newDoc: MetaDocument = {
                id: `meta-${Date.now()}`,
                name: `${project.name} - Executive Summary`,
                content: summaryText,
                type: 'executive-summary',
                createdAt: new Date(),
            };
            const updatedMetaDocs = [...(project.metaDocuments || []), newDoc];
            updateProject({...project, metaDocuments: updatedMetaDocs});
            setToast({ message: 'Executive summary generated and saved.', type: 'success' });
        } catch (error: any) {
            setToast({ message: 'Failed to generate summary.', type: 'error' });
        } finally {
            setIsLoading(null);
        }
    };

    const allDocuments = [];
    project.phases.forEach(phase => {
        if (phase.output) {
            allDocuments.push({
                id: `phase-${phase.id}`,
                name: `${phase.name} (Phase Output)`,
                content: phase.output,
                type: 'Phase',
                status: phase.status
            });
        }
        if (phase.chatLog && phase.chatLog.length > 0) {
            allDocuments.push({
                id: `chat-phase-${phase.id}`,
                name: `Chat Log: ${phase.name}`,
                content: formatChatLog(phase.chatLog),
                type: 'Chat Log',
                status: phase.status
            });
        }
        phase.sprints.forEach(sprint => {
            if(sprint.output) {
                allDocuments.push({
                    id: `sprint-${sprint.id}`,
                    name: `${sprint.name} (Sprint Output)`,
                    content: sprint.output,
                    type: 'Sprint',
                    phaseName: phase.name
                });
            }
            if (sprint.chatLog && sprint.chatLog.length > 0) {
                allDocuments.push({
                    id: `chat-sprint-${sprint.id}`,
                    name: `Chat Log: ${sprint.name}`,
                    content: formatChatLog(sprint.chatLog),
                    type: 'Chat Log',
                    phaseName: phase.name
                });
            }
        });
    });
    
    (project.metaDocuments || []).forEach(doc => {
        allDocuments.push({
            id: `meta-${doc.id}`,
            name: doc.name,
            content: doc.content,
            type: doc.type === 'executive-summary' ? 'Summary' : 'Vibe Prompt'
        });
    });

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
            
             <Card title="Project Exports & Handoffs" description="Generate comprehensive project artifacts for other tools and team members." className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Button onClick={handleDownloadAll} disabled={isLoading === 'zip'} className="flex-col h-auto py-4">
                        <Package className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Download All as .zip</span>
                        <span className="text-xs font-normal mt-1">A complete, structured archive of all documents.</span>
                    </Button>
                    <Button onClick={() => handleVibePrompt('code')} disabled={!!isLoading} variant="outline" className={`flex-col h-auto py-4 ${hasCodeVibePrompt ? 'border-brand-primary bg-brand-primary/10' : ''}`}>
                        <BrainCircuit className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Generate Code Vibe Prompt</span>
                        <span className="text-xs font-normal mt-1">Create a master prompt for an AI coding assistant.</span>
                    </Button>
                    <Button onClick={() => handleVibePrompt('simulation')} disabled={!!isLoading} variant="outline" className={`flex-col h-auto py-4 ${hasSimulationVibePrompt ? 'border-brand-primary bg-brand-primary/10' : ''}`}>
                        <Bot className="w-6 h-6 mb-2" />
                        <span className="font-semibold">Generate Simulation Prompt</span>
                        <span className="text-xs font-normal mt-1">Create a prompt for simulating the system's logic.</span>
                    </Button>
                     <Button onClick={handleGenerateSummary} disabled={!!isLoading} variant="outline" className={`flex-col h-auto py-4 ${hasExecutiveSummary ? 'border-brand-primary bg-brand-primary/10' : ''}`}>
                        {isLoading === 'summary' ? <LoaderCircle className="w-6 h-6 mb-2 animate-spin" /> : <FileSignature className="w-6 h-6 mb-2" />}
                        <span className="font-semibold">Generate Executive Summary</span>
                        <span className="text-xs font-normal mt-1">Let AI synthesize a high-level project summary.</span>
                    </Button>
                </div>
            </Card>

            <Card title="All Documents" description="Download markdown files for each completed phase and generated artifact.">
                <div className="space-y-3">
                    {allDocuments.length > 0 ? allDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{doc.name}</p>
                                    <Badge>{doc.type}</Badge>
                                    {doc.phaseName && <Badge className="ml-1">{doc.phaseName}</Badge>}
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" onClick={() => setViewingDocument(doc)}>
                                    <Eye className="mr-2 w-4 h-4" /> View
                                </Button>
                                <DownloadDropdown documentName={doc.name} documentContent={doc.content || ''} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No documents have been generated yet.</p>
                    )}
                </div>
            </Card>
            <DocumentViewerModal isOpen={!!viewingDocument} onClose={() => setViewingDocument(null)} document={viewingDocument} />
        </div>
    );
};