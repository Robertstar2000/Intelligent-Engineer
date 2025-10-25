import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { teamApi, projectsApi } from '../utils/api';
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Users } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectData, membersData, activeData] = await Promise.all([
        projectsApi.get(projectId!),
        teamApi.getMembers(projectId!),
        teamApi.getActiveUsers(projectId!).catch(() => []),
      ]);
      setProject(projectData);
      setTeamMembers(membersData);
      setActiveUsers(activeData);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamApi.inviteMember(projectId!, { email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('developer');
      await loadData();
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await teamApi.removeMember(projectId!, memberId);
      await loadData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {project?.name}
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {teamMembers.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Members
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {activeUsers.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Now
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {teamMembers.filter(m => m.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Administrators
                </div>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Members
            </h2>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={member.isActive ? 'success' : 'outline'}>
                      {member.isActive ? 'Active' : 'Offline'}
                    </Badge>
                    <Badge variant="info">{member.role || 'member'}</Badge>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Invite Team Member
            </h2>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Button type="submit" variant="primary" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
