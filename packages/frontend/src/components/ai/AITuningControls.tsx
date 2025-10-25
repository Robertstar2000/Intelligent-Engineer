import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sliders, RotateCcw, Save } from 'lucide-react';

interface AITuningControlsProps {
  initialSettings?: any;
  onSave: (settings: any) => void;
  onClose?: () => void;
}

export const AITuningControls: React.FC<AITuningControlsProps> = ({
  initialSettings = {},
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = useState({
    clarity: initialSettings.clarity || 70,
    technicality: initialSettings.technicality || 60,
    foresight: initialSettings.foresight || 50,
    riskAversion: initialSettings.riskAversion || 50,
    userCentricity: initialSettings.userCentricity || 60,
    conciseness: initialSettings.conciseness || 50,
  });

  const tuningParameters = [
    {
      key: 'clarity',
      label: 'Clarity',
      description: 'How clear and understandable the content should be',
      min: 0,
      max: 100,
    },
    {
      key: 'technicality',
      label: 'Technicality',
      description: 'Level of technical detail and jargon',
      min: 0,
      max: 100,
    },
    {
      key: 'foresight',
      label: 'Foresight',
      description: 'Focus on future considerations and planning',
      min: 0,
      max: 100,
    },
    {
      key: 'riskAversion',
      label: 'Risk Aversion',
      description: 'How conservative vs. innovative the approach should be',
      min: 0,
      max: 100,
    },
    {
      key: 'userCentricity',
      label: 'User Centricity',
      description: 'Focus on user needs and experience',
      min: 0,
      max: 100,
    },
    {
      key: 'conciseness',
      label: 'Conciseness',
      description: 'How brief vs. detailed the content should be',
      min: 0,
      max: 100,
    },
  ];

  const handleSliderChange = (key: string, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings({
      clarity: 70,
      technicality: 60,
      foresight: 50,
      riskAversion: 50,
      userCentricity: 60,
      conciseness: 50,
    });
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Tuning Controls
          </h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <div className="space-y-6">
        {tuningParameters.map((param) => (
          <div key={param.key}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {param.label}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {param.description}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {settings[param.key as keyof typeof settings]}
              </span>
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              value={settings[param.key as keyof typeof settings]}
              onChange={(e) => handleSliderChange(param.key, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="primary" onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Tuning Settings
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Tip:</strong> These settings control how the AI generates content for this phase.
          Adjust them based on your audience and project needs. Changes apply to future generations.
        </p>
      </div>
    </Card>
  );
};
