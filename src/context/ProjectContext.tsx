
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project, User, Phase, Comment, Task } from '../types';
import { generateUUID } from '../utils/crypto';
import { setCustomApiKey } from '../services/geminiService';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface ProjectContextType {
    project: Project | null;
    setProject: React.Dispatch<React.SetStateAction<Project | null>>;
    projects: Project[];
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    geminiKey: string;
    setGeminiKey: (key: string) => void;
    theme: string;
    setTheme: (theme: string) => void;
    
    // Auth & Project list management
    login: (email: string, pass: string) => Promise<boolean>;
    signup: (username: string, email: string, pass: string, geminiKey?: string) => Promise<boolean>;
    logout: () => void;
    updateUserProfile: (updates: Partial<User>) => void;
    
    // Project lifecycle management
    updateProject: (updatedProject: Project) => void;
    addProject: (newProject: Project) => void;
    deleteProject: (projectId: string) => void;
    deleteAllProjects: () => void;
    updateProjectDetails: (projectId: string, updates: { requirements: string, constraints: string }) => void;
    updatePhase: (projectId: string, phaseId: string, updates: Partial<Phase>) => void;
    addComment: (projectId: string, phaseId: string, text: string) => void;
    addTask: (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (projectId: string, updatedTask: Task) => void;
    updateCollaboratorEmails: (projectId: string, emails: string[]) => void;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
    children?: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
    const [project, setProject] = useState<Project | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [geminiKey, setGeminiKeyInternal] = useState(() => localStorage.getItem('hmap-gemini-api-key') || '');
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return localStorage.getItem('theme') || 'dark';
    });

    const setTheme = (newTheme: string) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    };

    useEffect(() => {
        setTheme(theme);
    }, []);

    useEffect(() => {
        setCustomApiKey(geminiKey);
    }, [geminiKey]);

    const setGeminiKey = (key: string) => {
        setGeminiKeyInternal(key);
        setCustomApiKey(key);
        localStorage.setItem('hmap-gemini-api-key', key);
        if (currentUser) {
            updateUserProfile({ geminiKey: key });
        }
    };

    // Firebase Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, load data
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    setCurrentUser(userData);
                    if (userData.geminiKey) {
                        setGeminiKeyInternal(userData.geminiKey);
                        setCustomApiKey(userData.geminiKey);
                        localStorage.setItem('hmap-gemini-api-key', userData.geminiKey);
                    }
                    
                    // Load projects
                    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const userProjects = querySnapshot.docs.map(doc => doc.data() as Project);
                    setProjects(userProjects);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setProjects([]);
                setProject(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateProject = async (updatedProject: Project) => {
        const normalizedProject = {
            ...updatedProject,
            disciplines: Array.isArray(updatedProject.disciplines) ? updatedProject.disciplines : Object.keys(updatedProject.disciplines || {})
        };
        setProjects(prevProjects => {
            const projectExists = prevProjects.some(p => p.id === normalizedProject.id);
            if (projectExists) {
                return prevProjects.map(p => p.id === normalizedProject.id ? normalizedProject : p);
            } else {
                return [...prevProjects, normalizedProject];
            }
        });
        if (project && project.id === normalizedProject.id) {
            setProject(normalizedProject);
        }
        // Persist to Firestore
        await setDoc(doc(db, 'projects', normalizedProject.id), normalizedProject);
    };

    const addProject = async (newProject: Project) => {
        const normalizedProject = {
            ...newProject,
            disciplines: Array.isArray(newProject.disciplines) ? newProject.disciplines : Object.keys(newProject.disciplines || {})
        };
        setProjects(prev => [...prev, normalizedProject]);
        await setDoc(doc(db, 'projects', normalizedProject.id), normalizedProject);
    };

    const deleteProject = async (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (project?.id === projectId) {
            setProject(null);
        }
        await deleteDoc(doc(db, 'projects', projectId));
    };

    const deleteAllProjects = async () => {
        if (!currentUser) return;
        setProjects([]);
        setProject(null);
        const q = query(collection(db, 'projects'), where('userId', '==', currentUser.id));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    };

    const updateProjectDetails = async (projectId: string, updates: { requirements: string, constraints: string }) => {
        const updateFn = (p: Project) => p.id === projectId ? { ...p, ...updates } : p;
        
        let updatedProject: Project | undefined;
        setProjects(prev => {
            const next = prev.map(updateFn);
            updatedProject = next.find(p => p.id === projectId);
            return next;
        });
        
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
        
        if (updatedProject) {
            await setDoc(doc(db, 'projects', projectId), updatedProject);
        }
    };

    const updatePhase = async (projectId: string, phaseId: string, updates: Partial<Phase>) => {
        let updatedProject: Project | undefined;
        
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedPhases = p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph);
                updatedProject = { ...p, phases: updatedPhases };
                return updatedProject;
            }
            return p;
        };
        
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
        
        if (updatedProject) {
            await setDoc(doc(db, 'projects', projectId), updatedProject);
        }
    };

    const addComment = async (projectId: string, phaseId: string, text: string) => {
        if (!currentUser) return;
        const newComment: Comment = {
            id: generateUUID(),
            userId: currentUser.id,
            phaseId, text, createdAt: new Date()
        };
        
        let updatedProject: Project | undefined;
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedComments = { ...p.comments };
                if (!updatedComments[phaseId]) updatedComments[phaseId] = [];
                updatedComments[phaseId].push(newComment);
                updatedProject = { ...p, comments: updatedComments };
                return updatedProject;
            }
            return p;
        };
        
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
        
        if (updatedProject) {
            await setDoc(doc(db, 'projects', projectId), updatedProject);
        }
    };

    const addTask = async (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => {
         const newTask: Task = { ...task, id: generateUUID(), createdAt: new Date() };
         let updatedProject: Project | undefined;
         
         const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedTasks = [...(p.tasks || []), newTask];
                updatedProject = { ...p, tasks: updatedTasks };
                return updatedProject;
            }
            return p;
         };
         
         setProjects(prev => prev.map(updateFn));
         if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
         
         if (updatedProject) {
             await setDoc(doc(db, 'projects', projectId), updatedProject);
         }
    };

    const updateTask = async (projectId: string, updatedTask: Task) => {
        let updatedProject: Project | undefined;
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                const updatedTasks = (p.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t);
                updatedProject = { ...p, tasks: updatedTasks };
                return updatedProject;
            }
            return p;
        };
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
        
        if (updatedProject) {
            await setDoc(doc(db, 'projects', projectId), updatedProject);
        }
    };

    const updateCollaboratorEmails = async (projectId: string, emails: string[]) => {
        let updatedProject: Project | undefined;
        const updateFn = (p: Project) => {
            if (p.id === projectId) {
                updatedProject = { ...p, collaborators: emails };
                return updatedProject;
            }
            return p;
        };
        setProjects(prev => prev.map(updateFn));
        if (project?.id === projectId) setProject(p => p ? updateFn(p) : null);
        
        if (updatedProject) {
            await setDoc(doc(db, 'projects', projectId), updatedProject);
        }
    };

    const login = async (email: string, pass: string): Promise<boolean> => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const signup = async (username: string, email: string, pass: string, geminiKey?: string): Promise<boolean> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const newUser: User = {
                id: userCredential.user.uid,
                name: username,
                email,
                role: 'Engineer',
                avatar: '👤',
                geminiKey
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            setCurrentUser(newUser);
            return true;
        } catch (error) {
            console.error("Signup error:", error);
            return false;
        }
    };

    const updateUserProfile = async (updates: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
    };

    const logout = async () => {
        await auth.signOut();
        setCurrentUser(null);
        setProject(null);
        setProjects([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-charcoal-900 text-gray-900 dark:text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <ProjectContext.Provider value={{ 
            project, setProject, 
            projects,
            currentUser,
            setCurrentUser,
            geminiKey,
            setGeminiKey,
            theme, setTheme,
            login, signup, logout, updateUserProfile,
            updateProject, addProject, deleteProject, deleteAllProjects, updateProjectDetails, updatePhase, addComment, addTask, updateTask, updateCollaboratorEmails,
            isLoading
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
