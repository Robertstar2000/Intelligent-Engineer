import React from 'react';
import { Button } from './ui';
import { GitBranch, FileText, CheckSquare } from 'lucide-react';

export const Hero = ({ onLoginClick }) => {
  return (
    <section className="py-20 md:py-32 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4">
          Intelligent Engineering
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
          An AI-powered companion guiding you through the full engineering lifecycle. Generate your first three foundational documents to build a strong base. Then, choose your workflow: continue manually, generating and reviewing each document, or engage the Automation Engine to draft the entire project for you to refine.
        </p>

        <div className="mt-12 mb-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
                <GitBranch className="w-10 h-10 text-brand-primary mb-3" />
                <h3 className="font-semibold text-white text-lg">Structured Lifecycle</h3>
                <p className="text-sm text-gray-400 mt-1">Follow proven engineering phases from requirements to launch.</p>
            </div>
            <div className="flex flex-col items-center text-center">
                <FileText className="w-10 h-10 text-brand-primary mb-3" />
                <h3 className="font-semibold text-white text-lg">AI-Generated Documents</h3>
                <p className="text-sm text-gray-400 mt-1">Automate SOWs, technical specs, test plans, and more.</p>
            </div>
            <div className="flex flex-col items-center text-center">
                <CheckSquare className="w-10 h-10 text-brand-primary mb-3" />
                <h3 className="font-semibold text-white text-lg">Best-Practice Workflows</h3>
                <p className="text-sm text-gray-400 mt-1">Integrated FMEA, trade studies, and formal design reviews.</p>
            </div>
        </div>

         <Button
          onClick={onLoginClick}
          variant="primary"
          size="lg"
          className="mt-8"
        >
          Start New Project
        </Button>
      </div>
    </section>
  );
};