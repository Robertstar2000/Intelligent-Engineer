import React from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { UserSwitcher } from './UserSwitcher';

interface ProjectHeaderProps {
  onGoHome: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  showBackButton?: boolean;
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

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onGoHome, theme, setTheme, showBackButton = false }) => {
  const { project } = useProject();

  return (
    <header className="flex items-center justify-between mb-8">
      {showBackButton ? (
        <button onClick={onGoHome} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      ) : (
         <button onClick={onGoHome} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2"/> Back to Home
        </button>
      )}
      <div className="flex items-center space-x-4">
        {project && <UserSwitcher />}
        <ThemeToggleButton theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
};