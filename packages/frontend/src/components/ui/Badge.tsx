import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error' | 'online' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // Enhanced with real-time status
  isLive?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  isLive = false,
  pulse = false
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    online: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const baseClasses = `inline-flex items-center rounded-full font-medium ${sizes[size]} ${variants[variant]}`;
  const pulseClasses = pulse ? 'animate-pulse' : '';
  const liveClasses = isLive ? 'relative' : '';

  return (
    <span className={`${baseClasses} ${pulseClasses} ${liveClasses} ${className}`}>
      {isLive && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
      )}
      {children}
    </span>
  );
};