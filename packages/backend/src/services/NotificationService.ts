import { query } from '../database/connection';
import { auditLog } from '../middleware/logging';
import { 
  TaskAssignment, 
  TeamMember, 
  Phase, 
  Sprint,
  NotificationTemplate,
  EmailNotification 
} from '@shared/types';

export class NotificationService {
  // Send task assignment notification
  async sendTaskAssignmentNotification(
    taskAssignment: TaskAssignment,
    project: any,
    phase: Phase,
    sprint: Sprint,
    assignee: TeamMember
  ): Promise<void> {
    try {
      if (!assignee.user?.email) {
        console.warn('Cannot send notification: assignee email not found');
        return;
      }

      const emailContent = this.generateTaskAssignmentEmail(
        taskAssignment,
        project,
        phase,
        sprint,
        assignee
      );

      await this.sendEmail(emailContent);

      // Store notification record
      await this.storeNotification({
        id: this.generateNotificationId(),
        userId: assignee.userId,
        type: 'task_assignment',
        title: `New Task Assignment: ${sprint.name}`,
        message: `You have been assigned a new task in ${project.name}`,
        data: {
          taskId: taskAssignment.id,
          projectId: project.id,
          phaseId: phase.id,
          sprintId: sprint.id,
        },
        isRead: false,
        createdAt: new Date(),
      });

      auditLog('SEND_NOTIFICATION', 'notification', taskAssignment.id, 'system', {
        type: 'task_assignment',
        recipientId: assignee.userId,
      });
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
    }
  }

  // Send task unblocked notification
  async sendTaskUnblockedNotification(
    task: any,
    completedTaskId: string
  ): Promise<void> {
    try {
      const emailContent = this.generateTaskUnblockedEmail(task, completedTaskId);
      await this.sendEmail(emailContent);

      await this.storeNotification({
        id: this.generateNotificationId(),
        userId: task.assigned_to,
        type: 'task_unblocked',
        title: `Task Unblocked: ${task.sprint_name || 'Task'}`,
        message: 'A dependent task has been completed. You can now proceed with your task.',
        data: {
          taskId: task.id,
          completedTaskId,
        },
        isRead: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending task unblocked notification:', error);
    }
  }

  // Send deadline reminder notification
  async sendDeadlineReminderNotification(
    taskAssignment: TaskAssignment,
    daysUntilDue: number
  ): Promise<void> {
    try {
      const userResult = await query(
        'SELECT email, name FROM users WHERE id = $1',
        [taskAssignment.assignedTo]
      );

      if (userResult.rows.length === 0) return;

      const user = userResult.rows[0];
      const emailContent = this.generateDeadlineReminderEmail(
        taskAssignment,
        user,
        daysUntilDue
      );

      await this.sendEmail(emailContent);

      await this.storeNotification({
        id: this.generateNotificationId(),
        userId: taskAssignment.assignedTo,
        type: 'deadline_reminder',
        title: `Deadline Reminder: ${daysUntilDue} days remaining`,
        message: `Your task is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
        data: {
          taskId: taskAssignment.id,
          daysUntilDue,
        },
        isRead: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending deadline reminder notification:', error);
    }
  }

  // Generate task assignment email content
  private generateTaskAssignmentEmail(
    taskAssignment: TaskAssignment,
    project: any,
    phase: Phase,
    sprint: Sprint,
    assignee: TeamMember
  ): EmailNotification {
    const subject = `New Task Assignment: ${sprint.name} - ${project.name}`;
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Task Assignment</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .task-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .instructions { background: #E0F2FE; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Task Assignment</h1>
            <p>You have been assigned a new task in ${project.name}</p>
        </div>
        
        <div class="content">
            <p>Hello ${assignee.user?.name || 'Team Member'},</p>
            
            <p>You have been assigned a new task with the following details:</p>
            
            <div class="task-details">
                <h3>📋 Task Details</h3>
                <p><strong>Project:</strong> ${project.name}</p>
                <p><strong>Phase:</strong> ${phase.name}</p>
                <p><strong>Sprint:</strong> ${sprint.name}</p>
                <p><strong>Role:</strong> ${taskAssignment.assignedRole.name}</p>
                <p><strong>Priority:</strong> ${taskAssignment.priority.toUpperCase()}</p>
                <p><strong>Estimated Hours:</strong> ${taskAssignment.estimatedHours}h</p>
                <p><strong>Due Date:</strong> ${taskAssignment.dueDate.toLocaleDateString()}</p>
            </div>
            
            <div class="task-details">
                <h3>🎯 Deliverables</h3>
                <ul>
                    ${sprint.deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>
            
            ${taskAssignment.instructions.content ? `
            <div class="instructions">
                <h3>📝 Instructions</h3>
                <p>${taskAssignment.instructions.content.replace(/\n/g, '<br>')}</p>
                
                ${taskAssignment.instructions.acceptanceCriteria?.length ? `
                <h4>✅ Acceptance Criteria</h4>
                <ul>
                    ${taskAssignment.instructions.acceptanceCriteria.map(c => `<li>${c}</li>`).join('')}
                </ul>
                ` : ''}
                
                ${taskAssignment.instructions.resources?.length ? `
                <h4>📚 Resources</h4>
                <ul>
                    ${taskAssignment.instructions.resources.map(r => `<li>${r}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
            ` : ''}
            
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks/${taskAssignment.id}" class="button">
                    View Task Details
                </a>
            </p>
            
            <p>If you have any questions about this assignment, please contact your project manager or team lead.</p>
            
            <p>Best regards,<br>Intelligent Engineering Platform Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the Intelligent Engineering Platform.</p>
        </div>
    </div>
</body>
</html>
    `;

    return {
      id: this.generateEmailId(),
      recipientEmail: assignee.user!.email,
      subject,
      content,
      templateName: 'task_assignment',
      status: 'pending',
      createdAt: new Date(),
    };
  }

  // Generate task unblocked email content
  private generateTaskUnblockedEmail(task: any, completedTaskId: string): EmailNotification {
    const subject = `Task Unblocked: You can now proceed with your task`;
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Task Unblocked</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Task Unblocked</h1>
            <p>A dependent task has been completed</p>
        </div>
        
        <div class="content">
            <p>Good news! A task that was blocking your progress has been completed.</p>
            <p>You can now proceed with your assigned task.</p>
            
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task.id}" class="button">
                    View Your Task
                </a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return {
      id: this.generateEmailId(),
      recipientEmail: task.assignee_email,
      subject,
      content,
      templateName: 'task_unblocked',
      status: 'pending',
      createdAt: new Date(),
    };
  }

  // Generate deadline reminder email content
  private generateDeadlineReminderEmail(
    taskAssignment: TaskAssignment,
    user: any,
    daysUntilDue: number
  ): EmailNotification {
    const subject = `Deadline Reminder: ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`;
    
    const urgencyColor = daysUntilDue <= 1 ? '#EF4444' : daysUntilDue <= 3 ? '#F59E0B' : '#3B82F6';
    
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deadline Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Deadline Reminder</h1>
            <p>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining</p>
        </div>
        
        <div class="content">
            <p>Hello ${user.name},</p>
            <p>This is a reminder that your task is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.</p>
            <p>Due Date: ${taskAssignment.dueDate.toLocaleDateString()}</p>
            
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${taskAssignment.id}" class="button">
                    View Task
                </a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return {
      id: this.generateEmailId(),
      recipientEmail: user.email,
      subject,
      content,
      templateName: 'deadline_reminder',
      status: 'pending',
      createdAt: new Date(),
    };
  }

  // Send email (placeholder - would integrate with actual email service)
  private async sendEmail(emailNotification: EmailNotification): Promise<void> {
    try {
      // Store email in database for tracking
      await query(`
        INSERT INTO email_notifications (
          id, recipient_email, subject, content, template_name, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        emailNotification.id,
        emailNotification.recipientEmail,
        emailNotification.subject,
        emailNotification.content,
        emailNotification.templateName,
        'pending'
      ]);

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      console.log(`Email queued for ${emailNotification.recipientEmail}: ${emailNotification.subject}`);
      
      // For now, mark as sent immediately
      await query(
        'UPDATE email_notifications SET status = $1, sent_at = NOW() WHERE id = $2',
        ['sent', emailNotification.id]
      );
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Mark as failed
      await query(
        'UPDATE email_notifications SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error instanceof Error ? error.message : 'Unknown error', emailNotification.id]
      );
    }
  }

  // Store notification in database
  private async storeNotification(notification: any): Promise<void> {
    try {
      await query(`
        INSERT INTO notifications (
          id, user_id, type, title, message, data, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.isRead,
        notification.createdAt,
      ]);
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        data: JSON.parse(row.data || '{}'),
        isRead: row.is_read,
        createdAt: row.created_at,
        readAt: row.read_at,
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW() 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW() 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Check for upcoming deadlines and send reminders
  async sendDeadlineReminders(): Promise<void> {
    try {
      // Get tasks due in 1 day
      const oneDayTasks = await query(`
        SELECT ta.*, u.email, u.name
        FROM task_assignments ta
        JOIN users u ON ta.assigned_to = u.id
        WHERE ta.due_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
        AND ta.status NOT IN ('completed', 'cancelled')
      `);

      for (const task of oneDayTasks.rows) {
        await this.sendDeadlineReminderNotification(task, 1);
      }

      // Get tasks due in 3 days
      const threeDayTasks = await query(`
        SELECT ta.*, u.email, u.name
        FROM task_assignments ta
        JOIN users u ON ta.assigned_to = u.id
        WHERE ta.due_date::date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND ta.status NOT IN ('completed', 'cancelled')
      `);

      for (const task of threeDayTasks.rows) {
        await this.sendDeadlineReminderNotification(task, 3);
      }
    } catch (error) {
      console.error('Error sending deadline reminders:', error);
    }
  }

  // ID generators
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }}
