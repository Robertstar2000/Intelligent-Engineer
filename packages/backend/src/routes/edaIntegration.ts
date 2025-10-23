import { Router, Request, Response } from 'express';
import { edaIntegrationService } from '../services/EDAIntegrationService';
import { authenticateToken } from '../middleware/auth';
import {
  EDASoftware,
  CADCredentials,
  Requirements,
  EDASoftwareType,
} from '@shared/types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/eda/connect
 * Connect to an EDA software platform
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { projectId, software, credentials, syncSettings } = req.body;

    if (!projectId || !software || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, software, credentials',
      });
    }

    if (!software.type || !software.name || !software.version) {
      return res.status(400).json({
        error: 'Invalid software configuration',
      });
    }

    const connection = await edaIntegrationService.connectEDASoftware(
      projectId,
      software as EDASoftware,
      credentials as CADCredentials,
      syncSettings
    );

    res.status(201).json({
      message: 'EDA software connected successfully',
      connection,
    });
  } catch (error) {
    console.error('Error connecting EDA software:', error);
    res.status(500).json({
      error: 'Failed to connect EDA software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/eda/:connectionId/disconnect
 * Disconnect from EDA software
 */
router.post('/:connectionId/disconnect', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    await edaIntegrationService.disconnectEDASoftware(connectionId);

    res.json({
      message: 'EDA software disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting EDA software:', error);
    res.status(500).json({
      error: 'Failed to disconnect EDA software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/eda/:connectionId
 * Get connection details
 */
router.get('/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const connection = edaIntegrationService.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
      });
    }

    const safeConnection = {
      ...connection,
      configuration: {
        ...connection.configuration,
        credentials: {
          type: connection.configuration.credentials.type,
        },
      },
    };

    res.json(safeConnection);
  } catch (error) {
    console.error('Error getting connection:', error);
    res.status(500).json({
      error: 'Failed to get connection',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/eda/project/:projectId
 * Get all connections for a project
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const connections = edaIntegrationService.getProjectConnections(projectId);

    const safeConnections = connections.map(connection => ({
      ...connection,
      configuration: {
        ...connection.configuration,
        credentials: {
          type: connection.configuration.credentials.type,
        },
      },
    }));

    res.json({
      connections: safeConnections,
      count: safeConnections.length,
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
 * POST /api/eda/:connectionId/sync
 * Trigger manual synchronization
 */
router.post('/:connectionId/sync', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const result = await edaIntegrationService.syncDesignFiles(connectionId);

    res.json({
      message: 'Synchronization completed',
      result,
    });
  } catch (error) {
    console.error('Error syncing files:', error);
    res.status(500).json({
      error: 'Failed to sync files',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/eda/:connectionId/extract/:fileId
 * Extract design data from an EDA file
 */
router.post('/:connectionId/extract/:fileId', async (req: Request, res: Response) => {
  try {
    const { connectionId, fileId } = req.params;

    const designData = await edaIntegrationService.extractDesignData(connectionId, fileId);

    res.json({
      message: 'Design data extracted successfully',
      data: designData,
    });
  } catch (error) {
    console.error('Error extracting design data:', error);
    res.status(500).json({
      error: 'Failed to extract design data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/eda/:connectionId/push-requirements
 * Push project requirements to EDA software
 */
router.post('/:connectionId/push-requirements', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { requirements, targetFiles, pushType } = req.body;

    if (!requirements || !targetFiles || !Array.isArray(targetFiles)) {
      return res.status(400).json({
        error: 'Missing required fields: requirements, targetFiles',
      });
    }

    const push = await edaIntegrationService.pushRequirements(
      connectionId,
      requirements as Requirements,
      targetFiles,
      pushType
    );

    res.json({
      message: 'Requirements pushed successfully',
      push,
    });
  } catch (error) {
    console.error('Error pushing requirements:', error);
    res.status(500).json({
      error: 'Failed to push requirements',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/eda/supported-software
 * Get list of supported EDA software
 */
router.get('/supported-software', async (req: Request, res: Response) => {
  try {
    const supportedSoftware: Array<{
      type: EDASoftwareType;
      name: string;
      description: string;
      capabilities: string[];
      supportedFormats: string[];
    }> = [
      {
        type: 'altium',
        name: 'Altium Designer',
        description: 'Professional PCB design software',
        capabilities: ['Schematic capture', 'PCB layout', 'Multi-board design', 'SPICE simulation'],
        supportedFormats: ['SchDoc', 'PcbDoc', 'PrjPcb', 'IntLib'],
      },
      {
        type: 'eagle',
        name: 'Autodesk EAGLE',
        description: 'PCB design and schematic software',
        capabilities: ['Schematic editor', 'PCB layout', 'Autorouter', 'CAM processor'],
        supportedFormats: ['sch', 'brd', 'lbr'],
      },
      {
        type: 'kicad',
        name: 'KiCad',
        description: 'Open-source EDA suite',
        capabilities: ['Schematic capture', 'PCB layout', '3D viewer', 'Gerber viewer'],
        supportedFormats: ['kicad_sch', 'kicad_pcb', 'kicad_pro'],
      },
      {
        type: 'orcad',
        name: 'OrCAD',
        description: 'PCB design software by Cadence',
        capabilities: ['Schematic capture', 'PCB design', 'Signal integrity', 'Constraint management'],
        supportedFormats: ['dsn', 'brd', 'opj'],
      },
      {
        type: 'proteus',
        name: 'Proteus Design Suite',
        description: 'Electronic design automation with simulation',
        capabilities: ['Schematic capture', 'PCB layout', 'Mixed-mode simulation', 'Microcontroller simulation'],
        supportedFormats: ['pdsprj', 'DSN', 'LYT'],
      },
      {
        type: 'ltspice',
        name: 'LTspice',
        description: 'SPICE-based analog circuit simulator',
        capabilities: ['Circuit simulation', 'Waveform analysis', 'Schematic capture', 'Model library'],
        supportedFormats: ['asc', 'net', 'raw'],
      },
      {
        type: 'multisim',
        name: 'NI Multisim',
        description: 'Circuit design and simulation software',
        capabilities: ['Circuit simulation', 'PCB design', 'Virtual instruments', 'Interactive analysis'],
        supportedFormats: ['ms14', 'ms13', 'ms12'],
      },
      {
        type: 'easyeda',
        name: 'EasyEDA',
        description: 'Cloud-based EDA tool',
        capabilities: ['Schematic capture', 'PCB design', 'SPICE simulation', 'Cloud collaboration'],
        supportedFormats: ['json', 'easyeda'],
      },
      {
        type: 'circuitmaker',
        name: 'CircuitMaker',
        description: 'Free PCB design software',
        capabilities: ['Schematic capture', 'PCB layout', 'Community libraries', 'Cloud storage'],
        supportedFormats: ['SchDoc', 'PcbDoc'],
      },
      {
        type: 'diptrace',
        name: 'DipTrace',
        description: 'PCB design software',
        capabilities: ['Schematic capture', 'PCB layout', 'Autorouter', '3D visualization'],
        supportedFormats: ['dch', 'dip', 'lib'],
      },
    ];

    res.json({
      software: supportedSoftware,
      count: supportedSoftware.length,
    });
  } catch (error) {
    console.error('Error getting supported software:', error);
    res.status(500).json({
      error: 'Failed to get supported software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/eda/webhooks/:connectionId
 * Webhook endpoint for EDA software to push updates
 */
router.post('/webhooks/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const webhookData = req.body;

    console.log(`Received webhook for EDA connection ${connectionId}:`, webhookData);

    res.json({
      message: 'Webhook received',
      processed: true,
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
