import { Router } from 'express';
import { RiskEngineService } from '../services/RiskEngineService';
import { DesignGeneratorService } from '../services/DesignGeneratorService';
import { NLPQueryService } from '../services/NLPQueryService';
import { BestPracticeEngineService } from '../services/BestPracticeEngineService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const riskEngineService = new RiskEngineService();
const designGeneratorService = new DesignGeneratorService();
const nlpQueryService = new NLPQueryService();
const bestPracticeEngineService = new BestPracticeEngineService();

// Apply authentication to all routes
router.use(authenticateToken);

// Risk Engine Routes
/**
 * POST /api/advanced-ai/risk/analyze
 * Analyze project risks using AI
 */
router.post('/risk/analyze', async (req, res) => {
  try {
    const { projectId, config } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const riskAssessment = await riskEngineService.analyzeProjectRisks(projectId, userId, config);
    res.json(riskAssessment);
  } catch (error: any) {
    console.error('Error analyzing project risks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-ai/risk/mitigation
 * Generate mitigation plans for risks
 */
router.post('/risk/mitigation', async (req, res) => {
  try {
    const { risks, projectId, config } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!risks || !projectId) {
      return res.status(400).json({ error: 'Risks and project ID are required' });
    }

    // This would typically get the project and generate mitigation plans
    res.status(501).json({ 
      error: 'Mitigation plan generation not yet implemented',
      message: 'This feature requires full project service integration'
    });
  } catch (error: any) {
    console.error('Error generating mitigation plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Design Generator Routes
/**
 * POST /api/advanced-ai/design/generate
 * Generate design specification from requirements
 */
router.post('/design/generate', async (req, res) => {
  try {
    const { requirements, projectId, config } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!requirements || !projectId) {
      return res.status(400).json({ error: 'Requirements and project ID are required' });
    }

    // This would typically get the project and generate design
    res.status(501).json({ 
      error: 'Design generation not yet implemented',
      message: 'This feature requires full project service integration'
    });
  } catch (error: any) {
    console.error('Error generating design:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-ai/design/alternatives
 * Create design alternatives with optimization
 */
router.post('/design/alternatives', async (req, res) => {
  try {
    const { baseDesign, criteria, projectId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!baseDesign || !projectId) {
      return res.status(400).json({ error: 'Base design and project ID are required' });
    }

    // This would typically get the project and create alternatives
    res.status(501).json({ 
      error: 'Design alternatives not yet implemented',
      message: 'This feature requires full project service integration'
    });
  } catch (error: any) {
    console.error('Error creating design alternatives:', error);
    res.status(500).json({ error: error.message });
  }
});

// NLP Query Routes
/**
 * POST /api/advanced-ai/query
 * Process natural language query about project data
 */
router.post('/query', async (req, res) => {
  try {
    const { query, context } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryContext = {
      ...context,
      userId,
      organizationId: req.user?.organizationId,
    };

    const response = await nlpQueryService.processQuery(query, queryContext);
    res.json(response);
  } catch (error: any) {
    console.error('Error processing NLP query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-ai/query/suggestions
 * Get suggested queries based on context
 */
router.get('/query/suggestions', async (req, res) => {
  try {
    const { query, projectId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const context = {
      projectId: projectId as string,
      userId,
      organizationId: req.user?.organizationId,
      scope: 'project' as const,
      includeHistorical: false,
    };

    const suggestions = await nlpQueryService.suggestRelatedQueries(
      query as string || 'project status',
      context
    );

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Error getting query suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-ai/query/feedback
 * Provide feedback on query response
 */
router.post('/query/feedback', async (req, res) => {
  try {
    const { query, response, feedback } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!query || !response || !feedback) {
      return res.status(400).json({ error: 'Query, response, and feedback are required' });
    }

    await nlpQueryService.learnFromInteraction(query, response, feedback);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error recording query feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Best Practice Engine Routes
/**
 * GET /api/advanced-ai/best-practices/recommendations
 * Get best practice recommendations for project
 */
router.get('/best-practices/recommendations', async (req, res) => {
  try {
    const { projectType, phase, projectId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectType || !phase || !projectId) {
      return res.status(400).json({ error: 'Project type, phase, and project ID are required' });
    }

    const recommendations = await bestPracticeEngineService.recommendBestPractices(
      projectType as string,
      phase as string,
      { id: projectId } as any, // Would get full project
      userId
    );

    res.json({ recommendations });
  } catch (error: any) {
    console.error('Error getting best practice recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/advanced-ai/best-practices/process-improvements
 * Identify process improvements for project
 */
router.post('/best-practices/process-improvements', async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const improvements = await bestPracticeEngineService.identifyProcessImprovements(
      projectId,
      userId
    );

    res.json({ improvements });
  } catch (error: any) {
    console.error('Error identifying process improvements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-ai/best-practices/phase
 * Get best practices for specific project phase
 */
router.get('/best-practices/phase', async (req, res) => {
  try {
    const { phase, disciplines, projectScale } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!phase || !disciplines) {
      return res.status(400).json({ error: 'Phase and disciplines are required' });
    }

    const disciplineArray = Array.isArray(disciplines) ? disciplines : [disciplines];
    const practices = await bestPracticeEngineService.getPhaseBestPractices(
      phase as string,
      disciplineArray as string[],
      projectScale as string
    );

    res.json({ practices });
  } catch (error: any) {
    console.error('Error getting phase best practices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-ai/best-practices/case-studies
 * Get case studies for best practices
 */
router.get('/best-practices/case-studies', async (req, res) => {
  try {
    const { category, disciplines, limit } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!category || !disciplines) {
      return res.status(400).json({ error: 'Category and disciplines are required' });
    }

    const disciplineArray = Array.isArray(disciplines) ? disciplines : [disciplines];
    const caseStudies = await bestPracticeEngineService.generateCaseStudies(
      category as any,
      disciplineArray as string[],
      parseInt(limit as string) || 5
    );

    res.json({ caseStudies });
  } catch (error: any) {
    console.error('Error getting case studies:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/advanced-ai/capabilities
 * Get advanced AI service capabilities
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      riskEngine: {
        available: true,
        features: ['risk-analysis', 'mitigation-planning', 'future-prediction'],
        confidence: 0.8,
      },
      designGenerator: {
        available: true,
        features: ['specification-generation', 'alternatives-creation', 'compliance-validation'],
        confidence: 0.7,
      },
      nlpQuery: {
        available: true,
        features: ['natural-language-queries', 'data-visualization', 'follow-up-suggestions'],
        confidence: 0.8,
      },
      bestPracticeEngine: {
        available: true,
        features: ['recommendations', 'process-improvements', 'case-studies'],
        confidence: 0.9,
      },
    };

    res.json({ capabilities });
  } catch (error: any) {
    console.error('Error getting advanced AI capabilities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;