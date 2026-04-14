

import React, { useState, useEffect } from 'react';
import { ChevronsRight, LoaderCircle, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Eye, Share2, CircuitBoard, Film, Image as ImageIcon, Printer, Code2, FlaskConical, Download, Check, X } from 'lucide-react';
import { Project, Sprint, Phase, ToastMessage, MetaDocument } from '../types';
import { Button, Card, Badge } from './ui';
// Fix: Added runProjectExportWorkflow to imports
import { EXTERNAL_TOOLS, runIntegrationExportWorkflow, runProjectExportWorkflow, ExportWorkflowProgress } from '../services/geminiService';

const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

type AgentStatus = 'idle' | 'orchestrating' | 'doing' | 'qa' | 'complete' | 'error';

const ExportModal = ({ isOpen, onClose, asset, project, setToast }) => {
    const [selectedTool, setSelectedTool] = useState('');
    const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [generatedFile, setGeneratedFile] = useState<{ fileName: string; fileContent: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setAgentStatus('idle');
            setLog([]);
            setError('');
            setGeneratedFile(null);
            setSelectedTool('');
        }
    }, [isOpen]);

    const handleExport = async () => {
        if (!selectedTool || !project || !asset) {
            setToast({ message: 'Please select a tool to export to.', type: 'error' });
            return;
        }

        setAgentStatus('orchestrating');
        setLog(['Workflow initiated...']);
        setError('');
        setGeneratedFile(null);

        try {
            const result = await runProjectExportWorkflow(
                project,
                selectedTool,
                (progress: ExportWorkflowProgress) => {
                    setAgentStatus(progress.status);
                    setLog(prev => [...prev, progress.log]);
                }
            );
            setGeneratedFile(result);
            setAgentStatus('complete');
            setToast({ message: `Successfully generated file for ${EXTERNAL_TOOLS.find(t => t.id === selectedTool)?.name}.`, type: 'success' });
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during the export workflow.');
            setAgentStatus('error');
        }
    };
    
    if (!isOpen) return null;

    const renderContent = () => {
        switch (agentStatus) {
            case 'idle':
                return (
                    <div className="space-y-4">
                        <p>Select a compatible commercial tool to generate an export file for the asset: <strong>{asset.name}</strong>.</p>
                        <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600">
                            <option value="" disabled>Select a tool...</option>
                            {EXTERNAL_TOOLS.map(tool => <option key={tool.id} value={tool.id}>{tool.name} ({tool.category})</option>)}
                        </select>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleExport} disabled={!selectedTool}>Generate Export</Button>
                        </div>
                    </div>
                );
            case 'orchestrating':
            case 'doing':
            case 'qa':
                return (
                    <div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-charcoal-900/50 rounded-md">
                            <LoaderCircle className="w-4 h-4 text-brand-primary animate-spin" />
                            <span className="text-sm font-semibold capitalize">{agentStatus}...</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-h-40 overflow-y-auto space-y-1">
                            {log.map((l, i) => <p key={i}>- {l}</p>)}
                        </div>
                    </div>
                );
            case 'complete':
                return (
                    <div className="text-center space-y-3">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <h3 className="font-semibold">Export File Generated!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your file <code className="bg-gray-200 dark:bg-charcoal-900 p-1 rounded-sm">{generatedFile?.fileName}</code> is ready for download.</p>
                        <div className="flex justify-center space-x-2 pt-2">
                             <Button variant="outline" onClick={onClose}>Close</Button>
                             <Button onClick={() => downloadFile(generatedFile.fileName, generatedFile.fileContent)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                             </Button>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center space-y-3">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                        <h3 className="font-semibold">An Error Occurred</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded-md">{error}</p>
                         <div className="flex justify-center space-x-2 pt-2">
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button onClick={() => setAgentStatus('idle')}>Try Again</Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} noPadding>
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <h2 className="text-xl font-bold">Agentic Asset Export</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </Card>
        </div>
    );
};


interface ToolIntegrationProps {
    sprint?: Sprint;
    phase?: Phase;
    project: Project;
    onUpdateProject: (updatedProject: Project) => void;
    onToggleAssetType: (type: string) => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const ToolIntegration: React.FC<ToolIntegrationProps> = ({ sprint, phase, project, onUpdateProject, onToggleAssetType, setToast }) => {
    const activeAssetTypes = sprint?.activeAssetTypes || phase?.activeAssetTypes || [];
    const parentId = sprint?.id || phase?.id;

    // Filter relevant generated assets for this specific phase/sprint
    const generatedAssets = project.metaDocuments?.filter(doc => doc.parentEntityId === parentId) || [];

    const DISCIPLINE_TOOL_MAPPING: { [key: string]: string[] } = {
        'Software Engineering': ['diagram', 'flowchart', 'software-code'],
        'Mechanical Engineering': ['diagram', 'wireframe', 'assembly-diagram', 'exploded-view', 'cross-section', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Aerospace Engineering': ['diagram', 'wireframe', 'assembly-diagram', 'exploded-view', 'cross-section', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Civil Engineering': ['diagram', 'wireframe', 'assembly-diagram', 'exploded-view', 'cross-section', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Electrical Engineering': ['diagram', 'schematic', 'assembly-diagram', 'pwb-layout-svg', '2d-image'],
        'Biomedical Engineering': ['diagram', 'wireframe', 'assembly-diagram', 'exploded-view', '3d-image-veo', '2d-image', '3d-printing-file', 'chemical-formula'],
        'Chemical Engineering': ['chemical-formula', 'diagram', 'flowchart', '3d-image-veo', '2d-image'],
        'Environmental Engineering': ['chemical-formula', 'diagram', 'flowchart', '3d-image-veo', '2d-image'],
        'Robotics Engineering': ['diagram', 'wireframe', 'assembly-diagram', 'exploded-view', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Systems Engineering': ['diagram', 'flowchart', 'software-code'],
        'Materials Engineering': ['chemical-formula', 'diagram', '3d-image-veo', '2d-image'],
        'Agricultural Engineering': ['diagram', 'wireframe', 'assembly-diagram', '3d-image-veo', '2d-image', '3d-printing-file', 'chemical-formula']
    };
    
    const getVisibleTools = (disciplines: string[]): Set<string> => {
        if (!disciplines || disciplines.length === 0) {
            return new Set(['diagram', 'wireframe', 'schematic', 'assembly-diagram', 'exploded-view', 'cross-section', 'flowchart', 'pwb-layout-svg', '3d-image-veo', '2d-image', '3d-printing-file', 'software-code', 'chemical-formula']);
        }

        const visibleTools = new Set<string>();
        const mappingKeys = Object.keys(DISCIPLINE_TOOL_MAPPING);

        disciplines.forEach(discipline => {
            const key = mappingKeys.find(k => discipline.startsWith(k));
            if (key) {
                DISCIPLINE_TOOL_MAPPING[key].forEach(tool => visibleTools.add(tool));
            }
        });

        if (visibleTools.size === 0) {
            return new Set(['diagram', 'wireframe', 'schematic', 'assembly-diagram', 'exploded-view', 'cross-section', 'flowchart', 'pwb-layout-svg', '3d-image-veo', '2d-image', '3d-printing-file', 'software-code', 'chemical-formula']);
        }
        return visibleTools;
    };
    
    const visibleTools = getVisibleTools(project.disciplines);

    const toolDefinitions = [
        { type: 'wireframe', label: '3D Wireframe', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'diagram', label: 'Block Diagram', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'schematic', label: 'Schematic', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'assembly-diagram', label: 'Assembly Diagram', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'exploded-view', label: 'Exploded View', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'cross-section', label: 'Cross-section', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'flowchart', label: 'Flowchart', icon: <Sparkles className="w-4 h-4 mr-2"/> },
        { type: 'pwb-layout-svg', label: 'PWB Layout (SVG)', icon: <CircuitBoard className="w-4 h-4 mr-2"/> },
        { type: '3d-image-veo', label: '3D Video (VEO)', icon: <Film className="w-4 h-4 mr-2"/> },
        { type: '2d-image', label: '2D Image', icon: <ImageIcon className="w-4 h-4 mr-2"/> },
        { type: '3d-printing-file', label: '3D Print File (STL)', icon: <Printer className="w-4 h-4 mr-2"/> },
        { type: 'software-code', label: 'Software Code', icon: <Code2 className="w-4 h-4 mr-2"/> },
        { type: 'chemical-formula', label: 'Chemical Formula', icon: <FlaskConical className="w-4 h-4 mr-2"/> },
    ];

    return (
        <div className="mt-4 pt-4 border-t dark:border-charcoal-700">
             <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">AI Visual Assets (Sync Selection)</h5>
             <p className="text-xs text-gray-500 mb-3">Select which diagrams to keep in sync. They will auto-regenerate when text is updated.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                 {toolDefinitions.filter(t => visibleTools.has(t.type)).map(tool => {
                     const isActive = activeAssetTypes.includes(tool.type);
                     const hasGenerated = generatedAssets.some(a => a.type === tool.type);
                     return (
                         <Button 
                             key={tool.type} 
                             size="sm" 
                             variant={isActive ? 'primary' : 'outline'} 
                             onClick={() => onToggleAssetType(tool.type)}
                             className="relative"
                         >
                             {isActive && <Check className="w-3 h-3 absolute top-1 right-1" />}
                             {tool.icon} {tool.label}
                         </Button>
                     );
                 })}
             </div>
             
             {generatedAssets.length > 0 && (
                 <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">Available Visual Assets:</p>
                    {generatedAssets.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-charcoal-900/50 rounded-lg text-sm">
                            <span className="truncate">{asset.name}</span>
                            <div className="flex space-x-2">
                                <Badge variant="info">{asset.type}</Badge>
                                <Button size="sm" variant="ghost" className="!p-1 h-auto" title="Download" onClick={() => {
                                     const a = document.createElement('a');
                                     a.href = asset.content;
                                     a.download = `${sanitizeFilename(asset.name)}`;
                                     document.body.appendChild(a);
                                     a.click();
                                     document.body.removeChild(a);
                                }}>
                                    <Download className="w-3 h-3"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                 </div>
             )}
        </div>
    );
};

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9_.]/gi, '_').toLowerCase();
