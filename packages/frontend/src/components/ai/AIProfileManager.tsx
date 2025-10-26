import React, { useState, useEffect } from 'react';
import { AIProfile, TuningSettings } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { aiApi } from '../../utils/api';
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Save,
  X,
  Sliders
} from 'lucide-react';

interface AIProfileManagerProps {
  onSelectProfile?: (profile: AIProfile) => void;
}

export const AIProfileManager: React.FC<AIProfileManagerProps> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await aiApi.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const tuningParameters = [
    { key: 'clarity', label: 'Clarity', min: 0, max: 100 },
    { key: 'technicality', label: 'Technicality', min: 0, max: 100 },
    { key: 'foresight', label: 'Foresight', min: 0, max: 100 },
    { key: 'riskAversion', label: 'Risk Aversion', min: 0, max: 100 },
    { key: 'userCentricity', label: 'User Centricity', min: 0, max: 100 },
    { key: 'conciseness', label: 'Conciseness', min: 0, max: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Profile Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage AI tuning configurations for different project types
          </p>
        </div>
        <Button variant="primary" onClick={() => {
          setEditingProfile({
            id: '',
            name: 'New Profile',
            description: '',
            tuningSettings: {},
            modelConfiguration: {},
            userId: '',
            isShared: false,
            usage: { timesUsed: 0, lastUsed: new Date(), averageRating: 0, feedback: [] },
            createdAt: new Date(),
          });
          setShowEditor(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {showEditor && editingProfile && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProfile.id ? 'Edit Profile' : 'Create New Profile'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingProfile.description}
                  onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Sliders className="w-4 h-4 mr-2" />
                Tuning Parameters
              </h4>
              {tuningParameters.map((param) => (
                <div key={param.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      {param.label}
                    </label>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {editingProfile.tuningSettings[param.key] || 50}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    value={editingProfile.tuningSettings[param.key] || 50}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      tuningSettings: {
                        ...editingProfile.tuningSettings,
                        [param.key]: parseInt(e.target.value),
                      },
                    })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={async () => {
                try {
                  if (editingProfile.id) {
                    await aiApi.updateProfile(editingProfile.id, editingProfile);
                  } else {
                    await aiApi.createProfile(editingProfile);
                  }
                  setShowEditor(false);
                  await loadProfiles();
                } catch (error) {
                  console.error('Error saving profile:', error);
                  alert('Failed to save profile');
                }
              }}>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {profile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.description}
                </p>
              </div>
              {profile.isBuiltIn && (
                <Badge variant="info" size="sm">Built-in</Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {Object.entries(profile.tuningSettings).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Used {profile.usage.timesUsed} times
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onSelectProfile?.(profile)}>
                  Apply
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingProfile(profile);
                  setShowEditor(true);
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
