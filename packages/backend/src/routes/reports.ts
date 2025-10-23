import { Router, Request, Response } from 'express';
import { ReportingService, ReportConfig } from '../services/ReportingService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const reportingService = new ReportingService();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/reports/generate
 * Generate a new report
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const config: ReportConfig = req.body;
    
    if (!config.projectId || !config.reportType) {
      return res.status(400).json({ error: 'Project ID and report type are required' });
    }
    
    const report = await reportingService.generateReport(config);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/schedule
 * Schedule automated report generation
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const config: ReportConfig = req.body;
    
    if (!config.projectId || !config.reportType || !config.schedule) {
      return res.status(400).json({ error: 'Project ID, report type, and schedule are required' });
    }
    
    const scheduleId = await reportingService.scheduleReport(config);
    res.json({ scheduleId, message: 'Report scheduled successfully' });
  } catch (error: any) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/:reportId
 * Get a specific report by ID
 */
router.get('/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    
    const report = await reportingService.getReport(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error: any) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/projects/:projectId
 * Get all reports for a project
 */
router.get('/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const reports = await reportingService.getProjectReports(projectId, limit);
    res.json(reports);
  } catch (error: any) {
    console.error('Error getting project reports:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/executive/:projectId
 * Generate executive summary report
 */
router.post('/executive/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { recipients } = req.body;
    
    const config: ReportConfig = {
      projectId,
      reportType: 'executive',
      recipients: recipients || [],
      includeRiskAnalysis: true,
      includeRecommendations: true,
    };
    
    const report = await reportingService.generateReport(config);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating executive report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/technical/:projectId
 * Generate technical progress report
 */
router.post('/technical/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { recipients } = req.body;
    
    const config: ReportConfig = {
      projectId,
      reportType: 'technical',
      recipients: recipients || [],
      includeRecommendations: true,
    };
    
    const report = await reportingService.generateReport(config);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating technical report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/performance/:projectId
 * Generate performance analysis report
 */
router.post('/performance/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { recipients } = req.body;
    
    const config: ReportConfig = {
      projectId,
      reportType: 'performance',
      recipients: recipients || [],
      includeRecommendations: true,
    };
    
    const report = await reportingService.generateReport(config);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/risk/:projectId
 * Generate risk assessment report
 */
router.post('/risk/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { recipients } = req.body;
    
    const config: ReportConfig = {
      projectId,
      reportType: 'risk',
      recipients: recipients || [],
      includeRiskAnalysis: true,
      includeRecommendations: true,
    };
    
    const report = await reportingService.generateReport(config);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating risk report:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
