import React from 'react';

export interface ProgressBarProps {
  progress: number;
  className?: string;
  // Enhanced with team progress visualization
  teamProgress?: Array<{
    userId: string;
    userName: string;
    progress: number;
    color?: string;
  }>;
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  teamProgress,
  showPercentage = false,
  animated = true,
  size = 'md'
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const animationClasses = animated ? 'transition-all duration-500 ease-out' : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Main progress bar */}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizes[size]} relative overflow-hidden`}>
        <div 
          className={`bg-gradient-to-r from-blue-500 to-purple-500 ${sizes[size]} rounded-full ${animationClasses}`}
          style={{ width: `${normalizedProgress}%` }}
        />
        
        {/* Team progress overlay */}
        {teamProgress && teamProgress.length > 0 && (
          <div className="absolute inset-0 flex">
            {teamProgress.map((member, index) => (
              <div
                key={member.userId}
                className={`${sizes[size]} ${animationClasses}`}
                style={{
                  width: `${Math.max(0, Math.min(100, member.progress))}%`,
                  backgroundColor: member.color || `hsl(${index * 137.5}, 70%, 50%)`,
                  opacity: 0.7
                }}
                title={`${member.userName}: ${member.progress}%`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Progress percentage */}
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(normalizedProgress)}%
          </span>
          
          {/* Team member progress details */}
          {teamProgress && teamProgress.length > 0 && (
            <div className="flex space-x-2">
              {teamProgress.slice(0, 3).map((member, index) => (
                <span
                  key={member.userId}
                  className="text-xs text-gray-500 dark:text-gray-400"
                  style={{ color: member.color || `hsl(${index * 137.5}, 70%, 50%)` }}
                >
                  {member.userName}: {Math.round(member.progress)}%
                </span>
              ))}
              {teamProgress.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{teamProgress.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};