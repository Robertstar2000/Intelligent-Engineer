
import React, { useState, useEffect } from 'react';
import { Bot, User } from 'lucide-react';

import { ApiKeyWarning } from './ApiKeyWarning';
import { GenerationError } from './GenerationError';
import { PhaseHeader } from './PhaseHeader';
import { Project, Phase, Comment, ToastMessage } from '../types';
import { useProject } from '../context/ProjectContext';
import { DesignReviewWorkflow } from './workflows/DesignReviewWorkflow';
import { MultiDocPhaseWorkflow } from './workflows/MultiDocPhaseWorkflow';
import { CriticalDesignPhaseWorkflow } from './workflows/CriticalDesignPhaseWorkflow';
import { StandardPhaseWorkflow } from './workflows/StandardPhaseWorkflow';
import { CommentsThread } from './CommentsThread';
import { runFullAgenticWorkflow } from '../services/geminiService';
import { Button } from './ui';

interface PhaseViewProps {
    phase: Phase;
    onPhaseComplete: () => void;
    onReturnToDashboard: () => void;
    onDownloadArchive: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const PhaseView: React.FC<PhaseViewProps> = ({ phase, onPhaseComplete, onReturnToDashboard, onDownloadArchive, setToast }) => {
    const [localPhase, setLocalPhase] = useState<Phase>(phase);
    const [generationError, setGenerationError] = useState('');
    const [isAutomatedMode, setIsAutomatedMode] = useState(false);
    const automationController = React.useRef<AbortController | null>(null);
    const { project, currentUser, updatePhase, addComment, updateProject } = useProject();
    
    useEffect(() => {
        console.log(`[PhaseView] Phase prop changed:`, phase);
        setLocalPhase(phase);
    }, [phase]);

    if (!project || !currentUser) return null;

    const handleAutomatedMode = async () => {
        setIsAutomatedMode(true);
        automationController.current = new AbortController();
        try {
            await runFullAgenticWorkflow(project, (update: any) => {
                // Handle updates
                if (update.phaseId) {
                    if (update.sprintId && update.sprintUpdates) {
                        const phase = project.phases.find(p => p.id === update.phaseId);
                        if (phase) {
                            const updatedSprints = phase.sprints.map(s => s.id === update.sprintId ? { ...s, ...update.sprintUpdates } : s);
                            updatePhase(project.id, update.phaseId, { sprints: updatedSprints });
                        }
                    } else if (update.phaseUpdates) {
                        updatePhase(project.id, update.phaseId, update.phaseUpdates);
                    }
                }
                if (update.newMetaDocs) {
                    updateProject({ ...project, metaDocuments: [...(project.metaDocuments || []), ...update.newMetaDocs] });
                }
            }, (message: string, type: 'info' | 'success' | 'error') => setToast({ message, type }), automationController.current.signal);
        } catch (e: any) {
            setGenerationError(e.message);
        } finally {
            setIsAutomatedMode(false);
            automationController.current = null;
        }
    };

    const handleStopAutomation = () => {
        if (automationController.current) {
            automationController.current.abort();
            automationController.current = null;
            setIsAutomatedMode(false);
        }
    };

    const isLastPhase = project.phases[project.phases.length - 1].id === localPhase.id;
    
    const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
        updatePhase(project.id, phaseId, updates);
    };
    
    const handleAddComment = (phaseId: string, text: string) => {
        addComment(project.id, phaseId, text);
    };

    const renderWorkflow = () => {
        const commonProps = {
            phase: localPhase,
            project: project,
            onUpdatePhase: handleUpdatePhase,
            onPhaseComplete: onPhaseComplete,
            setExternalError: setGenerationError,
            onGoToNext: onReturnToDashboard,
            onUpdateProject: updateProject,
            onDownloadArchive: onDownloadArchive,
            isLastPhase: isLastPhase,
            setToast: setToast
        };

        if (localPhase.status === 'in-review') {
            return <DesignReviewWorkflow {...commonProps} />;
        }

        if (['Feasibility Study', 'Launch', 'Operation', 'Improvement'].includes(localPhase.name)) {
             return <StandardPhaseWorkflow {...commonProps} />;
        }

        if (['Requirements', 'Preliminary Design', 'Testing'].includes(localPhase.name)) {
            return <MultiDocPhaseWorkflow {...commonProps} />;
        }
        
        if (localPhase.name === 'Critical Design') {
            return <CriticalDesignPhaseWorkflow {...commonProps} />;
        }
        
        // Fallback to standard workflow
        return <StandardPhaseWorkflow {...commonProps} />;
    };
    
    const phaseComments = project.comments[localPhase.id] || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PhaseHeader 
                    phase={localPhase} 
                    disciplines={project.disciplines}
                    onUpdatePhase={handleUpdatePhase} 
                />
                <Button 
                    onClick={isAutomatedMode ? handleStopAutomation : handleAutomatedMode} 
                    variant={isAutomatedMode ? "danger" : "default"}
                >
                    {isAutomatedMode ? <Bot className="w-4 h-4 mr-2 animate-pulse" /> : <User className="w-4 h-4 mr-2" />}
                    {isAutomatedMode ? "Stop Automation" : "Switch to Automated Mode"}
                </Button>
            </div>
            {!process.env.API_KEY && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}
            {renderWorkflow()}

            {localPhase.outputs && localPhase.outputs.length > 0 && (
                 <CommentsThread
                    comments={phaseComments}
                    users={project.users}
                    currentUser={currentUser}
                    onAddComment={(text) => handleAddComment(localPhase.id, text)}
                />
            )}
        </div>
    );
};
