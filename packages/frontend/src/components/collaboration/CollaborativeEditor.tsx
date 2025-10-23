import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Change, CursorPosition, Selection, ActiveUser, EditConflict } from '@shared/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Users, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Eye, 
  Edit3,
  Save,
  Undo,
  Redo
} from 'lucide-react';
import { ActiveUsersIndicator } from '../team/ActiveUsersIndicator';
import { ConflictResolutionModal } from './ConflictResolutionModal';

interface CollaborativeEditorProps {
  projectId: string;
  documentId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  language?: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  projectId,
  documentId,
  initialContent,
  onContentChange,
  onSave,
  readOnly = false,
  language = 'markdown'
}) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<EditConflict | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [textSelection, setTextSelection] = useState<{ start: number; end: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastChangeRef = useRef<string>(content);

  const {
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
    disconnect
  } = useCollaboration({
    projectId,
    documentId,
    onDocumentChange: handleRemoteChange,
    onCursorUpdate: handleRemoteCursor,
    onSelectionUpdate: handleRemoteSelection,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onConflictDetected: handleConflictDetected,
    onError: handleCollaborationError,
  });

  // Handle remote document changes
  function handleRemoteChange(change: Change) {
    console.log('Applying remote change:', change);
    
    // Apply operational transformation
    const newContent = applyChange(content, change);
    setContent(newContent);
    onContentChange(newContent);
    lastChangeRef.current = newContent;
  }

  function handleRemoteCursor(cursor: CursorPosition) {
    // Remote cursor updates are handled by the cursors state
    console.log('Remote cursor update:', cursor);
  }

  function handleRemoteSelection(selection: Selection) {
    // Remote selection updates are handled by the selections state
    console.log('Remote selection update:', selection);
  }

  function handleUserJoined(user: ActiveUser) {
    console.log('User joined collaboration:', user.name);
  }

  function handleUserLeft(userId: string) {
    console.log('User left collaboration:', userId);
  }

  function handleConflictDetected(conflict: EditConflict) {
    console.log('Conflict detected:', conflict);
    setSelectedConflict(conflict);
  }

  function handleCollaborationError(error: string) {
    console.error('Collaboration error:', error);
  }

  // Apply operational transformation change
  const applyChange = (currentContent: string, change: Change): string => {
    try {
      switch (change.operation) {
        case 'create':
        case 'update':
          // For simple text replacement
          if (change.path === 'content') {
            return change.newValue as string;
          }
          break;
        case 'delete':
          // Handle deletion
          break;
        default:
          console.warn('Unknown change operation:', change.operation);
      }
      return currentContent;
    } catch (error) {
      console.error('Error applying change:', error);
      return currentContent;
    }
  };

  // Handle local content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (readOnly) return;

    setContent(newContent);
    setHasUnsavedChanges(true);
    onContentChange(newContent);

    // Send change to other collaborators
    if (newContent !== lastChangeRef.current) {
      const change: Omit<Change, 'id' | 'sessionId' | 'userId' | 'timestamp' | 'sequenceNumber'> = {
        type: 'update',
        operation: 'update',
        path: 'content',
        oldValue: lastChangeRef.current,
        newValue: newContent,
        dependencies: [],
        conflictsWith: [],
        resolution: 'auto',
        clientId: '',
        deviceInfo: {},
        networkLatency: 0,
      };

      sendChange(change);
      lastChangeRef.current = newContent;
    }
  }, [readOnly, onContentChange, sendChange]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;

    setCursorPosition({ line, column });
    updateCursor(line, column);
  }, [updateCursor]);

  // Handle text selection changes
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      setTextSelection({ start, end });
      
      // Convert to line/column coordinates
      const textBeforeStart = textarea.value.substring(0, start);
      const textBeforeEnd = textarea.value.substring(0, end);
      
      const startLines = textBeforeStart.split('\n');
      const endLines = textBeforeEnd.split('\n');
      
      const startLine = startLines.length - 1;
      const startColumn = startLines[startLines.length - 1].length;
      const endLine = endLines.length - 1;
      const endColumn = endLines[endLines.length - 1].length;

      updateSelection(startLine, startColumn, endLine, endColumn);
    } else {
      setTextSelection(null);
    }
  }, [updateSelection]);

  // Handle save
  const handleSave = async () => {
    if (!onSave || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      await onSave(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update activity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivity(documentId);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [updateActivity, documentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Get user colors for cursors and selections
  const getUserColor = (userId: string): string => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    
    const userIndex = activeUsers.findIndex(u => u.id === userId);
    return colors[userIndex % colors.length] || '#6B7280';
  };

  return (
    <div className="space-y-4">
      {/* Collaboration Header */}
      <Card noPadding>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <Badge 
                variant={isConnected ? 'success' : 'error'} 
                size="sm"
                isLive={isConnected}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            {conflicts.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <Badge variant="warning" size="sm">
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {readOnly && (
              <Badge variant="info" size="sm">
                <Eye className="w-3 h-3 mr-1" />
                Read Only
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ActiveUsersIndicator activeUsers={activeUsers} maxVisible={3} />
            
            {!readOnly && (
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <Badge variant="warning" size="sm">
                    Unsaved changes
                  </Badge>
                )}
                
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  size="sm"
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="relative">
          {/* Remote cursors overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {cursors.map((cursor) => {
              const user = activeUsers.find(u => u.id === cursor.userId);
              if (!user) return null;

              return (
                <div
                  key={cursor.userId}
                  className="absolute"
                  style={{
                    // This is a simplified positioning - in a real implementation,
                    // you'd need to calculate the exact pixel position based on
                    // line height and character width
                    top: `${cursor.line * 1.5}rem`,
                    left: `${cursor.column * 0.6}rem`,
                  }}
                >
                  <div
                    className="w-0.5 h-5 animate-pulse"
                    style={{ backgroundColor: getUserColor(cursor.userId) }}
                  />
                  <div
                    className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
                    style={{ backgroundColor: getUserColor(cursor.userId) }}
                  >
                    {user.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Text Editor */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={handleSelectionChange}
            onKeyUp={handleCursorChange}
            onClick={handleCursorChange}
            readOnly={readOnly}
            className="w-full h-96 p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white"
            placeholder={readOnly ? "Document content will appear here..." : "Start typing to collaborate..."}
            spellCheck={false}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-2 px-4 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <span>Line {cursorPosition.line + 1}, Column {cursorPosition.column + 1}</span>
            {textSelection && (
              <span>
                Selected: {textSelection.end - textSelection.start} characters
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
            {session && (
              <span>Session: {session.id.split('-').pop()}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <ConflictResolutionModal
          conflict={selectedConflict}
          onResolve={(resolution) => {
            // TODO: Implement conflict resolution
            console.log('Resolving conflict:', resolution);
            setSelectedConflict(null);
          }}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
};