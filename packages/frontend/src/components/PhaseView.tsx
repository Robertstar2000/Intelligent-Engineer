import React, { useState } from 'react';
import { Phase, Project } from '@shared/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Play, 
  Edit3, 
  Save, 
  RefreshCw, 
  CheckCircle,
  FileText,
  Settings
} from 'lucide-react';

interface PhaseViewProps {
  phase: Phase;
  project: Project;
  disciplines: string[];
  apiKey: string | null;
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onPhaseComplete: () => void;
}

export const PhaseView: React.FC<PhaseViewProps> = ({
  phase,
  project,
  disciplines,
  apiKey,
  onUpdatePhase,
  onPhaseComplete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState(phase.output || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    onUpdatePhase(phase.id, { output: editedOutput });
    setIsEditing(false);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      alert('API key is required for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: Implement AI generation
      // This would call the backend API to generate content
      const response = await fetch('/api/ai/generate-phase-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          phaseId: phase.id,
          tuningSettings: phase.tuningSettings,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEditedOutput(result.content);
        onUpdatePhase(phase.id, { output: result.content });
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'in-review': return 'info';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {phase.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {phase.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusColor(phase.status)}>
              {phase.status.replace('-', ' ')}
            </Badge>
            
            {phase.status !== 'completed' && (
              <Button
                onClick={onPhaseComplete}
                variant="success"
                size="sm"
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Phase</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sprints */}
      {phase.sprints && phase.sprints.length > 0 && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Phase Tasks ({phase.sprints.length})
            </h3>
            
            <div className="space-y-3">
              {phase.sprints.map((sprint) => (
                <div key={sprint.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {sprint.name}
                        </h4>
                        <Badge variant={getStatusColor(sprint.status)} size="sm">
                          {sprint.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {sprint.description}
                      </p>

                      {sprint.deliverables && sprint.deliverables.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <strong>Deliverables:</strong> {sprint.deliverables.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Phase Content */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Phase Documentation
            </h3>
            
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    variant="primary"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setEditedOutput(phase.output || '');
                      setIsEditing(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                </>
              )}
              
              {isEditing && (
                <>
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </Button>
                  
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editedOutput}
              onChange={(e) => setEditedOutput(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Phase documentation will appear here..."
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 min-h-96">
              {phase.output ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {phase.output}
                </pre>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>No content generated yet. Click "Generate" to create phase documentation.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tuning Settings */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            AI Tuning Settings
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(phase.tuningSettings || {}).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {typeof value === 'number' ? value.toFixed(1) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};