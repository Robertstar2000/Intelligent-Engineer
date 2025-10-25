import React, { useState, useEffect } from 'react';
import { Project, ProjectAnalytics } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { projectsApi } from '../../utils/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Users, 
  Target,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface AnalyticsDashboardProps {
  project: Project;
  onExport?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  project,
  onExport 
}) => {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [project.id, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAnalytics(project.id, timeRange);
      setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getCompletionPercentage = () => {
    const completed = project.phases.filter(p => p.status === 'completed').length;
    return Math.round((completed / project.phases.length) * 100);
  };

  const getTeamVelocity = () => {
    // Calculate based on completed sprints per week
    return 12.5; // Placeholder
  };

  const getAverageTimePerPhase = () => {
    // Calculate average days per phase
    return 14; // Placeholder
  };

  const getActiveMembers = () => {
    return project.team?.filter(m => m.isActive).length || 0;
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading analytics...</span>
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
            Project Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {project.name} - Performance Metrics & Insights
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {onExport && (
            <Button variant="primary" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="success" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {getCompletionPercentage()}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {project.phases.filter(p => p.status === 'completed').length} of {project.phases.length} phases
            </p>
          </div>
        </Card>

        {/* Team Velocity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8%
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Team Velocity</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {getTeamVelocity()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              sprints per week
            </p>
          </div>
        </Card>

        {/* Average Time */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge variant="warning" size="sm">
              <TrendingDown className="w-3 h-3 mr-1" />
              -5%
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time/Phase</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {getAverageTimePerPhase()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              days per phase
            </p>
          </div>
        </Card>

        {/* Active Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge variant="info" size="sm">
              {getActiveMembers()} online
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.team?.length || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              total members
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <LineChart className="w-5 h-5 mr-2 text-blue-600" />
              Progress Over Time
            </h3>
            <Button variant="ghost" size="sm">
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Placeholder for chart */}
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Progress chart visualization
              </p>
            </div>
          </div>
        </Card>

        {/* Phase Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              Phase Distribution
            </h3>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Placeholder for pie chart */}
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phase distribution chart
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-600" />
          Team Performance
        </h3>
        
        <div className="space-y-4">
          {project.team?.slice(0, 5).map((member, index) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {member.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.role.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.floor(Math.random() * 20) + 10} tasks
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    completed
                  </p>
                </div>
                
                <div className="w-32">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Burndown Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
            Burndown Chart
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="info" size="sm">On Track</Badge>
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </div>
        </div>
        
        {/* Placeholder for burndown chart */}
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Burndown chart visualization
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Shows remaining work vs. time
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
