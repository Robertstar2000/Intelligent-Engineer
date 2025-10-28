import React from 'react';
import { ProjectHeader } from './ProjectHeader';
import { useProject } from '../context/ProjectContext';
import { Card, Button } from './ui';
import { GitMerge, Cpu, Slack, Users } from 'lucide-react';

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
    const { theme, setTheme } = useProject();

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <ProjectHeader
                onGoHome={onBack}
                theme={theme}
                setTheme={setTheme}
                showBackButton
            />
            <div className="mb-6">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
                 <p className="text-gray-600 dark:text-gray-400 mt-1">Connect your favorite engineering tools to streamline your workflow.</p>
            </div>

            <div className="space-y-6">
                <Card title="Design & CAD" description="Sync design files and parameters.">
                    <div className="space-y-3">
                        {integrations.cad.map(tool => <IntegrationCard key={tool.name} icon={<GitMerge />} name={tool.name} description={tool.description} />)}
                    </div>
                </Card>
                 <Card title="Electronics & PCB" description="Integrate with electronic design automation (EDA) tools.">
                    <div className="space-y-3">
                        {integrations.electronics.map(tool => <IntegrationCard key={tool.name} icon={<Cpu />} name={tool.name} description={tool.description} />)}
                    </div>
                </Card>
                 <Card title="Collaboration" description="Send updates and notifications to your team's communication channels.">
                    <div className="space-y-3">
                        <IntegrationCard icon={<Slack />} name="Slack" description="Channel-based messaging platform." />
                        <IntegrationCard icon={<Users />} name="Microsoft Teams" description="Hub for team collaboration in Office 365." />
                    </div>
                </Card>
            </div>
        </div>
    );
};
