
import React, { useState } from 'react';
import { X, Save, Download, Upload, User, BrainCircuit, LoaderCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { ToastMessage, Project } from '../types';
import { dbService } from '../services/db';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, setToast }) => {
    const { currentUser, updateUserProfile, project, updateProject, projects, addProject, geminiKey, setGeminiKey } = useProject();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [occupation, setOccupation] = useState(currentUser?.occupation || '');
    const [aiModel, setAiModel] = useState(project?.aiModel || 'gemini-3-flash-preview');
    const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSaveAndRestart = () => {
        setIsSaving(true);
        updateUserProfile({ name, email, occupation });
        setGeminiKey(localGeminiKey);
        if (project) {
            updateProject({ ...project, aiModel });
        }
        setToast({ message: 'Settings updated successfully. Restarting...', type: 'success' });
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const handleFullBackup = () => {
        // Use projects from context which are loaded from DB
        const fullState = {
            currentUser,
            projects: projects, 
            settings: { theme: localStorage.getItem('theme'), aiModel }
        };
        const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibra_engineer_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        setToast({ message: 'Full system backup downloaded.', type: 'success' });
    };

    const handleFullRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const state = JSON.parse(event.target?.result as string);
                if (state.currentUser && state.projects) {
                    setIsSaving(true); // Show saving state during async restore
                    
                    // Restore User to DB
                    await dbService.saveUser(state.currentUser);
                    localStorage.setItem('vibe_currentUserId', state.currentUser.id);
                    
                    // Restore Projects to DB
                    // We iterate and save each project properly
                    if (Array.isArray(state.projects)) {
                        for (const p of state.projects) {
                            await dbService.saveProject(p);
                        }
                    }

                    // Restore Settings
                    if(state.settings?.theme) {
                        localStorage.setItem('theme', state.settings.theme);
                    }

                    setToast({ message: 'Full system restored. Reloading...', type: 'success' });
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error('Invalid backup file structure.');
                }
            } catch (err: any) {
                console.error(err);
                setToast({ message: `Failed to restore backup: ${err.message}`, type: 'error' });
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[200] p-4" onClick={onClose}>
            <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()} noPadding>
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <h2 className="text-xl font-bold">App Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <User className="w-4 h-4" /> User Profile
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium mb-1">Occupation</label>
                                <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g. Senior Mechanical Engineer" className="w-full p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* AI Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> AI Configuration
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Gemini Model</label>
                                <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="w-full p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600">
                                    <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                                    <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex Reasoning)</option>
                                    <option value="gemini-2.5-flash-lite-latest">Gemini 2.5 Flash Lite</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Gemini API Key</label>
                                <input 
                                    type="password" 
                                    value={localGeminiKey} 
                                    onChange={e => setLocalGeminiKey(e.target.value)} 
                                    placeholder="Enter your API key"
                                    className="w-full p-2 border rounded-md dark:bg-charcoal-700 dark:border-gray-600" 
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></p>
                            </div>
                        </div>
                    </div>

                    {/* Backup & Restore */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">System Maintenance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" size="sm" onClick={handleFullBackup} className="w-full">
                                <Download className="w-4 h-4 mr-2" /> Backup
                            </Button>
                            <label className="w-full">
                                <input type="file" onChange={handleFullRestore} className="hidden" accept=".json" />
                                <div className="flex items-center justify-center w-full px-3 py-2 text-sm border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-charcoal-800/50 dark:border-charcoal-700 border-gray-300 dark:border-gray-600">
                                    <Upload className="w-4 h-4 mr-2" /> Restore
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-charcoal-700">
                        <Button onClick={handleSaveAndRestart} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save and Restart
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
