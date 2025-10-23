import React, { useState, useEffect } from 'react';
import { DynamicRole } from '@shared/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, Mail, UserPlus, Shield, AlertCircle } from 'lucide-react';

interface InviteTeamMemberModalProps {
  projectId: string;
  onInvite: (email: string, role: DynamicRole) => Promise<void>;
  onClose: () => void;
}

export const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  projectId,
  onInvite,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<DynamicRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<DynamicRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'role'>('email');

  // Load available roles for the project
  useEffect(() => {
    loadAvailableRoles();
  }, [projectId]);

  const loadAvailableRoles = async () => {
    try {
      // TODO: Implement API endpoint to get available roles for project
      // For now, using mock data
      const mockRoles: DynamicRole[] = [
        {
          id: 'role-1',
          name: 'Software Engineer',
          description: 'Responsible for software development and implementation',
          responsibilities: ['Code development', 'Testing', 'Documentation'],
          deliverables: ['Software modules', 'Test reports'],
          approvalAuthorities: [],
          permissions: [
            { id: 'perm-1', name: 'view_project', resource: 'project', action: 'read' },
            { id: 'perm-2', name: 'edit_code', resource: 'code', action: 'write' }
          ],
          accessLevel: 'write' as const,
          discipline: 'Software Engineering',
          projectScale: 'medium' as const,
          organizationContext: {
            id: 'org-1',
            name: 'Example Org',
            industry: 'Technology',
            size: 'medium' as const,
            complianceRequirements: [],
            customTerminology: {}
          },
          reportsTo: [],
          manages: [],
          collaboratesWith: [],
          generatedBy: 'template' as const,
          templateSource: 'software-template',
          aiConfidence: 0.9,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'role-2',
          name: 'Systems Engineer',
          description: 'Responsible for system architecture and integration',
          responsibilities: ['System design', 'Integration planning', 'Requirements analysis'],
          deliverables: ['System architecture', 'Integration plans'],
          approvalAuthorities: [],
          permissions: [
            { id: 'perm-3', name: 'view_project', resource: 'project', action: 'read' },
            { id: 'perm-4', name: 'edit_system', resource: 'system', action: 'write' },
            { id: 'perm-5', name: 'approve_design', resource: 'design', action: 'approve' }
          ],
          accessLevel: 'admin' as const,
          discipline: 'Systems Engineering',
          projectScale: 'medium' as const,
          organizationContext: {
            id: 'org-1',
            name: 'Example Org',
            industry: 'Technology',
            size: 'medium' as const,
            complianceRequirements: [],
            customTerminology: {}
          },
          reportsTo: [],
          manages: [],
          collaboratesWith: [],
          generatedBy: 'template' as const,
          templateSource: 'systems-template',
          aiConfidence: 0.85,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setAvailableRoles(mockRoles);
    } catch (err) {
      setError('Failed to load available roles');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setStep('role');
  };

  const handleInvite = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onInvite(email, selectedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite Team Member
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {step === 'email' ? '1' : '2'} of 2
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    autoFocus
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We'll send an invitation email to this address. If they don't have an account, 
                  they'll be prompted to create one.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Role for {email}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  Back
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableRoles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRole?.id === role.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {role.name}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {role.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Access: {role.accessLevel}</span>
                          <span>Discipline: {role.discipline}</span>
                        </div>
                      </div>
                      {selectedRole?.id === role.id && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedRole && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Role Details
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Responsibilities:</strong> {selectedRole.responsibilities.join(', ')}
                    </div>
                    <div>
                      <strong>Permissions:</strong> {selectedRole.permissions.length} permission(s)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 'email' ? (
            <Button onClick={handleEmailSubmit} disabled={!email.trim()}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleInvite} 
              disabled={!selectedRole || loading}
              variant="primary"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};