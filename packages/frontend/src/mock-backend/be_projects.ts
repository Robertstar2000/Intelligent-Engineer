// Mock Backend - Projects Service
import { mockStore, persistProjects } from './be_store';
import { generatePhases } from './be_utils';

export const projectsService = {
  list() {
    return mockStore.projects;
  },

  get(projectId: string) {
    const project = mockStore.projects.find((p: any) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    return project;
  },

  create(data: any) {
    const newProject = {
      id: `project-${Date.now()}`,
      ...data,
      status: 'active',
      progress: 0,
      team: [],
      phases: generatePhases(data.developmentMode || 'rapid'),
      currentPhase: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.projects.push(newProject);
    persistProjects();
    return newProject;
  },

  update(projectId: string, data: any) {
    const index = mockStore.projects.findIndex((p: any) => p.id === projectId);
    if (index === -1) throw new Error('Project not found');
    
    mockStore.projects[index] = {
      ...mockStore.projects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    persistProjects();
    return mockStore.projects[index];
  },

  delete(projectId: string) {
    mockStore.projects = mockStore.projects.filter((p: any) => p.id !== projectId);
    persistProjects();
    return { success: true };
  },

  updatePhase(projectId: string, phaseId: string, data: any) {
    const project = mockStore.projects.find((p: any) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    const phase = project.phases.find((ph: any) => ph.id === phaseId);
    if (!phase) throw new Error('Phase not found');
    
    Object.assign(phase, data);
    project.updatedAt = new Date().toISOString();
    persistProjects();
    return phase;
  },

  generatePhase(projectId: string, phaseId: string, data: any) {
    const project = mockStore.projects.find((p: any) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    const phase = project.phases.find((ph: any) => ph.id === phaseId);
    if (!phase) throw new Error('Phase not found');
    
    // Simulate AI generation
    phase.output = `# ${phase.name}\n\nGenerated content for ${phase.name} phase...\n\n## Overview\n\nThis phase focuses on ${phase.description.toLowerCase()}.\n\n## Key Deliverables\n\n${phase.sprints.map((s: any) => `- ${s.name}`).join('\n')}`;
    phase.status = 'in-progress';
    project.updatedAt = new Date().toISOString();
    persistProjects();
    return phase;
  },

  assessRisks(projectId: string, data: any) {
    return {
      riskScore: 45,
      overallRiskLevel: 'medium',
      nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      risks: [
        {
          id: 'risk-1',
          title: 'Schedule Delay Risk',
          description: 'Project timeline may be impacted by resource constraints',
          category: 'Schedule',
          severity: 'medium',
          probability: 0.6,
          impact: 'medium',
          status: 'active',
          mitigation: [
            'Add buffer time to critical path tasks',
            'Identify backup resources',
            'Implement daily standups for early detection',
          ],
        },
        {
          id: 'risk-2',
          title: 'Technical Complexity',
          description: 'Integration with legacy systems may present challenges',
          category: 'Technical',
          severity: 'high',
          probability: 0.7,
          impact: 'high',
          status: 'active',
          mitigation: [
            'Conduct technical spike to assess integration points',
            'Allocate senior engineers to integration tasks',
            'Create comprehensive integration test suite',
          ],
        },
        {
          id: 'risk-3',
          title: 'Resource Availability',
          description: 'Key team members may have competing priorities',
          category: 'Resource',
          severity: 'low',
          probability: 0.4,
          impact: 'medium',
          status: 'active',
          mitigation: [
            'Cross-train team members on critical skills',
            'Maintain resource allocation calendar',
            'Establish clear priority guidelines',
          ],
        },
      ],
      recommendations: [
        'Consider adding a dedicated integration phase',
        'Schedule weekly risk review meetings',
        'Maintain close communication with stakeholders',
        'Document all technical decisions and assumptions',
      ],
    };
  },

  exportProject(projectId: string, data: any) {
    const project = mockStore.projects.find((p: any) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    return {
      exportId: `export-${Date.now()}`,
      projectId,
      format: data.format,
      status: 'processing',
      downloadUrl: `/downloads/project-${projectId}.${data.format}`,
      createdAt: new Date().toISOString(),
    };
  },

  getAnalytics(projectId: string, range?: string) {
    const project = mockStore.projects.find((p: any) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    return {
      projectId,
      completion: project.progress || 0,
      velocity: 8.5,
      teamSize: project.team?.length || 0,
      phasesCompleted: project.phases.filter((p: any) => p.status === 'completed').length,
      totalPhases: project.phases.length,
      timeline: [
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 5, hoursWorked: 40 },
        { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 7, hoursWorked: 45 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 6, hoursWorked: 38 },
        { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 8, hoursWorked: 42 },
        { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 9, hoursWorked: 48 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 7, hoursWorked: 40 },
        { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), tasksCompleted: 10, hoursWorked: 50 },
      ],
    };
  },
};
