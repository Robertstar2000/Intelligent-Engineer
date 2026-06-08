
import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Button } from './ui';

export const Header = ({ onLoginClick, onFeaturesClick, onLifecycleClick, onAboutClick }) => {
  const navLinks = [
    { name: "Features", action: onFeaturesClick },
    { name: "Lifecycle", action: onLifecycleClick },
    { name: "About", action: onAboutClick }
  ];

  return (
    <header className="py-4 px-8 md:px-16 bg-charcoal-900/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-brand-primary" />
          <span className="text-xl font-bold text-white">MIFECO VibraEngineer</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <button key={link.name} onClick={link.action} className="text-gray-300 hover:text-white transition-colors">
              {link.name}
            </button>
          ))}
        </nav>
        <Button
          onClick={onLoginClick}
          variant="primary"
        >
          Login / Sign Up
        </Button>
      </div>
    </header>
  );
};