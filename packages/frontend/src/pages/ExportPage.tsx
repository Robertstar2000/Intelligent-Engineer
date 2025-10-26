import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Download, FileText, File, Presentation, Code, CheckCircle } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>(['all']);
  const [exporting, setExporting] = useState(false);

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Professional PDF with formatting',
      icon: FileText,
      color: 'text-red-600',
    },
    {
      id: 'word',
      name: 'Microsoft Word',
      description: 'Editable DOCX format',
      icon: File,
      color: 'text-blue-600',
    },
    {
      id: 'powerpoint',
      name: 'PowerPoint',
      description: 'Presentation slides',
      icon: Presentation,
      color: 'text-orange-600',
    },
    {
      id: 'markdown',
      name: 'Markdown',
      description: 'Plain text with formatting',
      icon: Code,
      color: 'text-gray-600',
    },
  ];

  const sections = [
    { id: 'all', name: 'Complete Project', description: 'All phases and documentation' },
    { id: 'requirements', name: 'Requirements', description: 'Requirements phase only' },
    { id: 'design', name: 'Design Documents', description: 'Preliminary and critical design' },
    { id: 'testing', name: 'Testing & Validation', description: 'Test plans and results' },
    { id: 'summary', name: 'Executive Summary', description: 'High-level overview' },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Export completed successfully! Download will start shortly.');
      navigate(projectId ? `/projects/${projectId}` : '/');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    if (sectionId === 'all') {
      setSelectedSections(['all']);
    } else {
      const newSections = selectedSections.filter(s => s !== 'all');
      if (selectedSections.includes(sectionId)) {
        setSelectedSections(newSections.filter(s => s !== sectionId));
      } else {
        setSelectedSections([...newSections, sectionId]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Download className="w-6 h-6 mr-2 text-blue-600" />
              Export Project
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose format and content to export
            </p>
          </div>
        </div>

        {/* Export Format Selection */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Export Format
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <format.icon className={`w-6 h-6 ${format.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {format.name}
                        </h3>
                        {selectedFormat === format.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Content Selection */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Content to Export
            </h2>
            <div className="space-y-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedSections.includes(section.id) || selectedSections.includes('all')
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {section.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {section.description}
                      </p>
                    </div>
                    {(selectedSections.includes(section.id) || selectedSections.includes('all')) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Export Options */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Options
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Include table of contents
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Add navigation links to sections
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Include diagrams and images
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Embed all visual content
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Include team member information
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Add contributor details
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Include version history
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Add change log and revisions
                  </p>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Export Summary */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Export Summary
          </h3>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>Format: <strong>{formats.find(f => f.id === selectedFormat)?.name}</strong></p>
            <p>Content: <strong>
              {selectedSections.includes('all') ? 'Complete Project' : `${selectedSections.length} section(s)`}
            </strong></p>
            <p>Estimated size: <strong>~2.5 MB</strong></p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleExport}
            disabled={exporting || selectedSections.length === 0}
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Project
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
