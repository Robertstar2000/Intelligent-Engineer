import React, { useState, useEffect } from 'react';
import { Play, Check, LoaderCircle, GitBranch, Lock, RotateCcw } from 'lucide-react';
import { Remarkable } from 'remarkable';
import { Button, Card, ModelBadge } from '../ui';
import { GenerationError } from '../GenerationError';
import { Project, Phase, Sprint, ToastMessage } from '../../types';
import { generateCriticalDesignSprints, generateSprintSpecification, selectModel } from '../../services/geminiService';
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
    setToast: (toast: ToastMessage | null) => void;
}

export const CriticalDesignPhaseWorkflow = ({ phase, project, onUpdatePhase, onPhaseComplete, setExternalError, onGoToNext, onUpdateProject, setToast }: WorkflowProps) => {
    const [isLoading, setIsLoading] = useState<string | null>(null); // can be 'initial', sprintId, or null
    const [sprintToRevert, setSprintToRevert] = useState<Sprint | null>(null);
    const modelForInitialSpec = selectModel({ taskType: 'criticalSprints' });
    const modelForSprintSpec = selectModel({ phase });
    
    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase]);

    const handleGenerateInitialSpecAndSprints = async () => {
        setIsLoading('initial');
        setExternalError('');
        try {
            const { preliminarySpec, sprints } = await generateCriticalDesignSprints(project, phase);
            onUpdatePhase(phase.id, { output: preliminarySpec, sprints: sprints, status: 'in-progress' });
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
            const updatedSprints = phase.sprints.map(s =>
                s.id === sprintId ? { ...s, output: technicalSpec, deliverables: deliverables } : s
            );
            onUpdatePhase(phase.id, { sprints: updatedSprints });
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(null);
        }
    };
    
    const handleAcceptAndMerge = (sprintId: string) => {
        const sprint = phase.sprints.find(s => s.id === sprintId);
        if (!sprint || !sprint.output) return;

        const updatedOutput = `${phase.output || ''}\n\n---\n\n### Completed Sprint: ${sprint.name}\n\n**Technical Specification:**\n\n${sprint.output}`;
        const updatedSprints: Sprint[] = phase.sprints.map(s =>
            s.id === sprintId ? { ...s, status: 'completed' } : s
        );
        onUpdatePhase(phase.id, { output: updatedOutput, sprints: updatedSprints });
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
            // This assumes sprints are processed in array order, so the last one is the most recent.
            const lastCompletedSprint = completedSprints[completedSprints.length - 1];
            setSprintToRevert(lastCompletedSprint);
        }
    };
    
    const handleConfirmRevert = () => {
        if (!sprintToRevert || !sprintToRevert.output) return;

        const revertMarker = `\n\n---\n\n### Completed Sprint: ${sprintToRevert.name}\n\n**Technical Specification:**\n\n${sprintToRevert.output}`;
        const updatedOutput = phase.output?.replace(revertMarker, '') || '';
        
        // FIX: Add explicit type to the map function's return value to prevent type widening.
        const updatedSprints = phase.sprints.map((s): Sprint => 
            s.id === sprintToRevert.id ? { ...s, status: 'not-started', output: '', deliverables: [] } : s
        );
        
        onUpdatePhase(phase.id, { output: updatedOutput, sprints: updatedSprints });
        setToast({ message: `Reverted sprint: ${sprintToRevert.name}`, type: 'info' });
        setSprintToRevert(null);
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
                    dangerouslySetInnerHTML={{ __html: md.render(phase.output || '') }}
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
                                       {!sprint.output && sprint.status !== 'completed' && (
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
                                <ToolIntegration
                                    sprint={sprint}
                                    project={project}
                                    onUpdateProject={onUpdateProject}
                                    setToast={setToast}
                                />
                                <AttachmentManager
                                    sprint={sprint}
                                    onUpdateAttachments={(attachments) => handleUpdateSprint(sprint.id, { attachments })}
                                />
                               
                               {sprint.output && (
                                   <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                       <div className="text-sm text-gray-800 dark:text-gray-200">
                                           <h5 className="font-semibold mb-1">Key Deliverables:</h5>
                                           <ul className="list-disc list-inside">
                                              {sprint.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                                           </ul>
                                       </div>
                                        <div className="mt-2 bg-gray-50 dark:bg-charcoal-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: md.render(sprint.output || '') }}
                                        />
                                        {sprint.status !== 'completed' && (
                                            <div className="mt-2 flex justify-end items-center space-x-2">
                                                <div className="flex items-center space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleGenerateSprintSpec(sprint.id)} disabled={!!isLoading}>
                                                        {isLoading === sprint.id ? (
                                                            <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Regenerating...</>
                                                        ) : 'Regenerate'}
                                                    </Button>
                                                     <ModelBadge modelName={modelForSprintSpec} />
                                                </div>
                                                <Button size="sm" onClick={() => handleAcceptAndMerge(sprint.id)} disabled={!!isLoading}>
                                                    Accept & Merge
                                                </Button>
                                            </div>
                                        )}
                                   </div>
                               )}
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6">
                    {phase.status !== 'completed' ? (
                        <div className="flex justify-between items-center">
                            <Button variant="outline" onClick={handleRevertLastSprint} disabled={completedSprintIds.size === 0 || !!isLoading}>
                                <RotateCcw className="mr-2 w-4 h-4" /> Revert Last Sprint
                            </Button>
                            <Button onClick={onPhaseComplete} disabled={!allSprintsAccepted || !!isLoading}>
                                <Check className="mr-2 w-4 h-4" /> Commit for Design Review
                            </Button>
                        </div>
                    ) : (
                        <PhaseActions 
                            phase={phase}
                            onMarkComplete={() => {}}
                            onDownload={() => {
                                if (phase.output) {
                                    const blob = new Blob([phase.output], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${project.name}_${phase.name}.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }
                            }}
                            onGoToNext={onGoToNext}
                            isCompletable={false}
                            isDownloadDisabled={!phase.output}
                        />
                    )}
                </div>
            </Card>
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