import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, GitBranch, GitCommit, GitMerge, Clock, User, FileText } from 'lucide-react';

export const VersionControlPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [versions, setVersions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersionData();
  }, []);

  const loadVersionData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setBranches([
        { id: '1', name: 'main', isActive: true, commits: 15, lastUpdate: new Date() },
        { id: '2', name: 'feature/new-design', isActive: false, commits: 5, lastUpdate: new Date(Date.now() - 86400000) },
        { id: '3', name: 'hotfix/bug-123', isActive: false, commits: 2, lastUpdate: new Date(Date.now() - 172800000) },
      ]);

      setVersions([
        {
          id: '1',
          version: 'v1.3.0',
          branch: 'main',
          author: 'John Doe',
          timestamp: new Date(),
          message: 'Updated requirements phase with new specifications',
          changes: ['requirements.md', 'design.md'],
        },
        {
          id: '2',
          version: 'v1.2.5',
          branch: 'main',
          author: 'Jane Smith',
          timestamp: new Date(Date.now() - 3600000),
          message: 'Fixed typos in design documentation',
          changes: ['design.md'],
        },
        {
          id: '3',
          version: 'v1.2.0',
          branch: 'main',
          author: 'Bob Johnson',
          timestamp: new Date(Date.now() - 86400000),
          message: 'Completed preliminary design phase',
          changes: ['preliminary-design.md', 'diagrams/architecture.png'],
        },
      ]);
    } catch (error) {
      console.error('Error loading version data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!confirm('Are you sure you want to revert to this version?')) return;
    
    try {
      // Implement revert logic
      alert('Version reverted successfully!');
      await loadVersionData();
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Failed to revert version');
    }
  };

  const handleCreateBranch = () => {
    const branchName = prompt('Enter branch name:');
    if (branchName) {
      alert(`Branch "${branchName}" created successfully!`);
      loadVersionData();
    }
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
            <Button variant="outline" size="sm" onClick={() => navigate(projectId ? `/projects/${projectId}` : '/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <GitBranch className="w-6 h-6 mr-2 text-purple-600" />
                Version Control
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage project versions and branches
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={handleCreateBranch}>
            <GitBranch className="w-4 h-4 mr-2" />
            New Branch
          </Button>
        </div>

        {/* Branches */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Branches
            </h2>
            <div className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GitBranch className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {branch.name}
                          </span>
                          {branch.isActive && (
                            <Badge variant="success" size="sm">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {branch.commits} commits • Last updated {new Date(branch.lastUpdate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!branch.isActive && (
                        <>
                          <Button variant="outline" size="sm">
                            <GitMerge className="w-4 h-4 mr-1" />
                            Merge
                          </Button>
                          <Button variant="outline" size="sm">
                            Switch
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Version History */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Version History
            </h2>
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="absolute left-0 top-0 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-gray-900"></div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <GitCommit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {version.version}
                          </span>
                          <Badge variant="outline" size="sm">{version.branch}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {version.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{version.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(version.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevert(version.id)}
                      >
                        Revert
                      </Button>
                    </div>
                    
                    {version.changes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Changed files:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {version.changes.map((file: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
