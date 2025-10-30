import React, { useState } from 'react';
import { ProjectHeader } from './ProjectHeader';
import { useProject } from '../context/ProjectContext';
import { Card, Button } from './ui';
import { GitMerge, Cpu, Slack, Users, BrainCircuit, LoaderCircle, Package, Monitor } from 'lucide-react';
import { suggestResources } from '../services/geminiService';

interface IntegrationCardProps {
    icon: React.ReactNode;
    name: string;
    description: string;
}
const IntegrationCard: React.FC<IntegrationCardProps> = ({ icon, name, description }) => (
    <div className="bg-gray-50 dark:bg-charcoal-800/50 p-4 rounded-lg flex items-start space-x-4">
        <div className="text-2xl text-brand-primary">{icon}</div>
        <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <Button size="sm" variant="outline" disabled>Connect</Button>
    </div>
);

const integrations = {
    cad: [
        { name: 'SolidWorks', description: 'Mechanical CAD and CAE.' },
        { name: 'AutoCAD', description: '2D and 3D CAD software.' },
        { name: 'Fusion 360', description: 'Cloud-based CAD, CAM, CAE, and PCB software.' },
    ],
    electronics: [
        { name: 'Altium Designer', description: 'PCB and electronic design automation.' },
        { name: 'KiCad', description: 'Open-source electronics design automation suite.' },
    ],
    collaboration: [
        { name: 'Slack', description: 'Channel-based messaging platform.' },
        { name: 'Microsoft Teams', description: 'Hub for team collaboration in Office 365.' },
    ]
};

export const IntegrationsPage = ({ onBack }) => {
    const { project, theme, setTheme } = useProject();
    const [resources, setResources] = useState<{ software: string[], equipment: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!project) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await suggestResources(project);
            setResources(result);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze resources.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <ProjectHeader
                onGoHome={onBack}
                theme={theme}
                setTheme={setTheme}
                showBackButton
            />
            <div className="mb-6">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations & Resources</h1>
                 <p className="text-gray-600 dark:text-gray-400 mt-1">Identify project resources and connect your favorite engineering tools.</p>
            </div>

            <div className="space-y-6">
                 <Card title="AI-Identified Project Resources" description="Analyze your project documents to identify required software and equipment.">
                    {isLoading ? (
                        <div className="text-center p-8"><LoaderCircle className="w-8 h-8 animate-spin mx-auto text-brand-primary" /></div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4">{error}</div>
                    ) : resources ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center"><Monitor className="w-4 h-4 mr-2 text-brand-secondary"/>Required Software</h4>
                                {resources.software.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {resources.software.map((item, i) => <li key={`sw-${i}`}>{item}</li>)}
                                    </ul>
                                ) : <p className="text-sm text-gray-500">No specific software identified.</p>}
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center"><Package className="w-4 h-4 mr-2 text-brand-secondary"/>Required Equipment</h4>
                                 {resources.equipment.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {resources.equipment.map((item, i) => <li key={`eq-${i}`}>{item}</li>)}
                                    </ul>
                                 ) : <p className="text-sm text-gray-500">No specific equipment identified.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Let an AI analyze your project docs to create a list of necessary tools and hardware.</p>
                            <Button onClick={handleAnalyze}>
                                <BrainCircuit className="w-4 h-4 mr-2" /> Analyze for Resources
                            </Button>
                        </div>
                    )}
                </Card>

                <Card title="Available Integrations (Examples)" description="Connect your favorite engineering tools to streamline your workflow.">
                    <div className="space-y-3">
                        {integrations.cad.map(tool => <IntegrationCard key={tool.name} icon={<GitMerge />} name={tool.name} description={tool.description} />)}
                        {integrations.electronics.map(tool => <IntegrationCard key={tool.name} icon={<Cpu />} name={tool.name} description={tool.description} />)}
                        <IntegrationCard icon={<Slack />} name="Slack" description="Channel-based messaging platform." />
                        <IntegrationCard icon={<Users />} name="Microsoft Teams" description="Hub for team collaboration in Office 365." />
                    </div>
                </Card>
            </div>
        </div>
    );
};