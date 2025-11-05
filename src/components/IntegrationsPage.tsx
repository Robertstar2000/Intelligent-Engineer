import React, { useState } from 'react';
import { ProjectHeader } from './ProjectHeader';
import { useProject } from '../context/ProjectContext';
import { Card, Button, Badge } from './ui';
import { GitMerge, Cpu, Slack, Users, BrainCircuit, LoaderCircle, Package, Monitor, CheckCircle, AlertTriangle } from 'lucide-react';
import { runResourceAnalysisWorkflow, ResourceWorkflowProgress } from '../services/geminiService';
import { Resource } from '../types';

interface IntegrationCardProps {
    icon: React.ReactNode;
    name: string;
    description: string;
}
const IntegrationCard: React.FC<IntegrationCardProps> = ({ icon, name, description }) => (
    <div className="bg-gray-50 dark:bg-charcoal-800/50 p-4 rounded-lg flex items-start space-x-4">
        <div className="text-2xl text-brand-primary">{icon}</div>
        <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <Button size="sm" variant="outline" disabled>Connect</Button>
    </div>
);

const integrations = {
    cad: [
        { name: 'SolidWorks', description: 'Mechanical CAD and CAE.' },
        { name: 'AutoCAD', description: '2D and 3D CAD software.' },
        { name: 'Fusion 360', description: 'Cloud-based CAD, CAM, CAE, and PCB software.' },
    ],
    electronics: [
        { name: 'Altium Designer', description: 'PCB and electronic design automation.' },
        { name: 'KiCad', description: 'Open-source electronics design automation suite.' },
    ],
    collaboration: [
        { name: 'Slack', description: 'Channel-based messaging platform.' },
        { name: 'Microsoft Teams', description: 'Hub for team collaboration in Office 365.' },
    ]
};

// State interface for the workflow
interface WorkflowState {
    isActive: boolean;
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error' | 'None';
    iteration: number;
    maxIterations: number;
    log: string[];
    foundResources: Resource[];
    error: string | null;
}

const initialState: WorkflowState = {
    isActive: false,
    currentAgent: 'None',
    iteration: 0,
    maxIterations: 25,
    log: [],
    foundResources: [],
    error: null,
};

const AgentStatusDisplay = ({ state }: { state: WorkflowState }) => {
    if (!state.isActive || state.currentAgent === 'Done' || state.currentAgent === 'Error') return null;

    const statusText = {
        Orchestrator: 'Orchestrator is identifying the next resource to find...',
        Doer: 'Doer is investigating and formulating a resource...',
        QA: 'QA is validating the potential resource...',
    };

    return (
        <div className="flex items-center space-x-2 text-sm p-2 bg-gray-100 dark:bg-charcoal-900/50 rounded-md my-4">
            <LoaderCircle className="w-4 h-4 text-brand-primary animate-spin" />
            <span className="text-gray-600 dark:text-gray-300">
                <strong>{state.currentAgent} (Iteration {state.iteration}/{state.maxIterations}):</strong> {statusText[state.currentAgent as keyof typeof statusText]}
            </span>
        </div>
    );
};

export const IntegrationsPage = ({ onBack }) => {
    const { project, theme, setTheme, updateProject } = useProject();
    const [workflowState, setWorkflowState] = useState<WorkflowState>(initialState);

    const handleAnalyze = async () => {
        if (!project) return;
        setWorkflowState({
            ...initialState,
            isActive: true,
            currentAgent: 'Orchestrator',
            iteration: 1,
            log: ['Resource analysis workflow initiated...']
        });

        try {
            const { finalResources, logDocument } = await runResourceAnalysisWorkflow(
                project,
                (progress: ResourceWorkflowProgress) => {
                    setWorkflowState(prevState => ({
                        ...prevState,
                        currentAgent: progress.currentAgent,
                        iteration: progress.iteration,
                        log: [...prevState.log, progress.logMessage],
                        foundResources: progress.newResource ? [...prevState.foundResources, progress.newResource] : prevState.foundResources,
                        error: progress.error || prevState.error,
                    }));
                }
            );

            updateProject({
                ...project,
                resources: finalResources,
                metaDocuments: [...(project.metaDocuments || []), logDocument]
            });
            
        } catch (err: any) {
             setWorkflowState(prevState => ({
                ...prevState,
                isActive: false,
                currentAgent: 'Error',
                error: err.message || "An unexpected error occurred during the workflow."
            }));
        }
    };
    
    const ResourceAnalysisPanel = () => {
        if (!workflowState.isActive) {
            return (
                <div className="space-y-6">
                    <Card title="AI-Identified Project Resources" description="Analyze your project documents to identify required software and equipment.">
                        <div className="p-4 text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Let an AI agent team analyze your project docs to create a list of necessary tools and hardware.</p>
                            <Button onClick={handleAnalyze}>
                                <BrainCircuit className="w-4 h-4 mr-2" /> Analyze for Resources
                            </Button>
                        </div>
                    </Card>
                    {project?.resources && project.resources.length > 0 && (
                        <Card title="Previously Identified Resources">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center"><Monitor className="w-4 h-4 mr-2 text-brand-secondary"/>Software</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {project.resources.filter(r => r.category === 'Software').map(r => <li key={r.id}>{r.name}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center"><Package className="w-4 h-4 mr-2 text-brand-secondary"/>Equipment</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {project.resources.filter(r => r.category === 'Equipment').map(r => <li key={r.id}>{r.name}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            );
        }

        return (
            <Card title="AI Resource Analysis in Progress..." description="An agentic team is analyzing your project.">
                <AgentStatusDisplay state={workflowState} />
                 <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    <h4 className="text-sm font-semibold">Approved Resources:</h4>
                    {workflowState.foundResources.length > 0 ? workflowState.foundResources.map(resource => (
                         <div key={resource.id} className="p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg animate-fade-in">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{resource.name}</h4>
                                <Badge className="ml-2">{resource.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Source/Vendor: {resource.source}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{resource.justification}</p>
                        </div>
                    )) : <p className="text-center text-sm text-gray-500 py-4">No resources approved yet...</p>}
                </div>

                {(workflowState.currentAgent === 'Done' || workflowState.error) && (
                     <div className={`mt-4 text-center p-4 rounded-lg ${workflowState.error ? 'bg-red-50 dark:bg-red-900/50' : 'bg-green-50 dark:bg-green-900/50'}`}>
                        {workflowState.error ? <AlertTriangle className="w-8 h-8 mx-auto text-red-500" /> : <CheckCircle className="w-8 h-8 mx-auto text-green-500" />}
                        <h4 className="font-semibold mt-2">{workflowState.error ? 'Workflow Error' : 'Workflow Complete'}</h4>
                        <p className="text-sm">
                            {workflowState.error ? workflowState.error : `${workflowState.foundResources.length} resources identified. See the full log in the Documents page.`}
                        </p>
                        <Button onClick={() => setWorkflowState(initialState)} variant="outline" size="sm" className="mt-2">
                            {workflowState.error ? 'Try Again' : 'Done'}
                        </Button>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <ProjectHeader
                onGoHome={onBack}
                theme={theme}
                setTheme={setTheme}
                showBackButton
            />
            <div className="mb-6">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations & Resources</h1>
                 <p className="text-gray-600 dark:text-gray-400 mt-1">Identify project resources and connect your favorite engineering tools.</p>
            </div>

            <div className="space-y-6">
                 <ResourceAnalysisPanel />
                <Card title="Available Integrations (Examples)" description="Connect your favorite engineering tools to streamline your workflow.">
                    <div className="space-y-3">
                        {integrations.cad.map(tool => <IntegrationCard key={tool.name} icon={<GitMerge />} name={tool.name} description={tool.description} />)}
                        {integrations.electronics.map(tool => <IntegrationCard key={tool.name} icon={<Cpu />} name={tool.name} description={tool.description} />)}
                        <IntegrationCard icon={<Slack />} name="Slack" description="Channel-based messaging platform." />
                        <IntegrationCard icon={<Users />} name="Microsoft Teams" description="Hub for team collaboration in Office 365." />
                    </div>
                </Card>
            </div>
        </div>
    );
};