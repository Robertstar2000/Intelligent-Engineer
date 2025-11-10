import React from 'react';
import { Button } from './ui';
import { GitBranch, FileText, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

export const Hero = ({ onLoginClick }) => {
  return (
    <section className="py-20 md:py-32 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4">
          Vibe Engineering
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
          An AI-powered companion guiding you through the full engineering lifecycle. Generate your first three foundational documents to build a strong base. Then, choose your workflow: continue manually, generating and reviewing each document, or engage the Automation Engine to draft the entire project for you to refine.
        </p>

        <div className="max-w-3xl mx-auto my-8 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-1" />
            <p className="text-yellow-200 text-left">
                <strong>Important:</strong> This application is not a replacement for human engineering. It is designed to interact with a human designer to streamline the tedious process of generating documentation and to provide ideation support. It uses the <strong>Human Mediated Agentic Process (HMAP)</strong>, and it is recommended that you review and edit all generated results before use. This collaboration helps accelerate design time from months to days. The manual workflow is recommended for most effective use, as your reviews and edits for each phase steer and focus all subsequent generation.
            </p>
        </div>

        <div className="max-w-3xl mx-auto my-8 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg flex items-start space-x-4">
            <Clock className="w-8 h-8 text-blue-300 flex-shrink-0 mt-1" />
            <p className="text-blue-200 text-left">
                <strong>Heads Up:</strong> This application uses hundreds of LLM calls in its agentic workflows. A full project automation can take 30-60 minutes, not including your review time. This process is designed to accelerate what would typically be months of manual design work.
            </p>
        </div>

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