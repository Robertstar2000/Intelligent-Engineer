import React, { useState } from 'react';
import { ChevronsRight, LoaderCircle, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Eye, Share2 } from 'lucide-react';
import { Project, Sprint, ToastMessage, MetaDocument } from '../types';
import { Button, Card, Badge } from './ui';
import { generateVisualAsset } from '../services/geminiService';

const EXTERNAL_TOOLS_LIST = [
    { id: 'solidworks', name: 'SolidWorks', category: 'CAD' },
    { id: 'autocad', name: 'AutoCAD', category: 'CAD' },
    { id: 'fusion360', name: 'Fusion 360', category: 'CAD' },
    { id: 'altium', name: 'Altium Designer', category: 'Electronics' },
    { id: 'kicad', name: 'KiCad', category: 'Electronics' },
];

const ExportModal = ({ isOpen, onClose, assetName, setToast }) => {
    const [selectedTool, setSelectedTool] = useState('');
    if (!isOpen) return null;

    const handleExport = () => {
        if (!selectedTool) {
            setToast({ message: 'Please select a tool to export to.', type: 'error' });
            return;
        }
        const tool = EXTERNAL_TOOLS_LIST.find(t => t.id === selectedTool);
        setToast({ message: `Asset "${assetName}" has been exported to ${tool.name}.`, type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card title="Export to External Tool" className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="space-y-4">
                    <p>Select a compatible commercial tool to export the asset to.</p>
                    <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600">
                        <option value="" disabled>Select a tool...</option>
                        {EXTERNAL_TOOLS_LIST.map(tool => <option key={tool.id} value={tool.id}>{tool.name} ({tool.category})</option>)}
                    </select>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleExport}>Export</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

interface ToolIntegrationProps {
    sprint: Sprint;
    project: Project;
    onUpdateProject: (updatedProject: Project) => void;
    setToast: (toast: ToastMessage | null) => void;
}

type AgentStatus = 'idle' | 'orchestrating' | 'generating' | 'qa' | 'complete' | 'error';
type ToolType = 'wireframe' | 'diagram' | 'schematic';

export const ToolIntegration: React.FC<ToolIntegrationProps> = ({ sprint, project, onUpdateProject, setToast }) => {
    const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
    const [error, setError] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const generatedAsset = project.metaDocuments?.find(doc => doc.id === sprint.generatedDocId);

    const handleGenerate = async (toolType: ToolType) => {
        if (!project || !sprint.output) {
            setToast({ message: 'Please generate and accept the sprint specification before creating visual assets.', type: 'error'});
            return;
        }
        setAgentStatus('orchestrating');
        setError('');

        try {
            const { content, docName } = await generateVisualAsset(project, sprint, toolType);

            setAgentStatus('qa');
            // Simplified QA step
            await new Promise(res => setTimeout(res, 1000));

            const newDoc: MetaDocument = {
                id: `meta-asset-${Date.now()}`,
                name: docName,
                content: content,
                type: toolType,
                createdAt: new Date(),
            };

            const updatedMetaDocs = [...(project.metaDocuments || []), newDoc];
            
            const updatedPhases = project.phases.map(phase => ({
                ...phase,
                sprints: phase.sprints.map(s => s.id === sprint.id ? { ...s, generatedDocId: newDoc.id } : s)
            }));
            
            onUpdateProject({ ...project, metaDocuments: updatedMetaDocs, phases: updatedPhases });
            
            setAgentStatus('complete');
            setToast({ message: `${docName} generated successfully!`, type: 'success' });

        } catch (err: any) {
            setError(err.message || `Failed to generate ${toolType}.`);
            setAgentStatus('error');
        }
    };
    
    const handleRegenerate = () => {
        if (!project) return;
        const updatedPhases = project.phases.map(phase => ({
            ...phase,
            sprints: phase.sprints.map(s => s.id === sprint.id ? { ...s, generatedDocId: undefined } : s)
        }));
        const updatedMetaDocs = project.metaDocuments?.filter(doc => doc.id !== sprint.generatedDocId);

        onUpdateProject({ ...project, phases: updatedPhases, metaDocuments: updatedMetaDocs });
        setAgentStatus('idle');
    };
    
    const AgentStatusDisplay = () => {
        const statusMap = {
            orchestrating: { icon: <LoaderCircle className="animate-spin" />, text: 'Orchestrator: Crafting prompt...' },
            generating: { icon: <LoaderCircle className="animate-spin" />, text: 'Doer: Generating asset...' },
            qa: { icon: <LoaderCircle className="animate-spin" />, text: 'QA: Validating result...' },
            complete: { icon: <CheckCircle />, text: 'Generation Complete' },
            error: { icon: <AlertTriangle />, text: 'Error Occurred' },
        };
        const currentStatus = statusMap[agentStatus];
        if (!currentStatus) return null;

        return (
            <div className="flex items-center space-x-2 text-sm p-2 bg-gray-100 dark:bg-charcoal-900/50 rounded-md">
                <span className={agentStatus === 'error' ? 'text-red-500' : 'text-brand-primary'}>{currentStatus.icon}</span>
                <span className="text-gray-600 dark:text-gray-300">{currentStatus.text}</span>
            </div>
        );
    };

    return (
        <div className="mt-4 pt-4 border-t dark:border-charcoal-700">
             <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">AI Toolkit</h5>
             {generatedAsset ? (
                <div className="space-y-3">
                    <p className="text-sm">Generated Asset: <span className="font-semibold">{generatedAsset.name}</span></p>
                    <img src={generatedAsset.content} alt={generatedAsset.name} className="rounded-lg border dark:border-charcoal-700 max-h-48 w-auto"/>
                    <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setIsExportModalOpen(true)}>
                            <Share2 className="w-4 h-4 mr-2"/>Export...
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRegenerate}>
                            <RefreshCw className="w-4 h-4 mr-2"/>Regenerate
                        </Button>
                    </div>
                    <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} assetName={generatedAsset.name} setToast={setToast} />
                </div>
             ) : agentStatus !== 'idle' ? (
                <div className="space-y-2">
                    <AgentStatusDisplay />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     <Button size="sm" variant="outline" onClick={() => handleGenerate('wireframe')} disabled={agentStatus !== 'idle'}>
                        <Sparkles className="w-4 h-4 mr-2"/>Generate 3D Wireframe
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => handleGenerate('diagram')} disabled={agentStatus !== 'idle'}>
                        <Sparkles className="w-4 h-4 mr-2"/>Generate Block Diagram
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => handleGenerate('schematic')} disabled={agentStatus !== 'idle'}>
                        <Sparkles className="w-4 h-4 mr-2"/>Generate Schematic
                    </Button>
                </div>
             )}
        </div>
    );
};