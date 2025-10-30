import React, { useState, useEffect } from 'react';
import { Sliders, Edit3, Save, LoaderCircle } from 'lucide-react';
import { Button, Card, ModelBadge } from './ui';
import { Remarkable } from 'remarkable';
import { Phase } from '../types';
import { MarkdownEditor } from './MarkdownEditor';

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

interface PhaseOutputProps {
    phase: Phase;
    onGenerate: () => void;
    onSave: (output: string) => void;
    isLoading: boolean;
    isEditable?: boolean;
    apiKey: string | null;
    modelName: string;
}

export const PhaseOutput = ({ phase, onGenerate, onSave, isLoading, isEditable = true, apiKey, modelName }: PhaseOutputProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedOutput, setEditedOutput] = useState(phase.output || '');

    useEffect(() => {
        setEditedOutput(phase.output || '');
    }, [phase.output]);

    useEffect(() => {
        if (!isEditing && phase.output && typeof Prism !== 'undefined') {
            // Use a timeout to ensure DOM is updated before re-running Prism
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isEditing, phase.output]);

    const handleSave = () => {
        onSave(editedOutput);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedOutput(phase.output || '');
    };

    return (
        <Card title="Phase Output" description="AI-generated deliverables for this phase">
            <div className="space-y-4">
                {!phase.output ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">No output generated yet.</p>
                        <div className="inline-flex flex-col items-center gap-2">
                            <Button onClick={onGenerate} disabled={!apiKey || isLoading}>
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
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold dark:text-white">Generated Content</h4>
                            <div className="flex items-center space-x-2">
                                {!isEditing && isEditable && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit3 className="mr-2 w-4 h-4" />Edit
                                        </Button>
                                        <div className="inline-flex flex-col items-end gap-1">
                                            <Button variant="outline" size="sm" onClick={onGenerate} disabled={!apiKey || isLoading}>
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
                            <div
                                className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: md.render(phase.output || '') }}
                            />
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};