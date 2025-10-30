import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project, User } from '../types';

interface ProjectContextType {
    project: Project | null;
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    currentUser: User | null;
    // FIX: Exposed setCurrentUser to allow components to change the active user.
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    theme: string;
    setTheme: (theme: string) => void;
    updateProject: (updatedProject: Project) => void;
    login: (email: string, pass: string) => boolean;
    signup: (name: string, email: string, pass: string) => boolean;
    logout: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
    children?: ReactNode;
    theme: string;
    setTheme: (theme: string) => void;
}

export const ProjectProvider = ({ children, theme, setTheme }: ProjectProviderProps) => {
    const [project, setProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load current user from session storage on initial load
    useEffect(() => {
        try {
            const savedUser = sessionStorage.getItem('currentUser');
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
        } catch (error) {
            setCurrentUser(null);
        }
    }, []);

    // Load projects when currentUser changes
    useEffect(() => {
        if (typeof window !== 'undefined' && currentUser) {
            try {
                const savedProjects = localStorage.getItem(`projects_${currentUser.id}`);
                setProjects(savedProjects ? JSON.parse(savedProjects) : []);
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            } catch (error) {
                setProjects([]);
            }
        } else {
            setProjects([]);
            sessionStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    // Save projects when they change
    useEffect(() => {
        if (typeof window !== 'undefined' && currentUser) {
            try {
                localStorage.setItem(`projects_${currentUser.id}`, JSON.stringify(projects));
            } catch (error) {
                // handle error
            }
        }
    }, [projects, currentUser]);

    const updateProject = (updatedProject: Project) => {
        setProjects(prevProjects => {
            const projectExists = prevProjects.some(p => p.id === updatedProject.id);
            if (projectExists) {
                return prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p);
            } else {
                return [...prevProjects, updatedProject];
            }
        });
        if (project && project.id === updatedProject.id) {
            setProject(updatedProject);
        }
    };

    const login = (email: string, pass: string): boolean => {
        const users: User[] = JSON.parse(localStorage.getItem('intelligent_engineer_users') || '[]');
        const user = users.find(u => u.email === email);
        // This is a mock password check. In a real app, this would be a hashed password check.
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const signup = (name: string, email: string, pass: string): boolean => {
        let users: User[] = JSON.parse(localStorage.getItem('intelligent_engineer_users') || '[]');
        if (users.some(u => u.email === email)) {
            return false; // User already exists
        }
        const newUser: User = { 
            id: `user-${Date.now()}`, 
            name, 
            email, 
            role: 'Engineer', 
            avatar: '👤' 
        };
        users.push(newUser);
        localStorage.setItem('intelligent_engineer_users', JSON.stringify(users));
        setCurrentUser(newUser);
        return true;
    };

    const logout = () => {
        setCurrentUser(null);
        setProject(null);
        sessionStorage.removeItem('currentUser');
    };


    return (
        <ProjectContext.Provider value={{ 
            project, setProject, 
            projects, setProjects,
            currentUser,
            // FIX: Added setCurrentUser to the provider value.
            setCurrentUser,
            theme, setTheme,
            updateProject,
            login, signup, logout
        }}>
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