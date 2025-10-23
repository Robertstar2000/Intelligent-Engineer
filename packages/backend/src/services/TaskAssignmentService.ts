import { query } from '../database/connection';
import { auditLog } from '../middleware/logging';
import { AIService } from './AIService';
import { NotificationService } from './NotificationService';
import { TeamService } from './TeamService';
import { 
  Sprint, 
  Phase, 
  DynamicRole, 
  TeamMember,
  TaskAssignment,
  TaskDependency,
  TaskInstruction 
} from '@shared/types';

export class TaskAssignmentService {
  private aiService: AIService;
  private notificationService: NotificationService;
  private teamService: TeamService;

  constructor() {
    this.aiService = new AIService();
    this.notificationService = new NotificationService();
    this.teamService = new TeamService();
  }

  // Assign sprint/task to team member
  async assignTask(
    projectId: string,
    phaseId: string,
    sprintId: string,
    assignedTo: string,
    assignedRole: DynamicRole,
    assignedBy: string,
    estimatedHours?: number
  ): Promise<TaskAssignment> {
    try {
      // Verify permissions
      const canAssign = await this.teamService.checkPermission(
        projectId,
        assignedBy,
        'assign_tasks'
      );

      if (!canAssign) {
        throw new Error('Insufficient permissions to assign tasks');
      }

      // Verify assignee is team member
      const teamMembers = await this.teamService.getTeamMembers(projectId);
      const assignee = teamMembers.find(member => member.userId === assignedTo);
      
      if (!assignee) {
        throw new Error('Cannot assign task to user who is not a team member');
      }

      // Get project and phase/sprint details
      const projectResult = await query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];
      const phases: Phase[] = JSON.parse(project.phases || '[]');
      const phase = phases.find(p => p.id === phaseId);
      
      if (!phase) {
        throw new Error('Phase not found');
      }

      const sprint = phase.sprints.find(s => s.id === sprintId);
      
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      // Generate AI-powered task instructions
      const taskInstructions = await this.generateTaskInstructions(
        project,
        phase,
        sprint,
        assignedRole,
        assignee
      );

      // Create task assignment
      const taskAssignment: TaskAssignment = {
        id: this.generateTaskId(),
        projectId,
        phaseId,
        sprintId,
        assignedTo,
        assignedBy,
        assignedRole,
        status: 'assigned',
        priority: 'medium',
        estimatedHours: estimatedHours || this.estimateTaskHours(sprint, assignedRole),
        actualHours: 0,
        instructions: taskInstructions,
        dependencies: await this.calculateDependencies(projectId, phaseId, sprintId),
        dueDate: this.calculateDueDate(phase, sprint),
        assignedAt: new Date(),
        updatedAt: new Date(),
      };

      // Update sprint with assignment
      const updatedSprint: Sprint = {
        ...sprint,
        assignedTo,
        assignedRole,
        estimatedHours: taskAssignment.estimatedHours,
        status: 'in-progress',
      };

      // Update phase in project
      const updatedPhases = phases.map(p => 
        p.id === phaseId 
          ? {
              ...p,
              sprints: p.sprints.map(s => 
                s.id === sprintId ? updatedSprint : s
              )
            }
          : p
      );

      // Save to database
      await query(
        'UPDATE projects SET phases = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedPhases), projectId]
      );

      // Store task assignment details
      await query(`
        INSERT INTO task_assignments (
          id, project_id, phase_id, sprint_id, assigned_to, assigned_by, 
          assigned_role, status, priority, estimated_hours, instructions, 
          dependencies, due_date, assigned_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        taskAssignment.id,
        projectId,
        phaseId,
        sprintId,
        assignedTo,
        assignedBy,
        JSON.stringify(assignedRole),
        taskAssignment.status,
        taskAssignment.priority,
        taskAssignment.estimatedHours,
        JSON.stringify(taskAssignment.instructions),
        JSON.stringify(taskAssignment.dependencies),
        taskAssignment.dueDate,
        taskAssignment.assignedAt,
      ]);

      // Send notification to assignee
      await this.notificationService.sendTaskAssignmentNotification(
        taskAssignment,
        project,
        phase,
        sprint,
        assignee
      );

      // Audit log
      auditLog('ASSIGN_TASK', 'task', taskAssignment.id, assignedBy, {
        projectId,
        phaseId,
        sprintId,
        assignedTo,
        roleName: assignedRole.name,
      });

      return taskAssignment;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  // Update task assignment
  async updateTaskAssignment(
    taskId: string,
    updates: Partial<TaskAssignment>,
    updatedBy: string
  ): Promise<TaskAssignment> {
    try {
      // Get current assignment
      const result = await query(
        'SELECT * FROM task_assignments WHERE id = $1',
        [taskId]
      );

      if (result.rows.length === 0) {
        throw new Error('Task assignment not found');
      }

      const currentAssignment = result.rows[0];

      // Check permissions
      const canUpdate = await this.teamService.checkPermission(
        currentAssignment.project_id,
        updatedBy,
        'manage_tasks'
      );

      if (!canUpdate && currentAssignment.assigned_to !== updatedBy) {
        throw new Error('Insufficient permissions to update task');
      }

      // Update task assignment
      const updatedAssignment: TaskAssignment = {
        ...currentAssignment,
        ...updates,
        updatedAt: new Date(),
      };

      await query(`
        UPDATE task_assignments 
        SET status = $1, priority = $2, actual_hours = $3, 
            progress_notes = $4, updated_at = $5
        WHERE id = $6
      `, [
        updatedAssignment.status,
        updatedAssignment.priority,
        updatedAssignment.actualHours,
        JSON.stringify(updatedAssignment.progressNotes || []),
        updatedAssignment.updatedAt,
        taskId,
      ]);

      // Update sprint status if task is completed
      if (updates.status === 'completed') {
        await this.updateSprintStatus(
          currentAssignment.project_id,
          currentAssignment.phase_id,
          currentAssignment.sprint_id,
          'completed'
        );

        // Check for dependent tasks
        await this.notifyDependentTasks(taskId);
      }

      // Audit log
      auditLog('UPDATE_TASK', 'task', taskId, updatedBy, {
        updates: Object.keys(updates),
      });

      return updatedAssignment;
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  }

  // Get task assignments for a project
  async getProjectTasks(projectId: string): Promise<TaskAssignment[]> {
    try {
      const result = await query(`
        SELECT ta.*, u.name as assignee_name, u.email as assignee_email
        FROM task_assignments ta
        LEFT JOIN users u ON ta.assigned_to = u.id
        WHERE ta.project_id = $1
        ORDER BY ta.assigned_at DESC
      `, [projectId]);

      return result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        phaseId: row.phase_id,
        sprintId: row.sprint_id,
        assignedTo: row.assigned_to,
        assignedBy: row.assigned_by,
        assignedRole: JSON.parse(row.assigned_role),
        status: row.status,
        priority: row.priority,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        instructions: JSON.parse(row.instructions || '{}'),
        dependencies: JSON.parse(row.dependencies || '[]'),
        dueDate: row.due_date,
        assignedAt: row.assigned_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        progressNotes: JSON.parse(row.progress_notes || '[]'),
        assignee: {
          name: row.assignee_name,
          email: row.assignee_email,
        },
      }));
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  }

  // Get tasks assigned to a user
  async getUserTasks(userId: string): Promise<TaskAssignment[]> {
    try {
      const result = await query(`
        SELECT ta.*, p.name as project_name
        FROM task_assignments ta
        LEFT JOIN projects p ON ta.project_id = p.id
        WHERE ta.assigned_to = $1 AND ta.status != 'completed'
        ORDER BY ta.due_date ASC, ta.priority DESC
      `, [userId]);

      return result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        phaseId: row.phase_id,
        sprintId: row.sprint_id,
        assignedTo: row.assigned_to,
        assignedBy: row.assigned_by,
        assignedRole: JSON.parse(row.assigned_role),
        status: row.status,
        priority: row.priority,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        instructions: JSON.parse(row.instructions || '{}'),
        dependencies: JSON.parse(row.dependencies || '[]'),
        dueDate: row.due_date,
        assignedAt: row.assigned_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        progressNotes: JSON.parse(row.progress_notes || '[]'),
        project: {
          name: row.project_name,
        },
      }));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  // Generate AI-powered task instructions
  private async generateTaskInstructions(
    project: any,
    phase: Phase,
    sprint: Sprint,
    role: DynamicRole,
    assignee: TeamMember
  ): Promise<TaskInstruction> {
    try {
      const context = {
        projectName: project.name,
        projectRequirements: project.requirements,
        projectConstraints: project.constraints,
        phaseName: phase.name,
        phaseDescription: phase.description,
        sprintName: sprint.name,
        sprintDescription: sprint.description,
        sprintDeliverables: sprint.deliverables,
        roleName: role.name,
        roleResponsibilities: role.responsibilities,
        assigneeName: assignee.user?.name,
        assigneeExperience: role.discipline,
      };

      const prompt = `
Generate detailed task instructions for the following assignment:

Project: ${context.projectName}
Phase: ${context.phaseName} - ${context.phaseDescription}
Sprint: ${context.sprintName} - ${context.sprintDescription}
Role: ${context.roleName}
Assignee: ${context.assigneeName}

Requirements:
${context.projectRequirements}

Constraints:
${context.projectConstraints}

Sprint Deliverables:
${context.sprintDeliverables.join(', ')}

Role Responsibilities:
${context.roleResponsibilities.join(', ')}

Please provide:
1. Clear, actionable instructions
2. Specific acceptance criteria
3. Recommended approach and methodology
4. Key resources and references
5. Potential risks and mitigation strategies
6. Quality checkpoints
7. Estimated timeline breakdown

Format the response as detailed instructions that will help the assignee complete the task successfully.
      `;

      const aiResponse = await this.aiService.generateContent(
        prompt,
        {
          projectName: context.projectName,
          disciplines: [role.discipline],
          requirements: context.projectRequirements,
          constraints: context.projectConstraints,
          developmentMode: project.development_mode || 'full',
          previousPhaseOutputs: [],
          currentPhase: phase.name,
          sprintContext: sprint.description,
          teamContext: { 
            members: [],
            roles: [],
            currentPhase: '',
            assignee: context.assigneeName 
          },
          organizationContext: {
            id: 'default',
            name: 'Default Organization',
            industry: 'Technology',
            size: 'medium' as const,
            complianceRequirements: [],
            customTerminology: {}
          },
        },
        phase.tuningSettings || {}
      );

      return {
        id: this.generateInstructionId(),
        taskId: '', // Will be set by caller
        title: `Instructions for ${sprint.name}`,
        content: aiResponse.content,
        methodology: this.extractMethodology(aiResponse.content),
        acceptanceCriteria: this.extractAcceptanceCriteria(aiResponse.content),
        resources: this.extractResources(aiResponse.content),
        risks: this.extractRisks(aiResponse.content),
        checkpoints: this.extractCheckpoints(aiResponse.content),
        estimatedTimeline: this.extractTimeline(aiResponse.content),
        generatedAt: new Date(),
        generatedBy: 'ai',
        confidence: aiResponse.confidence || 0.8,
      };
    } catch (error) {
      console.error('Error generating task instructions:', error);
      
      // Fallback to basic instructions
      return {
        id: this.generateInstructionId(),
        taskId: '',
        title: `Instructions for ${sprint.name}`,
        content: `Complete the following deliverables for ${sprint.name}:\n\n${sprint.deliverables.map(d => `- ${d}`).join('\n')}`,
        methodology: 'Follow standard engineering practices',
        acceptanceCriteria: sprint.deliverables,
        resources: [],
        risks: [],
        checkpoints: ['Mid-point review', 'Final review'],
        estimatedTimeline: 'As estimated',
        generatedAt: new Date(),
        generatedBy: 'fallback',
        confidence: 0.5,
      };
    }
  }

  // Calculate task dependencies
  private async calculateDependencies(
    projectId: string,
    phaseId: string,
    sprintId: string
  ): Promise<TaskDependency[]> {
    try {
      // Get all tasks in the project
      const tasks = await this.getProjectTasks(projectId);
      
      // Simple dependency logic: tasks in earlier phases are dependencies
      const dependencies: TaskDependency[] = [];
      
      for (const task of tasks) {
        if (task.phaseId !== phaseId && task.status !== 'completed') {
          dependencies.push({
            id: this.generateDependencyId(),
            dependentTaskId: '', // Will be set by caller
            dependsOnTaskId: task.id,
            dependencyType: 'finish-to-start',
            isBlocking: true,
            createdAt: new Date(),
          });
        }
      }

      return dependencies;
    } catch (error) {
      console.error('Error calculating dependencies:', error);
      return [];
    }
  }

  // Calculate due date based on phase and sprint
  private calculateDueDate(phase: Phase, sprint: Sprint): Date {
    const now = new Date();
    const daysToAdd = 7; // Default 1 week
    
    // TODO: Implement more sophisticated due date calculation
    // based on project timeline, phase duration, etc.
    
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + daysToAdd);
    
    return dueDate;
  }

  // Estimate task hours based on sprint and role
  private estimateTaskHours(sprint: Sprint, role: DynamicRole): number {
    // Simple estimation based on deliverables count and role complexity
    const baseHours = sprint.deliverables.length * 4; // 4 hours per deliverable
    const roleMultiplier = role.accessLevel === 'admin' ? 1.5 : 1.0;
    
    return Math.round(baseHours * roleMultiplier);
  }

  // Update sprint status
  private async updateSprintStatus(
    projectId: string,
    phaseId: string,
    sprintId: string,
    status: string
  ): Promise<void> {
    try {
      const projectResult = await query(
        'SELECT phases FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) return;

      const phases: Phase[] = JSON.parse(projectResult.rows[0].phases || '[]');
      const updatedPhases = phases.map(phase => 
        phase.id === phaseId 
          ? {
              ...phase,
              sprints: phase.sprints.map(sprint =>
                sprint.id === sprintId ? { ...sprint, status } : sprint
              )
            }
          : phase
      );

      await query(
        'UPDATE projects SET phases = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedPhases), projectId]
      );
    } catch (error) {
      console.error('Error updating sprint status:', error);
    }
  }

  // Notify dependent tasks when a task is completed
  private async notifyDependentTasks(completedTaskId: string): Promise<void> {
    try {
      const dependentTasks = await query(`
        SELECT ta.*, u.email as assignee_email
        FROM task_assignments ta
        LEFT JOIN users u ON ta.assigned_to = u.id
        WHERE JSON_EXTRACT(ta.dependencies, '$[*].dependsOnTaskId') LIKE '%${completedTaskId}%'
        AND ta.status = 'blocked'
      `, []);

      for (const task of dependentTasks.rows) {
        // Update task status to assigned
        await query(
          'UPDATE task_assignments SET status = $1 WHERE id = $2',
          ['assigned', task.id]
        );

        // Send notification
        await this.notificationService.sendTaskUnblockedNotification(
          task,
          completedTaskId
        );
      }
    } catch (error) {
      console.error('Error notifying dependent tasks:', error);
    }
  }

  // Helper methods for extracting information from AI-generated content
  private extractMethodology(content: string): string {
    const methodologyMatch = content.match(/methodology[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return methodologyMatch ? methodologyMatch[1].trim() : 'Follow standard practices';
  }

  private extractAcceptanceCriteria(content: string): string[] {
    const criteriaMatch = content.match(/acceptance criteria[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (criteriaMatch) {
      return criteriaMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  private extractResources(content: string): string[] {
    const resourcesMatch = content.match(/resources[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (resourcesMatch) {
      return resourcesMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  private extractRisks(content: string): string[] {
    const risksMatch = content.match(/risks[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (risksMatch) {
      return risksMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  private extractCheckpoints(content: string): string[] {
    const checkpointsMatch = content.match(/checkpoints[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (checkpointsMatch) {
      return checkpointsMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return ['Mid-point review', 'Final review'];
  }

  private extractTimeline(content: string): string {
    const timelineMatch = content.match(/timeline[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return timelineMatch ? timelineMatch[1].trim() : 'As estimated';
  }

  // ID generators
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInstructionId(): string {
    return `instr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDependencyId(): string {
    return `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}