import React from 'react';
import { BrainCircuit, Sparkles, ArrowRightLeft, LayoutGrid, FileText, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="bg-charcoal-800 p-6 rounded-lg border border-charcoal-700/50 transition-all duration-300 hover:border-brand-primary/50 hover:shadow-2xl hover:shadow-brand-primary/10">
      <Icon className="w-8 h-8 text-brand-primary mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export const Features = () => {
  const featureData = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Leverage AI to generate professional drafts of sprints, technical specifications, and even risk assessments, accelerating your workflow."
    },
    {
      icon: ArrowRightLeft,
      title: "Context Propagation",
      description: "The output from each completed phase automatically informs the next, ensuring a cohesive and intelligent workflow from start to finish."
    },
    {
      icon: LayoutGrid,
      title: "Domain Toolkits",
      description: "Whether you're in mechanical, electrical, or software engineering, the AI adapts its knowledge and terminology to fit your project's needs."
    },
    {
      icon: FileText,
      title: "Document Generation",
      description: "Automate Statements of Work (SOWs), trade studies, and V&V plans to reduce manual writing and focus on core engineering tasks."
    },
    {
      icon: Users,
      title: "HMAP",
      description: "Our Human-Mediated AI Process puts you in control. The AI generates powerful drafts, but you provide the final verification and approval."
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {featureData.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};