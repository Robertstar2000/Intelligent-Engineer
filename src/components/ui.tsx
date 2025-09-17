import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 focus:ring-gray-500'
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} onClick={onClick} disabled={disabled} {...props}>{children}</button>;
};

// FIX: Updated Card component to accept and spread additional props like onClick to resolve a type error in HelpModal.tsx.
export const Card = ({ children, className = '', title, description, ...props }: { children: any, className?: string, title?: any, description?: any, [key: string]: any }) => (
  <div className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 ${className}`} {...props}>
    {title && (
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
};

export const ProgressBar = ({ progress, className = '' }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
  </div>
);