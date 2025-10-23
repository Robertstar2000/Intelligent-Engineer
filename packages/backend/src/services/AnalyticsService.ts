import { query } from '../database/connection';
import { 
  ProjectAnalytics, 
  ProjectMetrics, 
  TeamPerformanceMetrics,
  TimeTrackingData,
  ProgressTrendData,
  Project
} from '@shared/types';

export class AnalyticsService {
  // Get comprehensive project analytics
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      const [metrics, teamPerformance, timeTracking, progressTrends] = await Promise.all([
        this.calculateProjectMetrics(projectId),
        this.calculateTeamPerformance(projectId),
        this.getTimeTrackingData(projectId),
        this.getProgressTrends(projectId),
      ]);

      return {
        projectId,
        metrics,
        teamPerformance,
        timeTracking,
        progressTrends,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting project analytics:', error);
      throw error;
    }
  }

  // Calculate project metrics
  private async calculateProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      // Get project data
      const projectResult = await query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];
      const phases = JSON.parse(project.phases || '[]');

      // Calculate completion metrics
      const totalPhases = phases.length;
      const completedPhases = phases.filter((p: any) => p.status === 'completed').length;
      const inProgressPhases = phases.filter((p: any) => p.status === 'in-progress').length;

      const totalSprints = phases.reduce((sum: number, p: any) => sum + (p.sprints?.length || 0), 0);
      const completedSprints = phases.reduce((sum: number, p: any) => 
        sum + (p.sprints?.filter((s: any) => s.status === 'completed').length || 0), 0
      );

      // Calculate time metrics
      const createdAt = new Date(project.created_at);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate velocity (sprints per day)
      const velocity = daysElapsed > 0 ? completedSprints / daysElapsed : 0;

      // Estimate completion
      const remainingSprints = totalSprints - completedSprints;
      const estimatedDaysToCompletion = velocity > 0 ? Math.ceil(remainingSprints / velocity) : 0;
      const estimatedCompletionDate = new Date(now.getTime() + (estimatedDaysToCompletion * 24 * 60 * 60 * 1000));

      // Get task metrics
      const taskResult = await query(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_tasks,
          SUM(estimated_hours) as total_estimated_hours,
          SUM(actual_hours) as total_actual_hours
        FROM task_assignments
        WHERE project_id = $1
      `, [projectId]);

      const taskMetrics = taskResult.rows[0];

      return {
        completionPercentage: totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0,
        sprintCompletionPercentage: totalSprints > 0 ? (completedSprints / totalSprints) * 100 : 0,
        totalPhases,
        completedPhases,
        inProgressPhases,
        totalSprints,
        completedSprints,
        totalTasks: parseInt(taskMetrics.total_tasks) || 0,
        completedTasks: parseInt(taskMetrics.completed_tasks) || 0,
        inProgressTasks: parseInt(taskMetrics.in_progress_tasks) || 0,
        blockedTasks: parseInt(taskMetrics.blocked_tasks) || 0,
        daysElapsed,
        velocity,
        estimatedCompletionDate,
        estimatedDaysRemaining: estimatedDaysToCompletion,
        totalEstimatedHours: parseFloat(taskMetrics.total_estimated_hours) || 0,
        totalActualHours: parseFloat(taskMetrics.total_actual_hours) || 0,
        efficiencyRatio: taskMetrics.total_estimated_hours > 0 
          ? (taskMetrics.total_actual_hours / taskMetrics.total_estimated_hours) * 100 
          : 100,
      };
    } catch (error) {
      console.error('Error calculating project metrics:', error);
      throw error;
    }
  }

  // Calculate team performance metrics
  private async calculateTeamPerformance(projectId: string): Promise<TeamPerformanceMetrics> {
    try {
      // Get team member contributions
      const contributionResult = await query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(ta.id) as total_tasks,
          SUM(CASE WHEN ta.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(ta.actual_hours) as hours_worked,
          AVG(CASE 
            WHEN ta.status = 'completed' AND ta.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (ta.completed_at - ta.assigned_at)) / 3600 
            ELSE NULL 
          END) as avg_completion_time_hours
        FROM project_team_members ptm
        JOIN users u ON ptm.user_id = u.id
        LEFT JOIN task_assignments ta ON ta.assigned_to = u.id AND ta.project_id = $1
        WHERE ptm.project_id = $1 AND ptm.is_active = true
        GROUP BY u.id, u.name, u.email
        ORDER BY completed_tasks DESC
      `, [projectId]);

      const memberContributions = contributionResult.rows.map((row: any) => ({
        userId: row.id,
        userName: row.name,
        email: row.email,
        totalTasks: parseInt(row.total_tasks) || 0,
        completedTasks: parseInt(row.completed_tasks) || 0,
        hoursWorked: parseFloat(row.hours_worked) || 0,
        completionRate: row.total_tasks > 0 ? (row.completed_tasks / row.total_tasks) * 100 : 0,
        averageCompletionTime: parseFloat(row.avg_completion_time_hours) || 0,
      }));

      // Calculate team-wide metrics
      const totalTeamTasks = memberContributions.reduce((sum, m) => sum + m.totalTasks, 0);
      const totalTeamCompleted = memberContributions.reduce((sum, m) => sum + m.completedTasks, 0);
      const totalTeamHours = memberContributions.reduce((sum, m) => sum + m.hoursWorked, 0);

      // Get collaboration metrics
      const collaborationResult = await query(`
        SELECT COUNT(DISTINCT session_id) as active_sessions
        FROM collaboration_sessions
        WHERE project_id = $1 AND is_active = true
      `, [projectId]);

      return {
        memberContributions,
        teamSize: memberContributions.length,
        totalTasksAssigned: totalTeamTasks,
        totalTasksCompleted: totalTeamCompleted,
        teamCompletionRate: totalTeamTasks > 0 ? (totalTeamCompleted / totalTeamTasks) * 100 : 0,
        totalHoursWorked: totalTeamHours,
        averageHoursPerMember: memberContributions.length > 0 ? totalTeamHours / memberContributions.length : 0,
        activeCollaborationSessions: parseInt(collaborationResult.rows[0]?.active_sessions) || 0,
        topPerformers: memberContributions.slice(0, 3),
      };
    } catch (error) {
      console.error('Error calculating team performance:', error);
      throw error;
    }
  }

  // Get time tracking data
  private async getTimeTrackingData(projectId: string): Promise<TimeTrackingData> {
    try {
      // Get time spent per phase
      const phaseTimeResult = await query(`
        SELECT 
          ta.phase_id,
          SUM(ta.actual_hours) as hours_spent,
          COUNT(DISTINCT ta.assigned_to) as team_members_involved
        FROM task_assignments ta
        WHERE ta.project_id = $1
        GROUP BY ta.phase_id
      `, [projectId]);

      const phaseTimeBreakdown = phaseTimeResult.rows.map((row: any) => ({
        phaseId: row.phase_id,
        hoursSpent: parseFloat(row.hours_spent) || 0,
        teamMembersInvolved: parseInt(row.team_members_involved) || 0,
      }));

      // Get daily time tracking
      const dailyTimeResult = await query(`
        SELECT 
          DATE(pn.created_at) as date,
          SUM(pn.hours_worked) as hours
        FROM progress_notes pn
        JOIN task_assignments ta ON pn.task_id = ta.id
        WHERE ta.project_id = $1
        GROUP BY DATE(pn.created_at)
        ORDER BY date DESC
        LIMIT 30
      `, [projectId]);

      const dailyTimeLog = dailyTimeResult.rows.map((row: any) => ({
        date: new Date(row.date),
        hours: parseFloat(row.hours) || 0,
      }));

      return {
        phaseTimeBreakdown,
        dailyTimeLog,
        totalHoursTracked: phaseTimeBreakdown.reduce((sum, p) => sum + p.hoursSpent, 0),
      };
    } catch (error) {
      console.error('Error getting time tracking data:', error);
      throw error;
    }
  }

  // Get progress trends
  private async getProgressTrends(projectId: string): Promise<ProgressTrendData[]> {
    try {
      // Get historical progress data
      const trendsResult = await query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events,
          action
        FROM audit_events
        WHERE resource_type = 'project' AND resource_id = $1
        GROUP BY DATE(created_at), action
        ORDER BY date DESC
        LIMIT 90
      `, [projectId]);

      // Aggregate by date
      const trendsByDate = new Map<string, ProgressTrendData>();

      trendsResult.rows.forEach((row: any) => {
        const dateKey = row.date.toISOString().split('T')[0];
        
        if (!trendsByDate.has(dateKey)) {
          trendsByDate.set(dateKey, {
            date: new Date(row.date),
            completedTasks: 0,
            hoursLogged: 0,
            teamActivity: 0,
            velocity: 0,
          });
        }

        const trend = trendsByDate.get(dateKey)!;
        
        if (row.action === 'COMPLETE_TASK') {
          trend.completedTasks += parseInt(row.events);
        }
        
        trend.teamActivity += parseInt(row.events);
      });

      // Calculate velocity for each day
      const trends = Array.from(trendsByDate.values());
      trends.forEach((trend, index) => {
        if (index < trends.length - 1) {
          const daysSince = Math.max(1, index);
          trend.velocity = trend.completedTasks / daysSince;
        }
      });

      return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting progress trends:', error);
      throw error;
    }
  }

  // Get comparative analytics across multiple projects
  async getComparativeAnalytics(userId: string): Promise<any> {
    try {
      // Get all projects for user
      const projectsResult = await query(`
        SELECT DISTINCT p.id, p.name, p.created_at, p.status
        FROM projects p
        LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
        WHERE p.created_by = $1 OR ptm.user_id = $1
        ORDER BY p.created_at DESC
      `, [userId]);

      const projects = projectsResult.rows;

      // Get analytics for each project
      const projectAnalytics = await Promise.all(
        projects.map(async (project: any) => {
          const metrics = await this.calculateProjectMetrics(project.id);
          return {
            projectId: project.id,
            projectName: project.name,
            status: project.status,
            createdAt: project.created_at,
            completionPercentage: metrics.completionPercentage,
            velocity: metrics.velocity,
            efficiencyRatio: metrics.efficiencyRatio,
            daysElapsed: metrics.daysElapsed,
          };
        })
      );

      // Calculate comparative metrics
      const avgCompletion = projectAnalytics.reduce((sum, p) => sum + p.completionPercentage, 0) / projectAnalytics.length;
      const avgVelocity = projectAnalytics.reduce((sum, p) => sum + p.velocity, 0) / projectAnalytics.length;
      const avgEfficiency = projectAnalytics.reduce((sum, p) => sum + p.efficiencyRatio, 0) / projectAnalytics.length;

      return {
        totalProjects: projects.length,
        activeProjects: projects.filter((p: any) => p.status === 'active').length,
        completedProjects: projects.filter((p: any) => p.status === 'completed').length,
        averageCompletion: avgCompletion,
        averageVelocity: avgVelocity,
        averageEfficiency: avgEfficiency,
        projectAnalytics,
      };
    } catch (error) {
      console.error('Error getting comparative analytics:', error);
      throw error;
    }
  }

  // Calculate project velocity and trends
  async calculateVelocityTrends(projectId: string, days: number = 30): Promise<any> {
    try {
      const result = await query(`
        SELECT 
          DATE(completed_at) as date,
          COUNT(*) as tasks_completed,
          SUM(actual_hours) as hours_spent
        FROM task_assignments
        WHERE project_id = $1 
          AND status = 'completed'
          AND completed_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(completed_at)
        ORDER BY date ASC
      `, [projectId]);

      const velocityData = result.rows.map((row: any) => ({
        date: new Date(row.date),
        tasksCompleted: parseInt(row.tasks_completed),
        hoursSpent: parseFloat(row.hours_spent) || 0,
        velocity: parseFloat(row.tasks_completed) / (parseFloat(row.hours_spent) || 1),
      }));

      // Calculate moving average
      const movingAverage = velocityData.map((data, index) => {
        const window = velocityData.slice(Math.max(0, index - 6), index + 1);
        const avgVelocity = window.reduce((sum, d) => sum + d.velocity, 0) / window.length;
        return {
          ...data,
          movingAverage: avgVelocity,
        };
      });

      return {
        velocityData: movingAverage,
        currentVelocity: movingAverage[movingAverage.length - 1]?.velocity || 0,
        averageVelocity: movingAverage.reduce((sum, d) => sum + d.velocity, 0) / movingAverage.length,
        trend: this.calculateTrend(movingAverage.map(d => d.velocity)),
      };
    } catch (error) {
      console.error('Error calculating velocity trends:', error);
      throw error;
    }
  }

  // Helper: Calculate trend direction
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }
}
