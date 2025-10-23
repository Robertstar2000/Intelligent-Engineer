import { vi } from 'vitest';

// Mock database
export const mockDatabase = {
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
};

// Mock Redis
export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

// Mock AI responses
export const mockAIResponses = {
  generatePhaseContent: 'Generated phase content with detailed analysis and recommendations.',
  generateSprintContent: 'Generated sprint content with specific deliverables and tasks.',
  analyzeRequirements: {
    keyRequirements: ['High performance', 'Scalability', 'Security'],
    suggestedPhases: ['Requirements', 'Design', 'Implementation', 'Testing'],
    estimatedComplexity: 'medium',
  },
  generateDesignRecommendations: [
    'Use modular architecture for better maintainability',
    'Implement caching for improved performance',
    'Follow security best practices',
  ],
};

// Mock project data
export const mockProject = {
  id: 'test-project-123',
  name: 'Test Project',
  requirements: 'Build a high-performance system',
  constraints: 'Budget: $100k, Timeline: 6 months',
  disciplines: ['Mechanical Engineering'],
  developmentMode: 'full' as const,
  currentPhase: 0,
  phases: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'active' as const,
  team: [],
  dynamicRoles: [],
  complianceRequirements: [],
  auditTrail: [],
  integrations: [],
  cadConnections: [],
  simulationConnections: [],
};

// Mock template data
export const mockTemplate = {
  id: 'template-123',
  name: 'Test Template',
  description: 'Test template description',
  version: '1.0.0',
  disciplines: ['Mechanical Engineering'],
  developmentMode: 'full' as const,
  phases: [],
  dynamicRoles: [],
  complianceFrameworks: [],
  aiProfiles: [],
  integrationRequirements: [],
  isBuiltIn: false,
  isCustom: true,
  usage: {
    timesUsed: 0,
    lastUsed: new Date(),
    averageRating: 0,
    feedback: [],
  },
  createdAt: new Date(),
};
