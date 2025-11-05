

import React from 'react';
import { Remarkable } from 'remarkable';
import { Check } from 'lucide-react';
import { Button, Card } from '../ui';
import { Phase, ToastMessage } from '../../types';

declare const Prism: any;

const md = new Remarkable({
    html: true, typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try { return Prism.highlight(str, Prism.languages[lang], lang); } catch (e) { console.error(e); }
        }
        return '';
    },
});

interface WorkflowProps {
    phase: Phase;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    onPhaseComplete: () => void;
    onGoToNext: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const DesignReviewWorkflow = ({ phase, onUpdatePhase, onPhaseComplete, onGoToNext, setToast }: WorkflowProps) => {
    const handleChecklistChange = (itemId: string) => {
        if (!phase.designReview) return;
        const newChecklist = phase.designReview.checklist.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        onUpdatePhase(phase.id, { designReview: { ...phase.designReview, checklist: newChecklist } });
    };

    const handleFinalizeReview = () => {
        const updates: Partial<Phase> = { status: 'completed' };
        if (phase.sprints?.length > 0) {
            updates.sprints = phase.sprints.map(s => ({ ...s, status: 'completed' }));
        }
        onUpdatePhase(phase.id, updates);
        
        setToast({ message: 'Design review complete! Advancing to the next phase.', type: 'success' });
        
        onPhaseComplete();

        setTimeout(() => {
            onGoToNext();
        }, 1500);
    };
    
    const allChecked = phase.designReview?.checklist.every(item => item.checked);

    return (
        <>
            <Card title="Phase Output for Review" description="This is the generated document pending approval.">
                 <div className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(phase.output || '') }}
                />
            </Card>
            <Card title="Design Review" description="Verify all success factors are met before proceeding. The project cannot advance until this review is complete.">
                <div className="space-y-3">
                    {phase.designReview?.checklist.map((item) => (
                        <label key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleChecklistChange(item.id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-gray-800 dark:text-gray-300 flex-1">{item.text}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleFinalizeReview} disabled={!allChecked}>
                        <Check className="mr-2 w-4 h-4" />Finalize Review & Complete Phase
                    </Button>
                </div>
            </Card>
        </>
    );
};