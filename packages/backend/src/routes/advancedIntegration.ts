import express, { Request, Response } from 'express';
import { advancedIntegrationService } from '../services/AdvancedIntegrationService';
import {
  WorkflowStep,
  WorkflowTrigger,
  PipelineStage,
} from '@shared/types';

const router = express.Router();

/**
 * Create workflow
 * POST /api/advanced-integration/workflows
 */
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      name,
      description,
      steps,
      triggers,
      integrationIds,
    }: {
      projectId: string;
      name: string;
      description: string;
      steps: Omit<WorkflowStep, 'id' | 'status' | 'result'>[];
      triggers: Omit<WorkflowTrigger, 'id'>[];
      integrationIds: string[];
    } = req.body;

    if (!projectId || !name || !steps || !triggers || !integrationIds) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, name, steps, triggers, integrationIds',
      });
    }

    const workflow = await advancedIntegrationService.createWorkflow(
      projectId,
      name,
      description,
      steps,
      triggers,
      integrationIds
    );

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Execute workflow
 * POST /api/advanced-integration/workflows/:workflowId/execute
 */
router.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { context } = req.body;

    const execution = await advancedIntegrationService.executeWorkflow(workflowId, context);

    res.json({
      message: 'Workflow executed successfully',
      execution,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get workflow
 * GET /api/advanced-integration/workflows/:workflowId
 */
router.get('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    const workflow = advancedIntegrationService.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({
        error: 'Workflow not found',
      });
    }

    res.json({
      workflow,
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      error: 'Failed to get workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get project workflows
 * GET /api/advanced-integration/projects/:projectId/workflows
 */
router.get('/projects/:projectId/workflows', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const workflows = advancedIntegrationService.getProjectWorkflows(projectId);

    res.json({
      workflows,
    });
  } catch (error) {
    console.error('Error getting project workflows:', error);
    res.status(500).json({
      error: 'Failed to get project workflows',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get workflow execution
 * GET /api/advanced-integration/workflows/executions/:executionId
 */
router.get('/workflows/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    const execution = advancedIntegrationService.getWorkflowExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        error: 'Workflow execution not found',
      });
    }

    res.json({
      execution,
    });
  } catch (error) {
    console.error('Error getting workflow execution:', error);
    res.status(500).json({
      error: 'Failed to get workflow execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create pipeline
 * POST /api/advanced-integration/pipelines
 */
router.post('/pipelines', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      name,
      description,
      sourceIntegrationId,
      targetIntegrationId,
      stages,
      schedule,
    }: {
      projectId: string;
      name: string;
      description: string;
      sourceIntegrationId: string;
      targetIntegrationId: string;
      stages: Omit<PipelineStage, 'id' | 'status'>[];
      schedule?: string;
    } = req.body;

    if (!projectId || !name || !sourceIntegrationId || !targetIntegrationId || !stages) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, name, sourceIntegrationId, targetIntegrationId, stages',
      });
    }

    const pipeline = await advancedIntegrationService.createPipeline(
      projectId,
      name,
      description,
      sourceIntegrationId,
      targetIntegrationId,
      stages,
      schedule
    );

    res.status(201).json({
      message: 'Pipeline created successfully',
      pipeline,
    });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({
      error: 'Failed to create pipeline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Execute pipeline
 * POST /api/advanced-integration/pipelines/:pipelineId/execute
 */
router.post('/pipelines/:pipelineId/execute', async (req: Request, res: Response) => {
  try {
    const { pipelineId } = req.params;

    const execution = await advancedIntegrationService.executePipeline(pipelineId);

    res.json({
      message: 'Pipeline executed successfully',
      execution,
    });
  } catch (error) {
    console.error('Error executing pipeline:', error);
    res.status(500).json({
      error: 'Failed to execute pipeline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get pipeline
 * GET /api/advanced-integration/pipelines/:pipelineId
 */
router.get('/pipelines/:pipelineId', async (req: Request, res: Response) => {
  try {
    const { pipelineId } = req.params;

    const pipeline = advancedIntegrationService.getPipeline(pipelineId);

    if (!pipeline) {
      return res.status(404).json({
        error: 'Pipeline not found',
      });
    }

    res.json({
      pipeline,
    });
  } catch (error) {
    console.error('Error getting pipeline:', error);
    res.status(500).json({
      error: 'Failed to get pipeline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get project pipelines
 * GET /api/advanced-integration/projects/:projectId/pipelines
 */
router.get('/projects/:projectId/pipelines', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const pipelines = advancedIntegrationService.getProjectPipelines(projectId);

    res.json({
      pipelines,
    });
  } catch (error) {
    console.error('Error getting project pipelines:', error);
    res.status(500).json({
      error: 'Failed to get project pipelines',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get pipeline execution
 * GET /api/advanced-integration/pipelines/executions/:executionId
 */
router.get('/pipelines/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    const execution = advancedIntegrationService.getPipelineExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        error: 'Pipeline execution not found',
      });
    }

    res.json({
      execution,
    });
  } catch (error) {
    console.error('Error getting pipeline execution:', error);
    res.status(500).json({
      error: 'Failed to get pipeline execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create connector
 * POST /api/advanced-integration/connectors
 */
router.post('/connectors', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      configuration,
    }: {
      name: string;
      description: string;
      type: 'source' | 'target' | 'bidirectional';
      configuration: any;
    } = req.body;

    if (!name || !description || !type || !configuration) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, type, configuration',
      });
    }

    const connector = await advancedIntegrationService.createConnector(
      name,
      description,
      type,
      configuration
    );

    res.status(201).json({
      message: 'Connector created successfully',
      connector,
    });
  } catch (error) {
    console.error('Error creating connector:', error);
    res.status(500).json({
      error: 'Failed to create connector',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Deploy connector
 * POST /api/advanced-integration/connectors/:connectorId/deploy
 */
router.post('/connectors/:connectorId/deploy', async (req: Request, res: Response) => {
  try {
    const { connectorId } = req.params;
    const { projectId, integrationId, configuration } = req.body;

    if (!projectId || !integrationId || !configuration) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, integrationId, configuration',
      });
    }

    const instance = await advancedIntegrationService.deployConnector(
      connectorId,
      projectId,
      integrationId,
      configuration
    );

    res.status(201).json({
      message: 'Connector deployed successfully',
      instance,
    });
  } catch (error) {
    console.error('Error deploying connector:', error);
    res.status(500).json({
      error: 'Failed to deploy connector',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get connector
 * GET /api/advanced-integration/connectors/:connectorId
 */
router.get('/connectors/:connectorId', async (req: Request, res: Response) => {
  try {
    const { connectorId } = req.params;

    const connector = advancedIntegrationService.getConnector(connectorId);

    if (!connector) {
      return res.status(404).json({
        error: 'Connector not found',
      });
    }

    res.json({
      connector,
    });
  } catch (error) {
    console.error('Error getting connector:', error);
    res.status(500).json({
      error: 'Failed to get connector',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List connectors
 * GET /api/advanced-integration/connectors
 */
router.get('/connectors', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const connectors = advancedIntegrationService.listConnectors(
      type as 'source' | 'target' | 'bidirectional' | undefined
    );

    res.json({
      connectors,
    });
  } catch (error) {
    console.error('Error listing connectors:', error);
    res.status(500).json({
      error: 'Failed to list connectors',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get integration analytics
 * GET /api/advanced-integration/analytics/:projectId
 */
router.get('/analytics/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { integrationId, startDate, endDate } = req.query;

    const timeRange = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    const analytics = await advancedIntegrationService.getIntegrationAnalytics(
      projectId,
      integrationId as string | undefined,
      timeRange
    );

    res.json({
      analytics,
    });
  } catch (error) {
    console.error('Error getting integration analytics:', error);
    res.status(500).json({
      error: 'Failed to get integration analytics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get performance metrics
 * GET /api/advanced-integration/metrics/:integrationId
 */
router.get('/metrics/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    const metrics = advancedIntegrationService.getPerformanceMetrics(integrationId);

    res.json({
      metrics,
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create alert
 * POST /api/advanced-integration/alerts
 */
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const {
      integrationId,
      type,
      severity,
      message,
      metadata,
    }: {
      integrationId: string;
      type: 'error' | 'performance' | 'health' | 'usage';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      metadata?: any;
    } = req.body;

    if (!integrationId || !type || !severity || !message) {
      return res.status(400).json({
        error: 'Missing required fields: integrationId, type, severity, message',
      });
    }

    const alert = await advancedIntegrationService.createAlert(
      integrationId,
      type,
      severity,
      message,
      metadata
    );

    res.status(201).json({
      message: 'Alert created successfully',
      alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: 'Failed to create alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get alerts
 * GET /api/advanced-integration/alerts/:integrationId
 */
router.get('/alerts/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { status } = req.query;

    const alerts = advancedIntegrationService.getAlerts(
      integrationId,
      status as 'active' | 'acknowledged' | 'resolved' | undefined
    );

    res.json({
      alerts,
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      error: 'Failed to get alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Acknowledge alert
 * POST /api/advanced-integration/alerts/:alertId/acknowledge
 */
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
      });
    }

    await advancedIntegrationService.acknowledgeAlert(alertId, userId);

    res.json({
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      error: 'Failed to acknowledge alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Resolve alert
 * POST /api/advanced-integration/alerts/:alertId/resolve
 */
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
      });
    }

    await advancedIntegrationService.resolveAlert(alertId, userId);

    res.json({
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
