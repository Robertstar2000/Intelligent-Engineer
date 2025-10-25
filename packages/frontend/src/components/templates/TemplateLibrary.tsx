import React, { useState, useEffect } from 'react';
import { Template } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { templatesApi } from '../../utils/api';
import { 
  FileText, 
  Search, 
  Filter, 
  Star, 
  Users, 
  Clock,
  Plus,
  Eye,
  Copy,
  Trash2
} from 'lucide-react';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  onCreateNew?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  onSelectTemplate,
  onCreateNew 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesApi.list();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'all' || 
                              template.disciplines.includes(selectedDiscipline);
    return matchesSearch && matchesDiscipline;
  });

  const disciplines = Array.from(new Set(templates.flatMap(t => t.disciplines)));

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading templates...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Library
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose from pre-built templates or create your own
          </p>
        </div>

        <Button variant="primary" onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Discipline Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Disciplines</option>
              {disciplines.map(discipline => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </Card>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search or filters
            </p>
            <Button variant="primary" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`p-6 hover:shadow-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'flex items-center justify-between' : ''
              }`}
              onClick={() => onSelectTemplate?.(template)}
            >
              <div className={viewMode === 'list' ? 'flex items-center space-x-4 flex-1' : ''}>
                {/* Icon */}
                <div className={`p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg ${
                  viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'
                }`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    {template.isBuiltIn && (
                      <Badge variant="info" size="sm">Built-in</Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Disciplines */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.disciplines.slice(0, 3).map((discipline, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {discipline}
                      </Badge>
                    ))}
                    {template.disciplines.length > 3 && (
                      <Badge variant="default" size="sm">
                        +{template.disciplines.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {template.usage.timesUsed} uses
                    </div>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {template.usage.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {template.phases.length} phases
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {viewMode === 'list' && (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate?.(template);
                  }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    // Handle duplicate
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!template.isBuiltIn && (
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete
                    }}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
