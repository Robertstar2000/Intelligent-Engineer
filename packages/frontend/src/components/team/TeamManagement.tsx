import React, { useState, useEffect } from 'react';
import { TeamMember, DynamicRole, ActiveUser } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Users, UserPlus, Settings, MoreVertical, Mail, Clock, Shield } from 'lucide-react';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';
import { TeamMemberCard } from './TeamMemberCard';
import { ActiveUsersIndicator } from './ActiveUsersIndicator';

interface TeamManagementProps {
  projectId: string;
  currentUserId: string;
  canManageTeam: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  projectId,
  currentUserId,
  canManageTeam
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load team members
  useEffect(() => {
    loadTeamMembers();
    loadActiveUsers();
    
    // Set up polling for active users (every 30 seconds)
    const interval = setInterval(loadActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(`/api/team/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load team members');
      }

      const members = await response.json();
      setTeamMembers(members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const response = await fetch(`/api/team/${projectId}/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setActiveUsers(users);
      }
    } catch (err) {
      console.error('Failed to load active users:', err);
    }
  };

  const handleInviteMember = async (email: string, role: DynamicRole) => {
    try {
      const response = await fetch(`/api/team/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite team member');
      }

      const result = await response.json();
      
      // Show success message
      alert(result.message);
      
      // Reload team members
      await loadTeamMembers();
      
      setIsInviteModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite team member');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: DynamicRole) => {
    try {
      const response = await fetch(`/api/team/${projectId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member role');
      }

      // Reload team members
      await loadTeamMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }

      // Reload team members
      await loadTeamMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove team member');
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading team</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={loadTeamMembers} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} • {activeUsers.filter(u => u.isOnline).length} online
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ActiveUsersIndicator activeUsers={activeUsers} />
            
            {canManageTeam && (
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Team Members List */}
      <div className="grid gap-4">
        {teamMembers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No team members yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start collaborating by inviting team members to your project.
              </p>
              {canManageTeam && (
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  variant="primary"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </div>
          </Card>
        ) : (
          teamMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.userId === currentUserId}
              isOnline={activeUsers.some(u => u.id === member.userId && u.isOnline)}
              canManage={canManageTeam}
              onUpdateRole={(newRole) => handleUpdateMemberRole(member.userId, newRole)}
              onRemove={() => handleRemoveMember(member.userId)}
            />
          ))
        )}
      </div>

      {/* Invite Team Member Modal */}
      {isInviteModalOpen && (
        <InviteTeamMemberModal
          projectId={projectId}
          onInvite={handleInviteMember}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
};