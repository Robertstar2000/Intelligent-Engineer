import { useState, useEffect, useCallback } from 'react';
import { Phase, TeamMember, TaskAssignment } from '@shared/types';

interface UsePhaseCollaborationOptions {
  projectId: string;
  phaseId: string;
  onPhaseUpdate?: (phase: Phase) => void;
}

interface UsePhaseCollaborationReturn {
  teamMembers: TeamMember[];
  phaseTasks: TaskAssignment[];
  activeUsers: any[];
  isLoading: boolean;
  error: string | null;
  assignTask: (sprintId: string, assignedTo: string, role: any, estimatedHours?: number) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  addPhaseComment: (content: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const usePhaseCollaboration = (options: UsePhaseCollaborationOptions): UsePhaseCollaborationReturn => {
  const { projectId, phaseId, onPhaseUpdate } = options;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [phaseTasks, setPhaseTasks] = useState<TaskAssignment[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    // Set up polling for active users
    const interval = setInterval(loadActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [projectId, phaseId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadTeamMembers(),
        loadPhaseTasks(),
        loadActiveUsers(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaboration data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch(`/api/team/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load team members');
      }

      const members = await response.json();
      setTeamMembers(members);
    } catch (err) {
      console.error('Error loading team members:', err);
      throw err;
    }
  };

  const loadPhaseTasks = async () => {
    try {
      const response = await fetch(`/api/tasks/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load phase tasks');
      }

      const allTasks = await response.json();
      // Filter tasks for this specific phase
      const phaseSpecificTasks = allTasks.filter((task: TaskAssignment) => task.phaseId === phaseId);
      setPhaseTasks(phaseSpecificTasks);
    } catch (err) {
      console.error('Error loading phase tasks:', err);
      throw err;
    }
  };

  const loadActiveUsers = async () => {
    try {
      const response = await fetch(`/api/team/${projectId}/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setActiveUsers(users);
      }
    } catch (err) {
      console.error('Error loading active users:', err);
      // Don't throw here as this is not critical
    }
  };

  const assignTask = useCallback(async (
    sprintId: string,
    assignedTo: string,
    role: any,
    estimatedHours?: number
  ) => {
    try {
      const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          projectId,
          phaseId,
          sprintId,
          assignedTo,
          assignedRole: role,
          estimatedHours,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign task');
      }

      const newTask = await response.json();
      setPhaseTasks(prev => [...prev, newTask]);

      // Refresh data to get updated state
      await loadPhaseTasks();
    } catch (err) {
      console.error('Error assigning task:', err);
      throw err;
    }
  }, [projectId, phaseId]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }

      const updatedTask = await response.json();
      
      // Update local state
      setPhaseTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      throw err;
    }
  }, []);

  const addPhaseComment = useCallback(async (content: string) => {
    try {
      // TODO: Implement phase comments API
      console.log('Adding phase comment:', content);
      
      // For now, this is a placeholder
      // In a real implementation, you would:
      // 1. Send the comment to the backend
      // 2. Update the phase with the new comment
      // 3. Notify other collaborators via WebSocket
      
    } catch (err) {
      console.error('Error adding phase comment:', err);
      throw err;
    }
  }, [projectId, phaseId]);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [projectId, phaseId]);

  return {
    teamMembers,
    phaseTasks,
    activeUsers,
    isLoading,
    error,
    assignTask,
    updateTaskStatus,
    addPhaseComment,
    refreshData,
  };
};