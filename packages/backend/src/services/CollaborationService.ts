import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../database/connection';
import { auditLog } from '../middleware/logging';
import { 
  CollaborationSession, 
  Change, 
  CursorPosition, 
  Selection, 
  EditConflict,
  ActiveUser 
} from '@shared/types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export class CollaborationService {
  private io: SocketIOServer;
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.security.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketAuthentication();
    this.setupEventHandlers();
  }

  private setupSocketAuthentication() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        // Verify user exists and is active
        const userResult = await query(
          'SELECT id, name, email FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return next(new Error('User not found or inactive'));
        }

        const user = userResult.rows[0];
        socket.userId = user.id;
        socket.userName = user.name;
        socket.userEmail = user.email;

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userName} connected (${socket.id})`);

      // Track user socket connections
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);
      }

      // Join collaboration session
      socket.on('join-session', async (data: { projectId: string; documentId: string }) => {
        await this.handleJoinSession(socket, data);
      });

      // Leave collaboration session
      socket.on('leave-session', async (data: { sessionId: string }) => {
        await this.handleLeaveSession(socket, data);
      });

      // Document changes
      socket.on('document-change', async (data: { sessionId: string; change: Change }) => {
        await this.handleDocumentChange(socket, data);
      });

      // Cursor position updates
      socket.on('cursor-update', async (data: { sessionId: string; cursor: CursorPosition }) => {
        await this.handleCursorUpdate(socket, data);
      });

      // Text selection updates
      socket.on('selection-update', async (data: { sessionId: string; selection: Selection }) => {
        await this.handleSelectionUpdate(socket, data);
      });

      // User activity updates
      socket.on('activity-update', async (data: { location?: string }) => {
        await this.handleActivityUpdate(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  private async handleJoinSession(socket: AuthenticatedSocket, data: { projectId: string; documentId: string }) {
    try {
      const { projectId, documentId } = data;

      // Check if user has access to the project
      const hasAccess = await this.checkProjectAccess(projectId, socket.userId!);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to project' });
        return;
      }

      // Get or create collaboration session
      const sessionId = `${projectId}-${documentId}`;
      let session = this.activeSessions.get(sessionId);

      if (!session) {
        session = await this.createCollaborationSession(projectId, documentId);
        this.activeSessions.set(sessionId, session);
      }

      // Add user to session
      const activeUser: ActiveUser = {
        id: socket.userId!,
        name: socket.userName!,
        email: socket.userEmail!,
        avatar: undefined, // TODO: Get from user profile
        role: await this.getUserRole(projectId, socket.userId!),
        isOnline: true,
        lastActivity: new Date(),
        currentLocation: documentId,
      };

      // Update session with new user
      session.activeUsers = session.activeUsers.filter(u => u.id !== socket.userId);
      session.activeUsers.push(activeUser);
      session.lastActivity = new Date();

      // Join socket room
      socket.join(sessionId);

      // Notify other users
      socket.to(sessionId).emit('user-joined', { user: activeUser });

      // Send current session state to joining user
      socket.emit('session-joined', {
        sessionId,
        session: {
          ...session,
          // Don't send full change history, just recent changes
          changes: session.changes.slice(-50),
        },
      });

      // Update database
      await this.updateCollaborationSession(session);

      // Audit log
      auditLog('JOIN_COLLABORATION', 'session', sessionId, socket.userId!, {
        projectId,
        documentId,
      });

    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join collaboration session' });
    }
  }

  private async handleLeaveSession(socket: AuthenticatedSocket, data: { sessionId: string }) {
    try {
      const { sessionId } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return;
      }

      // Remove user from session
      session.activeUsers = session.activeUsers.filter(u => u.id !== socket.userId);
      session.lastActivity = new Date();

      // Leave socket room
      socket.leave(sessionId);

      // Notify other users
      socket.to(sessionId).emit('user-left', { userId: socket.userId });

      // Clean up empty sessions
      if (session.activeUsers.length === 0) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
      }

      // Update database
      await this.updateCollaborationSession(session);

    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }

  private async handleDocumentChange(socket: AuthenticatedSocket, data: { sessionId: string; change: Change }) {
    try {
      const { sessionId, change } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Validate change
      if (!this.validateChange(change)) {
        socket.emit('error', { message: 'Invalid change format' });
        return;
      }

      // Add metadata to change
      const enhancedChange: Change = {
        ...change,
        id: this.generateChangeId(),
        sessionId,
        userId: socket.userId!,
        timestamp: new Date(),
        sequenceNumber: session.changes.length,
        dependencies: [],
        conflictsWith: [],
        resolution: 'auto' as const,
        clientId: socket.id,
        deviceInfo: {}, // TODO: Extract from socket handshake
        networkLatency: 0, // TODO: Calculate based on ping
      };

      // Check for conflicts with recent changes
      const conflicts = this.detectConflicts(enhancedChange, session.changes.slice(-10));
      if (conflicts.length > 0) {
        enhancedChange.conflictsWith = conflicts.map(c => c.id);
        enhancedChange.resolution = 'manual' as const;
        
        // Create conflict record
        const conflict: EditConflict = {
          id: this.generateChangeId(),
          sessionId,
          conflictingChanges: [enhancedChange, ...conflicts],
          detectedAt: new Date(),
          status: 'pending',
          resolution: null,
        };

        session.conflicts.push(conflict);
        
        // Notify all users about the conflict
        this.io.to(sessionId).emit('conflict-detected', { conflict });
      } else {
        // Apply change to session
        session.changes.push(enhancedChange);
        session.lastActivity = new Date();

        // Broadcast change to other users in the session
        socket.to(sessionId).emit('document-change', { change: enhancedChange });

        // Update database
        await this.updateCollaborationSession(session);
      }

    } catch (error) {
      console.error('Error handling document change:', error);
      socket.emit('error', { message: 'Failed to process document change' });
    }
  }

  private async handleCursorUpdate(socket: AuthenticatedSocket, data: { sessionId: string; cursor: CursorPosition }) {
    try {
      const { sessionId, cursor } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return;
      }

      // Update cursor position in session
      const enhancedCursor: CursorPosition = {
        ...cursor,
        userId: socket.userId!,
        timestamp: new Date(),
      };

      // Remove old cursor position for this user
      session.cursors = session.cursors.filter(c => c.userId !== socket.userId);
      session.cursors.push(enhancedCursor);

      // Broadcast cursor update to other users
      socket.to(sessionId).emit('cursor-update', { cursor: enhancedCursor });

    } catch (error) {
      console.error('Error handling cursor update:', error);
    }
  }

  private async handleSelectionUpdate(socket: AuthenticatedSocket, data: { sessionId: string; selection: Selection }) {
    try {
      const { sessionId, selection } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return;
      }

      // Update selection in session
      const enhancedSelection: Selection = {
        ...selection,
        userId: socket.userId!,
        timestamp: new Date(),
      };

      // Remove old selection for this user
      session.selections = session.selections.filter(s => s.userId !== socket.userId);
      session.selections.push(enhancedSelection);

      // Broadcast selection update to other users
      socket.to(sessionId).emit('selection-update', { selection: enhancedSelection });

    } catch (error) {
      console.error('Error handling selection update:', error);
    }
  }

  private async handleActivityUpdate(socket: AuthenticatedSocket, data: { location?: string }) {
    try {
      if (!socket.userId) return;

      // Update user activity in database
      await query(
        'UPDATE users SET last_activity = NOW() WHERE id = $1',
        [socket.userId]
      );

      // Update activity in all active sessions for this user
      for (const [sessionId, session] of this.activeSessions) {
        const userIndex = session.activeUsers.findIndex(u => u.id === socket.userId);
        if (userIndex !== -1) {
          session.activeUsers[userIndex].lastActivity = new Date();
          if (data.location) {
            session.activeUsers[userIndex].currentLocation = data.location;
          }

          // Notify other users in the session
          socket.to(sessionId).emit('user-activity', {
            userId: socket.userId,
            lastActivity: new Date(),
            location: data.location,
          });
        }
      }

    } catch (error) {
      console.error('Error handling activity update:', error);
    }
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    console.log(`User ${socket.userName} disconnected (${socket.id})`);

    // Remove socket from user tracking
    if (socket.userId) {
      const userSockets = this.userSockets.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(socket.userId);
        }
      }
    }

    // Remove user from all active sessions if no other sockets
    if (socket.userId && !this.userSockets.has(socket.userId)) {
      for (const [sessionId, session] of this.activeSessions) {
        const userIndex = session.activeUsers.findIndex(u => u.id === socket.userId);
        if (userIndex !== -1) {
          session.activeUsers.splice(userIndex, 1);
          session.lastActivity = new Date();

          // Notify other users
          socket.to(sessionId).emit('user-left', { userId: socket.userId });

          // Clean up empty sessions
          if (session.activeUsers.length === 0) {
            session.isActive = false;
            this.activeSessions.delete(sessionId);
          }
        }
      }
    }
  }

  // Helper methods
  private async checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(`
        SELECT 1 FROM projects p
        LEFT JOIN project_team_members ptm ON p.id = ptm.project_id AND ptm.user_id = $2 AND ptm.is_active = true
        WHERE p.id = $1 AND (p.created_by = $2 OR ptm.id IS NOT NULL)
      `, [projectId, userId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  private async getUserRole(projectId: string, userId: string): Promise<any> {
    try {
      const result = await query(`
        SELECT role FROM project_team_members 
        WHERE project_id = $1 AND user_id = $2 AND is_active = true
      `, [projectId, userId]);

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].role);
      }

      // Check if user is project owner
      const ownerResult = await query(
        'SELECT 1 FROM projects WHERE id = $1 AND created_by = $2',
        [projectId, userId]
      );

      if (ownerResult.rows.length > 0) {
        return {
          id: 'owner',
          name: 'Project Owner',
          accessLevel: 'owner',
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  private async createCollaborationSession(projectId: string, documentId: string): Promise<CollaborationSession> {
    const sessionId = `${projectId}-${documentId}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      documentId,
      sessionType: 'document' as const,
      activeUsers: [],
      invitedUsers: [],
      permissions: [],
      document: {
        id: documentId,
        content: '',
        format: 'markdown' as const,
        version: '1.0.0',
        lastModified: new Date(),
        modifiedBy: 'system',
      }, // TODO: Load document content
      changes: [],
      conflicts: [],
      cursors: [],
      selections: [],
      annotations: [],
      startedAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      maxParticipants: 10,
      recordingEnabled: false,
      changeHistory: [],
      snapshots: [],
    };

    // Save to database
    await query(`
      INSERT INTO collaboration_sessions (
        id, project_id, document_id, session_type, started_at, last_activity, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [sessionId, projectId, documentId, 'document', session.startedAt, session.lastActivity, true]);

    return session;
  }

  private async updateCollaborationSession(session: CollaborationSession): Promise<void> {
    try {
      await query(`
        UPDATE collaboration_sessions 
        SET 
          active_users = $1,
          changes = $2,
          conflicts = $3,
          cursors = $4,
          selections = $5,
          last_activity = $6,
          is_active = $7
        WHERE id = $8
      `, [
        JSON.stringify(session.activeUsers),
        JSON.stringify(session.changes.slice(-100)), // Keep only recent changes
        JSON.stringify(session.conflicts),
        JSON.stringify(session.cursors),
        JSON.stringify(session.selections),
        session.lastActivity,
        session.isActive,
        session.id,
      ]);
    } catch (error) {
      console.error('Error updating collaboration session:', error);
    }
  }

  private validateChange(change: any): boolean {
    return change && 
           typeof change.type === 'string' &&
           typeof change.operation === 'string' &&
           typeof change.path === 'string';
  }

  private detectConflicts(change: Change, recentChanges: Change[]): Change[] {
    // Simple conflict detection based on overlapping paths
    return recentChanges.filter(recentChange => 
      recentChange.path === change.path &&
      recentChange.userId !== change.userId &&
      Math.abs(new Date(recentChange.timestamp).getTime() - new Date().getTime()) < 5000 // 5 seconds
    );
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for external use
  public getActiveUsers(projectId: string): ActiveUser[] {
    const activeUsers: ActiveUser[] = [];
    
    for (const session of this.activeSessions.values()) {
      if (session.projectId === projectId) {
        activeUsers.push(...session.activeUsers);
      }
    }

    // Remove duplicates
    const uniqueUsers = activeUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return uniqueUsers;
  }

  public getSessionCount(): number {
    return this.activeSessions.size;
  }

  public getConnectedUserCount(): number {
    return this.userSockets.size;
  }
}