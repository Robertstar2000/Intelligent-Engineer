import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../database/connection';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    organizationId?: string;
    role?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Fetch user details from database
    const userResult = await query(
      'SELECT id, email, name, organization_id FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Alias for backward compatibility
export const requireAuth = authenticateToken;

export const requireRole = (requiredRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // For now, we'll implement basic role checking
    // In a full implementation, this would check against the dynamic roles system
    const userRole = req.user.role || 'user';
    
    if (!requiredRoles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireProjectAccess = (permission: 'read' | 'write' | 'admin') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const projectId = req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      res.status(400).json({ error: 'Project ID required' });
      return;
    }

    try {
      // Check if user has access to the project
      const accessResult = await query(`
        SELECT p.id, p.created_by, ptm.role, ptm.permissions
        FROM projects p
        LEFT JOIN project_team_members ptm ON p.id = ptm.project_id AND ptm.user_id = $2
        WHERE p.id = $1 AND (p.created_by = $2 OR ptm.is_active = true)
      `, [projectId, req.user.id]);

      if (accessResult.rows.length === 0) {
        res.status(403).json({ error: 'Access denied to this project' });
        return;
      }

      const projectAccess = accessResult.rows[0];
      
      // Project creator has full access
      if (projectAccess.created_by === req.user.id) {
        next();
        return;
      }

      // Check team member permissions
      const userPermissions = projectAccess.permissions || [];
      const hasPermission = userPermissions.some((perm: any) => 
        perm.action === permission || perm.action === 'admin'
      );

      if (!hasPermission) {
        res.status(403).json({ error: `Insufficient permissions: ${permission} access required` });
        return;
      }

      next();
    } catch (error) {
      console.error('Project access check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};