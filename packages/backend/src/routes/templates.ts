import { Router, Request, Response } from 'express';
import { TemplateService, TemplateConfig, ProjectWizardData } from '../services/TemplateService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const templateService = new TemplateService();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/templates
 * Get template library for the user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const templates = await templateService.getTemplateLibrary(userId, organizationId);
    res.json(templates);
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/disciplines
 * Get available engineering disciplines (preserving existing functionality)
 */
router.get('/disciplines', async (req: Request, res: Response) => {
  try {
    const disciplines = await templateService.getAvailableDisciplines();
    res.json({ disciplines });
  } catch (error: any) {
    console.error('Error fetching disciplines:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/generate
 * Generate a new template using AI
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const templateConfig: TemplateConfig = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!templateConfig.name || !templateConfig.disciplines || templateConfig.disciplines.length === 0) {
      return res.status(400).json({ error: 'Template name and disciplines are required' });
    }

    const template = await templateService.generateTemplate(templateConfig, userId);
    res.status(201).json(template);
  } catch (error: any) {
    console.error('Error generating template:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/templates/create-project
 * Create project from wizard data (enhanced existing functionality)
 */
router.post('/create-project', async (req: Request, res: Response) => {
  try {
    const wizardData: ProjectWizardData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!wizardData.name || !wizardData.disciplines || wizardData.disciplines.length === 0) {
      return res.status(400).json({ error: 'Project name and disciplines are required' });
    }

    // Set default values for enhanced fields
    if (!wizardData.programScale) {
      wizardData.programScale = 'medium';
    }

    const project = await templateService.createProjectFromWizard(wizardData, userId);
    res.status(201).json(project);
  } catch (error: any) {
    console.error('Error creating project from wizard:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/templates/:id
 * Get a specific template by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // This would typically check access permissions
    // For now, we'll assume templates are accessible if they exist
    const template = await templateService.getTemplateLibrary(userId);
    const foundTemplate = template.find(t => t.id === id);
    
    if (!foundTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(foundTemplate);
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/:id/customize
 * Customize template for organization
 */
router.post('/:id/customize', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationPreferences } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!organizationPreferences) {
      return res.status(400).json({ error: 'Organization preferences are required' });
    }

    // Get the template first
    const templates = await templateService.getTemplateLibrary(userId);
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const customizedTemplate = await templateService.customizeForOrganization(
      template,
      organizationPreferences,
      userId
    );

    res.json(customizedTemplate);
  } catch (error: any) {
    console.error('Error customizing template:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/templates/:id/validate
 * Validate template structure and content
 */
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get the template first
    const templates = await templateService.getTemplateLibrary(userId);
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const validation = await templateService.validateTemplate(template);
    res.json(validation);
  } catch (error: any) {
    console.error('Error validating template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/save-from-project
 * Save custom template from existing project
 */
router.post('/save-from-project', async (req: Request, res: Response) => {
  try {
    const { projectId, templateName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId || !templateName) {
      return res.status(400).json({ error: 'Project ID and template name are required' });
    }

    // This would typically get the project from ProjectService
    // For now, we'll return an error indicating this needs project integration
    res.status(501).json({ 
      error: 'Save from project functionality requires project service integration',
      message: 'This feature will be implemented when project service is fully integrated'
    });
  } catch (error: any) {
    console.error('Error saving template from project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/search
 * Search templates by name, description, or disciplines
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, disciplines, developmentMode } = req.query;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // For now, we'll do a simple filter on the template library
    // In a full implementation, this would use the repository search method
    const allTemplates = await templateService.getTemplateLibrary(userId, organizationId);
    
    const filteredTemplates = allTemplates.filter(template => {
      const matchesQuery = template.name.toLowerCase().includes(q.toLowerCase()) ||
                          template.description.toLowerCase().includes(q.toLowerCase());
      
      const matchesDisciplines = !disciplines || 
        (Array.isArray(disciplines) ? disciplines : [disciplines])
          .some((d: string) => template.disciplines.includes(d));
      
      const matchesDevMode = !developmentMode || template.developmentMode === developmentMode;
      
      return matchesQuery && matchesDisciplines && matchesDevMode;
    });

    res.json(filteredTemplates);
  } catch (error: any) {
    console.error('Error searching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/popular
 * Get popular templates based on usage
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all templates and sort by usage
    const allTemplates = await templateService.getTemplateLibrary(userId, organizationId);
    const popularTemplates = allTemplates
      .sort((a, b) => b.usage.timesUsed - a.usage.timesUsed)
      .slice(0, limit);

    res.json(popularTemplates);
  } catch (error: any) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/recent
 * Get recently created templates
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all templates and sort by creation date
    const allTemplates = await templateService.getTemplateLibrary(userId, organizationId);
    const recentTemplates = allTemplates
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    res.json(recentTemplates);
  } catch (error: any) {
    console.error('Error fetching recent templates:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;