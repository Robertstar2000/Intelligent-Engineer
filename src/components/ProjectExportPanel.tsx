import React, { useState } from 'react';
import { Share2, LoaderCircle, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { ToastMessage } from '../types';
import { EXTERNAL_TOOLS, runProjectExportWorkflow, ExportWorkflowProgress } from '../services/geminiService';

const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

type AgentStatus = 'idle' | 'orchestrating' | 'doing' | 'qa' | 'complete' | 'error';

export const ProjectExportPanel = ({ setToast }: { setToast: (toast: ToastMessage | null) => void }) => {
    const { project } = useProject();
    const [selectedTool, setSelectedTool] = useState('');
    const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [generatedFile, setGeneratedFile] = useState<{ fileName: string; fileContent: string } | null>(null);

    const handleExport = async () => {
        if (!selectedTool || !project) {
            setToast({ message: 'Please select a tool to export to.', type: 'error' });
            return;
        }

        setAgentStatus('orchestrating');
        setLog(['Project-wide export workflow initiated...']);
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
            setToast({ message: `Successfully generated export file for ${EXTERNAL_TOOLS.find(t => t.id === selectedTool)?.name}.`, type: 'success' });
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during the export workflow.');
            setAgentStatus('error');
        }
    };

    const reset = () => {
        setAgentStatus('idle');
        setSelectedTool('');
        setLog([]);
        setError('');
        setGeneratedFile(null);
    };

    const renderContent = () => {
        if (agentStatus === 'idle') {
            return (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select a compatible tool to generate an export file containing all relevant project design data.</p>
                    <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600">
                        <option value="" disabled>Select an external application...</option>
                        {EXTERNAL_TOOLS.map(tool => <option key={tool.id} value={tool.id}>{tool.name} ({tool.category})</option>)}
                    </select>
                    <Button onClick={handleExport} disabled={!selectedTool} className="w-full">
                        <Share2 className="w-4 h-4 mr-2" /> Generate Project Export
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-charcoal-900/50 rounded-md">
                    {agentStatus !== 'complete' && agentStatus !== 'error' && <LoaderCircle className="w-4 h-4 text-brand-primary animate-spin" />}
                    {agentStatus === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {agentStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-semibold capitalize">{agentStatus}...</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 max-h-40 overflow-y-auto space-y-1 p-2 border rounded-md dark:border-charcoal-700">
                    {log.map((l, i) => <p key={i}>- {l}</p>)}
                </div>

                {agentStatus === 'complete' && generatedFile && (
                    <div className="text-center space-y-3 pt-2">
                        <p className="text-sm">File <code className="bg-gray-200 dark:bg-charcoal-900 p-1 rounded-sm">{generatedFile.fileName}</code> is ready.</p>
                        <div className="flex justify-center space-x-2">
                            <Button variant="outline" onClick={reset}>Done</Button>
                            <Button onClick={() => downloadFile(generatedFile.fileName, generatedFile.fileContent)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                        </div>
                    </div>
                )}
                {agentStatus === 'error' && (
                     <div className="text-center space-y-3 pt-2">
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded-md">{error}</p>
                        <Button variant="outline" onClick={reset}>Reset</Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card title="Project Export Tool" description="Unlocked after Preliminary Design completion.">
            {renderContent()}
        </Card>
    );
};