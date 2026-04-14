import React from 'react';
import { Download, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from './ui';
import { Phase } from '../types';

interface PhaseActionsProps {
    phase: Phase;
    onMarkComplete: () => void;
    onDownload: () => void;
    onGoToNext: () => void;
    onPackageAll?: () => void;
    isLastPhase?: boolean;
    isCompletable?: boolean;
    reviewRequired?: boolean;
    isDownloadDisabled?: boolean;
}

export const PhaseActions = ({ 
    phase, 
    onMarkComplete, 
    onDownload, 
    onGoToNext, 
    onPackageAll,
    isLastPhase = false,
    isCompletable = true, 
    reviewRequired = false, 
    isDownloadDisabled = false 
}: PhaseActionsProps) => (
    <div className="flex justify-between items-center bg-gray-50 dark:bg-charcoal-800 p-4 rounded-lg border border-gray-200 dark:border-charcoal-700">
        <Button variant="outline" onClick={onDownload} disabled={isDownloadDisabled}>
            <Download className="mr-2 w-4 h-4" />Download Documentation
        </Button>
        
        <div className="flex space-x-3">
            {phase.status !== 'completed' ? (
                <Button onClick={onMarkComplete} disabled={!isCompletable} className="bg-green-600 hover:bg-green-700 text-white">
                    {reviewRequired ? (
                        <>Commit for Design Review <CheckCircle className="ml-2 w-4 h-4" /></>
                    ) : (
                        <>Accept and Progress <ChevronRight className="ml-2 w-4 h-4" /></>
                    )}
                </Button>
            ) : (
                <>
                    {isLastPhase ? (
                        <Button onClick={onPackageAll} className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                            <Download className="mr-2 w-4 h-4" /> Package and Download All Results
                        </Button>
                    ) : (
                        <Button onClick={onGoToNext} variant="primary">
                            Next Phase <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    )}
                </>
            )}
        </div>
    </div>
);