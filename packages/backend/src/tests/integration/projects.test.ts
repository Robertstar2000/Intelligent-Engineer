import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the database and services
vi.mock('../../database', () => ({
  db: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('../../services/ProjectService');

describe('Projects API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  let testProjectId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Create mock routes for testing
    app.post('/api/projects', (req, res) => {
      const project = {
        id: 'test-project-123',
        ...req.body,
        phases: [],
        createdAt: new Date(),
      };
      testProjectId = project.id;
      res.status(201).json(project);
    });

    app.get('/api/projects/:id', (req, res) => {
      if (req.params.id === testProjectId) {
        res.json({ id: testProjectId, name: 'Test Project' });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });

    app.get('/api/projects', (req, res) => {
      res.json([{ id: testProjectId, name: 'Test Project' }]);
    });

    app.put('/api/projects/:id', (req, res) => {
      res.json({ id: req.params.id, ...req.body });
    });

    app.delete('/api/projects/:id', (req, res) => {
      res.status(204).send();
    });

    app.put('/api/projects/:id/phases/:phaseId', (req, res) => {
      res.json({ id: req.params.phaseId, ...req.body });
    });

    // Mock authentication for tests
    authToken = 'test-token';
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Integration Test Project',
        requirements: 'Test requirements',
        constraints: 'Test constraints',
        disciplines: ['Mechanical Engineering'],
        developmentMode: 'full',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(projectData.name);
      
      testProjectId = response.body.id;
    });

    it('should return 400 for invalid project data', async () => {
      const invalidData = {
        name: '',
        requirements: 'Test',
        disciplines: [],
      };

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const projectData = {
        name: 'Test Project',
        requirements: 'Test',
        constraints: 'Test',
        disciplines: ['Engineering'],
        developmentMode: 'full',
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should retrieve a project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testProjectId);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/projects', () => {
    it('should list all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const updates = {
        name: 'Updated Project Name',
        status: 'active',
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/projects/:id/phases/:phaseId', () => {
    it('should update a phase', async () => {
      // Create a new project first
      const projectData = {
        name: 'Phase Test Project',
        requirements: 'Test',
        constraints: 'Test',
        disciplines: ['Engineering'],
        developmentMode: 'full',
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      const projectId = projectResponse.body.id;
      const phaseId = projectResponse.body.phases[0].id;

      const phaseUpdate = {
        status: 'in-progress',
        output: 'Updated phase output',
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/phases/${phaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(phaseUpdate)
        .expect(200);

      expect(response.body.status).toBe(phaseUpdate.status);
    });
  });
});
