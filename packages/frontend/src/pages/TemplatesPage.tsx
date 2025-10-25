import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateLibrary } from '../components/templates/TemplateLibrary';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Project Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick start with pre-built templates
            </p>
          </div>
        </div>

        <TemplateLibrary
          onSelectTemplate={(template) => {
            navigate(`/templates/${template.id}/generate`);
          }}
          onCreateNew={() => navigate('/templates/create')}
        />
      </div>
    </div>
  );
};
