import { Router, Request, Response } from 'express';
import { cadIntegrationService } from '../services/CADIntegrationService';
import { authenticateToken } from '../middleware/auth';
import {
  CADSoftware,
  CADCredentials,
  CADConfiguration,
  Requirements,
  CADSoftwareType,
} from '@shared/types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/cad/connect
 * Connect to a CAD software platform
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { projectId, software, credentials, syncSettings } = req.body;

    // Validate required fields
    if (!projectId || !software || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, software, credentials',
      });
    }

    // Validate software configuration
    if (!software.type || !software.name || !software.version) {
      return res.status(400).json({
        error: 'Invalid software configuration',
      });
    }

    const connection = await cadIntegrationService.connectCADSoftware(
      projectId,
      software as CADSoftware,
      credentials as CADCredentials,
      syncSettings
    );

    res.status(201).json({
      message: 'CAD software connected successfully',
      connection,
    });
  } catch (error) {
    console.error('Error connecting CAD software:', error);
    res.status(500).json({
      error: 'Failed to connect CAD software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cad/:connectionId/disconnect
 * Disconnect from CAD software
 */
router.post('/:connectionId/disconnect', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    await cadIntegrationService.disconnectCADSoftware(connectionId);

    res.json({
      message: 'CAD software disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting CAD software:', error);
    res.status(500).json({
      error: 'Failed to disconnect CAD software',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cad/:connectionId
 * Get connection details
 */
router.get('/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const connection = cadIntegrationService.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
      });
    }

    // Remove sensitive credential information
    const safeConnection = {
      ...connection,
      configuration: {
        ...connection.configuration,
        credentials: {
          type: connection.configuration.credentials.type,
          // Don't expose actual credentials
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
 * GET /api/cad/project/:projectId
 * Get all connections for a project
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const connections = cadIntegrationService.getProjectConnections(projectId);

    // Remove sensitive credential information
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
 * POST /api/cad/:connectionId/sync
 * Trigger manual synchronization
 */
router.post('/:connectionId/sync', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;

    const result = await cadIntegrationService.syncDesignFiles(connectionId);

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
 * POST /api/cad/:connectionId/extract/:fileId
 * Extract design data from a CAD file
 */
router.post('/:connectionId/extract/:fileId', async (req: Request, res: Response) => {
  try {
    const { connectionId, fileId } = req.params;

    const designData = await cadIntegrationService.extractDesignData(connectionId, fileId);

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
 * POST /api/cad/:connectionId/push-requirements
 * Push project requirements to CAD software
 */
router.post('/:connectionId/push-requirements', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { requirements, targetFiles, pushType } = req.body;

    // Validate required fields
    if (!requirements || !targetFiles || !Array.isArray(targetFiles)) {
      return res.status(400).json({
        error: 'Missing required fields: requirements, targetFiles',
      });
    }

    const push = await cadIntegrationService.pushRequirements(
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
 * GET /api/cad/supported-software
 * Get list of supported CAD software
 */
router.get('/supported-software', async (req: Request, res: Response) => {
  try {
    const supportedSoftware: Array<{
      type: CADSoftwareType;
      name: string;
      description: string;
      capabilities: string[];
      supportedFormats: string[];
    }> = [
      {
        type: 'solidworks',
        name: 'SolidWorks',
        description: '3D CAD design software',
        capabilities: ['3D modeling', 'Assembly design', 'Drawing creation', 'Simulation'],
        supportedFormats: ['SLDPRT', 'SLDASM', 'SLDDRW', 'STEP', 'IGES'],
      },
      {
        type: 'autocad',
        name: 'AutoCAD',
        description: '2D and 3D CAD software',
        capabilities: ['2D drafting', '3D modeling', 'Documentation', 'Collaboration'],
        supportedFormats: ['DWG', 'DXF', 'DWF', 'PDF'],
      },
      {
        type: 'fusion360',
        name: 'Fusion 360',
        description: 'Cloud-based 3D CAD/CAM/CAE software',
        capabilities: ['3D modeling', 'CAM', 'Simulation', 'Collaboration', 'Cloud storage'],
        supportedFormats: ['F3D', 'STEP', 'IGES', 'STL', 'OBJ'],
      },
      {
        type: 'inventor',
        name: 'Autodesk Inventor',
        description: 'Professional-grade 3D CAD software',
        capabilities: ['3D mechanical design', 'Simulation', 'Documentation', 'Visualization'],
        supportedFormats: ['IPT', 'IAM', 'IDW', 'STEP', 'IGES'],
      },
      {
        type: 'catia',
        name: 'CATIA',
        description: 'Multi-platform CAD/CAM/CAE software',
        capabilities: ['3D modeling', 'Systems engineering', 'Simulation', 'Manufacturing'],
        supportedFormats: ['CATPart', 'CATProduct', 'CATDrawing', 'STEP', 'IGES'],
      },
      {
        type: 'creo',
        name: 'PTC Creo',
        description: 'Parametric 3D CAD software',
        capabilities: ['Parametric modeling', 'Assembly design', 'Simulation', 'Manufacturing'],
        supportedFormats: ['PRT', 'ASM', 'DRW', 'STEP', 'IGES'],
      },
      {
        type: 'nx',
        name: 'Siemens NX',
        description: 'Advanced CAD/CAM/CAE software',
        capabilities: ['3D modeling', 'CAM', 'Simulation', 'PLM integration'],
        supportedFormats: ['PRT', 'STEP', 'IGES', 'JT', 'STL'],
      },
      {
        type: 'onshape',
        name: 'Onshape',
        description: 'Cloud-native CAD platform',
        capabilities: ['3D modeling', 'Real-time collaboration', 'Version control', 'Cloud storage'],
        supportedFormats: ['Onshape', 'STEP', 'IGES', 'STL', 'Parasolid'],
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
 * POST /api/cad/webhooks/:connectionId
 * Webhook endpoint for CAD software to push updates
 */
router.post('/webhooks/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const webhookData = req.body;

    console.log(`Received webhook for connection ${connectionId}:`, webhookData);

    // Process webhook data
    // In production, this would trigger appropriate actions based on the webhook event
    // For example: file updated, new file created, file deleted, etc.

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
