import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GitBranch, Play, Pause, Settings, Plus } from 'lucide-react';

interface DataPipelineManagerProps {
  projectId: string;
}

export const DataPipelineManager: React.FC<DataPipelineManagerProps> = ({ projectId }) => {
  const [pipelines, setPipelines] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <GitBranch className="w-6 h-6 mr-2 text-blue-600" />
            Data Pipeline Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure and monitor data pipelines
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Pipelines Configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first data pipeline to automate data workflows
          </p>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Pipeline
          </Button>
        </div>
      </Card>
    </div>
  );
};
