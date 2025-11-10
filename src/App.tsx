import React, { useState, useEffect, useRef } from 'react';
import { useProject } from './context/ProjectContext';
import { Project, Phase, Comment, Task, ToastMessage, SearchResult, Message } from './types';

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
import { SearchResultsModal } from './components/SearchResultsModal';

import { runAutomatedPhaseGeneration } from './services/geminiService';
import { HelpModal } from './components/HelpModal';
import { CollaborationPanel } from './components/CollaborationPanel';
import { NLPQueryInterface } from './components/NLPQueryInterface';
import { Button } from './components/ui';
import { Users, MessageSquare, HelpCircle, Save } from 'lucide-react';
import { Toast } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { ProjectHeader } from './components/ProjectHeader';

type AutomationStatus = 'idle' | 'running' | 'paused' | 'error' | 'complete';

declare var JSZip: any;

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9_.]/gi, '_').toLowerCase();

const formatChatLog = (log: Message[]): string => {
    return log.map(msg => {
        let header = '';
        if (msg.sender === 'system') {
            header = `> **SYSTEM** (${msg.timestamp})`;
        } else {
            header = `**${msg.userName || 'Unknown'}** (${msg.timestamp})`;
        }

        let content = '';
        if (msg.text) {
            content = msg.text;
        } else if (msg.attachment) {
            content = `*Attachment: ${msg.attachment.name}*`;
        }

        return `${header}\n> ${content.replace(/\n/g, '\n> ')}\n`;
    }).join('\n---\n');
};


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

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [docToOpenFromSearch, setDocToOpenFromSearch] = useState<string | null>(null);
    
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

    const handleSaveProject = async () => {
        if (!currentProject) {
            setToast({ message: "No active project to save.", type: 'error' });
            return;
        }
    
        setToast({ message: "Generating project archive...", type: 'info' });
    
        try {
            const zip = new JSZip();
            const projectFolder = zip.folder(sanitizeFilename(currentProject.name));
    
            // Add the full project state for backup and restoration purposes
            projectFolder.file('project_state.json', JSON.stringify(currentProject, null, 2));
    
            const summaryContent = `# Project Summary: ${currentProject.name}\n\n## Requirements\n${currentProject.requirements}\n\n## Constraints\n${currentProject.constraints}\n\n## Disciplines\n${currentProject.disciplines.join(', ')}`;
            projectFolder.file('00_Project_Summary.md', summaryContent);
            
            currentProject.phases.forEach((phase, index) => {
                if (phase.outputs.length > 0 || (phase.sprints && phase.sprints.some(s => s.outputs.length > 0)) || phase.chatLog) {
                    const phaseIndex = String(index + 1).padStart(2, '0');
                    const phaseName = sanitizeFilename(phase.name);
                    const phaseFolder = projectFolder.folder(`${phaseIndex}_${phaseName}`);
                    
                    if (phase.outputs.length > 0) {
                        phaseFolder.file('main_document.md', phase.outputs[phase.outputs.length - 1].content);
                    }
    
                    if (phase.chatLog && phase.chatLog.length > 0) {
                        phaseFolder.file('chat_log.md', formatChatLog(phase.chatLog));
                    }
                    
                    phase.sprints.forEach((sprint, sprintIndex) => {
                        const sprintName = sanitizeFilename(sprint.name);
                        const sprintFolder = phaseFolder.folder(`${sprintIndex + 1}_${sprintName}`);
                        if (sprint.outputs.length > 0) {
                            sprintFolder.file('sprint_document.md', sprint.outputs[sprint.outputs.length - 1].content);
                        }
                        if (sprint.chatLog && sprint.chatLog.length > 0) {
                            sprintFolder.file('chat_log.md', formatChatLog(sprint.chatLog));
                        }
                    });
                }
            });
            
            for (const doc of (currentProject.metaDocuments || [])) {
                if (doc.type === '3d-image-veo') {
                    const response = await fetch(`${doc.content}&key=${process.env.API_KEY}`);
                    const blob = await response.blob();
                    projectFolder.file(sanitizeFilename(doc.name) + '.mp4', blob);
                } else if (['diagram', 'wireframe', 'schematic', '2d-image'].includes(doc.type)) {
                    const base64Data = doc.content.split(',')[1];
                    projectFolder.file(sanitizeFilename(doc.name) + '.png', base64Data, { base64: true });
                } else {
                     const extMap = {
                        'pwb-layout-svg': 'svg',
                        'chemical-formula': 'svg',
                        '3d-printing-file': 'stl',
                        'software-code': 'js',
                        'recommendations-log': 'md',
                        'team-roles-suggestion': 'md',
                    };
                    const extension = extMap[doc.type] || 'md';
                    projectFolder.file(sanitizeFilename(doc.name) + `.${extension}`, doc.content);
                }
            }
    
            const zipContent = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipContent);
            a.download = `${sanitizeFilename(currentProject.name)}_project_archive.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setToast({ message: 'Project archive saved successfully.', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to create project archive.', type: 'error' });
        }
    };

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        setCurrentView('dashboard');
    };

    const handleCreateNew = () => setCurrentView('wizard');

    const handleExitProject = () => {
        setCurrentProject(null);
        setSearchQuery('');
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

    const handleSearch = (query: string) => {
        if (!currentProject || !query.trim()) {
            setSearchResults([]);
            return;
        }

        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();
        
        const allDocs = [];
        currentProject.phases.forEach(phase => {
            const latestPhaseOutput = phase.outputs[phase.outputs.length - 1];
            if (latestPhaseOutput) {
                allDocs.push({ id: `phase-${phase.id}`, name: `${phase.name} (Phase Output)`, content: latestPhaseOutput.content });
            }
            phase.sprints.forEach(sprint => {
                 const latestSprintOutput = sprint.outputs[sprint.outputs.length - 1];
                if (latestSprintOutput) {
                    allDocs.push({ id: `sprint-${sprint.id}`, name: `${sprint.name} (Sprint)`, content: latestSprintOutput.content });
                }
            });
        });
        (currentProject.metaDocuments || []).forEach(doc => allDocs.push({ id: doc.id, name: doc.name, content: doc.content }));

        for (const doc of allDocs) {
            if (!doc.content) continue;
            const contentLower = doc.content.toLowerCase();
            const index = contentLower.indexOf(queryLower);
            if (index !== -1) {
                const start = Math.max(0, index - 50);
                const end = Math.min(doc.content.length, index + query.length + 50);
                const snippet = `...${doc.content.substring(start, end)}...`;
                results.push({
                    docId: doc.id,
                    docName: doc.name,
                    snippet: snippet,
                    query: query,
                });
            }
        }
        setSearchResults(results);
        setIsSearchModalOpen(true);
    };

    const handleSelectSearchResult = (docId: string) => {
        setDocToOpenFromSearch(docId);
        setCurrentView('documents');
        setIsSearchModalOpen(false);
    };

    const renderContent = () => {
        if (!currentUser) {
            return <LandingPage onLoginClick={() => setIsAuthModalOpen(true)} />;
        }

        if (currentView === 'projectSelection') {
            return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} setToast={setToast} />;
        }
        if (currentView === 'wizard') {
            return <ProjectWizard onProjectCreated={(p) => { setCurrentProject(p); setCurrentView('dashboard'); }} onCancel={() => setCurrentView('projectSelection')} />;
        }

        if (!currentProject) {
             return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} setToast={setToast} />;
        }

        const projectHeaderProps = {
            onGoHome: currentView === 'dashboard' ? handleExitProject : () => setCurrentView('dashboard'),
            theme,
            setTheme,
            showBackButton: currentView !== 'dashboard',
            searchQuery,
            setSearchQuery,
            onSearch: handleSearch,
        };
        
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
                        <ProjectHeader {...projectHeaderProps} />
                        <PhaseView 
                            phase={phase}
                            onPhaseComplete={handlePhaseComplete}
                            onReturnToDashboard={() => setCurrentView('dashboard')}
                            setToast={setToast}
                        />
                    </div>
                );
            case 'documents':
                return <DocumentsPage 
                            onBack={() => setCurrentView('dashboard')} 
                            setToast={setToast} 
                            initialDocToOpenId={docToOpenFromSearch}
                            onClearInitialDoc={() => setDocToOpenFromSearch(null)}
                        />;
            case 'analytics':
                return <AnalyticsDashboard onBack={() => setCurrentView('dashboard')} />;
            case 'team':
                return <TeamManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast}/>;
            case 'tasks':
                return <TaskManagementPage onBack={() => setCurrentView('dashboard')} setToast={setToast} />;
            case 'integrations':
                return <IntegrationsPage onBack={() => setCurrentView('dashboard')} />;
            default:
                 return <ProjectSelectionView onSelectProject={handleSelectProject} onCreateNew={handleCreateNew} theme={theme} setTheme={setTheme} setToast={setToast} />;
        }
    };

    return (
        <div className="relative">
            {renderContent()}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} setToast={setToast} />
            <SearchResultsModal 
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                results={searchResults}
                onSelect={handleSelectSearchResult}
            />
            {currentUser && (
              <>
                {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
                {isCollaborationPanelOpen && <CollaborationPanel isOpen={isCollaborationPanelOpen} onClose={() => setIsCollaborationPanelOpen(false)} />}
                <NLPQueryInterface isOpen={isNlpQueryOpen} onClose={() => setIsNlpQueryOpen(false)} />
                <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
                    {currentProject && (
                        <Button variant="primary" onClick={handleSaveProject} className="rounded-full !p-3 shadow-lg" aria-label="Save Project">
                            <Save className="w-6 h-6"/>
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setIsCollaborationPanelOpen(true)} className="rounded-full !p-3 shadow-lg" aria-label="Open Collaboration Panel">
                        <Users className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsNlpQueryOpen(true)} className="rounded-full !p-3 shadow-lg" aria-label="Open Project Q&A">
                        <MessageSquare className="w-6 h-6"/>
                    </Button>
                    <Button variant="secondary" onClick={() => setIsHelpModalOpen(true)} className="rounded-full !p-3 shadow-lg" aria-label="Open Help">
                        <HelpCircle className="w-6 h-6"/>
                    </Button>
                </div>
              </>
            )}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
};
