import React from 'react';
import { BrainCircuit, Sparkles, ArrowRightLeft, LayoutGrid, FileText, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="bg-charcoal-800 p-6 rounded-lg border border-charcoal-700/50 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10">
      <Icon className="w-8 h-8 text-cyan-400 mb-4" />
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
      description: "Leverage AI to generate code, documentation, and more."
    },
    {
      icon: ArrowRightLeft,
      title: "Context Propagation",
      description: "Maintain context across all stages of development."
    },
    {
      icon: LayoutGrid,
      title: "Domain Toolkits",
      description: "Access specialized toolkits for specific engineering domains."
    },
    {
      icon: FileText,
      title: "Document Generation",
      description: "Automatically generate comprehensive documentation."
    },
    {
      icon: Users,
      title: "HMAP",
      description: "Human-Mediated AI drives engineering for optimal collaboration."
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
