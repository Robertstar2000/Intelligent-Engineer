
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui';
import { Remarkable } from 'remarkable';

declare const Prism: any;

const md = new Remarkable({
    html: true,
    typographer: true,
    highlight: function (str, lang) {
        if (lang && typeof Prism !== 'undefined' && Prism.languages[lang]) {
            try {
                return Prism.highlight(str, Prism.languages[lang], lang);
            } catch (e) {
                console.error(e);
            }
        }
        return '';
    },
});

export const InfoModal = ({ isOpen, onClose, title, content }) => {
    useEffect(() => {
        if (isOpen && typeof Prism !== 'undefined') {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, [isOpen, content]);

    // Close on escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <Card 
                className="w-full max-w-4xl h-[90vh] flex flex-col transform transition-all"
                onClick={(e) => e.stopPropagation()}
                noPadding={true}
                flexBody={true}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div 
                    className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(content) }}
                />
            </Card>
        </div>
    );
};
