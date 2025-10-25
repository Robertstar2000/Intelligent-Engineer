import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { projectsApi, templatesApi, analyticsApi } from '../utils/api';
import {
  Plus,
  FolderOpen,
  Users,
  BarChart3,
  FileText,
  Sparkles,
  Shield,
  Download,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Layers
} from 'lucide-react';

interface DashboardProps {
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, templatesData, analyticsData] = await Promise.all([
        projectsApi.list().catch(() => []),
        templatesApi.list().catch(() => []),
        analyticsApi.getComparative().catch(() => null),
      ]);

      setProjects(projectsData);
      setTemplates(templatesData.slice(0, 3));
      setStats(analyticsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      label: 'New Project',
      description: 'Start from scratch',
      color: 'bg-blue-500',
      action: () => navigate('/projects/new'),
    },
    {
      icon: Layers,
      label: 'Use Template',
      description: 'Quick start with templates',
      color: 'bg-purple-500',
      action: () => navigate('/templates'),
    },
    {
      icon: Users,
      label: 'Team',
      description: 'Manage team members',
      color: 'bg-green-500',
      action: () => navigate('/team'),
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View insights',
      color: 'bg-orange-500',
      action: () => navigate('/analytics'),
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Generate phase content with advanced AI',
      link: '/ai',
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Identify and mitigate project risks',
      link: '/risks',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Export projects in multiple formats',
      link: '/export',
    },
    {
      icon: Search,
      title: 'NLP Queries',
      description: 'Ask questions about your projects',
      link: '/query',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-blue-100">
            Manage your engineering projects with AI-powered tools
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={action.action}
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {action.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-600" />
                <Badge variant="info">Active</Badge>
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
                <CheckCircle className="w-8 h-8 text-green-600" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageCompletion?.toFixed(0) || 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Completion
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-purple-600" />
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageVelocity?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Team Velocity
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-orange-600" />
                <Badge variant="warning">Active</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.filter(p => p.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                In Progress
              </div>
            </Card>
          </div>
        )}

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              View All
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first project to get started
                </p>
                <Button variant="primary" onClick={() => navigate('/projects/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <Card
                  key={project.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.status === 'completed' ? 'success' :
                        project.status === 'in-progress' ? 'warning' : 'outline'
                      }
                      size="sm"
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Layers className="w-3 h-3 mr-1" />
                      {project.phases?.length || 0} phases
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {project.team?.length || 0} members
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Featured Templates */}
        {templates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Featured Templates
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/templates')}>
                Browse All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/templates/${template.id}`)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      {template.isBuiltIn && (
                        <Badge variant="info" size="sm">Built-in</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{template.phases?.length || 0} phases</span>
                    <span>{template.usage?.timesUsed || 0} uses</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Platform Features */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(feature.link)}
              >
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Pro Tip: Use AI Generation
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Save time by using AI to generate phase content, risk assessments, and documentation.
                Our dual-AI system ensures high-quality results with fallback support.
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/ai')}>
                Explore AI Features
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
