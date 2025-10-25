import React, { useState, useEffect } from 'react';
import { Phase, Project, TeamMember, TaskAssignment, DynamicRole } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { teamApi, tasksApi } from '../../utils/api';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  MessageSquare, 
  Eye,
  Edit3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Play
} from 'lucide-react';
import { CollaborativeEditor } from './CollaborativeEditor';
import { ActiveUsersIndicator } from '../team/ActiveUsersIndicator';
import { TaskAssignmentModal } from '../team/TaskAssignmentModal';
import { TaskList } from '../team/TaskList';

interface CollaborativePhaseViewProps {
  phase: Phase;
  project: Project;
  teamMembers: TeamMember[];
  currentUserId: string;
  canManageTeam: boolean;
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onPhaseComplete: () => void;
}

export const CollaborativePhaseView: React.FC<CollaborativePhaseViewProps> = ({
  phase,
  project,
  teamMembers,
  currentUserId,
  canManageTeam,
  onUpdatePhase,
  onPhaseComplete
}) => {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isTaskAssignmentOpen, setIsTaskAssignmentOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [phaseComments, setPhaseComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Load active users and comments
  useEffect(() => {
    loadActiveUsers();
    loadPhaseComments();
    
    // Set up polling for active users
    const interval = setInterval(loadActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [project.id, phase.id]);

  const loadActiveUsers = async () => {
    try {
      const users = await teamApi.getActiveUsers(project.id);
      setActiveUsers(users);
    } catch (err) {
      console.error('Failed to load active users:', err);
    }
  };

  const loadPhaseComments = async () => {
    // TODO: Implement phase comments API
    // For now, use mock data
    setPhaseComments([]);
  };

  const handleTaskAssignment = async (assignedTo: string, role: DynamicRole, estimatedHours?: number) => {
    if (!selectedSprint) return;

    try {
      await tasksApi.assignTask({
        projectId: project.id,
        phaseId: phase.id,
        sprintId: selectedSprint.id,
        assignedTo,
        assignedRole: role,
        estimatedHours,
      });

      // Update sprint status
      const updatedSprints = phase.sprints.map(sprint =>
        sprint.id === selectedSprint.id
          ? { ...sprint, assignedTo, assignedRole: role, status: 'in-progress' as const }
          : sprint
      );

      onUpdatePhase(phase.id, { sprints: updatedSprints });
      
      setIsTaskAssignmentOpen(false);
      setSelectedSprint(null);
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // TODO: Implement add comment API
    const comment = {
      id: Date.now().toString(),
      userId: currentUserId,
      content: newComment,
      createdAt: new Date(),
      user: teamMembers.find(m => m.userId === currentUserId)?.user,
    };

    setPhaseComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const getSprintStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'outline';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  const getAssignedUser = (sprint: any) => {
    if (!sprint.assignedTo) return null;
    return teamMembers.find(member => member.userId === sprint.assignedTo);
  };

  const canAssignTasks = canManageTeam || phase.assignedUsers?.includes(currentUserId);

  return (
    <div className="space-y-6">
      {/* Phase Header with Collaboration Info */}
      <Card noPadding>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {phase.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {phase.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={phase.status === 'completed' ? 'success' : phase.status === 'in-progress' ? 'warning' : 'outline'}>
                {phase.status.replace('-', ' ')}
              </Badge>
              
              <ActiveUsersIndicator activeUsers={activeUsers} maxVisible={5} />
            </div>
          </div>

          {/* Phase Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {phase.sprints?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {phase.sprints?.filter(s => s.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {phase.sprints?.filter(s => s.status === 'in-progress').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {teamMembers.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
            </div>
          </div>
        </div>

        {/* Phase Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowComments(!showComments)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comments ({phaseComments.length})</span>
              </Button>
              
              {phase.status === 'in-progress' && (
                <Button
                  onClick={() => onPhaseComplete()}
                  variant="success"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Complete</span>
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date(phase.updatedAt || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      {showComments && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Phase Comments
            </h3>

            {/* Add Comment */}
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment about this phase..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
                variant="primary"
              >
                Comment
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {phaseComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>No comments yet. Start the discussion!</p>
                </div>
              ) : (
                phaseComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sprint/Task Management */}
      {phase.sprints && phase.sprints.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Phase Tasks ({phase.sprints.length})
            </h3>
          </div>

          <div className="space-y-4">
            {phase.sprints.map((sprint) => {
              const assignedUser = getAssignedUser(sprint);
              
              return (
                <div key={sprint.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {sprint.name}
                        </h4>
                        <Badge variant={getSprintStatusColor(sprint.status)} size="sm">
                          {sprint.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {sprint.description}
                      </p>

                      {/* Deliverables */}
                      {sprint.deliverables && sprint.deliverables.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Deliverables:
                          </p>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {sprint.deliverables.map((deliverable, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Assignment Info */}
                      {assignedUser ? (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Assigned to {assignedUser.user?.name}
                          </div>
                          {sprint.estimatedHours && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {sprint.estimatedHours}h estimated
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Not assigned
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!assignedUser && canAssignTasks && (
                        <Button
                          onClick={() => {
                            setSelectedSprint(sprint);
                            setIsTaskAssignmentOpen(true);
                          }}
                          size="sm"
                          variant="primary"
                          className="flex items-center space-x-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign</span>
                        </Button>
                      )}

                      {sprint.output && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Sprint Output Preview */}
                  {sprint.output && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {sprint.output.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Collaborative Document Editor */}
      {phase.output && (
        <Card>
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Edit3 className="w-4 h-4 mr-2" />
              Phase Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Collaborate in real-time on the phase documentation
            </p>
          </div>

          <CollaborativeEditor
            projectId={project.id}
            documentId={`phase-${phase.id}`}
            initialContent={phase.output}
            onContentChange={(content) => {
              // Update phase output in real-time
              onUpdatePhase(phase.id, { output: content });
            }}
            onSave={async (content) => {
              // Save to backend
              onUpdatePhase(phase.id, { output: content });
            }}
            readOnly={phase.status === 'completed'}
          />
        </Card>
      )}

      {/* Task Assignment Modal */}
      {isTaskAssignmentOpen && selectedSprint && (
        <TaskAssignmentModal
          projectId={project.id}
          phase={phase}
          sprint={selectedSprint}
          teamMembers={teamMembers}
          onAssign={handleTaskAssignment}
          onClose={() => {
            setIsTaskAssignmentOpen(false);
            setSelectedSprint(null);
          }}
        />
      )}

      {/* Project Tasks List */}
      <Card>
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            My Tasks in This Project
          </h3>
        </div>
        
        <TaskList
          projectId={project.id}
          showProjectName={false}
          onTaskUpdate={(taskId, updates) => {
            // Handle task updates if needed
            console.log('Task updated:', taskId, updates);
          }}
        />
      </Card>
    </div>
  );
};