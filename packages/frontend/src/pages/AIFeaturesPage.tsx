import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AIProfileManager } from '../components/ai/AIProfileManager';
import { NLPQueryInterface } from '../components/ai/NLPQueryInterface';
import { ArrowLeft, Sparkles, Brain, Search } from 'lucide-react';

export const AIFeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profiles' | 'query'>('profiles');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              AI Features
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage AI profiles and query your projects
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            AI Profiles
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'query'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            NLP Query
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profiles' ? (
          <div>
            <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                About AI Profiles
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                AI profiles allow you to customize how the AI generates content for your projects.
                Adjust parameters like clarity, technicality, and risk aversion to match your team's needs.
              </p>
            </Card>
            <AIProfileManager />
          </div>
        ) : (
          <div>
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Natural Language Queries
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ask questions about your projects in plain English. The AI will analyze your project data
                and provide insights, recommendations, and answers.
              </p>
            </Card>
            <NLPQueryInterface projectId="demo-project" />
          </div>
        )}
      </div>
    </div>
  );
};
