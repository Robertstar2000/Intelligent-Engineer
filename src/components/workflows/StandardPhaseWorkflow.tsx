import React, { useState } from 'react';
import { generateStandardPhaseOutput, generateDesignReviewChecklist, selectModel } from '../../services/geminiService';
import { TuningControls } from '../TuningControls';
import { PhaseOutput } from '../PhaseOutput';
import { PhaseActions } from '../PhaseActions';
import { Project, Phase, ToastMessage, VersionedOutput } from '../../types';
import { DiagramCard } from '../DiagramCard';

interface WorkflowProps {
    phase: Phase;
    project: Project;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onUpdateProject: (updatedProject: Project) => void;
    onPhaseComplete: () => void;
    setExternalError: (message: string) => void;
    onGoToNext: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const StandardPhaseWorkflow = ({ phase, project, onUpdatePhase, onUpdateProject, onPhaseComplete, setExternalError, onGoToNext, setToast }: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [tuningSettings, setTuningSettings] = useState(phase.tuningSettings);
    const modelForGeneration = selectModel({ phase, tuningSettings });

    const latestOutput = phase.outputs[phase.outputs.length - 1]?.content;

    const handleGenerate = async (reason: string) => {
        setIsLoading(true);
        setExternalError('');
        try {
            const output = await generateStandardPhaseOutput(project, phase, tuningSettings);
            const newVersion: VersionedOutput = {
                version: (phase.outputs.length || 0) + 1,
                content: output,
                reason,
                createdAt: new Date(),
            };
            onUpdatePhase(phase.id, { outputs: [...phase.outputs, newVersion], status: 'in-progress', tuningSettings });
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMarkComplete = async () => {
        if (!latestOutput) return;
        setIsLoading(true);
        setExternalError('');
        
        if (phase.designReview?.required) {
            try {
                const checklist = await generateDesignReviewChecklist(latestOutput);
                const updates: Partial<Phase> = {
                    status: 'in-review',
                    designReview: { ...phase.designReview, checklist: checklist },
                    reviewStartDate: new Date().toISOString(),
                };
                onUpdatePhase(phase.id, updates);
                setToast({ message: `${phase.name} committed for review.`, type: 'success' });
            } catch (error: any) {
                 setExternalError(error.message || "Failed to generate design review checklist.");
            } finally {
                setIsLoading(false);
            }
        } else {
            onUpdatePhase(phase.id, { status: 'completed' });
            setToast({ message: `${phase.name} phase completed!`, type: 'success' });
            setIsLoading(false);
        }
    };

    const handleSaveOutput = (newOutput: string, reason: string) => {
        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: newOutput,
            reason,
            createdAt: new Date(),
        };
        onUpdatePhase(phase.id, { outputs: [...phase.outputs, newVersion] });
    };

    const handleDownload = () => {
        if (latestOutput) {
            const blob = new Blob([latestOutput], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}_${phase.name}.md`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6">
            {phase.isEditable && phase.status !== 'completed' && (
                <TuningControls
                    settings={tuningSettings}
                    onChangeSettings={setTuningSettings}
                    title="Tuning Controls"
                    description="Select a profile or adjust parameters to customize the AI's output for this phase."
                />
            )}
            <PhaseOutput
                phase={phase}
                onGenerate={handleGenerate}
                onSave={handleSaveOutput}
                isLoading={isLoading}
                isEditable={phase.isEditable}
                apiKey={process.env.API_KEY || null}
                modelName={modelForGeneration}
            />
            {latestOutput && (
                 <DiagramCard
                    phase={phase}
                    project={project}
                    onUpdatePhase={onUpdatePhase}
                    updateProject={onUpdateProject}
                    setExternalError={setExternalError}
                    setToast={setToast}
                />
            )}
            <PhaseActions
                phase={phase}
                onMarkComplete={handleMarkComplete}
                onDownload={handleDownload}
                onGoToNext={onGoToNext}
                isCompletable={!!latestOutput && !isLoading}
                reviewRequired={phase.designReview?.required}
                isDownloadDisabled={!latestOutput}
            />
        </div>
    );
};