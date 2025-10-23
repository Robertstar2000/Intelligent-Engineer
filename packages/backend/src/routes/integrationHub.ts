import express, { Request, Response } from 'express';
import { integrationHubService } from '../services/IntegrationHubService';
import {
  IntegrationType,
  IntegrationConfiguration,
  IntegrationCredentials,
  IntegrationTemplate,
} from '@shared/types';

const router = express.Router();

/**
 * Register new integration
 * POST /api/integration-hub/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      name,
      type,
      provider,
      configuration,
      credentials,
    }: {
      projectId: string;
      name: string;
      type: IntegrationType;
      provider: string;
      configuration: IntegrationConfiguration;
      credentials: IntegrationCredentials;
    } = req.body;

    if (!projectId || !name || !type || !provider || !configuration || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, name, type, provider, configuration, credentials',
      });
    }

    const integration = await integrationHubService.registerIntegration(
      projectId,
      name,
      type,
      provider,
      configuration,
      credentials
    );

    res.status(201).json({
      message: 'Integration registered successfully',
      integration,
    });
  } catch (error) {
    console.error('Error registering integration:', error);
    res.status(500).json({
      error: 'Failed to register integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update integration configuration
 * PUT /api/integration-hub/:integrationId
 */
router.put('/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const updates: Partial<IntegrationConfiguration> = req.body;

    const integration = await integrationHubService.updateIntegration(
      integrationId,
      updates
    );

    res.json({
      message: 'Integration updated successfully',
      integration,
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      error: 'Failed to update integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete integration
 * DELETE /api/integration-hub/:integrationId
 */
router.delete('/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    await integrationHubService.deleteIntegration(integrationId);

    res.json({
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({
      error: 'Failed to delete integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration details
 * GET /api/integration-hub/:integrationId
 */
router.get('/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const integration = integrationHubService.getIntegration(integrationId);

    if (!integration) {
      return res.status(404).json({
        error: 'Integration not found',
      });
    }

    res.json({
      integration,
    });
  } catch (error) {
    console.error('Error getting integration:', error);
    res.status(500).json({
      error: 'Failed to get integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all integrations for a project
 * GET /api/integration-hub/projects/:projectId
 */
router.get('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query;

    let integrations;
    if (type) {
      integrations = integrationHubService.getIntegrationsByType(
        projectId,
        type as IntegrationType
      );
    } else {
      integrations = integrationHubService.getProjectIntegrations(projectId);
    }

    res.json({
      integrations,
    });
  } catch (error) {
    console.error('Error getting project integrations:', error);
    res.status(500).json({
      error: 'Failed to get project integrations',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Test integration connection
 * POST /api/integration-hub/:integrationId/test
 */
router.post('/:integrationId/test', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const health = await integrationHubService.testConnection(integrationId);

    res.json({
      message: 'Connection test completed',
      health,
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration health
 * GET /api/integration-hub/:integrationId/health
 */
router.get('/:integrationId/health', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const health = integrationHubService.getIntegrationHealth(integrationId);

    if (!health) {
      return res.status(404).json({
        error: 'Integration not found',
      });
    }

    res.json({
      health,
    });
  } catch (error) {
    console.error('Error getting integration health:', error);
    res.status(500).json({
      error: 'Failed to get integration health',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration metrics
 * GET /api/integration-hub/:integrationId/metrics
 */
router.get('/:integrationId/metrics', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const metrics = integrationHubService.getIntegrationMetrics(integrationId);

    if (!metrics) {
      return res.status(404).json({
        error: 'Integration not found',
      });
    }

    res.json({
      metrics,
    });
  } catch (error) {
    console.error('Error getting integration metrics:', error);
    res.status(500).json({
      error: 'Failed to get integration metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration logs
 * GET /api/integration-hub/:integrationId/logs
 */
router.get('/:integrationId/logs', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { limit, level } = req.query;

    const logs = integrationHubService.getIntegrationLogs(
      integrationId,
      limit ? parseInt(limit as string) : 100,
      level as 'info' | 'warning' | 'error' | undefined
    );

    res.json({
      logs,
    });
  } catch (error) {
    console.error('Error getting integration logs:', error);
    res.status(500).json({
      error: 'Failed to get integration logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Register webhook
 * POST /api/integration-hub/:integrationId/webhooks
 */
router.post('/:integrationId/webhooks', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: 'Missing required fields: url, events (array)',
      });
    }

    const webhook = await integrationHubService.registerWebhook(
      integrationId,
      url,
      events,
      secret
    );

    res.status(201).json({
      message: 'Webhook registered successfully',
      webhook,
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({
      error: 'Failed to register webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Execute API call
 * POST /api/integration-hub/:integrationId/execute
 */
router.post('/:integrationId/execute', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { method, endpoint, data } = req.body;

    if (!method || !endpoint) {
      return res.status(400).json({
        error: 'Missing required fields: method, endpoint',
      });
    }

    const result = await integrationHubService.executeAPICall(
      integrationId,
      method,
      endpoint,
      data
    );

    res.json({
      message: 'API call executed successfully',
      result,
    });
  } catch (error) {
    console.error('Error executing API call:', error);
    res.status(500).json({
      error: 'Failed to execute API call',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Batch execute API calls
 * POST /api/integration-hub/:integrationId/batch-execute
 */
router.post('/:integrationId/batch-execute', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { calls } = req.body;

    if (!calls || !Array.isArray(calls)) {
      return res.status(400).json({
        error: 'Missing required field: calls (array)',
      });
    }

    const results = await integrationHubService.batchExecuteAPICalls(
      integrationId,
      calls
    );

    res.json({
      message: 'Batch execution completed',
      results,
    });
  } catch (error) {
    console.error('Error executing batch API calls:', error);
    res.status(500).json({
      error: 'Failed to execute batch API calls',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create custom integration
 * POST /api/integration-hub/custom/create
 */
router.post('/custom/create', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      name,
      description,
      template,
    }: {
      projectId: string;
      name: string;
      description: string;
      template: IntegrationTemplate;
    } = req.body;

    if (!projectId || !name || !description || !template) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, name, description, template',
      });
    }

    const customIntegration = await integrationHubService.createCustomIntegration(
      projectId,
      name,
      description,
      template
    );

    res.status(201).json({
      message: 'Custom integration created successfully',
      customIntegration,
    });
  } catch (error) {
    console.error('Error creating custom integration:', error);
    res.status(500).json({
      error: 'Failed to create custom integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get custom integration
 * GET /api/integration-hub/custom/:customId
 */
router.get('/custom/:customId', async (req: Request, res: Response) => {
  try {
    const { customId } = req.params;

    const customIntegration = integrationHubService.getCustomIntegration(customId);

    if (!customIntegration) {
      return res.status(404).json({
        error: 'Custom integration not found',
      });
    }

    res.json({
      customIntegration,
    });
  } catch (error) {
    console.error('Error getting custom integration:', error);
    res.status(500).json({
      error: 'Failed to get custom integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List custom integrations
 * GET /api/integration-hub/custom
 */
router.get('/custom', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    const customIntegrations = integrationHubService.listCustomIntegrations(
      projectId as string | undefined
    );

    res.json({
      customIntegrations,
    });
  } catch (error) {
    console.error('Error listing custom integrations:', error);
    res.status(500).json({
      error: 'Failed to list custom integrations',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Deploy custom integration
 * POST /api/integration-hub/custom/:customId/deploy
 */
router.post('/custom/:customId/deploy', async (req: Request, res: Response) => {
  try {
    const { customId } = req.params;
    const { projectId, configuration, credentials } = req.body;

    if (!projectId || !configuration || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, configuration, credentials',
      });
    }

    const integration = await integrationHubService.deployCustomIntegration(
      customId,
      projectId,
      configuration,
      credentials
    );

    res.status(201).json({
      message: 'Custom integration deployed successfully',
      integration,
    });
  } catch (error) {
    console.error('Error deploying custom integration:', error);
    res.status(500).json({
      error: 'Failed to deploy custom integration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration statistics for a project
 * GET /api/integration-hub/projects/:projectId/statistics
 */
router.get('/projects/:projectId/statistics', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const statistics = integrationHubService.getIntegrationStatistics(projectId);

    res.json({
      statistics,
    });
  } catch (error) {
    console.error('Error getting integration statistics:', error);
    res.status(500).json({
      error: 'Failed to get integration statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
