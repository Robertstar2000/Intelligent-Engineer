import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, Button } from './ui';
import { Comment, User } from '../types';

interface CommentsThreadProps {
    comments: Comment[];
    users: User[];
    currentUser: User;
    onAddComment: (text: string) => void;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({ comments, users, currentUser, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    const timeSince = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "just now";
    };

    return (
        <Card title="Collaboration Thread" description="Discuss this phase with your team.">
            <div className="space-y-4">
                <div className="max-h-72 overflow-y-auto space-y-4 pr-2">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Start the conversation!</p>
                    ) : (
                        [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(comment => {
                            const user = users.find(u => u.id === comment.userId);
                            return (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <span className="text-2xl flex-shrink-0 mt-1">{user?.avatar || '👤'}</span>
                                    <div className="flex-1 bg-gray-100 dark:bg-charcoal-700/50 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{user?.name || 'Unknown User'}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{timeSince(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex items-start space-x-3 pt-4 border-t dark:border-charcoal-700">
                    <span className="text-2xl flex-shrink-0 mt-1">{currentUser.avatar}</span>
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full p-2 border rounded-lg bg-white dark:bg-charcoal-800 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary"
                            rows={2}
                        />
                        <div className="flex justify-end mt-2">
                            <Button type="submit" size="sm" disabled={!newComment.trim()}>
                                <Send className="w-4 h-4 mr-2" /> Post Comment
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Card>
    );
};