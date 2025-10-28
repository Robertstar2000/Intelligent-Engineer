import React, { useState, useEffect } from 'react';
import { Sliders, Edit3, Save } from 'lucide-react';
import { Button, Card } from './ui';
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
}

export const PhaseOutput = ({ phase, onGenerate, onSave, isLoading, isEditable = true, apiKey }: PhaseOutputProps) => {
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
                        <Button onClick={onGenerate} disabled={!apiKey || isLoading}>
                            {isLoading ? (
                                <><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Generating...</>
                            ) : (
                                <><Sliders className="mr-2 w-4 h-4" />Generate Output with AI</>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold dark:text-white">Generated Content</h4>
                            <div className="flex space-x-2">
                                {!isEditing && isEditable && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit3 className="mr-2 w-4 h-4" />Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onGenerate} disabled={!apiKey || isLoading}>
                                            {isLoading ? (
                                                <><div className="mr-2 w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>Regenerating...</>
                                            ) : (
                                                <><Sliders className="mr-2 w-4 h-4" />Regenerate</>
                                            )}
                                        </Button>
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