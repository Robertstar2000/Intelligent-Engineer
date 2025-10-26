import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TeamPage } from './pages/TeamPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIFeaturesPage } from './pages/AIFeaturesPage';
import { RiskAssessmentPage } from './pages/RiskAssessmentPage';
import { CompliancePage } from './pages/CompliancePage';
import { AuditPage } from './pages/AuditPage';
import { VersionControlPage } from './pages/VersionControlPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { authApi } from './utils/api';
import { Button } from './components/ui/Button';
import { Lightbulb, Settings, LogOut, Menu, X } from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode; user: any; onLogout: () => void }> = ({
  children,
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Lightbulb className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                  Intelligent Engineering Platform
                </h1>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                Projects
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
                Templates
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
                Analytics
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai')}>
                AI
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/integrations')}>
                Integrations
              </Button>
            </nav>

            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.name || 'User'}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/projects');
                  setMobileMenuOpen(false);
                }}
              >
                Projects
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/templates');
                  setMobileMenuOpen(false);
                }}
              >
                Templates
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/analytics');
                  setMobileMenuOpen(false);
                }}
              >
                Analytics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/ai');
                  setMobileMenuOpen(false);
                }}
              >
                AI Features
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/integrations');
                  setMobileMenuOpen(false);
                }}
              >
                Integrations
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/compliance');
                  setMobileMenuOpen(false);
                }}
              >
                Compliance
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  navigate('/audit');
                  setMobileMenuOpen(false);
                }}
              >
                Audit Trail
              </Button>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/settings');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authApi.me();
      setUser(userData);
      localStorage.setItem('userId', userData.id);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    await checkAuth();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/team" element={<TeamPage />} />
          <Route path="/projects/:projectId/risks" element={<RiskAssessmentPage />} />
          <Route path="/projects/:projectId/export" element={<ExportPage />} />
          <Route path="/projects/:projectId/versions" element={<VersionControlPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/ai" element={<AIFeaturesPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};
