// Mock Backend Data Store
// This file simulates a backend database

export interface MockStore {
  projects: any[];
  templates: any[];
  aiProfiles: any[];
  teamMembers: Record<string, any[]>;
  tasks: any[];
  analytics: any;
}

// Initialize store from localStorage or create new
const initializeStore = (): MockStore => {
  const stored = {
    projects: JSON.parse(localStorage.getItem('be_projects') || '[]'),
    templates: JSON.parse(localStorage.getItem('be_templates') || '[]'),
    aiProfiles: JSON.parse(localStorage.getItem('be_ai_profiles') || '[]'),
    teamMembers: JSON.parse(localStorage.getItem('be_team_members') || '{}'),
    tasks: JSON.parse(localStorage.getItem('be_tasks') || '[]'),
    analytics: JSON.parse(localStorage.getItem('be_analytics') || 'null'),
  };

  // Initialize default templates if empty
  if (stored.templates.length === 0) {
    stored.templates = [
      {
        id: 'template-1',
        name: 'Web Application',
        description: 'Full-stack web application template with modern architecture',
        disciplines: ['Software Engineering', 'UI/UX Design'],
        phases: [
          { name: 'Requirements', sprints: ['User Stories', 'Technical Specs'] },
          { name: 'Design', sprints: ['Architecture', 'UI Design'] },
          { name: 'Development', sprints: ['Frontend', 'Backend', 'Integration'] },
          { name: 'Testing', sprints: ['Unit Tests', 'Integration Tests'] },
          { name: 'Deployment', sprints: ['Production Setup', 'Launch'] },
        ],
        isBuiltIn: true,
        usage: { timesUsed: 45, lastUsed: new Date(), averageRating: 4.5, feedback: [] },
        createdAt: new Date(),
      },
      {
        id: 'template-2',
        name: 'Mobile App',
        description: 'Cross-platform mobile application template',
        disciplines: ['Mobile Development', 'UI/UX Design'],
        phases: [
          { name: 'Requirements', sprints: ['User Stories'] },
          { name: 'Design', sprints: ['UI/UX Design'] },
          { name: 'Development', sprints: ['iOS', 'Android'] },
          { name: 'Testing', sprints: ['QA Testing'] },
          { name: 'Launch', sprints: ['App Store Deployment'] },
        ],
        isBuiltIn: true,
        usage: { timesUsed: 32, lastUsed: new Date(), averageRating: 4.3, feedback: [] },
        createdAt: new Date(),
      },
      {
        id: 'template-3',
        name: 'IoT System',
        description: 'Internet of Things system with hardware and software integration',
        disciplines: ['Electrical Engineering', 'Software Engineering', 'Embedded Systems'],
        phases: [
          { name: 'Requirements', sprints: ['System Requirements'] },
          { name: 'Hardware Design', sprints: ['Circuit Design', 'PCB Layout'] },
          { name: 'Firmware Development', sprints: ['Embedded Code'] },
          { name: 'Cloud Integration', sprints: ['Backend Services'] },
          { name: 'Testing', sprints: ['Hardware Testing', 'Integration Testing'] },
        ],
        isBuiltIn: true,
        usage: { timesUsed: 18, lastUsed: new Date(), averageRating: 4.7, feedback: [] },
        createdAt: new Date(),
      },
    ];
    localStorage.setItem('be_templates', JSON.stringify(stored.templates));
  }

  // Initialize default AI profiles if empty
  if (stored.aiProfiles.length === 0) {
    stored.aiProfiles = [
      {
        id: 'profile-1',
        name: 'Claude Sonnet (Balanced)',
        description: 'Balanced AI profile for general engineering projects',
        tuningSettings: {
          clarity: 75,
          technicality: 70,
          foresight: 65,
          riskAversion: 60,
          userCentricity: 70,
          conciseness: 65,
        },
        modelConfiguration: { model: 'claude-3.5-sonnet', temperature: 0.7 },
        userId: 'system',
        isBuiltIn: true,
        isShared: true,
        usage: { timesUsed: 120, lastUsed: new Date(), averageRating: 4.6, feedback: [] },
        createdAt: new Date(),
      },
      {
        id: 'profile-2',
        name: 'Claude Haiku (Fast)',
        description: 'Quick responses for rapid prototyping',
        tuningSettings: {
          clarity: 80,
          technicality: 60,
          foresight: 50,
          riskAversion: 40,
          userCentricity: 75,
          conciseness: 85,
        },
        modelConfiguration: { model: 'claude-3-haiku', temperature: 0.8 },
        userId: 'system',
        isBuiltIn: true,
        isShared: true,
        usage: { timesUsed: 85, lastUsed: new Date(), averageRating: 4.4, feedback: [] },
        createdAt: new Date(),
      },
    ];
    localStorage.setItem('be_ai_profiles', JSON.stringify(stored.aiProfiles));
  }

  // Initialize default analytics if empty
  if (!stored.analytics) {
    stored.analytics = {
      averageCompletion: 68,
      averageVelocity: 8.5,
      industryBenchmark: {
        completion: 65,
        velocity: 7.2,
      },
    };
    localStorage.setItem('be_analytics', JSON.stringify(stored.analytics));
  }

  return stored;
};

export const mockStore = initializeStore();

// Persistence helpers
export const persistProjects = () => {
  localStorage.setItem('be_projects', JSON.stringify(mockStore.projects));
};

export const persistTemplates = () => {
  localStorage.setItem('be_templates', JSON.stringify(mockStore.templates));
};

export const persistAIProfiles = () => {
  localStorage.setItem('be_ai_profiles', JSON.stringify(mockStore.aiProfiles));
};

export const persistTeamMembers = () => {
  localStorage.setItem('be_team_members', JSON.stringify(mockStore.teamMembers));
};

export const persistTasks = () => {
  localStorage.setItem('be_tasks', JSON.stringify(mockStore.tasks));
};

export const persistAnalytics = () => {
  localStorage.setItem('be_analytics', JSON.stringify(mockStore.analytics));
};
