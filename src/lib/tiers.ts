// Tier definitions and feature flags for MIFECO VibraEngineer

export type Tier = 'free' | 'pro';

export const FREE: Tier = 'free';
export const PRO: Tier = 'pro';

export const UNLIMITED = -1;

export interface TierConfig {
  maxProjects: number;        // UNLIMITED for unlimited
  maxPhasesPerProject: number; // UNLIMITED for unlimited
  hasAutomation: boolean;
  hasAnalytics: boolean;
  hasExport: boolean;
  hasCollaboration: boolean;
}

const FREE_CONFIG: TierConfig = {
  maxProjects: 3,
  maxPhasesPerProject: 5,
  hasAutomation: false,
  hasAnalytics: false,
  hasExport: false,
  hasCollaboration: false,
};

const PRO_CONFIG: TierConfig = {
  maxProjects: UNLIMITED,
  maxPhasesPerProject: UNLIMITED,
  hasAutomation: true,
  hasAnalytics: true,
  hasExport: true,
  hasCollaboration: true,
};

const TIER_CONFIGS: Record<Tier, TierConfig> = {
  [FREE]: FREE_CONFIG,
  [PRO]: PRO_CONFIG,
};

export function getTierConfig(tier: Tier): TierConfig {
  return TIER_CONFIGS[tier] || FREE_CONFIG;
}

// --- Helper functions ---

export function isPro(tier: Tier): boolean {
  return tier === PRO;
}

export function canCreateProject(tier: Tier, currentCount: number): boolean {
  const config = getTierConfig(tier);
  if (config.maxProjects === UNLIMITED) return true;
  return currentCount < config.maxProjects;
}

export function canUseAutomation(tier: Tier): boolean {
  return getTierConfig(tier).hasAutomation;
}

export function canUseAnalytics(tier: Tier): boolean {
  return getTierConfig(tier).hasAnalytics;
}

export function canUseExport(tier: Tier): boolean {
  return getTierConfig(tier).hasExport;
}

export function canUseCollaboration(tier: Tier): boolean {
  return getTierConfig(tier).hasCollaboration;
}

export function canCreatePhase(tier: Tier, currentPhaseCount: number): boolean {
  const config = getTierConfig(tier);
  if (config.maxPhasesPerProject === UNLIMITED) return true;
  return currentPhaseCount < config.maxPhasesPerProject;
}

// --- Price constants ---

export const PRO_PRICE_MONTHLY = 19;
export const PRO_PRICE_ANNUAL = 190;
