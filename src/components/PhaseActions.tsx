import React from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { Button } from './ui';

export const PhaseActions = ({ phase, onMarkComplete, onDownload, isCompletable = true }) => (
    <div className="flex justify-between">
        <Button variant="outline" onClick={onDownload} disabled={!phase.output}>
            <Download className="mr-2 w-4 h-4" />Download Documentation
        </Button>
        {phase.output && phase.status !== 'completed' && (
            <Button onClick={onMarkComplete} disabled={!isCompletable}>
                <>Mark Phase Complete <CheckCircle className="ml-2 w-4 h-4" /></>
            </Button>
        )}
    </div>
);