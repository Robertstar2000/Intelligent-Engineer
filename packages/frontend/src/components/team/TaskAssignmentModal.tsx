import React, { useState, useEffect } from 'react';
import { TeamMember, DynamicRole, Phase, Sprint } from '@shared/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  X, 
  User, 
  Clock, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Target,
  Users
} from 'lucide-react';

interface TaskAssignmentModalProps {
  projectId: string;
  phase: Phase;
  sprint: Sprint;
  teamMembers: TeamMember[];
  onAssign: (assignedTo: string, role: DynamicRole, estimatedHours?: number) => Promise<void>;
  onClose: () => void;
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  projectId,
  phase,
  sprint,
  teamMembers,
  onAssign,
  onClose
}) => {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<DynamicRole | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available roles from team members
  const availableRoles = teamMembers.reduce((roles, member) => {
    if (!roles.find(r => r.id === member.role.id)) {
      roles.push(member.role);
    }
    return roles;
  }, [] as DynamicRole[]);

  // Filter team members by selected role
  const eligibleMembers = selectedRole 
    ? teamMembers.filter(member => member.role.id === selectedRole.id)
    : teamMembers;

  const handleRoleSelect = (role: DynamicRole) => {
    setSelectedRole(role);
    setSelectedMember(''); // Reset member selection when role changes
    setError(null);
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId);
    setError(null);
  };

  const handleAssign = async () => {
    if (!selectedMember || !selectedRole) {
      setError('Please select both a role and team member');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      await onAssign(selectedMember, selectedRole, estimatedHours);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign task');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assign Task
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {phase.name} → {sprint.name}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Task Details
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sprint:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">{sprint.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">{sprint.description}</span>
              </div>
              {sprint.deliverables.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deliverables:</span>
                  <ul className="ml-2 mt-1 space-y-1">
                    {sprint.deliverables.map((deliverable, index) => (
                      <li key={index} className="text-sm text-gray-900 dark:text-white flex items-start">
                        <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Select Role
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole?.id === role.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {role.description}
                  </div>
                  <div className="flex items-center mt-2">
                    <Badge variant="info" size="sm">
                      {role.discipline}
                    </Badge>
                    <Badge variant="outline" size="sm" className="ml-2">
                      {role.accessLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Member Selection */}
          {selectedRole && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Select Team Member
              </h3>
              <div className="space-y-2">
                {eligibleMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No team members available for the selected role</p>
                  </div>
                ) : (
                  eligibleMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member.userId)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMember === member.userId
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {member.user?.avatar ? (
                            <img
                              src={member.user.avatar}
                              alt={member.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {member.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {member.user?.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.isActive && (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Estimated Hours */}
          {selectedMember && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Estimated Hours
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">hours</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is an estimate. The assignee can track actual hours worked.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="primary"
            disabled={!selectedMember || !selectedRole || isAssigning}
            className="flex items-center space-x-2"
          >
            {isAssigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Assign Task</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};