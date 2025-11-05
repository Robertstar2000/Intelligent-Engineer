import React, { useState, useEffect } from 'react';

import { ApiKeyWarning } from './ApiKeyWarning';
import { GenerationError } from './GenerationError';
import { PhaseHeader } from './PhaseHeader';
import { Project, Phase, Comment, ToastMessage } from '../types';
import { useProject } from '../context/ProjectContext';
import { DesignReviewWorkflow } from './workflows/DesignReviewWorkflow';
import { MultiDocPhaseWorkflow } from './workflows/MultiDocPhaseWorkflow';
import { CriticalDesignPhaseWorkflow } from './workflows/CriticalDesignPhaseWorkflow';
import { StandardPhaseWorkflow } from './workflows/StandardPhaseWorkflow';
import { DiagramCard } from './DiagramCard';
import { CommentsThread } from './CommentsThread';


interface PhaseViewProps {
    phase: Phase;
    onPhaseComplete: () => void;
    onReturnToDashboard: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const PhaseView: React.FC<PhaseViewProps> = ({ phase, onPhaseComplete, onReturnToDashboard, setToast }) => {
    const [localPhase, setLocalPhase] = useState<Phase>(phase);
    const [generationError, setGenerationError] = useState('');
    const { project, currentUser, updatePhase, addComment, updateProject } = useProject();
    
    useEffect(() => {
        setLocalPhase(phase);
    }, [phase]);

    if (!project || !currentUser) return null;
    
    const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
        updatePhase(project.id, phaseId, updates);
    };
    
    const handleAddComment = (phaseId: string, text: string) => {
        addComment(project.id, phaseId, text);
    };

    const renderWorkflow = () => {
        if (localPhase.status === 'in-review') {
            return <DesignReviewWorkflow 
                        phase={localPhase}
                        onUpdatePhase={handleUpdatePhase}
                        onPhaseComplete={onPhaseComplete}
                        onGoToNext={onReturnToDashboard}
                        setToast={setToast}
                   />;
        }

        if (['Requirements', 'Preliminary Design', 'Testing'].includes(localPhase.name)) {
            return <MultiDocPhaseWorkflow 
                        phase={localPhase}
                        project={project}
                        onUpdatePhase={handleUpdatePhase}
                        onPhaseComplete={onPhaseComplete}
                        setExternalError={setGenerationError}
                        onGoToNext={onReturnToDashboard}
                        onUpdateProject={updateProject}
                        setToast={setToast}
                   />;
        }
        
        if (localPhase.name === 'Critical Design') {
            return <CriticalDesignPhaseWorkflow
                        phase={localPhase}
                        project={project}
                        onUpdatePhase={handleUpdatePhase}
                        onPhaseComplete={onPhaseComplete}
                        setExternalError={setGenerationError}
                        onGoToNext={onReturnToDashboard}
                        onUpdateProject={updateProject}
                        setToast={setToast}
                    />;
        }
        
        // Standard Workflow for phases like Launch, Operation, Improvement
        return <StandardPhaseWorkflow
                    phase={localPhase}
                    project={project}
                    onUpdatePhase={handleUpdatePhase}
                    onPhaseComplete={onPhaseComplete}
                    setExternalError={setGenerationError}
                    onGoToNext={onReturnToDashboard}
                    setToast={setToast}
               />;
    };
    
    const phaseComments = project.comments[localPhase.id] || [];

    return (
        <div className="space-y-6">
            <PhaseHeader 
                phase={localPhase} 
                disciplines={project.disciplines}
                onUpdatePhase={handleUpdatePhase} 
            />
            {!process.env.API_KEY && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}
            {renderWorkflow()}
            
            {localPhase.output && localPhase.status !== 'in-review' && (
                <DiagramCard 
                    phase={localPhase}
                    project={project}
                    updateProject={updateProject}
                    onUpdatePhase={handleUpdatePhase}
                    setExternalError={setGenerationError}
                    setToast={setToast}
                />
            )}

            {localPhase.output && (
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