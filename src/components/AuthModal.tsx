import React, { useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { ToastMessage } from '../types';

export const AuthModal = ({ isOpen, onClose, setToast }: { isOpen: boolean, onClose: () => void, setToast: (toast: ToastMessage) => void }) => {
    const { login, signup } = useProject();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        let success = false;
        if (isLoginView) {
            success = login(email, password);
            if (!success) setError('Invalid email or password.');
        } else {
            success = signup(name, email, password);
            if (!success) setError('A user with this email already exists.');
        }

        if (success) {
            setToast({ message: isLoginView ? 'Logged in successfully!' : 'Account created!', type: 'success' });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} noPadding>
                <div className="flex">
                    <button onClick={() => setIsLoginView(true)} className={`flex-1 p-4 text-center font-semibold ${isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900'}`}>Login</button>
                    <button onClick={() => setIsLoginView(false)} className={`flex-1 p-4 text-center font-semibold ${!isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900'}`}>Sign Up</button>
                </div>
                <div className="p-6">
                    <div className="text-center mb-4">
                      <BrainCircuit className="w-10 h-10 text-brand-primary mx-auto" />
                      <h2 className="text-2xl font-bold mt-2">Vibe Engineering</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginView && (
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">{isLoginView ? 'Login' : 'Create Account'}</Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};