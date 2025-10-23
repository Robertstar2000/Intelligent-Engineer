import React, { useState, useEffect } from 'react';
import { Project } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ComplianceTrackerProps {
  project: Project;
}

export const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({ project }) => {
  const [requirements, setRequirements] = useState(project.complianceRequirements || []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'non-compliant': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      compliant: 'success' as const,
      'non-compliant': 'danger' as const,
      'in-progress': 'warning' as const,
      pending: 'default' as const,
    };
    return variants[status as keyof typeof variants] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-green-600" />
            Compliance Tracker
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor regulatory and standards compliance
          </p>
        </div>
        <Button variant="primary">Generate Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {requirements.filter(r => r.status === 'compliant').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Compliant</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {requirements.filter(r => r.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {requirements.filter(r => r.status === 'non-compliant').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Non-Compliant</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {requirements.map((req) => (
          <Card key={req.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getStatusIcon(req.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {req.standard} v{req.version}
                    </h3>
                    <Badge variant={getStatusBadge(req.status)} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last assessed: {new Date(req.lastAssessed).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
