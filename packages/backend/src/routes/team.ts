import { Router, Request, Response } from 'express';
import { TeamService } from '../services/TeamService';
import { authenticateToken } from '../middleware/auth';
import { DynamicRole } from '@shared/types';

const router = Router();
const teamService = new TeamService();

// Apply authentication to all team routes
router.use(authenticateToken);

// POST /api/team/:projectId/invite - Invite user to project team
router.post('/:projectId/invite', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, role' 
      });
    }

    // Check if user has permission to invite team members
    const hasPermission = await teamService.checkPermission(
      projectId,
      userId,
      'invite_members'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to invite team members' 
      });
    }

    const result = await teamService.inviteTeamMember(
      projectId,
      email,
      role as DynamicRole,
      userId
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to invite team member' 
    });
  }
});

// GET /api/team/:projectId/members - Get team members for project
router.get('/:projectId/members', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has permission to view team members
    const hasPermission = await teamService.checkPermission(
      projectId,
      userId,
      'view_team'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view team members' 
      });
    }

    const teamMembers = await teamService.getTeamMembers(projectId);
    res.json(teamMembers);
  } catch (error) {
    console.error('Error getting team members:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// PUT /api/team/:projectId/members/:memberId/role - Update team member role
router.put('/:projectId/members/:memberId/role', async (req: Request, res: Response) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Check if user has permission to update team member roles
    const hasPermission = await teamService.checkPermission(
      projectId,
      userId,
      'manage_team'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to update team member roles' 
      });
    }

    await teamService.updateTeamMemberRole(
      projectId,
      memberId,
      role as DynamicRole,
      userId
    );

    res.json({ message: 'Team member role updated successfully' });
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update team member role' 
    });
  }
});

// DELETE /api/team/:projectId/members/:memberId - Remove team member
router.delete('/:projectId/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has permission to remove team members
    const hasPermission = await teamService.checkPermission(
      projectId,
      userId,
      'manage_team'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to remove team members' 
      });
    }

    await teamService.removeTeamMember(projectId, memberId, userId);
    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to remove team member' 
    });
  }
});

// GET /api/team/:projectId/active - Get active users for presence indicators
router.get('/:projectId/active', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has permission to view team presence
    const hasPermission = await teamService.checkPermission(
      projectId,
      userId,
      'view_team'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to view team presence' 
      });
    }

    const activeUsers = await teamService.getActiveUsers(projectId);
    res.json(activeUsers);
  } catch (error) {
    console.error('Error getting active users:', error);
    res.status(500).json({ error: 'Failed to get active users' });
  }
});

// POST /api/team/activity - Update user activity (for presence tracking)
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const { location } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await teamService.updateUserActivity(userId, location);
    res.json({ message: 'Activity updated successfully' });
  } catch (error) {
    console.error('Error updating user activity:', error);
    res.status(500).json({ error: 'Failed to update user activity' });
  }
});

// POST /api/team/invitations/:invitationId/accept - Accept team invitation
router.post('/invitations/:invitationId/accept', async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await teamService.acceptInvitation(invitationId, userId);
    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to accept invitation' 
    });
  }
});

export default router;