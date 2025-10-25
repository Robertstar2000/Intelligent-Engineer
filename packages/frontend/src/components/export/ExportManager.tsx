import React, { useState } from 'react';
import { Project, ExportFormat } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { projectsApi } from '../../utils/api';
import { 
  Download, 
  FileText, 
  Settings,
  CheckCircle
} from 'lucide-react';

interface ExportManagerProps {
  project: Project;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ project }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);

  const formats: Array<{ value: ExportFormat; label: string; icon: string }> = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'word', label: 'Word', icon: '📝' },
    { value: 'powerpoint', label: 'PowerPoint', icon: '📊' },
    { value: 'markdown', label: 'Markdown', icon: '📋' },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await projectsApi.exportProject(project.id, { format: selectedFormat });
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Download className="w-6 h-6 mr-2 text-blue-600" />
          Export Manager
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Export project documentation in various formats
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Export Format
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => setSelectedFormat(format.value)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                selectedFormat === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{format.icon}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {format.label}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Options
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Project'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
