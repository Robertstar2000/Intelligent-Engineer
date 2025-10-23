import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../../services/ProjectService';
import { mockDatabase, mockProject } from '../mocks/services';

// Mock the database
vi.mock('../../database', () => ({
  db: mockDatabase,
}));

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    projectService = new ProjectService();
  });

  describe('createProject', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
        organizationId: 'org-123',
      };

      const result = await projectService.createProject(projectData, 'user-123');
      
      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.disciplines).toEqual(projectData.disciplines);
      expect(result.phases).toBeDefined();
      expect(result.phases.length).toBeGreaterThan(0);
    });

    it('should throw error when name is missing', async () => {
      const projectData = {
        name: '',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
      };

      await expect(
        projectService.createProject(projectData, 'user-123')
      ).rejects.toThrow();
    });

    it('should throw error when disciplines array is empty', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: [],
        developmentMode: 'full' as const,
      };

      await expect(
        projectService.createProject(projectData, 'user-123')
      ).rejects.toThrow();
    });
  });

  describe('getProject', () => {
    it('should retrieve an existing project', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
      };

      const created = await projectService.createProject(projectData, 'user-123');
      const retrieved = await projectService.getProject(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        projectService.getProject('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('updateProject', () => {
    it('should update project properties', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
      };

      const created = await projectService.createProject(projectData, 'user-123');
      const updated = await projectService.updateProject(created.id, {
        name: 'Updated Project Name',
      });

      expect(updated.name).toBe('Updated Project Name');
      expect(updated.id).toBe(created.id);
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
      };

      const created = await projectService.createProject(projectData, 'user-123');
      await projectService.deleteProject(created.id);

      await expect(
        projectService.getProject(created.id)
      ).rejects.toThrow();
    });
  });

  describe('listProjects', () => {
    it('should list all projects for a user', async () => {
      const userId = 'user-123';
      
      await projectService.createProject({
        name: 'Project 1',
        requirements: 'Requirements 1',
        constraints: 'Constraints 1',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full' as const,
      }, userId);

      await projectService.createProject({
        name: 'Project 2',
        requirements: 'Requirements 2',
        constraints: 'Constraints 2',
        disciplines: ['Electrical Engineering'],
        developmentMode: 'rapid' as const,
      }, userId);

      const projects = await projectService.listProjects(userId);

      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
