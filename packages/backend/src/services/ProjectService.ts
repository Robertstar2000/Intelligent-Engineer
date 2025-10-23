import { ProjectRepository } from '../database/repositories/ProjectRepository';
import { Project, ProjectStatus, ProgramScale } from '@shared/types';
import { auditLog } from '../middleware/logging';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  // Create a new project (maintaining existing functionality)
  async createProject(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Project> {
    // Ensure the user is set as the creator
    const enhancedProjectData = {
      ...projectData,
      createdBy: userId,
      status: 'active' as ProjectStatus,
    };

    const project = await this.projectRepository.create(enhancedProjectData);
    
    // Audit log
    auditLog('CREATE_PROJECT', 'project', project.id, userId, {
      projectName: project.name,
      disciplines: project.disciplines,
    });

    return project;
  }

  // Get project by ID with access control
  async getProject(projectId: string, userId: string): Promise<Project | null> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      return null;
    }

    // Check if user has access to this project
    const hasAccess = await this.checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      throw new Error('Access denied to this project');
    }

    return project;
  }

  // Get all projects for a user
  async getUserProjects(userId: string): Promise<Project[]> {
    return this.projectRepository.findByUserId(userId);
  }

  // Update project (preserving existing functionality)
  async updateProject(
    projectId: string,
    updates: Partial<Project>,
    userId: string
  ): Promise<Project | null> {
    // Check access
    const hasAccess = await this.checkProjectAccess(projectId, userId, 'write');
    if (!hasAccess) {
      throw new Error('Access denied to update this project');
    }

    const updatedProject = await this.projectRepository.update(projectId, updates);
    
    if (updatedProject) {
      auditLog('UPDATE_PROJECT', 'project', projectId, userId, {
        updatedFields: Object.keys(updates),
      });
    }

    return updatedProject;
  }

  // Delete project
  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    // Check if user is the project owner
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.createdBy !== userId) {
      throw new Error('Only project owners can delete projects');
    }

    const deleted = await this.projectRepository.delete(projectId);
    
    if (deleted) {
      auditLog('DELETE_PROJECT', 'project', projectId, userId, {
        projectName: project.name,
      });
    }

    return deleted;
  }

  // Add team member to project
  async addTeamMember(
    projectId: string,
    memberUserId: string,
    role: any,
    requestingUserId: string
  ): Promise<void> {
    // Check if requesting user has admin access
    const hasAccess = await this.checkProjectAccess(projectId, requestingUserId, 'admin');
    if (!hasAccess) {
      throw new Error('Admin access required to add team members');
    }

    await this.projectRepository.addTeamMember(projectId, memberUserId, role);
    
    auditLog('ADD_TEAM_MEMBER', 'project', projectId, requestingUserId, {
      addedUserId: memberUserId,
      role: role.name,
    });
  }

  // Remove team member from project
  async removeTeamMember(
    projectId: string,
    memberUserId: string,
    requestingUserId: string
  ): Promise<void> {
    // Check if requesting user has admin access
    const hasAccess = await this.checkProjectAccess(projectId, requestingUserId, 'admin');
    if (!hasAccess) {
      throw new Error('Admin access required to remove team members');
    }

    await this.projectRepository.removeTeamMember(projectId, memberUserId);
    
    auditLog('REMOVE_TEAM_MEMBER', 'project', projectId, requestingUserId, {
      removedUserId: memberUserId,
    });
  }

  // Update project phase (preserving existing functionality)
  async updatePhase(
    projectId: string,
    phaseId: string,
    phaseUpdates: any,
    userId: string
  ): Promise<Project | null> {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      return null;
    }

    // Find and update the specific phase
    const updatedPhases = project.phases.map(phase => 
      phase.id === phaseId ? { ...phase, ...phaseUpdates } : phase
    );

    const updatedProject = await this.updateProject(
      projectId,
      { phases: updatedPhases },
      userId
    );

    if (updatedProject) {
      auditLog('UPDATE_PHASE', 'phase', phaseId, userId, {
        projectId,
        phaseName: phaseUpdates.name || 'Unknown',
        updatedFields: Object.keys(phaseUpdates),
      });
    }

    return updatedProject;
  }

  // Update sprint within a phase (preserving existing functionality)
  async updateSprint(
    projectId: string,
    phaseId: string,
    sprintId: string,
    sprintUpdates: any,
    userId: string
  ): Promise<Project | null> {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      return null;
    }

    // Find and update the specific sprint
    const updatedPhases = project.phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedSprints = phase.sprints.map(sprint =>
          sprint.id === sprintId ? { ...sprint, ...sprintUpdates } : sprint
        );
        return { ...phase, sprints: updatedSprints };
      }
      return phase;
    });

    const updatedProject = await this.updateProject(
      projectId,
      { phases: updatedPhases },
      userId
    );

    if (updatedProject) {
      auditLog('UPDATE_SPRINT', 'sprint', sprintId, userId, {
        projectId,
        phaseId,
        sprintName: sprintUpdates.name || 'Unknown',
        updatedFields: Object.keys(sprintUpdates),
      });
    }

    return updatedProject;
  }

  // Migration helper: Import from localStorage
  async migrateFromLocalStorage(
    localStorageData: any,
    userId: string
  ): Promise<Project> {
    const project = await this.projectRepository.migrateFromLocalStorage(
      localStorageData,
      userId
    );

    auditLog('MIGRATE_PROJECT', 'project', project.id, userId, {
      source: 'localStorage',
      projectName: project.name,
    });

    return project;
  }

  // Helper method to check project access
  private async checkProjectAccess(
    projectId: string,
    userId: string,
    permission: 'read' | 'write' | 'admin' = 'read'
  ): Promise<boolean> {
    const project = await this.projectRepository.findById(projectId);
    
    if (!project) {
      return false;
    }

    // Project creator has full access
    if (project.createdBy === userId) {
      return true;
    }

    // Check team member access
    const teamMember = project.team.find(member => member.userId === userId);
    if (!teamMember || !teamMember.isActive) {
      return false;
    }

    // Check permissions based on role
    const userPermissions = teamMember.permissions || [];
    return userPermissions.some((perm: any) => 
      perm.action === permission || perm.action === 'admin'
    );
  }
}