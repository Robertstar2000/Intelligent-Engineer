
import React, { useState } from 'react';
import { CheckCircle, Clock, Hourglass, Circle, Lock, ChevronRight, Rocket, XCircle, Save, Edit3, Archive, TrendingUp, Users, CheckSquare, Puzzle, LoaderCircle, LayoutGrid, List, PlayCircle, PauseCircle, Shield, AlertTriangle, Download, ChevronDown, Layout, Zap, Image as ImageIcon } from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { useProject } from '../context/ProjectContext';
import { Phase, Sprint, ToastMessage, MetaDocument } from '../types';
import { ProjectHeader } from '../components/ProjectHeader';
import { RiskEnginePanel } from '../components/RiskEnginePanel';
import { ChangeManagementPanel } from '../components/ChangeManagementPanel';
import { ProjectExportPanel } from '../components/ProjectExportPanel';
import { generateComplianceTraceabilityMatrix, runThreatModelingWorkflow, runFullAgenticWorkflow, UserCancelledError } from '../services/geminiService';

const getSprintStatusIcon = (status: Sprint['status']) => {
    switch (status) {
        case 'completed': return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
        case 'in-progress': return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
        default: return <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
};

type AutomationStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete';

const SecurityPanel = ({ project, updateProject, setToast, onViewDocument }) => {
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
                    <p className="text-gray-600 dark:text-gray-400 my-2">Threat Model Report generated.</p>
                    <div className="flex justify-center gap-2">
                        <Button onClick={() => onViewDocument(threatModelDoc.id)} variant="outline" size="sm">
                            <ImageIcon className="mr-2 w-4 h-4" /> View Artifact
                        </Button>
                        <Button onClick={handleRunAnalysis} disabled={isLoading} variant="outline" size="sm">
                            {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <CheckSquare className="mr-2 w-4 h-4" />}
                            Re-run Analysis
                        </Button>
                    </div>
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

const CompliancePanel = ({ project, updateProject, setToast, onViewDocument }) => {
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
                    <p className="text-gray-600 dark:text-gray-400 my-2">Compliance Traceability Matrix generated.</p>
                    <div className="flex justify-center gap-2">
                        <Button onClick={() => onViewDocument(complianceDoc.id)} variant="outline" size="sm">
                            <ImageIcon className="mr-2 w-4 h-4" /> View Artifact
                        </Button>
                        <Button onClick={handleRunAnalysis} disabled={isLoading} variant="outline" size="sm">
                            {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin"/> : <CheckSquare className="mr-2 w-4 h-4" />}
                            Re-generate Matrix
                        </Button>
                    </div>
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
  onViewDocument: (id: string) => void;
  onViewAnalytics: () => void;
  onViewTeam: () => void;
  onViewTasks: () => void;
  onViewIntegrations: () => void;
  onExitProject: () => void;
  onDownloadArchive: () => void;
  onOpenSettings: () => void;
  automationStatus: AutomationStatus;
  automatingPhaseId: string | null;
  onRunAutomation: () => void;
  onStopAutomation: () => void;
  onRunCodeGeneration: () => void;
  onRunPromptGeneration: () => void;
  isCollaborationPanelOpen: boolean;
  setToast: (toast: ToastMessage | null) => void;
}
export const Dashboard = ({ onSelectPhase, onViewDocuments, onViewDocument, onViewAnalytics, onViewTeam, onViewTasks, onViewIntegrations, onExitProject, onDownloadArchive, onOpenSettings, automationStatus, automatingPhaseId, onRunAutomation, onStopAutomation, onRunCodeGeneration, onRunPromptGeneration, isCollaborationPanelOpen, setToast }: DashboardProps) => {
  const { project, theme, setTheme, updateProjectDetails, updateProject } = useProject();
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState(project?.requirements || '');
  const [editedConstraints, setEditedConstraints] = useState(project?.constraints || '');
  const [lifecycleView, setLifecycleView] = useState<'visual' | 'list'>('list');
  const [isExportExpanded, setIsExportExpanded] = useState(false);
  const isAutomating = automationStatus === 'running';
  const allPhasesCompleted = project.phases.every(p => p.status === 'completed');
  
  // New state for Full Auto Pilot
  const [isFullAutoRunning, setIsFullAutoRunning] = useState(false);
  const fullAutoController = React.useRef(new AbortController());

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
  
  // Rule: Phase i is unlocked if Phase i-1 has at least one output.
  // Free movement if all phases have been generated at least once.
  const isFreeNavEnabled = project.phases.every(p => p.outputs.length > 0);
  
  const isPhaseUnlocked = (index: number) => {
    if (isFreeNavEnabled) return true;
    if (index === 0) return true;
    // Phase is unlocked if previous phase has output
    return project.phases[index - 1].outputs.length > 0;
  };

  const projectProgress = firstIncompleteIndex === -1 ? 100 : (firstIncompleteIndex / project.phases.length) * 100;
  
  const totalSprints = project.phases.reduce((acc, p) => acc + p.sprints.length, 0);
  const completedSprints = project.phases.reduce((acc, p) => acc + p.sprints.filter(s => s.status === 'completed').length, 0);
  const sprintProgress = totalSprints > 0 ? (completedSprints / totalSprints) * 100 : 0;

  const handleRunFullAuto = async () => {
      setIsFullAutoRunning(true);
      fullAutoController.current = new AbortController();
      setToast({ message: "Starting Full Auto-Pilot (Docs + Visuals)...", type: 'info' });

      try {
          await runFullAgenticWorkflow(
              project,
              (updates: { phaseId: string, phaseUpdates: Partial<Phase>, newMetaDoc?: MetaDocument }) => {
                  if (fullAutoController.current.signal.aborted) return;
                  
                  // Retrieve fresh project state from closure or context equivalent would be better, but for now we rely on prev state
                  // Ideally, we'd use a ref to current project, but updateProject handles state updates
                  // Here we need to be careful. We are inside a component.
                  // We need to fetch the LATEST project state to merge properly.
                  
                  // Simple approach: Use functional update in context if available, or just construct payload
                  // Since updateProject takes a full object, we need to apply updates to the *current* project state known to the component
                  // But react state `project` might be stale inside this async loop callback if updates happen fast.
                  
                  // HACK: Use the updateProject function which calls setProjects with a functional update.
                  // But wait, updateProject in context is `setProjects(...)`.
                  // The robust way is to pass a functional updater to `updateProject`.
                  // Since `updateProject` signature is `(p: Project) => void`, we must rely on it handling the merge or risk race conditions.
                  // The `ProjectContext` implementation handles array merging, but let's be careful.
                  
                  // Actually, `runFullAgenticWorkflow` is awaited. We should pass a callback that uses the Context's setter.
                  // But we can't access the *latest* state easily inside the loop without a ref.
                  
                  // Let's rely on the fact that `runFullAgenticWorkflow` is sequential.
                  // We will use a ref to track local project state updates to ensure continuity.
                  
                  // For this implementation, we will pass the `updateProject` from context,
                  // but we need to fetch the *latest* project reference.
                  // We will let the context handle persistence.
                  
                  // NOTE: To make this robust, we update the project via context.
                  // We also need to add the visual doc if present.
                  
                  const phaseIndex = project.phases.findIndex(p => p.id === updates.phaseId);
                  if (phaseIndex === -1) return;

                  // Create a fresh copy of what we *think* the project is, but really we should use a ref if we could.
                  // We will trigger the context update.
                  
                  // We'll re-read project from context on every loop iteration in the service? No, service is a function.
                  // We'll assume the user doesn't interact *while* auto-pilot runs.
                  
                  // We need to Construct the new project object.
                  let newProject = { ...project }; // Warning: Stale closure if not careful.
                  
                  // Correct approach: The `project` variable in this scope is stale after the first await.
                  // We need a way to get the fresh project. 
                  // Limitation: The current architecture makes sequential async updates tricky without a ref.
                  // However, `updatePhase` and `updateProject` in context use functional state updates for `projects` array,
                  // but `project` state itself might be stale.
                  
                  // Let's use `updatePhase` for the phase part, and `updateProject` for the doc part.
                  // This minimizes conflict.
                  
                  // Update 1: Phase
                  // updatePhase(project.id, updates.phaseId, updates.phaseUpdates);
                  
                  // Update 2: MetaDoc
                  // if (updates.newMetaDoc) { ... }
                  
                  // To fix the Stale Closure issue in `handleRunFullAuto`:
                  // We can't easily fix it without refactoring context to expose a getter or using a Ref.
                  // But we can use the `updateProject` which writes to DB.
                  // The UI might lag, but DB will be correct if context handles it.
                  
                  // Actually, `runFullAgenticWorkflow` expects us to handle the state update.
                  // Let's use a functional update pattern in `updateProject` if possible? No, it takes a value.
                  
                  // Workaround: We will use a mutable ref for the project inside the component to track state across the async loop
                  // and push that to the context.
                  
                  // See implementation below using `latestProjectRef`.
              },
              (msg: string, type: any) => setToast({ message: msg, type }),
              fullAutoController.current.signal
          );
          setToast({ message: "Full Auto-Pilot Complete!", type: 'success' });
      } catch (error: any) {
          if (error instanceof UserCancelledError) {
              setToast({ message: "Auto-Pilot stopped by user.", type: 'info' });
          } else {
              setToast({ message: `Auto-Pilot Error: ${error.message}`, type: 'error' });
          }
      } finally {
          setIsFullAutoRunning(false);
      }
  };
  
  // Ref to keep track of latest project state for the async workflow
  const latestProjectRef = React.useRef(project);
  React.useEffect(() => { latestProjectRef.current = project; }, [project]);

  const handleFullAutoWrapped = async () => {
      setIsFullAutoRunning(true);
      fullAutoController.current = new AbortController();
      
      try {
          await runFullAgenticWorkflow(
              latestProjectRef.current,
              (updates: { phaseId: string, phaseUpdates?: Partial<Phase>, sprintId?: string, sprintUpdates?: Partial<Sprint>, newMetaDocs?: MetaDocument[] }) => {
                  // Use the ref to get the absolute latest state
                  const currentProj = latestProjectRef.current; 
                  let updatedPhases = currentProj.phases.map(p => {
                      if (p.id !== updates.phaseId) return p;
                      
                      let newPhase = { ...p };
                      if (updates.phaseUpdates) {
                          newPhase = { ...newPhase, ...updates.phaseUpdates };
                      }
                      
                      if (updates.sprintId && updates.sprintUpdates) {
                          newPhase.sprints = newPhase.sprints.map(s => 
                              s.id === updates.sprintId ? { ...s, ...updates.sprintUpdates } : s
                          );
                      }
                      
                      return newPhase;
                  });
                  
                  let updatedMetaDocs = currentProj.metaDocuments || [];
                  if (updates.newMetaDocs && updates.newMetaDocs.length > 0) {
                      updatedMetaDocs = [...updatedMetaDocs, ...updates.newMetaDocs];
                  }
                  
                  const newProjectState = { ...currentProj, phases: updatedPhases, metaDocuments: updatedMetaDocs };
                  
                  // Update Context (which updates DB and UI)
                  updateProject(newProjectState);
                  
                  // Update local ref immediately so next iteration sees it (though Context update is async-ish, 
                  // the ref update here ensures the next loop tick uses the data we just decided on)
                  latestProjectRef.current = newProjectState;
              },
              (msg: string, type: any) => setToast({ message: msg, type }),
              fullAutoController.current.signal
          );
      } catch (error: any) {
           if (error instanceof UserCancelledError) {
              setToast({ message: "Auto-Pilot stopped.", type: 'info' });
          } else {
              console.error(error);
              setToast({ message: "Auto-Pilot failed.", type: 'error' });
          }
      } finally {
          setIsFullAutoRunning(false);
      }
  };


  const renderAutomationControls = () => {
    return (
      <Card title="Automation Engine">
        <div className="space-y-4">
            <p className="text-xs text-gray-500 mb-2">Generates text AND creates one relevant visual artifact (diagram, wireframe, etc.) for every phase.</p>
            {isFullAutoRunning ? (
                <Button onClick={() => fullAutoController.current.abort()} variant="danger" className="w-full">
                    <LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> Stop Auto-Pilot
                </Button>
            ) : (
                <Button onClick={handleFullAutoWrapped} disabled={automationStatus === 'running'} variant="primary" className="w-full">
                    <Zap className="mr-2 w-4 h-4" /> Start Auto-Pilot
                </Button>
            )}
            <div className="border-t pt-4 space-y-2">
                <Button onClick={onRunCodeGeneration} disabled={!allPhasesCompleted || isAutomating || isFullAutoRunning} variant="outline" className="w-full">
                    <Zap className="mr-2 w-4 h-4" /> Generate Simulation Code
                </Button>
                <Button onClick={onRunPromptGeneration} disabled={!allPhasesCompleted || isAutomating || isFullAutoRunning} variant="outline" className="w-full">
                    <Zap className="mr-2 w-4 h-4" /> Generate Simulation Prompts
                </Button>
            </div>
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
            onOpenSettings={onOpenSettings}
            onViewDocuments={onViewDocuments}
        />

      <div className="flex gap-8 relative items-start">
        {/* Improved Navigation Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
            {renderAutomationControls()}
            <Card title="Navigation" noPadding>
                <div className="py-2">
                    {project.phases.map((phase, index) => {
                        const isUnlocked = isPhaseUnlocked(index);
                        const isCurrent = index === firstIncompleteIndex;
                        const { icon } = getStatusIcon(isUnlocked ? phase.status : 'not-started');
                        
                        return (
                            <button 
                                key={phase.id} 
                                onClick={() => onSelectPhase(index)} 
                                disabled={!isUnlocked || isAutomating || isFullAutoRunning}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-charcoal-700 ${isCurrent ? 'bg-brand-primary/10 border-r-4 border-brand-primary font-bold' : ''} ${!isUnlocked ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                            >
                                <span className="scale-90">{icon}</span>
                                <span className="truncate">{index + 1}. {phase.name}</span>
                                {!isUnlocked && <Lock className="w-3 h-3 ml-auto text-gray-500" />}
                            </button>
                        );
                    })}
                </div>
            </Card>
        </aside>

        <main className="flex-1 min-w-0">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
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
                                        const isUnlocked = isPhaseUnlocked(index);
                                        const isCurrent = index === firstIncompleteIndex;
                                        const isAutomatingThisPhase = phase.id === automatingPhaseId;
                                        const { icon, color } = getStatusIcon(isUnlocked ? phase.status : 'not-started');
                                        
                                        return (
                                            <div key={phase.id}>
                                                <button onClick={() => onSelectPhase(index)} disabled={!isUnlocked || isAutomating || isFullAutoRunning} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4 ${!isUnlocked ? 'bg-gray-100 dark:bg-charcoal-800/50 border-gray-200 dark:border-charcoal-700/50 cursor-not-allowed opacity-60' : `bg-white dark:bg-charcoal-800/50 border-transparent shadow-sm hover:shadow-md hover:border-brand-primary ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`} ${isAutomatingThisPhase ? 'animate-pulse border-brand-primary' : ''} ${isAutomating && !isAutomatingThisPhase ? 'opacity-50 cursor-wait' : ''}`}>
                                                    {isAutomatingThisPhase ? (
                                                        <div className="p-2 bg-blue-100 dark:bg-brand-primary/20 rounded-full text-brand-primary">
                                                            <LoaderCircle className="w-5 h-5 animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <div className={`p-2 bg-gray-100 dark:bg-charcoal-700/50 rounded-full ${color}`}>{icon}</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                                            {index + 1}. {phase.name}
                                                            {isUnlocked && <span className="inline-block scale-75 origin-left">{icon}</span>}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{phase.description}</p>
                                                    </div>
                                                    {!isUnlocked ? <Lock className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                                </button>
                                                
                                                {phase.sprints.length > 0 && isUnlocked && (
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
                                        const isUnlocked = isPhaseUnlocked(index);
                                        const isCurrent = index === firstIncompleteIndex;
                                        const isAutomatingThisPhase = phase.id === automatingPhaseId;
                                        const { icon, color, bgColor } = getStatusIcon(isUnlocked ? phase.status : 'not-started');
                                        return (
                                            <React.Fragment key={phase.id}>
                                                <div className="flex-shrink-0 w-64">
                                                    <button
                                                        onClick={() => onSelectPhase(index)}
                                                        disabled={!isUnlocked || isAutomating || isFullAutoRunning}
                                                        className={`w-full h-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex flex-col justify-between ${!isUnlocked ? 'bg-gray-100 dark:bg-charcoal-800/50 border-gray-200 dark:border-charcoal-700/50 cursor-not-allowed opacity-60' : `bg-white dark:bg-charcoal-800/50 border-transparent shadow-sm hover:shadow-md hover:border-brand-primary ${isCurrent ? 'ring-2 ring-brand-primary' : ''}`} ${isAutomatingThisPhase ? 'animate-pulse border-brand-primary' : ''} ${isAutomating && !isAutomatingThisPhase ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <div className={`p-1.5 rounded-full ${bgColor} ${color}`}>
                                                                    {isAutomatingThisPhase ? <LoaderCircle className="w-5 h-5 animate-spin" /> : icon}
                                                                </div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {phase.name}
                                                                    {isUnlocked && !isAutomatingThisPhase && <span className="scale-75 origin-left">{icon}</span>}
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{phase.description}</p>
                                                        </div>
                                                        <div className="flex justify-end items-center mt-3">
                                                             {!isUnlocked ? (
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
                    <RiskEnginePanel onViewDocument={onViewDocument} />
                    <SecurityPanel project={project} updateProject={updateProject} setToast={setToast} onViewDocument={onViewDocument} />
                    <CompliancePanel project={project} updateProject={updateProject} setToast={setToast} onViewDocument={onViewDocument} />
                    <ChangeManagementPanel setToast={setToast} />
                    {showExportPanel && (
                        <Card 
                            title={
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExportExpanded(!isExportExpanded)}>
                                    <div className="flex items-center gap-2">
                                        <Archive className="w-5 h-5 text-brand-primary" />
                                        <span>Project Export Tool</span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 transition-transform ${isExportExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            }
                            description={!isExportExpanded && "Generate project archives and external tool exports."}
                            noPadding
                        >
                            {isExportExpanded && (
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Full Project Archive</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Download all generated documents, technical specifications, and visual assets as a structured ZIP archive.
                                        </p>
                                        <Button onClick={onDownloadArchive} className="w-full">
                                            <Download className="mr-2 w-4 h-4" /> Download Complete Project ZIP
                                        </Button>
                                    </div>
                                    <div className="border-t dark:border-charcoal-700 pt-6">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Commercial Tool Integration</h4>
                                        <ProjectExportPanel setToast={setToast} />
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
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
                                        {(Array.isArray(project.disciplines) ? project.disciplines : Object.keys(project.disciplines || {})).map(d => <Badge key={d}>{d}</Badge>)}
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
                            <Button variant="outline" onClick={onViewDocuments}><Archive className="mr-2 w-4 h-4" />Artifacts</Button>
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
    </div>
  );
};
