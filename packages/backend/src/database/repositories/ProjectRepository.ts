import { query, transaction } from '../connection';
import { Project, ProjectStatus, ProgramScale } from '@shared/types';

export class ProjectRepository {
  // Create a new project (enhanced from localStorage model)
  async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const sql = `
      INSERT INTO projects (
        name, description, requirements, constraints, disciplines, 
        development_mode, current_phase, program_scale, status,
        organization_id, template_id, created_by, program_leader,
        phases, team, dynamic_roles, compliance_requirements, 
        integrations, analytics, risk_assessment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      projectData.name,
      projectData.description || null,
      projectData.requirements,
      projectData.constraints,
      JSON.stringify(projectData.disciplines),
      projectData.developmentMode,
      projectData.currentPhase,
      projectData.programScale || 'medium',
      projectData.status,
      projectData.organizationId || null,
      projectData.templateId || null,
      projectData.createdBy || null,
      projectData.programLeader || null,
      JSON.stringify(projectData.phases),
      JSON.stringify(projectData.team || []),
      JSON.stringify(projectData.dynamicRoles || []),
      JSON.stringify(projectData.complianceRequirements || []),
      JSON.stringify(projectData.integrations || []),
      JSON.stringify(projectData.analytics || {}),
      JSON.stringify(projectData.riskAssessment || {})
    ];

    const result = await query(sql, values);
    return this.mapRowToProject(result.rows[0]);
  }

  // Find project by ID
  async findById(id: string): Promise<Project | null> {
    const sql = 'SELECT * FROM projects WHERE id = $1';
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  // Find projects by user ID (team member or creator)
  async findByUserId(userId: string): Promise<Project[]> {
    const sql = `
      SELECT DISTINCT p.* FROM projects p
      LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
      WHERE p.created_by = $1 OR ptm.user_id = $1
      ORDER BY p.updated_at DESC
    `;
    
    const result = await query(sql, [userId]);
    return result.rows.map(row => this.mapRowToProject(row));
  }

  // Find projects by organization
  async findByOrganization(organizationId: string): Promise<Project[]> {
    const sql = `
      SELECT * FROM projects 
      WHERE organization_id = $1 
      ORDER BY updated_at DESC
    `;
    
    const result = await query(sql, [organizationId]);
    return result.rows.map(row => this.mapRowToProject(row));
  }

  // Update project
  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'createdAt') return; // Skip immutable fields
      
      const dbKey = this.camelToSnake(key);
      
      if (typeof value === 'object' && value !== null) {
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE projects 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  // Delete project
  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM projects WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  }

  // Add team member to project
  async addTeamMember(projectId: string, userId: string, role: any): Promise<void> {
    await transaction(async (client) => {
      // Add to project_team_members table
      const sql = `
        INSERT INTO project_team_members (project_id, user_id, role, permissions)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (project_id, user_id) 
        DO UPDATE SET role = $3, permissions = $4, is_active = true
      `;
      
      await client.query(sql, [
        projectId, 
        userId, 
        JSON.stringify(role), 
        JSON.stringify(role.permissions || [])
      ]);

      // Update project team array
      const updateProjectSql = `
        UPDATE projects 
        SET team = COALESCE(team, '[]'::jsonb) || $2::jsonb,
            updated_at = NOW()
        WHERE id = $1
      `;
      
      const teamMember = {
        id: `${projectId}-${userId}`,
        userId,
        projectId,
        role,
        permissions: role.permissions || [],
        joinedAt: new Date(),
        isActive: true
      };

      await client.query(updateProjectSql, [projectId, JSON.stringify([teamMember])]);
    });
  }

  // Remove team member from project
  async removeTeamMember(projectId: string, userId: string): Promise<void> {
    await transaction(async (client) => {
      // Remove from project_team_members table
      await client.query(
        'UPDATE project_team_members SET is_active = false WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      // Update project team array
      const project = await this.findById(projectId);
      if (project) {
        const updatedTeam = project.team.filter(member => member.userId !== userId);
        await client.query(
          'UPDATE projects SET team = $2, updated_at = NOW() WHERE id = $1',
          [projectId, JSON.stringify(updatedTeam)]
        );
      }
    });
  }

  // Migration helper: Import from localStorage format
  async migrateFromLocalStorage(localStorageData: any, userId: string): Promise<Project> {
    // Convert localStorage project format to new database format
    const projectData = {
      name: localStorageData.name,
      requirements: localStorageData.requirements,
      constraints: localStorageData.constraints,
      disciplines: localStorageData.disciplines,
      developmentMode: localStorageData.developmentMode,
      currentPhase: localStorageData.currentPhase,
      phases: localStorageData.phases,
      status: 'active' as ProjectStatus,
      programScale: 'medium' as ProgramScale,
      createdBy: userId,
      team: [],
      dynamicRoles: [],
      complianceRequirements: [],
      integrations: [],
      analytics: {},
      riskAssessment: {}
    };

    return this.create(projectData);
  }

  // Helper methods
  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      requirements: row.requirements,
      constraints: row.constraints,
      disciplines: row.disciplines,
      developmentMode: row.development_mode,
      currentPhase: row.current_phase,
      programScale: row.program_scale,
      status: row.status,
      organizationId: row.organization_id,
      templateId: row.template_id,
      createdBy: row.created_by,
      programLeader: row.program_leader,
      phases: row.phases,
      team: row.team || [],
      dynamicRoles: row.dynamic_roles || [],
      complianceRequirements: row.compliance_requirements || [],
      integrations: row.integrations || [],
      analytics: row.analytics,
      riskAssessment: row.risk_assessment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}