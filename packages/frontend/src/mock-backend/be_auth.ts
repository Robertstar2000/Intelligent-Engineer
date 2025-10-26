// Mock Backend - Authentication Service
import { mockStore } from './be_store';

// Mock users store
const mockUsers = JSON.parse(localStorage.getItem('be_users') || '[]');

// Initialize with a default user if empty
if (mockUsers.length === 0) {
  mockUsers.push({
    id: 'user-1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'demo123', // In real app, this would be hashed
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('be_users', JSON.stringify(mockUsers));
}

export const authService = {
  async login(email: string, password: string) {
    const user = mockUsers.find((u: any) => u.email === email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    if (user.password !== password) {
      throw new Error('Invalid email or password');
    }
    
    const token = `mock-token-${Date.now()}`;
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      token,
      user: userWithoutPassword,
    };
  },

  async register(name: string, email: string, password: string) {
    const existingUser = mockUsers.find((u: any) => u.email === email);
    
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password, // In real app, this would be hashed
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    localStorage.setItem('be_users', JSON.stringify(mockUsers));
    
    const token = `mock-token-${Date.now()}`;
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      token,
      user: userWithoutPassword,
    };
  },

  async me(token: string) {
    // In mock, we'll just return the first user or demo user
    const user = mockUsers[0] || {
      id: 'user-1',
      name: 'Demo User',
      email: 'demo@example.com',
    };
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};
