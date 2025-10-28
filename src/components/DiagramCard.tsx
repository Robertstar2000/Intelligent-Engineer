import React, { useState } from 'react';
import { Image as ImageIcon, Download, LoaderCircle, RefreshCw } from 'lucide-react';
import { Button, Card } from './ui';
import { Phase } from '../types';
import { generateDiagram } from '../services/geminiService';

interface DiagramCardProps {
    phase: Phase;
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
    setExternalError: (message: string) => void;
}

export const DiagramCard: React.FC<DiagramCardProps> = ({ phase, onUpdatePhase, setExternalError }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!phase.output) return;
        setIsLoading(true);
        setExternalError('');
        try {
            const diagramUrl = await generateDiagram(phase.output);
            onUpdatePhase(phase.id, { diagramUrl });
        } catch (error: any) {
            setExternalError(error.message || 'An unknown error occurred during diagram generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!phase.diagramUrl) return;
        const a = document.createElement('a');
        a.href = phase.diagramUrl;
        a.download = `diagram_${phase.name.toLowerCase().replace(/ /g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    return (
        <Card title="Visual Summary" description="An AI-generated diagram summarizing the phase documentation.">
            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-charcoal-800 rounded-lg">
                    <div className="text-center">
                        <LoaderCircle className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Generating diagram...</p>
                    </div>
                </div>
            ) : phase.diagramUrl ? (
                <div className="space-y-4">
                    <img src={phase.diagramUrl} alt={`${phase.name} Diagram`} className="rounded-lg border dark:border-charcoal-700 w-full" />
                    <div className="flex justify-end space-x-2">
                         <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="mr-2 w-4 h-4" /> Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleGenerate}>
                            <RefreshCw className="mr-2 w-4 h-4" /> Regenerate
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Generate a visual diagram from the phase output.</p>
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        <ImageIcon className="mr-2 w-4 h-4" /> Generate Diagram
                    </Button>
                </div>
            )}
        </Card>
    );
};