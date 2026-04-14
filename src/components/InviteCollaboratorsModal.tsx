import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { X } from 'lucide-react';

interface InviteCollaboratorsModalProps {
    onClose: () => void;
}

export const InviteCollaboratorsModal: React.FC<InviteCollaboratorsModalProps> = ({ onClose }) => {
    const { project, updateCollaboratorEmails } = useProject();
    const [emails, setEmails] = useState(project?.collaborators?.join('\n') || '');

    const handleSave = () => {
        if (!project) return;
        const emailList = emails.split('\n').map(e => e.trim()).filter(e => e !== '');
        updateCollaboratorEmails(project.id, emailList);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} noPadding>
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <h2 className="text-xl font-bold">Invite Collaborators</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <label htmlFor="emails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter email addresses (one per line)</label>
                    <textarea
                        id="emails"
                        rows={6}
                        value={emails}
                        onChange={e => setEmails(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        placeholder="email1@example.com&#10;email2@example.com"
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Collaborators</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
