// Mock Backend - Team Service
import { mockStore, persistTeamMembers } from './be_store';

export const teamService = {
  getMembers(projectId: string) {
    return mockStore.teamMembers[projectId] || [];
  },

  getActiveUsers(projectId: string) {
    const members = mockStore.teamMembers[projectId] || [];
    return members.filter((m: any) => m.isActive);
  },

  inviteMember(projectId: string, data: any) {
    const newMember = {
      id: `member-${Date.now()}`,
      name: data.name || data.email.split('@')[0],
      email: data.email,
      role: data.role || 'developer',
      isActive: false,
      status: 'invited',
      joinedAt: new Date().toISOString(),
      invitedAt: new Date().toISOString(),
    };
    
    if (!mockStore.teamMembers[projectId]) {
      mockStore.teamMembers[projectId] = [];
    }
    
    mockStore.teamMembers[projectId].push(newMember);
    persistTeamMembers();
    return newMember;
  },

  updateMemberRole(projectId: string, memberId: string, data: any) {
    const members = mockStore.teamMembers[projectId];
    if (!members) throw new Error('Project not found');
    
    const member = members.find((m: any) => m.id === memberId);
    if (!member) throw new Error('Member not found');
    
    member.role = data.role;
    member.updatedAt = new Date().toISOString();
    persistTeamMembers();
    return member;
  },

  removeMember(projectId: string, memberId: string) {
    if (!mockStore.teamMembers[projectId]) {
      throw new Error('Project not found');
    }
    
    mockStore.teamMembers[projectId] = mockStore.teamMembers[projectId].filter(
      (m: any) => m.id !== memberId
    );
    persistTeamMembers();
    return { success: true };
  },

  acceptInvitation(projectId: string, memberId: string) {
    const members = mockStore.teamMembers[projectId];
    if (!members) throw new Error('Project not found');
    
    const member = members.find((m: any) => m.id === memberId);
    if (!member) throw new Error('Member not found');
    
    member.isActive = true;
    member.status = 'active';
    member.acceptedAt = new Date().toISOString();
    persistTeamMembers();
    return member;
  },
};
