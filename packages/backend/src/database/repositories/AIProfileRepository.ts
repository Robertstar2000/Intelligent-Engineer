import { Pool } from 'pg';
import { AIProfile } from '@shared/types';
import { db } from '../connection';

export class AIProfileRepository {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async create(profileData: Omit<AIProfile, 'id' | 'createdAt'>): Promise<AIProfile> {
    const query = `
      INSERT INTO ai_profiles (
        name, description, tuning_settings, model_configuration,
        user_id, organization_id, is_built_in, is_shared, usage_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      profileData.name,
      profileData.description,
      JSON.stringify(profileData.tuningSettings),
      JSON.stringify(profileData.modelConfiguration),
      profileData.userId,
      profileData.organizationId || null,
      profileData.isBuiltIn || false,
      profileData.isShared,
      JSON.stringify(profileData.usage),
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToProfile(result.rows[0]);
  }

  async findById(id: string): Promise<AIProfile | null> {
    const query = 'SELECT * FROM ai_profiles WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProfile(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<AIProfile[]> {
    const query = 'SELECT * FROM ai_profiles WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => this.mapRowToProfile(row));
  }

  async findByOrganizationId(organizationId: string): Promise<AIProfile[]> {
    const query = `
      SELECT * FROM ai_profiles 
      WHERE organization_id = $1 AND is_shared = true 
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [organizationId]);
    
    return result.rows.map(row => this.mapRowToProfile(row));
  }

  async findBuiltInProfiles(): Promise<AIProfile[]> {
    const query = 'SELECT * FROM ai_profiles WHERE is_built_in = true ORDER BY name';
    const result = await this.pool.query(query);
    
    return result.rows.map(row => this.mapRowToProfile(row));
  }

  async findByName(name: string): Promise<AIProfile | null> {
    const query = 'SELECT * FROM ai_profiles WHERE name = $1';
    const result = await this.pool.query(query, [name]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProfile(result.rows[0]);
  }

  async update(id: string, updates: Partial<AIProfile>): Promise<AIProfile | null> {
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

    if (updates.tuningSettings !== undefined) {
      setClause.push(`tuning_settings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.tuningSettings));
    }

    if (updates.modelConfiguration !== undefined) {
      setClause.push(`model_configuration = $${paramIndex++}`);
      values.push(JSON.stringify(updates.modelConfiguration));
    }

    if (updates.isShared !== undefined) {
      setClause.push(`is_shared = $${paramIndex++}`);
      values.push(updates.isShared);
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
      UPDATE ai_profiles 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProfile(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM ai_profiles WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async search(searchTerm: string, userId: string, organizationId?: string): Promise<AIProfile[]> {
    let query = `
      SELECT * FROM ai_profiles 
      WHERE (name ILIKE $1 OR description ILIKE $1)
      AND (
        user_id = $2 
        OR is_built_in = true 
        OR is_shared = true
    `;
    
    const values = [`%${searchTerm}%`, userId];
    
    if (organizationId) {
      query += ` OR organization_id = $3`;
      values.push(organizationId);
    }
    
    query += `) ORDER BY 
      CASE WHEN user_id = $2 THEN 1 ELSE 2 END,
      name`;

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToProfile(row));
  }

  private mapRowToProfile(row: any): AIProfile {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tuningSettings: JSON.parse(row.tuning_settings),
      modelConfiguration: JSON.parse(row.model_configuration),
      userId: row.user_id,
      organizationId: row.organization_id,
      isBuiltIn: row.is_built_in,
      isShared: row.is_shared,
      usage: JSON.parse(row.usage_data),
      createdAt: new Date(row.created_at),
    };
  }
}