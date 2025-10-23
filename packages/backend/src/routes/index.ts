import { Router } from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import aiProfileRoutes from './aiProfiles';
import aiRoutes from './ai';
import templateRoutes from './templates';
import advancedAIRoutes from './advancedAI';
import teamRoutes from './team';
import taskRoutes from './tasks';
import analyticsRoutes from './analytics';
import reportsRoutes from './reports';
import complianceRoutes from './compliance';
import cadIntegrationRoutes from './cadIntegration';
import edaIntegrationRoutes from './edaIntegration';
import simulationIntegrationRoutes from './simulationIntegration';
import integrationHubRoutes from './integrationHub';
import advancedIntegrationRoutes from './advancedIntegration';
import exportRoutes from './export';
import presentationRoutes from './presentation';
import vibePromptRoutes from './vibePrompt';
import advancedExportRoutes from './advancedExport';
import { healthCheck } from '../database/connection';
import { logger } from '../middleware/logging';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    const status = dbHealthy ? 'healthy' : 'unhealthy';
    const statusCode = dbHealthy ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        api: 'up',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Intelligent Engineering Platform API',
    version: '2.0.0',
    description: 'Enhanced collaborative engineering project management platform',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      aiProfiles: '/api/ai-profiles',
      ai: '/api/ai',
      templates: '/api/templates',
      advancedAI: '/api/advanced-ai',
      team: '/api/team',
      tasks: '/api/tasks',
      analytics: '/api/analytics',
      reports: '/api/reports',
      compliance: '/api/compliance',
      cadIntegration: '/api/cad',
      edaIntegration: '/api/eda',
      simulationIntegration: '/api/simulation',
      integrationHub: '/api/integration-hub',
      advancedIntegration: '/api/advanced-integration',
      export: '/api/export',
      presentation: '/api/presentation',
      vibePrompt: '/api/vibe-prompt',
      advancedExport: '/api/advanced-export',
      health: '/api/health',
    },
    features: {
      realTimeCollaboration: true,
      aiIntegration: true,
      advancedAI: true,
      riskEngine: true,
      designGenerator: true,
      nlpQuery: true,
      bestPracticeEngine: true,
      complianceTracking: true,
      cadIntegration: true,
      edaIntegration: true,
      simulationIntegration: true,
      integrationHub: true,
      advancedIntegration: true,
      enhancedExport: true,
      presentationExport: true,
      vibePromptGeneration: true,
      advancedExportFeatures: true,
    },
  });
});

// Logs endpoint (for debugging - should be secured in production)
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const errorOnly = req.query.errors === 'true';
  
  const logs = errorOnly ? logger.getErrorLogs(limit) : logger.getLogs(limit);
  res.json(logs);
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/ai-profiles', aiProfileRoutes);
router.use('/ai', aiRoutes);
router.use('/templates', templateRoutes);
router.use('/advanced-ai', advancedAIRoutes);
router.use('/team', teamRoutes);
router.use('/tasks', taskRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);
router.use('/compliance', complianceRoutes);
router.use('/cad', cadIntegrationRoutes);
router.use('/eda', edaIntegrationRoutes);
router.use('/simulation', simulationIntegrationRoutes);
router.use('/integration-hub', integrationHubRoutes);
router.use('/advanced-integration', advancedIntegrationRoutes);
router.use('/export', exportRoutes);
router.use('/presentation', presentationRoutes);
router.use('/vibe-prompt', vibePromptRoutes);
router.use('/advanced-export', advancedExportRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

export default router;