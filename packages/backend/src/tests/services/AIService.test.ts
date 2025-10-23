import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../services/AIService';
import { mockAIResponses } from '../mocks/services';

// Mock the Gemini API
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => mockAIResponses.generatePhaseContent,
        },
      }),
    }),
  })),
}));

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('generatePhaseContent', () => {
    it('should generate content for a phase', async () => {
      const phase = {
        id: 'phase-1',
        name: 'Requirements Analysis',
        description: 'Analyze and document requirements',
        status: 'in-progress' as const,
        sprints: [],
        tuningSettings: {
          clarity: 80,
          technicality: 70,
        },
        output: '',
        isEditable: true,
      };

      const project = {
        id: 'project-1',
        name: 'Test Project',
        requirements: 'Build a mechanical system',
        constraints: 'Budget: $100k',
        disciplines: ['Mechanical Engineering'],
      };

      const content = await aiService.generatePhaseContent(phase, project);

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should respect tuning settings', async () => {
      const highClarityPhase = {
        id: 'phase-1',
        name: 'Requirements',
        description: 'Requirements phase',
        status: 'in-progress' as const,
        sprints: [],
        tuningSettings: {
          clarity: 100,
          conciseness: 20,
        },
        output: '',
        isEditable: true,
      };

      const highConcisePhase = {
        id: 'phase-2',
        name: 'Requirements',
        description: 'Requirements phase',
        status: 'in-progress' as const,
        sprints: [],
        tuningSettings: {
          clarity: 50,
          conciseness: 100,
        },
        output: '',
        isEditable: true,
      };

      const project = {
        id: 'project-1',
        name: 'Test Project',
        requirements: 'Build a system',
        constraints: 'Budget constraints',
        disciplines: ['Engineering'],
      };

      const clarityContent = await aiService.generatePhaseContent(highClarityPhase, project);
      const conciseContent = await aiService.generatePhaseContent(highConcisePhase, project);

      // Clarity-focused content should be more detailed
      expect(clarityContent.length).toBeGreaterThan(conciseContent.length);
    });
  });

  describe('generateSprintContent', () => {
    it('should generate content for a sprint', async () => {
      const sprint = {
        id: 'sprint-1',
        name: 'Initial Design',
        description: 'Create initial design concepts',
        status: 'not-started' as const,
        deliverables: ['Design sketches', 'Concept models'],
      };

      const phase = {
        id: 'phase-1',
        name: 'Design Phase',
        description: 'Design the system',
        tuningSettings: {
          creativity: 80,
        },
      };

      const project = {
        id: 'project-1',
        name: 'Test Project',
        requirements: 'Build a mechanical system',
        disciplines: ['Mechanical Engineering'],
      };

      const content = await aiService.generateSprintContent(sprint, phase, project);

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeRequirements', () => {
    it('should analyze project requirements', async () => {
      const requirements = 'Build a high-performance electric motor with efficiency > 95%';
      const constraints = 'Budget: $50k, Timeline: 6 months';

      const analysis = await aiService.analyzeRequirements(requirements, constraints);

      expect(analysis).toBeDefined();
      expect(analysis.keyRequirements).toBeDefined();
      expect(Array.isArray(analysis.keyRequirements)).toBe(true);
      expect(analysis.suggestedPhases).toBeDefined();
      expect(analysis.estimatedComplexity).toBeDefined();
    });

    it('should identify technical requirements', async () => {
      const requirements = 'System must handle 1000 concurrent users with < 100ms latency';
      const constraints = 'Cloud-based deployment';

      const analysis = await aiService.analyzeRequirements(requirements, constraints);

      expect(analysis.keyRequirements.some(req => 
        req.toLowerCase().includes('performance') || 
        req.toLowerCase().includes('concurrent') ||
        req.toLowerCase().includes('latency')
      )).toBe(true);
    });
  });

  describe('generateDesignRecommendations', () => {
    it('should generate design recommendations', async () => {
      const requirements = 'Build a lightweight drone with 30-minute flight time';
      const phase = {
        id: 'phase-1',
        name: 'Design',
        description: 'Design phase',
      };

      const recommendations = await aiService.generateDesignRecommendations(requirements, phase);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const invalidPhase = {
        id: '',
        name: '',
        description: '',
        status: 'in-progress' as const,
        sprints: [],
        tuningSettings: {},
        output: '',
        isEditable: true,
      };

      const invalidProject = {
        id: '',
        name: '',
        requirements: '',
        constraints: '',
        disciplines: [],
      };

      await expect(
        aiService.generatePhaseContent(invalidPhase, invalidProject)
      ).rejects.toThrow();
    });
  });
});
