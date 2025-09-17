import React from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { Button } from './ui';

export const PhaseActions = ({ phase, onMarkComplete, onDownload, isCompletable = true, reviewRequired = false, isDownloadDisabled = false }) => (
    <div className="flex justify-between">
        <Button variant="outline" onClick={onDownload} disabled={isDownloadDisabled}>
            <Download className="mr-2 w-4 h-4" />Download Documentation
        </Button>
        {phase.status !== 'completed' && (
            <Button onClick={onMarkComplete} disabled={!isCompletable}>
                {reviewRequired ? (
                    <>Commit for Design Review <CheckCircle className="ml-2 w-4 h-4" /></>
                ) : (
                    <>Mark Phase Complete <CheckCircle className="ml-2 w-4 h-4" /></>
                )}
            </Button>
        )}
    </div>
);