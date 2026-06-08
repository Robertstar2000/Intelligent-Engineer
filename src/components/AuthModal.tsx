
import React, { useState } from 'react';
import { BrainCircuit, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button, Card } from './ui';
import { ToastMessage, User } from '../types';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthModal = ({ isOpen, onClose, setToast }: { isOpen: boolean, onClose: () => void, setToast: (toast: ToastMessage) => void }) => {
    const { setCurrentUser } = useProject();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLoginView) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if (userDoc.exists()) {
                    setCurrentUser(userDoc.data() as User);
                }
                setToast({ message: 'Logged in successfully!', type: 'success' });
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = {
                    id: userCredential.user.uid,
                    name,
                    email,
                    role: 'Engineer',
                    avatar: '👤',
                    geminiKey
                };
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
                setCurrentUser(newUser);
                setToast({ message: 'Account created!', type: 'success' });
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center z-[100] overflow-y-auto p-4 sm:p-10" onClick={onClose}>
            <Card className="w-full max-w-md my-auto transform transition-all relative" onClick={e => e.stopPropagation()} noPadding>
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="flex">
                    <button onClick={() => setIsLoginView(true)} className={`flex-1 p-4 text-center font-semibold transition-colors ${isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900 hover:bg-gray-200 dark:hover:bg-charcoal-700'}`}>Login</button>
                    <button onClick={() => setIsLoginView(false)} className={`flex-1 p-4 text-center font-semibold transition-colors ${!isLoginView ? 'bg-white dark:bg-charcoal-800' : 'bg-gray-100 dark:bg-charcoal-900 hover:bg-gray-200 dark:hover:bg-charcoal-700'}`}>Sign Up</button>
                </div>
                <div className="p-6">
                    <div className="text-center mb-4">
                      <BrainCircuit className="w-10 h-10 text-brand-primary mx-auto" />
                      <h2 className="text-2xl font-bold mt-2">MIFECO VibraEngineer</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginView && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Gemini API Key</label>
                                    <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:text-white" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-charcoal-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                        <Button type="submit" className="w-full mt-2">{isLoginView ? 'Login' : 'Create Account'}</Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};
