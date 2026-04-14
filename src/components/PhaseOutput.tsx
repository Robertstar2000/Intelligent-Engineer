
import React, { useState, useEffect } from 'react';
import { Sliders, Edit3, Save, LoaderCircle, GitCommit, Clock, ArrowRightLeft, Sparkles, Send, X, AlertCircle } from 'lucide-react';
import { Button, Card, ModelBadge } from './ui';
import { Remarkable } from 'remarkable';
import { Project, Phase, VersionedOutput } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { compareDocumentVersions, refinePhaseOutput } from '../services/geminiService';
import { useProject } from '../context/ProjectContext';

declare const Prism: any;

const md = new Remarkable({
    html: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try {
                return Prism.highlight(str, Prism.languages[lang], lang);
            } catch (e) {
                console.error(e);
            }
        }
        return '';
    },
});

interface VersionHistoryProps {
    versions: VersionedOutput[];
    selectedVersion: number;
    onSelectVersion: (version: number) => void;
    onCompare: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, selectedVersion, onSelectVersion, onCompare }) => (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-charcoal-900/50 p-2 rounded-md overflow-x-auto max-w-full">
        <GitCommit className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <select
            value={selectedVersion}
            onChange={(e) => onSelectVersion(Number(e.target.value))}
            className="text-xs border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary min-w-[120px]"
        >
            {versions.map((v) => (
                <option key={v.version} value={v.version}>v{v.version} - {v.reason.substring(0, 20)}...</option>
            ))}
        </select>
        {versions.length > 1 && (
            <Button size="sm" variant="ghost" onClick={onCompare} className="whitespace-nowrap px-1">
                <ArrowRightLeft className="w-3 h-3" />
            </Button>
        )}
    </div>
);

interface PhaseOutputProps {
    phase: Phase;
    onGenerate: (reason: string) => void;
    onSave: (output: string, reason: string) => void;
    isLoading: boolean;
    isEditable?: boolean;
    apiKey: string | null;
    modelName: string;
}

export const PhaseOutput = ({ phase, onGenerate, onSave, isLoading, isEditable = true, apiKey, modelName }: PhaseOutputProps) => {
    const { project } = useProject();
    const [isEditing, setIsEditing] = useState(false);
    const [editedOutput, setEditedOutput] = useState('');
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(phase.outputs.length > 0 ? phase.outputs.length - 1 : -1);
    const [refineText, setRefineText] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const latestVersion = phase.outputs[phase.outputs.length - 1];
    const displayedVersion = phase.outputs[selectedVersionIndex] || latestVersion;

    useEffect(() => {
        const newIndex = phase.outputs.length - 1;
        if (newIndex !== selectedVersionIndex) {
            setSelectedVersionIndex(newIndex);
        }
    }, [phase.outputs.length]);

    const handleSave = () => {
        onSave(editedOutput, 'Manual edit');
        setIsEditing(false);
    };

    const handleRefine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refineText.trim() || !project || !displayedVersion) return;
        setIsRefining(true);
        setError(null);
        try {
            const refined = await refinePhaseOutput(project, phase, displayedVersion.content, refineText);
            onSave(refined, `AI Refinement: ${refineText}`);
            setRefineText('');
        } catch (err: any) {
            setError(err.message || "Failed to refine content. The AI may be experiencing high load.");
            console.error(err);
        } finally {
            setIsRefining(false);
        }
    };

    if (!latestVersion) {
        return (
            <Card title="Phase Output" description="AI-generated deliverables for this phase">
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No output generated yet.</p>
                    <div className="inline-flex flex-col items-center gap-2">
                        <Button onClick={() => onGenerate('Initial generation')} disabled={!apiKey || isLoading}>
                            {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> : <Sliders className="mr-2 w-4 h-4" />}
                            Generate Output with AI
                        </Button>
                        <ModelBadge modelName={modelName} />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Phase Output" description="Collaborate with AI to refine this technical documentation">
            <div className="space-y-4">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <VersionHistory
                        versions={phase.outputs}
                        selectedVersion={displayedVersion?.version || 0}
                        onSelectVersion={(v) => setSelectedVersionIndex(phase.outputs.findIndex(o => o.version === v))}
                        onCompare={() => {}}
                    />
                    <div className="flex items-center space-x-2">
                        {isEditable && !isEditing && (
                            <Button variant="outline" size="sm" onClick={() => { setEditedOutput(displayedVersion.content); setIsEditing(true); }}>
                                <Edit3 className="mr-2 w-4 h-4" />Edit
                            </Button>
                        )}
                        {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4"/></Button>
                        )}
                        {!isEditing && (
                            <div className="inline-flex flex-col items-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => onGenerate('Regeneration')} disabled={!apiKey || isLoading}>
                                    {isLoading ? <LoaderCircle className="mr-2 w-4 h-4 animate-spin" /> : <Sliders className="mr-2 w-4 h-4" />}
                                    Full Refresh
                                </Button>
                                <ModelBadge modelName={modelName} />
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:opacity-70"><X className="w-4 h-4"/></button>
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {isEditing ? (
                        <div className="p-4 space-y-3">
                            <MarkdownEditor value={editedOutput} onChange={setEditedOutput} />
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave}><Save className="mr-2 w-4 h-4" />Save Version</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 overflow-y-auto max-h-[60vh] prose dark:prose-invert max-w-none">
                            {displayedVersion && (
                                <>
                                    {selectedVersionIndex !== phase.outputs.length - 1 && (
                                        <div className="p-2 mb-4 text-xs bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-yellow-800 dark:text-yellow-200 flex items-center">
                                            <Clock className="w-3 h-3 mr-2" /> Viewing past version: {displayedVersion.reason}
                                        </div>
                                    )}
                                    <div dangerouslySetInnerHTML={{ __html: md.render(displayedVersion.content || '') }} />
                                </>
                            )}
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <form onSubmit={handleRefine} className="flex items-center space-x-2 bg-white dark:bg-charcoal-800 border dark:border-charcoal-700 p-2 rounded-lg shadow-sm">
                        <div className="p-1 px-2 text-brand-primary flex items-center">
                            {isRefining ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <input
                            type="text"
                            value={refineText}
                            onChange={(e) => setRefineText(e.target.value)}
                            placeholder="Prompt AI to refine content... (e.g. 'Add a risks section')"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 placeholder-gray-400 dark:placeholder-gray-500"
                            disabled={isRefining || isLoading}
                        />
                        <Button type="submit" size="sm" disabled={isRefining || isLoading || !refineText.trim()} className="!p-2">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                )}
            </div>
        </Card>
    );
};
