import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  description?: string;
}

interface MetricsPanelProps {
  metrics: Metric[];
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  showTrends?: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  metrics,
  title,
  columns = 4,
  showTrends = true
}) => {
  const getColorClasses = (color: string = 'blue') => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendBadge = (trend: Metric['trend']) => {
    if (!trend) return null;

    const variants = {
      up: 'success' as const,
      down: 'danger' as const,
      neutral: 'default' as const,
    };

    const icons = {
      up: <TrendingUp className="w-3 h-3 mr-1" />,
      down: <TrendingDown className="w-3 h-3 mr-1" />,
      neutral: <Minus className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[trend.direction]} size="sm">
        {icons[trend.direction]}
        {trend.value > 0 ? '+' : ''}{trend.value}%
      </Badge>
    );
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      )}

      <div className={`grid ${gridCols[columns]} gap-4`}>
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              {metric.icon && (
                <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                  {metric.icon}
                </div>
              )}
              {showTrends && metric.trend && getTrendBadge(metric.trend)}
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                {metric.unit && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.unit}
                  </span>
                )}
              </div>
              {metric.description && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {metric.description}
                </p>
              )}
              {showTrends && metric.trend && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {metric.trend.label}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Specialized metric card for KPIs
interface KPICardProps {
  label: string;
  value: string | number;
  target?: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down';
    value: number;
  };
  status?: 'on-track' | 'at-risk' | 'off-track';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  target,
  unit,
  trend,
  status = 'on-track'
}) => {
  const statusColors = {
    'on-track': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    'at-risk': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    'off-track': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  };

  const statusLabels = {
    'on-track': 'On Track',
    'at-risk': 'At Risk',
    'off-track': 'Off Track',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>
          {target && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Target: {target}{unit}
            </p>
          )}
        </div>

        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </div>
      </div>

      {trend && (
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${
            trend.direction === 'up' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowUp className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            vs. last period
          </span>
        </div>
      )}
    </Card>
  );
};
