import { query } from '../database/connection';
import { createHash, createHmac } from 'crypto';
import { AuditEvent } from '@shared/types';

export interface ChangeControlRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  changeType: 'phase' | 'sprint' | 'document' | 'team' | 'settings';
  description: string;
  justification: string;
  impactAssessment: string;
  proposedChanges: any;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  approvers: string[];
  approvals: Approval[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Approval {
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

export interface AuditSearchCriteria {
  projectId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class AuditService {
  private readonly SECRET_KEY = process.env.AUDIT_SECRET_KEY || 'default-audit-secret-key';

  // Log audit event with cryptographic signature
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes: any[],
    context: any = {}
  ): Promise<string> {
    try {
      const eventId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();

      // Create event data
      const eventData = {
        id: eventId,
        timestamp,
        userId,
        action,
        resourceType,
        resourceId,
        changes,
        context,
      };

      // Generate cryptographic signature
      const signature = this.generateSignature(eventData);

      // Store audit event
      await query(`
        INSERT INTO audit_events (
          id, timestamp, user_id, action, resource_type, resource_id,
          changes, signature, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        eventId,
        timestamp,
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(changes),
        JSON.stringify(signature),
        JSON.stringify(context),
      ]);

      return eventId;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  // Generate cryptographic signature for tamper-evident logging
  private generateSignature(eventData: any): any {
    // Create deterministic string representation
    const dataString = JSON.stringify(eventData, Object.keys(eventData).sort());
    
    // Generate hash
    const hash = createHash('sha256').update(dataString).digest('hex');
    
    // Generate HMAC signature
    const hmac = createHmac('sha256', this.SECRET_KEY).update(dataString).digest('hex');
    
    return {
      algorithm: 'HMAC-SHA256',
      hash,
      hmac,
      timestamp: new Date().toISOString(),
    };
  }

  // Verify audit event integrity
  async verifyAuditEvent(eventId: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT * FROM audit_events WHERE id = $1',
        [eventId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const event = result.rows[0];
      const storedSignature = JSON.parse(event.signature);

      // Reconstruct event data
      const eventData = {
        id: event.id,
        timestamp: event.timestamp,
        userId: event.user_id,
        action: event.action,
        resourceType: event.resource_type,
        resourceId: event.resource_id,
        changes: JSON.parse(event.changes),
        context: JSON.parse(event.context),
      };

      // Generate signature for verification
      const verificationSignature = this.generateSignature(eventData);

      // Compare signatures
      return storedSignature.hmac === verificationSignature.hmac;
    } catch (error) {
      console.error('Error verifying audit event:', error);
      return false;
    }
  }

  // Create change control request
  async createChangeControlRequest(
    projectId: string,
    requestedBy: string,
    changeType: string,
    description: string,
    justification: string,
    impactAssessment: string,
    proposedChanges: any,
    requiredApprovers: string[]
  ): Promise<ChangeControlRequest> {
    try {
      const requestId = `ccr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const request: ChangeControlRequest = {
        id: requestId,
        projectId,
        requestedBy,
        changeType: changeType as any,
        description,
        justification,
        impactAssessment,
        proposedChanges,
        status: 'pending',
        approvers: requiredApprovers,
        approvals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await query(`
        INSERT INTO change_control_requests (
          id, project_id, requested_by, change_type, description,
          justification, impact_assessment, proposed_changes,
          status, approvers, approvals, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        requestId,
        projectId,
        requestedBy,
        changeType,
        description,
        justification,
        impactAssessment,
        JSON.stringify(proposedChanges),
        'pending',
        JSON.stringify(requiredApprovers),
        JSON.stringify([]),
        request.createdAt,
        request.updatedAt,
      ]);

      // Log audit event
      await this.logAuditEvent(
        requestedBy,
        'CREATE_CHANGE_REQUEST',
        'change_control',
        requestId,
        [{ field: 'status', oldValue: null, newValue: 'pending' }],
        { changeType, description }
      );

      return request;
    } catch (error) {
      console.error('Error creating change control request:', error);
      throw error;
    }
  }

  // Approve or reject change control request
  async processChangeControlApproval(
    requestId: string,
    approverId: string,
    approverName: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<ChangeControlRequest> {
    try {
      // Get current request
      const result = await query(
        'SELECT * FROM change_control_requests WHERE id = $1',
        [requestId]
      );

      if (result.rows.length === 0) {
        throw new Error('Change control request not found');
      }

      const request = result.rows[0];
      const approvals: Approval[] = JSON.parse(request.approvals || '[]');
      const approvers: string[] = JSON.parse(request.approvers || '[]');

      // Check if approver is authorized
      if (!approvers.includes(approverId)) {
        throw new Error('User not authorized to approve this request');
      }

      // Check if already approved by this user
      if (approvals.some(a => a.approverId === approverId)) {
        throw new Error('User has already provided approval decision');
      }

      // Add approval
      const approval: Approval = {
        approverId,
        approverName,
        decision,
        comments,
        timestamp: new Date(),
      };

      approvals.push(approval);

      // Determine new status
      let newStatus = request.status;
      if (decision === 'rejected') {
        newStatus = 'rejected';
      } else if (approvals.filter(a => a.decision === 'approved').length === approvers.length) {
        newStatus = 'approved';
      }

      // Update request
      await query(`
        UPDATE change_control_requests
        SET approvals = $1, status = $2, updated_at = NOW()
        WHERE id = $3
      `, [JSON.stringify(approvals), newStatus, requestId]);

      // Log audit event
      await this.logAuditEvent(
        approverId,
        'APPROVE_CHANGE_REQUEST',
        'change_control',
        requestId,
        [{ field: 'status', oldValue: request.status, newValue: newStatus }],
        { decision, comments }
      );

      return {
        ...request,
        approvals,
        status: newStatus,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error processing change control approval:', error);
      throw error;
    }
  }

  // Implement approved change
  async implementChange(requestId: string, implementedBy: string): Promise<void> {
    try {
      const result = await query(
        'SELECT * FROM change_control_requests WHERE id = $1',
        [requestId]
      );

      if (result.rows.length === 0) {
        throw new Error('Change control request not found');
      }

      const request = result.rows[0];

      if (request.status !== 'approved') {
        throw new Error('Change request must be approved before implementation');
      }

      // Update status
      await query(`
        UPDATE change_control_requests
        SET status = 'implemented', updated_at = NOW()
        WHERE id = $1
      `, [requestId]);

      // Log audit event
      await this.logAuditEvent(
        implementedBy,
        'IMPLEMENT_CHANGE',
        'change_control',
        requestId,
        [{ field: 'status', oldValue: 'approved', newValue: 'implemented' }],
        { implementedBy }
      );
    } catch (error) {
      console.error('Error implementing change:', error);
      throw error;
    }
  }

  // Search audit trail
  async searchAuditTrail(criteria: AuditSearchCriteria): Promise<AuditEvent[]> {
    try {
      let queryText = 'SELECT * FROM audit_events WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (criteria.projectId) {
        queryText += ` AND resource_id = $${paramIndex}`;
        params.push(criteria.projectId);
        paramIndex++;
      }

      if (criteria.userId) {
        queryText += ` AND user_id = $${paramIndex}`;
        params.push(criteria.userId);
        paramIndex++;
      }

      if (criteria.action) {
        queryText += ` AND action = $${paramIndex}`;
        params.push(criteria.action);
        paramIndex++;
      }

      if (criteria.resourceType) {
        queryText += ` AND resource_type = $${paramIndex}`;
        params.push(criteria.resourceType);
        paramIndex++;
      }

      if (criteria.startDate) {
        queryText += ` AND timestamp >= $${paramIndex}`;
        params.push(criteria.startDate);
        paramIndex++;
      }

      if (criteria.endDate) {
        queryText += ` AND timestamp <= $${paramIndex}`;
        params.push(criteria.endDate);
        paramIndex++;
      }

      queryText += ' ORDER BY timestamp DESC';

      if (criteria.limit) {
        queryText += ` LIMIT $${paramIndex}`;
        params.push(criteria.limit);
      } else {
        queryText += ' LIMIT 100';
      }

      const result = await query(queryText, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        changes: JSON.parse(row.changes),
        signature: JSON.parse(row.signature),
        context: JSON.parse(row.context),
      }));
    } catch (error) {
      console.error('Error searching audit trail:', error);
      throw error;
    }
  }

  // Generate audit report
  async generateAuditReport(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const events = await this.searchAuditTrail({
        projectId,
        startDate,
        endDate,
        limit: 1000,
      });

      // Aggregate statistics
      const actionCounts = events.reduce((acc: any, event) => {
        acc[event.action] = (acc[event.action] || 0) + 1;
        return acc;
      }, {});

      const userActivity = events.reduce((acc: any, event) => {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
        return acc;
      }, {});

      return {
        projectId,
        period: { startDate, endDate },
        totalEvents: events.length,
        actionBreakdown: actionCounts,
        userActivity,
        events: events.slice(0, 100), // Include first 100 events
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  // Get change control requests for a project
  async getChangeControlRequests(projectId: string, status?: string): Promise<ChangeControlRequest[]> {
    try {
      let queryText = 'SELECT * FROM change_control_requests WHERE project_id = $1';
      const params: any[] = [projectId];

      if (status) {
        queryText += ' AND status = $2';
        params.push(status);
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query(queryText, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        requestedBy: row.requested_by,
        changeType: row.change_type,
        description: row.description,
        justification: row.justification,
        impactAssessment: row.impact_assessment,
        proposedChanges: JSON.parse(row.proposed_changes),
        status: row.status,
        approvers: JSON.parse(row.approvers),
        approvals: JSON.parse(row.approvals),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting change control requests:', error);
      throw error;
    }
  }
}
