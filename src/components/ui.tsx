import React from 'react';
import { Zap, BrainCircuit } from 'lucide-react';

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', ...props }: { children?: React.ReactNode; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; variant?: string; size?: string; disabled?: boolean; className?: string; [key: string]: any }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-charcoal-900';
  const variants = {
    primary: 'bg-brand-primary hover:bg-opacity-90 text-charcoal-900 shadow-lg hover:shadow-xl focus:ring-brand-primary',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-charcoal-700 dark:hover:bg-charcoal-700/80 dark:text-white focus:ring-gray-500',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 dark:border-charcoal-700 dark:hover:border-gray-500 dark:text-gray-300 dark:hover:bg-charcoal-800 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-charcoal-800 focus:ring-gray-500',
    danger: 'bg-brand-accent hover:bg-opacity-90 text-white shadow-md focus:ring-red-500'
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} onClick={onClick} disabled={disabled} {...props}>{children}</button>;
};

export const Card = ({ children, className = '', title, description, noPadding = false, flexBody = false, ...props }: { children?: React.ReactNode, className?: string, title?: any, description?: any, noPadding?: boolean, flexBody?: boolean, [key: string]: any }) => (
  <div className={`bg-white dark:bg-charcoal-800/50 rounded-xl shadow-lg border border-gray-100 dark:border-charcoal-700/50 hover:shadow-xl transition-all duration-300 ${className}`} {...props}>
    {title && (
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>}
      </div>
    )}
    <div className={`${noPadding ? '' : "p-6"} ${flexBody ? 'flex-1 flex flex-col min-h-0' : ''}`}>{children}</div>
  </div>
);

// FIX: Update Badge component to accept rest props to fix typing issue with 'key' prop.
// IMPROVEMENT: Use a more specific type for the variant prop.
export const Badge = ({ children, variant = 'default', className = '', ...props }: { children?: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info', className?: string, [key: string]: any }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-charcoal-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    info: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`} {...props}>{children}</span>;
};

export const ProgressBar = ({ progress, className = '' }: { progress: number, className?: string }) => (
  <div className={`w-full bg-gray-200 dark:bg-charcoal-700 rounded-full h-2 ${className}`}>
    <div className="bg-brand-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
  </div>
);

export const ModelBadge = ({ modelName, prefix = 'Using' }: { modelName: string, prefix?: string }) => {
    const isPro = modelName.includes('pro');
    const Icon = isPro ? BrainCircuit : Zap;
    const text = isPro ? 'Gemini Pro' : 'Gemini Flash';
    const variant = isPro ? 'warning' : 'info';
    
    return (
        <Badge variant={variant} className="flex items-center space-x-1.5 py-1 px-2">
            <Icon className="w-3.5 h-3.5" />
            <span>{prefix} {text}</span>
        </Badge>
    );
};