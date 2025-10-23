import { AIProfile, TuningSettings } from '@shared/types';
import { AIProfileRepository } from '../database/repositories/AIProfileRepository';
import { auditLog } from '../middleware/logging';

/**
 * AI Profile Service for managing saved AI tuning configurations
 * Maintains backward compatibility with existing tuning parameters
 */
export class AIProfileService {
  private aiProfileRepository: AIProfileRepository;

  constructor() {
    this.aiProfileRepository = new AIProfileRepository();
  }

  /**
   * Create a new AI profile from tuning settings
   */
  async createProfile(
    name: string,
    description: string,
    tuningSettings: TuningSettings,
    userId: string,
    organizationId?: string
  ): Promise<AIProfile> {
    // Validate tuning settings
    this.validateTuningSettings(tuningSettings);

    const profileData: Omit<AIProfile, 'id' | 'createdAt'> = {
      name,
      description,
      tuningSettings,
      modelConfiguration: {
        model: 'gemini-2.0-flash-exp',
        temperature: this.calculateTemperature(tuningSettings),
        maxTokens: this.calculateMaxTokens(tuningSettings),
      },
      userId,
      organizationId,
      isShared: false,
      usage: {
        timesUsed: 0,
        lastUsed: new Date(),
        averageRating: 0,
        feedback: [],
      },
    };

    const profile = await this.aiProfileRepository.create(profileData);

    auditLog('CREATE_AI_PROFILE', 'ai_profile', profile.id, userId, {
      profileName: name,
      tuningSettings: Object.keys(tuningSettings),
    });

    return profile;
  }

  /**
   * Get AI profile by ID with access control
   */
  async getProfile(profileId: string, userId: string): Promise<AIProfile | null> {
    const profile = await this.aiProfileRepository.findById(profileId);
    
    if (!profile) {
      return null;
    }

    // Check access permissions
    if (!this.hasProfileAccess(profile, userId)) {
      throw new Error('Access denied to this AI profile');
    }

    return profile;
  }

  /**
   * Get all profiles accessible to a user
   */
  async getUserProfiles(userId: string, organizationId?: string): Promise<AIProfile[]> {
    const userProfiles = await this.aiProfileRepository.findByUserId(userId);
    
    let organizationProfiles: AIProfile[] = [];
    if (organizationId) {
      organizationProfiles = await this.aiProfileRepository.findByOrganizationId(organizationId);
    }

    // Get built-in profiles
    const builtInProfiles = await this.aiProfileRepository.findBuiltInProfiles();

    // Combine and deduplicate
    const allProfiles = [...userProfiles, ...organizationProfiles, ...builtInProfiles];
    const uniqueProfiles = allProfiles.filter((profile, index, self) => 
      index === self.findIndex(p => p.id === profile.id)
    );

    return uniqueProfiles;
  }

  /**
   * Update an existing AI profile
   */
  async updateProfile(
    profileId: string,
    updates: Partial<AIProfile>,
    userId: string
  ): Promise<AIProfile | null> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) {
      return null;
    }

    // Check if user can modify this profile
    if (profile.userId !== userId && !profile.isShared) {
      throw new Error('Cannot modify profiles owned by other users');
    }

    // Validate tuning settings if being updated
    if (updates.tuningSettings) {
      this.validateTuningSettings(updates.tuningSettings);
      
      // Update model configuration based on new tuning settings
      updates.modelConfiguration = {
        ...profile.modelConfiguration,
        temperature: this.calculateTemperature(updates.tuningSettings),
        maxTokens: this.calculateMaxTokens(updates.tuningSettings),
      };
    }

    const updatedProfile = await this.aiProfileRepository.update(profileId, updates);

    if (updatedProfile) {
      auditLog('UPDATE_AI_PROFILE', 'ai_profile', profileId, userId, {
        updatedFields: Object.keys(updates),
      });
    }

    return updatedProfile;
  }

  /**
   * Delete an AI profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<boolean> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) {
      return false;
    }

    // Only allow deletion of user's own profiles or shared profiles they created
    if (profile.userId !== userId) {
      throw new Error('Cannot delete profiles owned by other users');
    }

    const deleted = await this.aiProfileRepository.delete(profileId);

    if (deleted) {
      auditLog('DELETE_AI_PROFILE', 'ai_profile', profileId, userId, {
        profileName: profile.name,
      });
    }

    return deleted;
  }

  /**
   * Share a profile with organization
   */
  async shareProfile(profileId: string, userId: string): Promise<AIProfile | null> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) {
      return null;
    }

    if (profile.userId !== userId) {
      throw new Error('Can only share your own profiles');
    }

    const updatedProfile = await this.aiProfileRepository.update(profileId, {
      isShared: true,
    });

    if (updatedProfile) {
      auditLog('SHARE_AI_PROFILE', 'ai_profile', profileId, userId, {
        profileName: profile.name,
      });
    }

    return updatedProfile;
  }

  /**
   * Export profile configuration
   */
  async exportProfile(profileId: string, userId: string): Promise<any> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      name: profile.name,
      description: profile.description,
      tuningSettings: profile.tuningSettings,
      modelConfiguration: profile.modelConfiguration,
      exportedAt: new Date(),
      exportedBy: userId,
      version: '2.0',
    };
  }

  /**
   * Import profile configuration
   */
  async importProfile(
    profileData: any,
    userId: string,
    organizationId?: string
  ): Promise<AIProfile> {
    // Validate import data
    if (!profileData.name || !profileData.tuningSettings) {
      throw new Error('Invalid profile data: missing required fields');
    }

    // Validate tuning settings
    this.validateTuningSettings(profileData.tuningSettings);

    // Create new profile with imported data
    const importedProfile = await this.createProfile(
      `${profileData.name} (Imported)`,
      profileData.description || 'Imported AI profile',
      profileData.tuningSettings,
      userId,
      organizationId
    );

    auditLog('IMPORT_AI_PROFILE', 'ai_profile', importedProfile.id, userId, {
      originalName: profileData.name,
      importedName: importedProfile.name,
    });

    return importedProfile;
  }

  /**
   * Record profile usage for analytics
   */
  async recordUsage(profileId: string, userId: string, rating?: number): Promise<void> {
    const profile = await this.aiProfileRepository.findById(profileId);
    if (!profile) {
      return;
    }

    const updatedUsage = {
      timesUsed: profile.usage.timesUsed + 1,
      lastUsed: new Date(),
      averageRating: rating 
        ? (profile.usage.averageRating * profile.usage.timesUsed + rating) / (profile.usage.timesUsed + 1)
        : profile.usage.averageRating,
      feedback: profile.usage.feedback,
    };

    await this.aiProfileRepository.update(profileId, { usage: updatedUsage });
  }

  /**
   * Get built-in profiles for common use cases
   */
  async getBuiltInProfiles(): Promise<AIProfile[]> {
    return this.aiProfileRepository.findBuiltInProfiles();
  }

  /**
   * Create built-in profiles (run during system initialization)
   */
  async createBuiltInProfiles(): Promise<void> {
    const builtInProfiles = [
      {
        name: 'Detailed Technical',
        description: 'High technical depth with comprehensive analysis',
        tuningSettings: {
          clarity: 0.9,
          technicality: 0.95,
          foresight: 0.8,
          riskAversion: 0.7,
          userCentricity: 0.6,
          conciseness: 0.3,
          technicalDepth: 0.95,
          standardsAdherence: 0.9,
        },
      },
      {
        name: 'Rapid Prototyping',
        description: 'Quick, concise outputs for fast iteration',
        tuningSettings: {
          clarity: 0.8,
          technicality: 0.6,
          foresight: 0.5,
          riskAversion: 0.4,
          userCentricity: 0.8,
          conciseness: 0.9,
          creativity: 0.8,
          modularity: 0.7,
        },
      },
      {
        name: 'Executive Summary',
        description: 'High-level, business-focused documentation',
        tuningSettings: {
          clarity: 0.95,
          technicality: 0.3,
          foresight: 0.8,
          riskAversion: 0.6,
          userCentricity: 0.9,
          conciseness: 0.8,
          costOptimization: 0.8,
        },
      },
      {
        name: 'Compliance Focused',
        description: 'Emphasis on regulatory compliance and standards',
        tuningSettings: {
          clarity: 0.9,
          technicality: 0.8,
          foresight: 0.9,
          riskAversion: 0.95,
          userCentricity: 0.7,
          conciseness: 0.5,
          standardsAdherence: 0.95,
          failureAnalysis: 0.9,
        },
      },
    ];

    for (const profileData of builtInProfiles) {
      const existingProfile = await this.aiProfileRepository.findByName(profileData.name);
      if (!existingProfile) {
        await this.aiProfileRepository.create({
          ...profileData,
          modelConfiguration: {
            model: 'gemini-2.0-flash-exp',
            temperature: this.calculateTemperature(profileData.tuningSettings),
            maxTokens: this.calculateMaxTokens(profileData.tuningSettings),
          },
          userId: 'system',
          isBuiltIn: true,
          isShared: true,
          usage: {
            timesUsed: 0,
            lastUsed: new Date(),
            averageRating: 0,
            feedback: [],
          },
        });
      }
    }
  }

  // Private helper methods

  private validateTuningSettings(tuningSettings: TuningSettings): void {
    // Validate that all numeric values are between 0 and 1
    for (const [key, value] of Object.entries(tuningSettings)) {
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        throw new Error(`Tuning setting '${key}' must be between 0 and 1`);
      }
    }
  }

  private calculateTemperature(tuningSettings: TuningSettings): number {
    // Map creativity setting to temperature (0.1 to 2.0)
    const creativity = tuningSettings.creativity || 0.5;
    return Math.max(0.1, Math.min(2.0, creativity * 2));
  }

  private calculateMaxTokens(tuningSettings: TuningSettings): number {
    // Map conciseness to max tokens
    const conciseness = tuningSettings.conciseness || 0.5;
    return conciseness > 0.7 ? 1000 : conciseness < 0.3 ? 4000 : 2000;
  }

  private hasProfileAccess(profile: AIProfile, userId: string): boolean {
    // User owns the profile
    if (profile.userId === userId) {
      return true;
    }

    // Profile is shared or built-in
    if (profile.isShared || profile.isBuiltIn) {
      return true;
    }

    return false;
  }
}