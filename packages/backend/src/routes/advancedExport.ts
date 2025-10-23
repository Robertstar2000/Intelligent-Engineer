import express, { Request, Response } from 'express';
import { advancedExportService } from '../services/AdvancedExportService';
import {
  ExportFormat,
  ExportOptions,
} from '@shared/types';

const router = express.Router();

/**
 * Create batch export job
 * POST /api/advanced-export/batch
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

    const job = await advancedExportService.createBatchJob(
      projectIds,
      format,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Batch export job created successfully',
      job,
    });
  } catch (error) {
    console.error('Error creating batch export job:', error);
    res.status(500).json({
      error: 'Failed to create batch export job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get batch export job
 * GET /api/advanced-export/batch/:jobId
 */
router.get('/batch/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = advancedExportService.getBatchJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Batch export job not found',
      });
    }

    res.json({
      job,
    });
  } catch (error) {
    console.error('Error getting batch export job:', error);
    res.status(500).json({
      error: 'Failed to get batch export job',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create scheduled export
 * POST /api/advanced-export/scheduled
 */
router.post('/scheduled', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      format,
      schedule,
      options,
      distribution,
      userId,
    }: {
      projectId: string;
      format: ExportFormat;
      schedule: string;
      options: ExportOptions;
      distribution: {
        emails?: string[];
        webhooks?: string[];
        storage?: string;
      };
      userId: string;
    } = req.body;

    if (!projectId || !format || !schedule || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, format, schedule, userId',
      });
    }

    const scheduledExport = await advancedExportService.createScheduledExport(
      projectId,
      format,
      schedule,
      options || {},
      distribution || {},
      userId
    );

    res.status(201).json({
      message: 'Scheduled export created successfully',
      scheduledExport,
    });
  } catch (error) {
    console.error('Error creating scheduled export:', error);
    res.status(500).json({
      error: 'Failed to create scheduled export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get scheduled export
 * GET /api/advanced-export/scheduled/:scheduleId
 */
router.get('/scheduled/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const scheduledExport = advancedExportService.getScheduledExport(scheduleId);

    if (!scheduledExport) {
      return res.status(404).json({
        error: 'Scheduled export not found',
      });
    }

    res.json({
      scheduledExport,
    });
  } catch (error) {
    console.error('Error getting scheduled export:', error);
    res.status(500).json({
      error: 'Failed to get scheduled export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List scheduled exports
 * GET /api/advanced-export/scheduled
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    const scheduledExports = advancedExportService.listScheduledExports(
      projectId as string | undefined
    );

    res.json({
      scheduledExports,
    });
  } catch (error) {
    console.error('Error listing scheduled exports:', error);
    res.status(500).json({
      error: 'Failed to list scheduled exports',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update scheduled export
 * PUT /api/advanced-export/scheduled/:scheduleId
 */
router.put('/scheduled/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const scheduledExport = await advancedExportService.updateScheduledExport(
      scheduleId,
      updates
    );

    res.json({
      message: 'Scheduled export updated successfully',
      scheduledExport,
    });
  } catch (error) {
    console.error('Error updating scheduled export:', error);
    res.status(500).json({
      error: 'Failed to update scheduled export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete scheduled export
 * DELETE /api/advanced-export/scheduled/:scheduleId
 */
router.delete('/scheduled/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    await advancedExportService.deleteScheduledExport(scheduleId);

    res.json({
      message: 'Scheduled export deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled export:', error);
    res.status(500).json({
      error: 'Failed to delete scheduled export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get export analytics
 * GET /api/advanced-export/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    const timeRange = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    const analytics = await advancedExportService.getExportAnalytics(
      projectId as string | undefined,
      timeRange
    );

    res.json({
      analytics,
    });
  } catch (error) {
    console.error('Error getting export analytics:', error);
    res.status(500).json({
      error: 'Failed to get export analytics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create custom export format
 * POST /api/advanced-export/custom-formats
 */
router.post('/custom-formats', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      configuration,
      userId,
    }: {
      name: string;
      description: string;
      configuration: any;
      userId: string;
    } = req.body;

    if (!name || !description || !configuration || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, configuration, userId',
      });
    }

    const customFormat = await advancedExportService.createCustomFormat(
      name,
      description,
      configuration,
      userId
    );

    res.status(201).json({
      message: 'Custom export format created successfully',
      customFormat,
    });
  } catch (error) {
    console.error('Error creating custom export format:', error);
    res.status(500).json({
      error: 'Failed to create custom export format',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get custom export format
 * GET /api/advanced-export/custom-formats/:formatId
 */
router.get('/custom-formats/:formatId', async (req: Request, res: Response) => {
  try {
    const { formatId } = req.params;

    const customFormat = advancedExportService.getCustomFormat(formatId);

    if (!customFormat) {
      return res.status(404).json({
        error: 'Custom export format not found',
      });
    }

    res.json({
      customFormat,
    });
  } catch (error) {
    console.error('Error getting custom export format:', error);
    res.status(500).json({
      error: 'Failed to get custom export format',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List custom export formats
 * GET /api/advanced-export/custom-formats
 */
router.get('/custom-formats', async (req: Request, res: Response) => {
  try {
    const customFormats = advancedExportService.listCustomFormats();

    res.json({
      customFormats,
    });
  } catch (error) {
    console.error('Error listing custom export formats:', error);
    res.status(500).json({
      error: 'Failed to list custom export formats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
