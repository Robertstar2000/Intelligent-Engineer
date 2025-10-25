import React, { useState, useEffect } from 'react';
import { Project, Phase, TeamMember, ToastMessage } from '@shared/types';
import { EnhancedPhaseView } from './components/EnhancedPhaseView';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { ProgressBar } from './components/ui/ProgressBar';
import { Login } from './components/auth/Login';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { authApi, projectsApi } from './utils/api';
import { 
  Users, 
  Settings, 
  Plus, 
  FolderOpen,
  Lightbulb,
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        // No token, user needs to login
        console.log('No authentication token found');
        setLoading(false);
        return;
      }

      // Get current user info using API utility
      try {
        const user = await authApi.me();
        setCurrentUserId(user.id);

        // Load projects
        await loadProjects();

        // Get API key from localStorage or environment
        const storedApiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
        setApiKey(storedApiKey);
      } catch (error: any) {
        // Token is invalid or expired, clear it
        console.error('Authentication failed:', error);
        localStorage.removeItem('token');
        setCurrentUserId('');
      }

    } catch (error) {
      console.error('Error initializing app:', error);
      showToast('Failed to initialize application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await projectsApi.list();
      setProjects(projectsData);

      // Auto-select first project if available
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
        setCurrentPhase(projectsData[0].phases[projectsData[0].currentPhase] || projectsData[0].phases[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects', 'error');
    }
  };

  const handleUpdatePhase = async (phaseId: string, updates: Partial<Phase>) => {
    if (!currentProject) return;

    try {
      const updatedPhase = await projectsApi.updatePhase(currentProject.id, phaseId, updates);
      
      // Update local state
      const updatedProject = {
        ...currentProject,
        phases: currentProject.phases.map(phase =>
          phase.id === phaseId ? { ...phase, ...updatedPhase } : phase
        ),
      };

      setCurrentProject(updatedProject);
      
      if (currentPhase?.id === phaseId) {
        setCurrentPhase({ ...currentPhase, ...updatedPhase });
      }

      // Update projects list
      setProjects(prev => prev.map(p => 
        p.id === currentProject.id ? updatedProject : p
      ));

      showToast('Phase updated successfully', 'success');
    } catch (error) {
      console.error('Error updating phase:', error);
      showToast('Failed to update phase', 'error');
    }
  };

  const handlePhaseComplete = async () => {
    if (!currentProject || !currentPhase) return;

    try {
      await handleUpdatePhase(currentPhase.id, { status: 'completed' });
      
      // Move to next phase if available
      const currentPhaseIndex = currentProject.phases.findIndex(p => p.id === currentPhase.id);
      if (currentPhaseIndex < currentProject.phases.length - 1) {
        const nextPhase = currentProject.phases[currentPhaseIndex + 1];
        setCurrentPhase(nextPhase);
        
        // Update project current phase
        await projectsApi.update(currentProject.id, { currentPhase: currentPhaseIndex + 1 });
      }

      showToast('Phase completed successfully!', 'success');
    } catch (error) {
      console.error('Error completing phase:', error);
      showToast('Failed to complete phase', 'error');
    }
  };

  const handleCreateProject = async (projectData: {
    name: string;
    description: string;
    requirements: string;
    constraints: string;
    disciplines: string[];
    developmentMode: 'full' | 'rapid';
  }) => {
    try {
      const newProject = await projectsApi.create(projectData);
      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      if (newProject.phases && newProject.phases.length > 0) {
        setCurrentPhase(newProject.phases[0]);
      }
      showToast('Project created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const getProjectProgress = (project: Project) => {
    const completedPhases = project.phases.filter(p => p.status === 'completed').length;
    return (completedPhases / project.phases.length) * 100;
  };

  const getTeamProgress = (project: Project) => {
    if (!project.team || project.team.length === 0) return [];
    
    return project.team.slice(0, 5).map((member, index) => ({
      userId: member.userId,
      userName: member.user?.name || 'Unknown',
      progress: Math.random() * 100, // TODO: Calculate actual progress
      color: `hsl(${index * 137.5}, 70%, 50%)`,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Intelligent Engineering Platform...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return <Login onLoginSuccess={initializeApp} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Intelligent Engineering Platform 2.0
                </h1>
              </div>
              
              {currentProject && (
                <div className="flex items-center space-x-2 ml-8">
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentProject.name}
                  </span>
                  <Badge variant="info" size="sm">
                    {currentProject.team?.length || 0} members
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {currentProject && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentProject.team?.filter(m => m.isActive).length || 0} online
                  </span>
                </div>
              )}
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Overview */}
            {currentProject && (
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Project Progress
                    </h3>
                    <Badge variant="info" size="sm">
                      {Math.round(getProjectProgress(currentProject))}%
                    </Badge>
                  </div>
                  
                  <ProgressBar
                    progress={getProjectProgress(currentProject)}
                    teamProgress={getTeamProgress(currentProject)}
                    showPercentage={true}
                    animated={true}
                  />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {currentProject.phases.filter(p => p.status === 'completed').length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {currentProject.phases.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total Phases</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Phase Navigation */}
            {currentProject && (
              <Card>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Project Phases
                  </h3>
                  
                  <div className="space-y-2">
                    {currentProject.phases.map((phase, index) => (
                      <button
                        key={phase.id}
                        onClick={() => setCurrentPhase(phase)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          currentPhase?.id === phase.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              phase.status === 'completed' ? 'bg-green-500 text-white' :
                              phase.status === 'in-progress' ? 'bg-blue-500 text-white' :
                              'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}>
                              {phase.status === 'completed' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {phase.name}
                            </span>
                          </div>
                          
                          {phase.assignedUsers && phase.assignedUsers.length > 0 && (
                            <div className="flex -space-x-1">
                              {phase.assignedUsers.slice(0, 2).map((userId, userIndex) => (
                                <div
                                  key={userId}
                                  className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 border border-white dark:border-gray-800"
                                />
                              ))}
                              {phase.assignedUsers.length > 2 && (
                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-gray-800 flex items-center justify-center">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    +{phase.assignedUsers.length - 2}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Project Settings
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentProject && currentPhase ? (
              <EnhancedPhaseView
                phase={currentPhase}
                project={currentProject}
                disciplines={currentProject.disciplines}
                apiKey={apiKey}
                currentUserId={currentUserId}
                onUpdatePhase={handleUpdatePhase}
                onPhaseComplete={handlePhaseComplete}
              />
            ) : (
              <Card>
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Project Selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a new project or select an existing one to get started with collaborative engineering.
                  </p>
                  <Button 
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
};