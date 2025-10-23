import React, { useState, useEffect } from 'react';
import { Phase, Project, TeamMember } from '@shared/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Users, 
  Settings, 
  MessageSquare, 
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PhaseView } from './PhaseView';
import { CollaborativePhaseView } from './collaboration/CollaborativePhaseView';
import { TeamManagement } from './team/TeamManagement';
import { usePhaseCollaboration } from '../hooks/usePhaseCollaboration';

interface EnhancedPhaseViewProps {
  phase: Phase;
  project: Project;
  disciplines: string[];
  apiKey: string | null;
  currentUserId: string;
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onPhaseComplete: () => void;
}

export const EnhancedPhaseView: React.FC<EnhancedPhaseViewProps> = ({
  phase,
  project,
  disciplines,
  apiKey,
  currentUserId,
  onUpdatePhase,
  onPhaseComplete
}) => {
  const [viewMode, setViewMode] = useState<'standard' | 'collaborative'>('collaborative');
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);

  const {
    teamMembers,
    phaseTasks,
    activeUsers,
    isLoading: collaborationLoading,
    error: collaborationError,
    assignTask,
    updateTaskStatus,
    addPhaseComment,
    refreshData,
  } = usePhaseCollaboration({
    projectId: project.id,
    phaseId: phase.id,
    onPhaseUpdate: (updatedPhase) => {
      onUpdatePhase(updatedPhase.id, updatedPhase);
    },
  });

  // Check if current user can manage team
  useEffect(() => {
    checkTeamPermissions();
  }, [project.id, currentUserId]);

  const checkTeamPermissions = async () => {
    try {
      // Check if user is project owner or has team management permissions
      const isOwner = project.createdBy === currentUserId;
      const isProgramLeader = project.programLeader === currentUserId;
      
      // TODO: Check specific permissions from backend
      setCanManageTeam(isOwner || isProgramLeader);
    } catch (err) {
      console.error('Error checking team permissions:', err);
      setCanManageTeam(false);
    }
  };

  const handlePhaseUpdate = (phaseId: string, updates: Partial<Phase>) => {
    onUpdatePhase(phaseId, updates);
    
    // Refresh collaboration data if needed
    if (updates.sprints || updates.status) {
      refreshData();
    }
  };

  // Show loading state for collaboration features
  if (collaborationLoading && viewMode === 'collaborative') {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <Card noPadding>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phase: {phase.name}
              </h2>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setViewMode('standard')}
                  variant={viewMode === 'standard' ? 'primary' : 'outline'}
                  size="sm"
                >
                  Standard
                </Button>
                <Button
                  onClick={() => setViewMode('collaborative')}
                  variant={viewMode === 'collaborative' ? 'primary' : 'outline'}
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Collaborative
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Team Panel Toggle */}
              {teamMembers.length > 0 && (
                <Button
                  onClick={() => setShowTeamPanel(!showTeamPanel)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Team ({teamMembers.length})</span>
                  {showTeamPanel ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}

              {/* Phase Status */}
              <Badge 
                variant={
                  phase.status === 'completed' ? 'success' :
                  phase.status === 'in-progress' ? 'warning' :
                  phase.status === 'in-review' ? 'info' : 'outline'
                }
              >
                {phase.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Collaboration Stats */}
        {viewMode === 'collaborative' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {activeUsers.filter(u => u.isOnline).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Online Now</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {phaseTasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {phaseTasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  {phaseTasks.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Team Management Panel */}
      {showTeamPanel && (
        <Card>
          <TeamManagement
            projectId={project.id}
            currentUserId={currentUserId}
            canManageTeam={canManageTeam}
          />
        </Card>
      )}

      {/* Error Display */}
      {collaborationError && viewMode === 'collaborative' && (
        <Card>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Collaboration Error</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{collaborationError}</p>
            <Button onClick={refreshData} variant="outline">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Main Phase Content */}
      {viewMode === 'standard' ? (
        <PhaseView
          phase={phase}
          project={project}
          disciplines={disciplines}
          apiKey={apiKey}
          onUpdatePhase={handlePhaseUpdate}
          onPhaseComplete={onPhaseComplete}
        />
      ) : (
        <CollaborativePhaseView
          phase={phase}
          project={project}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          canManageTeam={canManageTeam}
          onUpdatePhase={handlePhaseUpdate}
          onPhaseComplete={onPhaseComplete}
        />
      )}

      {/* Quick Actions */}
      {viewMode === 'collaborative' && (
        <Card noPadding>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Quick Actions
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowTeamPanel(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Manage Team</span>
                </Button>
                
                <Button
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Target className="w-3 h-3" />
                  <span>Refresh Tasks</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};