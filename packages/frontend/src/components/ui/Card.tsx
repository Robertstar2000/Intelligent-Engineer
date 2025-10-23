import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  noPadding?: boolean;
  flexBody?: boolean;
  // Enhanced with collaborative features
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
    isActive?: boolean;
  }>;
  lastModified?: Date;
  syncStatus?: 'synced' | 'syncing' | 'error';
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  description, 
  noPadding = false, 
  flexBody = false,
  collaborators,
  lastModified,
  syncStatus,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 ${className}`} 
      {...props}
    >
      {(title || collaborators) && (
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
              {description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>}
            </div>
            
            {/* Enhanced with collaboration indicators */}
            {collaborators && collaborators.length > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="flex -space-x-2">
                  {collaborators.slice(0, 3).map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium ${
                        collaborator.isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      title={collaborator.name}
                    >
                      {collaborator.avatar ? (
                        <img src={collaborator.avatar} alt={collaborator.name} className="w-full h-full rounded-full" />
                      ) : (
                        collaborator.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
                
                {/* Sync status indicator */}
                {syncStatus && (
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-green-500' :
                    syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`} title={`Status: ${syncStatus}`} />
                )}
              </div>
            )}
          </div>
          
          {/* Last modified indicator */}
          {lastModified && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last modified: {lastModified.toLocaleString()}
            </p>
          )}
        </div>
      )}
      
      <div className={`${noPadding ? '' : "p-6"} ${flexBody ? 'flex-1 flex flex-col min-h-0' : ''}`}>
        {children}
      </div>
    </div>
  );
};