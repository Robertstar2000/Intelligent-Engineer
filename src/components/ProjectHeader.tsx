
import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon, Search, Settings, Archive } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { UserSwitcher } from './UserSwitcher';

interface ProjectHeaderProps {
  onGoHome: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  showBackButton?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onSearch?: (query: string) => void;
  onOpenSettings?: () => void;
  onViewDocuments?: () => void;
}

const ThemeToggleButton = ({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void; }) => {
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-charcoal-900"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    );
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onGoHome, theme, setTheme, showBackButton = false, searchQuery, setSearchQuery, onSearch, onOpenSettings, onViewDocuments }) => {
  const { project } = useProject();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch && searchQuery) {
        onSearch(searchQuery);
    }
  };

  return (
    <header className="flex items-center justify-between mb-8 gap-4">
      <div className="flex-shrink-0 flex items-center gap-4">
          <button onClick={onGoHome} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">
            <ArrowLeft className="w-4 h-4 mr-2" /> 
            {showBackButton ? 'Back to Dashboard' : 'Back to Home'}
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0 px-4">
        {project && (
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-100 dark:bg-charcoal-800 border-gray-200 dark:border-charcoal-700 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                />
            </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0">
        {project && onViewDocuments && (
            <button
                onClick={onViewDocuments}
                className="hidden md:flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors mr-2"
            >
                <Archive className="w-4 h-4 mr-2" />
                Artifacts
            </button>
        )}
        {project && <UserSwitcher />}
        <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800 focus:outline-none"
            aria-label="Open settings"
        >
            <Settings className="w-5 h-5" />
        </button>
        <ThemeToggleButton theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
};
