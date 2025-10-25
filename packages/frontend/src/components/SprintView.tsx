import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { projectsApi } from '../utils/api';
import { Sparkles, Save, Edit3, CheckCircle, Clock } from 'lucide-react';

interface SprintViewProps {
  sprint: any;
  project: any;
  phase: any;
  onUpdate: (sprintId: string, updates: any) => void;
}

export const SprintView: React.FC<SprintViewProps> = ({
  sprint,
  project,
  phase,
  onUpdate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState(sprint.output || '');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await projectsApi.generateSprint(
        project.id,
        phase.id,
        sprint.id,
        {
          projectId: project.id,
          phaseId: phase.id,
          sprintId: sprint.id,
        }
      );
      setEditedOutput(result.content || result.output);
      onUpdate(sprint.id, { output: result.content || result.output });
    } catch (error) {
      console.error('Error generating sprint content:', error);
      alert('Failed to generate sprint content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await projectsApi.updatePhase(project.id, phase.id, {
        sprints: phase.sprints.map((s: any) =>
          s.id === sprint.id ? { ...s, output: editedOutput } : s
        ),
      });
      onUpdate(sprint.id, { output: editedOutput });
      setIsEditing(false);
      alert('Sprint content saved successfully!');
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint content');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              sprint.status === 'completed'
                ? 'bg-green-500'
                : sprint.status === 'in-progress'
                ? 'bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            {sprint.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <Clock className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sprint.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sprint.description}
            </p>
          </div>
        </div>
        <Badge
          variant={
            sprint.status === 'completed'
              ? 'success'
              : sprint.status === 'in-progress'
              ? 'warning'
              : 'outline'
          }
        >
          {sprint.status || 'not-started'}
        </Badge>
      </div>

      {/* Deliverables */}
      {sprint.deliverables && sprint.deliverables.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deliverables
          </h4>
          <ul className="space-y-1">
            {sprint.deliverables.map((deliverable: string, index: number) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
              >
                <span className="mr-2">•</span>
                {deliverable}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </Button>
        {sprint.output && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
        {isEditing && (
          <>
            <Button variant="primary" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditedOutput(sprint.output || '');
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {(sprint.output || isEditing) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sprint Content
          </h4>
          {isEditing ? (
            <textarea
              value={editedOutput}
              onChange={(e) => setEditedOutput(e.target.value)}
              className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Sprint content will appear here..."
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{sprint.output}</pre>
            </div>
          )}
        </div>
      )}

      {!sprint.output && !isEditing && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No content generated yet. Click "Generate Content" to create sprint documentation.</p>
        </div>
      )}
    </Card>
  );
};
