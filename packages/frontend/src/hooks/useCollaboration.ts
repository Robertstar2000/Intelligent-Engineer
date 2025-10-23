import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  CollaborationSession, 
  Change, 
  CursorPosition, 
  Selection, 
  ActiveUser,
  EditConflict 
} from '@shared/types';

interface UseCollaborationOptions {
  projectId: string;
  documentId: string;
  onDocumentChange?: (change: Change) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
  onSelectionUpdate?: (selection: Selection) => void;
  onUserJoined?: (user: ActiveUser) => void;
  onUserLeft?: (userId: string) => void;
  onConflictDetected?: (conflict: EditConflict) => void;
  onError?: (error: string) => void;
}

interface UseCollaborationReturn {
  isConnected: boolean;
  session: CollaborationSession | null;
  activeUsers: ActiveUser[];
  cursors: CursorPosition[];
  selections: Selection[];
  conflicts: EditConflict[];
  sendChange: (change: Omit<Change, 'id' | 'sessionId' | 'userId' | 'timestamp' | 'sequenceNumber'>) => void;
  updateCursor: (line: number, column: number) => void;
  updateSelection: (startLine: number, startColumn: number, endLine: number, endColumn: number) => void;
  updateActivity: (location?: string) => void;
  disconnect: () => void;
}

export const useCollaboration = (options: UseCollaborationOptions): UseCollaborationReturn => {
  const {
    projectId,
    documentId,
    onDocumentChange,
    onCursorUpdate,
    onSelectionUpdate,
    onUserJoined,
    onUserLeft,
    onConflictDetected,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [conflicts, setConflicts] = useState<EditConflict[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      onError?.('Authentication token not found');
      return;
    }

    // Create socket connection
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
      
      // Join collaboration session
      socket.emit('join-session', { projectId, documentId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
      setActiveUsers([]);
      setCursors([]);
      setSelections([]);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      onError?.(`Connection failed: ${error.message}`);
    });

    // Session event handlers
    socket.on('session-joined', (data: { sessionId: string; session: CollaborationSession }) => {
      console.log('Joined collaboration session:', data.sessionId);
      setSession(data.session);
      setActiveUsers(data.session.activeUsers);
      setCursors(data.session.cursors);
      setSelections(data.session.selections);
      setConflicts(data.session.conflicts);
    });

    socket.on('user-joined', (data: { user: ActiveUser }) => {
      console.log('User joined:', data.user.name);
      setActiveUsers(prev => {
        const filtered = prev.filter(u => u.id !== data.user.id);
        return [...filtered, data.user];
      });
      onUserJoined?.(data.user);
    });

    socket.on('user-left', (data: { userId: string }) => {
      console.log('User left:', data.userId);
      setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
      setCursors(prev => prev.filter(c => c.userId !== data.userId));
      setSelections(prev => prev.filter(s => s.userId !== data.userId));
      onUserLeft?.(data.userId);
    });

    // Document change handlers
    socket.on('document-change', (data: { change: Change }) => {
      console.log('Document change received:', data.change);
      onDocumentChange?.(data.change);
    });

    socket.on('cursor-update', (data: { cursor: CursorPosition }) => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== data.cursor.userId);
        return [...filtered, data.cursor];
      });
      onCursorUpdate?.(data.cursor);
    });

    socket.on('selection-update', (data: { selection: Selection }) => {
      setSelections(prev => {
        const filtered = prev.filter(s => s.userId !== data.selection.userId);
        return [...filtered, data.selection];
      });
      onSelectionUpdate?.(data.selection);
    });

    socket.on('user-activity', (data: { userId: string; lastActivity: Date; location?: string }) => {
      setActiveUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, lastActivity: new Date(data.lastActivity), currentLocation: data.location }
          : user
      ));
    });

    // Conflict handling
    socket.on('conflict-detected', (data: { conflict: EditConflict }) => {
      console.log('Conflict detected:', data.conflict);
      setConflicts(prev => [...prev, data.conflict]);
      onConflictDetected?.(data.conflict);
    });

    // Error handling
    socket.on('error', (data: { message: string }) => {
      console.error('Collaboration error:', data.message);
      onError?.(data.message);
    });

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [projectId, documentId]);

  // Send document change
  const sendChange = useCallback((change: Omit<Change, 'id' | 'sessionId' | 'userId' | 'timestamp' | 'sequenceNumber'>) => {
    if (!socketRef.current || !session) {
      console.warn('Cannot send change: not connected to session');
      return;
    }

    socketRef.current.emit('document-change', {
      sessionId: session.id,
      change,
    });
  }, [session]);

  // Update cursor position
  const updateCursor = useCallback((line: number, column: number) => {
    if (!socketRef.current || !session) return;

    const cursor: Omit<CursorPosition, 'userId' | 'timestamp'> = {
      line,
      column,
    };

    socketRef.current.emit('cursor-update', {
      sessionId: session.id,
      cursor,
    });
  }, [session]);

  // Update text selection
  const updateSelection = useCallback((startLine: number, startColumn: number, endLine: number, endColumn: number) => {
    if (!socketRef.current || !session) return;

    const selection: Omit<Selection, 'userId' | 'timestamp'> = {
      startLine,
      startColumn,
      endLine,
      endColumn,
    };

    socketRef.current.emit('selection-update', {
      sessionId: session.id,
      selection,
    });
  }, [session]);

  // Update user activity
  const updateActivity = useCallback((location?: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('activity-update', { location });
  }, []);

  // Disconnect from collaboration
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (session) {
        socketRef.current.emit('leave-session', { sessionId: session.id });
      }
      socketRef.current.disconnect();
    }
  }, [session]);

  return {
    isConnected,
    session,
    activeUsers,
    cursors,
    selections,
    conflicts,
    sendChange,
    updateCursor,
    updateSelection,
    updateActivity,
    disconnect,
  };
};