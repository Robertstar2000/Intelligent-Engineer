import React from 'react';
import { Card } from './ui';

const AI_PROFILES = [
    {
        name: 'Balanced',
        icon: '⚖️',
        description: 'A good mix of all attributes for general purpose use.',
        settings: {
            clarity: 65, technicality: 60, foresight: 60, riskAversion: 60, userCentricity: 65, conciseness: 50,
            creativity: 60, costOptimization: 60, performanceBias: 60, modularity: 60,
            technicalDepth: 70, failureAnalysis: 65, manufacturability: 65, standardsAdherence: 70,
            coverage: 75, edgeCaseFocus: 65, automationPriority: 70, destructiveTesting: 30,
            phasedRollout: 70, rollbackPlan: 80, marketingCoordination: 50, userTraining: 60,
            monitoring: 80, preventativeMaintenance: 70, supportProtocol: 70, incidentResponse: 80,
            userFeedback: 75, performanceAnalysis: 80, featureRoadmap: 70, competitiveLandscape: 50,
        }
    },
    {
        name: 'Creative',
        icon: '🎨',
        description: 'Prioritizes novel ideas and exploration. Less constrained.',
        settings: {
            creativity: 90, costOptimization: 30, performanceBias: 50, modularity: 70,
            clarity: 50, userCentricity: 85, conciseness: 30, foresight: 70,
        }
    },
    {
        name: 'Rigorous',
        icon: '🛡️',
        description: 'Focuses on technical depth, safety, and standards.',
        settings: {
            clarity: 80, technicality: 85, foresight: 70, riskAversion: 90, userCentricity: 50, conciseness: 60,
            technicalDepth: 90, failureAnalysis: 90, manufacturability: 70, standardsAdherence: 95,
            coverage: 95, edgeCaseFocus: 85, destructiveTesting: 50,
        }
    },
    {
        name: 'Cost-Conscious',
        icon: '💰',
        description: 'Optimizes for budget, manufacturability, and efficiency.',
        settings: {
             costOptimization: 90, modularity: 75, manufacturability: 85, performanceBias: 40,
             preventativeMaintenance: 50, supportProtocol: 50,
        }
    }
];

const getActiveProfileName = (currentSettings: { [key: string]: any }) => {
    for (const profile of AI_PROFILES) {
        const relevantProfileSettings = Object.keys(currentSettings)
            .reduce((obj, key) => {
                if (key in profile.settings) {
                    obj[key] = profile.settings[key];
                }
                return obj;
            }, {});
        if (JSON.stringify(relevantProfileSettings) === JSON.stringify(currentSettings)) {
            return profile.name;
        }
    }
    return 'Custom';
};

export const TuningControls = ({ settings, onChangeSettings, title = "Tuning Controls", description = "Select a profile or adjust parameters to customize AI output" }: { settings: { [key: string]: number | string | boolean }, onChangeSettings: (newSettings: any) => void, title?: string, description?: string }) => {

    const activeProfileName = getActiveProfileName(settings);
    
    const handleProfileSelect = (profile) => {
        const newSettings = { ...settings };
        for (const key in profile.settings) {
            if (key in newSettings) {
                newSettings[key] = profile.settings[key];
            }
        }
        onChangeSettings(newSettings);
    };

    const handleSliderChange = (key, value) => {
        onChangeSettings({ ...settings, [key]: value });
    };

    return (
        <Card title={title} description={description}>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Profile</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AI_PROFILES.map(profile => (
                        <button
                            key={profile.name}
                            type="button"
                            onClick={() => handleProfileSelect(profile)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 text-center transition-all ${activeProfileName === profile.name ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-brand-primary/50'}`}
                            title={profile.description}
                        >
                            <span className="text-2xl">{profile.icon}</span>
                            <span className="text-sm font-semibold mt-1">{profile.name}</span>
                        </button>
                    ))}
                </div>
                 {activeProfileName === 'Custom' && <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">You are using a custom configuration.</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}: {value}{typeof value === 'number' ? '%' : ''}
                </label>
                {typeof value === 'number' ? (
                    <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                ) : (
                    <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => onChangeSettings({ ...settings, [key]: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                )}
                </div>
            ))}
            </div>
        </Card>
    );
}