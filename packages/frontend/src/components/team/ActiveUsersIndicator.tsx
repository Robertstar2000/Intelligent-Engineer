import React from 'react';
import { ActiveUser } from '@shared/types';
import { Badge } from '../ui/Badge';
import { Users, Circle } from 'lucide-react';

interface ActiveUsersIndicatorProps {
  activeUsers: ActiveUser[];
  maxVisible?: number;
  showNames?: boolean;
}

export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({
  activeUsers,
  maxVisible = 5,
  showNames = false
}) => {
  const onlineUsers = activeUsers.filter(user => user.isOnline);
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineUsers.length - maxVisible);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="relative group"
            title={`${user.name} - ${user.isOnline ? 'Online' : 'Offline'}`}
          >
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Online status indicator */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />

            {/* Tooltip */}
            {showNames && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {user.name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        ))}
        
        {/* Remaining count indicator */}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-medium">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Circle className="w-2 h-2 text-green-500 fill-current" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {onlineUsers.length} online
          </span>
        </div>
        
        {activeUsers.length > onlineUsers.length && (
          <div className="flex items-center space-x-1">
            <Circle className="w-2 h-2 text-gray-400 fill-current" />
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {activeUsers.length - onlineUsers.length} offline
            </span>
          </div>
        )}
      </div>

      {/* Live indicator for active collaboration */}
      {onlineUsers.length > 1 && (
        <Badge variant="success" size="sm" isLive pulse>
          Live
        </Badge>
      )}
    </div>
  );
};