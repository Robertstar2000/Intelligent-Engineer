import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { ChevronDown } from 'lucide-react';

export const UserSwitcher = () => {
    const { project, currentUser, setCurrentUser } = useProject();
    const [isOpen, setIsOpen] = useState(false);

    if (!project || !currentUser) return null;

    const handleSelect = (user) => {
        setCurrentUser(user);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-charcoal-800 hover:bg-gray-200 dark:hover:bg-charcoal-700"
            >
                <span className="text-2xl">{currentUser.avatar}</span>
                <span className="font-medium text-sm hidden sm:inline">{currentUser.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal-800 border dark:border-charcoal-700 rounded-lg shadow-lg z-20">
                    {project.users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="w-full text-left flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-charcoal-700"
                        >
                            <span className="text-xl">{user.avatar}</span>
                            <span className="text-sm">{user.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};