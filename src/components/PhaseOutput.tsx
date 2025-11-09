import React, { useState, useEffect } from 'react';
import { Sliders, Edit3, Save, LoaderCircle, GitCommit, Clock, ArrowRightLeft } from 'lucide-react';
import { Button, Card, ModelBadge } from './ui';
import { Remarkable } from 'remarkable';
import { Phase, VersionedOutput } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { compareDocumentVersions } from '../services/geminiService';

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
        return ''; // use an empty string for no highlight
    },
});

interface VersionHistoryProps {
    versions: VersionedOutput[];
    selectedVersion: number;
    onSelectVersion: (version: number) => void;
    onCompare: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, selectedVersion, onSelectVersion, onCompare }) => (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-charcoal-900/50 p-2 rounded-md">
        <GitCommit className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">Version:</span>
        <select
            value={selectedVersion}
            onChange={(e) => onSelectVersion(Number(e.target.value))}
            className="text-sm border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
        >
            {versions.map((v) => (
                <option key={v.version} value={v.version}>
                    v{v.version} ({new Date(v.createdAt).toLocaleDateString()}) - {v.reason.substring(0, 30)}...
                </option>
            ))}
        </select>
        {versions.length > 1 && (
            <Button size="sm" variant="ghost" onClick={onCompare}>
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Compare
            </Button>
        )}
    </div>
);

interface VersionComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    versions: VersionedOutput[];
}

const VersionComparisonModal: React.FC<VersionComparisonModalProps> = ({ isOpen, onClose, versions }) => {
    const [versionAIndex, setVersionAIndex] = useState(versions.length > 1 ? versions.length - 2 : 0);
    const [versionBIndex, setVersionBIndex] = useState(versions.length - 1);
    const [comparison, setComparison] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setComparison('');
    }, [versionAIndex, versionBIndex]);

    const handleCompare = async () => {
        setIsLoading(true);
        setComparison('');
        try {
            const versionA = versions[versionAIndex];
            const versionB = versions[versionBIndex];
            const result = await compareDocumentVersions(versionA.content, versionB.content, versionA.reason, versionB.reason);
            setComparison(result);
        } catch (error) {
            setComparison('Error generating comparison.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card title="Compare Document Versions" className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium">Version A</label>
                        <select value={versionAIndex} onChange={e => setVersionAIndex(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600">
                            {versions.map((v, i) => <option key={i} value={i}>v{v.version} - {v.reason}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Version B</label>
                        <select value={versionBIndex} onChange={e => setVersionBIndex(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600">
                            {versions.map((v, i) => <option key={i} value={i}>v{v.version} - {v.reason}</option>)}
                        </select>
                    </div>
                </div>
                <Button onClick={handleCompare} disabled={isLoading || versionAIndex === versionBIndex}>
                    {isLoading ? <LoaderCircle className="animate-spin" /> : 'Compare'}
                </Button>
                {comparison && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-charcoal-900/50 rounded-lg max-h-96 overflow-y-auto">
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(comparison) }} />
                    </div>
                )}
            </Card>
        </div>
    );
};


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
    const [isEditing, setIsEditing] = useState(false);
    const [editedOutput, setEditedOutput] = useState('');
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(phase.outputs.length - 1);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    const latestVersion = phase.outputs[phase.outputs.length - 1];
    const displayedVersion = phase.outputs[selectedVersionIndex];

    useEffect(() => {
        const newIndex = phase.outputs.length - 1;
        if (newIndex !== selectedVersionIndex) {
            setSelectedVersionIndex(newIndex);
        }
    }, [phase.outputs]);

    useEffect(() => {
        if (!isEditing && displayedVersion?.content && typeof Prism !== 'undefined') {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isEditing, displayedVersion]);

    const handleSave = () => {
        onSave(editedOutput, 'Manual edit');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };
    
    const handleEdit = () => {
        // When editing, always edit the latest version
        setSelectedVersionIndex(phase.outputs.length - 1);
        setEditedOutput(latestVersion?.content || '');
        setIsEditing(true);
    };

    const isViewingOldVersion = selectedVersionIndex !== phase.outputs.length - 1;

    return (
        <Card title="Phase Output" description="AI-generated deliverables for this phase">
            <div className="space-y-4">
                {!latestVersion ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">No output generated yet.</p>
                        <div className="inline-flex flex-col items-center gap-2">
                            <Button onClick={() => onGenerate('Initial generation')} disabled={!apiKey || isLoading}>
                                {isLoading ? (
                                    <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Generating...</>
                                ) : (
                                    <><Sliders className="mr-2 w-4 h-4" />Generate Output with AI</>
                                )}
                            </Button>
                            <ModelBadge modelName={modelName} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <VersionHistory
                                versions={phase.outputs}
                                selectedVersion={displayedVersion.version}
                                onSelectVersion={(v) => setSelectedVersionIndex(phase.outputs.findIndex(o => o.version === v))}
                                onCompare={() => setIsCompareModalOpen(true)}
                            />
                            <div className="flex items-center space-x-2">
                                {!isEditing && isEditable && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleEdit}>
                                            <Edit3 className="mr-2 w-4 h-4" />Edit
                                        </Button>
                                        <div className="inline-flex flex-col items-end gap-1">
                                            <Button variant="outline" size="sm" onClick={() => onGenerate('Regeneration')} disabled={!apiKey || isLoading}>
                                                {isLoading ? (
                                                    <><LoaderCircle className="mr-2 w-4 h-4 animate-spin" />Regenerating...</>
                                                ) : (
                                                    <><Sliders className="mr-2 w-4 h-4" />Regenerate</>
                                                )}
                                            </Button>
                                            <ModelBadge modelName={modelName} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <MarkdownEditor
                                    value={editedOutput}
                                    onChange={setEditedOutput}
                                />
                                <div className="flex space-x-2">
                                    <Button size="sm" onClick={handleSave}>
                                        <Save className="mr-2 w-4 h-4" />Save Changes
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {isViewingOldVersion && (
                                    <div className="p-2 mb-2 text-sm bg-yellow-100 dark:bg-yellow-900/50 rounded-md flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                                        <span>You are viewing a past version of this document.</span>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <strong>Reason for v{displayedVersion.version}:</strong> {displayedVersion.reason}
                                </div>
                                <div
                                    className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: md.render(displayedVersion.content || '') }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            <VersionComparisonModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} versions={phase.outputs} />
        </Card>
    );
};