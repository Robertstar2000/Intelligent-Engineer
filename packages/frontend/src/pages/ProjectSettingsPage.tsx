import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { projectsApi, aiApi } from '../utils/api';
import { ArrowLeft, Save, Settings, Brain, Sliders } from 'lucide-react';

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [aiProfiles, setAiProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [developmentMode, setDevelopmentMode] = useState<'full' | 'rapid'>('full');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectData, profilesData] = await Promise.all([
        projectsApi.get(projectId!),
        aiApi.getProfiles().catch(() => []),
      ]);
      setProject(projectData);
      setDevelopmentMode(projectData.developmentMode || 'full');
      setSelectedProfile(projectData.aiProfileId || '');
      setAiProfiles(profilesData);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await projectsApi.update(projectId!, {
        developmentMode,
        aiProfileId: selectedProfile,
      });
      alert('Settings saved successfully!');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Project not found
            </h3>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Project Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{project.name}</p>
            </div>
          </div>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={project.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Project name cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Development Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDevelopmentMode('full')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    developmentMode === 'full'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Full Mode</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive documentation and detailed phases
                  </div>
                </button>
                <button
                  onClick={() => setDevelopmentMode('rapid')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    developmentMode === 'rapid'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Rapid Mode</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Quick iterations with essential documentation
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            AI Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Profile
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select the AI profile to use for content generation in this project
              </p>
              <div className="space-y-2">
                {aiProfiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No AI profiles available
                  </div>
                ) : (
                  aiProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile.id)}
                      className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                        selectedProfile === profile.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {profile.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {profile.description}
                          </div>
                          {profile.capabilities && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {profile.capabilities.map((cap: string) => (
                                <Badge key={cap} variant="info" size="sm">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {profile.isActive && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Sliders className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    AI Tuning Controls
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Advanced AI tuning parameters (clarity, technicality, foresight, etc.) can be
                    configured per phase in the phase view. Each phase can have custom tuning
                    settings to optimize AI-generated content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Disciplines */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Engineering Disciplines
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.disciplines?.map((discipline: string) => (
              <Badge key={discipline} variant="info">
                {discipline}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Disciplines are set during project creation and cannot be modified
          </p>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Delete Project
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Permanently delete this project and all its data
                </div>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                    projectsApi.delete(projectId!).then(() => {
                      navigate('/projects');
                    });
                  }
                }}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
