import { Router } from 'express';
import { ProjectService } from '../services/ProjectService';
import { authenticateToken, requireProjectAccess, AuthenticatedRequest } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiter';
import { Project } from '@shared/types';

const router = Router();
const projectService = new ProjectService();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(generalRateLimit);

// GET /api/projects - Get all projects for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await projectService.getUserProjects(req.user!.id);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.name || !projectData.requirements || !projectData.constraints) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, requirements, constraints' 
      });
    }

    const project = await projectService.createProject(projectData, req.user!.id);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:projectId - Get a specific project
router.get('/:projectId', requireProjectAccess('read'), async (req: AuthenticatedRequest, res) => {
  try {
    const project = await projectService.getProject(req.params.projectId, req.user!.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error instanceof Error && error.message === 'Access denied to this project') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:projectId - Update a project
router.put('/:projectId', requireProjectAccess('write'), async (req: AuthenticatedRequest, res) => {
  try {
    const updates = req.body;
    const project = await projectService.updateProject(
      req.params.projectId,
      updates,
      req.user!.id
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error instanceof Error && error.message === 'Access denied to update this project') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:projectId - Delete a project
router.delete('/:projectId', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await projectService.deleteProject(req.params.projectId, req.user!.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    if (error instanceof Error && error.message === 'Only project owners can delete projects') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// PUT /api/projects/:projectId/phases/:phaseId - Update a phase
router.put('/:projectId/phases/:phaseId', requireProjectAccess('write'), async (req: AuthenticatedRequest, res) => {
  try {
    const phaseUpdates = req.body;
    const project = await projectService.updatePhase(
      req.params.projectId,
      req.params.phaseId,
      phaseUpdates,
      req.user!.id
    );

    if (!project) {
      return res.status(404).json({ error: 'Project or phase not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

// PUT /api/projects/:projectId/phases/:phaseId/sprints/:sprintId - Update a sprint
router.put('/:projectId/phases/:phaseId/sprints/:sprintId', requireProjectAccess('write'), async (req: AuthenticatedRequest, res) => {
  try {
    const sprintUpdates = req.body;
    const project = await projectService.updateSprint(
      req.params.projectId,
      req.params.phaseId,
      req.params.sprintId,
      sprintUpdates,
      req.user!.id
    );

    if (!project) {
      return res.status(404).json({ error: 'Project, phase, or sprint not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error updating sprint:', error);
    res.status(500).json({ error: 'Failed to update sprint' });
  }
});

// POST /api/projects/:projectId/team - Add team member
router.post('/:projectId/team', requireProjectAccess('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing required fields: userId, role' });
    }

    await projectService.addTeamMember(
      req.params.projectId,
      userId,
      role,
      req.user!.id
    );

    res.status(201).json({ message: 'Team member added successfully' });
  } catch (error) {
    console.error('Error adding team member:', error);
    if (error instanceof Error && error.message === 'Admin access required to add team members') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// DELETE /api/projects/:projectId/team/:userId - Remove team member
router.delete('/:projectId/team/:userId', requireProjectAccess('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    await projectService.removeTeamMember(
      req.params.projectId,
      req.params.userId,
      req.user!.id
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error removing team member:', error);
    if (error instanceof Error && error.message === 'Admin access required to remove team members') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// POST /api/projects/migrate - Migrate project from localStorage
router.post('/migrate', async (req: AuthenticatedRequest, res) => {
  try {
    const localStorageData = req.body;
    
    if (!localStorageData.name) {
      return res.status(400).json({ error: 'Invalid project data for migration' });
    }

    const project = await projectService.migrateFromLocalStorage(
      localStorageData,
      req.user!.id
    );

    res.status(201).json(project);
  } catch (error) {
    console.error('Error migrating project:', error);
    res.status(500).json({ error: 'Failed to migrate project' });
  }
});

export default router;