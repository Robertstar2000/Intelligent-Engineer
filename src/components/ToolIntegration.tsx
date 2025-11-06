import React, { useState, useEffect } from 'react';
import { ChevronsRight, LoaderCircle, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Eye, Share2, CircuitBoard, Film, Image as ImageIcon, Printer, Code2, FlaskConical } from 'lucide-react';
import { Project, Sprint, ToastMessage, MetaDocument } from '../types';
import { Button, Card, Badge } from './ui';
import { generateStandardVisualAsset, generateAdvancedAsset } from '../services/geminiService';

declare const Prism: any;

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

type AgentStatus = 'idle' | 'orchestrating' | 'generating' | 'generating-video' | 'qa' | 'complete' | 'error';
type StandardToolType = 'wireframe' | 'diagram' | 'schematic';
type AdvancedToolType = 'pwb-layout-svg' | '3d-image-veo' | '2d-image' | '3d-printing-file' | 'software-code' | 'chemical-formula';

export const ToolIntegration: React.FC<ToolIntegrationProps> = ({ sprint, project, onUpdateProject, setToast }) => {
    const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
    const [error, setError] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const generatedAsset = project.metaDocuments?.find(doc => doc.id === sprint.generatedDocId);
    
    useEffect(() => {
        if (generatedAsset?.type === 'software-code') {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [generatedAsset]);

    const handleGenerate = async (toolType: StandardToolType | AdvancedToolType) => {
        if (!project || !sprint.output) {
            setToast({ message: 'Please generate and accept the sprint specification before creating visual assets.', type: 'error'});
            return;
        }

        if (toolType === '3d-image-veo') {
            if (typeof window.aistudio === 'undefined' || typeof window.aistudio.hasSelectedApiKey !== 'function') {
                setToast({ message: 'VEO functionality is not available in this environment.', type: 'error' });
                return;
            }
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
        
        setAgentStatus('orchestrating');
        setError('');
        
        try {
            let asset: { content: string; docName: string };
            const standardTools: StandardToolType[] = ['wireframe', 'diagram', 'schematic'];
            
            if (standardTools.includes(toolType as StandardToolType)) {
                 asset = await generateStandardVisualAsset(project, sprint, toolType as StandardToolType);
            } else {
                if (toolType === '3d-image-veo') setAgentStatus('generating-video');
                asset = await generateAdvancedAsset(project, sprint, toolType as AdvancedToolType);
            }

            setAgentStatus('qa');
            await new Promise(res => setTimeout(res, 1000));

            const newDoc: MetaDocument = {
                id: `meta-asset-${Date.now()}`,
                name: asset.docName,
                content: asset.content,
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
            setToast({ message: `${asset.docName} generated successfully!`, type: 'success' });
        } catch (err: any) {
            setError(err.message || `Failed to generate asset.`);
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
        const statusMap: { [key in AgentStatus]?: { icon: React.ReactNode; text: string } } = {
            orchestrating: { icon: <LoaderCircle className="animate-spin" />, text: 'Orchestrator: Crafting prompt...' },
            generating: { icon: <LoaderCircle className="animate-spin" />, text: 'Doer: Generating asset...' },
            'generating-video': { icon: <LoaderCircle className="animate-spin" />, text: 'VEO: Generating video (this may take a few minutes)...' },
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

    const renderGeneratedAsset = () => {
        if (!generatedAsset) return null;
        
        const content = (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-charcoal-900/50 border dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
                {['wireframe', 'schematic', 'diagram', '2d-image', 'pwb-layout-svg', 'chemical-formula'].includes(generatedAsset.type) && (
                    <img src={generatedAsset.content} alt={generatedAsset.name} className="rounded-md w-full object-contain"/>
                )}
                {generatedAsset.type === '3d-image-veo' && (
                    <video src={`${generatedAsset.content}&key=${process.env.API_KEY}`} controls className="rounded-md w-full"/>
                )}
                {generatedAsset.type === 'software-code' && (
                    <pre><code className="language-javascript">{generatedAsset.content}</code></pre>
                )}
                {generatedAsset.type === '3d-printing-file' && (
                    <div className="text-center p-4">
                        <Printer className="w-8 h-8 mx-auto text-gray-400"/>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">3D Print file (.stl) generated. Preview not available.</p>
                    </div>
                )}
            </div>
        );

        return (
            <div className="space-y-3">
                <p className="text-sm">Generated Asset: <span className="font-semibold">{generatedAsset.name}</span></p>
                {content}
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
        );
    };

    const DISCIPLINE_TOOL_MAPPING: { [key: string]: string[] } = {
        'Software Engineering': ['diagram', 'software-code'],
        'Mechanical Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Aerospace Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Civil Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Electrical Engineering': ['diagram', 'schematic', 'pwb-layout-svg', '2d-image'],
        'Biomedical Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file', 'chemical-formula'],
        'Chemical Engineering': ['chemical-formula', 'diagram', '3d-image-veo', '2d-image'],
        'Environmental Engineering': ['chemical-formula', 'diagram', '3d-image-veo', '2d-image'],
        'Robotics Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file'],
        'Systems Engineering': ['diagram', 'software-code'],
        'Materials Engineering': ['chemical-formula', 'diagram', '3d-image-veo', '2d-image'],
        'Agricultural Engineering': ['diagram', 'wireframe', '3d-image-veo', '2d-image', '3d-printing-file', 'chemical-formula']
    };
    
    const getVisibleTools = (disciplines: string[]): Set<string> => {
        if (!disciplines || disciplines.length === 0) {
            return new Set(['diagram', 'wireframe', 'schematic', 'pwb-layout-svg', '3d-image-veo', '2d-image', '3d-printing-file', 'software-code', 'chemical-formula']);
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
            return new Set(['diagram', 'wireframe', 'schematic', 'pwb-layout-svg', '3d-image-veo', '2d-image', '3d-printing-file', 'software-code', 'chemical-formula']);
        }
        return visibleTools;
    };
    
    const visibleTools = getVisibleTools(project.disciplines);

    return (
        <div className="mt-4 pt-4 border-t dark:border-charcoal-700">
             <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">AI Toolkit</h5>
             {generatedAsset ? renderGeneratedAsset() : agentStatus !== 'idle' ? (
                <div className="space-y-2">
                    <AgentStatusDisplay />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                     {visibleTools.has('wireframe') && <Button size="sm" variant="outline" onClick={() => handleGenerate('wireframe')} disabled={agentStatus !== 'idle'}><Sparkles className="w-4 h-4 mr-2"/>3D Wireframe</Button>}
                     {visibleTools.has('diagram') && <Button size="sm" variant="outline" onClick={() => handleGenerate('diagram')} disabled={agentStatus !== 'idle'}><Sparkles className="w-4 h-4 mr-2"/>Block Diagram</Button>}
                     {visibleTools.has('schematic') && <Button size="sm" variant="outline" onClick={() => handleGenerate('schematic')} disabled={agentStatus !== 'idle'}><Sparkles className="w-4 h-4 mr-2"/>Schematic</Button>}
                     {visibleTools.has('pwb-layout-svg') && <Button size="sm" variant="outline" onClick={() => handleGenerate('pwb-layout-svg')} disabled={agentStatus !== 'idle'}><CircuitBoard className="w-4 h-4 mr-2"/>PWB Layout (SVG)</Button>}
                     {visibleTools.has('3d-image-veo') && <Button size="sm" variant="outline" onClick={() => handleGenerate('3d-image-veo')} disabled={agentStatus !== 'idle'}><Film className="w-4 h-4 mr-2"/>3D Video (VEO)</Button>}
                     {visibleTools.has('2d-image') && <Button size="sm" variant="outline" onClick={() => handleGenerate('2d-image')} disabled={agentStatus !== 'idle'}><ImageIcon className="w-4 h-4 mr-2"/>2D Image</Button>}
                     {visibleTools.has('3d-printing-file') && <Button size="sm" variant="outline" onClick={() => handleGenerate('3d-printing-file')} disabled={agentStatus !== 'idle'}><Printer className="w-4 h-4 mr-2"/>3D Print File (STL)</Button>}
                     {visibleTools.has('software-code') && <Button size="sm" variant="outline" onClick={() => handleGenerate('software-code')} disabled={agentStatus !== 'idle'}><Code2 className="w-4 h-4 mr-2"/>Software Code</Button>}
                     {visibleTools.has('chemical-formula') && <Button size="sm" variant="outline" onClick={() => handleGenerate('chemical-formula')} disabled={agentStatus !== 'idle'}><FlaskConical className="w-4 h-4 mr-2"/>Chemical Formula</Button>}
                </div>
             )}
        </div>
    );
};