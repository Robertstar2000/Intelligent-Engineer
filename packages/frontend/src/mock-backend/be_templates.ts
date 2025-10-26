// Mock Backend - Templates Service
import { mockStore, persistTemplates } from './be_store';

export const templatesService = {
  list() {
    return mockStore.templates;
  },

  get(templateId: string) {
    const template = mockStore.templates.find((t: any) => t.id === templateId);
    if (!template) throw new Error('Template not found');
    return template;
  },

  generate(data: any) {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: data.name || 'Custom Template',
      description: data.description || '',
      disciplines: data.disciplines || [],
      phases: data.phases || [],
      isBuiltIn: false,
      usage: { timesUsed: 0, lastUsed: new Date(), averageRating: 0, feedback: [] },
      createdAt: new Date(),
    };
    mockStore.templates.push(newTemplate);
    persistTemplates();
    return newTemplate;
  },

  update(templateId: string, data: any) {
    const index = mockStore.templates.findIndex((t: any) => t.id === templateId);
    if (index === -1) throw new Error('Template not found');
    
    mockStore.templates[index] = {
      ...mockStore.templates[index],
      ...data,
      updatedAt: new Date(),
    };
    persistTemplates();
    return mockStore.templates[index];
  },

  delete(templateId: string) {
    const template = mockStore.templates.find((t: any) => t.id === templateId);
    if (!template) throw new Error('Template not found');
    if (template.isBuiltIn) throw new Error('Cannot delete built-in template');
    
    mockStore.templates = mockStore.templates.filter((t: any) => t.id !== templateId);
    persistTemplates();
    return { success: true };
  },
};
