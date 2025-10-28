import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, Hourglass, Edit3, Save, X } from 'lucide-react';
import { Badge, Button } from './ui';
import { Phase } from '../types';

const getStatusIcon = (status: Phase['status']) => {
    switch (status) {
        case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
        case 'in-review': return <Hourglass className="w-5 h-5 text-brand-primary" />;
        default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
};

interface PhaseHeaderProps {
    phase: Phase;
    disciplines: string[];
    onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
}

export const PhaseHeader = ({ phase, disciplines, onUpdatePhase }: PhaseHeaderProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(phase.name);
    const [editedDescription, setEditedDescription] = useState(phase.description);

    const handleSave = () => {
        onUpdatePhase(phase.id, { name: editedName, description: editedDescription });
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditedName(phase.name);
        setEditedDescription(phase.description);
        setIsEditing(false);
    };

    const isEditable = phase.status !== 'completed';

    return (
        <div className="bg-charcoal-800 text-white p-6 rounded-lg shadow-lg border border-charcoal-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {getStatusIcon(phase.status)}
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="text-2xl font-bold bg-transparent border-b-2 border-brand-primary/50 focus:outline-none focus:border-white"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold">{phase.name}</h1>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {isEditable && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-white hover:bg-white/10">
                            <Edit3 className="w-4 h-4" />
                        </Button>
                    )}
                    <Badge variant={phase.status === 'completed' ? 'success' : phase.status === 'in-progress' ? 'warning' : phase.status === 'in-review' ? 'info' : 'default'}>
                        {phase.status.replace('-', ' ')}
                    </Badge>
                </div>
            </div>
            {isEditing ? (
                 <div className="mt-2">
                    <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full text-gray-300 bg-transparent border-b-2 border-brand-primary/50 focus:outline-none focus:border-white text-sm"
                        rows={2}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <Button size="sm" onClick={handleSave} className="bg-brand-primary text-charcoal-900 hover:bg-brand-primary/90">
                            <Save className="w-4 h-4 mr-2" /> Save
                        </Button>
                         <Button size="sm" variant="ghost" onClick={handleCancel} className="text-white hover:bg-white/10">
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-gray-300 mt-2">{phase.description}</p>
                    {disciplines.length > 0 && <p className="text-gray-400 text-sm mt-1">Disciplines: {disciplines.join(', ')}</p>}
                </>
            )}
        </div>
    );
};