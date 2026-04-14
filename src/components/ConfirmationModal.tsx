

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button, Card } from './ui';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center z-[100] overflow-y-auto p-4 sm:p-10"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <Card
                className="w-full max-w-md my-auto transform transition-all relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse">
                    <Button
                        variant={confirmVariant}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="mt-3 sm:mt-0"
                    >
                        {cancelText}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
