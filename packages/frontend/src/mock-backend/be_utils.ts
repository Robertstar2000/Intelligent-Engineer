// Mock Backend - Utility Functions

export const generatePhases = (developmentMode: string) => {
  const allPhases = [
    {
      id: 'phase-1',
      name: 'Requirements Analysis',
      description: 'Define project requirements and specifications',
      status: 'not-started',
      sprints: [
        {
          id: 'sprint-1-1',
          name: 'User Stories',
          description: 'Define user stories and use cases',
          status: 'not-started',
          deliverables: ['User story document', 'Use case diagrams'],
        },
        {
          id: 'sprint-1-2',
          name: 'Technical Specifications',
          description: 'Create technical specifications',
          status: 'not-started',
          deliverables: ['Technical spec document', 'System requirements'],
        },
      ],
      tuningSettings: {},
      isEditable: true,
    },
    {
      id: 'phase-2',
      name: 'Design',
      description: 'Create system architecture and design',
      status: 'not-started',
      sprints: [
        {
          id: 'sprint-2-1',
          name: 'Architecture Design',
          description: 'Design system architecture',
          status: 'not-started',
          deliverables: ['Architecture diagrams', 'Component specifications'],
        },
        {
          id: 'sprint-2-2',
          name: 'UI/UX Design',
          description: 'Create user interface designs',
          status: 'not-started',
          deliverables: ['Wireframes', 'UI mockups', 'Design system'],
        },
      ],
      tuningSettings: {},
      isEditable: true,
    },
    {
      id: 'phase-3',
      name: 'Development',
      description: 'Implement the solution',
      status: 'not-started',
      sprints: [
        {
          id: 'sprint-3-1',
          name: 'Core Development',
          description: 'Build core features and functionality',
          status: 'not-started',
          deliverables: ['Core modules', 'API endpoints', 'Database schema'],
        },
        {
          id: 'sprint-3-2',
          name: 'Integration',
          description: 'Integrate all components',
          status: 'not-started',
          deliverables: ['Integrated system', 'Integration tests'],
        },
      ],
      tuningSettings: {},
      isEditable: true,
    },
    {
      id: 'phase-4',
      name: 'Testing',
      description: 'Test and validate the solution',
      status: 'not-started',
      sprints: [
        {
          id: 'sprint-4-1',
          name: 'Unit Testing',
          description: 'Create and run unit tests',
          status: 'not-started',
          deliverables: ['Unit test suite', 'Test coverage report'],
        },
        {
          id: 'sprint-4-2',
          name: 'Integration Testing',
          description: 'Test system integration',
          status: 'not-started',
          deliverables: ['Integration test suite', 'Test results'],
        },
      ],
      tuningSettings: {},
      isEditable: true,
    },
    {
      id: 'phase-5',
      name: 'Deployment',
      description: 'Deploy to production',
      status: 'not-started',
      sprints: [
        {
          id: 'sprint-5-1',
          name: 'Production Setup',
          description: 'Setup production environment',
          status: 'not-started',
          deliverables: ['Production infrastructure', 'Deployment scripts'],
        },
        {
          id: 'sprint-5-2',
          name: 'Launch',
          description: 'Launch to users',
          status: 'not-started',
          deliverables: ['Production deployment', 'Launch documentation'],
        },
      ],
      tuningSettings: {},
      isEditable: true,
    },
  ];

  // Return fewer phases for rapid development
  return developmentMode === 'rapid' ? allPhases.slice(0, 3) : allPhases;
};

export const simulateDelay = (ms: number = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
