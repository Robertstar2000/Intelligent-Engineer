import React, { useState, useEffect } from 'react';
import { Project, RiskAssessment, Risk } from '@shared/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { projectsApi } from '../../utils/api';
import { 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RiskEnginePanelProps {
  project: Project;
}

export const RiskEnginePanel: React.FC<RiskEnginePanelProps> = ({ project }) => {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  useEffect(() => {
    loadRiskAssessment();
  }, [project.id]);

  const loadRiskAssessment = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.assessRisks(project.id, {});
      setAssessment(data);
    } catch (error) {
      console.error('Error loading risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (severity: string) => {
    const colors = {
      low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      high: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getRiskIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') return AlertTriangle;
    if (severity === 'medium') return AlertCircle;
    return CheckCircle;
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing risks...</span>
        </div>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No risk assessment available</p>
          <Button variant="primary" className="mt-4" onClick={loadRiskAssessment}>
            Run Assessment
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-orange-600" />
            Risk Assessment
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI-powered risk prediction and mitigation
          </p>
        </div>
        <Button variant="outline" onClick={loadRiskAssessment}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Risk Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Risk Level</p>
            <div className="flex items-center space-x-3">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {assessment.overallRiskScore}
              </div>
              <Badge variant={
                assessment.riskLevel === 'critical' ? 'danger' :
                assessment.riskLevel === 'high' ? 'warning' :
                assessment.riskLevel === 'medium' ? 'default' : 'success'
              }>
                {assessment.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence</p>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(assessment.confidence * 100)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Risk List */}
      <div className="space-y-3">
        {assessment.risks.map((risk) => {
          const RiskIcon = getRiskIcon(risk.severity);
          const isExpanded = expandedRisk === risk.id;

          return (
            <Card key={risk.id} className="p-6">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${getRiskColor(risk.severity)}`}>
                    <RiskIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {risk.title}
                      </h3>
                      <Badge variant="default" size="sm">{risk.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {risk.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Probability: {Math.round(risk.probability * 100)}%</span>
                      <span>Impact: {risk.impact}</span>
                      <span>Status: {risk.currentStatus}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {risk.affectedAreas.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Affected Areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {risk.affectedAreas.map((area, i) => (
                          <Badge key={i} variant="default" size="sm">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {risk.mitigationStrategies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mitigation Strategies
                      </p>
                      <ul className="space-y-2">
                        {risk.mitigationStrategies.map((strategy, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Owner: {risk.owner} • Review: {new Date(risk.reviewDate).toLocaleDateString()}
                    </div>
                    <Button variant="primary" size="sm">
                      Create Mitigation Plan
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      {assessment.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {assessment.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
