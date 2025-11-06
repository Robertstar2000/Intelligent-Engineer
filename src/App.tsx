import React, { useState, useEffect, useRef } from 'react';
import { useProject } from './context/ProjectContext';
import { Project, Phase, Comment, Task, ToastMessage } from './types';

import { LandingPage } from './pages/LandingPage';
import { ProjectSelectionView } from './pages/ProjectSelectionView';
import { ProjectWizard } from './pages/ProjectWizard';
import { Dashboard } from './pages/Dashboard';
import { PhaseView } from './components/PhaseView';
import { DocumentsPage } from './components/DocumentsPage';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TeamManagementPage } from './components/TeamManagementPage';
import { TaskManagementPage } from './components/TaskManagementPage';
import { IntegrationsPage } from './components/IntegrationsPage';

import { runAutomatedPhaseGeneration } from './services/geminiService';
import { HelpModal } from './components/HelpModal';
import { CollaborationPanel } from './components/CollaborationPanel';
import { NLPQueryInterface } from './components/NLPQueryInterface';
import { Button } from './components/ui';
import { Users, MessageSquare, HelpCircle } from 'lucide-react';
import { Toast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { ProjectHeader } from './components/ProjectHeader';

type AutomationStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete';

export const App = () => {
    const { 
        project: currentProject, 
        setProject: setCurrentProject,
        updateProject,
        updatePhase,
        theme,
        setTheme,
        currentUser
    } = useProject();

    const [currentView, setCurrentView] = useState<'landing' | 'projectSelection' | 'wizard' | 'dashboard' | 'phase' | 'documents' | 'analytics' | 'team' | 'tasks' | 'integrations'>('landing');
    const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNlpQueryOpen, setIsNlpQueryOpen] = useState(false);
    const [automationStatus, setAutomationStatus] = useState<AutomationStatus>('idle');
    const [automatingPhaseId, setAutomatingPhaseId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCollaborationPanelOpen, setIsCollaborationPanelOpen] = useState(false);
    const automationController = useRef(new AbortController());
    const projectStateRef = useRef(currentProject);
    
    useEffect(() => {
        if(currentUser && currentView === 'landing'){
            setCurrentView('projectSelection');
        } else if (!currentUser && currentView !== 'landing') {
            setCurrentView('landing');
        }
    }, [currentUser, currentView]);

    useEffect(() => {
        projectStateRef.current = currentProject;
        if (currentProject) {
            const isComplete = currentProject.phases.every(p => p.status === 'completed');
            if (isComplete) {
                setAutomationStatus('complete');
            }
        }
    }, [currentProject]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        setCurrentView('dashboard');
    };

    const handleCreateNew = () => setCurrentView('wizard');

    const handleExitProject = () => {
        setCurrentProject(null);
        setCurrentView('projectSelection');
    };
    
    const handleSelectPhase = (index: number) => {
        setSelectedPhaseIndex(index);
        setCurrentView('phase');
    };

    const handlePhaseComplete = () => {
        if (!currentProject || selectedPhaseIndex === null) return;
        const currentPhase = currentProject.phases[selectedPhaseIndex];
        
        const isReviewRequired = currentPhase.designReview?.required && currentPhase.status !== 'in-review';
        
        if (!isReviewRequired) {
            updatePhase(currentProject.id, currentPhase.id, { status: 'completed' });
        }
        
        setToast({ message: `${currentPhase.name} phase updated.`, type: 'success' });
    };

    const handleAutomateProject = async () => {
        if (!projectStateRef.current) return;

        automationController.current = new AbortController();
        const { signal } = automationController.current;

        setAutomationStatus('running');
        setToast({ message: "Project automation started.", type: 'info' });

        const failedPhaseIds = new Set<string>();

        while (!signal.aborted) {
            const currentProjectState = projectStateRef.current;
            if (!currentProjectState) break;

            const phaseIndex = currentProjectState.phases.findIndex(p => p.status !== 'completed' && !failedPhaseIds.has(p.id));
            if (phaseIndex === -1) {
                if(failedPhaseIds.size > 0) {
                     setToast({ message: "Automation finished, but some phases failed and were skipped.", type: 'info' });
                     setAutomationStatus('error');
                } else {
                     setToast({ message: "Project automation complete!", type: 'success' });
                     setAutomationStatus('complete');
                }
                break;
            }

            const phase = currentProjectState.phases[phaseIndex];
            setAutomatingPhaseId(phase.id);
            setToast({ message: `Automating phase: ${phase.name}...`, type: 'info' });

            try {
                const newMetaDocs = await runAutomatedPhaseGeneration(
                    currentProjectState,
                    phase,
                    (updates) => {
                        if (signal.aborted) return;
                        const latestProjectState = projectStateRef.current;
                        if (!latestProjectState) return;
                        
                        const latestPhaseState = latestProjectState.phases.find(p => p.id === phase.id)!;
                        const updatedPhase = { ...latestPhaseState, ...updates };
                        const updatedPhases = latestProjectState.phases.map(p => p.id === phase.id ? updatedPhase : p);
                        
                        const newProjectState = { ...latestProjectState, phases: updatedPhases };
                        projectStateRef.current = newProjectState;
                        updateProject(newProjectState);
                    },
                    (message, type = 'info') => {
                        if (signal.aborted) return;
                        setToast({ message, type: type as 'info' | 'success' | 'error' })
                    }
                );
                
                if (newMetaDocs && newMetaDocs.length > 0) {
                    const latestProjectState = projectStateRef.current;
                    if (latestProjectState) {
                        const updatedProject = {
                            ...latestProjectState,
                            metaDocuments: [...(latestProjectState.metaDocuments || []), ...newMetaDocs],
                        };
                        projectStateRef.current = updatedProject;
                        updateProject(updatedProject);
                    }
                }
            } catch (error: any) {
                if (signal.aborted) break;
                setToast({ message: `Skipping phase "${phase.name}" due to an error. It can be completed manually.`, type: 'error' });
                failedPhaseIds.add(phase.id);
            }
        }
        
        if (signal.aborted) {
            setToast({ message: 'Automation paused by user.', type: 'info' });
            setAutomationStatus('paused');
        }

        setAutomatingPhaseId(null);
    };
    
    const handleStopAutomation = () => {
        automationController.current.abort();
    };

    const renderContent = () => {
        if (!currentUser) {
            return <LandingPage onLoginClick={() => setIsAuthModalOpen(true)} />;
        }

        if (currentView === 'projectSelection') {
            return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        if (currentView === 'wizard') {
            return <ProjectWizard onProjectCreated={(p) => { setCurrentProject(p); setCurrentView('dashboard'); }} onCancel={() => setCurrentView('projectSelection')} />;
        }

        if (!currentProject) {
             return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        
        switch (currentView) {
            case 'dashboard':
                return <Dashboard 
                    onSelectPhase={handleSelectPhase}
                    onExitProject={handleExitProject}
                    automationStatus={automationStatus}
                    automatingPhaseId={automatingPhaseId}
                    onRunAutomation={handleAutomateProject}
                    onStopAutomation={handleStopAutomation}
                    onViewDocuments={() => setCurrentView('documents')}
                    onViewAnalytics={() => setCurrentView('analytics')}
                    onViewTeam={() => setCurrentView('team')}
                    onViewTasks={() => setCurrentView('tasks')}
                    onViewIntegrations={() => setCurrentView('integrations')}
                    isCollaborationPanelOpen={isCollaborationPanelOpen}
                    setToast={setToast}
                />;
            case 'phase':
                 const phase = selectedPhaseIndex !== null ? currentProject.phases[selectedPhaseIndex] : null;
                 if (!phase) {
                    setCurrentView('dashboard');
                    return null;
                 }
                return (
                    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                        <ProjectHeader onGoHome={() => setCurrentView('dashboard')} theme={theme} setTheme={setTheme} showBackButton/>
                        <PhaseView 
                            phase={phase}
                            onPhaseComplete={handlePhaseComplete}
                            onReturnToDashboard={() => setCurrentView('dashboard')}
                            setToast={setToast}
                        />
                    </div>
                );
            case 'documents':
                return <DocumentsPage onBack={() => setCurrentView('dashboard')} setToast={setToast}/>;
            case 'analytics':
                return <AnalyticsDashboard onBack={() => setCurrentView('dashboard')} />;
            case 'team':
                return <TeamManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast}/>;
            case 'tasks':
                return <TaskManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast} />;
            case 'integrations':
                return <IntegrationsPage onBack={() => setCurrentView('dashboard')} />;
            default:
                 return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
    };

    return (
        <div className="relative">
            {renderContent()}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} setToast={setToast} />
            {currentUser && (
              <>
                {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
                {isCollaborationPanelOpen && <CollaborationPanel isOpen={isCollaborationPanelOpen} onClose={() => setIsCollaborationPanelOpen(false)} />}
                <NLPQueryInterface isOpen={isNlpQueryOpen} onClose={() => setIsNlpQueryOpen(false)} />
                <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
                    <Button variant="secondary" onClick={() => setIsCollaborationPanelOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <Users className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsNlpQueryOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <MessageSquare className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsHelpModalOpen(true)} className="rounded-full !p-3 shadow-lg">
                        <HelpCircle className="w-6 h-6"/>
                    </Button>
                </div>
              </>
            )}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
};
