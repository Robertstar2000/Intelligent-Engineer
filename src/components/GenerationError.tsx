import React from 'react';
import { X } from 'lucide-react';

export const GenerationError = ({ message }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-500/30">
        <div className="flex items-center">
            <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Generation Error</h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                    <p>{message}</p>
                </div>
            </div>
        </div>
    </div>
);