// API utility for making requests to the backend
import { mockBackendAPI } from '../mock-backend/be_api';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const USE_MOCK_DATA = !API_BASE_URL || API_BASE_URL === '';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // If using mock data, use mock backend
    if (USE_MOCK_DATA) {
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body as string) : null;
      return mockBackendAPI(endpoint, method, body) as Promise<T>;
    }

    const { requiresAuth = true, ...fetchOptions } = options;
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        // Get error message from response
        const error = await response.json().catch(() => ({ message: null }));
        
        // Provide user-friendly error messages based on status code
        let errorMessage = error.message;
        
        if (!errorMessage) {
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check your input and try again.';
              break;
            case 401:
              errorMessage = 'Your session has expired. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 409:
              errorMessage = 'This email address is already registered. Please log in or use a different email.';
              break;
            case 422:
              errorMessage = 'The information provided is invalid. Please check and try again.';
              break;
            case 429:
              errorMessage = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
              errorMessage = 'A server error occurred. Please try again later.';
              break;
            case 502:
              errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
              break;
            case 503:
              errorMessage = 'Service is currently under maintenance. Please try again later.';
              break;
            default:
              errorMessage = 'An unexpected error occurred. Please try again.';
          }
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      // If fetch fails, fall back to mock data
      console.warn('API request failed, using mock backend:', error);
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body as string) : null;
      return mockBackendAPI(endpoint, method, body) as Promise<T>;
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    return api.post<{ token: string; user: any }>('/auth/login', { email, password }, { requiresAuth: false });
  },

  async register(name: string, email: string, password: string) {
    return api.post<{ token: string; user: any }>('/auth/register', { name, email, password }, { requiresAuth: false });
  },

  async me() {
    return api.get<any>('/auth/me');
  },
};

// Projects API
export const projectsApi = {
  async list() {
    return api.get<any[]>('/projects');
  },

  async get(projectId: string) {
    return api.get<any>(`/projects/${projectId}`);
  },

  async create(data: any) {
    return api.post<any>('/projects', data);
  },

  async update(projectId: string, data: any) {
    return api.put<any>(`/projects/${projectId}`, data);
  },

  async delete(projectId: string) {
    return api.delete<any>(`/projects/${projectId}`);
  },

  async updatePhase(projectId: string, phaseId: string, data: any) {
    return api.put<any>(`/projects/${projectId}/phases/${phaseId}`, data);
  },

  async generatePhase(projectId: string, phaseId: string, data: any) {
    return api.post<any>(`/projects/${projectId}/phases/${phaseId}/generate`, data);
  },

  async generateSprint(projectId: string, phaseId: string, sprintId: string, data: any) {
    return api.post<any>(`/projects/${projectId}/phases/${phaseId}/sprints/${sprintId}/generate`, data);
  },

  async getAnalytics(projectId: string, range?: string) {
    const params = range ? `?range=${range}` : '';
    return api.get<any>(`/projects/${projectId}/analytics${params}`);
  },

  async assessRisks(projectId: string, data: any) {
    return api.post<any>(`/projects/${projectId}/risks/assess`, data);
  },

  async exportProject(projectId: string, data: any) {
    return api.post<any>(`/projects/${projectId}/export`, data);
  },
};

// Templates API
export const templatesApi = {
  async list() {
    return api.get<any[]>('/templates');
  },

  async generate(data: any) {
    return api.post<any>('/templates/generate', data);
  },
};

// Team API
export const teamApi = {
  async getMembers(projectId: string) {
    return api.get<any[]>(`/team/${projectId}/members`);
  },

  async getActiveUsers(projectId: string) {
    return api.get<any[]>(`/team/${projectId}/active`);
  },

  async inviteMember(projectId: string, data: any) {
    return api.post<any>(`/team/${projectId}/invite`, data);
  },

  async updateMemberRole(projectId: string, memberId: string, data: any) {
    return api.put<any>(`/team/${projectId}/members/${memberId}/role`, data);
  },

  async removeMember(projectId: string, memberId: string) {
    return api.delete<any>(`/team/${projectId}/members/${memberId}`);
  },
};

// Tasks API
export const tasksApi = {
  async getProjectTasks(projectId: string) {
    return api.get<any[]>(`/tasks/project/${projectId}`);
  },

  async assignTask(data: any) {
    return api.post<any>('/tasks/assign', data);
  },

  async updateTask(taskId: string, data: any) {
    return api.put<any>(`/tasks/${taskId}`, data);
  },
};

// AI API
export const aiApi = {
  async getProfiles() {
    return api.get<any[]>('/ai/profiles');
  },

  async createProfile(data: any) {
    return api.post<any>('/ai/profiles', data);
  },

  async updateProfile(profileId: string, data: any) {
    return api.put<any>(`/ai/profiles/${profileId}`, data);
  },

  async deleteProfile(profileId: string) {
    return api.delete<any>(`/ai/profiles/${profileId}`);
  },

  async queryProject(projectId: string, data: any) {
    return api.post<any>(`/projects/${projectId}/query`, data);
  },
};

// Analytics API
export const analyticsApi = {
  async getComparative() {
    return api.get<any>('/analytics/comparative');
  },

  async generateReport(reportType: string, projectId: string, data: any) {
    return api.post<any>(`/reports/${reportType}/${projectId}`, data);
  },
};
