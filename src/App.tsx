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


export const App = () => {
    const { 
        project: currentProject, 
        setProject: setCurrentProject, 
        updateProject,
        theme,
        setTheme,
        currentUser
    } = useProject();

    const [currentView, setCurrentView] = useState<'landing' | 'projectSelection' | 'wizard' | 'dashboard' | 'phase' | 'documents' | 'analytics' | 'team' | 'tasks' | 'integrations'>('landing');
    const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNlpQueryOpen, setIsNlpQueryOpen] = useState(false);
    const [isAutomating, setIsAutomating] = useState(false);
    const [automatingPhaseId, setAutomatingPhaseId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCollaborationPanelOpen, setIsCollaborationPanelOpen] = useState(false);
    const isAutomatingRef = useRef(false);
    
    useEffect(() => {
        if(currentUser && currentView === 'landing'){
            setCurrentView('projectSelection');
        } else if (!currentUser && currentView !== 'landing') {
            setCurrentView('landing');
        }
    }, [currentUser, currentView]);

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

    const handleProjectCreated = (project: Project) => {
        updateProject(project);
        setCurrentProject(project);
        setCurrentView('dashboard');
    };

    const handleExitProject = () => {
        setCurrentProject(null);
        setCurrentView('projectSelection');
    };
    
    const handleUpdateProjectDetails = (updates: { requirements: string, constraints: string }) => {
        if (!currentProject) return;
        const updated = { ...currentProject, ...updates };
        updateProject(updated);
        setToast({ message: 'Project details updated!', type: 'success' });
    };

    const handleSelectPhase = (index: number) => {
        setSelectedPhaseIndex(index);
        setCurrentView('phase');
    };
    
    const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
        if (!currentProject) return;
        const updatedPhases = currentProject.phases.map(p => p.id === phaseId ? { ...p, ...updates } : p);
        updateProject({ ...currentProject, phases: updatedPhases });
    };

    const handlePhaseComplete = () => {
        if (!currentProject || selectedPhaseIndex === null) return;
        const currentPhase = currentProject.phases[selectedPhaseIndex];
        
        const isReviewRequired = currentPhase.designReview?.required && currentPhase.status !== 'in-review';
        
        if (!isReviewRequired) {
             const updatedPhases = currentProject.phases.map((p, index): Phase => 
                index === selectedPhaseIndex ? { ...p, status: 'completed' } : p
            );
             updateProject({ ...currentProject, phases: updatedPhases });
        }
        
        setToast({ message: `${currentPhase.name} phase updated.`, type: 'success' });
    };
    
    const handleAddComment = (phaseId: string, text: string) => {
        if (!currentProject || !currentProject.users[0]) return;
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            userId: currentProject.users[0].id,
            phaseId, text, createdAt: new Date()
        };
        const updatedComments = { ...currentProject.comments };
        if (!updatedComments[phaseId]) updatedComments[phaseId] = [];
        updatedComments[phaseId].push(newComment);
        updateProject({ ...currentProject, comments: updatedComments });
    };
    
    const handleAddTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
        if (!currentProject) return;
        const newTask: Task = { ...task, id: `task-${Date.now()}`, createdAt: new Date() };
        const updatedTasks = [...(currentProject.tasks || []), newTask];
        updateProject({ ...currentProject, tasks: updatedTasks });
        setToast({ message: 'Task added successfully!', type: 'success' });
    };
    
    const handleUpdateTask = (updatedTask: Task) => {
        if (!currentProject) return;
        const updatedTasks = (currentProject.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
        updateProject({ ...currentProject, tasks: updatedTasks });
    };

    const handleAutomateProject = async () => {
        if (!currentProject) return;
    
        setIsAutomating(true);
        isAutomatingRef.current = true;
        let projectState = { ...currentProject };
    
        try {
            const startIndex = projectState.phases.findIndex(p => p.status !== 'completed');
            if (startIndex === -1) {
                setToast({ message: "Project is already complete!", type: 'success' });
                return;
            }
    
            for (let i = startIndex; i < projectState.phases.length; i++) {
                if (!isAutomatingRef.current) {
                    setToast({ message: 'Automation stopped by user.', type: 'info' });
                    break;
                }
                const phase = projectState.phases[i];
                setAutomatingPhaseId(phase.id);
    
                await runAutomatedPhaseGeneration(
                    projectState,
                    phase,
                    (updates) => {
                        const updatedPhases = projectState.phases.map(p => p.id === phase.id ? { ...p, ...updates } : p);
                        projectState = { ...projectState, phases: updatedPhases };
                        updateProject(projectState); 
                    },
                    (message) => setToast({ message, type: 'info' })
                );
            }
            if (isAutomatingRef.current) {
                setToast({ message: "Project automation complete!", type: 'success' });
            }
        } catch (error: any) {
            setToast({ message: `Automation failed: ${error.message}`, type: 'error' });
        } finally {
            setIsAutomating(false);
            setAutomatingPhaseId(null);
            isAutomatingRef.current = false;
        }
    };
    
    const handleStopAutomation = () => {
        isAutomatingRef.current = false;
        setIsAutomating(false);
        setAutomatingPhaseId(null);
        setToast({ message: 'Automation stopped.', type: 'info' });
    };

    const renderContent = () => {
        if (!currentUser) {
            return <LandingPage onLoginClick={() => setIsAuthModalOpen(true)} />;
        }

        if (currentView === 'projectSelection') {
            return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        if (currentView === 'wizard') {
            return <ProjectWizard onProjectCreated={handleProjectCreated} onCancel={() => setCurrentView('projectSelection')} />;
        }

        if (!currentProject) {
             return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} />;
        }
        
        switch (currentView) {
            case 'dashboard':
                return <Dashboard 
                    onSelectPhase={handleSelectPhase}
                    onExitProject={handleExitProject}
                    onUpdateProjectDetails={handleUpdateProjectDetails}
                    isAutomating={isAutomating}
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
                            onUpdatePhase={handleUpdatePhase}
                            onPhaseComplete={handlePhaseComplete}
                            onAddComment={handleAddComment}
                            onReturnToDashboard={() => setCurrentView('dashboard')}
                            onUpdateProject={updateProject}
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
                return <TaskManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} />;
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
