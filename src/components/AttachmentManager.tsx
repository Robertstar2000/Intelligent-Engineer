import React from 'react';
import { Paperclip, X, File as FileIcon } from 'lucide-react';
import { Sprint } from '../types';
import { Button } from './ui';

interface AttachmentManagerProps {
    sprint: Sprint;
    onUpdateAttachments: (attachments: Sprint['attachments']) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ sprint, onUpdateAttachments }) => {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const content = await fileToBase64(file);
            const newAttachment = {
                name: file.name,
                content: content.split(',')[1], // remove the data URI prefix
                mimeType: file.type,
            };
            const updatedAttachments = [...(sprint.attachments || []), newAttachment];
            onUpdateAttachments(updatedAttachments);
            event.target.value = ''; // Reset file input
        }
    };
    
    const handleRemoveAttachment = (index: number) => {
        const updatedAttachments = [...(sprint.attachments || [])];
        updatedAttachments.splice(index, 1);
        onUpdateAttachments(updatedAttachments);
    };

    return (
        <div className="mt-4 space-y-2">
            <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Attachments</h5>
            {sprint.attachments && sprint.attachments.length > 0 && (
                <div className="space-y-2">
                    {sprint.attachments.map((att, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-charcoal-700/50 p-2 rounded-md">
                            <div className="flex items-center space-x-2 truncate">
                                <FileIcon className="w-4 h-4 text-gray-500" />
                                <span className="truncate">{att.name}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveAttachment(index)} className="p-1 h-auto flex-shrink-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
             <label className="w-full">
                <span className="sr-only">Attach file</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
                <div className="flex items-center justify-center w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-charcoal-800/50 dark:border-charcoal-700">
                    <Paperclip className="w-4 h-4 mr-2"/>
                    Attach a file
                </div>
            </label>
        </div>
    );
};