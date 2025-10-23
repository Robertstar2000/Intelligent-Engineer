import express, { Request, Response } from 'express';
import { vibePromptService } from '../services/VibePromptService';
import {
  VibePromptType,
  VibePromptOptions,
  ProjectExport,
} from '@shared/types';

const router = express.Router();

/**
 * Generate vibe prompt
 * POST /api/vibe-prompt/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      projectData,
      type,
      options,
      userId,
    }: {
      projectData: ProjectExport;
      type: VibePromptType;
      options: VibePromptOptions;
      userId: string;
    } = req.body;

    if (!projectData || !type || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: projectData, type, userId',
      });
    }

    const prompt = await vibePromptService.generatePrompt(
      projectData,
      type,
      options || {},
      userId
    );

    res.status(201).json({
      message: 'Vibe prompt generated successfully',
      prompt,
    });
  } catch (error) {
    console.error('Error generating vibe prompt:', error);
    res.status(500).json({
      error: 'Failed to generate vibe prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get vibe prompt
 * GET /api/vibe-prompt/:promptId
 */
router.get('/:promptId', async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;

    const prompt = vibePromptService.getPrompt(promptId);

    if (!prompt) {
      return res.status(404).json({
        error: 'Vibe prompt not found',
      });
    }

    res.json({
      prompt,
    });
  } catch (error) {
    console.error('Error getting vibe prompt:', error);
    res.status(500).json({
      error: 'Failed to get vibe prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create vibe prompt template
 * POST /api/vibe-prompt/templates
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      configuration,
      userId,
    }: {
      name: string;
      description: string;
      type: VibePromptType;
      configuration: any;
      userId: string;
    } = req.body;

    if (!name || !description || !type || !configuration || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, type, configuration, userId',
      });
    }

    const template = await vibePromptService.createTemplate(
      name,
      description,
      type,
      configuration,
      userId
    );

    res.status(201).json({
      message: 'Vibe prompt template created successfully',
      template,
    });
  } catch (error) {
    console.error('Error creating vibe prompt template:', error);
    res.status(500).json({
      error: 'Failed to create vibe prompt template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get vibe prompt template
 * GET /api/vibe-prompt/templates/:templateId
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = vibePromptService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
      });
    }

    res.json({
      template,
    });
  } catch (error) {
    console.error('Error getting vibe prompt template:', error);
    res.status(500).json({
      error: 'Failed to get vibe prompt template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List vibe prompt templates
 * GET /api/vibe-prompt/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const templates = vibePromptService.listTemplates(
      type as VibePromptType | undefined
    );

    res.json({
      templates,
    });
  } catch (error) {
    console.error('Error listing vibe prompt templates:', error);
    res.status(500).json({
      error: 'Failed to list vibe prompt templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
