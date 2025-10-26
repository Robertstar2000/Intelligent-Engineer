import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { projectsApi } from '../utils/api';
import { ArrowLeft, AlertTriangle, Shield, TrendingUp, RefreshCw } from 'lucide-react';

export const RiskAssessmentPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectData, riskData] = await Promise.all([
        projectsApi.get(projectId!),
        projectsApi.assessRisks(projectId!, {})
      ]);
      setProject(projectData);
      setAssessment(riskData);
    } catch (error) {
      console.error('Error loading risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'Schedule':
        return '⏰';
      case 'Technical':
        return '⚙️';
      case 'Resource':
        return '👥';
      case 'Quality':
        return '✓';
      default:
        return '⚠️';
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-6 h-6 mr-2 text-blue-600" />
                Risk Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{project?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overall Risk Score */}
        {assessment && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <Badge variant="warning">{assessment.overallRiskLevel}</Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessment.riskScore}/100
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Overall Risk Score
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <Badge variant="error">
                    {assessment.risks.filter((r: any) => r.status === 'active').length}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessment.risks.filter((r: any) => r.severity === 'high' || r.severity === 'medium').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Risks
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-8 h-8 text-green-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(assessment.nextReviewDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Next Review
                </div>
              </Card>
            </div>

            {/* Risk List */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Identified Risks
              </h2>
              <div className="space-y-4">
                {assessment.risks.map((risk: any) => (
                  <div
                    key={risk.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getRiskIcon(risk.category)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {risk.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {risk.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {risk.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Probability:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {(risk.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {risk.impact}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Mitigation Strategies:
                      </h4>
                      <ul className="space-y-1">
                        {risk.mitigation.map((strategy: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                          >
                            <span className="text-blue-600 mr-2">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Recommendations
              </h2>
              <ul className="space-y-2">
                {assessment.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
