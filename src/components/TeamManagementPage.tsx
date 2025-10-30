import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { User, ToastMessage } from '../types';
import { ProjectHeader } from './ProjectHeader';
import { Card, Button } from './ui';
import { ConfirmationModal } from './ConfirmationModal';
import { Users, Plus, Trash2, BrainCircuit, LoaderCircle } from 'lucide-react';
import { suggestTeamRoles } from '../services/geminiService';

interface InviteMemberModalProps {
    onInvite: (user: Omit<User, 'id' | 'email'>) => void;
    onClose: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onInvite, onClose }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [avatar, setAvatar] = useState('');
    const [email, setEmail] = useState('');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && role && avatar) {
            onInvite({ name, role, avatar });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card title="Invite New Member" className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <input type="text" id="role" value={role} onChange={e => setRole(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar (Emoji)</label>
                        <input type="text" id="avatar" value={avatar} onChange={e => setAvatar(e.target.value)} required maxLength={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Send Invite</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


interface TeamManagementPageProps {
  onBack: () => void;
  setToast: (toast: ToastMessage | null) => void;
}

export const TeamManagementPage: React.FC<TeamManagementPageProps> = ({ onBack, setToast }) => {
    const { project, setProject, currentUser, theme, setTheme } = useProject();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [userToRemove, setUserToRemove] = useState<User | null>(null);
    const [suggestedRoles, setSuggestedRoles] = useState<string[] | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    if (!project) return null;

    const handleAddUser = (newUser: Omit<User, 'id' | 'email'>) => {
        setProject(p => {
            if (!p) return null;
            const finalUser = { ...newUser, id: `user-${Date.now()}`, email: `${newUser.name.toLowerCase().replace(' ','_')}@example.com` };
            return { ...p, users: [...p.users, finalUser] };
        });
        setIsInviteModalOpen(false);
        setToast({ message: `${newUser.name} has been added to the project.`, type: 'success' });
    };

    const handleRemoveUserConfirm = () => {
        if (!userToRemove) return;
        
        if (project.users.length <= 1) {
            setToast({ message: "You cannot remove the last member of the project.", type: 'error' });
            setUserToRemove(null);
            return;
        }

        setProject(p => {
            if (!p) return null;
            return { ...p, users: p.users.filter(u => u.id !== userToRemove.id) };
        });
        
        setToast({ message: `${userToRemove.name} has been removed.`, type: 'success' });
        setUserToRemove(null);
    };

    const handleSuggestRoles = async () => {
        if (!project) return;
        setIsSuggesting(true);
        try {
            const roles = await suggestTeamRoles(project);
            setSuggestedRoles(roles);
            setToast({ message: 'Successfully suggested team roles.', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to suggest roles.', type: 'error' });
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <ProjectHeader onGoHome={onBack} theme={theme} setTheme={setTheme} showBackButton />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Team</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Add, remove, and manage your project members.</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                    <Plus className="mr-2 w-4 h-4" /> Invite Member
                </Button>
            </div>

            <Card>
                <div className="space-y-3">
                    {project.users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-charcoal-800/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <span className="text-3xl">{user.avatar}</span>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{user.name} {currentUser?.id === user.id && '(You)'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setUserToRemove(user)}>
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="AI Role Suggester" description="Analyze project documents to suggest necessary team roles." className="mt-6">
                {isSuggesting ? (
                    <div className="text-center p-4"><LoaderCircle className="w-6 h-6 animate-spin mx-auto text-brand-primary"/></div>
                ) : suggestedRoles ? (
                    <div className="p-4">
                        <h4 className="font-semibold mb-2">Suggested Roles:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {suggestedRoles.map((role, index) => <li key={index}>{role}</li>)}
                        </ul>
                    </div>
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click to have an AI analyze your project and suggest key roles.</p>
                        <Button onClick={handleSuggestRoles}>
                            <BrainCircuit className="w-4 h-4 mr-2" /> Suggest Roles
                        </Button>
                    </div>
                )}
            </Card>
            
            {isInviteModalOpen && <InviteMemberModal onInvite={handleAddUser} onClose={() => setIsInviteModalOpen(false)} />}

            <ConfirmationModal
                isOpen={!!userToRemove}
                onClose={() => setUserToRemove(null)}
                onConfirm={handleRemoveUserConfirm}
                title={`Remove ${userToRemove?.name}?`}
                description={`Are you sure you want to remove ${userToRemove?.name} from the project? This action cannot be undone.`}
                confirmText="Yes, Remove"
                confirmVariant="danger"
            />
        </div>
    );
};