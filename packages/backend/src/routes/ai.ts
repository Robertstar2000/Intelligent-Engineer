import { Router } from 'express';
import { AIService } from '../services/AIService';
import { authenticateToken } from '../middleware/auth';
import { ProjectService } from '../services/ProjectService';
import { TuningSettings } from '@shared/types';

const router = Router();
const aiService = new AIService();
const projectService = new ProjectService();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/ai/generate-content
 * Generate AI content with enhanced context
 */
router.post('/generate-content', async (req, res) => {
  try {
    const { prompt, context, tuningSettings, systemInstruction } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!prompt || !context) {
      return res.status(400).json({ error: 'Prompt and context are required' });
    }

    const response = await aiService.generateContent(
      prompt,
      context,
      tuningSettings || {},
      systemInstruction
    );

    res.json(response);
  } catch (error: any) {
    console.error('Error generating AI content:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/generate-phase-document
 * Generate phase-specific document using enhanced AI service
 */
router.post('/generate-phase-document', async (req, res) => {
  try {
    const { projectId, phaseType, sprintType, tuningSettings } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId || !phaseType || !sprintType) {
      return res.status(400).json({ error: 'Project ID, phase type, and sprint type are required' });
    }

    // Get project context
    const project = await projectService.getProject(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const content = await aiService.generatePhaseDocument(
      phaseType,
      sprintType,
      project,
      tuningSettings || {}
    );

    res.json({ content });
  } catch (error: any) {
    console.error('Error generating phase document:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/generate-design-review-checklist
 * Generate design review checklist using enhanced AI service
 */
router.post('/generate-design-review-checklist', async (req, res) => {
  try {
    const { projectId, documentContent, phaseType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId || !documentContent || !phaseType) {
      return res.status(400).json({ error: 'Project ID, document content, and phase type are required' });
    }

    // Get project context
    const project = await projectService.getProject(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const checklist = await aiService.generateDesignReviewChecklist(
      documentContent,
      phaseType,
      project
    );

    res.json({ checklist });
  } catch (error: any) {
    console.error('Error generating design review checklist:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/analyze-risk
 * Analyze project risks using AI
 */
router.post('/analyze-risk', async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get project context
    const project = await projectService.getProject(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const riskAnalysis = await aiService.analyzeRisk(project);

    res.json(riskAnalysis);
  } catch (error: any) {
    console.error('Error analyzing project risks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/validate-tuning-settings
 * Validate tuning settings format and values
 */
router.post('/validate-tuning-settings', async (req, res) => {
  try {
    const { tuningSettings } = req.body;

    if (!tuningSettings) {
      return res.status(400).json({ error: 'Tuning settings are required' });
    }

    // Validate tuning settings
    const errors: string[] = [];
    
    for (const [key, value] of Object.entries(tuningSettings)) {
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        errors.push(`Tuning setting '${key}' must be between 0 and 1`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        valid: false, 
        errors 
      });
    }

    res.json({ 
      valid: true, 
      message: 'Tuning settings are valid' 
    });
  } catch (error: any) {
    console.error('Error validating tuning settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/models
 * Get available AI models and their capabilities
 */
router.get('/models', async (req, res) => {
  try {
    const models = [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental model with enhanced capabilities',
        maxTokens: 8192,
        supportedFeatures: ['text-generation', 'json-output', 'system-instructions'],
        isDefault: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Production-ready model with high accuracy',
        maxTokens: 4096,
        supportedFeatures: ['text-generation', 'json-output', 'system-instructions'],
        isDefault: false,
      },
    ];

    res.json({ models });
  } catch (error: any) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/capabilities
 * Get AI service capabilities and status
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      contentGeneration: true,
      phaseDocumentGeneration: true,
      designReviewChecklists: true,
      riskAnalysis: true,
      contextPropagation: true,
      tuningProfiles: true,
      collaborativeContext: true,
      multiModelSupport: false, // Future enhancement
      customPrompts: false, // Future enhancement
      advancedAnalytics: false, // Future enhancement
    };

    const status = {
      apiConnected: true,
      modelsAvailable: ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
      lastHealthCheck: new Date(),
      requestsToday: 0, // Would be tracked in production
      averageResponseTime: '2.3s', // Would be measured in production
    };

    res.json({ capabilities, status });
  } catch (error: any) {
    console.error('Error fetching AI capabilities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;