import express, { Request, Response } from 'express';
import { presentationExportService } from '../services/PresentationExportService';
import {
  StakeholderType,
  PresentationOptions,
  ProjectExport,
} from '@shared/types';

const router = express.Router();

/**
 * Generate presentation
 * POST /api/presentation/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      projectData,
      stakeholderType,
      options,
      userId,
    }: {
      projectData: ProjectExport;
      stakeholderType: StakeholderType;
      options: PresentationOptions;
      userId: string;
    } = req.body;

    if (!projectData || !stakeholderType || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: projectData, stakeholderType, userId',
      });
    }

    const result = await presentationExportService.generatePresentation(
      projectData,
      stakeholderType,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Presentation generated successfully',
      result,
    });
  } catch (error) {
    console.error('Error generating presentation:', error);
    res.status(500).json({
      error: 'Failed to generate presentation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get presentation
 * GET /api/presentation/:presentationId
 */
router.get('/:presentationId', async (req: Request, res: Response) => {
  try {
    const { presentationId } = req.params;

    const presentation = presentationExportService.getPresentation(presentationId);

    if (!presentation) {
      return res.status(404).json({
        error: 'Presentation not found',
      });
    }

    res.json({
      presentation,
    });
  } catch (error) {
    console.error('Error getting presentation:', error);
    res.status(500).json({
      error: 'Failed to get presentation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create presentation template
 * POST /api/presentation/templates
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      stakeholderType,
      configuration,
      userId,
    }: {
      name: string;
      description: string;
      stakeholderType: StakeholderType;
      configuration: any;
      userId: string;
    } = req.body;

    if (!name || !description || !stakeholderType || !configuration || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, stakeholderType, configuration, userId',
      });
    }

    const template = await presentationExportService.createTemplate(
      name,
      description,
      stakeholderType,
      configuration,
      userId
    );

    res.status(201).json({
      message: 'Presentation template created successfully',
      template,
    });
  } catch (error) {
    console.error('Error creating presentation template:', error);
    res.status(500).json({
      error: 'Failed to create presentation template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get presentation template
 * GET /api/presentation/templates/:templateId
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = presentationExportService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    res.json({
      template,
    });
  } catch (error) {
    console.error('Error getting presentation template:', error);
    res.status(500).json({
      error: 'Failed to get presentation template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List presentation templates
 * GET /api/presentation/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { stakeholderType } = req.query;

    const templates = presentationExportService.listTemplates(
      stakeholderType as StakeholderType | undefined
    );

    res.json({
      templates,
    });
  } catch (error) {
    console.error('Error listing presentation templates:', error);
    res.status(500).json({
      error: 'Failed to list presentation templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
