
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { Card, Button, Badge } from './ui';
import { X, Send, Paperclip, FileText, Users as UsersIcon, Check } from 'lucide-react';
import { Project, Phase, Sprint, Message, User } from '../types';

interface CollaborationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Extend message type locally for recipient support
interface ExtendedMessage extends Message {
    recipients?: string[]; // IDs of users or ['all']
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const SIMULATED_TEAMMATES = [
    { name: 'Alex', avatar: '🧑‍💻' },
    { name: 'Brenda', avatar: '👩‍🔬' },
    { name: 'Charles', avatar: '👨‍🔧' },
];

const SIMULATED_REPLIES = [
    "Got it, thanks for the update.",
    "Looks good. I'll review this shortly.",
    "Can you clarify the requirements for this part?",
    "Acknowledged. I'm starting on my tasks related to this.",
    "Interesting attachment. Let me take a look.",
    "I have a question about this, I'll follow up soon.",
    "Perfect, this is exactly what I needed.",
];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ isOpen, onClose }) => {
    const { project, currentUser, updateProject } = useProject();
    const [messages, setMessages] = useState<ExtendedMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [context, setContext] = useState('');
    const [status, setStatus] = useState('Starting');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);
    const [emailInput, setEmailInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveCollaborators = () => {
        if (!project) return;
        const newEmails = emailInput.split(',').map(e => e.trim()).filter(e => e !== '');
        updateProject({ ...project, collaborators: [...(project.collaborators || []), ...newEmails] });
        setEmailInput('');
        addMessage({ sender: 'system', text: `Added collaborators: ${newEmails.join(', ')}` });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    const contextOptions = useMemo(() => {
        if (!project) return [];
        return project.phases.flatMap(phase => [
            { value: `phase-${phase.id}`, label: `Phase: ${phase.name}` },
            ...phase.sprints.map(sprint => ({ value: `sprint-${sprint.id}`, label: `Sprint: ${sprint.name}` }))
        ]);
    }, [project]);

    useEffect(() => {
        if (!isOpen || !project) return;

        if (!context) {
            setMessages([
                { id: Date.now(), sender: 'system', text: 'Collaboration panel initiated. Please select a context to begin.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            return;
        }

        const [contextType, contextId] = context.split('-');
        let log: ExtendedMessage[] | undefined;
        if (contextType === 'phase') {
            log = project.phases.find(p => p.id === contextId)?.chatLog as ExtendedMessage[];
        } else if (contextType === 'sprint') {
            for (const phase of project.phases) {
                const sprint = phase.sprints.find(s => s.id === contextId);
                if (sprint) {
                    log = sprint.chatLog as ExtendedMessage[];
                    break;
                }
            }
        }
        setMessages(log || []);
    }, [isOpen, context, project]);
    
    useEffect(() => {
        if (context && messages.length === 0) {
            const contextName = contextOptions.find(opt => opt.value === context)?.label || 'Unknown Context';
            addMessage({ sender: 'system', text: `Context set to: "${contextName}".` });
        }
    }, [context, messages]);


    const addMessage = (msg: Omit<ExtendedMessage, 'id' | 'timestamp'>) => {
        const fullMessage: ExtendedMessage = {
            ...msg,
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prevMessages => {
            const newMessages = [...prevMessages, fullMessage];
            
            if (context && project) {
                const [contextType, contextId] = context.split('-');
                const updatedPhases = project.phases.map(phase => {
                    if (contextType === 'phase' && phase.id === contextId) {
                        return { ...phase, chatLog: newMessages };
                    }
                    if (contextType === 'sprint') {
                        const updatedSprints = phase.sprints.map(sprint => {
                            if (sprint.id === contextId) {
                                return { ...sprint, chatLog: newMessages };
                            }
                            return sprint;
                        });
                        return { ...phase, sprints: updatedSprints };
                    }
                    return phase;
                });
                updateProject({ ...project, phases: updatedPhases });
            }
            return newMessages;
        });
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        addMessage({ 
            sender: 'user', 
            text: newMessage, 
            userName: currentUser.name, 
            avatar: currentUser.avatar,
            recipients: [...selectedRecipients]
        });
        setNewMessage('');
        simulateReply(newMessage);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0 && currentUser) {
            const file = event.target.files[0];
            const base64Data = await fileToBase64(file);
            const attachment = { name: file.name, data: base64Data, type: file.type };
            addMessage({ 
                sender: 'user', 
                attachment, 
                userName: currentUser.name, 
                avatar: currentUser.avatar,
                recipients: [...selectedRecipients]
            });
            simulateReply(`attachment: ${file.name}`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const simulateReply = (originalMessage: string) => {
        setTimeout(() => {
            const teammate = SIMULATED_TEAMMATES[Math.floor(Math.random() * SIMULATED_TEAMMATES.length)];
            const replyText = SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)];
            addMessage({ 
                sender: 'team', 
                text: replyText, 
                userName: teammate.name, 
                avatar: teammate.avatar,
                recipients: ['all'] // Simulated replies are usually general
            });
        }, 1000 + Math.random() * 1500);
    };

    const toggleRecipient = (id: string) => {
        if (id === 'all') {
            setSelectedRecipients(['all']);
        } else {
            let next = selectedRecipients.filter(r => r !== 'all');
            if (next.includes(id)) {
                next = next.filter(r => r !== id);
                if (next.length === 0) next = ['all'];
            } else {
                next.push(id);
            }
            setSelectedRecipients(next);
        }
    };

    const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newContext = e.target.value;
        setContext(newContext);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        addMessage({ sender: 'system', text: `Status updated to: ${newStatus}.` });
    };

    if (!isOpen || !project || !currentUser) return null;

    const renderAttachment = (attachment) => (
        <a href={`data:${attachment.type};base64,${attachment.data}`} download={attachment.name}
           className="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-charcoal-800 rounded-md hover:bg-gray-300 dark:hover:bg-charcoal-900 transition-colors">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{attachment.name}</span>
        </a>
    );

    const getRecipientLabel = (recipients?: string[]) => {
        if (!recipients || recipients.includes('all')) return 'Everyone';
        return recipients.map(id => project.users.find(u => u.id === id)?.name || id).join(', ');
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={onClose}>
            <Card className="w-full max-w-2xl h-[90vh] flex flex-col transform transition-all my-auto" onClick={e => e.stopPropagation()} noPadding flexBody>
                <div className="flex items-center justify-between p-4 border-b dark:border-charcoal-700">
                    <div className="flex items-center space-x-2">
                        <UsersIcon className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Collaboration</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="w-6 h-6" /></Button>
                </div>

                <div className="p-4 border-b dark:border-charcoal-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Context</label>
                        <select value={context} onChange={handleContextChange} className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-800 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary">
                            <option value="">Select Document/Sprint...</option>
                            {contextOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Collaborators (comma separated)</label>
                        <div className="flex gap-2">
                            <input type="text" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="email@example.com" className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-800 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary" />
                            <Button onClick={handleSaveCollaborators} disabled={!emailInput.trim()}>Save</Button>
                        </div>
                    </div>
                </div>

                {/* Recipients Selector */}
                <div className="px-4 py-2 border-b dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-900/30">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">To:</label>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => toggleRecipient('all')}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedRecipients.includes('all') ? 'bg-brand-primary text-charcoal-900 border-brand-primary' : 'bg-white dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                        >
                            Everyone
                        </button>
                        {project.users.filter(u => u.id !== currentUser.id).map(user => (
                            <button
                                key={user.id}
                                onClick={() => toggleRecipient(user.id)}
                                className={`flex-shrink-0 flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium transition-colors border ${selectedRecipients.includes(user.id) ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                            >
                                <span>{user.avatar}</span>
                                <span>{user.name}</span>
                                {selectedRecipients.includes(user.id) && <Check className="w-3 h-3 ml-1" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-charcoal-800">
                    {messages.map((msg) => (
                        <div key={msg.id}>
                            {msg.sender === 'system' ? (
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-2">
                                    <span className="bg-gray-100 dark:bg-charcoal-700 px-2 py-1 rounded-full">{msg.text}</span>
                                </div>
                            ) : (
                                <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-2xl flex-shrink-0 mt-1">{msg.avatar}</span>
                                    <div className={`flex flex-col gap-1 w-full max-w-md ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2">
                                             {msg.sender !== 'user' && <span className="text-xs font-bold">{msg.userName}</span>}
                                            <span className="text-xs text-gray-400">{msg.timestamp}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg relative ${msg.sender === 'user' ? 'bg-brand-primary text-charcoal-900' : 'bg-gray-100 dark:bg-charcoal-700'}`}>
                                            {msg.recipients && (
                                                <div className="text-[10px] opacity-70 mb-1 border-b border-black/10 dark:border-white/10 pb-1">
                                                    To: {getRecipientLabel(msg.recipients)}
                                                </div>
                                            )}
                                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                                            {msg.attachment && renderAttachment(msg.attachment)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-charcoal-700 flex items-center space-x-2 bg-gray-50 dark:bg-charcoal-900/30">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="!p-2">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${getRecipientLabel(selectedRecipients)}...`}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-800 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <Button type="submit" disabled={!newMessage.trim() || !context} className="!p-2">
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </Card>
        </div>
    );
};
