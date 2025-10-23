import React, { useState } from 'react';
import { EditConflict, Change } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  X, 
  AlertTriangle, 
  User, 
  Clock, 
  ArrowRight,
  Check,
  GitMerge
} from 'lucide-react';

interface ConflictResolutionModalProps {
  conflict: EditConflict;
  onResolve: (resolution: 'accept-mine' | 'accept-theirs' | 'merge' | 'ignore') => void;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolve,
  onClose
}) => {
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [mergedContent, setMergedContent] = useState<string>('');

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getChangeDescription = (change: Change) => {
    switch (change.operation) {
      case 'create':
        return 'Added content';
      case 'update':
        return 'Modified content';
      case 'delete':
        return 'Deleted content';
      default:
        return 'Changed content';
    }
  };

  const handleResolve = () => {
    if (!selectedResolution) return;
    onResolve(selectedResolution as any);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resolve Editing Conflict
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multiple users edited the same content simultaneously
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Conflict Details */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Detected at {formatTimestamp(conflict.detectedAt)}
              </span>
            </div>
            <Badge variant="warning" size="sm">
              {conflict.conflictingChanges.length} conflicting changes
            </Badge>
          </div>

          {/* Conflicting Changes */}
          <div className="space-y-4 mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Conflicting Changes
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {conflict.conflictingChanges.map((change, index) => (
                <div
                  key={change.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        User {change.userId.slice(0, 8)}...
                      </span>
                    </div>
                    <Badge variant="info" size="sm">
                      Change {index + 1}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Action:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {getChangeDescription(change)}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Path:
                      </span>
                      <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">
                        {change.path}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Time:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {formatTimestamp(change.timestamp)}
                      </span>
                    </div>

                    {/* Content Preview */}
                    {change.operation === 'update' && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Content Changes:
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                          <div className="text-red-600 dark:text-red-400 mb-1">
                            - {String(change.oldValue).substring(0, 100)}
                            {String(change.oldValue).length > 100 && '...'}
                          </div>
                          <div className="text-green-600 dark:text-green-400">
                            + {String(change.newValue).substring(0, 100)}
                            {String(change.newValue).length > 100 && '...'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Choose Resolution
            </h3>

            <div className="grid gap-3">
              {/* Accept Mine */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResolution === 'accept-mine'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('accept-mine')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      {selectedResolution === 'accept-mine' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Keep My Changes
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discard other users' changes and keep your version
                      </p>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              </div>

              {/* Accept Theirs */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResolution === 'accept-theirs'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('accept-theirs')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      {selectedResolution === 'accept-theirs' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Accept Their Changes
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Discard your changes and accept the other users' version
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                </div>
              </div>

              {/* Merge */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResolution === 'merge'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('merge')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      {selectedResolution === 'merge' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Merge Changes
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Combine both versions (requires manual editing)
                      </p>
                    </div>
                  </div>
                  <GitMerge className="w-5 h-5 text-purple-500" />
                </div>
              </div>

              {/* Ignore */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedResolution === 'ignore'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedResolution('ignore')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      {selectedResolution === 'ignore' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Ignore Conflict
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Keep the conflict for later resolution
                      </p>
                    </div>
                  </div>
                  <X className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Merge Editor */}
            {selectedResolution === 'merge' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Merged Content
                </h4>
                <textarea
                  value={mergedContent}
                  onChange={(e) => setMergedContent(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Edit the merged content here..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleResolve} 
            disabled={!selectedResolution}
            variant="primary"
          >
            Resolve Conflict
          </Button>
        </div>
      </Card>
    </div>
  );
};