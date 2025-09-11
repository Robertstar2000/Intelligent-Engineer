import React from 'react';
import { Card } from './ui';

// FIX: Added explicit types to props to correctly infer the type of `value` from `settings`.
export const TuningControls = ({ settings, onChange }: { settings: { [key: string]: number | string | boolean }, onChange: (key: string, value: string | number) => void }) => (
  <Card title="Tuning Controls" description="Adjust parameters to customize AI output">
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
              onChange={(e) => onChange(key, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          ) : (
            <input
              type="text"
              value={String(value)}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          )}
        </div>
      ))}
    </div>
  </Card>
);