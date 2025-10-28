import React from 'react';
import { ChevronsRight } from 'lucide-react';
import { Sprint, ToastMessage } from '../types';
import { Button } from './ui';

interface ToolIntegrationProps {
    sprint: Sprint;
    onUpdateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
    setToast: (toast: ToastMessage | null) => void;
}

const TOOLS_LIST = [
    { id: 'solidworks', name: 'SolidWorks', category: 'cad' },
    { id: 'autocad', name: 'AutoCAD', category: 'cad' },
    { id: 'fusion360', name: 'Fusion 360', category: 'cad' },
    { id: 'altium', name: 'Altium Designer', category: 'electronics' },
    { id: 'kicad', name: 'KiCad', category: 'electronics' },
    { id: 'slack', name: 'Slack', category: 'collaboration' },
    { id: 'msteams', name: 'Microsoft Teams', category: 'collaboration' },
];

export const ToolIntegration: React.FC<ToolIntegrationProps> = ({ sprint, onUpdateSprint, setToast }) => {
    
    const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateSprint(sprint.id, { selectedTool: e.target.value || undefined });
    };

    const handleSendToTool = () => {
        const tool = TOOLS_LIST.find(t => t.id === sprint.selectedTool);
        if (tool) {
            setToast({
                message: `Sprint requirements sent to ${tool.name}.`,
                type: 'info'
            });
        }
    };

    return (
        <div className="mt-4 pt-4 border-t dark:border-charcoal-700">
             <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Tool Integration</h5>
             <div className="flex items-center space-x-2">
                 <select
                    value={sprint.selectedTool || ''}
                    onChange={handleToolChange}
                    className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-charcoal-700 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                    disabled={sprint.status === 'completed'}
                 >
                    <option value="">Select a tool...</option>
                    <optgroup label="CAD">
                        {TOOLS_LIST.filter(t => t.category === 'cad').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                    <optgroup label="Electronics">
                         {TOOLS_LIST.filter(t => t.category === 'electronics').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                    <optgroup label="Collaboration">
                         {TOOLS_LIST.filter(t => t.category === 'collaboration').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>
                 </select>
                 <Button
                    size="sm"
                    variant="outline"
                    disabled={!sprint.selectedTool || sprint.status === 'completed'}
                    onClick={handleSendToTool}
                 >
                     <ChevronsRight className="w-4 h-4 mr-2" />
                     Send
                 </Button>
             </div>
        </div>
    );
};