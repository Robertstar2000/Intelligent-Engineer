// API utility for making requests to the backend
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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
};
