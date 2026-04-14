
import React, { useState } from 'react';
import { generateStandardPhaseOutput, generateDesignReviewChecklist, selectModel, generateStandardVisualAsset, generateAdvancedAsset } from '../../services/geminiService';
import { TuningControls } from '../TuningControls';
import { PhaseOutput } from '../PhaseOutput';
import { PhaseActions } from '../PhaseActions';
import { Project, Phase, ToastMessage, VersionedOutput, MetaDocument } from '../../types';
import { ToolIntegration } from '../ToolIntegration';

interface WorkflowProps {
    phase: Phase;
    project: Project;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onUpdateProject: (updatedProject: Project) => void;
    onPhaseComplete: () => void;
    setExternalError: (message: string) => void;
    onGoToNext: () => void;
    onDownloadArchive: () => void;
    isLastPhase: boolean;
    setToast: (toast: ToastMessage | null) => void;
}

export const StandardPhaseWorkflow = ({ 
    phase, 
    project, 
    onUpdatePhase, 
    onUpdateProject, 
    onPhaseComplete, 
    setExternalError, 
    onGoToNext, 
    onDownloadArchive,
    isLastPhase,
    setToast 
}: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [tuningSettings, setTuningSettings] = useState(phase.tuningSettings);
    const modelForGeneration = selectModel({ phase, tuningSettings });

    const latestOutput = phase.outputs[phase.outputs.length - 1]?.content;

    const handleSyncAssets = async (updatedProject: Project, updatedPhase: Phase, content: string) => {
        const activeTypes = updatedPhase.activeAssetTypes || [];
        if (activeTypes.length === 0) return;

        setToast({ message: `Synchronizing ${activeTypes.length} selected visual assets...`, type: 'info' });
        
        let currentMetaDocs = [...(updatedProject.metaDocuments || [])];
        
        for (const type of activeTypes) {
            try {
                let asset: { content: string; docName: string };
                // Using a mock sprint structure for the generation services
                const mockSprint = { name: updatedPhase.name, description: updatedPhase.description, outputs: [{ content }] } as any;
                
                if (['wireframe', 'diagram', 'schematic'].includes(type)) {
                    asset = await generateStandardVisualAsset(updatedProject, mockSprint, type as any);
                } else {
                    asset = await generateAdvancedAsset(updatedProject, mockSprint, type as any);
                }

                // Remove existing ones of same type for this parent
                currentMetaDocs = currentMetaDocs.filter(d => !(d.parentEntityId === updatedPhase.id && d.type === type));

                const newDoc: MetaDocument = {
                    id: `meta-asset-${updatedPhase.id}-${type}-${Date.now()}`,
                    name: asset.docName,
                    content: asset.content,
                    type: type,
                    createdAt: new Date(),
                    parentEntityId: updatedPhase.id
                };
                currentMetaDocs.push(newDoc);
            } catch (err: any) {
                setToast({ message: `Failed to sync ${type}: ${err.message}`, type: 'error' });
            }
        }
        
        onUpdateProject({ ...updatedProject, metaDocuments: currentMetaDocs });
    };

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
            const updatedPhase = { ...phase, outputs: [...phase.outputs, newVersion], status: 'in-progress' as const, tuningSettings };
            onUpdatePhase(phase.id, { outputs: updatedPhase.outputs, status: updatedPhase.status, tuningSettings });
            
            // Sync selected assets
            await handleSyncAssets(project, updatedPhase, output);
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

    const handleSaveOutput = async (newOutput: string, reason: string) => {
        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: newOutput,
            reason,
            createdAt: new Date(),
        };
        const updatedPhase = { ...phase, outputs: [...phase.outputs, newVersion] };
        onUpdatePhase(phase.id, { outputs: updatedPhase.outputs });
        
        // Sync selected assets
        await handleSyncAssets(project, updatedPhase, newOutput);
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

    const handleToggleAsset = async (type: string) => {
        const currentActive = phase.activeAssetTypes || [];
        const nextActive = currentActive.includes(type) 
            ? currentActive.filter(t => t !== type)
            : [...currentActive, type];
        
        onUpdatePhase(phase.id, { activeAssetTypes: nextActive });

        // If newly selected and we have text, generate it immediately
        if (nextActive.includes(type) && latestOutput) {
             const updatedPhase = { ...phase, activeAssetTypes: nextActive };
             await handleSyncAssets(project, updatedPhase, latestOutput);
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
                 <ToolIntegration 
                    phase={phase}
                    project={project}
                    onUpdateProject={onUpdateProject}
                    onToggleAssetType={handleToggleAsset}
                    setToast={setToast}
                 />
            )}

            <PhaseActions
                phase={phase}
                onMarkComplete={handleMarkComplete}
                onDownload={handleDownload}
                onGoToNext={onGoToNext}
                onPackageAll={onDownloadArchive}
                isLastPhase={isLastPhase}
                isCompletable={!!latestOutput && !isLoading}
                reviewRequired={phase.designReview?.required}
                isDownloadDisabled={!latestOutput}
            />
        </div>
    );
};
