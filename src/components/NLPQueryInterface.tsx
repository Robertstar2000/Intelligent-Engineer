import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, LoaderCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { queryProjectData } from '../services/geminiService';
import { Remarkable } from 'remarkable';

const md = new Remarkable({ html: true, typographer: true });

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface NLPQueryInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NLPQueryInterface: React.FC<NLPQueryInterfaceProps> = ({ isOpen, onClose }) => {
    const { project, currentUser } = useProject();
    const [messages, setMessages] = useState<Message[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ sender: 'ai', text: 'Hello! Ask me anything about your project.' }]);
        }
    }, [isOpen, messages.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !project || isLoading) return;

        const userMessage: Message = { sender: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const aiResponseText = await queryProjectData(project, query);
            const aiMessage: Message = { sender: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            const errorMessage: Message = { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-end justify-center z-[100] p-4 sm:items-center"
            onClick={onClose}
        >
            <Card 
                className="w-full max-w-2xl h-[80vh] flex flex-col transform transition-all"
                onClick={(e) => e.stopPropagation()}
                noPadding={true}
                flexBody={true}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-charcoal-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Q&A</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-700"
                        aria-label="Close Project Q&A"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <span className="text-2xl flex-shrink-0 mt-1"><Bot /></span>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-brand-primary text-charcoal-900' : 'bg-gray-100 dark:bg-charcoal-700'}`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(msg.text) }} />
                            </div>
                            {msg.sender === 'user' && <span className="text-2xl flex-shrink-0 mt-1">{currentUser?.avatar || <User />}</span>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start space-x-3">
                            <span className="text-2xl flex-shrink-0 mt-1"><Bot /></span>
                            <div className="p-3 rounded-lg bg-gray-100 dark:bg-charcoal-700">
                                <LoaderCircle className="w-5 h-5 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="p-4 border-t dark:border-charcoal-700 flex items-center space-x-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about your project..."
                        className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-800 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <Button type="submit" disabled={!query.trim() || isLoading}>
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </Card>
        </div>
    );
};