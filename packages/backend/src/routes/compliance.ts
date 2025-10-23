import { Router, Request, Response } from 'express';
import { ComplianceService } from '../services/ComplianceService';
import { requireAuth } from '../middleware/auth';

const router = Router();
const complianceService = new ComplianceService();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/compliance/frameworks
 * Get available compliance frameworks
 */
router.get('/frameworks', async (req: Request, res: Response) => {
  try {
    const frameworks = await complianceService.getAvailableFrameworks();
    res.json(frameworks);
  } catch (error: any) {
    console.error('Error getting frameworks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/projects/:projectId/track
 * Start tracking compliance for a project
 */
router.post('/projects/:projectId/track', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { frameworkId, version } = req.body;

    if (!frameworkId || !version) {
      return res.status(400).json({ error: 'Framework ID and version are required' });
    }

    const requirement = await complianceService.trackProjectCompliance(projectId, frameworkId, version);
    res.json(requirement);
  } catch (error: any) {
    console.error('Error tracking compliance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/compliance/projects/:projectId/gap-analysis
 * Perform compliance gap analysis
 */
router.get('/projects/:projectId/gap-analysis', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const gaps = await complianceService.performGapAnalysis(projectId);
    res.json({ gaps, count: gaps.length });
  } catch (error: any) {
    console.error('Error performing gap analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/projects/:projectId/reports
 * Generate compliance report
 */
router.post('/projects/:projectId/reports', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { reportType } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    const report = await complianceService.generateComplianceReport(projectId, reportType);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/compliance/projects/:projectId/status
 * Update compliance status
 */
router.put('/projects/:projectId/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { standard, section, status } = req.body;

    if (!standard || !status) {
      return res.status(400).json({ error: 'Standard and status are required' });
    }

    await complianceService.updateComplianceStatus(projectId, standard, section, status);
    res.json({ message: 'Compliance status updated successfully' });
  } catch (error: any) {
    console.error('Error updating compliance status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/compliance/projects/:projectId/dashboard
 * Get compliance dashboard data
 */
router.get('/projects/:projectId/dashboard', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dashboard = await complianceService.getComplianceDashboard(projectId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error getting compliance dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/projects/:projectId/monitor
 * Monitor compliance changes
 */
router.post('/projects/:projectId/monitor', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    await complianceService.monitorComplianceChanges(projectId);
    res.json({ message: 'Compliance monitoring initiated' });
  } catch (error: any) {
    console.error('Error monitoring compliance:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
