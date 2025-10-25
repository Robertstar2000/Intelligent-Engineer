import React, { useState } from 'react';
import { Project, ExportFormat, StakeholderType } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { analyticsApi } from '../../utils/api';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Settings,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ReportGeneratorProps {
  project: Project;
  onReportGenerated?: (reportId: string) => void;
}

type ReportType = 'executive' | 'technical' | 'performance' | 'compliance' | 'custom';

interface ReportConfig {
  type: ReportType;
  format: ExportFormat;
  stakeholder?: StakeholderType;
  dateRange: {
    start: Date;
    end: Date;
  };
  includePhases: string[];
  includeAnalytics: boolean;
  includeTeam: boolean;
  includeRisks: boolean;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  project,
  onReportGenerated 
}) => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'executive',
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    includePhases: project.phases.map(p => p.id),
    includeAnalytics: true,
    includeTeam: true,
    includeRisks: true,
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportTypes: Array<{ value: ReportType; label: string; description: string }> = [
    { 
      value: 'executive', 
      label: 'Executive Summary', 
      description: 'High-level overview for leadership' 
    },
    { 
      value: 'technical', 
      label: 'Technical Report', 
      description: 'Detailed technical documentation' 
    },
    { 
      value: 'performance', 
      label: 'Performance Report', 
      description: 'Team and project metrics' 
    },
    { 
      value: 'compliance', 
      label: 'Compliance Report', 
      description: 'Regulatory and standards compliance' 
    },
    { 
      value: 'custom', 
      label: 'Custom Report', 
      description: 'Customizable report template' 
    },
  ];

  const formats: Array<{ value: ExportFormat; label: string; icon: string }> = [
    { value: 'pdf', label: 'PDF Document', icon: '📄' },
    { value: 'word', label: 'Word Document', icon: '📝' },
    { value: 'powerpoint', label: 'PowerPoint', icon: '📊' },
    { value: 'html', label: 'HTML', icon: '🌐' },
  ];

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setProgress(0);
      setError(null);
      setDownloadUrl(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await analyticsApi.generateReport(config.type, project.id, config);

      clearInterval(progressInterval);
      setProgress(100);
        setDownloadUrl(result.downloadUrl);
        
        if (onReportGenerated) {
          onReportGenerated(result.id);
        }
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Generate Project Report
        </h3>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setConfig({ ...config, type: type.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    config.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setConfig({ ...config, format: format.value })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    config.format === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{format.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {format.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={config.dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setConfig({
                    ...config,
                    dateRange: { ...config.dateRange, start: new Date(e.target.value) }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={config.dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setConfig({
                    ...config,
                    dateRange: { ...config.dateRange, end: new Date(e.target.value) }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include in Report
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeAnalytics}
                  onChange={(e) => setConfig({ ...config, includeAnalytics: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Analytics & Metrics
                </span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeTeam}
                  onChange={(e) => setConfig({ ...config, includeTeam: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Team Performance
                </span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeRisks}
                  onChange={(e) => setConfig({ ...config, includeRisks: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Risk Assessment
                </span>
              </label>
            </div>
          </div>

          {/* Progress Bar */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Generating report...
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message with Download */}
          {downloadUrl && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Report generated successfully!
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Options
            </Button>

            <Button 
              variant="primary" 
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Reports */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Reports
        </h3>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Executive Summary - Q{i}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generated {i} days ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="info" size="sm">PDF</Badge>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
