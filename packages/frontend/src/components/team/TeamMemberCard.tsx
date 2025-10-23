import React, { useState } from 'react';
import { TeamMember, DynamicRole } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  MoreVertical, 
  Edit3, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TeamMemberCardProps {
  member: TeamMember;
  isCurrentUser: boolean;
  isOnline: boolean;
  canManage: boolean;
  onUpdateRole: (newRole: DynamicRole) => void;
  onRemove: () => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  isCurrentUser,
  isOnline,
  canManage,
  onUpdateRole,
  onRemove
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatLastActivity = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPermissionSummary = (permissions: any[]) => {
    if (!permissions || permissions.length === 0) return 'No permissions';
    
    const permissionTypes = permissions.map(p => p.action).join(', ');
    return permissionTypes.length > 30 ? `${permissionTypes.substring(0, 30)}...` : permissionTypes;
  };

  return (
    <Card className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {member.user?.avatar ? (
                <img 
                  src={member.user.avatar} 
                  alt={member.user.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                member.user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            
            {/* Online status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {member.user?.name || 'Unknown User'}
              </h3>
              {isCurrentUser && (
                <Badge variant="info" size="sm">You</Badge>
              )}
              <Badge variant={isOnline ? 'online' : 'offline'} size="sm" isLive={isOnline}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Mail className="w-4 h-4" />
              <span>{member.user?.email}</span>
            </div>

            {/* Role Information */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {member.role.name}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {member.role.description}
              </p>

              {/* Permissions Summary */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Permissions:</strong> {getPermissionSummary(member.permissions)}
              </div>

              {/* Responsibilities */}
              {member.role.responsibilities && member.role.responsibilities.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <strong>Responsibilities:</strong> {member.role.responsibilities.slice(0, 2).join(', ')}
                  {member.role.responsibilities.length > 2 && '...'}
                </div>
              )}
            </div>

            {/* Activity Info */}
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
              </div>
              {member.lastActivity && (
                <div className="flex items-center space-x-1">
                  <span>Last active {formatLastActivity(member.lastActivity)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {canManage && !isCurrentUser && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="p-2"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowActions(false);
                      // TODO: Open role edit modal
                      console.log('Edit role for', member.user?.name);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Role</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onRemove();
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Member</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-xs">
            {member.isActive ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">Inactive</span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Access Level: <span className="font-medium">{member.role.accessLevel}</span>
          </div>
        </div>

        {/* Role Badge */}
        <Badge variant="default" size="sm">
          {member.role.discipline}
        </Badge>
      </div>

      {/* Click outside to close actions menu */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </Card>
  );
};