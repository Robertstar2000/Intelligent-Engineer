import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon, Search } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { UserSwitcher } from './UserSwitcher';

interface ProjectHeaderProps {
  onGoHome: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  showBackButton?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
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

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onGoHome, theme, setTheme, showBackButton = false, searchQuery, setSearchQuery, onSearch }) => {
  const { project } = useProject();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        onSearch(searchQuery);
    }
  };

  return (
    <header className="flex items-center justify-between mb-8 gap-4">
      <div className="flex-shrink-0">
          {showBackButton ? (
            <button onClick={onGoHome} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>
          ) : (
             <button onClick={onGoHome} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">
                <ArrowLeft className="w-4 h-4 mr-2"/> Back to Home
            </button>
          )}
      </div>

      <div className="flex-1 flex justify-center min-w-0 px-4">
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Search projects or docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-100 dark:bg-charcoal-800 border-gray-200 dark:border-charcoal-700 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
            />
        </div>
      </div>
      
      <div className="flex items-center space-x-4 flex-shrink-0">
        {project && <UserSwitcher />}
        <ThemeToggleButton theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
};