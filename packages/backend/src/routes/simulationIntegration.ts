import express, { Request, Response } from 'express';
import { simulationIntegrationService } from '../services/SimulationIntegrationService';
import {
  SimulationSoftware,
  SimulationCredentials,
  SimulationParameters,
  ComputeSettings,
  SimulationSyncSettings,
  WorkflowStep,
  WorkflowTrigger,
} from '@shared/types';

const router = express.Router();

/**
 * Connect to simulation software
 * POST /api/simulation/connect
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      software,
      credentials,
      computeSettings,
      syncSettings,
    }: {
      projectId: string;
      software: SimulationSoftware;
      credentials: SimulationCredentials;
      computeSettings?: Partial<ComputeSettings>;
      syncSettings?: Partial<SimulationSyncSettings>;
    } = req.body;

    if (!projectId || !software || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, software, credentials',
      });
    }

    const connection = await simulationIntegrationService.connectSimulationSoftware(
      projectId,
      software,
      credentials,
      computeSettings,
      syncSettings
    );

    res.status(201).json({
      message: 'Simulation software connected successfully',
      connection,
    });
  } catch (error) {
    console.error('Error connecting simulation software:', error);
    res.status(500).json({
      error: 'Failed to connect simulation software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Disconnect from simulation software
 * DELETE /api/simulation/disconnect/:connectionId
 */
router.delete('/disconnect/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    await simulationIntegrationService.disconnectSimulationSoftware(connectionId);

    res.json({
      message: 'Simulation software disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting simulation software:', error);
    res.status(500).json({
      error: 'Failed to disconnect simulation software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Submit simulation job
 * POST /api/simulation/jobs/submit
 */
router.post('/jobs/submit', async (req: Request, res: Response) => {
  try {
    const {
      connectionId,
      jobName,
      parameters,
      priority,
      userId,
    }: {
      connectionId: string;
      jobName: string;
      parameters: SimulationParameters;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      userId: string;
    } = req.body;

    if (!connectionId || !jobName || !parameters || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: connectionId, jobName, parameters, userId',
      });
    }

    const job = await simulationIntegrationService.submitSimulationJob(
      connectionId,
      jobName,
      parameters,
      priority,
      userId
    );

    res.status(201).json({
      message: 'Simulation job submitted successfully',
      job,
    });
  } catch (error) {
    console.error('Error submitting simulation job:', error);
    res.status(500).json({
      error: 'Failed to submit simulation job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get job status
 * GET /api/simulation/jobs/:jobId/status
 */
router.get('/jobs/:jobId/status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await simulationIntegrationService.getJobStatus(jobId);

    res.json({
      job,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Cancel simulation job
 * POST /api/simulation/jobs/:jobId/cancel
 */
router.post('/jobs/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    await simulationIntegrationService.cancelJob(jobId);

    res.json({
      message: 'Simulation job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling simulation job:', error);
    res.status(500).json({
      error: 'Failed to cancel simulation job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Import simulation results
 * POST /api/simulation/jobs/:jobId/import-results
 */
router.post('/jobs/:jobId/import-results', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const results = await simulationIntegrationService.importResults(jobId);

    res.json({
      message: 'Simulation results imported successfully',
      results,
    });
  } catch (error) {
    console.error('Error importing simulation results:', error);
    res.status(500).json({
      error: 'Failed to import simulation results',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Synchronize jobs and results
 * POST /api/simulation/connections/:connectionId/sync
 */
router.post('/connections/:connectionId/sync', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const syncResult = await simulationIntegrationService.syncJobsAndResults(connectionId);

    res.json({
      message: 'Synchronization completed',
      syncResult,
    });
  } catch (error) {
    console.error('Error synchronizing jobs and results:', error);
    res.status(500).json({
      error: 'Failed to synchronize jobs and results',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get connection details
 * GET /api/simulation/connections/:connectionId
 */
router.get('/connections/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const connection = simulationIntegrationService.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
      });
    }

    res.json({
      connection,
    });
  } catch (error) {
    console.error('Error getting connection:', error);
    res.status(500).json({
      error: 'Failed to get connection',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all connections for a project
 * GET /api/simulation/projects/:projectId/connections
 */
router.get('/projects/:projectId/connections', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const connections = simulationIntegrationService.getProjectConnections(projectId);

    res.json({
      connections,
    });
  } catch (error) {
    console.error('Error getting project connections:', error);
    res.status(500).json({
      error: 'Failed to get project connections',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all jobs for a connection
 * GET /api/simulation/connections/:connectionId/jobs
 */
router.get('/connections/:connectionId/jobs', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const jobs = simulationIntegrationService.getConnectionJobs(connectionId);

    res.json({
      jobs,
    });
  } catch (error) {
    console.error('Error getting connection jobs:', error);
    res.status(500).json({
      error: 'Failed to get connection jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create simulation workflow
 * POST /api/simulation/workflows/create
 */
router.post('/workflows/create', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      connectionId,
      workflowName,
      steps,
      triggers,
    }: {
      projectId: string;
      connectionId: string;
      workflowName: string;
      steps: Omit<WorkflowStep, 'id' | 'status' | 'result'>[];
      triggers: Omit<WorkflowTrigger, 'id'>[];
    } = req.body;

    if (!projectId || !connectionId || !workflowName || !steps || !triggers) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, connectionId, workflowName, steps, triggers',
      });
    }

    const workflow = await simulationIntegrationService.createWorkflow(
      projectId,
      connectionId,
      workflowName,
      steps,
      triggers
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
 * POST /api/simulation/workflows/:workflowId/execute
 */
router.post('/workflows/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    await simulationIntegrationService.executeWorkflow(workflowId);

    res.json({
      message: 'Workflow executed successfully',
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
 * Get workflow details
 * GET /api/simulation/workflows/:workflowId
 */
router.get('/workflows/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    const workflow = simulationIntegrationService.getWorkflow(workflowId);

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
 * Push parameters to simulation
 * POST /api/simulation/connections/:connectionId/push-parameters
 */
router.post('/connections/:connectionId/push-parameters', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { projectRequirements, targetJobId } = req.body;

    if (!projectRequirements) {
      return res.status(400).json({
        error: 'Missing required field: projectRequirements',
      });
    }

    await simulationIntegrationService.pushParametersToSimulation(
      connectionId,
      projectRequirements,
      targetJobId
    );

    res.json({
      message: 'Parameters pushed to simulation successfully',
    });
  } catch (error) {
    console.error('Error pushing parameters:', error);
    res.status(500).json({
      error: 'Failed to push parameters',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Webhook endpoint for simulation status updates
 * POST /api/webhooks/simulation/:connectionId
 */
router.post('/webhooks/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { jobId, status, progress, results } = req.body;

    console.log(`Webhook received for connection ${connectionId}:`, {
      jobId,
      status,
      progress,
    });

    // Handle webhook data
    // In production, this would update job status and trigger notifications

    res.json({
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
