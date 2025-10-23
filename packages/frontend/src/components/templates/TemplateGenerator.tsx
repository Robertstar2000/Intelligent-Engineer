import React, { useState } from 'react';
import { Template, ProgramScale } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Wand2, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Sparkles,
  Settings,
  Eye
} from 'lucide-react';

interface TemplateGeneratorProps {
  onTemplateGenerated?: (template: Template) => void;
  onCancel?: () => void;
}

type Step = 'disciplines' | 'scope' | 'scale' | 'preview';

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ 
  onTemplateGenerated,
  onCancel 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('disciplines');
  const [generating, setGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<Template | null>(null);

  const [config, setConfig] = useState({
    disciplines: [] as string[],
    scope: 'design-only' as 'design-only' | 'design-prototypes' | 'design-production',
    scale: 'medium' as ProgramScale,
    name: '',
    description: '',
  });

  const availableDisciplines = [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Software Engineering',
    'Systems Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biomedical Engineering',
    'Industrial Engineering',
    'Environmental Engineering',
    'Materials Engineering',
    'Robotics Engineering',
  ];

  const scopes = [
    {
      value: 'design-only' as const,
      label: 'Design Only',
      description: 'Focus on design and documentation',
      phases: 5,
    },
    {
      value: 'design-prototypes' as const,
      label: 'Design + Prototypes',
      description: 'Include prototyping and testing',
      phases: 7,
    },
    {
      value: 'design-production' as const,
      label: 'Design + Production',
      description: 'Full lifecycle including deployment',
      phases: 9,
    },
  ];

  const scales: Array<{ value: ProgramScale; label: string; description: string }> = [
    { value: 'small', label: 'Small', description: '1-3 team members, simple projects' },
    { value: 'medium', label: 'Medium', description: '4-10 team members, moderate complexity' },
    { value: 'large', label: 'Large', description: '11-50 team members, complex projects' },
    { value: 'enterprise', label: 'Enterprise', description: '50+ team members, multi-disciplinary' },
  ];

  const steps: Array<{ id: Step; label: string; description: string }> = [
    { id: 'disciplines', label: 'Disciplines', description: 'Select engineering disciplines' },
    { id: 'scope', label: 'Project Scope', description: 'Define project scope' },
    { id: 'scale', label: 'Program Scale', description: 'Set program scale' },
    { id: 'preview', label: 'Preview', description: 'Review and generate' },
  ];

  const handleNext = () => {
    const stepOrder: Step[] = ['disciplines', 'scope', 'scale', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['disciplines', 'scope', 'scale', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const template = await response.json();
        setGeneratedTemplate(template);
        
        if (onTemplateGenerated) {
          onTemplateGenerated(template);
        }
      }
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleDiscipline = (discipline: string) => {
    setConfig(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'disciplines':
        return config.disciplines.length > 0;
      case 'scope':
      case 'scale':
        return true;
      case 'preview':
        return config.name.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-purple-600" />
            AI Template Generator
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a custom template powered by AI
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {steps.findIndex(s => s.id === currentStep) > index ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 'disciplines' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select Engineering Disciplines
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose one or more disciplines for your project template
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableDisciplines.map((discipline) => (
                <button
                  key={discipline}
                  onClick={() => toggleDiscipline(discipline)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    config.disciplines.includes(discipline)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {discipline}
                    </span>
                    {config.disciplines.includes(discipline) && (
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {config.disciplines.length > 0 && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {config.disciplines.length} discipline{config.disciplines.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'scope' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Define Project Scope
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the scope of your engineering project
              </p>
            </div>

            <div className="space-y-3">
              {scopes.map((scope) => (
                <button
                  key={scope.value}
                  onClick={() => setConfig({ ...config, scope: scope.value })}
                  className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
                    config.scope === scope.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {scope.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {scope.description}
                      </p>
                      <Badge variant="info" size="sm">
                        {scope.phases} phases
                      </Badge>
                    </div>
                    {config.scope === scope.value && (
                      <Check className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'scale' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Set Program Scale
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose the size and complexity of your project
              </p>
            </div>

            <div className="space-y-3">
              {scales.map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => setConfig({ ...config, scale: scale.value })}
                  className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
                    config.scale === scale.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {scale.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {scale.description}
                      </p>
                    </div>
                    {config.scale === scale.value && (
                      <Check className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Review & Generate Template
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review your selections and provide template details
              </p>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="e.g., Multi-Discipline Engineering Template"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Template Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe the purpose and use case for this template..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Configuration Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Disciplines</p>
                  <div className="flex flex-wrap gap-1">
                    {config.disciplines.map((d, i) => (
                      <Badge key={i} variant="info" size="sm">{d}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Scope</p>
                  <Badge variant="default" size="sm">
                    {scopes.find(s => s.value === config.scope)?.label}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Scale</p>
                  <Badge variant="default" size="sm">
                    {scales.find(s => s.value === config.scale)?.label}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Estimated Phases</p>
                  <Badge variant="info" size="sm">
                    {scopes.find(s => s.value === config.scope)?.phases} phases
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep !== 'disciplines' && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {currentStep !== 'preview' ? (
            <Button 
              variant="primary" 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleGenerate}
              disabled={!canProceed() || generating}
            >
              {generating ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Template
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
