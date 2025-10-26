import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Plug, CheckCircle, XCircle, Settings, Plus, ExternalLink } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setIntegrations([
        {
          id: '1',
          name: 'GitHub',
          type: 'version-control',
          status: 'connected',
          description: 'Sync project milestones with GitHub issues',
          icon: '🐙',
          lastSync: new Date(),
        },
        {
          id: '2',
          name: 'Jira',
          type: 'project-management',
          status: 'connected',
          description: 'Bidirectional sync with Jira tickets',
          icon: '📋',
          lastSync: new Date(Date.now() - 3600000),
        },
      ]);

      setAvailableIntegrations([
        {
          id: '3',
          name: 'SolidWorks',
          type: 'cad',
          status: 'available',
          description: 'CAD file synchronization and design data extraction',
          icon: '🔧',
        },
        {
          id: '4',
          name: 'AutoCAD',
          type: 'cad',
          status: 'available',
          description: 'Automated CAD workflow integration',
          icon: '📐',
        },
        {
          id: '5',
          name: 'ANSYS',
          type: 'simulation',
          status: 'available',
          description: 'Simulation results import and visualization',
          icon: '🔬',
        },
        {
          id: '6',
          name: 'MATLAB',
          type: 'simulation',
          status: 'available',
          description: 'Analysis and simulation workflow automation',
          icon: '📊',
        },
        {
          id: '7',
          name: 'Slack',
          type: 'communication',
          status: 'available',
          description: 'Team notifications and updates',
          icon: '💬',
        },
      ]);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (integrationId: string) => {
    alert('Integration connection flow would start here');
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      // Implement disconnect logic
      alert('Integration disconnected successfully!');
      await loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      alert('Failed to disconnect integration');
    }
  };

  const handleConfigure = (integrationId: string) => {
    alert('Integration configuration would open here');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Plug className="w-6 h-6 mr-2 text-blue-600" />
                Integrations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect external tools and services
              </p>
            </div>
          </div>
        </div>

        {/* Connected Integrations */}
        {integrations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Connected Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigure(integration.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => (
              <Card key={integration.id} className="p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <Badge variant="outline" size="sm">{integration.type}</Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {integration.description}
                </p>
                
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleConnect(integration.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Integration Categories */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Integration Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">CAD Software</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Design tools</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔬</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Simulation</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Analysis tools</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Project Mgmt</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Task tracking</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Communication</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Team chat</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
