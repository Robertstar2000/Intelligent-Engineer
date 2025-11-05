import React, { useState, useEffect } from 'react';
import { Activity, LoaderCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card, Badge } from './ui';
import { runRiskAssessmentWorkflow, RiskWorkflowProgress } from '../services/geminiService';
import { Risk } from '../types';

// State interface for the workflow
interface WorkflowState {
    isActive: boolean;
    currentAgent: 'Orchestrator' | 'Doer' | 'QA' | 'Done' | 'Error' | 'None';
    iteration: number;
    maxIterations: number;
    log: string[];
    foundRisks: Risk[];
    error: string | null;
}

const initialState: WorkflowState = {
    isActive: false,
    currentAgent: 'None',
    iteration: 0,
    maxIterations: 25,
    log: [],
    foundRisks: [],
    error: null,
};


export const RiskEnginePanel = () => {
    const { project, updateProject } = useProject();
    const [workflowState, setWorkflowState] = useState<WorkflowState>(initialState);
    
    useEffect(() => {
        setWorkflowState(initialState);
    }, [project?.id]);

    const handleAssessRisks = async () => {
        if (!project) return;
        
        setWorkflowState({
            ...initialState,
            isActive: true,
            currentAgent: 'Orchestrator',
            iteration: 1,
            log: ['Workflow initiated...']
        });

        try {
            const { finalRisks, logDocument } = await runRiskAssessmentWorkflow(
                project,
                (progress: RiskWorkflowProgress) => {
                    setWorkflowState(prevState => ({
                        ...prevState,
                        currentAgent: progress.currentAgent,
                        iteration: progress.iteration,
                        log: [...prevState.log, progress.logMessage],
                        foundRisks: progress.newRisk ? [...prevState.foundRisks, progress.newRisk] : prevState.foundRisks,
                        error: progress.error || prevState.error,
                    }));
                }
            );

            updateProject({
                ...project,
                risks: finalRisks,
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

    const getSeverityBadge = (severity: Risk['severity']) => {
        switch (severity) {
            case 'Critical': return <Badge variant="danger">{severity}</Badge>;
            case 'High': return <Badge variant="warning">{severity}</Badge>;
            case 'Medium': return <Badge variant="info">{severity}</Badge>;
            case 'Low': return <Badge variant="success">{severity}</Badge>;
            default: return <Badge>{severity}</Badge>;
        }
    };
    
    const AgentStatusDisplay = () => {
        if (!workflowState.isActive || workflowState.currentAgent === 'Done' || workflowState.currentAgent === 'Error') return null;

        const statusText = {
            Orchestrator: 'Orchestrator is identifying the next concern...',
            Doer: 'Doer is investigating and formulating a risk...',
            QA: 'QA is validating the potential risk...',
        };
        
        return (
            <div className="flex items-center space-x-2 text-sm p-2 bg-gray-100 dark:bg-charcoal-900/50 rounded-md my-4">
                <LoaderCircle className="w-4 h-4 text-brand-primary animate-spin" />
                <span className="text-gray-600 dark:text-gray-300">
                    <strong>{workflowState.currentAgent} (Iteration {workflowState.iteration}/{workflowState.maxIterations}):</strong> {statusText[workflowState.currentAgent as keyof typeof statusText]}
                </span>
            </div>
        );
    };

    if (!workflowState.isActive) {
        return (
            <div>
                 <Card title="AI Risk Assessment" description="An agentic team identifies potential project risks based on all available documentation.">
                    <div className="text-center py-4">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click to start the AI agent workflow to identify or update project risks.</p>
                        <Button onClick={handleAssessRisks}>
                            <Activity className="mr-2 w-4 h-4" /> Assess Project Risks with Agents
                        </Button>
                    </div>
                </Card>
                {project?.risks && project.risks.length > 0 && (
                    <Card title="Previously Assessed Risks" className="mt-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {project.risks.map(risk => (
                                <div key={risk.id} className="p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{risk.title}</h4>
                                        <div className="ml-2">{getSeverityBadge(risk.severity)}</div>
                                    </div>
                                    <Badge>{risk.category}</Badge>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{risk.description}</p>
                                    <div className="mt-3 pt-3 border-t dark:border-charcoal-700">
                                        <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Mitigation</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.mitigation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <Card title="AI Risk Assessment in Progress..." description="An agentic team is analyzing your project.">
            <AgentStatusDisplay />
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                <h4 className="text-sm font-semibold">Approved Risks:</h4>
                {workflowState.foundRisks.length > 0 ? workflowState.foundRisks.map(risk => (
                     <div key={risk.id} className="p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg animate-fade-in">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{risk.title}</h4>
                            <div className="ml-2">{getSeverityBadge(risk.severity)}</div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{risk.description}</p>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 py-4">No risks approved yet...</p>}
            </div>
            {(workflowState.currentAgent === 'Done' || workflowState.error) && (
                 <div className={`mt-4 text-center p-4 rounded-lg ${workflowState.error ? 'bg-red-50 dark:bg-red-900/50' : 'bg-green-50 dark:bg-green-900/50'}`}>
                    {workflowState.error ? <AlertTriangle className="w-8 h-8 mx-auto text-red-500" /> : <CheckCircle className="w-8 h-8 mx-auto text-green-500" />}
                    <h4 className="font-semibold mt-2">{workflowState.error ? 'Workflow Error' : 'Workflow Complete'}</h4>
                    <p className="text-sm">
                        {workflowState.error ? workflowState.error : `${workflowState.foundRisks.length} risks identified. See the full log in the Documents page.`}
                    </p>
                    <Button onClick={() => setWorkflowState(initialState)} variant="outline" size="sm" className="mt-2">
                        {workflowState.error ? 'Try Again' : 'Done'}
                    </Button>
                </div>
            )}
        </Card>
    );
};