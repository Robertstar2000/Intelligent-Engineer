
import React, { useState, useEffect } from 'react';
import { Play, Check, LoaderCircle, GitBranch, Lock, RotateCcw } from 'lucide-react';
import { Remarkable } from 'remarkable';
import { Button, Card, ModelBadge } from '../ui';
import { GenerationError } from '../GenerationError';
import { Project, Phase, Sprint, ToastMessage, VersionedOutput, MetaDocument } from '../../types';
import { generateCriticalDesignSprints, generateSprintSpecification, selectModel, generateDesignReviewChecklist, generateStandardVisualAsset, generateAdvancedAsset } from '../../services/geminiService';
import { AttachmentManager } from '../AttachmentManager';
import { PhaseActions } from '../PhaseActions';
import { ToolIntegration } from '../ToolIntegration';
import { ConfirmationModal } from '../ConfirmationModal';

declare const Prism: any;

const md = new Remarkable({
    html: true, typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try { return Prism.highlight(str, Prism.languages[lang], lang); } catch (e) { /* no-op */ }
        }
        return '';
    },
});

interface WorkflowProps {
    phase: Phase;
    project: Project;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onPhaseComplete: () => void;
    setExternalError: (message: string) => void;
    onGoToNext: () => void;
    onUpdateProject: (updatedProject: Project) => void;
    onDownloadArchive: () => void;
    isLastPhase: boolean;
    setToast: (toast: ToastMessage | null) => void;
}

export const CriticalDesignPhaseWorkflow = ({ 
    phase, 
    project, 
    onUpdatePhase, 
    onPhaseComplete, 
    setExternalError, 
    onGoToNext, 
    onUpdateProject, 
    onDownloadArchive,
    isLastPhase,
    setToast 
}: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // can be 'initial', 'commit', sprintId, or null
    const [sprintToRevert, setSprintToRevert] = useState<Sprint | null>(null);
    const modelForInitialSpec = selectModel({ taskType: 'criticalSprints' });
    const modelForSprintSpec = selectModel({ phase });
    
    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase]);

    const handleSyncSprintAssets = async (sprint: Sprint, content: string) => {
        const activeTypes = sprint.activeAssetTypes || [];
        if (activeTypes.length === 0) return;

        setToast({ message: `Synchronizing visual assets for ${sprint.name}...`, type: 'info' });
        let currentMetaDocs = [...(project.metaDocuments || [])];
        
        for (const type of activeTypes) {
            try {
                let asset: { content: string; docName: string };
                const mockSprint = { ...sprint, outputs: [{ content }] } as any;
                
                if (['wireframe', 'diagram', 'schematic'].includes(type)) {
                    asset = await generateStandardVisualAsset(project, mockSprint, type as any);
                } else {
                    asset = await generateAdvancedAsset(project, mockSprint, type as any);
                }

                currentMetaDocs = currentMetaDocs.filter(d => !(d.parentEntityId === sprint.id && d.type === type));

                const newDoc: MetaDocument = {
                    id: `meta-asset-${sprint.id}-${type}-${Date.now()}`,
                    name: asset.docName,
                    content: asset.content,
                    type: type,
                    createdAt: new Date(),
                    parentEntityId: sprint.id
                };
                currentMetaDocs.push(newDoc);
            } catch (err: any) {
                setToast({ message: `Failed to sync ${type}: ${err.message}`, type: 'error' });
            }
        }
        onUpdateProject({ ...project, metaDocuments: currentMetaDocs });
    };

    const handleGenerateInitialSpecAndSprints = async () => {
        setIsLoading('initial');
        setExternalError('');
        try {
            const { preliminarySpec, sprints } = await generateCriticalDesignSprints(project, phase);
            const newVersion: VersionedOutput = {
                version: 1,
                content: preliminarySpec,
                reason: 'Initial specification and sprints generation',
                createdAt: new Date(),
            };
            onUpdatePhase(phase.id, { outputs: [newVersion], sprints: sprints, status: 'in-progress' });
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(null);
        }
    };

    const handleGenerateSprintSpec = async (sprintId: string) => {
        setIsLoading(sprintId);
        setExternalError('');
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint) return;

        try {
            const { technicalSpec, deliverables } = await generateSprintSpecification(project, phase, sprint);
            const newVersion: VersionedOutput = {
                version: (sprint.outputs.length || 0) + 1,
                content: technicalSpec,
                reason: 'Generated technical specification',
                createdAt: new Date(),
            };
            const updatedSprint = { ...sprint, outputs: [...sprint.outputs, newVersion], deliverables: deliverables };
            
            const updatedSprints = phase.sprints.map(s => s.id === sprintId ? updatedSprint : s);
            onUpdatePhase(phase.id, { sprints: updatedSprints });

            await handleSyncSprintAssets(updatedSprint, technicalSpec);
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleAcceptAndMerge = async (sprintId: string) => {
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint || sprint.outputs.length === 0) return;

        const latestPhaseContent = phase.outputs[phase.outputs.length - 1]?.content || '';
        const latestSprintContent = sprint.outputs[sprint.outputs.length - 1].content;

        const updatedOutput = `${latestPhaseContent}\n\n---\n\n### Completed Sprint: ${sprint.name}\n\n**Technical Specification:**\n\n${latestSprintContent}`;
        const updatedSprints: Sprint[] = phase.sprints.map(s =>
            s.id === sprintId ? { ...s, status: 'completed' } : s
        );

        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: updatedOutput,
            reason: `Merged sprint: ${sprint.name}`,
            createdAt: new Date(),
        };
        onUpdatePhase(phase.id, { outputs: [...phase.outputs, newVersion], sprints: updatedSprints });
        
        // Final sync check
        await handleSyncSprintAssets(sprint, latestSprintContent);
    };

    const handleCommitForReview = async () => {
        if (phase.outputs.length === 0) return;
        setIsLoading('commit');
        setExternalError('');
        try {
            const checklist = await generateDesignReviewChecklist(phase.outputs[phase.outputs.length - 1].content);
            const updates: Partial<Phase> = {
                status: 'in-review',
                designReview: { ...phase.designReview, checklist: checklist },
                reviewStartDate: new Date().toISOString(),
            };
            onUpdatePhase(phase.id, updates);
            setToast({ message: `${phase.name} phase committed for design review.`, type: 'success' });
        } catch (error: any) {
            setExternalError(error.message || "Failed to generate design review checklist.");
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleUpdateSprint = (sprintId: string, updates: Partial<Sprint>) => {
        const updatedSprints = phase.sprints.map(s =>
            s.id === sprintId ? { ...s, ...updates } : s
        );
        onUpdatePhase(phase.id, { sprints: updatedSprints });
    };

    const handleRevertLastSprint = () => {
        const completedSprints = phase.sprints.filter(s => s.status === 'completed');
        if (completedSprints.length > 0) {
            const lastCompletedSprint = completedSprints[completedSprints.length - 1];
            setSprintToRevert(lastCompletedSprint);
        }
    };
    
    const handleConfirmRevert = () => {
        if (!sprintToRevert || sprintToRevert.outputs.length === 0) return;

        const sprintOutputToRevert = sprintToRevert.outputs[sprintToRevert.outputs.length - 1].content;
        const revertMarker = `\n\n---\n\n### Completed Sprint: ${sprintToRevert.name}\n\n**Technical Specification:**\n\n${sprintOutputToRevert}`;
        const latestPhaseContent = phase.outputs[phase.outputs.length - 1]?.content || '';
        const updatedOutput = latestPhaseContent.replace(revertMarker, '');
        
        const updatedSprints = phase.sprints.map((s): Sprint => 
            s.id === sprintToRevert.id ? { ...s, status: 'not-started', outputs: [], deliverables: [] } : s
        );
        
        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: updatedOutput,
            reason: `Reverted sprint: ${sprintToRevert.name}`,
            createdAt: new Date(),
        };
        onUpdatePhase(phase.id, { outputs: [...phase.outputs, newVersion], sprints: updatedSprints });
        setToast({ message: `Reverted sprint: ${sprintToRevert.name}`, type: 'info' });
        setSprintToRevert(null);
    };

    const handleToggleSprintAsset = async (sprintId: string, type: string) => {
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint) return;

        const currentActive = sprint.activeAssetTypes || [];
        const nextActive = currentActive.includes(type) 
            ? currentActive.filter(t => t !== type)
            : [...currentActive, type];
        
        handleUpdateSprint(sprintId, { activeAssetTypes: nextActive });

        const latestSprintOutput = sprint.outputs[sprint.outputs.length - 1]?.content;
        if (nextActive.includes(type) && latestSprintOutput) {
            await handleSyncSprintAssets({ ...sprint, activeAssetTypes: nextActive }, latestSprintOutput);
        }
    };
    
    const allSprintsAccepted = phase.sprints.every(s => s.status === 'completed');

    if (!phase.sprints || phase.sprints.length === 0) {
        return (
            <Card title="Critical Design" description="This phase breaks down the design into a specification and implementation sprints.">
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Generate the initial specification and development sprints.</p>
                    <div className="inline-flex flex-col items-center gap-2">
                        <Button onClick={handleGenerateInitialSpecAndSprints} disabled={isLoading === 'initial'}>
                            {isLoading === 'initial' ? (
                                <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Generating...</>
                            ) : (
                                <><Play className="mr-2 w-4 h-4" />Generate Spec & Sprints</>
                            )}
                        </Button>
                        <ModelBadge modelName={modelForInitialSpec} />
                    </div>
                </div>
            </Card>
        );
    }
    
    const completedSprintIds = new Set(phase.sprints.filter(s => s.status === 'completed').map(s => s.id));
    const sprintMap = new Map(phase.sprints.map(s => [s.id, s.name]));

    return (
        <>
            <Card title="Preliminary Design Specification" description="The high-level technical plan for this phase.">
                <div className="bg-gray-50 dark:bg-charcoal-800 border dark:border-charcoal-700 rounded-lg p-4 max-h-96 overflow-y-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(phase.outputs[phase.outputs.length - 1]?.content || '') }}
                />
            </Card>
            <Card title="Development Sprints" description="Generate and merge the specification for each sprint to complete the Critical Design.">
                <div className="space-y-4">
                    {phase.sprints.map((sprint, index) => {
                        const dependenciesMet = sprint.dependencies?.every(depId => completedSprintIds.has(depId)) ?? true;
                        const isLockedByDependency = !dependenciesMet && sprint.status !== 'completed';

                        return (
                            <div key={sprint.id} className={`p-4 rounded-lg border transition-colors duration-300 ${sprint.status === 'completed' ? 'border-green-200 dark:border-green-700/50 bg-green-50 dark:bg-green-900/20' : isLockedByDependency ? 'bg-gray-100 dark:bg-charcoal-800/50 opacity-60' : 'bg-white dark:bg-charcoal-800/50 dark:border-charcoal-700'}`}>
                               <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                                        {isLoading === sprint.id ? <LoaderCircle className="w-5 h-5 text-brand-primary animate-spin mt-1 flex-shrink-0" /> : isLockedByDependency ? <Lock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0"/> : null}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{index + 1}. {sprint.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{sprint.description}</p>
                                            {sprint.dependencies && sprint.dependencies.length > 0 && (
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <GitBranch className="w-3 h-3 mr-1.5" />
                                                    Depends on: {sprint.dependencies.map(depId => sprintMap.get(depId) || 'Unknown').join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-2 flex-shrink-0">
                                       {!sprint.outputs.length && sprint.status !== 'completed' && (
                                           <div className="flex items-center space-x-2">
                                                <Button size="sm" onClick={() => handleGenerateSprintSpec(sprint.id)} disabled={!!isLoading || isLockedByDependency}>
                                                    {isLoading === sprint.id ? (
                                                        <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Working...</>
                                                    ) : 'Generate Spec'}
                                                </Button>
                                                <ModelBadge modelName={modelForSprintSpec} />
                                           </div>
                                       )}
                                    </div>
                               </div>

                               <div className="mt-2">
                                    <textarea
                                        placeholder="Add notes..."
                                        value={sprint.notes || ''}
                                        onChange={(e) => handleUpdateSprint(sprint.id, { notes: e.target.value })}
                                        className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                                        rows={2}
                                        disabled={sprint.status === 'completed' || isLockedByDependency}
                                    />
                                </div>
                               
                               {sprint.outputs.length > 0 && (
                                   <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                       <div className="text-sm text-gray-800 dark:text-gray-200">
                                           <h5 className="font-semibold mb-1">Key Deliverables:</h5>
                                           <ul className="list-disc list-inside">
                                              {sprint.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                                           </ul>
                                       </div>
                                        <div className="mt-2 bg-gray-50 dark:bg-charcoal-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: md.render(sprint.outputs[sprint.outputs.length - 1]?.content || '') }}
                                        />

                                        <ToolIntegration
                                            sprint={sprint}
                                            project={project}
                                            onUpdateProject={onUpdateProject}
                                            onToggleAssetType={(type) => handleToggleSprintAsset(sprint.id, type)}
                                            setToast={setToast}
                                        />

                                        <AttachmentManager
                                            sprint={sprint}
                                            onUpdateAttachments={(attachments) => handleUpdateSprint(sprint.id, { attachments })}
                                        />
                                       
                                        {sprint.status !== 'completed' && (
                                            <div className="mt-4 flex justify-end items-center space-x-2">
                                                <div className="flex items-center space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleGenerateSprintSpec(sprint.id)} disabled={!!isLoading}>
                                                        {isLoading === sprint.id ? (
                                                            <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Regenerating...</>
                                                        ) : 'Regenerate'}
                                                    </Button>
                                                     <ModelBadge modelName={modelForSprintSpec} />
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleAcceptAndMerge(sprint.id)} 
                                                    disabled={!!isLoading}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Check className="mr-2 w-4 h-4" /> Accept & Merge Sprint
                                                </Button>
                                            </div>
                                        )}
                                   </div>
                               )}
                            </div>
                        );
                    })}
                </div>
            </Card>
            
            <div className="mt-6">
                <PhaseActions 
                    phase={phase}
                    onMarkComplete={handleCommitForReview}
                    onDownload={() => {
                        if (phase.outputs.length > 0) {
                            const latestOutput = phase.outputs[phase.outputs.length - 1].content;
                            const blob = new Blob([latestOutput], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${project.name}_${phase.name}.md`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }
                    }}
                    onGoToNext={onGoToNext}
                    onPackageAll={onDownloadArchive}
                    isLastPhase={isLastPhase}
                    isCompletable={allSprintsAccepted && !isLoading}
                    reviewRequired={phase.designReview?.required || true} // Critical Design usually requires review
                    isDownloadDisabled={phase.outputs.length === 0}
                />
            </div>

            <ConfirmationModal
                isOpen={!!sprintToRevert}
                onClose={() => setSprintToRevert(null)}
                onConfirm={handleConfirmRevert}
                title={`Revert Sprint: ${sprintToRevert?.name}?`}
                description="This will reset the sprint's status to 'not-started', clear its output, and remove its content from the main design document. This action cannot be undone."
                confirmText="Yes, Revert"
                confirmVariant="danger"
            />
        </>
    );
};
