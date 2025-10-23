import React, { useState, useEffect } from 'react';
import { Integration, IntegrationType } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Plug, 
  Plus, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface IntegrationHubProps {
  projectId: string;
  onConfigureIntegration?: (integration: Integration) => void;
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({ 
  projectId,
  onConfigureIntegration 
}) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, [projectId]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/integrations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setIntegrations(await response.json());
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'success' as const,
      disconnected: 'default' as const,
      error: 'danger' as const,
      syncing: 'default' as const,
      pending: 'warning' as const,
    };
    return variants[status as keyof typeof variants] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Plug className="w-6 h-6 mr-2 text-blue-600" />
            Integration Hub
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Connect external tools and services
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {loading ? (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {getStatusIcon(integration.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {integration.provider}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusBadge(integration.status)} size="sm">
                  {integration.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <Badge variant="default" size="sm">{integration.type}</Badge>
                </div>
                {integration.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(integration.lastSync).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onConfigureIntegration?.(integration)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
