import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project, User, Phase, Comment, Task } from '../types';

interface ProjectContextType {
    project: Project | null;
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
    projects: Project[];
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    theme: string;
    setTheme: (theme: string) => void;
    
    // Auth & Project list management
    login: (email: string, pass: string) => boolean;
    signup: (name: string, email: string, pass: string) => boolean;
    logout: () => void;
    
    // Project lifecycle management
    updateProject: (updatedProject: Project) => void;
    addProject: (newProject: Project) => void;
    deleteProject: (projectId: string) => void;
    updateProjectDetails: (projectId: string, updates: { requirements: string, constraints: string }) => void;
    updatePhase: (projectId: string, phaseId: string, updates: Partial<Phase>) => void;
    addComment: (projectId: string, phaseId: string, text: string) => void;
    addTask: (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (projectId: string, updatedTask: Task) => void;
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

    const addProject = (newProject: Project) => {
        setProjects(prev => [...prev, newProject]);
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (project?.id === projectId) {
            setProject(null);
        }
    };

    const updateProjectDetails = (projectId: string, updates: { requirements: string, constraints: string }) => {
        const updateFn = (p: Project) => p.id === projectId ? { ...p, ...updates } : p;
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
    };

    const updatePhase = (projectId: string, phaseId: string, updates: Partial<Phase>) => {
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedPhases = p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph);
                return { ...p, phases: updatedPhases };
            }
            return p;
        };
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
    };

    const addComment = (projectId: string, phaseId: string, text: string) => {
        if (!currentUser) return;
        const newComment: Comment = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            phaseId, text, createdAt: new Date()
        };
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedComments = { ...p.comments };
                if (!updatedComments[phaseId]) updatedComments[phaseId] = [];
                updatedComments[phaseId].push(newComment);
                return { ...p, comments: updatedComments };
            }
            return p;
        };
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
    };

    const addTask = (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => {
         const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date() };
         const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedTasks = [...(p.tasks || []), newTask];
                return { ...p, tasks: updatedTasks };
            }
            return p;
         };
         setProjects(prev => prev.map(updateFn));
         if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
    };

    const updateTask = (projectId: string, updatedTask: Task) => {
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedTasks = (p.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
                return { ...p, tasks: updatedTasks };
            }
            return p;
         };
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
    };

    const login = (email: string, pass: string): boolean => {
        const users: User[] = JSON.parse(localStorage.getItem('vibe_engineering_users') || '[]');
        const user = users.find(u => u.email === email);
        // This is a mock password check. In a real app, this would be a hashed password check.
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const signup = (name: string, email: string, pass: string): boolean => {
        let users: User[] = JSON.parse(localStorage.getItem('vibe_engineering_users') || '[]');
        if (users.some(u => u.email === email)) {
            return false; // User already exists
        }
        const newUser: User = { 
            id: crypto.randomUUID(), 
            name, 
            email, 
            role: 'Engineer', 
            avatar: '👤' 
        };
        users.push(newUser);
        localStorage.setItem('vibe_engineering_users', JSON.stringify(users));
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
            projects,
            currentUser,
            setCurrentUser,
            theme, setTheme,
            login, signup, logout,
            updateProject, addProject, deleteProject, updateProjectDetails, updatePhase, addComment, addTask, updateTask
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