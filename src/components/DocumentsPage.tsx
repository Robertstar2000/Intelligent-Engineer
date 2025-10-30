import React, { useState, useEffect } from 'react';
import { Home, Download, FileText, Package, BrainCircuit, Bot, FileSignature, LoaderCircle, ChevronDown, Edit3, Save, Image as ImageIcon, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { Project, Phase, ToastMessage, MetaDocument, Message } from '../types';
import { generateVibePrompt as generateVibePromptFromService, generateProjectSummary } from '../services/geminiService';
import { Remarkable } from 'remarkable';
import { MarkdownEditor } from './MarkdownEditor';


declare const JSZip: any;
declare const Prism: any;

const md = new Remarkable({
    html: true, typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try { return Prism.highlight(str, Prism.languages[lang], lang); } catch (e) { console.error(e) }
        }
        return '';
    },
});

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9_.]/gi, '_').toLowerCase();

const downloadFile = (filename: string, content: string, mimeType: string) => {
    const a = document.createElement('a');
    a.href = content;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const DocumentEditorModal = ({ isOpen, onClose, document, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    
    const isVisualAsset = document && ['diagram', 'wireframe', 'schematic'].includes(document.type);
    const isReadOnly = document && document.type === 'Chat Log';

    useEffect(() => {
        if (isOpen && document) {
            setEditedContent(document.content || '');
            setIsEditing(false); // Reset to view mode when opened
        }
    }, [isOpen, document]);

    useEffect(() => {
        if (isOpen && !isEditing && document?.content && !isVisualAsset) {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isOpen, isEditing, document, isVisualAsset]);
    
    if (!isOpen || !document) return null;

    const handleSave = () => {
        onSave(document.id, editedContent);
        setIsEditing(false);
    };

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
                    <div className="flex items-center space-x-2">
                        {!isVisualAsset && !isReadOnly && (
                            isEditing ? (
                                <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Edit3 className="w-4 h-4 mr-2" />Edit</Button>
                            )
                        )}
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                {isVisualAsset ? (
                    <div className="p-4 flex-grow flex items-center justify-center bg-gray-100 dark:bg-charcoal-900/50">
                        <img src={document.content} alt={document.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg"/>
                    </div>
                ) : isEditing ? (
                    <div className="p-1 flex-grow">
                         <MarkdownEditor value={editedContent} onChange={setEditedContent} />
                    </div>
                ) : (
                    <div 
                        className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: md.render(document.content || '') }}
                    />
                )}
            </Card>
        </div>
    );
};


const DownloadDropdown = ({ documentName, documentContent, documentType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isVisualAsset = ['Diagram', '3D Wireframe', 'Schematic'].includes(documentType);

    const handleDownload = (format: 'md' | 'txt' | 'doc' | 'pdf' | 'png') => {
        if (isVisualAsset) {
            downloadFile(`${sanitizeFilename(documentName)}.png`, documentContent, 'image/png');
        } else {
             const filename = `${sanitizeFilename(documentName)}.${format}`;
            
            if (format === 'pdf') {
                const htmlContent = md.render(documentContent);
                const printWindow = window.open('', '_blank');
                if (!printWindow) return;
                printWindow.document.write(`
                    <html><head><title>Print - ${documentName}</title>
                    <style>
                        body { font-family: sans-serif; line-height: 1.6; }
                        pre, code { white-space: pre-wrap; word-wrap: break-word; background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
                        .prose { max-width: 800px; margin: 0 auto; }
                    </style>
                    </head><body><div class="prose">${htmlContent}</div></body></html>`);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            } else {
                 let blob;
                if(format === 'doc') {
                    const htmlContent = md.render(documentContent);
                    const docContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentName}</title></head><body>${htmlContent}</body></html>`;
                    blob = new Blob([docContent], { type: 'application/msword' });
                } else {
                    blob = new Blob([documentContent], { type: 'text/markdown' });
                }
                downloadFile(filename, URL.createObjectURL(blob), blob.type);
            }
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
                        {isVisualAsset ? (
                             <button onClick={() => handleDownload('png')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Image (.png)</button>
                        ) : (
                            <>
                                <button onClick={() => handleDownload('md')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Markdown (.md)</button>
                                <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Plain Text (.txt)</button>
                                <button onClick={() => handleDownload('doc')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">Word (.doc)</button>
                                <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700">PDF</button>
                            </>
                        )}
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
    const [editingDocument, setEditingDocument] = useState<{ id: string; name: string; content: string; type: string; } | null>(null);

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
            
            for (const doc of (project.metaDocuments || [])) {
                const isVisualAsset = ['diagram', 'wireframe', 'schematic'].includes(doc.type);
                if (isVisualAsset) {
                    const base64Data = doc.content.split(',')[1];
                    projectFolder.file(sanitizeFilename(doc.name) + '.png', base64Data, { base64: true });
                } else {
                    projectFolder.file(sanitizeFilename(doc.name) + '.md', doc.content);
                }
            }

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
            const blob = new Blob([newDoc.content], { type: 'text/markdown' });
            downloadFile(`${sanitizeFilename(newDoc.name)}.md`, URL.createObjectURL(blob), 'text/markdown');
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

    const handleUpdateDocumentContent = (docId: string, newContent: string) => {
        if (!project) return;

        const [type, ...rest] = docId.split('-');
        const id = rest.join('-');

        let updatedProject = { ...project };

        if (type === 'meta') {
            updatedProject.metaDocuments = (updatedProject.metaDocuments || []).map(d =>
                d.id === docId ? { ...d, content: newContent } : d
            );
        } else {
            updatedProject.phases = project.phases.map(phase => {
                if (type === 'phase' && phase.id === id) {
                    return { ...phase, output: newContent };
                }
                 if (docId.startsWith('chat-phase-') && phase.id === id) {
                    setToast({ message: "Chat logs are read-only.", type: "info" });
                    return phase;
                }
                
                const sprintIndex = phase.sprints.findIndex(s => s.id === id);
                if (type === 'sprint' && sprintIndex > -1) {
                    const updatedSprints = [...phase.sprints];
                    updatedSprints[sprintIndex] = { ...updatedSprints[sprintIndex], output: newContent };
                    return { ...phase, sprints: updatedSprints };
                }
                 if (docId.startsWith('chat-sprint-') && sprintIndex > -1) {
                    setToast({ message: "Chat logs are read-only.", type: "info" });
                    return phase;
                }

                return phase;
            });
        }
        updateProject(updatedProject);
        setToast({ message: 'Document updated successfully!', type: 'success' });
        setEditingDocument(prev => prev ? {...prev, content: newContent } : null);
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
        const typeMap = {
            'executive-summary': 'Summary',
            'code-vibe-prompt': 'Vibe Prompt',
            'simulation-vibe-prompt': 'Vibe Prompt',
            'diagram': 'Diagram',
            'wireframe': '3D Wireframe',
            'schematic': 'Schematic',
        };
        allDocuments.push({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            type: typeMap[doc.type] || doc.type,
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
                        {isLoading === 'zip' ? <LoaderCircle className="w-6 h-6 mb-2 animate-spin"/> : <Package className="w-6 h-6 mb-2" />}
                        <span className="font-semibold">Download All as .zip</span>
                        <span className="text-xs font-normal mt-1">A complete, structured archive of all documents.</span>
                    </Button>
                    <Button onClick={() => handleVibePrompt('code')} disabled={!!isLoading} variant="outline" className={`flex-col h-auto py-4 ${hasCodeVibePrompt ? 'border-brand-primary bg-brand-primary/10' : ''}`}>
                        {isLoading === 'code' ? <LoaderCircle className="w-6 h-6 mb-2 animate-spin"/> : <BrainCircuit className="w-6 h-6 mb-2" />}
                        <span className="font-semibold">Generate Code Vibe Prompt</span>
                        <span className="text-xs font-normal mt-1">Create a master prompt for an AI coding assistant.</span>
                    </Button>
                    <Button onClick={() => handleVibePrompt('simulation')} disabled={!!isLoading} variant="outline" className={`flex-col h-auto py-4 ${hasSimulationVibePrompt ? 'border-brand-primary bg-brand-primary/10' : ''}`}>
                        {isLoading === 'simulation' ? <LoaderCircle className="w-6 h-6 mb-2 animate-spin"/> : <Bot className="w-6 h-6 mb-2" />}
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

            <Card title="All Documents" description="View, edit, and download markdown files for each completed phase and generated artifact.">
                <div className="space-y-3">
                    {allDocuments.length > 0 ? allDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                            <div className="flex items-center space-x-3 min-w-0">
                                {['Diagram', '3D Wireframe', 'Schematic'].includes(doc.type) ? <ImageIcon className="w-5 h-5 text-brand-secondary flex-shrink-0" /> : <FileText className="w-5 h-5 text-brand-primary flex-shrink-0" />}
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{doc.name}</p>
                                    <Badge>{doc.type}</Badge>
                                    {doc.phaseName && <Badge className="ml-1">{doc.phaseName}</Badge>}
                                </div>
                            </div>
                             <div className="flex items-center space-x-2 flex-shrink-0">
                                <Button size="sm" variant="outline" onClick={() => setEditingDocument(doc)}>
                                    <Edit3 className="mr-2 w-4 h-4" /> View / Edit
                                </Button>
                                <DownloadDropdown documentName={doc.name} documentContent={doc.content || ''} documentType={doc.type} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No documents have been generated yet.</p>
                    )}
                </div>
            </Card>
            <DocumentEditorModal 
                isOpen={!!editingDocument} 
                onClose={() => setEditingDocument(null)} 
                document={editingDocument}
                onSave={handleUpdateDocumentContent}
             />
        </div>
    );
};