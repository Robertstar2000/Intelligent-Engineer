import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui';
import { Remarkable } from 'remarkable';
import { HELP_CONTENT } from '../helpContent';

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

export const HelpModal = ({ onClose }) => {
    useEffect(() => {
        if (typeof Prism !== 'undefined') {
            setTimeout(() => Prism.highlightAll(), 0);
        }
    }, []);

    // Close on escape key press
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <Card 
                className="w-full max-w-4xl h-[90vh] flex flex-col transform transition-all"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the card
                noPadding={true}
                flexBody={true}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help & User Guide</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close help guide"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div 
                    className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: md.render(HELP_CONTENT) }}
                />
            </Card>
        </div>
    );
};