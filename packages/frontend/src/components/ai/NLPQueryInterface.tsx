import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Search, Sparkles, TrendingUp } from 'lucide-react';

interface NLPQueryInterfaceProps {
  projectId: string;
}

export const NLPQueryInterface: React.FC<NLPQueryInterfaceProps> = ({ projectId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'What is the current project status?',
    'Show me team performance metrics',
    'What are the high-priority risks?',
    'When will the next phase be completed?',
  ];

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        setResults(await response.json());
      }
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
          Natural Language Query
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Ask questions about your project in plain English
        </p>
      </div>

      <Card className="p-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Ask anything about your project..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <Button variant="primary" onClick={handleQuery} disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </Button>

        {results && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-gray-900 dark:text-white">{results.answer}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
