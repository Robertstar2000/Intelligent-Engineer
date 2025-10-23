import React from 'react';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Video, 
  Share2, 
  GitBranch, 
  Eye, 
  Edit3, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

// Enhanced collaboration icons
export const CollaborationIcons = {
  // Team management
  Team: Users,
  AddMember: UserPlus,
  ActiveUser: UserCheck,
  InactiveUser: UserX,
  
  // Communication
  Chat: MessageCircle,
  VideoCall: Video,
  Share: Share2,
  
  // Real-time collaboration
  LiveEdit: Edit3,
  Watching: Eye,
  Activity: Activity,
  RealTime: Zap,
  
  // Version control
  Branch: GitBranch,
  
  // Status indicators
  Online: Wifi,
  Offline: WifiOff,
  InProgress: Clock,
  Completed: CheckCircle2,
  Warning: AlertCircle,
  
  // Access control
  Public: Globe,
  Private: Lock,
  Unlocked: Unlock
};

// Custom collaboration status indicator
export interface CollaborationStatusProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const labels = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`${sizes[size]} ${colors[status]} rounded-full ${status === 'online' ? 'animate-pulse' : ''}`} />
      {showLabel && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {labels[status]}
        </span>
      )}
    </div>
  );
};

// Real-time cursor indicator
export interface CursorIndicatorProps {
  userName: string;
  color: string;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const CursorIndicator: React.FC<CursorIndicatorProps> = ({
  userName,
  color,
  position,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor */}
      <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-sm">
        <path
          d="M2 2L18 8L8 12L2 18L2 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
};