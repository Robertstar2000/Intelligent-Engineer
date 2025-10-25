import React, { useState, useEffect } from 'react';
import { TaskAssignment } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { tasksApi } from '../../utils/api';
import { 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause,
  MoreVertical,
  MessageSquare,
  Target
} from 'lucide-react';

interface TaskListProps {
  projectId?: string;
  userId?: string;
  showProjectName?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskAssignment>) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  projectId,
  userId,
  showProjectName = false,
  onTaskUpdate
}) => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId, userId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      let tasksData;
      if (projectId) {
        tasksData = await tasksApi.getProjectTasks(projectId);
      } else {
        // For user-specific or my-tasks, we'll use project tasks for now
        // In a real implementation, you'd have separate endpoints
        tasksData = [];
      }

      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: TaskAssignment['status']) => {
    try {
      const updatedTask = await tasksApi.updateTask(taskId, { status: newStatus });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));

      // Notify parent component
      onTaskUpdate?.(taskId, { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status');
    }
  };

  const getStatusColor = (status: TaskAssignment['status']) => {
    switch (status) {
      case 'assigned': return 'info';
      case 'in-progress': return 'warning';
      case 'blocked': return 'error';
      case 'completed': return 'success';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: TaskAssignment['priority']) => {
    switch (priority) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date() && tasks.find(t => new Date(t.dueDate) < new Date())?.status !== 'completed';
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-red-500 mb-2">Error loading tasks</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={loadTasks} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks assigned
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {projectId ? 'No tasks have been assigned in this project yet.' : 'You have no assigned tasks at the moment.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const daysUntilDue = getDaysUntilDue(task.dueDate);
        const overdue = isOverdue(task.dueDate);
        
        return (
          <Card key={task.id} noPadding>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Task Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant={getStatusColor(task.status)} size="sm">
                      {task.status.replace('-', ' ')}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      size="sm"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority} priority
                    </Badge>
                    {overdue && (
                      <Badge variant="error" size="sm">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  {/* Task Title */}
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {task.instructions.title || `Task in ${task.phaseId}`}
                  </h3>

                  {/* Project Name (if showing multiple projects) */}
                  {showProjectName && task.project && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Project: {task.project.name}
                    </p>
                  )}

                  {/* Task Details */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {task.assignee?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {task.actualHours}h / {task.estimatedHours}h
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {overdue ? (
                        <span className="text-red-600 dark:text-red-400">
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      ) : daysUntilDue === 0 ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          Due today
                        </span>
                      ) : daysUntilDue === 1 ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Due tomorrow
                        </span>
                      ) : (
                        <span>
                          Due in {daysUntilDue} days
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Acceptance Criteria Preview */}
                  {task.instructions.acceptanceCriteria && task.instructions.acceptanceCriteria.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Acceptance Criteria ({task.instructions.acceptanceCriteria.length})
                      </p>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {task.instructions.acceptanceCriteria.slice(0, 2).map((criteria, index) => (
                          <div key={index} className="flex items-start mb-1">
                            <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                            <span className="truncate">{criteria}</span>
                          </div>
                        ))}
                        {task.instructions.acceptanceCriteria.length > 2 && (
                          <span className="text-gray-500">
                            +{task.instructions.acceptanceCriteria.length - 2} more...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {task.status === 'assigned' && (
                    <Button
                      onClick={() => handleStatusUpdate(task.id, 'in-progress')}
                      size="sm"
                      variant="primary"
                      className="flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start</span>
                    </Button>
                  )}
                  
                  {task.status === 'in-progress' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(task.id, 'completed')}
                        size="sm"
                        variant="success"
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Complete</span>
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(task.id, 'blocked')}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Block</span>
                      </Button>
                    </>
                  )}

                  {task.status === 'blocked' && (
                    <Button
                      onClick={() => handleStatusUpdate(task.id, 'in-progress')}
                      size="sm"
                      variant="warning"
                      className="flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </Button>
                  )}

                  <Button
                    onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                    size="sm"
                    variant="ghost"
                    className="p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedTask === task.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Instructions */}
                    {task.instructions.content && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Instructions
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                          {task.instructions.content.split('\n').slice(0, 3).map((line, index) => (
                            <p key={index} className="mb-1">{line}</p>
                          ))}
                          {task.instructions.content.split('\n').length > 3 && (
                            <p className="text-gray-500">...</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {task.instructions.resources && task.instructions.resources.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Resources
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {task.instructions.resources.slice(0, 3).map((resource, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {resource}
                            </li>
                          ))}
                          {task.instructions.resources.length > 3 && (
                            <li className="text-gray-500">
                              +{task.instructions.resources.length - 3} more resources...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Progress Notes */}
                  {task.progressNotes && task.progressNotes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Progress Notes ({task.progressNotes.length})
                      </h4>
                      <div className="space-y-2">
                        {task.progressNotes.slice(-2).map((note, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                              {note.hoursWorked > 0 && (
                                <span className="text-xs text-gray-500">
                                  +{note.hoursWorked}h
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {note.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};