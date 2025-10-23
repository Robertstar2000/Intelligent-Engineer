import { Router, Request, Response } from 'express';
import { TaskAssignmentService } from '../services/TaskAssignmentService';
import { NotificationService } from '../services/NotificationService';
import { authenticateToken } from '../middleware/auth';
import { DynamicRole } from '@shared/types';

const router = Router();
const taskAssignmentService = new TaskAssignmentService();
const notificationService = new NotificationService();

// Apply authentication to all task routes
router.use(authenticateToken);

// POST /api/tasks/assign - Assign task to team member
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      phaseId,
      sprintId,
      assignedTo,
      assignedRole,
      estimatedHours
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    if (!projectId || !phaseId || !sprintId || !assignedTo || !assignedRole) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, phaseId, sprintId, assignedTo, assignedRole' 
      });
    }

    const taskAssignment = await taskAssignmentService.assignTask(
      projectId,
      phaseId,
      sprintId,
      assignedTo,
      assignedRole as DynamicRole,
      userId,
      estimatedHours
    );

    res.status(201).json(taskAssignment);
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to assign task' 
    });
  }
});

// GET /api/tasks/project/:projectId - Get all tasks for a project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tasks = await taskAssignmentService.getProjectTasks(projectId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting project tasks:', error);
    res.status(500).json({ error: 'Failed to get project tasks' });
  }
});

// GET /api/tasks/user/:userId - Get tasks assigned to a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Users can only see their own tasks unless they have admin permissions
    if (userId !== targetUserId) {
      // TODO: Check if user has permission to view other users' tasks
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tasks = await taskAssignmentService.getUserTasks(targetUserId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting user tasks:', error);
    res.status(500).json({ error: 'Failed to get user tasks' });
  }
});

// GET /api/tasks/my-tasks - Get current user's tasks
router.get('/my-tasks', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tasks = await taskAssignmentService.getUserTasks(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting user tasks:', error);
    res.status(500).json({ error: 'Failed to get user tasks' });
  }
});

// PUT /api/tasks/:taskId - Update task assignment
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updatedTask = await taskAssignmentService.updateTaskAssignment(
      taskId,
      updates,
      userId
    );

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    });
  }
});

// POST /api/tasks/:taskId/progress - Add progress note to task
router.post('/:taskId/progress', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content, hoursWorked } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Progress note content is required' });
    }

    // Add progress note to task
    const progressNote = {
      id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      userId,
      content,
      hoursWorked: hoursWorked || 0,
      createdAt: new Date(),
    };

    // Update task with progress note
    await taskAssignmentService.updateTaskAssignment(
      taskId,
      {
        progressNotes: [progressNote], // This would be appended to existing notes
        actualHours: hoursWorked || 0, // This would be added to existing hours
      },
      userId
    );

    res.status(201).json(progressNote);
  } catch (error) {
    console.error('Error adding progress note:', error);
    res.status(500).json({ error: 'Failed to add progress note' });
  }
});

// GET /api/tasks/notifications/:userId - Get notifications for user
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Users can only see their own notifications
    if (userId !== targetUserId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const notifications = await notificationService.getUserNotifications(targetUserId, limit);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// PUT /api/tasks/notifications/:notificationId/read - Mark notification as read
router.put('/notifications/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await notificationService.markNotificationAsRead(notificationId, userId);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/tasks/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await notificationService.markAllNotificationsAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;