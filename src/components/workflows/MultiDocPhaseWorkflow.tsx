import React, { useState, useEffect } from 'react';
import { Remarkable } from 'remarkable';
import { Play, Check, Combine, Edit3, Save, LoaderCircle, Zap, RotateCcw } from 'lucide-react';
import { Button, Card, ModelBadge } from '../ui';
import { GenerationError } from '../GenerationError';
import { Project, Phase, Sprint, ToastMessage, VersionedOutput } from '../../types';
import { generateSubDocument, generateCompactedContext, generatePreliminaryDesignSprints, selectModel, generateDesignReviewChecklist } from '../../services/geminiService';
import { MarkdownEditor } from '../MarkdownEditor';
import { AttachmentManager } from '../AttachmentManager';
import { PhaseActions } from '../PhaseActions';
import { ToolIntegration } from '../ToolIntegration';
import { DiagramCard } from '../DiagramCard';

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

export const MultiDocPhaseWorkflow = ({ phase, project, onUpdatePhase, onPhaseComplete, setExternalError, onGoToNext, onUpdateProject, setToast }: WorkflowProps) => {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
    const [editedSprintOutput, setEditedSprintOutput] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [isLoadingSprints, setIsLoadingSprints] = useState(false);
    const modelForGeneration = selectModel({ phase });

    useEffect(() => {
        if (typeof Prism !== 'undefined') {
             setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [phase, editingSprintId]);
    
    const handleUpdateSprint = (sprintId: string, updates: Partial<Sprint>) => {
        const updatedSprints = phase.sprints.map(s =>
            s.id === sprintId ? { ...s, ...updates } : s
        );
        onUpdatePhase(phase.id, { sprints: updatedSprints });
    };

    const handleSaveSprint = () => {
        if (!editingSprintId) return;
        const sprint = phase.sprints.find(s => s.id === editingSprintId);
        if (sprint) {
            const newVersion: VersionedOutput = {
                version: (sprint.outputs.length || 0) + 1,
                content: editedSprintOutput,
                reason: 'Manual edit',
                createdAt: new Date()
            };
            handleUpdateSprint(editingSprintId, { outputs: [...sprint.outputs, newVersion] });
        }
        setEditingSprintId(null);
        setEditedSprintOutput('');
    };

    const handleGenerateSubDocument = async (docId: string) => {
        setLoadingDocId(docId);
        setExternalError('');
        const doc = phase.sprints.find(d => d.id === docId);
        if (!doc) return;

        try {
            const output = await generateSubDocument(project, phase, doc);
            const updatedSprints: Sprint[] = phase.sprints.map(d => {
                if (d.id === docId) {
                    const newVersion: VersionedOutput = {
                        version: (d.outputs.length || 0) + 1,
                        content: output,
                        reason: 'Initial generation',
                        createdAt: new Date(),
                    };
                    return { ...d, outputs: [...d.outputs, newVersion], status: 'completed' };
                }
                return d;
            });
            onUpdatePhase(phase.id, { sprints: updatedSprints });
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred during generation.');
        } finally {
            setLoadingDocId(null);
        }
    };
    
    const handleMergeAndComplete = async () => {
        setIsMerging(true);
        setExternalError('');
        const mergedOutput = phase.sprints.map(doc => `## ${doc.name}\n\n${doc.outputs[doc.outputs.length - 1]?.content || 'Not generated.'}`).join('\n\n---\n\n');

        const newVersion: VersionedOutput = {
            version: (phase.outputs.length || 0) + 1,
            content: mergedOutput,
            reason: 'Merged documents from sprints',
            createdAt: new Date(),
        };
        let finalUpdates: Partial<Phase> = { outputs: [...phase.outputs, newVersion] };

        if (phase.name === 'Requirements') {
            try {
                const compactedContext = await generateCompactedContext(project, mergedOutput);
                onUpdateProject({ ...project, compactedContext: compactedContext });
            } catch (error: any) {
                setExternalError(error.message || "Failed to generate compacted project context.");
                setIsMerging(false);
                return;
            }
        }
        
        if (phase.designReview?.required) {
            try {
                const checklist = await generateDesignReviewChecklist(mergedOutput);
                finalUpdates = {
                    ...finalUpdates,
                    status: 'in-review',
                    designReview: { ...phase.designReview, checklist: checklist },
                    reviewStartDate: new Date().toISOString(),
                };
                onUpdatePhase(phase.id, finalUpdates);
                setToast({ message: `${phase.name} committed for review.`, type: 'success' });
            } catch (error: any) {
                 setExternalError(error.message || "Failed to generate design review checklist.");
            } finally {
                setIsMerging(false);
            }
        } else {
            finalUpdates.status = 'completed';
            onUpdatePhase(phase.id, finalUpdates);
            setToast({ message: `${phase.name} phase completed!`, type: 'success' });
            setIsMerging(false);
        }
    };
    
    const handleGenerateDevSprints = async () => {
        setIsLoadingSprints(true);
        setExternalError('');
        try {
            const conceptualDesign = phase.sprints.find(s => s.name === 'Conceptual Design Options')?.outputs.slice(-1)[0]?.content || '';
            const tradeStudy = phase.sprints.find(s => s.name === 'Trade Study Analysis')?.outputs.slice(-1)[0]?.content || '';

            const newSprintsRaw = await generatePreliminaryDesignSprints(project, conceptualDesign, tradeStudy);
            const newSprints: Sprint[] = newSprintsRaw.map((s, i) => ({
                id: `${phase.id}-dev-${i}`,
                name: s.name,
                description: s.description,
                status: 'not-started',
                deliverables: [],
                outputs: []
            }));
            
            onUpdatePhase(phase.id, { sprints: [...phase.sprints, ...newSprints] });
        } catch (error: any) {
            setExternalError(error.message || 'Failed to generate development sprints.');
        } finally {
            setIsLoadingSprints(false);
        }
    };


    const allDocsGenerated = phase.sprints.every(d => d.status === 'completed');
    const isPreliminaryDesign = phase.name === 'Preliminary Design';
    const initialPdDocsComplete = isPreliminaryDesign && phase.sprints.slice(0, 2).every(s => s.status === 'completed');
    const devSprintsGenerated = isPreliminaryDesign && phase.sprints.length > 2;

    return (
        <>
            <Card title="Required Documents" description="Generate each document in sequence to complete this phase.">
                <div className="space-y-4">
                    {phase.sprints.map((doc, index) => {
                        const isLocked = index > 0 && phase.sprints[index - 1].status !== 'completed';
                        return (
                            <div key={doc.id} className={`p-4 rounded-lg border transition-colors duration-300 ${doc.status === 'completed' ? 'border-green-200 dark:border-green-700/50 bg-green-50 dark:bg-green-900/20' : isLocked ? 'bg-gray-100 dark:bg-charcoal-800/50 opacity-60' : 'bg-white dark:bg-charcoal-800/50 dark:border-charcoal-700'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {loadingDocId === doc.id && <LoaderCircle className="w-5 h-5 text-brand-primary animate-spin flex-shrink-0" />}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{index + 1}. {doc.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                        {doc.status === 'completed' ? <Check className="w-5 h-5 text-green-500" /> : (
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleGenerateSubDocument(doc.id)}
                                                    disabled={loadingDocId !== null || isLocked}
                                                >
                                                    {loadingDocId === doc.id ? (
                                                        <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Working...</>
                                                    ) : (
                                                        <><Play className="mr-2 w-4 h-4" />Generate</>
                                                    )}
                                                </Button>
                                                 <ModelBadge modelName={modelForGeneration} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-2">
                                    <textarea
                                        placeholder="Add notes..."
                                        value={doc.notes || ''}
                                        onChange={(e) => handleUpdateSprint(doc.id, { notes: e.target.value })}
                                        className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                                        rows={2}
                                    />
                                </div>
                                <ToolIntegration
                                    sprint={doc}
                                    project={project}
                                    onUpdateProject={onUpdateProject}
                                    setToast={setToast}
                                />
                                <AttachmentManager
                                    sprint={doc}
                                    onUpdateAttachments={(attachments) => handleUpdateSprint(doc.id, { attachments })}
                                />

                                {doc.outputs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t dark:border-charcoal-700">
                                        {editingSprintId === doc.id ? (
                                             <div className="space-y-3">
                                                <MarkdownEditor
                                                    value={editedSprintOutput}
                                                    onChange={setEditedSprintOutput}
                                                />
                                                <div className="flex space-x-2">
                                                    <Button size="sm" onClick={handleSaveSprint}>
                                                        <Save className="mr-2 w-4 h-4" />Save
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setEditingSprintId(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                 <div className="flex justify-end mb-2 space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleGenerateSubDocument(doc.id)} disabled={loadingDocId !== null}>
                                                        {loadingDocId === doc.id ? (
                                                            <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Regenerating...</>
                                                        ) : (
                                                            <><RotateCcw className="mr-2 w-4 h-4" />Regenerate</>
                                                        )}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => { setEditingSprintId(doc.id); setEditedSprintOutput(doc.outputs[doc.outputs.length - 1]?.content || ''); }}>
                                                        <Edit3 className="mr-2 w-4 h-4" />Edit
                                                    </Button>
                                                </div>
                                                <div
                                                    className="bg-gray-50 dark:bg-charcoal-900/50 border dark:border-charcoal-700 rounded-lg p-4 max-h-64 overflow-y-auto prose dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: md.render(doc.outputs[doc.outputs.length - 1]?.content || '') }}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                     {initialPdDocsComplete && !devSprintsGenerated && (
                        <div className="text-center p-4 border-2 border-dashed rounded-lg dark:border-charcoal-700">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Initial designs complete. Generate the next set of development sprints based on this work.</p>
                            <Button onClick={handleGenerateDevSprints} disabled={isLoadingSprints}>
                                {isLoadingSprints ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> : <Zap className="mr-2 w-4 h-4" />}
                                Generate Development Sprints
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {phase.outputs.length > 0 && (
                 <DiagramCard
                    phase={phase}
                    project={project}
                    onUpdatePhase={onUpdatePhase}
                    updateProject={onUpdateProject}
                    setExternalError={setExternalError}
                    setToast={setToast}
                />
            )}
            
            <div className="mt-6">
                {phase.status !== 'completed' ? (
                    <div className="flex justify-end">
                        <Button onClick={handleMergeAndComplete} disabled={!allDocsGenerated || isMerging}>
                            {isMerging ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> : <Combine className="mr-2 w-4 h-4" />}
                            Merge Documents & Complete
                        </Button>
                    </div>
                ) : (
                    <PhaseActions 
                        phase={phase}
                        onMarkComplete={() => {}}
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
                        isCompletable={false}
                        isDownloadDisabled={phase.outputs.length === 0}
                    />
                )}
            </div>
        </>
    );
};