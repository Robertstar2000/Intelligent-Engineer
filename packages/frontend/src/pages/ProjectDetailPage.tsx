import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../utils/api';
import { EnhancedPhaseView } from '../components/EnhancedPhaseView';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Users, Settings, Download, Shield, GitBranch, FileText } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.get(projectId!);
      setProject(data);
      if (data.phases && data.phases.length > 0) {
        setCurrentPhase(data.phases[data.currentPhase || 0]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhase = async (phaseId: string, updates: any) => {
    try {
      await projectsApi.updatePhase(projectId!, phaseId, updates);
      await loadProject();
    } catch (error) {
      console.error('Error updating phase:', error);
    }
  };

  const handlePhaseComplete = async () => {
    if (!currentPhase) return;
    
    await handleUpdatePhase(currentPhase.id, { status: 'completed' });
    
    const currentIndex = project.phases.findIndex((p: any) => p.id === currentPhase.id);
    if (currentIndex < project.phases.length - 1) {
      setCurrentPhase(project.phases[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Project not found
            </h3>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/team`)}
            >
              <Users className="w-4 h-4 mr-2" />
              Team
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/risks`)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Risks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/versions`)}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Versions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/export`)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Phases</h3>
              <div className="space-y-2">
                {project.phases?.map((phase: any, index: number) => (
                  <button
                    key={phase.id}
                    onClick={() => setCurrentPhase(phase)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentPhase?.id === phase.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{phase.name}</span>
                      <Badge
                        variant={
                          phase.status === 'completed' ? 'success' :
                          phase.status === 'in-progress' ? 'warning' : 'outline'
                        }
                        size="sm"
                      >
                        {phase.status || 'pending'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {currentPhase ? (
              <EnhancedPhaseView
                phase={currentPhase}
                project={project}
                disciplines={project.disciplines || []}
                apiKey={import.meta.env.VITE_GEMINI_API_KEY}
                currentUserId={localStorage.getItem('userId') || ''}
                onUpdatePhase={handleUpdatePhase}
                onPhaseComplete={handlePhaseComplete}
              />
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Select a phase to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
