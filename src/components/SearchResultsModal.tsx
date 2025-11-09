import React from 'react';
import { X, FileText } from 'lucide-react';
import { Card, Button } from './ui';
import { SearchResult } from '../types';

interface SearchResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: SearchResult[];
    onSelect: (docId: string) => void;
}

const HighlightedSnippet = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-brand-yellow/50 dark:bg-brand-yellow/70 text-black rounded px-0.5">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};


export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ isOpen, onClose, results, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <Card 
                className="w-full max-w-2xl h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                noPadding
                flexBody
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <h2 className="text-xl font-bold">Search Results</h2>
                     <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {results.length > 0 ? (
                        <div className="space-y-3">
                            {results.map(result => (
                                <button
                                    key={result.docId}
                                    onClick={() => onSelect(result.docId)}
                                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-charcoal-800/50 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                        <h3 className="font-semibold truncate">{result.docName}</h3>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        <HighlightedSnippet text={result.snippet} highlight={result.query} />
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No results found.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};