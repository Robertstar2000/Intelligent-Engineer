import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileText, Filter, Download, Clock, User } from 'lucide-react';

interface AuditTrailProps {
  projectId: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ projectId }) => {
  const [events, setEvents] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Audit Trail
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete history of all project activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Document Updated
                  </span>
                  <Badge variant="info" size="sm">Edit</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Phase 2 requirements document was modified
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    User {i}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {i} hours ago
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm">Details</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
