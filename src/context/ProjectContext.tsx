import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from '../types';

interface ProjectContextType {
    project: Project | null;
    // FIX: Changed setProject type to allow functional updates, which is standard for useState setters, resolving the type error in index.tsx.
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [project, setProject] = useState<Project | null>(() => {
        try {
            if (typeof window === 'undefined') return null;
            const savedProject = localStorage.getItem('currentProject');
            return savedProject ? JSON.parse(savedProject) : null;
        } catch (error) {
            console.error('Failed to load project from localStorage', error);
            return null;
        }
    });

    // FIX: Replaced custom setProject wrapper with useEffect to handle localStorage persistence.
    // This is the correct React pattern for managing side effects and allows setProject to be
    // passed directly from useState, enabling functional updates.
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                if (project) {
                    localStorage.setItem('currentProject', JSON.stringify(project));
                } else {
                    localStorage.removeItem('currentProject');
                }
            }
        } catch (error) {
            console.error('Failed to save project to localStorage', error);
        }
    }, [project]);

    return (
        <ProjectContext.Provider value={{ project, setProject }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
