import React, { useState, useRef } from 'react';
import { LogOut, Moon, Sun, Plus, Trash2, Briefcase, LoaderCircle, Upload } from 'lucide-react';
import { Button, Card, ProgressBar } from '../components/ui';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useProject } from '../context/ProjectContext';
import { Project, ToastMessage } from '../types';

declare var JSZip: any;

export const ProjectSelectionView = ({ onSelectProject, onCreateNew, theme, setTheme, setToast }: { onSelectProject: (project: Project) => void, onCreateNew: () => void, theme: string, setTheme: (theme: string) => void, setToast: (toast: ToastMessage) => void }) => {
    const { currentUser, projects, logout, deleteProject, addProject } = useProject();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteProject = () => {
        if (!projectToDelete) return;
        deleteProject(projectToDelete.id);
        setProjectToDelete(null);
    }

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        setToast({ message: "Importing project archive...", type: 'info' });

        try {
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library is not loaded.');
            }

            const zip = await JSZip.loadAsync(file);
            
            // fix: Cast the file object to `any` to allow property access since JSZip types are not available.
            const stateFile = Object.values(zip.files).find((f: any) => f.name.endsWith('project_state.json'));
            
            if (!stateFile) {
                throw new Error('Archive is missing the required "project_state.json" file.');
            }

            const content = await (stateFile as any).async('string');
            const importedProject = JSON.parse(content) as Project;

            // Sanitize and update the imported project
            const newProject: Project = {
                ...importedProject,
                id: crypto.randomUUID(),
                userId: currentUser.id,
                createdAt: new Date(),
                name: `${importedProject.name} (Imported)`
            };

            addProject(newProject);
            setToast({ message: `Project "${newProject.name}" imported successfully!`, type: 'success' });

        } catch (error: any) {
            console.error("Failed to import project:", error);
            setToast({ message: `Import failed: ${error.message}`, type: 'error' });
        }
        
        if(event.target) event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-charcoal-900 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
                <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
            </div>
            
            <Card className="w-full max-w-3xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Workspace</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Welcome back, {currentUser?.name}!
                    </p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Your Projects</h2>
                         <div className="flex items-center space-x-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileImport}
                                className="hidden"
                                accept=".zip"
                            />
                            <Button onClick={handleImportClick} variant="outline">
                                <Upload className="w-4 h-4 mr-2"/>Import Archive
                            </Button>
                            <Button onClick={onCreateNew}><Plus className="w-4 h-4 mr-2"/>New Project</Button>
                        </div>
                    </div>
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                            {projects.map(p => (
                                <div key={p.id} className="relative group">
                                    <Card 
                                        onClick={() => onSelectProject(p)} 
                                        className="h-full cursor-pointer hover:border-brand-primary"
                                    >
                                        <h3 className="font-bold">{p.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            Created: {new Date(p.createdAt).toLocaleDateString()}
                                        </p>
                                         <ProgressBar progress={(p.phases.findIndex(ph => ph.status !== 'completed') === -1 ? 100 : (p.phases.findIndex(ph => ph.status !== 'completed') / p.phases.length) * 100)} className="mt-3"/>
                                    </Card>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setProjectToDelete(p); }}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-200 dark:bg-charcoal-700 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-opacity"
                                        aria-label={`Delete project ${p.name}`}
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg dark:border-charcoal-700">
                            <Briefcase className="w-12 h-12 mx-auto text-gray-400"/>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">No projects yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </Card>

            <ConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleDeleteProject}
                title={`Delete ${projectToDelete?.name}?`}
                description="Are you sure you want to delete this project? This action is permanent and cannot be undone."
                confirmText="Yes, Delete"
                confirmVariant="danger"
            />
        </div>
    );
};