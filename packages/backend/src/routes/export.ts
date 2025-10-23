import express, { Request, Response } from 'express';
import { exportService } from '../services/ExportService';
import {
  ExportFormat,
  ExportOptions,
} from '@shared/types';

const router = express.Router();

/**
 * Export project
 * POST /api/export/projects/:projectId
 */
router.post('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const {
      format,
      options,
      userId,
    }: {
      format: ExportFormat;
      options: ExportOptions;
      userId: string;
    } = req.body;

    if (!format || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: format, userId',
      });
    }

    const result = await exportService.exportProject(
      projectId,
      format,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Export completed successfully',
      result,
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    res.status(500).json({
      error: 'Failed to export project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Export document
 * POST /api/export/projects/:projectId/documents/:documentId
 */
router.post('/projects/:projectId/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const { projectId, documentId } = req.params;
    const {
      format,
      options,
      userId,
    }: {
      format: ExportFormat;
      options: ExportOptions;
      userId: string;
    } = req.body;

    if (!format || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: format, userId',
      });
    }

    const result = await exportService.exportDocument(
      projectId,
      documentId,
      format,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Document export completed successfully',
      result,
    });
  } catch (error) {
    console.error('Error exporting document:', error);
    res.status(500).json({
      error: 'Failed to export document',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Batch export projects
 * POST /api/export/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const {
      projectIds,
      format,
      options,
      userId,
    }: {
      projectIds: string[];
      format: ExportFormat;
      options: ExportOptions;
      userId: string;
    } = req.body;

    if (!projectIds || !Array.isArray(projectIds) || !format || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: projectIds (array), format, userId',
      });
    }

    const results = await exportService.batchExport(
      projectIds,
      format,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Batch export completed',
      results,
    });
  } catch (error) {
    console.error('Error in batch export:', error);
    res.status(500).json({
      error: 'Failed to complete batch export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get export status
 * GET /api/export/status/:exportId
 */
router.get('/status/:exportId', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const status = exportService.getExportStatus(exportId);

    if (!status) {
      return res.status(404).json({
        error: 'Export not found',
      });
    }

    res.json({
      status,
    });
  } catch (error) {
    console.error('Error getting export status:', error);
    res.status(500).json({
      error: 'Failed to get export status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get export history
 * GET /api/export/projects/:projectId/history
 */
router.get('/projects/:projectId/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const history = exportService.getExportHistory(projectId);

    res.json({
      history,
    });
  } catch (error) {
    console.error('Error getting export history:', error);
    res.status(500).json({
      error: 'Failed to get export history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Download export
 * GET /api/export/:exportId/download
 */
router.get('/:exportId/download', async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;

    const status = exportService.getExportStatus(exportId);

    if (!status) {
      return res.status(404).json({
        error: 'Export not found',
      });
    }

    if (status.status !== 'completed') {
      return res.status(400).json({
        error: 'Export is not completed yet',
        status: status.status,
        progress: status.progress,
      });
    }

    // In production, this would stream the actual file
    res.json({
      message: 'File download would start here',
      exportId,
      fileName: `export_${exportId}.${status.format}`,
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({
      error: 'Failed to download export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create export template
 * POST /api/export/templates
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      format,
      configuration,
      userId,
    }: {
      name: string;
      description: string;
      format: ExportFormat;
      configuration: any;
      userId: string;
    } = req.body;

    if (!name || !description || !format || !configuration || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, format, configuration, userId',
      });
    }

    const template = await exportService.createTemplate(
      name,
      description,
      format,
      configuration,
      userId
    );

    res.status(201).json({
      message: 'Export template created successfully',
      template,
    });
  } catch (error) {
    console.error('Error creating export template:', error);
    res.status(500).json({
      error: 'Failed to create export template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get export template
 * GET /api/export/templates/:templateId
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = exportService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    res.json({
      template,
    });
  } catch (error) {
    console.error('Error getting export template:', error);
    res.status(500).json({
      error: 'Failed to get export template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List export templates
 * GET /api/export/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { format } = req.query;

    const templates = exportService.listTemplates(format as ExportFormat | undefined);

    res.json({
      templates,
    });
  } catch (error) {
    console.error('Error listing export templates:', error);
    res.status(500).json({
      error: 'Failed to list export templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
