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
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onPhaseComplete: () => void;
    onAddComment: (phaseId: string, text: string) => void;
    onReturnToDashboard: () => void;
    onUpdateProject: (updatedProject: Project) => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const PhaseView: React.FC<PhaseViewProps> = ({ phase, onUpdatePhase, onPhaseComplete, onAddComment, onReturnToDashboard, onUpdateProject, setToast }) => {
    const [localPhase, setLocalPhase] = useState<Phase>(phase);
    const [generationError, setGenerationError] = useState('');
    const { project, currentUser } = useProject();
    
    useEffect(() => {
        setLocalPhase(phase);
    }, [phase]);

    if (!project || !currentUser) return null;

    const renderWorkflow = () => {
        if (localPhase.status === 'in-review') {
            return <DesignReviewWorkflow 
                        phase={localPhase}
                        onUpdatePhase={onUpdatePhase}
                        onPhaseComplete={onPhaseComplete} 
                   />;
        }

        if (['Requirements', 'Preliminary Design', 'Testing'].includes(localPhase.name)) {
            return <MultiDocPhaseWorkflow 
                        phase={localPhase}
                        project={project}
                        onUpdatePhase={onUpdatePhase}
                        onPhaseComplete={onPhaseComplete}
                        setExternalError={setGenerationError}
                        onGoToNext={onReturnToDashboard}
                        onUpdateProject={onUpdateProject}
                        setToast={setToast}
                   />;
        }
        
        if (localPhase.name === 'Critical Design') {
            return <CriticalDesignPhaseWorkflow
                        phase={localPhase}
                        project={project}
                        onUpdatePhase={onUpdatePhase}
                        onPhaseComplete={onPhaseComplete}
                        setExternalError={setGenerationError}
                        onGoToNext={onReturnToDashboard}
                        setToast={setToast}
                    />;
        }
        
        // Standard Workflow for phases like Launch, Operation, Improvement
        return <StandardPhaseWorkflow
                    phase={localPhase}
                    project={project}
                    onUpdatePhase={onUpdatePhase}
                    onPhaseComplete={onPhaseComplete}
                    setExternalError={setGenerationError}
                    onGoToNext={onReturnToDashboard}
               />;
    };
    
    const phaseComments = project.comments[localPhase.id] || [];

    return (
        <div className="space-y-6">
            <PhaseHeader 
                phase={localPhase} 
                disciplines={project.disciplines}
                onUpdatePhase={onUpdatePhase} 
            />
            {!process.env.API_KEY && <ApiKeyWarning />}
            {generationError && <GenerationError message={generationError} />}
            {renderWorkflow()}
            
            {localPhase.output && localPhase.status !== 'in-review' && (
                <DiagramCard 
                    phase={localPhase}
                    onUpdatePhase={onUpdatePhase}
                    setExternalError={setGenerationError}
                />
            )}

            {localPhase.output && (
                 <CommentsThread
                    comments={phaseComments}
                    users={project.users}
                    currentUser={currentUser}
                    onAddComment={(text) => onAddComment(localPhase.id, text)}
                />
            )}
        </div>
    );
};