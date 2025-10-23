import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from '../../services/TemplateService';
import { mockDatabase, mockTemplate } from '../mocks/services';

// Mock the database
vi.mock('../../database', () => ({
  db: mockDatabase,
}));

describe('TemplateService', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    vi.clearAllMocks();
    templateService = new TemplateService();
  });

  describe('generateTemplate', () => {
    it('should generate a template with valid configuration', async () => {
      const config = {
        disciplines: ['Mechanical Engineering', 'Electrical Engineering'],
        scope: 'design-prototypes' as const,
        scale: 'medium' as const,
        name: 'Multi-Discipline Template',
        description: 'Template for multi-discipline projects',
      };

      const template = await templateService.generateTemplate(config);

      expect(template).toBeDefined();
      expect(template.name).toBe(config.name);
      expect(template.disciplines).toEqual(config.disciplines);
      expect(template.phases).toBeDefined();
      expect(template.phases.length).toBeGreaterThan(0);
    });

    it('should generate more phases for design-production scope', async () => {
      const designOnlyConfig = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'small' as const,
        name: 'Design Only',
        description: 'Design only template',
      };

      const productionConfig = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-production' as const,
        scale: 'small' as const,
        name: 'Full Production',
        description: 'Full production template',
      };

      const designOnlyTemplate = await templateService.generateTemplate(designOnlyConfig);
      const productionTemplate = await templateService.generateTemplate(productionConfig);

      expect(productionTemplate.phases.length).toBeGreaterThan(designOnlyTemplate.phases.length);
    });

    it('should include dynamic roles based on scale', async () => {
      const smallConfig = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'small' as const,
        name: 'Small Project',
        description: 'Small project template',
      };

      const enterpriseConfig = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'enterprise' as const,
        name: 'Enterprise Project',
        description: 'Enterprise project template',
      };

      const smallTemplate = await templateService.generateTemplate(smallConfig);
      const enterpriseTemplate = await templateService.generateTemplate(enterpriseConfig);

      expect(enterpriseTemplate.dynamicRoles.length).toBeGreaterThan(smallTemplate.dynamicRoles.length);
    });
  });

  describe('getTemplate', () => {
    it('should retrieve an existing template', async () => {
      const config = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'medium' as const,
        name: 'Test Template',
        description: 'Test template',
      };

      const created = await templateService.generateTemplate(config);
      const retrieved = await templateService.getTemplate(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });
  });

  describe('listTemplates', () => {
    it('should list all available templates', async () => {
      const templates = await templateService.listTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should filter templates by discipline', async () => {
      const allTemplates = await templateService.listTemplates();
      const mechanicalTemplates = await templateService.listTemplates({
        discipline: 'Mechanical Engineering',
      });

      mechanicalTemplates.forEach(template => {
        expect(template.disciplines).toContain('Mechanical Engineering');
      });
    });
  });

  describe('updateTemplate', () => {
    it('should update template properties', async () => {
      const config = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'medium' as const,
        name: 'Original Name',
        description: 'Original description',
      };

      const created = await templateService.generateTemplate(config);
      const updated = await templateService.updateTemplate(created.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('deleteTemplate', () => {
    it('should not allow deletion of built-in templates', async () => {
      const builtInTemplates = await templateService.listTemplates();
      const builtInTemplate = builtInTemplates.find(t => t.isBuiltIn);

      if (builtInTemplate) {
        await expect(
          templateService.deleteTemplate(builtInTemplate.id)
        ).rejects.toThrow();
      }
    });

    it('should allow deletion of custom templates', async () => {
      const config = {
        disciplines: ['Mechanical Engineering'],
        scope: 'design-only' as const,
        scale: 'medium' as const,
        name: 'Custom Template',
        description: 'Custom template',
      };

      const created = await templateService.generateTemplate(config);
      await templateService.deleteTemplate(created.id);

      await expect(
        templateService.getTemplate(created.id)
      ).rejects.toThrow();
    });
  });
});
