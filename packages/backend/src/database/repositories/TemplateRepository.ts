import { Pool } from 'pg';
import { Template } from '@shared/types';
import { db } from '../connection';

export class TemplateRepository {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(templateData: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
    const query = `
      INSERT INTO templates (
        name, description, version, disciplines, development_mode,
        phases, dynamic_roles, compliance_frameworks, ai_profiles,
        integration_requirements, is_built_in, is_custom, organization_id, usage_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      templateData.name,
      templateData.description,
      templateData.version,
      JSON.stringify(templateData.disciplines),
      templateData.developmentMode,
      JSON.stringify(templateData.phases),
      JSON.stringify(templateData.dynamicRoles),
      JSON.stringify(templateData.complianceFrameworks),
      JSON.stringify(templateData.aiProfiles),
      JSON.stringify(templateData.integrationRequirements),
      templateData.isBuiltIn,
      templateData.isCustom,
      templateData.organizationId || null,
      JSON.stringify(templateData.usage),
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToTemplate(result.rows[0]);
  }

  async findById(id: string): Promise<Template | null> {
    const query = 'SELECT * FROM templates WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Template[]> {
    const query = `
      SELECT t.* FROM templates t
      JOIN projects p ON t.id = p.template_id
      WHERE p.created_by = $1
      UNION
      SELECT * FROM templates WHERE created_by = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async findByOrganizationId(organizationId: string): Promise<Template[]> {
    const query = `
      SELECT * FROM templates 
      WHERE organization_id = $1 AND (is_custom = true OR is_built_in = true)
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [organizationId]);
    
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async findBuiltInTemplates(): Promise<Template[]> {
    const query = 'SELECT * FROM templates WHERE is_built_in = true ORDER BY name';
    const result = await this.pool.query(query);
    
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async findByDisciplines(disciplines: string[]): Promise<Template[]> {
    const query = `
      SELECT * FROM templates 
      WHERE disciplines::jsonb ?| $1
      ORDER BY 
        CASE WHEN is_built_in THEN 1 ELSE 2 END,
        name
    `;
    const result = await this.pool.query(query, [disciplines]);
    
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async update(id: string, updates: Partial<Template>): Promise<Template | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      setClause.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (updates.version !== undefined) {
      setClause.push(`version = $${paramIndex++}`);
      values.push(updates.version);
    }

    if (updates.disciplines !== undefined) {
      setClause.push(`disciplines = $${paramIndex++}`);
      values.push(JSON.stringify(updates.disciplines));
    }

    if (updates.developmentMode !== undefined) {
      setClause.push(`development_mode = $${paramIndex++}`);
      values.push(updates.developmentMode);
    }

    if (updates.phases !== undefined) {
      setClause.push(`phases = $${paramIndex++}`);
      values.push(JSON.stringify(updates.phases));
    }

    if (updates.dynamicRoles !== undefined) {
      setClause.push(`dynamic_roles = $${paramIndex++}`);
      values.push(JSON.stringify(updates.dynamicRoles));
    }

    if (updates.complianceFrameworks !== undefined) {
      setClause.push(`compliance_frameworks = $${paramIndex++}`);
      values.push(JSON.stringify(updates.complianceFrameworks));
    }

    if (updates.aiProfiles !== undefined) {
      setClause.push(`ai_profiles = $${paramIndex++}`);
      values.push(JSON.stringify(updates.aiProfiles));
    }

    if (updates.integrationRequirements !== undefined) {
      setClause.push(`integration_requirements = $${paramIndex++}`);
      values.push(JSON.stringify(updates.integrationRequirements));
    }

    if (updates.usage !== undefined) {
      setClause.push(`usage_data = $${paramIndex++}`);
      values.push(JSON.stringify(updates.usage));
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE templates 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM templates WHERE id = $1 AND is_built_in = false';
    const result = await this.pool.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async search(searchTerm: string, filters?: {
    disciplines?: string[];
    developmentMode?: 'full' | 'rapid';
    organizationId?: string;
  }): Promise<Template[]> {
    let query = `
      SELECT * FROM templates 
      WHERE (name ILIKE $1 OR description ILIKE $1)
    `;
    
    const values = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (filters?.disciplines && filters.disciplines.length > 0) {
      query += ` AND disciplines::jsonb ?| $${paramIndex++}`;
      values.push(filters.disciplines);
    }

    if (filters?.developmentMode) {
      query += ` AND development_mode = $${paramIndex++}`;
      values.push(filters.developmentMode);
    }

    if (filters?.organizationId) {
      query += ` AND (organization_id = $${paramIndex++} OR is_built_in = true)`;
      values.push(filters.organizationId);
    }

    query += ` ORDER BY 
      CASE WHEN is_built_in THEN 1 ELSE 2 END,
      name`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async incrementUsage(id: string): Promise<void> {
    const query = `
      UPDATE templates 
      SET usage_data = jsonb_set(
        usage_data,
        '{timesUsed}',
        ((usage_data->>'timesUsed')::int + 1)::text::jsonb
      ),
      usage_data = jsonb_set(
        usage_data,
        '{lastUsed}',
        to_jsonb(CURRENT_TIMESTAMP)
      )
      WHERE id = $1
    `;
    
    await this.pool.query(query, [id]);
  }

  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    const query = `
      SELECT * FROM templates 
      WHERE (usage_data->>'timesUsed')::int > 0
      ORDER BY (usage_data->>'timesUsed')::int DESC, name
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  async getRecentTemplates(limit: number = 10): Promise<Template[]> {
    const query = `
      SELECT * FROM templates 
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  private mapRowToTemplate(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      disciplines: JSON.parse(row.disciplines),
      developmentMode: row.development_mode,
      phases: JSON.parse(row.phases),
      dynamicRoles: JSON.parse(row.dynamic_roles),
      complianceFrameworks: JSON.parse(row.compliance_frameworks),
      aiProfiles: JSON.parse(row.ai_profiles),
      integrationRequirements: JSON.parse(row.integration_requirements),
      isBuiltIn: row.is_built_in,
      isCustom: row.is_custom,
      organizationId: row.organization_id,
      usage: JSON.parse(row.usage_data),
      createdAt: new Date(row.created_at),
    };
  }
}