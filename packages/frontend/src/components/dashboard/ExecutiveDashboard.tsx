import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Target,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface ExecutiveDashboardProps {
  userId: string;
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  status: string;
  completionPercentage: number;
  velocity: number;
  efficiencyRatio: number;
  daysElapsed: number;
  teamSize: number;
  blockedTasks: number;
}

interface DashboardData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageCompletion: number;
  averageVelocity: number;
  averageEfficiency: number;
  projectAnalytics: ProjectSummary[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/comparative', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (projectId: string, reportType: string) => {
    try {
      const response = await fetch(`/api/reports/${reportType}/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ recipients: [] }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const report = await response.json();
      // TODO: Display or download report
      alert(`${reportType} report generated successfully!`);
    } catch (err) {
      alert('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Executive Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Portfolio overview and strategic insights
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="primary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Portfolio Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboardData.totalProjects}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {dashboardData.activeProjects} active
              </span>
              <span className="text-gray-500 mx-2">•</span>
              <span className="text-gray-600 dark:text-gray-400">
                {dashboardData.completedProjects} completed
              </span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Completion</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboardData.averageCompletion.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar progress={dashboardData.averageCompletion} size="sm" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Velocity</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboardData.averageVelocity.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              sprints per day
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Efficiency</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboardData.averageEfficiency.toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {dashboardData.averageEfficiency > 100 ? (
                <span className="text-yellow-600 dark:text-yellow-400 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Over estimate
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Under estimate
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Project Portfolio */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Project Portfolio
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {dashboardData.projectAnalytics.map((project) => (
              <div
                key={project.projectId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setSelectedProject(project.projectId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {project.projectName}
                      </h3>
                      <Badge 
                        variant={
                          project.status === 'completed' ? 'success' :
                          project.status === 'active' ? 'info' : 'outline'
                        }
                        size="sm"
                      >
                        {project.status}
                      </Badge>
                      {project.blockedTasks > 0 && (
                        <Badge variant="error" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {project.blockedTasks} blocked
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Completion</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {project.completionPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Velocity</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {project.velocity.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {project.efficiencyRatio.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Team Size</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {project.teamSize}
                        </p>
                      </div>
                    </div>

                    <ProgressBar progress={project.completionPercentage} size="sm" />
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateReport(project.projectId, 'executive');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center py-6">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate Portfolio Report
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Comprehensive overview of all projects
              </p>
              <Button variant="primary" size="sm">
                Generate Report
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Design Reviews
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pending approvals and reviews
              </p>
              <Button variant="primary" size="sm">
                View Reviews
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-6">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Strategic Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Deep dive into portfolio metrics
              </p>
              <Button variant="primary" size="sm">
                View Analytics
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
