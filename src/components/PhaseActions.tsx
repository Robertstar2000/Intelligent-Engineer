import React from 'react';
import { Download, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from './ui';
import { Phase } from '../types';

interface PhaseActionsProps {
    phase: Phase;
    onMarkComplete: () => void;
    onDownload: () => void;
    onGoToNext: () => void;
    isCompletable?: boolean;
    reviewRequired?: boolean;
    isDownloadDisabled?: boolean;
}

export const PhaseActions = ({ phase, onMarkComplete, onDownload, onGoToNext, isCompletable = true, reviewRequired = false, isDownloadDisabled = false }: PhaseActionsProps) => (
    <div className="flex justify-between">
        <Button variant="outline" onClick={onDownload} disabled={isDownloadDisabled}>
            <Download className="mr-2 w-4 h-4" />Download Documentation
        </Button>
        {phase.status !== 'completed' ? (
            <Button onClick={onMarkComplete} disabled={!isCompletable}>
                {reviewRequired ? (
                    <>Commit for Design Review <CheckCircle className="ml-2 w-4 h-4" /></>
                ) : (
                    <>Mark Phase Complete <CheckCircle className="ml-2 w-4 h-4" /></>
                )}
            </Button>
        ) : (
             <Button onClick={onGoToNext}>
                Next Phase <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
        )}
    </div>
);