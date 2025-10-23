import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GitBranch, GitCommit, Clock, User } from 'lucide-react';

interface VersionControlProps {
  projectId: string;
}

export const VersionControl: React.FC<VersionControlProps> = ({ projectId }) => {
  const [versions, setVersions] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <GitBranch className="w-6 h-6 mr-2 text-purple-600" />
          Version Control
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track changes and manage document versions
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <GitCommit className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Version 1.{i}.0
                  </h3>
                  <Badge variant="info" size="sm">Current</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Updated design specifications and requirements
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    John Doe
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {i} days ago
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm">View Diff</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
