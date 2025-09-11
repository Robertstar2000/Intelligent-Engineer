import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const Header = () => {
  const navLinks = ["Overview", "Features", "Pricing", "Contact"];

  return (
    <header className="py-4 px-8 md:px-16">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold text-white">Intelligent Engineering</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <a key={link} href="#" className="text-gray-300 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </nav>
        <a
          href="#"
          className="hidden md:inline-block bg-cyan-500 text-charcoal-900 font-bold py-2 px-5 rounded-md hover:bg-cyan-600 transition-all"
        >
          Start New Project
        </a>
      </div>
    </header>
  );
};
