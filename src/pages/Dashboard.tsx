import React, { useState } from 'react';
import { CheckCircle, Clock, Hourglass, Circle, Lock, ChevronRight, Rocket, XCircle, Save, Edit3, Archive, TrendingUp, Users, CheckSquare, Puzzle, LoaderCircle, LayoutGrid, List, PlayCircle, PauseCircle, Shield, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { useProject } from '../context/ProjectContext';
import { Phase, Sprint, ToastMessage, MetaDocument } from '../types';
import { ProjectHeader } from '../components/ProjectHeader';
import { RiskEnginePanel } from '../components/RiskEnginePanel';
import { ChangeManagementPanel } from '../components/ChangeManagementPanel';
import { ProjectExportPanel } from '../components/ProjectExportPanel';
import { generateComplianceTraceabilityMatrix, runThreatModelingWorkflow } from '../services/geminiService';

const getSprintStatusIcon = (status: Sprint['status']) => {
    switch (status) {
        case 'completed': return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
        case 'in-progress': return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
        default: return <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
};

type AutomationStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete';

const SecurityPanel = ({ project, updateProject, setToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const threatModelDoc = project.metaDocuments?.find(doc => doc.type === 'threat-model-report');

    const handleRunAnalysis = async () => {
        setIsLoading(true);
        try {
            const newDoc = await runThreatModelingWorkflow(project);
            const updatedMetaDocs = [...(project.metaDocuments || []).filter(d => d.type !== 'threat-model-report'), newDoc];
            updateProject({ ...project, metaDocuments: updatedMetaDocs });
            setToast({ message: 'Threat model analysis complete and saved to documents.', type: 'success' });
        } catch (error: any) {
            setToast({ message: `Security analysis failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Security Analysis (SDL)" description="Run an AI-powered threat modeling analysis based on project documentation.">
            {threatModelDoc ? (
                 <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto"/>
                    <p className="text-gray-600 dark:text-gray-400 my-2">Threat Model Report generated. View it in the Documents page.</p>
                    <Button onClick={handleRunAnalysis} disabled={isLoading} variant="outline" size="sm">
                        {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <CheckSquare className="mr-2 w-4 h-4" />}
                        Re-run Analysis
                    </Button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Click to start the AI agent workflow to identify potential security threats.</p>
                    <Button onClick={handleRunAnalysis} disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <AlertTriangle className="mr-2 w-4 h-4" />}
                        Run AI Security Analysis
                    </Button>
                </div>
            )}
        </Card>
    );
};

const CompliancePanel = ({ project, updateProject, setToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const complianceDoc = project.metaDocuments?.find(doc => doc.type === 'compliance-traceability-matrix');
    
    const handleRunAnalysis = async () => {
        setIsLoading(true);
        try {
            const newDoc = await generateComplianceTraceabilityMatrix(project);
            const updatedMetaDocs = [...(project.metaDocuments || []).filter(d => d.type !== 'compliance-traceability-matrix'), newDoc];
            updateProject({ ...project, metaDocuments: updatedMetaDocs });
            setToast({ message: 'Compliance matrix generated and saved to documents.', type: 'success' });
        } catch (error: any) {
            setToast({ message: `Compliance analysis failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Regulatory Compliance" description="Generate a traceability matrix mapping requirements to design and testing.">
             {complianceDoc ? (
                 <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto"/>
                    <p className="text-gray-600 dark:text-gray-400 my-2">Compliance Traceability Matrix generated. View it in the Documents page.</p>
                    <Button onClick={handleRunAnalysis} disabled={isLoading} variant="outline" size="sm">
                        {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <CheckSquare className="mr-2 w-4 h-4" />}
                        Re-generate Matrix
                    </Button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Click to generate the compliance traceability matrix based on project documents.</p>
                    <Button onClick={handleRunAnalysis} disabled={isLoading || project.complianceStandards.length === 0} title={project.complianceStandards.length === 0 ? 'Select compliance standards in project settings first' : ''}>
                        {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <Shield className="mr-2 w-4 h-4" />}
                        Generate Compliance Matrix
                    </Button>
                </div>
            )}
        </Card>
    );
};


interface DashboardProps {
  onSelectPhase: (index: number) => void;
  onViewDocuments: () => void;
  onViewAnalytics: () => void;
  onViewTeam: () => void;
  onViewTasks: () => void;
  onViewIntegrations: () => void;
  onExitProject: () => void;
  automationStatus: AutomationStatus;
  automatingPhaseId: string | null;
  onRunAutomation: () => void;
  onStopAutomation: () => void;
  isCollaborationPanelOpen: boolean;
  setToast: (toast: ToastMessage | null) => void;
}
export const Dashboard = ({ onSelectPhase, onViewDocuments, onViewAnalytics, onViewTeam, onViewTasks, onViewIntegrations, onExitProject, automationStatus, automatingPhaseId, onRunAutomation, onStopAutomation, isCollaborationPanelOpen, setToast }: DashboardProps) => {
  const { project, theme, setTheme, updateProjectDetails, updateProject } = useProject();
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState(project?.requirements || '');
  const [editedConstraints, setEditedConstraints] = useState(project?.constraints || '');
  const [lifecycleView, setLifecycleView] = useState<'visual' | 'list'>('list');
  const isAutomating = automationStatus === 'running';
  
  if (!project) return null;

  const preliminaryDesignPhase = project.phases.find(p => p.name === 'Preliminary Design');
  const showExportPanel = preliminaryDesignPhase && preliminaryDesignPhase.status === 'completed';

  const handleSaveDetails = () => {
    updateProjectDetails(project.id, { requirements: editedRequirements, constraints: editedConstraints });
    setToast({ message: 'Project details updated!', type: 'success' });
    setIsEditingDetails(false);
  };

  const getStatusIcon = (status: Phase['status']) => {
    switch (status) {
      case 'completed': return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' };
      case 'in-progress': return { icon: <Clock className="w-5 h-5 text-yellow-500" />, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' };
      case 'in-review': return { icon: <Hourglass className="w-5 h-5 text-brand-primary" />, color: 'text-brand-primary', bgColor: 'bg-brand-primary/10 dark:bg-brand-primary/20' };
      default: return { icon: <Circle className="w-5 h-5 text-gray-400" />, color: 'text-gray-400', bgColor: 'bg-gray-100 dark:bg-charcoal-700' };
    }
  };

  const firstIncompleteIndex = project.phases.findIndex(p => p.status !== 'completed');
  const projectProgress = firstIncompleteIndex === -1 ? 100 : (firstIncompleteIndex / project.phases.length) * 100;
  
  const totalSprints = project.phases.reduce((acc, p) => acc + p.sprints.length, 0);
  const completedSprints = project.phases.reduce((acc, p) => acc + p.sprints.filter(s => s.status === 'completed').length, 0);
  const sprintProgress = totalSprints > 0 ? (completedSprints / totalSprints) * 100 : 0;

  const renderAutomationControls = () => {
    const statusMap = {
      idle: { text: "Run Full Automation", icon: <Rocket className="mr-2 w-4 h-4" />, action: onRunAutomation, variant: "primary", disabled: false },
      running: { text: "Pause Automation", icon: <PauseCircle className="mr-2 w-4 h-4" />, action: onStopAutomation, variant: "danger", disabled: false },
      paused: { text: "Resume Automation", icon: <PlayCircle className="mr-2 w-4 h-4" />, action: onRunAutomation, variant: "primary", disabled: false },
      error: { text: "Resume Automation", icon: <PlayCircle className="mr-2 w-4 h-4" />, action: onRunAutomation, variant: "primary", disabled: false },
      complete: { text: "Automation Complete", icon: <CheckCircle className="mr-2 w-4 h-4" />, action: () => {}, variant: "primary", disabled: true },
    };
    const current = statusMap[automationStatus];
    return (
      <Card title="Automation Engine">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {automationStatus === 'idle' && "Automatically generate all remaining project phases sequentially."}
            {automationStatus === 'running' && "Automation is in progress. You can pause it at any time."}
            {automationStatus === 'paused' && "Automation is paused. You can resume to continue from where it left off."}
            {automationStatus === 'error' && "Automation was stopped due to an error. You can resume to try again."}
            {automationStatus === 'complete' && "All project phases have been completed."}
          </p>
          <Button onClick={current.action} variant={current.variant as any} disabled={current.disabled} className="w-full">
            {current.icon} {current.text}
          </Button>
        </div>
      </Card>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
       <ProjectHeader
            onGoHome={onExitProject}
            theme={theme}
            setTheme={setTheme}
        />

      <main>
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="mb-6 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 flex items-start space-x-4">
             <Clock className="w-8 h-8 text-blue-300 flex-shrink-0 mt-1" />
            <p className="text-blue-200">
                <strong>Heads Up:</strong> This application uses hundreds of LLM calls in its agentic workflows. A full project automation can take 30-60 minutes, not including your review time. This process is designed to accelerate what would typically be months of manual design work.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card noPadding>
                    <div className="flex justify-between items-center p-6 pb-4 border-b dark:border-charcoal-700/50">
                         <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Lifecycle</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Complete each phase sequentially to unlock the next.</p>
                        </div>
                        <div className="inline-flex rounded-md shadow-sm bg-gray-100 dark:bg-charcoal-900/50 p-1 space-x-1">
                            <Button onClick={() => setLifecycleView('visual')} variant={lifecycleView === 'visual' ? 'secondary' : 'ghost'} size="sm" className="!px-2 !py-1">
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                             <Button onClick={() => setLifecycleView('list')} variant={lifecycleView === 'list' ? 'secondary' : 'ghost'} size="sm" className="!px-2 !py-1">
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="p-6">
                        {lifecycleView === 'list' ? (
                             <div className="space-y-4">
                                {project.phases.map((phase, index) => {
                                    const isLocked = firstIncompleteIndex !== -1 && index > firstIncompleteIndex;
                                    const isCurrent = index === firstIncompleteIndex;
                                    const isAutomatingThisPhase = phase.id === automatingPhaseId;
                                    const { icon, color } = getStatusIcon(isLocked ? 'not-started' : phase.status);
                                    
                                    return (
                                        <div key={phase.id}>
                                            <button onClick={() => onSelectPhase(index)} disabled={isLocked || isAutomating} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4 ${isLocked ? 'bg-gray-100 dark:bg-charcoal-800/50 border-gray-200 dark:border-charcoal-700/50 cursor-not-allowed opacity-60' : `bg-white dark:bg-charcoal-800/50 border-transparent shadow-sm hover:shadow-md hover:border-brand-primary ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`} ${isAutomatingThisPhase ? 'animate-pulse border-brand-primary' : ''} ${isAutomating && !isAutomatingThisPhase ? 'opacity-50 cursor-wait' : ''}`}>
                                                {isAutomatingThisPhase ? (
                                                    <div className="p-2 bg-blue-100 dark:bg-brand-primary/20 rounded-full text-brand-primary">
                                                        <LoaderCircle className="w-5 h-5 animate-spin" />
                                                    </div>
                                                ) : (
                                                    <div className={`p-2 bg-gray-100 dark:bg-charcoal-700/50 rounded-full ${color}`}>{icon}</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{index + 1}. {phase.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{phase.description}</p>
                                                </div>
                                                {isLocked ? <Lock className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                            </button>
                                            
                                            {phase.sprints.length > 0 && !isLocked && (
                                                <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-charcoal-700 pl-6 py-2">
                                                    {phase.sprints.map((sprint) => (
                                                        <div key={sprint.id} className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                                                            {getSprintStatusIcon(sprint.status)}
                                                            <span className="truncate">{sprint.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                             <div className="flex items-center overflow-x-auto pb-4 -m-6 px-6 space-x-4">
                                {project.phases.map((phase, index) => {
                                    const isLocked = firstIncompleteIndex !== -1 && index > firstIncompleteIndex;
                                    const isCurrent = index === firstIncompleteIndex;
                                    const isAutomatingThisPhase = phase.id === automatingPhaseId;
                                    const { icon, color, bgColor } = getStatusIcon(isLocked ? 'not-started' : phase.status);
                                    return (
                                        <React.Fragment key={phase.id}>
                                            <div className="flex-shrink-0 w-64">
                                                <button
                                                    onClick={() => onSelectPhase(index)}
                                                    disabled={isLocked || isAutomating}
                                                    className={`w-full h-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex flex-col justify-between ${isLocked ? 'bg-gray-100 dark:bg-charcoal-800/50 border-gray-200 dark:border-charcoal-700/50 cursor-not-allowed opacity-60' : `bg-white dark:bg-charcoal-800/50 border-transparent shadow-sm hover:shadow-md hover:border-brand-primary ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`} ${isAutomatingThisPhase ? 'animate-pulse border-brand-primary' : ''} ${isAutomating && !isAutomatingThisPhase ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    <div>
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <div className={`p-1.5 rounded-full ${bgColor} ${color}`}>
                                                                {isAutomatingThisPhase ? <LoaderCircle className="w-5 h-5 animate-spin" /> : icon}
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{phase.name}</h4>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{phase.description}</p>
                                                    </div>
                                                    <div className="flex justify-end items-center mt-3">
                                                         {isLocked ? (
                                                            <Lock className="w-4 h-4 text-gray-400" />
                                                         ) : isAutomatingThisPhase ? (
                                                            <Badge variant="info">Working</Badge>
                                                         ) : (
                                                            <Badge variant={phase.status === 'completed' ? 'success' : isCurrent ? 'warning' : 'default'}>{phase.status.replace('-', ' ')}</Badge>
                                                         )}
                                                    </div>
                                                </button>
                                            </div>
                                            {index < project.phases.length - 1 && (
                                                <div className={`flex-shrink-0 h-1 w-12 rounded-full transition-colors duration-500 ${index < firstIncompleteIndex ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
                {renderAutomationControls()}
                <RiskEnginePanel />
                <SecurityPanel project={project} updateProject={updateProject} setToast={setToast} />
                <CompliancePanel project={project} updateProject={updateProject} setToast={setToast} />
                <ChangeManagementPanel setToast={setToast} />
                {showExportPanel && <ProjectExportPanel setToast={setToast} />}
            </div>
            <div className="space-y-6">
                <Card title="Project Status">
                     <div className="space-y-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phase Progress ({firstIncompleteIndex === -1 ? project.phases.length : firstIncompleteIndex}/{project.phases.length})</span>
                            <ProgressBar progress={projectProgress} className="mt-1" />
                        </div>
                         {totalSprints > 0 && (
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sprint Progress ({completedSprints}/{totalSprints})</span>
                                <ProgressBar progress={sprintProgress} className="mt-1" />
                            </div>
                         )}
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Phase</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{project.phases[firstIncompleteIndex]?.name || 'Completed'}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Project Details</h3>
                        {!isEditingDetails && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(true)}><Edit3 className="w-4 h-4 mr-2" /> Edit</Button>
                        )}
                    </div>
                    {isEditingDetails ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Requirements</label>
                                <textarea value={editedRequirements} onChange={e => setEditedRequirements(e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                             <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Constraints</label>
                                <textarea value={editedConstraints} onChange={e => setEditedConstraints(e.target.value)} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => { setIsEditingDetails(false); setEditedRequirements(project.requirements); setEditedConstraints(project.constraints); }}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveDetails}><Save className="w-4 h-4 mr-2" /> Save</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold text-gray-800 dark:text-gray-200">Template Used</label>
                                    <p className="text-gray-600 dark:text-gray-400">{project.templateName}</p>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-800 dark:text-gray-200">Development Mode</label>
                                    <p className="text-gray-600 dark:text-gray-400 capitalize">{project.developmentMode}</p>
                                </div>
                            </div>
                             <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Disciplines</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {project.disciplines.map(d => <Badge key={d}>{d}</Badge>)}
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Requirements</label>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-24 overflow-y-auto">{project.requirements}</p>
                            </div>
                            <div>
                                <label className="font-semibold text-gray-800 dark:text-gray-200">Constraints</label>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-24 overflow-y-auto">{project.constraints}</p>
                            </div>
                        </div>
                    )}
                </Card>
                 <Card title="Project Tools">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onViewDocuments}><Archive className="mr-2 w-4 h-4" />Documents</Button>
                        <Button variant="outline" onClick={onViewAnalytics}><TrendingUp className="mr-2 w-4 h-4" />Analytics</Button>
                        <Button variant="outline" onClick={onViewTeam} className="relative">
                            <Users className="mr-2 w-4 h-4" />Team
                            {isCollaborationPanelOpen && (
                                <span className="absolute top-1 right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                                </span>
                            )}
                        </Button>
                        <Button variant="outline" onClick={onViewTasks}><CheckSquare className="mr-2 w-4 h-4" />Tasks</Button>
                        <Button variant="outline" onClick={onViewIntegrations} className="col-span-2"><Puzzle className="mr-2 w-4 h-4" />Integrations</Button>
                    </div>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
};