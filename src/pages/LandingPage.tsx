
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Folder, Sparkles, Cpu, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '../components/ui';

export const LandingPage = ({ onOpenDatabase, onInitiateProtocol }: { onOpenDatabase: () => void, onInitiateProtocol: () => void }) => {
    const { currentUser, projects, logout, geminiKey, setGeminiKey } = useProject();
    const [showKey, setShowKey] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 p-6 md:p-12 flex flex-col items-center relative">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full"></div>

            <div className="w-full max-w-5xl relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter">
                            Welcome, <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{currentUser?.name || currentUser?.username}</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-mono tracking-widest uppercase mt-1">System Operator Status: Active</p>
                    </div>
                    <button 
                        onClick={logout}
                        className="bg-slate-800/50 hover:bg-red-500/20 border border-white/5 px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all"
                    >
                        Disconnect
                    </button>
                </header>

                {/* Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Card 1: Active Projects */}
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 hover:translate-y-[-4px] transition-all group">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Folder className="text-cyan-400 w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">Active Projects</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Access and manage your ongoing engineering protocols. Currently tracking {projects.length} active nodes.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500">{projects.length} PROJECTS DETECTED</span>
                            <button 
                                onClick={onOpenDatabase}
                                className="bg-white text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors"
                            >
                                Open Database
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Create New */}
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 hover:translate-y-[-4px] transition-all group">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Sparkles className="text-pink-400 w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">Create New</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Initiate a new project acceleration protocol using HMAP methodology and AI synthesis.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500">READY FOR DEPLOYMENT</span>
                            <button 
                                onClick={onInitiateProtocol}
                                className="border-2 border-pink-500/50 text-pink-400 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all"
                            >
                                Initiate Protocol
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Configuration Section */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 mb-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Cpu className="text-indigo-400 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold tracking-tight uppercase">AI Engine Configuration</h3>
                            <p className="text-slate-500 text-xs font-mono tracking-wider">GEMINI-PRO-SYNTHESIS-V3</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"}
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-all"
                                placeholder="Enter Gemini API Key"
                            />
                            <button 
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-widest"
                            >
                                {showKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                            >
                                How to get a key <ExternalLink className="w-3 h-3" />
                            </a>
                            <div className="flex items-center gap-2 text-emerald-400/50 text-[10px] font-bold uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" /> Encrypted Storage
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> System Online
                        </div>
                        <div className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            V.5.0.0-VERIFIED
                        </div>
                    </div>
                    <div className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">
                        MIFECO HUB © 2026
                    </div>
                </footer>
            </div>
        </div>
    );
};
