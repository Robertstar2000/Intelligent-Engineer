import { TeamMember, DynamicRole, Permission, ActiveUser } from '@shared/types';
import { query } from '../database/connection';
import { auditLog } from '../middleware/logging';
import { randomUUID } from 'crypto';

export class TeamService {
  // Invite user to project team
  async inviteTeamMember(
    projectId: string,
    email: string,
    role: DynamicRole,
    invitedBy: string
  ): Promise<{ invitationId: string; message: string }> {
    try {
      // Check if user exists
      const userResult = await query(
        'SELECT id, name, email FROM users WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
      );

      let userId: string;
      let isNewUser = false;

      if (userResult.rows.length === 0) {
        // Create invitation for new user
        const invitationId = randomUUID();
        
        // Store invitation in database (we'll create this table)
        await query(`
          INSERT INTO team_invitations (id, project_id, email, role, invited_by, status, expires_at)
          VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '7 days')
        `, [invitationId, projectId, email.toLowerCase(), JSON.stringify(role), invitedBy]);

        // TODO: Send invitation email
        
        auditLog('INVITE_NEW_USER', 'project', projectId, invitedBy, {
          invitedEmail: email,
          roleName: role.name,
          invitationId,
        });

        return {
          invitationId,
          message: 'Invitation sent to new user. They will need to register first.',
        };
      } else {
        userId = userResult.rows[0].id;
        isNewUser = false;
      }

      // Check if user is already a team member
      const existingMember = await query(
        'SELECT id FROM project_team_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      if (existingMember.rows.length > 0) {
        throw new Error('User is already a team member');
      }

      // Add user to project team
      const teamMemberResult = await query(`
        INSERT INTO project_team_members (project_id, user_id, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id
      `, [projectId, userId, JSON.stringify(role), JSON.stringify(role.permissions)]);

      // TODO: Send notification email to existing user

      auditLog('ADD_TEAM_MEMBER', 'project', projectId, invitedBy, {
        addedUserId: userId,
        roleName: role.name,
        isNewUser,
      });

      return {
        invitationId: teamMemberResult.rows[0].id,
        message: isNewUser ? 'User added to team successfully' : 'Invitation sent to existing user',
      };
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  }

  // Get team members for a project
  async getTeamMembers(projectId: string): Promise<TeamMember[]> {
    try {
      const result = await query(`
        SELECT 
          ptm.id,
          ptm.user_id,
          ptm.project_id,
          ptm.role,
          ptm.permissions,
          ptm.joined_at,
          ptm.is_active,
          ptm.last_activity,
          u.name,
          u.email,
          u.avatar_url
        FROM project_team_members ptm
        JOIN users u ON ptm.user_id = u.id
        WHERE ptm.project_id = $1 AND ptm.is_active = true
        ORDER BY ptm.joined_at ASC
      `, [projectId]);

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        projectId: row.project_id,
        role: JSON.parse(row.role),
        permissions: JSON.parse(row.permissions || '[]'),
        joinedAt: row.joined_at,
        isActive: row.is_active,
        lastActivity: row.last_activity,
        user: {
          id: row.user_id,
          name: row.name,
          email: row.email,
          avatar: row.avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  // Update team member role
  async updateTeamMemberRole(
    projectId: string,
    userId: string,
    newRole: DynamicRole,
    updatedBy: string
  ): Promise<void> {
    try {
      const result = await query(`
        UPDATE project_team_members 
        SET role = $1, permissions = $2, last_activity = NOW()
        WHERE project_id = $3 AND user_id = $4 AND is_active = true
      `, [JSON.stringify(newRole), JSON.stringify(newRole.permissions), projectId, userId]);

      if (result.rowCount === 0) {
        throw new Error('Team member not found or inactive');
      }

      auditLog('UPDATE_TEAM_MEMBER_ROLE', 'project', projectId, updatedBy, {
        targetUserId: userId,
        newRoleName: newRole.name,
      });
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  }

  // Remove team member
  async removeTeamMember(
    projectId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    try {
      const result = await query(`
        UPDATE project_team_members 
        SET is_active = false, last_activity = NOW()
        WHERE project_id = $1 AND user_id = $2 AND is_active = true
      `, [projectId, userId]);

      if (result.rowCount === 0) {
        throw new Error('Team member not found or already inactive');
      }

      auditLog('REMOVE_TEAM_MEMBER', 'project', projectId, removedBy, {
        removedUserId: userId,
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  // Get active users (for presence indicators)
  async getActiveUsers(projectId: string): Promise<ActiveUser[]> {
    try {
      const result = await query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          ptm.role,
          u.last_activity,
          CASE 
            WHEN u.last_activity > NOW() - INTERVAL '5 minutes' THEN true 
            ELSE false 
          END as is_online
        FROM project_team_members ptm
        JOIN users u ON ptm.user_id = u.id
        WHERE ptm.project_id = $1 AND ptm.is_active = true
        ORDER BY u.last_activity DESC
      `, [projectId]);

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar_url,
        role: JSON.parse(row.role),
        isOnline: row.is_online,
        lastActivity: row.last_activity,
        currentLocation: null, // Will be updated by real-time system
      }));
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }

  // Update user activity (for presence tracking)
  async updateUserActivity(userId: string, location?: string): Promise<void> {
    try {
      await query(
        'UPDATE users SET last_activity = NOW() WHERE id = $1',
        [userId]
      );

      // TODO: Update real-time presence system with location
    } catch (error) {
      console.error('Error updating user activity:', error);
      throw error;
    }
  }

  // Check if user has permission for action
  async checkPermission(
    projectId: string,
    userId: string,
    action: string,
    resource?: string
  ): Promise<boolean> {
    try {
      // Check if user is project owner
      const projectResult = await query(
        'SELECT created_by FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length > 0 && projectResult.rows[0].created_by === userId) {
        return true; // Project owner has all permissions
      }

      // Check team member permissions
      const memberResult = await query(`
        SELECT permissions FROM project_team_members 
        WHERE project_id = $1 AND user_id = $2 AND is_active = true
      `, [projectId, userId]);

      if (memberResult.rows.length === 0) {
        return false; // Not a team member
      }

      const permissions: Permission[] = JSON.parse(memberResult.rows[0].permissions || '[]');
      
      return permissions.some(permission => 
        permission.action === action && 
        (!resource || permission.resource === resource || permission.resource === '*')
      );
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Accept invitation (for new users)
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      // Get invitation details
      const invitationResult = await query(`
        SELECT project_id, email, role, expires_at, status
        FROM team_invitations 
        WHERE id = $1
      `, [invitationId]);

      if (invitationResult.rows.length === 0) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationResult.rows[0];

      if (invitation.status !== 'pending') {
        throw new Error('Invitation already processed');
      }

      if (new Date() > invitation.expires_at) {
        throw new Error('Invitation has expired');
      }

      // Verify user email matches invitation
      const userResult = await query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].email !== invitation.email) {
        throw new Error('User email does not match invitation');
      }

      // Add user to team
      await query(`
        INSERT INTO project_team_members (project_id, user_id, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, true)
      `, [
        invitation.project_id,
        userId,
        invitation.role,
        JSON.stringify(JSON.parse(invitation.role).permissions)
      ]);

      // Mark invitation as accepted
      await query(`
        UPDATE team_invitations 
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = $1
      `, [invitationId]);

      auditLog('ACCEPT_INVITATION', 'project', invitation.project_id, userId, {
        invitationId,
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
}