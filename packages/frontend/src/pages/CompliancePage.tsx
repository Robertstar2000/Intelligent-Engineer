import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const navigate = useNavigate();
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setComplianceData({
        overallCompliance: 87,
        standards: [
          { id: '1', name: 'ISO 9001', status: 'compliant', progress: 100 },
          { id: '2', name: 'FDA 21 CFR Part 11', status: 'in-progress', progress: 75 },
          { id: '3', name: 'ISO 13485', status: 'compliant', progress: 100 },
          { id: '4', name: 'GDPR', status: 'needs-attention', progress: 60 },
        ],
        gaps: [
          { id: '1', title: 'Missing audit trail documentation', severity: 'high', standard: 'FDA 21 CFR Part 11' },
          { id: '2', title: 'Incomplete data retention policy', severity: 'medium', standard: 'GDPR' },
        ],
        recentActivities: [
          { id: '1', action: 'Compliance check completed', timestamp: new Date(), user: 'System' },
          { id: '2', action: 'ISO 9001 certification renewed', timestamp: new Date(), user: 'Admin' },
        ],
      });
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
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
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-6 h-6 mr-2 text-green-600" />
                Compliance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track regulatory compliance and standards
              </p>
            </div>
          </div>
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        {/* Overall Compliance Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overall Compliance Score
            </h2>
            <Badge variant={complianceData.overallCompliance >= 80 ? 'success' : 'warning'} size="lg">
              {complianceData.overallCompliance}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                complianceData.overallCompliance >= 80 ? 'bg-green-600' : 'bg-yellow-600'
              }`}
              style={{ width: `${complianceData.overallCompliance}%` }}
            />
          </div>
        </Card>

        {/* Compliance Standards */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compliance Standards
            </h2>
            <div className="space-y-4">
              {complianceData.standards.map((standard: any) => (
                <div
                  key={standard.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {standard.status === 'compliant' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {standard.name}
                      </span>
                    </div>
                    <Badge
                      variant={
                        standard.status === 'compliant' ? 'success' :
                        standard.status === 'in-progress' ? 'warning' : 'error'
                      }
                    >
                      {standard.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${standard.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {standard.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Compliance Gaps */}
        {complianceData.gaps.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Compliance Gaps
              </h2>
              <div className="space-y-3">
                {complianceData.gaps.map((gap: any) => (
                  <div
                    key={gap.id}
                    className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {gap.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Standard: {gap.standard}
                        </p>
                      </div>
                      <Badge variant="error">{gap.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activities */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activities
            </h2>
            <div className="space-y-3">
              {complianceData.recentActivities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      by {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
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
