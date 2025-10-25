import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { analyticsApi, projectsApi } from '../utils/api';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Clock, Users, BarChart3 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, projectsData] = await Promise.all([
        analyticsApi.getComparative().catch(() => null),
        projectsApi.list().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track performance and insights
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {projects.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Projects
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <Badge variant="success">+12%</Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics?.userProjects?.successRate?.toFixed(0) || 85}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Success Rate
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics?.userProjects?.averageProjectDuration || 95}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Days
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-600" />
              <Badge variant="info">Active</Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics?.userProjects?.averageTeamSize || 3}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Team Size
            </div>
          </Card>
        </div>

        {/* Comparative Analysis */}
        {analytics && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance vs Industry Benchmarks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Project Duration</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.userProjects?.averageProjectDuration || 95} days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: '79%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.userProjects?.successRate?.toFixed(0) || 85}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${analytics.userProjects?.successRate || 85}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Budget Control</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.userProjects?.budgetVariance?.toFixed(1) || 8.5}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: '91%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Industry Benchmarks
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Project Duration</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.industryBenchmarks?.averageProjectDuration || 120} days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.industryBenchmarks?.successRate?.toFixed(0) || 68}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{ width: `${analytics.industryBenchmarks?.successRate || 68}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Budget Variance</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analytics.industryBenchmarks?.budgetVariance?.toFixed(1) || 15.2}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recommendations */}
        {analytics?.recommendations && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Insights & Recommendations
            </h2>
            <ul className="space-y-2">
              {analytics.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Project List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Performance
          </h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {project.phases?.length || 0} phases • {project.team?.length || 0} members
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.progress || 0}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Progress
                    </div>
                  </div>
                  <Badge
                    variant={
                      project.status === 'completed' ? 'success' :
                      project.status === 'in-progress' ? 'warning' : 'outline'
                    }
                  >
                    {project.status || 'active'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
