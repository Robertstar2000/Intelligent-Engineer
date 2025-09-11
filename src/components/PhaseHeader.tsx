import React from 'react';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import { Badge } from './ui';

const getStatusIcon = (status) => {
    switch (status) {
        case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
        default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
};

export const PhaseHeader = ({ phase, disciplines }) => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {getStatusIcon(phase.status)}
                <h1 className="text-2xl font-bold">{phase.name}</h1>
            </div>
            <Badge variant={phase.status === 'completed' ? 'success' : phase.status === 'in-progress' ? 'warning' : 'default'}>
                {phase.status.replace('-', ' ')}
            </Badge>
        </div>
        <p className="text-blue-100 mt-2">{phase.description}</p>
        {disciplines.length > 0 && <p className="text-blue-200 text-sm mt-1">Disciplines: {disciplines.join(', ')}</p>}
    </div>
);
