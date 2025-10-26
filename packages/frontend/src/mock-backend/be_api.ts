// Mock Backend API Router
// This file routes API requests to the appropriate service

import { projectsService } from './be_projects';
import { templatesService } from './be_templates';
import { aiService } from './be_ai';
import { teamService } from './be_team';
import { analyticsService } from './be_analytics';
import { authService } from './be_auth';
import { simulateDelay } from './be_utils';

export const mockBackendAPI = async (endpoint: string, method: string, body: any): Promise<any> => {
  // Simulate network delay
  await simulateDelay(300);

  try {
    // Auth endpoints
    if (endpoint.startsWith('/auth')) {
      return handleAuthEndpoint(endpoint, method, body);
    }

    // Projects endpoints
    if (endpoint.startsWith('/projects')) {
      return handleProjectsEndpoint(endpoint, method, body);
    }

    // Templates endpoints
    if (endpoint.startsWith('/templates')) {
      return handleTemplatesEndpoint(endpoint, method, body);
    }

    // AI endpoints
    if (endpoint.startsWith('/ai')) {
      return handleAIEndpoint(endpoint, method, body);
    }

    // Team endpoints
    if (endpoint.startsWith('/team')) {
      return handleTeamEndpoint(endpoint, method, body);
    }

    // Analytics endpoints
    if (endpoint.startsWith('/analytics') || endpoint.startsWith('/reports')) {
      return handleAnalyticsEndpoint(endpoint, method, body);
    }

    // Tasks endpoints
    if (endpoint.startsWith('/tasks')) {
      return handleTasksEndpoint(endpoint, method, body);
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  } catch (error: any) {
    console.error('Mock backend error:', error);
    throw error;
  }
};

function handleAuthEndpoint(endpoint: string, method: string, body: any) {
  // POST /auth/login
  if (method === 'POST' && endpoint === '/auth/login') {
    return authService.login(body.email, body.password);
  }

  // POST /auth/register
  if (method === 'POST' && endpoint === '/auth/register') {
    return authService.register(body.name, body.email, body.password);
  }

  // GET /auth/me
  if (method === 'GET' && endpoint === '/auth/me') {
    const token = localStorage.getItem('token') || '';
    return authService.me(token);
  }

  throw new Error(`Auth endpoint not implemented: ${method} ${endpoint}`);
}

function handleProjectsEndpoint(endpoint: string, method: string, body: any) {
  // GET /projects
  if (method === 'GET' && endpoint === '/projects') {
    return projectsService.list();
  }

  // POST /projects
  if (method === 'POST' && endpoint === '/projects') {
    return projectsService.create(body);
  }

  // GET /projects/:id
  if (method === 'GET' && endpoint.match(/^\/projects\/[^/]+$/)) {
    const projectId = endpoint.split('/')[2];
    return projectsService.get(projectId);
  }

  // PUT /projects/:id
  if (method === 'PUT' && endpoint.match(/^\/projects\/[^/]+$/)) {
    const projectId = endpoint.split('/')[2];
    return projectsService.update(projectId, body);
  }

  // DELETE /projects/:id
  if (method === 'DELETE' && endpoint.match(/^\/projects\/[^/]+$/)) {
    const projectId = endpoint.split('/')[2];
    return projectsService.delete(projectId);
  }

  // PUT /projects/:id/phases/:phaseId
  if (method === 'PUT' && endpoint.match(/^\/projects\/[^/]+\/phases\/[^/]+$/)) {
    const [, , projectId, , phaseId] = endpoint.split('/');
    return projectsService.updatePhase(projectId, phaseId, body);
  }

  // POST /projects/:id/phases/:phaseId/generate
  if (method === 'POST' && endpoint.includes('/phases/') && endpoint.includes('/generate')) {
    const [, , projectId, , phaseId] = endpoint.split('/');
    return projectsService.generatePhase(projectId, phaseId, body);
  }

  // POST /projects/:id/risks/assess
  if (method === 'POST' && endpoint.includes('/risks/assess')) {
    const projectId = endpoint.split('/')[2];
    return projectsService.assessRisks(projectId, body);
  }

  // POST /projects/:id/export
  if (method === 'POST' && endpoint.includes('/export')) {
    const projectId = endpoint.split('/')[2];
    return projectsService.exportProject(projectId, body);
  }

  // GET /projects/:id/analytics
  if (method === 'GET' && endpoint.includes('/analytics')) {
    const projectId = endpoint.split('/')[2];
    const range = endpoint.includes('?') ? endpoint.split('?')[1].split('=')[1] : undefined;
    return projectsService.getAnalytics(projectId, range);
  }

  throw new Error(`Projects endpoint not implemented: ${method} ${endpoint}`);
}

function handleTemplatesEndpoint(endpoint: string, method: string, body: any) {
  // GET /templates
  if (method === 'GET' && endpoint === '/templates') {
    return templatesService.list();
  }

  // POST /templates/generate
  if (method === 'POST' && endpoint === '/templates/generate') {
    return templatesService.generate(body);
  }

  // GET /templates/:id
  if (method === 'GET' && endpoint.match(/^\/templates\/[^/]+$/)) {
    const templateId = endpoint.split('/')[2];
    return templatesService.get(templateId);
  }

  // PUT /templates/:id
  if (method === 'PUT' && endpoint.match(/^\/templates\/[^/]+$/)) {
    const templateId = endpoint.split('/')[2];
    return templatesService.update(templateId, body);
  }

  // DELETE /templates/:id
  if (method === 'DELETE' && endpoint.match(/^\/templates\/[^/]+$/)) {
    const templateId = endpoint.split('/')[2];
    return templatesService.delete(templateId);
  }

  throw new Error(`Templates endpoint not implemented: ${method} ${endpoint}`);
}

function handleAIEndpoint(endpoint: string, method: string, body: any) {
  // GET /ai/profiles
  if (method === 'GET' && endpoint === '/ai/profiles') {
    return aiService.getProfiles();
  }

  // POST /ai/profiles
  if (method === 'POST' && endpoint === '/ai/profiles') {
    return aiService.createProfile(body);
  }

  // GET /ai/profiles/:id
  if (method === 'GET' && endpoint.match(/^\/ai\/profiles\/[^/]+$/)) {
    const profileId = endpoint.split('/')[3];
    return aiService.getProfile(profileId);
  }

  // PUT /ai/profiles/:id
  if (method === 'PUT' && endpoint.match(/^\/ai\/profiles\/[^/]+$/)) {
    const profileId = endpoint.split('/')[3];
    return aiService.updateProfile(profileId, body);
  }

  // DELETE /ai/profiles/:id
  if (method === 'DELETE' && endpoint.match(/^\/ai\/profiles\/[^/]+$/)) {
    const profileId = endpoint.split('/')[3];
    return aiService.deleteProfile(profileId);
  }

  // POST /projects/:id/query
  if (method === 'POST' && endpoint.includes('/query')) {
    const projectId = endpoint.split('/')[2];
    return aiService.queryProject(projectId, body);
  }

  throw new Error(`AI endpoint not implemented: ${method} ${endpoint}`);
}

function handleTeamEndpoint(endpoint: string, method: string, body: any) {
  const projectId = endpoint.split('/')[2];

  // GET /team/:projectId/members
  if (method === 'GET' && endpoint.includes('/members')) {
    return teamService.getMembers(projectId);
  }

  // GET /team/:projectId/active
  if (method === 'GET' && endpoint.includes('/active')) {
    return teamService.getActiveUsers(projectId);
  }

  // POST /team/:projectId/invite
  if (method === 'POST' && endpoint.includes('/invite')) {
    return teamService.inviteMember(projectId, body);
  }

  // PUT /team/:projectId/members/:memberId/role
  if (method === 'PUT' && endpoint.includes('/members/') && endpoint.includes('/role')) {
    const memberId = endpoint.split('/')[4];
    return teamService.updateMemberRole(projectId, memberId, body);
  }

  // DELETE /team/:projectId/members/:memberId
  if (method === 'DELETE' && endpoint.match(/\/members\/[^/]+$/)) {
    const memberId = endpoint.split('/')[4];
    return teamService.removeMember(projectId, memberId);
  }

  throw new Error(`Team endpoint not implemented: ${method} ${endpoint}`);
}

function handleAnalyticsEndpoint(endpoint: string, method: string, body: any) {
  // GET /analytics/comparative
  if (method === 'GET' && endpoint === '/analytics/comparative') {
    return analyticsService.getComparative();
  }

  // POST /reports/:type/:projectId
  if (method === 'POST' && endpoint.startsWith('/reports/')) {
    const [, , reportType, projectId] = endpoint.split('/');
    return analyticsService.generateReport(reportType, projectId, body);
  }

  // GET /analytics/projects/:projectId
  if (method === 'GET' && endpoint.includes('/projects/')) {
    const projectId = endpoint.split('/')[3];
    return analyticsService.getProjectMetrics(projectId);
  }

  throw new Error(`Analytics endpoint not implemented: ${method} ${endpoint}`);
}

function handleTasksEndpoint(endpoint: string, method: string, body: any) {
  // Mock tasks - implement as needed
  if (method === 'GET' && endpoint.includes('/project/')) {
    return [];
  }

  if (method === 'POST' && endpoint === '/tasks/assign') {
    return { success: true, taskId: `task-${Date.now()}` };
  }

  throw new Error(`Tasks endpoint not implemented: ${method} ${endpoint}`);
}
