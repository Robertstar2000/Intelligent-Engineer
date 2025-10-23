import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const analyticsService = new AnalyticsService();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/analytics/projects/:projectId
 * Get comprehensive analytics for a specific project
 */
router.get('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // TODO: Check if user has access to this project
    
    const analytics = await analyticsService.getProjectAnalytics(projectId);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error getting project analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/projects/:projectId/velocity
 * Get velocity trends for a project
 */
router.get('/projects/:projectId/velocity', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const velocityTrends = await analyticsService.calculateVelocityTrends(projectId, days);
    res.json(velocityTrends);
  } catch (error: any) {
    console.error('Error getting velocity trends:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/comparative
 * Get comparative analytics across all user's projects
 */
router.get('/comparative', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const comparativeAnalytics = await analyticsService.getComparativeAnalytics(userId);
    res.json(comparativeAnalytics);
  } catch (error: any) {
    console.error('Error getting comparative analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/dashboard/:projectId
 * Get dashboard summary data for a project
 */
router.get('/dashboard/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const analytics = await analyticsService.getProjectAnalytics(projectId);
    
    // Return a simplified dashboard view
    const dashboard = {
      projectId,
      completionPercentage: analytics.metrics.completionPercentage,
      estimatedCompletionDate: analytics.metrics.estimatedCompletionDate,
      teamSize: analytics.teamPerformance.teamSize,
      activeMembers: analytics.teamPerformance.memberContributions.filter(m => m.completedTasks > 0).length,
      totalTasks: analytics.metrics.totalTasks,
      completedTasks: analytics.metrics.completedTasks,
      blockedTasks: analytics.metrics.blockedTasks,
      velocity: analytics.metrics.velocity,
      efficiencyRatio: analytics.metrics.efficiencyRatio,
      recentActivity: analytics.progressTrends.slice(-7),
      topPerformers: analytics.teamPerformance.topPerformers,
      generatedAt: analytics.generatedAt,
    };
    
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
