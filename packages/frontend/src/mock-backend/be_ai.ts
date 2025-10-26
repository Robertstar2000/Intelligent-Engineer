// Mock Backend - AI Service
import { mockStore, persistAIProfiles } from './be_store';

export const aiService = {
  getProfiles() {
    return mockStore.aiProfiles;
  },

  getProfile(profileId: string) {
    const profile = mockStore.aiProfiles.find((p: any) => p.id === profileId);
    if (!profile) throw new Error('AI Profile not found');
    return profile;
  },

  createProfile(data: any) {
    const newProfile = {
      id: `profile-${Date.now()}`,
      name: data.name || 'New Profile',
      description: data.description || '',
      tuningSettings: data.tuningSettings || {},
      modelConfiguration: data.modelConfiguration || {},
      userId: data.userId || 'user',
      isBuiltIn: false,
      isShared: data.isShared || false,
      usage: { timesUsed: 0, lastUsed: new Date(), averageRating: 0, feedback: [] },
      createdAt: new Date(),
    };
    mockStore.aiProfiles.push(newProfile);
    persistAIProfiles();
    return newProfile;
  },

  updateProfile(profileId: string, data: any) {
    const index = mockStore.aiProfiles.findIndex((p: any) => p.id === profileId);
    if (index === -1) throw new Error('AI Profile not found');
    
    const profile = mockStore.aiProfiles[index];
    if (profile.isBuiltIn) throw new Error('Cannot modify built-in profile');
    
    mockStore.aiProfiles[index] = {
      ...profile,
      ...data,
      updatedAt: new Date(),
    };
    persistAIProfiles();
    return mockStore.aiProfiles[index];
  },

  deleteProfile(profileId: string) {
    const profile = mockStore.aiProfiles.find((p: any) => p.id === profileId);
    if (!profile) throw new Error('AI Profile not found');
    if (profile.isBuiltIn) throw new Error('Cannot delete built-in profile');
    
    mockStore.aiProfiles = mockStore.aiProfiles.filter((p: any) => p.id !== profileId);
    persistAIProfiles();
    return { success: true };
  },

  queryProject(projectId: string, data: any) {
    const query = data.query || '';
    
    // Simulate AI response based on query
    const responses: Record<string, string> = {
      'status': 'Based on your project data, I can see that you have 3 active phases with 75% completion rate. The team velocity is trending upward, and there are no critical blockers identified.',
      'progress': 'Your project is currently 68% complete. You have completed 3 out of 5 phases, with 2 phases remaining. The current velocity suggests completion in approximately 2 weeks.',
      'team': 'Your team consists of 5 members with an average productivity score of 8.5/10. Team collaboration metrics show strong communication and efficient task distribution.',
      'risks': 'I have identified 2 medium-severity risks and 1 low-severity risk. The main concerns are schedule delays and technical complexity. Recommended actions include adding buffer time and conducting technical spikes.',
      'default': 'Based on your project data, everything appears to be on track. The team is performing well, and there are no critical issues at this time. Would you like me to provide more specific information about any aspect of your project?',
    };

    let answer = responses.default;
    for (const [key, value] of Object.entries(responses)) {
      if (query.toLowerCase().includes(key)) {
        answer = value;
        break;
      }
    }

    return {
      answer,
      confidence: 0.85,
      sources: ['Project Analytics', 'Team Performance Data', 'Historical Trends'],
      suggestedFollowUps: [
        'What are the upcoming milestones?',
        'Show me team performance trends',
        'Are there any risks I should be aware of?',
        'How can we improve our velocity?',
      ],
      data: {
        projectId,
        query,
        timestamp: new Date().toISOString(),
      },
    };
  },
};
