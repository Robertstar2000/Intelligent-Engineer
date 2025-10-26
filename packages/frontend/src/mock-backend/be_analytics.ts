// Mock Backend - Analytics Service
import { mockStore, persistAnalytics } from './be_store';

export const analyticsService = {
  getComparative() {
    return mockStore.analytics;
  },

  generateReport(reportType: string, projectId: string, data: any) {
    return {
      reportId: `report-${Date.now()}`,
      type: reportType,
      projectId,
      format: data.format || 'pdf',
      status: 'processing',
      downloadUrl: `/downloads/report-${reportType}-${projectId}.${data.format || 'pdf'}`,
      createdAt: new Date().toISOString(),
      estimatedCompletionTime: new Date(Date.now() + 30000).toISOString(),
    };
  },

  getProjectMetrics(projectId: string) {
    return {
      projectId,
      metrics: {
        completion: 68,
        velocity: 8.5,
        efficiency: 85,
        quality: 92,
        teamSatisfaction: 4.2,
      },
      trends: {
        completionTrend: 'up',
        velocityTrend: 'up',
        efficiencyTrend: 'stable',
      },
      comparisons: {
        vsIndustry: {
          completion: +3,
          velocity: +1.3,
          efficiency: +5,
        },
        vsPrevious: {
          completion: +12,
          velocity: +0.8,
          efficiency: +3,
        },
      },
    };
  },
};
